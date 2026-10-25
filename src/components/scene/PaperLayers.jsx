import { useEffect, useId, useMemo, useRef } from "react";
import { useFeature, useSite } from "../../hooks/useSite";
import { SkyBody } from "./Sky";
import { W, random, ridgePath, rectPath, roofPath, framePath, cranePath, cloudCircles, cloudPath, landscape, motifShapes, plantTrees } from "./sceneGeometry";
import "./PaperLayers.css";

// The paper-cut landscape as stacked SVG sheets: each layer casts a soft shadow on the one
// behind it, lays itself down on load, and drifts at its own speed as the page scrolls.
// Colours come from the --sc-* tokens, so the same markup is the day or the night edition.
// The sky behind it (gradient + night stars) is the shared <Sky> that PageHero lays under the
// whole hero; PaperLayers only adds the sun or moon (<SkyBody>) and, by day, two paper clouds.

/**
 * A row of trees as two paths, one per shade (every third tree is the alternate shade). Same-colour
 * solid shapes look identical merged, and the browser handles 2 elements instead of dozens.
 * @param {{ list: string[], kind: string }} props  list: one SVG path per tree; kind: "far", "mid" or "near"
 */
const Trees = ({ list, kind }) => {
    if (!list?.length) return null;
    const main = list.filter((_, i) => i % 3).join(" ");
    const alt = list.filter((_, i) => !(i % 3)).join(" ");
    return (
        <>
            {main && <path className={`pl-tree pl-tree-${kind}`} d={main} />}
            {alt && <path className={`pl-tree pl-tree-${kind} alt`} d={alt} />}
        </>
    );
};

// Wind (Sky 2, the cloud's design): every tree row is split into three groups by x (left, middle, right third),
// each drawn as its own small SVG so a sway is handed to the compositor (a transform on an element inside a big SVG
// repaints the whole SVG). Each group keeps the two shades of the old single path: sub-shapes alternate shades by
// their index across the whole row, exactly as before. The box of a group is in the 1440-wide drawing's units;
// PaperLayers.css places it with container units, the way "xMidYMax slice" scales the layers.
const groupTrees = (trees) => {
    const groups = [0, 1, 2].map(() => ({ main: [], alt: [], x0: Infinity, x1: -Infinity, y0: Infinity, y1: -Infinity, base: 0, n: 0 }));
    let i = 0;
    for (const t of trees) {
        const g = groups[Math.min(2, Math.max(0, Math.floor((t.x / W) * 3)))];
        for (const part of t.d.split(/(?=M)/).filter((x) => x.trim())) (i++ % 3 ? g.main : g.alt).push(part);
        g.x0 = Math.min(g.x0, t.x - 45 * t.s);
        g.x1 = Math.max(g.x1, t.x + 45 * t.s);
        g.y0 = Math.min(g.y0, t.y - 100 * t.s);
        g.y1 = Math.max(g.y1, t.y + 16);
        g.base += t.y;
        g.n++;
    }
    const r = (v) => Math.round(v * 10) / 10;
    return groups.map((g, k) => (g.n ? { k, main: g.main.join(" "), alt: g.alt.join(" "), x0: r(g.x0), x1: r(g.x1), y0: r(g.y0), y1: r(g.y1), base: r(g.base / g.n) } : null)).filter(Boolean);
};

/**
 * One row of trees as up to three swaying groups (see groupTrees).
 * @param {{ groups: object[], kind: string, row: string, depth: number, h: number }} props  kind: the trees' shade
 *   ("far", "mid", "near"); row: the hill they stand on; depth: the hill's depth (lay-down and parallax); h: drawing height
 */
