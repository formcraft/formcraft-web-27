// The weather scenes in the page heroes (Sky 3, ideas #23): the cloud session's paper shapes (sky/weatherShapes.js)
// drawn as layered cut paper with the site's paper grain (PaperArt.jsx). Inside the sky (behind the hills): the
// scene's wash over the gradient, the mist laid over the far hills, the cloud ceilings, the storm's two rows of heavy
// clouds with their soft inner glow and paper bolts, and the fair-weather clouds drifting with the wind. In front of
// the hills (behind the hero text): strips of tracing-paper mist, and rain on a canvas, splashing on the front hill.
// Smoothness: everything that moves is its own small layer that's only moved or faded (each drifting cloud and mist
// strip is its own <svg>; the glow and each bolt are their own <svg>, faded by useWeatherMotion), so the paper, its
// shadows and grain are painted once and never again while they move.
// The hero's words are measured (useHeroSize) and the shapes are placed around them: clouds, storm rows, bolts and mist
// never sit on the text, on any page or screen size.
// Pre-rendered pages: nothing here is in the built HTML (the size and the scene are the visitor's); the layers fade in
// after hydration. Reduced motion: one still frame of rain, no glow, no bolts, no drift.
import { useId, useMemo } from "react";
import { deckFor, mistBand, mistStrips, puffsFor, stormCloud } from "./sky/weatherShapes";
import { useIsHydrating } from "../../hooks/useHydration";
import { PaperCloud, PaperGrain } from "./PaperArt";
import "./Weather.css";

// how far above the hero's bottom the hills meet the sky, as Sky.css scales --sky-horizon
const horizonY = (h, w, horizon) => h - horizon * (w <= 600 ? 0.5 : w <= 900 ? 0.66 : 1);
const r1 = (n) => Math.round(n * 10) / 10;

/**
 * Behind the hills: mist, cloud ceilings, the storm (rows, glow, bolts) and the drifting fair-weather clouds.
 * @param {{ weather: ReturnType<typeof import("../../hooks/useWeather").useWeather>, size: {w:number,h:number}|null,
 *   night: boolean, horizon: number, glowRef: import("react").RefObject<SVGElement> }} props
 */
export const WeatherBack = ({ weather, size, night, horizon, glowRef }) => {
    const hydrating = useIsHydrating();
    const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
    const { kind, scene, strength } = weather;
    const w = size?.w ?? 0, h = size?.h ?? 0, avoid = size?.avoid;
    const shapes = useMemo(() => {
        if (!w || !h) return null;
        const words = avoid ?? [];
        // by day the hero's own two paper clouds stand for the first two (PaperLayers); at night a clear sky has none
        const puffs = puffsFor(kind, w, h, 7, words).slice(night ? (kind === "clear" ? 99 : 0) : 2);
        return {
            decks: deckFor(kind, w, h, 7, words),
            puffs,
            storm: scene.storm ? stormCloud(w, h, 7, words) : null,
            mist: scene.mist ? mistBand({ w, h, horizon: horizonY(h, w, horizon) }) : null,
        };
    }, [kind, scene, w, h, night, horizon, avoid]);
    if (hydrating || !shapes) return null;
    const drifting = strength > 0.05;
    const grain = `${uid}p`;
    return (
        <div className="wx" data-kind={kind}>
            {/* the bolts hang behind the storm clouds, so they come out from under them */}
            {shapes.storm?.bolts.map((b, i) => (
                <svg key={i} className="wx-bolt" data-bolt={i} viewBox={`${r1(b.box.x)} ${r1(b.box.y)} ${r1(b.box.w)} ${r1(b.box.h)}`} width={r1(b.box.w)} height={r1(b.box.h)} style={{ left: r1(b.box.x), top: r1(b.box.y) }} focusable="false">
                    <path d={b.d} />
                </svg>
            ))}
            <svg className="wx-svg" viewBox={`0 0 ${w} ${h}`} width={w} height={h} focusable="false">
                <defs>
                    <PaperGrain id={grain} />
                    <linearGradient id={`${uid}m`} x1="0" y1="1" x2="0" y2="0">
                        <stop offset="0" style={{ stopColor: "var(--mist)" }} />
                        <stop offset="1" style={{ stopColor: "var(--mist)", stopOpacity: 0 }} />
                    </linearGradient>
                </defs>
                {shapes.mist && <path className="wx-mist" d={shapes.mist.d} fill={`url(#${uid}m)`} />}
                {shapes.decks.map((d, i) => (
                    <g key={i} className="wx-deck">
                        <PaperCloud c={d} tone={d.tone} grain={grain} />
                    </g>
                ))}
                {shapes.storm?.rows.map((row, k) => (
                    <g key={k} className="wx-storm-row">
                        {row.clouds.map((c, i) => <PaperCloud key={i} c={c} tone={row.tone} grain={grain} />)}
                    </g>
                ))}
            </svg>
            {shapes.storm?.glow && (
                <svg
                    ref={glowRef}
                    className="wx-glow"
                    viewBox={`${r1(shapes.storm.glow.cx - shapes.storm.glow.r)} ${r1(shapes.storm.glow.cy - shapes.storm.glow.r)} ${r1(2 * shapes.storm.glow.r)} ${r1(2 * shapes.storm.glow.r)}`}
                    width={r1(2 * shapes.storm.glow.r)}
                    height={r1(2 * shapes.storm.glow.r)}
                    style={{ left: r1(shapes.storm.glow.cx - shapes.storm.glow.r), top: r1(shapes.storm.glow.cy - shapes.storm.glow.r) }}
                    focusable="false"
                >
                    <defs>
                        <radialGradient id={`${uid}g`}>
                            <stop offset="0" style={{ stopColor: "var(--storm-glow)" }} />
                            <stop offset="1" style={{ stopColor: "var(--storm-glow)", stopOpacity: 0 }} />
                        </radialGradient>
                        <clipPath id={`${uid}c`}>
                            <path d={shapes.storm.d} />
                        </clipPath>
                    </defs>
                    <circle cx={shapes.storm.glow.cx} cy={shapes.storm.glow.cy} r={shapes.storm.glow.r} fill={`url(#${uid}g)`} clipPath={`url(#${uid}c)`} />
                </svg>
            )}
            {shapes.puffs.map((p, i) => {
                const half = p.w * 0.6, b = p.box;
                return (
                    <svg
                        key={i}
                        className={drifting ? "wx-puff is-drifting" : "wx-puff"}
                        viewBox={`${r1(b.x)} ${r1(b.y)} ${r1(b.w)} ${r1(b.h)}`}
                        width={r1(b.w)}
                        height={r1(b.h)}
                        style={{ left: r1(b.x), top: r1(b.y), "--from": Math.round(w - p.cx + half), "--to": Math.round(-(p.cx + half)), "--wind": strength }}
                        focusable="false"
                    >
                        <defs><PaperGrain id={`${grain}${i}`} /></defs>
                        <PaperCloud c={p} grain={`${grain}${i}`} />
                    </svg>
                );
            })}
        </div>
    );
};

