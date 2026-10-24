import { useId, useMemo } from "react";
import { SkyBody } from "./Sky";
import { W, random, ridgePath, rectPath, roofPath, framePath, cranePath, cloudCircles, cloudPath, landscape, motifShapes, plantTrees } from "./sceneGeometry";
import "./PaperLayers.css";

// The paper-cut landscape as stacked SVG sheets: each layer casts a soft shadow on the one
// behind it, lays itself down on load, and drifts at its own speed as the page scrolls.
// Colours come from the --sc-* tokens, so the same markup is the day or the night edition.
// The sky behind it (gradient + night stars) is the shared <Sky> that PageHero lays under the
// whole hero; PaperLayers only adds the sun or moon (<SkyBody>) and, by day, two paper clouds.

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
    const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
    const L = useMemo(() => landscape({ seed, h: height, city: city && motif === "city", tall }), [seed, height, city, motif, tall]);
    // a page motif (construction site, workshop, precast yard, design) replaces the skyline
    const M = useMemo(() => {
        const m = city ? motifShapes(motif, height * 0.86, tall, seed + 8) : null;
        if (m?.trees) m.trees = m.trees.flatMap((d) => d.split(/(?=M)/).filter((x) => x.trim()));
        return m;
    }, [city, motif, height, tall, seed]);
    const h = L.h;
    const vb = `0 0 ${W} ${h}`;
    const paths = useMemo(() => {
        const band = ridgePath(L.band, h);
        const far = ridgePath(L.far, h);
        const mid = ridgePath(L.mid, h);
        const near = ridgePath(L.near, h);
        const front = ridgePath(L.front, h);
        // two paper clouds at most, on the right, away from the hero copy (day edition only)
        const c1 = cloudPath(cloudCircles(W * 0.7, h * 0.14, 1, seed + 2));
        const c2 = cloudPath(cloudCircles(W * 0.92, h * 0.3, 0.75, seed + 3));
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
        // Trees cut from the same sheet as their hill: small ones on the middle hills (behind the
        // buildings), a belt on the near hill left of the buildings, and two big ones framing the front.
        // every sub-shape as its own path, so overlapping crowns and trunks never cancel out
        const split = (list) => list.flatMap((d) => d.split(/(?=M)/).filter((x) => x.trim()));
        const midTrees = plantTrees({ pts: L.mid, seed: seed + 21, ranges: [[-40, W + 40]], every: 64, scale: 0.55 * Math.max(0.8, h / 560) });
        const nearTrees = plantTrees({ pts: L.near, seed: seed + 22, ranges: [[-30, 600], [W - 70, W + 30]], every: 58, scale: 0.95 * Math.max(0.8, h / 560) });
        const frontTrees = plantTrees({ pts: L.front, seed: seed + 23, ranges: [[-10, 90]], every: 80, scale: 1.7 * Math.max(0.7, h / 560), kinds: ["acacia", "broadleaf", "banana"] });
        return { band, far, mid, near, front, c1, c2, cityD, glowD, craneD, midTrees: split(midTrees), nearTrees: split(nearTrees), frontTrees: split(frontTrees) };
    }, [L, h, seed]);

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
            <SkyBody id={`${uid}moon`} r={Math.round(sun.r * (h < 420 ? 0.9 : 1))} />
            {layer("cloud pl-cloud-a", 0.12, <path className="pl-f-cloud" d={paths.c1} />)}
            {layer("cloud pl-cloud-b", 0.1, <path className="pl-f-cloud" d={paths.c2} />)}
            {layer("far", 0.16, <path className="pl-f-far" d={paths.far} />)}
            {layer("mid", 0.22, <>
                <path className="pl-f-mid" d={paths.mid} />
                {paths.midTrees.map((d, i) => <path key={i} className={`pl-tree pl-tree-far ${i % 3 ? "" : "alt"}`} d={d} />)}
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
                {(M.trees ?? []).map((d, i) => <path key={i} className={`pl-tree pl-tree-near ${i % 3 ? "" : "alt"}`} d={d} />)}
                {M.outline && <path className="pl-outline" d={M.outline} />}
            </>)}
            {M && M.puffs.length > 0 && layer("puffs", 0.31, <g className="pl-puffs">
                {M.puffs.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={p.r} style={{ "--pd": `${p.d}s` }} />)}
            </g>)}
            {layer("near", 0.36, <>
                <path className="pl-f-near" d={paths.near} />
                {paths.nearTrees.map((d, i) => <path key={i} className={`pl-tree pl-tree-mid ${i % 3 ? "" : "alt"}`} d={d} />)}
                <Quill id={`${uid}qn`} d={paths.near} seed={seed + 14} h={h} n={8} className="pl-q-near" />
            </>)}
            {layer("front", 0.42, <>
                <path className="pl-f-front" d={paths.front} />
                {paths.frontTrees.map((d, i) => <path key={i} className={`pl-tree pl-tree-near ${i % 3 ? "" : "alt"}`} d={d} />)}
            </>)}
        </div>
    );
};

