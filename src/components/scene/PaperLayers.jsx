import { useId, useMemo } from "react";
import { W, random, ridgePath, rectPath, roofPath, framePath, cranePath, cloudCircles, cloudPath, landscape, motifShapes } from "./sceneGeometry";
import "./PaperLayers.css";

// The paper-cut landscape as stacked SVG sheets: each layer casts a soft shadow on the one
// behind it, lays itself down on load, and drifts at its own speed as the page scrolls.
// Colours come from the --sc-* tokens, so the same markup is the day or the night edition.

const Quill = ({ id, d, seed, h, n, className }) => {
    const r = random(seed);
    const groups = Array.from({ length: n }, () => {
        const cx = r() * W;
        const cy = h * (0.35 + r() * 0.7);
        const max = 40 + r() * 90;
        const rings = [];
        for (let k = 6; k < max; k += 6) rings.push(k);
        return { cx, cy, rings };
    });
    return (
        <>
            <clipPath id={id}>
                <path d={d} />
            </clipPath>
            <g clipPath={`url(#${id})`} className={`pl-quill ${className}`}>
                {groups.map((g, i) => g.rings.map((k) => <circle key={`${i}-${k}`} cx={g.cx} cy={g.cy} r={k} />))}
            </g>
        </>
    );
};

export const PaperLayers = ({ seed = 7, height = 560, city = true, motif = "city", tall = 1, sun = { x: 1110, y: 120, r: 64 }, accent = false, className = "" }) => {
    const uid = useId().replace(/:/g, "");
    const L = useMemo(() => landscape({ seed, h: height, city: city && motif === "city", tall }), [seed, height, city, motif, tall]);
    // a page motif (construction site, workshop, precast yard, design) replaces the skyline
    const M = useMemo(() => (city ? motifShapes(motif, height * 0.86, tall, seed + 8) : null), [city, motif, height, tall, seed]);
    const h = L.h;
    const vb = `0 0 ${W} ${h}`;
    const paths = useMemo(() => {
        const band = ridgePath(L.band, h);
        const far = ridgePath(L.far, h);
        const mid = ridgePath(L.mid, h);
        const near = ridgePath(L.near, h);
        const front = ridgePath(L.front, h);
        const c1 = cloudPath(cloudCircles(sun.x - 120, sun.y + 18, 1.1, seed + 2));
        const c2 = cloudPath(cloudCircles(280, h * 0.2, 0.8, seed + 3));
        let cityD = "";
        let glowD = "";
        let craneD = "";
        if (L.city) {
            const c = L.city;
            cityD = [...c.blocks.map(rectPath), ...c.roofs.map(roofPath)].join(" ");
            cityD += " " + c.windows.map(rectPath).join(" ");
            if (c.frame) cityD += " " + framePath(c.frame);
            glowD = c.blocks.map((b) => rectPath({ x: b.x + 2, y: b.y + 4, w: b.w - 4, h: b.h - 4 })).join(" ");
            if (c.crane) craneD = cranePath(c.crane);
        }
        return { band, far, mid, near, front, c1, c2, cityD, glowD, craneD };
    }, [L, h, seed, sun.x, sun.y]);

    const stars = useMemo(() => {
        const r = random(seed + 5);
        return Array.from({ length: 46 }, () => ({ x: r() * W, y: r() * h * 0.45, r: 0.8 + r() * 1.4, d: 2 + r() * 4, o: r() * 3 }));
    }, [seed, h]);

    const layer = (name, depth, children) => (
        <svg className={`pl-layer pl-${name}`} style={{ "--depth": depth }} viewBox={vb} preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false">
            {children}
        </svg>
    );

    return (
        <div className={`paper-layers ${accent ? "pl-accent" : ""} ${className}`.trim()} style={{ "--pl-h": `${h}px` }} aria-hidden="true">
            {layer("band", 0.05, <>
                <path className="pl-f-band" d={paths.band} />
                <Quill id={`${uid}q0`} d={paths.band} seed={seed + 11} h={h} n={9} className="pl-q-band" />
            </>)}
            {layer("sun", 0.08, <>
                <g className="pl-rings">
                    {[3, 2, 1].map((k) => (
                        <circle key={k} className={`pl-f-ring pl-ring-${k}`} cx={sun.x} cy={sun.y} r={sun.r + 22 * k} />
                    ))}
                </g>
                <circle className="pl-f-sun" cx={sun.x} cy={sun.y} r={sun.r} />
            </>)}
            {layer("stars", 0.06, <g className="pl-stars">
                {stars.map((s, i) => (
                    <circle key={i} cx={s.x} cy={s.y} r={s.r} style={{ "--tw": `${s.d}s`, "--td": `${s.o}s` }} />
                ))}
            </g>)}
            {layer("birds", 0.1, <g className="pl-birds">
                {[[-260, -40], [-228, -58], [-200, -34], [-330, -10], [140, -60]].map(([dx, dy]) => (
                    <path key={`${dx}${dy}`} d={`M${sun.x + dx},${sun.y + dy} q6,-6 12,0 q6,-6 12,0`} />
                ))}
            </g>)}
            {layer("cloud pl-cloud-a", 0.12, <path className="pl-f-cloud" d={paths.c1} />)}
            {layer("cloud pl-cloud-b", 0.1, <path className="pl-f-cloud" d={paths.c2} />)}
            {layer("far", 0.16, <path className="pl-f-far" d={paths.far} />)}
            {layer("mid", 0.22, <>
                <path className="pl-f-mid" d={paths.mid} />
                <Quill id={`${uid}qm`} d={paths.mid} seed={seed + 13} h={h} n={5} className="pl-q-mid" />
            </>)}
            {L.city && layer("glow", 0.3, <>
                <path className="pl-f-glow" d={paths.glowD} />
                {L.city.windows.filter((w) => w.flicker).map((w, i) => (
                    <rect key={i} className="pl-f-off" x={w.x} y={w.y} width={w.w} height={w.h} style={{ "--fd": `${2 + (i % 5) * 1.7}s` }} />
                ))}
            </>)}
            {L.city && layer("city", 0.3, <>
                <path className="pl-f-city" fillRule="evenodd" d={paths.cityD} />
                {paths.craneD && <path className="pl-f-city" fillRule="evenodd" d={paths.craneD} />}
                {L.city.crane && (
                    <>
                        <path className="pl-f-beam" d={`M${L.city.crane.hookX},${L.city.crane.hookY} L${L.city.crane.hookX - 70},${h * 0.86} L${L.city.crane.hookX + 70},${h * 0.86} Z`} />
                        <circle className="pl-f-lamp" cx={L.city.crane.mx + 3.5} cy={L.city.crane.top - 36} r="3.4" />
                    </>
                )}
            </>)}
            {M && layer("glow", 0.3, <path className="pl-f-glow" d={M.glow} />)}
            {M && layer("city", 0.3, <>
                <path className="pl-f-city" fillRule="evenodd" d={M.solid} />
                {M.outline && <path className="pl-outline" d={M.outline} />}
            </>)}
            {M && M.puffs.length > 0 && layer("puffs", 0.31, <g className="pl-puffs">
                {M.puffs.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={p.r} style={{ "--pd": `${p.d}s` }} />)}
            </g>)}
            {layer("near", 0.36, <>
                <path className="pl-f-near" d={paths.near} />
                <Quill id={`${uid}qn`} d={paths.near} seed={seed + 14} h={h} n={8} className="pl-q-near" />
            </>)}
            {layer("front", 0.42, <path className="pl-f-front" d={paths.front} />)}
        </div>
    );
};

