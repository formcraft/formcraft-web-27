// useSkyDrag: lets a visitor drag the sun (day) or the moon (night) around a page hero's sky, with the stars
// parting around the moon like water and the paper clouds drifting aside from the sun (ideas #22; the owner's
// secret, so nothing on the site mentions it). The motion itself is the cloud session's engine
// (sky/skyPhysics.js, numbers from the owner's tuner); this hook connects it to the page:
// - finds the hero's pieces: the star canvas and twinklers (Sky), the body and its rings (SkyBody), the clouds
//   (PaperLayers .pl-cloud) and the grab handle;
// - starts a drag from a press anywhere on the hero within 1.6 × the disc's radius, and follows the pointer on
//   the window (the lesson from the tuner: a drag must not depend on what's under the finger);
// - runs requestAnimationFrame only while something moves, then stops (zero frames when the sky is still);
// - draws the stars on the canvas at every size, and redraws them on resize and on a change of edition.
// Reduced motion: the body can still be dragged; stars and clouds stay still.
import { useEffect } from "react";
import { createSkyField } from "./sky/skyPhysics";
import { W, SKY_H } from "./sceneGeometry";

const TIER_ALPHA = [0.34, 0.56, 0.85]; // the three star brightnesses (as the SVG stars had them)
const GRAB = 1.6; // a press within 1.6 × the disc radius of its centre picks it up

/**
 * @param {object} o
 * @param {import("react").RefObject<HTMLElement>} o.skyRef  the hero's .sky element (its parent is the hero)
 * @param {import("react").RefObject<HTMLCanvasElement>} o.canvasRef  the star canvas (night only, else null)
 * @param {import("react").RefObject<HTMLElement>} o.grabRef  the invisible grab handle over the body
 * @param {{ stars: object[], twinkle: object[] } | null} o.field  starField() output (night), or null (day)
 * @param {boolean} o.drag  "Move the sun and moon" is on (Admin → Features)
 * @param {boolean} o.fluid  "Stars and clouds make way" is on
 * @param {string} o.edition  "day" | "night" (redraws when it changes)
 */