const TreeRow = ({ groups, kind, row, depth, h }) => (
    <div className={`pl-layer pl-trees pl-trees-${row}`} style={{ "--depth": depth }}>
        {groups.map((g) => (
            <svg
                key={g.k}
                className={`pl-tree-group pl-tg-${g.k}`}
                viewBox={`${g.x0} ${g.y0} ${r1(g.x1 - g.x0)} ${r1(g.y1 - g.y0)}`}
                preserveAspectRatio="none"
                style={{ "--x0": g.x0, "--x1": g.x1, "--y0": g.y0, "--y1": g.y1, "--base": g.base, "--vh": h }}
                aria-hidden="true"
                focusable="false"
            >
                {g.main && <path className={`pl-tree pl-tree-${kind}`} d={g.main} />}
                {g.alt && <path className={`pl-tree pl-tree-${kind} alt`} d={g.alt} />}
            </svg>
        ))}
    </div>
);
const r1 = (v) => Math.round(v * 10) / 10;

// Clouds drifting with the wind (Sky 2): from where the cloud is drawn, leftwards (an easterly) at 4 units a second ×
// wind, off the left edge and back in from the right; PaperLayers.css turns these numbers into the animation.
// cx: the cloud's centre in the 1440-wide drawing; s: its scale (half its width is about 122 × s).
const drift = (cx, s) => {
    const half = 122 * s;
    return { "--from": Math.round(W - cx + half), "--to": Math.round(-(cx + half)) };
};

// Gusts (wind ≥ 0.6): every 8–20 s a gust rolls across the trees for 2.5 s, from the windward side. One timer per
// landscape, only while its hero is on screen and the tab is visible; nothing with reduced motion.
const useGusts = (ref, wind, on) => {
    useEffect(() => {
        const el = ref.current;
        if (!el || !on || wind < 0.6 || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return undefined;
        let t = 0;
        const next = () => {
            t = setTimeout(() => {
                const paused = el.closest("[data-paused]") || document.hidden;
                if (!paused) {
                    el.classList.remove("pl-gust");
                    void el.offsetWidth; // restart the gust animation
                    el.classList.add("pl-gust");
                    t = setTimeout(() => {
                        el.classList.remove("pl-gust");
                        next();
                    }, 3400);
                } else next();
            }, 8000 + Math.random() * 12000);
        };
        next();
        return () => {
            clearTimeout(t);
            el.classList.remove("pl-gust");
        };
    }, [ref, wind, on]);
};

/**
 * Quilled paper: rings of thin paper coiled on a hill, clipped to the hill's shape.
 * @param {{ id: string, d: string, seed: number, h: number, n: number, className: string }} props
 *   d: the hill's outline (rings outside it are hidden); n: how many coils
 */
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
    // Every ring as two arcs in ONE path: it looks the same as separate circles, but the browser builds
    // and paints a single element instead of hundreds (this was ~330 elements per hero; check:smooth).
    const rings = groups
        .flatMap((g) => g.rings.map((k) => `M${(g.cx - k).toFixed(1)},${g.cy.toFixed(1)}a${k},${k} 0 1,0 ${2 * k},0a${k},${k} 0 1,0 ${-2 * k},0`))
        .join("");
    return (
        <>
            <clipPath id={id}>
                <path d={d} />
            </clipPath>
            <g clipPath={`url(#${id})`} className={`pl-quill ${className}`}>
                <path d={rings} />
            </g>
        </>
    );
};

/**
 * The paper-cut landscape at the bottom of each page hero: stacked hills, a Kampala skyline or a page motif,
 * trees, quilled paper and the sun or moon. Same seed, same landscape.
 * @param {object} props
 * @param {number} [props.seed=7]  picks the shapes
 * @param {number} [props.height=560]  height in px
 * @param {boolean} [props.city=true]  draw the skyline / motif
 * @param {string} [props.motif="city"]  "city", "plots", "estate", "forest", "academy", "market", …
 * @param {number} [props.tall=1]  how tall the buildings are (0–1)
 * @param {{x:number,y:number,r:number}} [props.sun]  where the sun or moon sits
 * @param {boolean} [props.accent=false]  colour the front hill in the division's accent
 * @param {string} [props.className]
 */
