// SkyPreview: a small page hero inside Admin → Sky and weather, where the team can try every weather scene, the wind
// and the sun-and-moon drag before saving. It uses the real engines (sky/skyPhysics.js for the drag, sky/weatherShapes.js
// for clouds, mist, rain and the storm glow, sky/moonPhase.js for tonight's moon), so what you feel here is what visitors
// get. It only previews: nothing here is saved, and it shows the chosen edition whatever the admin page itself shows
// (data-theme on the frame picks the day or night tokens).
import { useEffect, useMemo, useRef } from "react";
import { createSkyField } from "../scene/sky/skyPhysics";
import { SCENES, deckFor, puffsFor, stormCloud, mistBand, createStormGlow, createRain, seeded } from "../scene/sky/weatherShapes";
import { moonLitPath, moonPhase } from "../scene/sky/moonPhase";
import "./SkyPreview.css";

// paper hills in a 1440 × 360 drawing, anchored to the bottom like the page heroes' landscape
const ridge = (base, amp, seed, waves) => {
    const r = seeded(seed), ph = [r() * 6, r() * 6, r() * 6];
    return (x) => base - amp * (Math.sin(x / waves[0] + ph[0]) * 0.55 + Math.sin(x / waves[1] + ph[1]) * 0.3 + Math.sin(x / waves[2] + ph[2]) * 0.15);
};
const FAR = ridge(150, 34, 3, [180, 90, 40]), MID = ridge(200, 30, 5, [220, 110, 45]), NEAR = ridge(262, 26, 8, [260, 120, 50]), FRONT = ridge(318, 18, 13, [300, 140, 60]);
const hillPath = (fn) => { let d = `M0,360L0,${fn(0).toFixed(1)}`; for (let x = 0; x <= 1440; x += 24) d += `L${x},${fn(x).toFixed(1)}`; return `${d}L1440,360Z`; };
const TREES = (() => { const r = seeded(77); let d = ""; for (let i = 0; i < 14; i++) { const x = 760 + r() * 660, b = 268 + r() * 20, h = 26 + r() * 30, w = h * 0.34; d += `M${x - w},${b}Q${x},${b - h * 1.25} ${x + w},${b}Z`; } return d; })();
const STAR_COUNT = { desktop: 300, phone: 160, lite: 120 };

/**
 * The preview hero. Changes to `params`, `wind` and `rain` apply live; a new scene, edition or device redraws it.
 * @param {object} p
 * @param {"day"|"night"} p.edition
 * @param {string} p.scene  clear | partly | overcast | mist | rain | storm
 * @param {number} p.wind  0–2 (strength); `dir` gives the direction
 * @param {-1|1} [p.dir]  -1 = blowing right to left (an easterly wind), 1 = left to right
 * @param {number} p.rain  0.5 | 1 | 1.5 (storms are always 1.5)
 * @param {object} p.params  the drag engine's numbers (src/data/sky.js)
 * @param {"desktop"|"phone"|"lite"} [p.budget]  how many stars and drops, as each kind of device gets
 * @param {boolean} [p.reduced]  preview reduced motion: the drag works, nothing else moves
 */
