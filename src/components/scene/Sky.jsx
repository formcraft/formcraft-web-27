import { useMemo } from "react";
import { useSky } from "../../hooks/useSky";
import { useTheme } from "../../hooks/useTheme";
import { W, SKY_H, starField } from "./sceneGeometry";
import "./Sky.css";

// The one sky shared by every page hero (Home has its own 3D sky). Drawn in the page, no images:
// a translucent gradient laid over the hero's paper (so the texture still shows) and, in the night
// edition, a modest star field: ~300 small stars as three paths plus a dozen slow twinklers.
// `horizon` is how far above the hero's bottom edge the hills meet the sky, in px at desktop width
// (scaled down with the paper scene on smaller screens).
export const Sky = ({ seed = 7, horizon = 180, className = "" }) => {
    const { theme } = useTheme();
    const night = theme === "night";
    const field = useMemo(() => (night ? starField({ seed: seed + 5 }) : null), [night, seed]);
    return (
        <div className={`sky ${className}`.trim()} style={{ "--sky-horizon": `${Math.round(horizon)}px` }} aria-hidden="true">
            {field && (
                <svg className="sky-stars" viewBox={`0 0 ${W} ${SKY_H}`} preserveAspectRatio="xMidYMin slice" focusable="false">
                    {field.paths.map((d, i) => d && <path key={i} className={`sky-star sky-star-${i}`} d={d} />)}
                    <g className="sky-twinkle">
                        {field.twinkle.map((s, i) => (
                            <circle key={i} cx={s.x} cy={s.y} r={s.r} style={{ "--tw": `${s.d}s`, "--td": `${s.o}s` }} />
                        ))}
                    </g>
                </svg>
            )}
        </div>
    );
};

// The sun (day edition) or moon (night edition) follows Kampala's clock across the sky:
// up on the left after rising, overhead at noon/midnight, down on the right before setting.
// Placed in screen space (not inside the cropped landscape drawing), so it's always in view.
export const SkyBody = ({ r, id }) => {
    const { theme } = useTheme();
    const sky = useSky();
    const night = theme === "night";
    // the body that belongs to this edition; if it's below the horizon, rest it low on the side
    const raw = night ? sky.moon : sky.sun;
    const t = Math.min(0.94, Math.max(0.06, raw));
    const below = raw < 0 || raw > 1;
    const lift = Math.sin(Math.PI * t); // 0 at the horizons, 1 overhead
    // --sky-t slides the box from left-anchored (rising) to right-anchored (setting), so it stays in view
    const style = { "--sky-x": `${6 + t * 88}%`, "--sky-t": t.toFixed(3), "--sky-y": `${(1 - lift) * 17 + 4}%`, "--sky-r": `${r}px` };
    const label = night ? "moon" : "sun";
    return (
        <div className={`sky-body ${below ? "is-low" : ""}`} style={style} data-body={label}>
            <svg className="sky-body-svg" viewBox="-100 -100 200 200" aria-hidden="true" focusable="false">
                <defs>
                    <mask id={id}>
                        <rect x="-100" y="-100" width="200" height="200" fill="white" />
                        <circle cx="26" cy="-14" r="40" fill="black" />
                    </mask>
                </defs>
                <g className="sky-body-rings">
                    {[3, 2, 1].map((k) => (
                        <circle key={k} className={`sky-body-ring sky-body-ring-${k}`} r={44 + 16 * k} />
                    ))}
                </g>
                {night ? (
                    <g mask={`url(#${id})`}>
                        <circle className="sky-body-disc" r="44" />
                        <circle className="sky-body-crater" cx="-16" cy="12" r="7" />
                        <circle className="sky-body-crater" cx="-4" cy="-20" r="4.5" />
                    </g>
                ) : (
                    <circle className="sky-body-disc" r="44" />
                )}
            </svg>
        </div>
    );
};