export const PaperLayers = ({ seed = 7, height = 560, city = true, motif = "city", tall = 1, sun = { x: 1110, y: 120, r: 64 }, accent = false, className = "" }) => {
    const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
    // wind: Admin → Sky and weather ("wind", 0–2) and Admin → Features ("Wind in the trees"); calm = no animation
    const site = useSite();
    const windOn = useFeature("wind");
    const wind = windOn ? Math.max(0, Math.min(2, Number(site?.sky?.wind ?? 1))) : 0;
    const rootRef = useRef(null);
    useGusts(rootRef, wind, wind > 0.05);
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
        // every sub-shape as its own path, so overlapping crowns and trunks never cancel out (groupTrees)
        const midTrees = plantTrees({ pts: L.mid, seed: seed + 21, ranges: [[-40, W + 40]], every: 64, scale: 0.55 * Math.max(0.8, h / 560) });
        const nearTrees = plantTrees({ pts: L.near, seed: seed + 22, ranges: [[-30, 600], [W - 70, W + 30]], every: 58, scale: 0.95 * Math.max(0.8, h / 560) });
        const frontTrees = plantTrees({ pts: L.front, seed: seed + 23, ranges: [[-10, 90]], every: 80, scale: 1.7 * Math.max(0.7, h / 560), kinds: ["acacia", "broadleaf", "banana"] });
        return { band, far, mid, near, front, c1, c2, cityD, glowD, craneD, midTrees: groupTrees(midTrees), nearTrees: groupTrees(nearTrees), frontTrees: groupTrees(frontTrees) };
    }, [L, h, seed]);

    const layer = (name, depth, children) => (
        <svg className={`pl-layer pl-${name}`} style={{ "--depth": depth }} viewBox={vb} preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false">
            {children}
        </svg>
    );

    return (
        <div ref={rootRef} className={`paper-layers ${accent ? "pl-accent" : ""} ${wind > 0.05 ? "pl-windy" : ""} ${className}`.trim()} style={{ "--pl-h": `${h}px`, "--wind": wind }} aria-hidden="true">
            {layer("band", 0.05, <>
                <path className="pl-f-band" d={paths.band} />
                <Quill id={`${uid}q0`} d={paths.band} seed={seed + 11} h={h} n={9} className="pl-q-band" />
            </>)}
            <SkyBody id={`${uid}moon`} r={Math.round(sun.r * (h < 420 ? 0.9 : 1))} />
            {/* .pl-cloud-push: moved aside by the sun (useSkyDrag); the layer and the path have their own animations */}
            {layer("cloud pl-cloud-a", 0.12, <g className="pl-cloud-push"><path className="pl-f-cloud" d={paths.c1} style={drift(W * 0.7, 1)} /></g>)}
            {layer("cloud pl-cloud-b", 0.1, <g className="pl-cloud-push"><path className="pl-f-cloud" d={paths.c2} style={drift(W * 0.92, 0.75)} /></g>)}
            {layer("far", 0.16, <path className="pl-f-far" d={paths.far} />)}
            {layer("mid", 0.22, <>
                <path className="pl-f-mid" d={paths.mid} />
                <Quill id={`${uid}qm`} d={paths.mid} seed={seed + 13} h={h} n={5} className="pl-q-mid" />
            </>)}
            <TreeRow groups={paths.midTrees} kind="far" row="mid" depth={0.22} h={h} />
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
                <Trees list={M.trees} kind="near" />
                {M.outline && <path className="pl-outline" d={M.outline} />}
            </>)}
            {M && M.puffs.length > 0 && layer("puffs", 0.31, <g className="pl-puffs">
                {M.puffs.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={p.r} style={{ "--pd": `${p.d}s` }} />)}
            </g>)}
            {layer("near", 0.36, <>
                <path className="pl-f-near" d={paths.near} />
                <Quill id={`${uid}qn`} d={paths.near} seed={seed + 14} h={h} n={8} className="pl-q-near" />
            </>)}
            <TreeRow groups={paths.nearTrees} kind="mid" row="near" depth={0.36} h={h} />
            {layer("front", 0.42, <>
                <path className="pl-f-front" d={paths.front} />
            </>)}
            <TreeRow groups={paths.frontTrees} kind="near" row="front" depth={0.42} h={h} />
        </div>
    );
};

