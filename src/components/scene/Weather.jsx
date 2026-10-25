// The weather scenes in the page heroes (Sky 3, ideas #23): the cloud session's shapes (sky/weatherShapes.js) drawn in
// the order its contract gives. Inside the sky (behind the hills): the scene's wash over the gradient, the storm cloud
// with its soft inner glow, the torn-paper cloud decks, layered paper clouds drifting with the wind, and the mist band.
// In front of the hills (behind the hero text): rain on a canvas, splashing on the front hill. Colours come from the
// weather tokens in tokens.css (day and night). The scene itself is chosen by useWeather().
// Pre-rendered pages: nothing here is in the built HTML (the size and the scene are the visitor's); the layers fade in
// after hydration. The storm glow and the rain run only while the hero is on screen; reduced motion: one still frame
// of rain, no glow, no drift.
import { useId, useMemo } from "react";
import { deckFor, mistBand, puffsFor, stormCloud } from "./sky/weatherShapes";
import { useIsHydrating } from "../../hooks/useHydration";
import "./Weather.css";

const TONE = { back: "--cloud-deck-back", front: "--cloud-deck-front", "storm-back": "--cloud-storm-back", "storm-front": "--cloud-storm-front" };

// how far above the hero's bottom the hills meet the sky, as Sky.css scales --sky-horizon
const horizonY = (h, w, horizon) => h - horizon * (w <= 600 ? 0.5 : w <= 900 ? 0.66 : 1);

/**
 * Behind the hills: wash, storm cloud and glow, cloud decks, paper clouds, mist.
 * @param {{ weather: ReturnType<typeof import("../../hooks/useWeather").useWeather>, size: {w:number,h:number}|null,
 *   night: boolean, horizon: number, glowRef: import("react").RefObject<SVGElement> }} props
 */
export const WeatherBack = ({ weather, size, night, horizon, glowRef }) => {
    const hydrating = useIsHydrating();
    const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
    const { kind, scene, strength } = weather;
    const w = size?.w ?? 0, h = size?.h ?? 0;
    const shapes = useMemo(() => {
        if (!w || !h) return null;
        // by day the hero's own two paper clouds stand for the first two (PaperLayers); at night a clear sky has none
        const puffs = puffsFor(kind, w, h).slice(night ? (kind === "clear" ? 99 : 0) : 2);
        return {
            decks: deckFor(kind, w, h),
            puffs,
            storm: scene.storm ? stormCloud(w, h) : null,
            mist: scene.mist ? mistBand({ w, h, horizon: horizonY(h, w, horizon) }) : null,
        };
    }, [kind, scene, w, h, night, horizon]);
    if (hydrating || !shapes) return null;
    const drifting = strength > 0.05;
    return (
        <div className="wx" data-kind={kind}>
            <svg className="wx-svg" viewBox={`0 0 ${w} ${h}`} width={w} height={h} focusable="false">
                <defs>
                    <radialGradient id={`${uid}g`}>
                        <stop offset="0" style={{ stopColor: "var(--storm-glow)" }} />
                        <stop offset="1" style={{ stopColor: "var(--storm-glow)", stopOpacity: 0 }} />
                    </radialGradient>
                    <linearGradient id={`${uid}m`} x1="0" y1="1" x2="0" y2="0">
                        <stop offset="0" style={{ stopColor: "var(--mist)" }} />
                        <stop offset="1" style={{ stopColor: "var(--mist)", stopOpacity: 0 }} />
                    </linearGradient>
                    {shapes.storm && (
                        <clipPath id={`${uid}c`}>
                            <path d={shapes.storm.d} />
                        </clipPath>
                    )}
                </defs>
                {shapes.storm && (
                    <g className="wx-storm">
                        {shapes.storm.sheets.map((s, i) => <path key={i} className="wx-sheet" d={s.d} style={{ fill: `var(${TONE[s.tone]})` }} />)}
                        <circle ref={glowRef} className="wx-glow" cx={shapes.storm.glow.cx} cy={shapes.storm.glow.cy} r={shapes.storm.glow.r} fill={`url(#${uid}g)`} clipPath={`url(#${uid}c)`} />
                    </g>
                )}
                {shapes.decks.map((d, i) => <path key={i} className="wx-deck" d={d.d} style={{ fill: `var(${TONE[d.tone]})` }} />)}
                {shapes.puffs.map((p, i) => {
                    const half = p.w * 0.6;
                    return (
                        <g key={i} className={drifting ? "wx-puff is-drifting" : "wx-puff"} style={{ "--from": Math.round(w - p.cx + half), "--to": Math.round(-(p.cx + half)), "--wind": strength }}>
                            {p.sheets.map((s, k) => <path key={k} className={`wx-sheet wx-cloud-${s.tone}`} d={s.d} />)}
                        </g>
                    );
                })}
                {shapes.mist && <path className="wx-mist" d={shapes.mist.d} fill={`url(#${uid}m)`} />}
            </svg>
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
