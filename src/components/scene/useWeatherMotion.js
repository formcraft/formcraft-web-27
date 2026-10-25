// The moving parts of the weather in a page hero (Sky 3): the hero's size (for the shapes), and one
// requestAnimationFrame loop for the storm's soft inner glow, its paper bolts and the rain, running only while the hero
// is on screen and the tab is visible. Only opacities change and the rain canvas is redrawn, so nothing else repaints.
// Reduced motion: one still frame of rain, no glow, no bolts. Drawn by Weather.jsx; used by Sky.jsx.
import { useEffect, useState } from "react";
import { createRain, createStormGlow } from "./sky/weatherShapes";

// The hero's words (crumbs, brand, title, lead, buttons, the sheet number) as boxes in the hero's px, a little
// inflated: the cloud session's shapes are placed around them, so the weather never sits on the text.
const measureWords = (hero) => {
    const hb = hero.getBoundingClientRect(), out = [];
    const add = (r, deco) => { if (r && r.width > 0 && r.height > 0) out.push({ x0: r.left - hb.left, y0: r.top - hb.top, x1: r.right - hb.left, y1: r.bottom - hb.top, ...(deco ? { deco: true } : {}) }); };
    hero.querySelectorAll(".page-hero-copy > *").forEach((el) => {
        // decorative words (the sheet number, aria-hidden) are kept clear of clouds and bolts, but a ceiling may pass behind
        const deco = el.getAttribute("aria-hidden") === "true";
        if (el.classList.contains("row")) [...el.children].forEach((c) => add(c.getBoundingClientRect(), deco));
        else { const rg = document.createRange(); rg.selectNodeContents(el); add(rg.getBoundingClientRect(), deco); }
    });
    // one box for the main block of words (it keeps the space between the lines clear too), plus the small extras
    const main = out.filter((b) => b.x1 - b.x0 > 120 && !b.deco);
    if (!main.length) return out;
    const block = { x0: Math.min(...main.map((b) => b.x0)), y0: Math.min(...main.map((b) => b.y0)), x1: Math.max(...main.map((b) => b.x1)), y1: Math.max(...main.map((b) => b.y1)) };
    return [block, ...out.filter((b) => b.x1 - b.x0 <= 120 || b.deco)];
};

/**
 * The hero's size in CSS px and where its words are, kept up to date (an address bar showing or hiding on a phone
 * isn't a new size; the words are measured again once the fonts have loaded).
 * @param {import("react").RefObject<HTMLElement>} ref  an element inside the hero
 * @returns {{ w: number, h: number, avoid: { x0: number, y0: number, x1: number, y1: number, deco?: boolean }[] } | null}
 */
export const useHeroSize = (ref) => {
    const [size, setSize] = useState(null);
    useEffect(() => {
        const hero = ref.current?.parentElement;
        if (!hero) return undefined;
        const measure = (force) =>
            setSize((s) => {
                const w = Math.round(hero.clientWidth), h = Math.round(hero.clientHeight);
                if (!force && s && s.w === w && Math.abs(s.h - h) < (w <= 980 ? 160 : 4)) return s;
                return { w, h: s && s.w === w && w <= 980 && Math.abs(s.h - h) < 160 ? s.h : h, avoid: measureWords(hero) };
            });
        measure(true);
        const ro = new ResizeObserver(() => measure(false));
        ro.observe(hero);
        let alive = true;
        document.fonts?.ready.then(() => alive && measure(true));
        return () => { alive = false; ro.disconnect(); };
    }, [ref]);
    return size;
};

/**
 * Runs the storm glow and the rain while the hero is on screen (one requestAnimationFrame loop per hero).
 * @param {{ skyRef: object, canvasRef: object, glowRef: object, weather: object, size: {w:number,h:number}|null }} o
 */
export const useWeatherMotion = ({ skyRef, canvasRef, glowRef, weather, size }) => {
    const { kind, rain: amount, wind, budget: forced, scene } = weather;
    useEffect(() => {
        const hero = skyRef.current?.parentElement;
        if (!hero || !size || (!amount && !scene.storm)) return undefined;
        const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
        const lite = navigator.connection?.saveData || (navigator.hardwareConcurrency ?? 8) <= 2;
        const budget = forced ?? (lite ? "lite" : size.w < 600 ? "phone" : "desktop");
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext("2d");
        const dpr = Math.min(budget === "desktop" ? 2 : 1.5, window.devicePixelRatio || 1);
        if (canvas) {
            canvas.width = Math.round(size.w * dpr);
            canvas.height = Math.round(size.h * dpr);
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        }
        const css = getComputedStyle(hero);
        const colours = { near: css.getPropertyValue("--rain").trim(), far: css.getPropertyValue("--rain-far").trim() };
        const rain = amount && ctx ? createRain({ w: size.w, h: size.h, amount, wind, budget, clear: size.avoid ?? [] }) : null;
        // the storm's paper bolts (Weather.jsx): one at a time, faded in and out with a glow pulse
        const bolts = scene.storm ? [...hero.querySelectorAll(".wx-bolt")] : [];
        const glow = scene.storm && !reduced ? createStormGlow(9, bolts.length) : null;
        let shown = -1;
        if (reduced) {
            // one still frame: the rain without movement, no glow
            if (rain) {
                for (let i = 0; i < 40; i++) rain.step(1 / 30);
                ctx.clearRect(0, 0, size.w, size.h);
                rain.draw(ctx, colours);
            }
            return undefined;
        }
        let raf = 0, last = 0, visible = true;
        const frame = (t) => {
            const dt = last ? Math.min(0.1, (t - last) / 1000) : 1 / 60;
            last = t;
            if (rain) {
                rain.step(dt);
                ctx.clearRect(0, 0, size.w, size.h);
                rain.draw(ctx, colours);
            }
            if (glow) {
                const g = glow.step(dt);
                if (glowRef.current) glowRef.current.style.opacity = g.toFixed(3);
                if (shown >= 0 && shown !== glow.bolt) { bolts[shown].style.opacity = "0"; shown = -1; }
                if (glow.bolt >= 0 && bolts[glow.bolt]) { shown = glow.bolt; bolts[shown].style.opacity = glow.boltK.toFixed(3); }
            }
            raf = requestAnimationFrame(frame);
        };
        const start = () => {
            if (!raf && visible && !document.hidden) {
                last = 0;
                raf = requestAnimationFrame(frame);
            }
        };
        const stop = () => {
            cancelAnimationFrame(raf);
            raf = 0;
        };
        const io = new IntersectionObserver(([e]) => {
            visible = e.isIntersecting;
            if (visible) start();
            else stop();
        });
        io.observe(hero);
        const onVis = () => (document.hidden ? stop() : start());
        document.addEventListener("visibilitychange", onVis);
        start();
        return () => {
            stop();
            io.disconnect();
            document.removeEventListener("visibilitychange", onVis);
        };
    }, [skyRef, canvasRef, glowRef, kind, amount, wind, forced, scene, size]);
};
