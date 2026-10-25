// SkyPreview: a small page hero inside Admin → Sky and weather, where the team can try every weather scene, the wind
// and the sun-and-moon drag before saving. It uses the real engines and the same paper pieces as the page heroes
// (sky/skyPhysics.js for the drag, sky/weatherShapes.js and PaperArt.jsx for the paper clouds, storm, bolts, mist and
// rain, sky/moonArt.js and sky/moonPhase.js for tonight's paper moon), so what you see and feel here is what visitors
// get. Like the heroes, every moving piece is its own small layer that's only moved or faded. It only previews:
// nothing here is saved, and it shows the chosen edition whatever the admin page itself shows (data-theme on the frame).
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { createSkyField } from "../scene/sky/skyPhysics";
import { SCENES, deckFor, puffsFor, stormCloud, mistBand, mistStrips, createStormGlow, createRain, seeded } from "../scene/sky/weatherShapes";
import { moonLitPath, moonPhase } from "../scene/sky/moonPhase";
import { moonArt } from "../scene/sky/moonArt";
import { PaperCloud, PaperGrain, PaperMoon } from "../scene/PaperArt";
import "../scene/Weather.css";
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
    const frame = useRef(null), starsRef = useRef(null), rainRef = useRef(null), bodyRef = useRef(null), glowRef = useRef(null);
    const puffRefs = useRef([]), boltRefs = useRef([]);
    const live = useRef({ params, wind: wind * dir });
    const fieldRef = useRef(null), rainSimRef = useRef(null);
    const sc = SCENES[scene] ?? SCENES.clear;
    const moon = useMemo(() => moonLitPath(moonPhase(new Date())), []);
    const art = useMemo(() => moonArt(), []);
    const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
    // the frame's size; the paper shapes follow it (and the scene)
    const [size, setSize] = useState(null);
    useEffect(() => {
        const el = frame.current;
        if (!el) return undefined;
        const measure = () => {
            const b = el.getBoundingClientRect();
            // the sample headline, so the weather is placed around it as it is around a real hero's words
            const copy = el.querySelector(".sky-preview-copy"), rg = document.createRange();
            rg.selectNodeContents(copy);
            const c = rg.getBoundingClientRect();
            const avoid = c.width ? [{ x0: c.left - b.left, y0: c.top - b.top, x1: c.right - b.left, y1: c.bottom - b.top }] : [];
            setSize((s) => (s && s.W === Math.round(b.width) && s.H === Math.round(b.height) ? s : { W: Math.round(b.width), H: Math.round(b.height), avoid }));
        };
        measure();
        const ro = new ResizeObserver(measure);
        ro.observe(el);
        return () => ro.disconnect();
    }, []);
    const geo = useMemo(() => {
        if (!size) return null;
        const { W, H, avoid } = size, horizon = H * 0.63;
        return {
            decks: deckFor(scene, W, H, 7, avoid),
            puffs: puffsFor(scene, W, H, 7, avoid),
            storm: sc.storm ? stormCloud(W, H, 7, avoid) : null,
            mist: sc.mist ? mistBand({ w: W, h: H, horizon }) : null,
            strips: sc.mist ? mistStrips({ w: W, h: H, horizon, avoid }) : null,
        };
    }, [size, scene, sc]);

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
        if (!size || !geo) return undefined;
        const { W, H } = size;
        let raf = 0, last = 0, field = null, rainSim = null, glow = null, discR = 30, drag = null, busy = false, shown = -1;
        const puffs = geo.puffs.map((p) => ({ ...p, off: 0 }));
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
            const dpr = Math.min(2, window.devicePixelRatio || 1), rdpr = Math.min(1.5, window.devicePixelRatio || 1);
            starsRef.current.width = Math.round(W * dpr); starsRef.current.height = Math.round(H * dpr);
            rainRef.current.width = Math.round(W * rdpr); rainRef.current.height = Math.round(H * rdpr);
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
            rainSim = amount ? createRain({ w: W, h: H, amount, wind: live.current.wind, budget, ridge: front, clear: size.avoid ?? [] }) : null;
            rainSimRef.current = rainSim;
            glow = sc.storm && !reduced ? createStormGlow(9, geo.storm?.bolts.length ?? 0) : null;
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
            if (glow) {
                const g = glow.step(dt), bolts = boltRefs.current;
                if (glowRef.current) glowRef.current.style.opacity = g.toFixed(3);
                if (shown >= 0 && shown !== glow.bolt && bolts[shown]) { bolts[shown].style.opacity = "0"; shown = -1; }
                if (glow.bolt >= 0 && bolts[glow.bolt]) { shown = glow.bolt; bolts[shown].style.opacity = glow.boltK.toFixed(3); }
            }
            const w = reduced ? 0 : live.current.wind;
            puffs.forEach((p, i) => {
                p.off += 4 * w * dt * (W / 1440 + 0.3); // drift with the wind, wrapping round
                const span = W + p.w, x = ((((p.cx + p.off + p.w / 2) % span) + span) % span) - p.w / 2 - p.cx;
                const push = field.clouds[i];
                if (push) push.x = p.cx + x; // the sun pushes the cloud where it has drifted to
                // each cloud is its own small layer: moving it never repaints the paper
                const node = puffRefs.current[i];
                if (node) node.style.transform = `translate(${(x + (push?.dx ?? 0)).toFixed(1)}px, ${(push?.dy ?? 0).toFixed(1)}px) rotate(${(push?.tilt ?? 0).toFixed(2)}deg)`;
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
        build();
        document.addEventListener("visibilitychange", run);
        return () => {
            cancelAnimationFrame(raf);
            el.removeEventListener("pointerdown", onDown);
            window.removeEventListener("pointermove", onMove);
            window.removeEventListener("pointerup", onUp);
            window.removeEventListener("pointercancel", onUp);
            document.removeEventListener("visibilitychange", run);
            fieldRef.current = null;
            rainSimRef.current = null;
        };
    }, [edition, scene, rain, budget, reduced, sc, size, geo]);

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
                            <defs><PaperGrain id={`${uid}sg`} size={70} /></defs>
                            <circle r="92" className="sky-preview-ring sky-preview-ring-3" />
                            <circle r="76" className="sky-preview-ring sky-preview-ring-2" />
                            <circle r="60" className="sky-preview-ring" />
                            <circle r="44" className="sky-preview-disc" />
                            <circle className="sky-preview-sunlit" cx="-3" cy="-4" r="38" />
                            <circle className="pa-grain" r="44" fill={`url(#${uid}sg)`} />
                        </>
                    ) : (
                        <>
                            <defs>
                                <clipPath id={`${uid}lit`}><path d={moon.d} transform={`rotate(${moon.rotate})`} /></clipPath>
                            </defs>
                            <g className="sky-preview-dark"><PaperMoon id={`${uid}e`} art={art} /></g>
                            <g clipPath={`url(#${uid}lit)`}><PaperMoon id={`${uid}m`} art={art} /></g>
                        </>
                    )}
                </svg>
            </div>
            {geo && size && (
                <div className="sky-preview-weather" aria-hidden="true">
                    {geo.storm?.bolts.map((b, i) => (
                        <svg key={i} ref={(n) => (boltRefs.current[i] = n)} className="wx-bolt" viewBox={`${b.box.x} ${b.box.y} ${b.box.w} ${b.box.h}`} width={b.box.w} height={b.box.h} style={{ left: b.box.x, top: b.box.y }}>
                            <path d={b.d} />
                        </svg>
                    ))}
                    <svg className="wx-svg" viewBox={`0 0 ${size.W} ${size.H}`} width={size.W} height={size.H}>
                        <defs>
                            <PaperGrain id={`${uid}g`} />
                            <linearGradient id={`${uid}mg`} x1="0" y1="1" x2="0" y2="0">
                                <stop offset="0" style={{ stopColor: "var(--mist)" }} />
                                <stop offset="1" style={{ stopColor: "var(--mist)", stopOpacity: 0 }} />
                            </linearGradient>
                        </defs>
                        {geo.mist && <path className="wx-mist" d={geo.mist.d} fill={`url(#${uid}mg)`} />}
                        {geo.decks.map((d, i) => <g key={i} className="wx-deck"><PaperCloud c={d} tone={d.tone} grain={`${uid}g`} /></g>)}
                        {geo.storm?.rows.map((row, k) => <g key={k} className="wx-storm-row">{row.clouds.map((c, i) => <PaperCloud key={i} c={c} tone={row.tone} grain={`${uid}g`} />)}</g>)}
                    </svg>
                    {geo.storm?.glow && (() => {
                        const g = geo.storm.glow;
                        return (
                            <svg ref={glowRef} className="wx-glow" viewBox={`${g.cx - g.r} ${g.cy - g.r} ${2 * g.r} ${2 * g.r}`} width={2 * g.r} height={2 * g.r} style={{ left: g.cx - g.r, top: g.cy - g.r }}>
                                <defs>
                                    <radialGradient id={`${uid}gl`}>
                                        <stop offset="0" style={{ stopColor: "var(--storm-glow)" }} />
                                        <stop offset="1" style={{ stopColor: "var(--storm-glow)", stopOpacity: 0 }} />
                                    </radialGradient>
                                    <clipPath id={`${uid}gc`}><path d={geo.storm.d} /></clipPath>
                                </defs>
                                <circle cx={g.cx} cy={g.cy} r={g.r} fill={`url(#${uid}gl)`} clipPath={`url(#${uid}gc)`} />
                            </svg>
                        );
                    })()}
                    {geo.puffs.map((p, i) => (
                        <svg key={i} ref={(n) => (puffRefs.current[i] = n)} className="wx-puff" viewBox={`${p.box.x} ${p.box.y} ${p.box.w} ${p.box.h}`} width={p.box.w} height={p.box.h} style={{ left: p.box.x, top: p.box.y }}>
                            <defs><PaperGrain id={`${uid}p${i}`} /></defs>
                            <PaperCloud c={p} grain={`${uid}p${i}`} />
                        </svg>
                    ))}
                </div>
            )}
            <svg className="sky-preview-hills" viewBox="0 0 1440 360" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
                <path className="sky-preview-far" d={hillPath(FAR)} />
                <path className="sky-preview-mid" d={hillPath(MID)} />
                <path className="sky-preview-near" d={hillPath(NEAR)} />
                <path className="sky-preview-tree" d={TREES} />
                <path className="sky-preview-front" d={hillPath(FRONT)} />
                <g className="sky-preview-wet" style={{ opacity: sc.wet ? 1 : 0 }}>
                    <path d={hillPath(NEAR)} />
                    <path d={hillPath(FRONT)} />
                </g>
            </svg>
            {geo?.strips && (
                <div className="wx-mist-front sky-preview-mist" aria-hidden="true">
                    {geo.strips.map((s, i) => (
                        <svg key={i} className={`wx-mist-strip wx-mist-${s.depth}`} viewBox={`0 0 ${s.period * 2} ${size.H}`} width={s.period * 2} height={size.H} style={{ "--period": s.period, "--speed": s.speed * Math.max(0.4, wind) }}>
                            <defs><PaperGrain id={`${uid}ms${i}`} /></defs>
                            <path className="wx-mist-sheet" d={s.d} />
                            <path className="pa-grain" d={s.d} fill={`url(#${uid}ms${i})`} />
                            <path className="wx-mist-edge" d={s.edge} />
                        </svg>
                    ))}
                </div>
            )}
            <canvas ref={rainRef} className="sky-preview-rain" />
            <p className="sky-preview-copy" aria-hidden="true">
                <span>Designing spaces.</span>
                <span>Empowering communities.</span>
            </p>
        </div>
    );
};