export const SkyPreview = ({ edition, scene, wind, dir = -1, rain, params, budget = "desktop", reduced = false }) => {
    const frame = useRef(null), starsRef = useRef(null), rainRef = useRef(null), weatherRef = useRef(null), bodyRef = useRef(null);
    const live = useRef({ params, wind: wind * dir });
    const fieldRef = useRef(null), rainSimRef = useRef(null);
    const sc = SCENES[scene] ?? SCENES.clear;
    const moon = useMemo(() => moonLitPath(moonPhase(new Date())), []);

    // live changes without a redraw
    useEffect(() => {
        live.current.params = params;
        fieldRef.current?.setParams(params);
    }, [params]);
    useEffect(() => {
        live.current.wind = Math.min(2, Math.max(wind, sc.minWind)) * dir;
        rainSimRef.current?.setWind(live.current.wind);
    }, [wind, dir, sc.minWind]);

    useEffect(() => {
        const el = frame.current;
        if (!el) return undefined;
        const sctx = starsRef.current.getContext("2d"), rctx = rainRef.current.getContext("2d");
        let W = 0, H = 0, raf = 0, last = 0, field = null, rainSim = null, glow = null, puffs = [], discR = 30, drag = null, busy = false;
        const css = (name) => getComputedStyle(el).getPropertyValue(name).trim();

        const drawStars = () => {
            const dpr = Math.min(2, window.devicePixelRatio || 1);
            sctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            sctx.clearRect(0, 0, W, H);
            if (!field?.stars.length) return;
            sctx.fillStyle = css("--sky-star");
            for (const s of field.stars) {
                const fade = Math.min(1, Math.max(0, (H * 0.6 - s.y) / 120));
                if (!fade) continue;
                sctx.globalAlpha = s.alpha * fade;
                sctx.beginPath();
                sctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
                sctx.fill();
            }
            sctx.globalAlpha = 1;
        };
        const paint = () => {
            const b = field.body;
            bodyRef.current.style.transform = `translate(${b.x}px, ${b.y}px) translate(-50%, -50%)`;
            el.classList.toggle("is-held", b.held);
        };

        const build = () => {
            const box = el.getBoundingClientRect();
            W = box.width; H = box.height;
            const dpr = Math.min(2, window.devicePixelRatio || 1), rdpr = Math.min(1.5, window.devicePixelRatio || 1);
            starsRef.current.width = Math.round(W * dpr); starsRef.current.height = Math.round(H * dpr);
            rainRef.current.width = Math.round(W * rdpr); rainRef.current.height = Math.round(H * rdpr);
            // weather shapes
            const decks = deckFor(scene, W, H), st = sc.storm ? stormCloud(W, H) : null;
            puffs = puffsFor(scene, W, H).map((p) => ({ ...p, off: 0 }));
            const svg = weatherRef.current;
            svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
            svg.innerHTML =
                (st ? `<defs><clipPath id="skyp-storm"><path d="${st.d}"/></clipPath><radialGradient id="skyp-glow"><stop offset="0" stop-color="var(--storm-glow)"/><stop offset="1" stop-color="var(--storm-glow)" stop-opacity="0"/></radialGradient></defs>` : "") +
                decks.map((k) => `<path class="sky-preview-deck sky-preview-${k.tone}" d="${k.d}"/>`).join("") +
                (st ? st.sheets.map((x) => `<path class="sky-preview-sheet sky-preview-${x.tone}" d="${x.d}"/>`).join("") + `<circle class="sky-preview-glow" clip-path="url(#skyp-storm)" cx="${st.glow.cx}" cy="${st.glow.cy}" r="${st.glow.r}" fill="url(#skyp-glow)" opacity="0"/>` : "") +
                puffs.map((p, i) => `<g data-puff="${i}">${p.sheets.map((x) => `<path class="sky-preview-sheet sky-preview-${x.tone}" d="${x.d}"/>`).join("")}</g>`).join("");
            // the sun or moon at a calm spot on the right, as at mid-morning or late evening
            discR = W < 600 ? 22 : W < 900 ? 27 : 32;
            const home = { x: W * 0.74, y: H * 0.2 + discR };
            bodyRef.current.style.width = bodyRef.current.style.height = `${(200 * discR) / 44}px`;
            // stars (night): seeded like the page heroes' star field
            const stars = [];
            if (edition === "night" && sc.stars > 0) {
                const r = seeded(12);
                for (let i = 0; i < STAR_COUNT[budget]; i++) {
                    const x = r() * W, y = r() * H * 0.6, size = r() > 0.92 ? 1.4 : 0.5 + r() * 0.6, a = (0.3 + r() * 0.5) * sc.stars;
                    if (x < W * 0.55 && y > H * 0.06 && y < H * 0.42 && r() > 0.2) continue; // fewer behind the headline
                    stars.push({ x, y, r: size, a });
                }
            }
            field = createSkyField({ stars, clouds: puffs.map((p) => ({ x: p.cx, y: p.cy, w: p.w, h: p.w * 0.45 })), discR, home, bounds: { w: W, h: H }, params: live.current.params, reduced });
            fieldRef.current = field;
            for (let i = 0; i < 360 && field.step(1 / 60); i++); // start from the calm (stars beside the moon sit a little apart)
            paint();
            drawStars();
            // rain and the storm glow
            const amount = sc.rain ? (sc.storm ? 1.5 : rain) : 0;
            const front = (x) => H - (360 - FRONT(((x - W / 2) / Math.max(W / 1440, (H * 0.64) / 360)) + 720)) * Math.max(W / 1440, (H * 0.64) / 360);
            rainSim = amount ? createRain({ w: W, h: H, amount, wind: live.current.wind, budget, ridge: front }) : null;
            rainSimRef.current = rainSim;
            glow = sc.storm && !reduced ? createStormGlow(9) : null;
            rctx.setTransform(rdpr, 0, 0, rdpr, 0, 0);
            rctx.clearRect(0, 0, W, H);
            if (rainSim && reduced) rainSim.draw(rctx, { near: css("--rain"), far: css("--rain-far") }); // one still frame
            run();
        };

        const needs = () => busy || (!reduced && (rainSim || glow || (puffs.length && live.current.wind)));
        const loop = (t) => {
            const dt = last ? Math.min(0.05, (t - last) / 1000) : 1 / 60;
            last = t;
            busy = field.step(dt);
            paint();
            if (field.stars.length) drawStars();
            if (rainSim) {
                rainSim.step(dt);
                const rdpr = Math.min(1.5, window.devicePixelRatio || 1);
                rctx.setTransform(rdpr, 0, 0, rdpr, 0, 0);
                rctx.clearRect(0, 0, W, H);
                rainSim.draw(rctx, { near: css("--rain"), far: css("--rain-far") });
            }
            if (glow) weatherRef.current.querySelector(".sky-preview-glow")?.setAttribute("opacity", glow.step(dt).toFixed(3));
            const w = reduced ? 0 : live.current.wind;
            puffs.forEach((p, i) => {
                p.off += 4 * w * dt * (W / 1440 + 0.3); // drift with the wind, wrapping round
                const span = W + p.w, x = ((((p.cx + p.off + p.w / 2) % span) + span) % span) - p.w / 2 - p.cx;
                const push = field.clouds[i];
                if (push) push.x = p.cx + x; // the sun pushes the cloud where it has drifted to
                weatherRef.current.querySelector(`[data-puff="${i}"]`)?.setAttribute("transform", `translate(${(x + (push?.dx ?? 0)).toFixed(1)} ${(push?.dy ?? 0).toFixed(1)}) rotate(${(push?.tilt ?? 0).toFixed(2)} ${p.cx + x} ${p.cy})`);
            });
            raf = needs() && !document.hidden ? requestAnimationFrame(loop) : 0;
            if (!raf) last = 0;
        };
        const run = () => { if (!raf && needs()) raf = requestAnimationFrame(loop); };

        // drag: press on (or near) the sun or moon; the window follows the pointer
        const local = (e) => { const b = el.getBoundingClientRect(); return { x: e.clientX - b.left, y: e.clientY - b.top }; };
        const onDown = (e) => {
            if (!field || drag || (e.pointerType === "mouse" && e.button !== 0)) return;
            const p = local(e);
            if (Math.hypot(p.x - field.body.x, p.y - field.body.y) > discR * 1.6) return;
            drag = e.pointerId;
            e.preventDefault();
            field.grab(p.x, p.y, e.timeStamp);
            busy = true;
            run();
        };
        const onMove = (e) => { if (e.pointerId === drag) { const p = local(e); field.drag(p.x, p.y, e.timeStamp); } };
        const onUp = (e) => { if (e.pointerId === drag) { drag = null; field.release(e.timeStamp); busy = true; run(); } };
        el.addEventListener("pointerdown", onDown);
        window.addEventListener("pointermove", onMove);
        window.addEventListener("pointerup", onUp);
        window.addEventListener("pointercancel", onUp);
        const ro = new ResizeObserver(() => { if (!drag) build(); });
        ro.observe(el);
        document.addEventListener("visibilitychange", run);
        return () => {
            cancelAnimationFrame(raf);
            ro.disconnect();
            el.removeEventListener("pointerdown", onDown);
            window.removeEventListener("pointermove", onMove);
            window.removeEventListener("pointerup", onUp);
            window.removeEventListener("pointercancel", onUp);
            document.removeEventListener("visibilitychange", run);
            fieldRef.current = null;
            rainSimRef.current = null;
        };
    }, [edition, scene, rain, budget, reduced, sc]);

    return (
        <div
            ref={frame}
            className="sky-preview"
            data-theme={edition}
            style={{ "--sky-preview-wash": sc.wash ? `var(${sc.wash})` : "transparent", "--sky-preview-glowk": sc.glowK, "--sky-preview-body": edition === "day" ? sc.sun : sc.moon }}
            role="img"
            aria-label={`Preview: ${sc.label.toLowerCase()} ${edition === "day" ? "day" : "night"} sky. Drag the sun or moon to try it.`}
        >
            <div className="sky-preview-sky" />
            <div className="sky-preview-wash" />
            <canvas ref={starsRef} className="sky-preview-stars" />
            <div ref={bodyRef} className="sky-preview-body">
                <svg viewBox="-100 -100 200 200" aria-hidden="true">
                    {edition === "day" ? (
                        <>
                            <circle r="92" className="sky-preview-ring sky-preview-ring-3" />
                            <circle r="76" className="sky-preview-ring sky-preview-ring-2" />
                            <circle r="60" className="sky-preview-ring" />
                            <circle r="44" className="sky-preview-disc" />
                        </>
                    ) : (
                        <>
                            <defs>
                                <clipPath id="sky-preview-lit"><path d={moon.d} transform={`rotate(${moon.rotate})`} /></clipPath>
                            </defs>
                            <circle r="44" className="sky-preview-disc sky-preview-dark" />
                            <circle r="44" className="sky-preview-disc" clipPath="url(#sky-preview-lit)" />
                        </>
                    )}
                </svg>
            </div>
            <svg ref={weatherRef} className="sky-preview-weather" preserveAspectRatio="none" aria-hidden="true" />
            <svg className="sky-preview-hills" viewBox="0 0 1440 360" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
                {sc.mist ? (
                    <defs>
                        <linearGradient id="sky-preview-mist" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0" stopColor="var(--mist)" stopOpacity="0" />
                            <stop offset=".45" stopColor="var(--mist)" />
                            <stop offset="1" stopColor="var(--mist)" />
                        </linearGradient>
                    </defs>
                ) : null}
                <path className="sky-preview-far" d={hillPath(FAR)} />
                <path className="sky-preview-mid" d={hillPath(MID)} />
                {sc.mist && <path d={mistBand({ w: 1440, h: 360, horizon: 200 }).d} fill="url(#sky-preview-mist)" />}
                <path className="sky-preview-near" d={hillPath(NEAR)} />
                <path className="sky-preview-tree" d={TREES} />
                <path className="sky-preview-front" d={hillPath(FRONT)} />
                <g className="sky-preview-wet" style={{ opacity: sc.wet ? 1 : 0 }}>
                    <path d={hillPath(NEAR)} />
                    <path d={hillPath(FRONT)} />
                </g>
            </svg>
            <canvas ref={rainRef} className="sky-preview-rain" />
            <p className="sky-preview-copy" aria-hidden="true">
                <span>Designing spaces.</span>
                <span>Empowering communities.</span>
            </p>
        </div>
    );
};
