import { useMemo } from "react";

// A torn paper edge along the top of a section sheet, cut from the section's own paper:
// the strip carries the same texture (--edge-tex, lined up with the section below it) and is
// clipped to a seeded tear drawn 1:1 in pixels, so the coarse grain runs straight over the tear.
// A pale fibre line along the tear shows the paper's core, as real torn paper does.
const rand = (seed) => () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
};

const WIDTH = 3840;
const H = 32;

const tearPoints = (seed) => {
    const r = rand(seed + 11);
    let x = 0;
    let y = H * 0.35;
    const pts = [[0, y]];
    while (x < WIDTH) {
        x += 3 + r() * 9;
        y = Math.max(2, Math.min(H * 0.62, y + (r() - 0.5) * 8));
        pts.push([Math.min(x, WIDTH), y]);
    }
    return pts;
};

const f = (n) => n.toFixed(1);

/**
 * The torn paper edge along the top of a section, cut from the same paper as the section, with loose fibres.
 * @param {{ seed?: number, className?: string }} props  seed: picks the tear's shape
 */
export const TornEdge = ({ seed = 1, className = "" }) => {
    const { clip, fibre, hairs } = useMemo(() => {
        const pts = tearPoints(seed);
        const line = pts.map(([x, y]) => `${f(x)},${f(y)}`).join(" L");
        const r = rand(seed + 5);
        // short loose fibres sticking out of the tear
        let h = "";
        pts.forEach(([x, y], i) => {
            if (i % 3 === 0 && r() < 0.5) {
                const a = -Math.PI / 2 + (r() - 0.5) * 2.2;
                const len = 2 + r() * 5;
                h += `M${f(x)},${f(y + 0.5)} q${f(Math.cos(a) * len * 0.5 + (r() - 0.5) * 2)},${f(Math.sin(a) * len * 0.5)} ${f(Math.cos(a) * len)},${f(Math.sin(a) * len)} `;
            }
        });
        return { clip: `path("M0,${H} L${line} L${WIDTH},${H} Z")`, fibre: `M${line}`, hairs: h };
    }, [seed]);
    return (
        <div className={`torn-edge ${className}`} aria-hidden="true">
            <div className="torn-edge-paper" style={{ clipPath: clip }} />
            <svg className="torn-edge-fibre" width={WIDTH} height={H} viewBox={`0 0 ${WIDTH} ${H}`} focusable="false">
                <path d={fibre} className="torn-edge-core" />
                <path d={hairs} className="torn-edge-hairs" />
            </svg>
        </div>
    );
};