export const useSkyDrag = ({ skyRef, canvasRef, grabRef, field, drag, fluid, edition }) => {
    useEffect(() => {
        const sky = skyRef.current;
        const hero = sky?.parentElement;
        if (!sky || !hero) return undefined;
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext("2d");
        const twinkles = [...sky.querySelectorAll(".sky-twinkle circle")];
        const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
        let engine = null, raf = 0, last = 0, home = null, discR = 0, dragging = false, pointerId = null;
        let scale = 1, ox = 0, starColor = "#F1F1F1", heroBox = null;

        const bodyEl = () => hero.querySelector(".sky-body-move");
        const ringsEl = () => hero.querySelector(".sky-body-shift");
        const clouds = () => [...hero.querySelectorAll(".pl-cloud")].filter((c) => c.getBoundingClientRect().width > 0);
        // a cloud layer's px → its SVG units ("xMidYMax slice": the larger of the two scales)
        const svgScale = (svg) => {
            const vb = svg.viewBox?.baseVal, r = svg.getBoundingClientRect();
            return vb?.width ? Math.max(r.width / vb.width, r.height / vb.height) : 1;
        };

        // where the body rests (its Kampala-clock place), measured with any drag offset taken out
        const measureBody = () => {
            const el = bodyEl();
            if (!el) return null;
            heroBox = hero.getBoundingClientRect();
            const prev = el.style.transform;
            el.style.transform = "";
            const r = el.getBoundingClientRect();
            el.style.transform = prev;
            discR = (r.width * 44) / 200; // the disc is r = 44 in a 200-unit box
            return { x: r.left + r.width / 2 - heroBox.left, y: r.top + r.height / 2 - heroBox.top, size: r.width };
        };

        // stars: viewBox units → hero px, the way the old SVG's "xMidYMin slice" placed them
        const starsPx = () => {
            if (!field) return [];
            const w = hero.clientWidth, h = hero.clientHeight;
            scale = Math.max(w / W, h / SKY_H);
            ox = (w - W * scale) / 2;
            const all = field.stars.map((s) => ({ x: s.x * scale + ox, y: s.y * scale, r: s.r * scale, a: TIER_ALPHA[s.b] ?? 0.5 }));
            const tw = field.twinkle.map((s) => ({ x: s.x * scale + ox, y: s.y * scale, r: s.r * scale, a: 0.7, tw: true }));
            return all.concat(tw);
        };

        const draw = (stars) => {
            if (!ctx) return;
            const dpr = Math.min(2, window.devicePixelRatio || 1);
            const w = hero.clientWidth, h = hero.clientHeight;
            if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
                canvas.width = Math.round(w * dpr);
                canvas.height = Math.round(h * dpr);
            }
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            ctx.clearRect(0, 0, w, h);
            ctx.fillStyle = starColor;
            let ti = 0;
            for (const s of stars) {
                if (s.tw) {
                    // the twinklers stay SVG circles (their CSS twinkle); moved along with the others
                    const c = twinkles[ti++];
                    if (c) c.setAttribute("transform", `translate(${((s.x - s.hx) / scale).toFixed(2)} ${((s.y - s.hy) / scale).toFixed(2)})`);
                    continue;
                }
                ctx.globalAlpha = Math.min(1, s.alpha ?? s.a);
                ctx.beginPath();
                ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.globalAlpha = 1;
        };

        // build (or rebuild) everything for the hero's current size
        const setup = () => {
            starColor = getComputedStyle(sky).getPropertyValue("--sky-star").trim() || starColor;
            // the hero first: on a pre-rendered page the sun or moon appears only after hydration, so measureBody()
            // can return before measuring it, and the clouds below are measured against it (found 2026-10-25)
            heroBox = hero.getBoundingClientRect();
            const b = measureBody();
            const stars = starsPx();
            // each cloud layer is a full-width drawing: measure the cloud shape itself
            const cl = fluid && !field ? clouds().map((c) => { const r = (c.querySelector("path") ?? c).getBoundingClientRect(); return { x: r.left + r.width / 2 - heroBox.left, y: r.top + r.height / 2 - heroBox.top, w: r.width, h: r.height }; }) : [];
            home = b;
            engine = b ? createSkyField({ stars: fluid ? stars : [], clouds: cl, discR, home: b, bounds: { w: hero.clientWidth, h: hero.clientHeight }, reduced }) : null;
            // start from the calm the field returns to (stars just around the resting moon sit a little apart),
            // so nothing jumps at the first touch: up to 6 s of motion, worked out at once, before the first draw
            if (engine && fluid) for (let i = 0; i < 360 && engine.step(1 / 60); i++);
            draw(engine && fluid ? engine.stars : stars.map((s) => ({ ...s, hx: s.x, hy: s.y })));
            placeGrab();
        };

        const placeGrab = () => {
            const g = grabRef.current;
            if (!g || !home) return;
            const size = Math.max(44, discR * 2);
            g.style.width = g.style.height = `${size}px`;
            g.style.left = `${home.x - size / 2}px`;
            g.style.top = `${home.y - size / 2}px`;
        };

        // apply the engine's positions to the page
        const apply = () => {
            const b = engine.body, el = bodyEl(), rings = ringsEl();
            const dx = b.x - home.x, dy = b.y - home.y;
            if (el) el.style.transform = dx || dy ? `translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px)` : "";
            if (rings && engine.rings[0]) {
                const k = 200 / home.size; // px → the body's SVG units
                const r = engine.rings[0];
                rings.setAttribute("transform", `translate(${((r.x - b.x) * k).toFixed(2)} ${((r.y - b.y) * k).toFixed(2)})`);
            }
            const g = grabRef.current;
            if (g) g.style.transform = dx || dy ? `translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px)` : "";
            // the clouds move through their own <g> (the layer's scroll parallax animates the layer's transform)
            if (fluid && !field) clouds().forEach((c, i) => {
                const m = engine.clouds[i], g = c.querySelector(".pl-cloud-push");
                if (!m || !g) return;
                if (!m.dx && !m.dy) return g.removeAttribute("transform");
                const k = svgScale(c), box = g.getBBox();
                g.setAttribute("transform", `translate(${(m.dx / k).toFixed(2)} ${(m.dy / k).toFixed(2)}) rotate(${m.tilt.toFixed(2)} ${(box.x + box.width / 2).toFixed(1)} ${(box.y + box.height / 2).toFixed(1)})`);
            });
            if (fluid && field) draw(engine.stars);
        };

        const loop = (t) => {
            const dt = last ? (t - last) / 1000 : 1 / 60;
            last = t;
            const busy = engine.step(dt);
            apply();
            if (busy) raf = requestAnimationFrame(loop);
            else {
                raf = 0;
                last = 0;
                hero.classList.remove("is-sky-moving");
            }
        };
        const run = () => {
            hero.classList.add("is-sky-moving");
            if (!raf) raf = requestAnimationFrame(loop);
        };

        const local = (e) => ({ x: e.clientX - heroBox.left, y: e.clientY - heroBox.top });
        // while the sky is still, measure the resting place again (the clock and the entrance animation move it)
        const remeasure = () => {
            if (dragging || raf) return;
            const b = measureBody();
            if (!b) return;
            home = b;
            engine.setHome(b.x, b.y);
            placeGrab();
        };
        const near = (e) => {
            if (!engine || !home) return false;
            heroBox = hero.getBoundingClientRect();
            const p = local(e);
            return Math.hypot(p.x - engine.body.x, p.y - engine.body.y) <= GRAB * discR;
        };
        // a press on something the visitor means to use (a link, a button, a field) is never a grab
        const interactive = (e) => e.target?.closest?.("a, button, input, select, textarea, label, summary, [role='button']");
        const onDown = (e) => {
            if (!drag || dragging || e.button > 0 || !engine || interactive(e)) return;
            remeasure();
            if (!near(e)) return;
            e.preventDefault();
            dragging = true;
            pointerId = e.pointerId;
            try {
                e.target.setPointerCapture?.(e.pointerId);
            } catch {
                // some browsers refuse capture on SVG or text; the window listeners still follow the pointer
            }
            hero.classList.add("is-sky-dragging");
            const p = local(e);
            engine.grab(p.x, p.y, e.timeStamp);
            run();
        };
        const onMove = (e) => {
            if (dragging) {
                if (e.pointerId !== pointerId) return;
                const p = local(e);
                engine.drag(p.x, p.y, e.timeStamp);
                run();
            } else if (drag && e.pointerType === "mouse") {
                // the soft glow (never any words or a hand cursor): only while the pointer is over the hero
                if (hero.hasAttribute("data-paused")) return;
                const r = hero.getBoundingClientRect();
                const inside = e.clientY >= r.top && e.clientY <= r.bottom && e.clientX >= r.left && e.clientX <= r.right;
                const on = inside && !interactive(e) && near(e);
                if (on !== hero.classList.contains("is-sky-hover")) hero.classList.toggle("is-sky-hover", on);
            }
        };
        const onUp = (e) => {
            if (!dragging || e.pointerId !== pointerId) return;
            dragging = false;
            hero.classList.remove("is-sky-dragging");
            engine.release(e.timeStamp);
            run();
        };
        const noNativeDrag = (e) => dragging && e.preventDefault();

        setup();
        // the sun or moon rises into place on load: measure again once that has finished
        const onRisen = (e) => {
            if (e.target.classList?.contains("sky-body") && !dragging && !raf) setup();
        };
        hero.addEventListener("animationend", onRisen);
        let size = { w: hero.clientWidth, h: hero.clientHeight };
        const ro = new ResizeObserver(() => {
            if (dragging || raf) return; // re-measure once things settle
            const w = hero.clientWidth, h = hero.clientHeight;
            const small = w === size.w && Math.abs(h - size.h) < 160; // a phone's address bar, not a new layout
            size = { w, h };
            if (small && engine) {
                engine.setBounds(w, h);
                remeasure();
            } else setup();
        });
        ro.observe(hero);
        hero.addEventListener("pointerdown", onDown);
        hero.addEventListener("dragstart", noNativeDrag);
        window.addEventListener("pointermove", onMove);
        window.addEventListener("pointerup", onUp);
        window.addEventListener("pointercancel", onUp);
        return () => {
            cancelAnimationFrame(raf);
            ro.disconnect();
            hero.removeEventListener("pointerdown", onDown);
            hero.removeEventListener("dragstart", noNativeDrag);
            hero.removeEventListener("animationend", onRisen);
            window.removeEventListener("pointermove", onMove);
            window.removeEventListener("pointerup", onUp);
            window.removeEventListener("pointercancel", onUp);
            hero.classList.remove("is-sky-dragging", "is-sky-moving", "is-sky-hover");
            const el = bodyEl();
            if (el) el.style.transform = "";
            hero.querySelectorAll(".pl-cloud-push").forEach((g) => g.removeAttribute("transform"));
        };
    }, [skyRef, canvasRef, grabRef, field, drag, fluid, edition]);
};
