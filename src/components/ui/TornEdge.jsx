import { useMemo } from "react";

// A torn paper edge along the top of a section sheet. The path is seeded, so each section
// gets its own tear that stays the same on every render. Fill comes from --edge-ground.
const rand = (seed) => () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
};

const tornPath = (seed, width = 1440, height = 32) => {
    const r = rand(seed + 11);
    let x = 0;
    let y = height * 0.35;
    let d = `M0,${height} L0,${y.toFixed(1)}`;
    while (x < width) {
        x += 4 + r() * 10;
        y = Math.max(1, Math.min(height * 0.62, y + (r() - 0.5) * 9));
        d += ` L${Math.min(x, width).toFixed(1)},${y.toFixed(1)}`;
    }
    return `${d} L${width},${height} Z`;
};

export const TornEdge = ({ seed = 1, className = "" }) => {
    const d = useMemo(() => tornPath(seed), [seed]);
    return (
        <svg className={`torn-edge ${className}`} viewBox="0 0 1440 32" preserveAspectRatio="none" aria-hidden="true" focusable="false">
            <path d={d} />
        </svg>
    );
};
