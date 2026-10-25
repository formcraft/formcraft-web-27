import { useEffect, useMemo, useRef } from "react";
import { useSky } from "../../hooks/useSky";
import { useTheme } from "../../hooks/useTheme";
import { useFeature, useSite } from "../../hooks/useSite";
import { W, SKY_H, starField } from "./sceneGeometry";
import { moonLitPath, moonPhase } from "./sky/moonPhase";
import { useSkyDrag } from "./useSkyDrag";
import { useIsHydrating } from "../../hooks/useHydration";
import { useWeather } from "../../hooks/useWeather";
import { MistFront, RainLayer, WeatherBack, WeatherWash } from "./Weather";
import { PaperGrain, PaperMoon } from "./PaperArt";
import { moonArt } from "./sky/moonArt";
import { useHeroSize, useWeatherMotion } from "./useWeatherMotion";
import "./Sky.css";

// The one sky shared by every page hero (Home has its own 3D sky). Drawn in the page, no images:
// a translucent gradient laid over the hero's paper (so the texture still shows) and, in the night
// edition, a modest star field: ~300 small stars on a canvas (so they can move) plus a dozen slow SVG
// twinklers. The sun or moon can be dragged (Admin → Features "Move the sun and moon"; see useSkyDrag.js),
// and the stars part around the moon; nothing on the site tells visitors (the owner's secret).
// `horizon` is how far above the hero's bottom edge the hills meet the sky, in px at desktop width
// (scaled down with the paper scene on smaller screens).
// Weather (Sky 3): the scene from useWeather() is drawn by Weather.jsx (wash under the stars; clouds, decks, the storm
// and mist over them; rain in front of the hills), and its effect on what's here (fewer stars, a dimmer sun or moon,
// which of the hero's own clouds stay, wet hills) is passed to the hero as data attributes and CSS variables.
/**
 * @param {{ seed?: number, horizon?: number, className?: string }} props  seed: picks the stars
 */
export const Sky = ({ seed = 7, horizon = 180, className = "" }) => {
    const { theme } = useTheme();
    const night = theme === "night";
    // the stars are drawn in both editions and Sky.css hides them by day, so pre-rendered pages match
    const field = useMemo(() => starField({ seed: seed + 5 }), [seed]);
    const drag = useFeature("skyBodies");
    const fluid = useFeature("skyFluid");
    const skyRef = useRef(null);
    const canvasRef = useRef(null);
    const grabRef = useRef(null);
    const params = useSite()?.sky?.params; // Admin → Sky and weather
    useSkyDrag({ skyRef, canvasRef, grabRef, field: night ? field : null, drag, fluid, edition: theme, params });

    const weather = useWeather();
    const size = useHeroSize(skyRef);
    const glowRef = useRef(null);
    const rainRef = useRef(null);
    useWeatherMotion({ skyRef, canvasRef: rainRef, glowRef, weather, size });
    // the scene's effect on the hero's own pieces (after hydration; the build shows the clear sky)
    useEffect(() => {
        const hero = skyRef.current?.parentElement;
        if (!hero) return undefined;
        const sc = weather.scene;
        hero.dataset.weather = weather.kind;
        hero.dataset.puffs = String(night ? 2 : Math.min(2, sc.puffs ?? 2));
        hero.toggleAttribute("data-wet", Boolean(sc.wet));
        hero.style.setProperty("--sky-stars-k", String(sc.stars ?? 1));
        hero.style.setProperty("--sky-body-k", String((night ? sc.moon : sc.sun) ?? 1));
        return () => {
            delete hero.dataset.weather;
            delete hero.dataset.puffs;
            hero.removeAttribute("data-wet");
            hero.style.removeProperty("--sky-stars-k");
            hero.style.removeProperty("--sky-body-k");
        };
    }, [weather.kind, weather.scene, night]);
    return (
        <>
            <div ref={skyRef} className={`sky ${className}`.trim()} style={{ "--sky-horizon": `${Math.round(horizon)}px` }} aria-hidden="true">
                <WeatherWash weather={weather} />
                <canvas ref={canvasRef} className="sky-stars" />
                <svg className="sky-stars sky-twinkles" viewBox={`0 0 ${W} ${SKY_H}`} preserveAspectRatio="xMidYMin slice" focusable="false">
                        <g className="sky-twinkle">
                            {field.twinkle.map((s, i) => (
                                <circle key={i} cx={s.x} cy={s.y} r={s.r} style={{ "--tw": `${s.d}s`, "--td": `${s.o}s` }} />
                            ))}
                        </g>
                </svg>
                <WeatherBack weather={weather} size={size} night={night} horizon={horizon} glowRef={glowRef} />
            </div>
            <MistFront weather={weather} size={size} horizon={horizon} />
            <RainLayer weather={weather} canvasRef={rainRef} />
            {/* invisible: lets a finger on the sun or moon move it instead of scrolling (above the hero text) */}
            {drag && <span ref={grabRef} className="sky-grab" aria-hidden="true" />}
        </>
    );
};