/**
 * In front of the hills: strips of tracing-paper mist sliding slowly across (only in the mist scene).
 * @param {{ weather: object, size: {w:number,h:number}|null, horizon: number }} props
 */
export const MistFront = ({ weather, size, horizon }) => {
    const hydrating = useIsHydrating();
    const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
    const w = size?.w ?? 0, h = size?.h ?? 0, avoid = size?.avoid;
    const strips = useMemo(() => (w && h && weather.scene.mist ? mistStrips({ w, h, horizon: horizonY(h, w, horizon), avoid: avoid ?? [] }) : null), [w, h, horizon, weather.scene.mist, avoid]);
    if (hydrating || !strips) return null;
    return (
        <div className="wx-mist-front" aria-hidden="true">
            {strips.map((s, i) => (
                <svg
                    key={i}
                    className={`wx-mist-strip wx-mist-${s.depth}`}
                    viewBox={`0 0 ${s.period * 2} ${h}`}
                    width={s.period * 2}
                    height={h}
                    style={{ "--period": s.period, "--speed": s.speed * Math.max(0.4, weather.strength || 0) }}
                    focusable="false"
                >
                    <defs><PaperGrain id={`${uid}${i}`} /></defs>
                    <path className="wx-mist-sheet" d={s.d} />
                    <path className="pa-grain" d={s.d} fill={`url(#${uid}${i})`} />
                    <path className="wx-mist-edge" d={s.edge} />
                </svg>
            ))}
        </div>
    );
};

/**
 * The scene's wash over the sky gradient (under the stars).
 * @param {{ weather: object }} props
 */
export const WeatherWash = ({ weather }) => {
    const hydrating = useIsHydrating();
    if (hydrating || !weather.scene.wash) return null;
    return <div className="wx wx-wash" style={{ background: `var(${weather.scene.wash})` }} />;
};

/**
 * In front of the hills: the rain canvas (only when the scene has rain).
 * @param {{ weather: object, canvasRef: import("react").RefObject<HTMLCanvasElement> }} props
 */
export const RainLayer = ({ weather, canvasRef }) => {
    const hydrating = useIsHydrating();
    if (hydrating || !weather.rain) return null;
    return <canvas ref={canvasRef} className="wx-rain" aria-hidden="true" />;
};
