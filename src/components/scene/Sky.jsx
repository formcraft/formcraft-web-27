import { useMemo, useRef } from "react";
import { useSky } from "../../hooks/useSky";
import { useTheme } from "../../hooks/useTheme";
import { useFeature, useSite } from "../../hooks/useSite";
import { W, SKY_H, starField } from "./sceneGeometry";
import { moonLitPath, moonPhase } from "./sky/moonPhase";
import { useSkyDrag } from "./useSkyDrag";
import { useIsHydrating } from "../../hooks/useHydration";
import "./Sky.css";

// The one sky shared by every page hero (Home has its own 3D sky). Drawn in the page, no images:
// a translucent gradient laid over the hero's paper (so the texture still shows) and, in the night
// edition, a modest star field: ~300 small stars on a canvas (so they can move) plus a dozen slow SVG
// twinklers. The sun or moon can be dragged (Admin → Features "Move the sun and moon"; see useSkyDrag.js),
// and the stars part around the moon; nothing on the site tells visitors (the owner's secret).
// `horizon` is how far above the hero's bottom edge the hills meet the sky, in px at desktop width
// (scaled down with the paper scene on smaller screens).
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
    return (
        <>
            <div ref={skyRef} className={`sky ${className}`.trim()} style={{ "--sky-horizon": `${Math.round(horizon)}px` }} aria-hidden="true">
                <canvas ref={canvasRef} className="sky-stars" />
                <svg className="sky-stars sky-twinkles" viewBox={`0 0 ${W} ${SKY_H}`} preserveAspectRatio="xMidYMin slice" focusable="false">
                        <g className="sky-twinkle">
                            {field.twinkle.map((s, i) => (
                                <circle key={i} cx={s.x} cy={s.y} r={s.r} style={{ "--tw": `${s.d}s`, "--td": `${s.o}s` }} />
                            ))}
                        </g>
                </svg>
            </div>
            {/* invisible: lets a finger on the sun or moon move it instead of scrolling (above the hero text) */}
            {drag && <span ref={grabRef} className="sky-grab" aria-hidden="true" />}
        </>
    );
};

// The sun (day edition) or moon (night edition) follows Kampala's clock across the sky:
// up on the left after rising, overhead at noon/midnight, down on the right before setting.
// Placed in screen space (not inside the cropped landscape drawing), so it's always in view.
// The moon shows its real phase (sky/moonPhase.js): the lit part over a faint full disc, the lit edge turned
// toward the sun as it is on the equator. .sky-body-move and .sky-body-shift are moved by useSkyDrag.
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
                            <circle className="sky-body-disc sky-body-dark" r="44" />
                            <g clipPath={`url(#${id})`}>
                                <circle className="sky-body-disc" r="44" />
                                <circle className="sky-body-crater" cx="-16" cy="12" r="7" />
                                <circle className="sky-body-crater" cx="-4" cy="-20" r="4.5" />
                            </g>
                        </>
                    ) : (
                        <circle className="sky-body-disc" r="44" />
                    )}
                </svg>
            </div>
        </div>
    );
};