// The sun (day edition) or moon (night edition) follows Kampala's clock across the sky:
// up on the left after rising, overhead at noon/midnight, down on the right before setting.
// Placed in screen space (not inside the cropped landscape drawing), so it's always in view.
// The moon shows its real phase (sky/moonPhase.js): the lit part over a faint copy, the lit edge turned toward the sun
// as it is on the equator. It's a paper-cut moon (sky/moonArt.js, PaperArt.jsx): layered sheets with the seas cut out.
// The sun is a paper disc with a lifted lit sheet and the paper grain. .sky-body-move and .sky-body-shift are moved by useSkyDrag.
/**
 * @param {{ r: number, id: string }} props  r: disc radius in px; id: a unique id for the clip path
 */
export const SkyBody = ({ r, id }) => {
    const hydrating = useIsHydrating();
    const { theme } = useTheme();
    const sky = useSky();
    const night = theme === "night";
    // the phase changes slowly: once per visit is enough
    const lit = useMemo(() => moonLitPath(moonPhase(new Date())), []);
    const art = useMemo(() => moonArt(), []);
    // the body that belongs to this edition; if it's below the horizon, rest it low on the side
    const raw = night ? sky.moon : sky.sun;
    const t = Math.min(0.94, Math.max(0.06, raw));
    const below = raw < 0 || raw > 1;
    const lift = Math.sin(Math.PI * t); // 0 at the horizons, 1 overhead
    // --sky-t slides the box from left-anchored (rising) to right-anchored (setting), so it stays in view
    const style = { "--sky-x": `${6 + t * 88}%`, "--sky-t": t.toFixed(3), "--sky-y": `${(1 - lift) * 17 + 4}%`, "--sky-r": `${r}px` };
    const label = night ? "moon" : "sun";
    // its place depends on the clock and the edition (the visitor's, not the build's): it appears, rising as
    // always, once the page has been adopted (useHydration.js)
    if (hydrating) return null;
    return (
        <div className={`sky-body ${below ? "is-low" : ""}`} style={style} data-body={label}>
            <div className="sky-body-move">
                <svg className="sky-body-svg" viewBox="-100 -100 200 200" aria-hidden="true" focusable="false">
                    {night && (
                        <defs>
                            <clipPath id={id}>
                                <path d={lit.d} transform={`rotate(${lit.rotate})`} />
                            </clipPath>
                        </defs>
                    )}
                    <g className="sky-body-shift">
                        <g className="sky-body-rings">
                            {[3, 2, 1].map((k) => (
                                <circle key={k} className={`sky-body-ring sky-body-ring-${k}`} r={44 + 16 * k} />
                            ))}
                        </g>
                    </g>
                    {night ? (
                        <>
                            {/* the unlit part: the same paper moon, faint (earthshine); the lit part on top */}
                            <g className="sky-body-dark">
                                <PaperMoon id={`${id}e`} art={art} />
                            </g>
                            <g clipPath={`url(#${id})`}>
                                <PaperMoon id={`${id}m`} art={art} />
                            </g>
                        </>
                    ) : (
                        <>
                            <defs><PaperGrain id={`${id}g`} size={70} /></defs>
                            <circle className="sky-body-disc" r="44" />
                            <circle className="sky-body-lit" cx="-3" cy="-4" r="38" />
                            <circle className="pa-grain" r="44" fill={`url(#${id}g)`} />
                        </>
                    )}
                </svg>
            </div>
        </div>
    );
};
