// The moving parts of the weather in a page hero (Sky 3): the hero's size (for the shapes), and one
// requestAnimationFrame loop for the storm's soft inner glow and the rain, running only while the hero is on screen
// and the tab is visible. Reduced motion: one still frame of rain, no glow. Drawn by Weather.jsx; used by Sky.jsx.
import { useEffect, useState } from "react";
import { createRain, createStormGlow } from "./sky/weatherShapes";

/**
 * The hero's size in CSS px, kept up to date (an address bar showing or hiding on a phone isn't a new size).
 * @param {import("react").RefObject<HTMLElement>} ref  an element inside the hero
 * @returns {{ w: number, h: number } | null}
 */
export const useHeroSize = (ref) => {
    const [size, setSize] = useState(null);
    useEffect(() => {
        const hero = ref.current?.parentElement;
        if (!hero) return undefined;
        const measure = () =>
            setSize((s) => {
                const w = Math.round(hero.clientWidth), h = Math.round(hero.clientHeight);
                if (s && s.w === w && Math.abs(s.h - h) < (w <= 980 ? 160 : 4)) return s;
                return { w, h };
            });
        measure();
        const ro = new ResizeObserver(measure);
        ro.observe(hero);
        return () => ro.disconnect();
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
        const rain = amount && ctx ? createRain({ w: size.w, h: size.h, amount, wind, budget }) : null;
        const glow = scene.storm && !reduced ? createStormGlow() : null;
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
            if (glow && glowRef.current) glowRef.current.style.opacity = glow.step(dt).toFixed(3);
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
