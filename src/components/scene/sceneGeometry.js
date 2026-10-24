// Shared geometry for the paper-cut scene: hills, a Kampala skyline with a building under
// construction and a tower crane, clouds. Used by the SVG layers and by the three.js scene,
// so both editions of the hero show the same landscape.

export const W = 1440;

export const random = (seed) => {
    let s = Math.abs(Math.floor(seed)) % 2147483646 || 1;
    return () => {
        s = (s * 16807) % 2147483647;
        return (s - 1) / 2147483646;
    };
};

// Ridge points across the width; profile(t) scales the amplitude from left (0) to right (1)
export const ridge = ({ base, amp, step, seed, profile = () => 1, from = -80, to = W + 80 }) => {
    const r = random(seed);
    const pts = [];
    for (let x = from; x <= to; x += step * (0.7 + 0.6 * r())) {
        const t = Math.min(1, Math.max(0, x / W));
        pts.push([x, base - profile(t) * amp * (0.45 + 0.55 * r())]);
    }
    return pts;
};

const f = (n) => Math.round(n * 10) / 10;

// Catmull-Rom through points → SVG cubic path, closed down to `bottom`
export const ridgePath = (pts, bottom) => {
    let d = `M${f(pts[0][0])},${f(pts[0][1])}`;
    for (let i = 0; i < pts.length - 1; i++) {
        const p0 = pts[i - 1] ?? pts[i];
        const p1 = pts[i];
        const p2 = pts[i + 1];
        const p3 = pts[i + 2] ?? p2;
        const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
        const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
        d += ` C${f(c1[0])},${f(c1[1])} ${f(c2[0])},${f(c2[1])} ${f(p2[0])},${f(p2[1])}`;
    }
    const last = pts[pts.length - 1][0];
    return `${d} L${f(last)},${bottom} L${f(pts[0][0])},${bottom} Z`;
};

// Buildings as rectangles (+ roofs), window openings and the crane as plain shapes
export const skyline = ({ base, seed, x0 = 640, x1 = W, tall = 1 }) => {
    const r = random(seed);
    const blocks = [];
    const roofs = [];
    const windows = [];
    let frame = null;
    let x = x0;
    while (x < x1) {
        const bw = [54, 66, 78, 92, 110][Math.floor(r() * 5)];
        const gap = [0, 6, 10, 18][Math.floor(r() * 4)];
        const kind = r();
        if (!frame && x > x0 + (x1 - x0) * 0.55) {
            const fw = 120;
            const fh = 210 * tall;
            frame = { x, y: base - fh, w: fw, h: fh, cols: 4, rows: 7 };
            x += fw + 14;
            continue;
        }
        let bh = (60 + r() * 120) * tall;
        if (kind < 0.18) bh *= 0.55;
        const by = base - bh;
        blocks.push({ x, y: by, w: bw, h: bh });
        if (kind < 0.18) roofs.push({ type: "pitch", x: x - 4, y: by, w: bw + 8, h: 22 });
        else if (kind < 0.32) roofs.push({ type: "step", x: x + bw * 0.2, y: by - 18, w: bw * 0.6, h: 18 });
        else if (kind < 0.42) roofs.push({ type: "tank", x: x + bw * 0.62, y: by - 16, w: 16, h: 16 });
        const nx = Math.max(1, Math.floor((bw - 14) / 16));
        const ny = Math.max(1, Math.floor((bh - 20) / 22));
        const ox = x + (bw - (nx * 16 - 8)) / 2;
        for (let c = 0; c < nx; c++) {
            for (let k = 0; k < ny; k++) {
                if (r() < 0.82) windows.push({ x: ox + c * 16, y: by + 12 + k * 22, w: 8, h: 11, flicker: r() < 0.06 });
            }
        }
        x += bw + gap;
    }
    let crane = null;
    if (frame) {
        const mx = frame.x + frame.w - 26;
        const top = frame.y - 120 * tall;
        crane = { mx, top, jibY: top + 10, base, hookX: mx - 119, hookY: top + 95 };
    }
    return { blocks, roofs, windows, frame, crane };
};

export const rectPath = ({ x, y, w, h }) => `M${f(x)},${f(y)}h${f(w)}v${f(h)}h${f(-w)}Z`;

export const roofPath = (roof) =>
    roof.type === "pitch"
        ? `M${f(roof.x)},${f(roof.y)}L${f(roof.x + roof.w / 2)},${f(roof.y - roof.h)}L${f(roof.x + roof.w)},${f(roof.y)}Z`
        : rectPath(roof);

// Open frame of the building under construction: outer rectangle with bay openings
export const framePath = (fr) => {
    let d = rectPath(fr);
    const cw = (fr.w - 8) / fr.cols;
    const rh = (fr.h - 8) / fr.rows;
    for (let c = 0; c < fr.cols; c++) {
        for (let k = 0; k < fr.rows; k++) {
            if (k === 0 && c > 1) continue;
            d += rectPath({ x: fr.x + 4 + c * cw + 3, y: fr.y + 4 + k * rh + 4, w: cw - 6, h: rh - 8 });
        }
    }
    return d;
};

export const cranePath = (cr) => {
    const { mx, top, jibY, base } = cr;
    let d = [
        rectPath({ x: mx, y: top, w: 7, h: base - top }),
        rectPath({ x: mx - 170, y: jibY, w: 300, h: 6 }),
        rectPath({ x: mx + 70, y: jibY + 6, w: 26, h: 12 }),
        rectPath({ x: mx - 4, y: jibY - 18, w: 15, h: 18 }),
        `M${f(mx + 3.5)},${f(top - 34)}L${f(mx - 140)},${f(jibY)}L${f(mx - 136)},${f(jibY)}L${f(mx + 3.5)},${f(top - 28)}Z`,
        `M${f(mx + 3.5)},${f(top - 34)}L${f(mx + 110)},${f(jibY)}L${f(mx + 106)},${f(jibY)}L${f(mx + 3.5)},${f(top - 28)}Z`,
        rectPath({ x: mx - 120, y: jibY + 6, w: 1.6, h: 70 }),
        rectPath({ x: mx - 127, y: jibY + 76, w: 16, h: 9 }),
    ].join(" ");
    for (let y = top + 6; y < base - 10; y += 12) d += ` M${f(mx + 1.5)},${f(y)}h4v8h-4Z`;
    return d;
};

export const cloudCircles = (cx, cy, s, seed) => {
    const r = random(seed);
    const baseW = 160 * s;
    const circles = [];
    for (let i = 0; i < 4; i++) {
        circles.push({ x: cx - baseW / 2 + (i + 0.5) * (baseW / 4), y: cy + 18 * s, r: (22 + r() * 20) * s });
    }
    return { base: { x: cx - baseW / 2, y: cy, w: baseW, h: 18 * s }, circles };
};

export const cloudPath = (c) =>
    rectPath(c.base) +
    c.circles.map((k) => ` M${f(k.x - k.r)},${f(k.y)}a${f(k.r)},${f(k.r)} 0 1,1 ${f(2 * k.r)},0Z`).join("");

// The standard landscape used by every scene (seeded per page)
export const landscape = ({ seed = 7, h = 560, city = true, tall = 1, overscan = 80 }) => {
    const span = { from: -overscan, to: W + overscan };
    const band = ridge({ ...span, base: h * 0.62, amp: h * 0.28, step: 150, seed: seed + 1, profile: (t) => 0.6 + 0.4 * Math.sin(t * 3.1) });
    const far = ridge({ ...span, base: h * 0.58, amp: h * 0.32, step: 110, seed: seed + 4, profile: (t) => 0.55 + 0.45 * Math.sin(t * 6.2 + 1) });
    const mid = ridge({ ...span, base: h * 0.72, amp: h * 0.26, step: 140, seed: seed + 6, profile: (t) => 0.35 + 0.65 * t });
    const near = ridge({ ...span, base: h * 0.9, amp: h * 0.16, step: 120, seed: seed + 9, profile: (t) => 0.4 + 0.6 * Math.abs(Math.sin(t * 4.4)) });
    const front = ridge({ ...span, base: h * 0.985, amp: h * 0.05, step: 60, seed: seed + 10 });
    return { h, band, far, mid, near, front, city: city ? skyline({ base: h * 0.86, seed: seed + 8, tall }) : null };
};

// ---------- page motifs: what stands on the hills of each page ----------
// Each returns paths in the same 1440-wide drawing: solid (cut from dark paper, window holes
// with fill-rule evenodd), glow (lit sheet behind the holes at night), outline (pencil lines),
// puffs (smoke or dust circles that drift up).
const P = (pts) => "M" + pts.map(([x, y]) => `${f(x)},${f(y)}`).join("L") + "Z";

const motifConstruction = (base, tall, seed) => {
    const r = random(seed);
    const solid = [];
    const glow = [];
    const outline = [];
    // two frames going up, each with its crane
    [{ x: 760, w: 150, h: 250 }, { x: 1080, w: 120, h: 320 }].forEach((fr, i) => {
        const frame = { x: fr.x, y: base - fr.h * tall, w: fr.w, h: fr.h * tall, cols: i ? 3 : 4, rows: i ? 9 : 7 };
        solid.push(framePath(frame));
        const top = frame.y - 110 * tall;
        solid.push(cranePath({ mx: fr.x + (i ? 20 : fr.w - 26), top, jibY: top + 10, base }));
    });
    // finished blocks either side with lit windows
    [[640, 92, 150], [960, 86, 120], [1250, 110, 190], [1370, 70, 110]].forEach(([x, w, h]) => {
        const b = { x, y: base - h * tall, w, h: h * tall };
        let d = rectPath(b);
        for (let yy = b.y + 14; yy < base - 14; yy += 22)
            for (let xx = x + 10; xx < x + w - 14; xx += 16) if (r() < 0.8) d += rectPath({ x: xx, y: yy, w: 8, h: 11 });
        solid.push(d);
        glow.push(rectPath({ x: x + 2, y: b.y + 4, w: w - 4, h: b.h - 4 }));
    });
    // site hoarding with posts, a site hut and a sand pile
    solid.push(rectPath({ x: 600, y: base - 26, w: 840, h: 4 }));
    for (let x = 604; x < 1440; x += 48) solid.push(rectPath({ x, y: base - 30, w: 4, h: 30 }));
    solid.push(rectPath({ x: 930, y: base - 34, w: 44, h: 34 }));
    solid.push(`M1000,${base} Q1030,${base - 40} 1060,${base}Z`);
    outline.push(`M760,${base - 270 * tall} h150`); // setting-out line over the first frame
    return { solid: solid.join(" "), glow: glow.join(" "), outline: outline.join(" "), puffs: [] };
};

const motifWorkshop = (base, tall, seed) => {
    const r = random(seed);
    const solid = [];
    const glow = [];
    // sawtooth workshop shed: the glazed faces of the teeth are openings
    const x0 = 760;
    const x1 = 1200;
    const wallTop = base - 90 * tall;
    const teeth = 5;
    const tw = (x1 - x0) / teeth;
    const roof = [[x0, base], [x0, wallTop]];
    for (let i = 0; i < teeth; i++) {
        roof.push([x0 + i * tw, wallTop - 46 * tall]);
        roof.push([x0 + (i + 1) * tw, wallTop]);
    }
    roof.push([x1, base]);
    let shed = P(roof);
    for (let i = 0; i < teeth; i++) shed += rectPath({ x: x0 + i * tw + 4, y: wallTop - 38 * tall, w: 8, h: 34 * tall });
    // big doors with the bench light behind
    shed += rectPath({ x: 860, y: base - 62 * tall, w: 70, h: 62 * tall }) + rectPath({ x: 1010, y: base - 62 * tall, w: 70, h: 62 * tall });
    solid.push(shed);
    glow.push(rectPath({ x: x0 + 2, y: wallTop - 44 * tall, w: x1 - x0 - 4, h: base - wallTop + 44 * tall }));
    // chimney with drifting smoke
    solid.push(rectPath({ x: 1150, y: base - 210 * tall, w: 18, h: 210 * tall }));
    const puffs = Array.from({ length: 6 }, (_, i) => ({ x: 1159 + i * 9 + r() * 6, y: base - 222 * tall - i * 18, r: 9 + i * 4, d: i * 0.9 }));
    // log pile, end-on
    let logs = "";
    [[1240, 0, 4], [1252, 1, 3], [1264, 2, 2], [1276, 3, 1]].forEach(([sx, row, n]) => {
        for (let i = 0; i < n; i++) {
            const cx = sx + i * 24;
            const cy = base - 11 - row * 21;
            logs += ` M${f(cx - 11)},${f(cy)}a11,11 0 1,0 22,0a11,11 0 1,0 -22,0Z M${f(cx - 4)},${f(cy)}a4,4 0 1,0 8,0a4,4 0 1,0 -8,0Z`;
        }
    });
    solid.push(logs);
    // the Formcraft armchair, oversized, on the hill
    const cx = 660;
    solid.push(
        P([[cx, base], [cx, base - 70], [cx + 8, base - 70], [cx + 8, base - 40], [cx + 52, base - 40], [cx + 52, base], [cx + 46, base], [cx + 46, base - 30], [cx + 6, base - 30], [cx + 6, base]]) +
            " " + P([[cx + 4, base - 72], [cx + 14, base - 112], [cx + 22, base - 112], [cx + 12, base - 70]]) +
            " " + P([[cx + 6, base - 52], [cx + 56, base - 56], [cx + 56, base - 50], [cx + 6, base - 46]])
    );
    // timber planks leaning on the wall
    for (let i = 0; i < 4; i++) solid.push(P([[730 + i * 7, base], [742 + i * 7, base - 80], [746 + i * 7, base - 80], [734 + i * 7, base]]));
    return { solid: solid.join(" "), glow: glow.join(" "), outline: "", puffs };
};

const motifPrecast = (base, tall) => {
    const solid = [];
    const glow = [];
    // gantry crane spanning the casting beds, with its trolley and hook
    const g0 = 740;
    const g1 = 1080;
    const gt = base - 170 * tall;
    solid.push(rectPath({ x: g0, y: gt, w: 12, h: base - gt }) + rectPath({ x: g1 - 12, y: gt, w: 12, h: base - gt }) + rectPath({ x: g0 - 10, y: gt - 14, w: g1 - g0 + 20, h: 16 }));
    solid.push(rectPath({ x: 880, y: gt + 2, w: 34, h: 16 }) + rectPath({ x: 896, y: gt + 18, w: 2, h: 70 }) + rectPath({ x: 852, y: gt + 88, w: 90, h: 10 }));
    // stacked beams and standing columns
    for (let i = 0; i < 4; i++) solid.push(rectPath({ x: 770 + i * 6, y: base - 14 - i * 14, w: 260 - i * 12, h: 12 }));
    for (let i = 0; i < 6; i++) solid.push(rectPath({ x: 1100 + i * 18, y: base - 120 * tall, w: 12, h: 120 * tall }));
    // two cement silos with a walkway
    [1240, 1310].forEach((x) => {
        solid.push(P([[x, base], [x, base - 200 * tall], [x + 26, base - 236 * tall], [x + 52, base - 200 * tall], [x + 52, base]]) + rectPath({ x: x + 16, y: base - 40, w: 20, h: 18 }));
        glow.push(rectPath({ x: x + 18, y: base - 38, w: 16, h: 14 }));
    });
    solid.push(rectPath({ x: 1240, y: base - 210 * tall, w: 122, h: 5 }));
    // the batching plant office
    solid.push(rectPath({ x: 640, y: base - 60, w: 80, h: 60 }) + rectPath({ x: 650, y: base - 46, w: 18, h: 14 }) + rectPath({ x: 680, y: base - 46, w: 18, h: 14 }));
    glow.push(rectPath({ x: 644, y: base - 56, w: 72, h: 52 }));
    return { solid: solid.join(" "), glow: glow.join(" "), outline: "", puffs: [] };
};

// "In design / built": the same building, its left half cut from paper, its right half still a drawing
const motifDesign = (base, tall, seed) => {
    const r = random(seed);
    const x0 = 820;
    const w = 380;
    const h = 250 * tall;
    const y0 = base - h;
    const half = x0 + w / 2;
    const floors = 6;
    const fh = h / floors;
    let built = rectPath({ x: x0, y: y0, w: w / 2, h }) + rectPath({ x: x0 + 20, y: y0 - 22, w: 80, h: 22 });
    for (let k = 0; k < floors; k++)
        for (let c = 0; c < 5; c++) if (r() < 0.85) built += rectPath({ x: x0 + 14 + c * 34, y: y0 + 12 + k * fh, w: 18, h: fh - 22 });
    let outline = `M${half},${y0} h${w / 2} v${h} h${-w / 2}`;
    for (let k = 1; k < floors; k++) outline += ` M${half},${y0 + k * fh} h${w / 2}`;
    for (let c = 1; c < 5; c++) outline += ` M${half + (c * w) / 10},${y0} v${h}`;
    // dimension line above, with ticks, and a grid bubble
    outline += ` M${x0},${y0 - 44} h${w} M${x0},${y0 - 52} v16 M${x0 + w},${y0 - 52} v16`;
    outline += ` M${x0 + w + 40},${base} v${-h - 70} M${x0 + w + 26},${y0 - 84} a14,14 0 1,0 28,0 a14,14 0 1,0 -28,0`;
    // neighbours on the hill
    let solid = built;
    [[640, 90, 140], [1290, 100, 170]].forEach(([x, bw, bh]) => {
        solid += rectPath({ x, y: base - bh * tall, w: bw, h: bh * tall });
        for (let yy = base - bh * tall + 14; yy < base - 14; yy += 22) for (let xx = x + 10; xx < x + bw - 14; xx += 16) solid += rectPath({ x: xx, y: yy, w: 8, h: 11 });
    });
    const glow = rectPath({ x: x0 + 2, y: y0 + 4, w: w / 2 - 4, h: h - 4 }) + rectPath({ x: 642, y: base - 140 * tall + 4, w: 86, h: 140 * tall - 4 }) + rectPath({ x: 1292, y: base - 170 * tall + 4, w: 96, h: 170 * tall - 4 });
    return { solid, glow, outline, puffs: [] };
};

// A house with a pitched roof, door and two windows (window holes for evenodd)
const house = (x, base, w, h, roofH) => {
    let d = rectPath({ x, y: base - h, w, h }) + " " + P([[x - 6, base - h], [x + w / 2, base - h - roofH], [x + w + 6, base - h]]);
    d += rectPath({ x: x + w * 0.42, y: base - h * 0.55, w: w * 0.16, h: h * 0.55 });
    d += rectPath({ x: x + w * 0.12, y: base - h * 0.7, w: w * 0.18, h: h * 0.24 }) + rectPath({ x: x + w * 0.7, y: base - h * 0.7, w: w * 0.18, h: h * 0.24 });
    return d;
};
const windowsIn = (b, r, every = 0.8) => {
    let d = "";
    for (let yy = b.y + 14; yy < b.y + b.h - 14; yy += 22) for (let xx = b.x + 10; xx < b.x + b.w - 14; xx += 16) if (r() < every) d += rectPath({ x: xx, y: yy, w: 8, h: 11 });
    return d;
};

// Template builds: the same home repeated on 50 × 100 ft plots, with plot pegs and dashed boundaries
const motifPlots = (base, tall, seed) => {
    const r = random(seed);
    const solid = [];
    const trees = [];
    const glow = [];
    let outline = "";
    [660, 820, 980, 1140, 1300].forEach((x, i) => {
        const w = 92;
        const built = i !== 2; // one plot still a drawing
        const h = 58 * tall;
        if (built) {
            solid.push(house(x, base, w, h, 34 * tall));
            glow.push(rectPath({ x: x + 2, y: base - h + 2, w: w - 4, h: h - 4 }));
        } else {
            outline += ` M${x},${base} v${-h} h${w} v${h} M${x - 6},${base - h} L${x + w / 2},${base - h - 34 * tall} L${x + w + 6},${base - h}`;
        }
        // plot pegs and the boundary line
        solid.push(rectPath({ x: x - 26, y: base - 18, w: 3, h: 18 }) + rectPath({ x: x + w + 22, y: base - 18, w: 3, h: 18 }));
        outline += ` M${x - 24},${base - 10} h${w + 48}`;
        trees.push(treeShape(r() < 0.5 ? "banana" : "broadleaf", x + w + 12, base, 0.7, r));
    });
    return { solid: solid.join(" "), glow: glow.join(" "), outline, puffs: [], trees };
};

// Real estate: an apartment block, townhouses and a show home, among mature trees
const motifEstate = (base, tall, seed) => {
    const r = random(seed);
    const solid = [];
    const trees = [];
    const glow = [];
    const blocks = [{ x: 900, y: base - 230 * tall, w: 150, h: 230 * tall }, { x: 1070, y: base - 170 * tall, w: 110, h: 170 * tall }];
    blocks.forEach((b) => {
        solid.push(rectPath(b) + windowsIn(b, r, 0.85) + rectPath({ x: b.x - 6, y: b.y - 8, w: b.w + 12, h: 8 }));
        glow.push(rectPath({ x: b.x + 2, y: b.y + 4, w: b.w - 4, h: b.h - 4 }));
    });
    // balconies on the tall block
    for (let yy = blocks[0].y + 30; yy < base - 20; yy += 44) solid.push(rectPath({ x: 894, y: yy, w: 162, h: 3 }));
    [[680, 70], [760, 70], [1220, 84], [1320, 84]].forEach(([x, w]) => {
        solid.push(house(x, base, w, 56 * tall, 30 * tall));
        glow.push(rectPath({ x: x + 2, y: base - 54 * tall, w: w - 4, h: 52 * tall }));
    });
    // sign board on two posts (blank: no invented names)
    solid.push(rectPath({ x: 1190, y: base - 64, w: 4, h: 64 }) + rectPath({ x: 1250, y: base - 64, w: 4, h: 64 }) + rectPath({ x: 1182, y: base - 92, w: 80, h: 36 }));
    [850, 1200, 1410, 640].forEach((x, i) => trees.push(treeShape(i % 2 ? "acacia" : "broadleaf", x, base, 1.1, r)));
    return { solid: solid.join(" "), glow: glow.join(" "), outline: "", puffs: [], trees };
};

// Plant a tree: a young forest, rows of staked saplings in front of grown trees
const motifForest = (base, tall, seed) => {
    const r = random(seed);
    const solid = [];
    const trees = [];
    let outline = "";
    for (let x = 620; x < 1440; x += 46 + r() * 30) {
        const kinds = ["broadleaf", "acacia", "cypress", "broadleaf"];
        trees.push(treeShape(kinds[Math.floor(r() * kinds.length)], x, base - 6, (1.2 + r() * 0.9) * tall, r));
    }
    // saplings with stakes and ties along the front
    for (let x = 640; x < 1430; x += 38) {
        const h = 22 + r() * 10;
        trees.push(rectPath({ x: x - 1, y: base - h, w: 2, h: h + 2 }));
        trees.push(circle(x, base - h - 5, 7 + r() * 3));
        trees.push(rectPath({ x: x + 6, y: base - h - 4, w: 2, h: h + 4 }));
        outline += ` M${x - 6},${base + 2} h12`;
    }
    return { solid: solid.join(" "), glow: "", outline, puffs: [], trees };
};

// Academy: a teaching studio with tall windows, a drawing board on an easel, a flag pole
const motifAcademy = (base, tall, seed) => {
    const r = random(seed);
    const solid = [];
    const trees = [];
    const glow = [];
    const b = { x: 860, y: base - 150 * tall, w: 300, h: 150 * tall };
    let hall = rectPath(b) + P([[b.x - 14, b.y], [b.x + b.w / 2, b.y - 50 * tall], [b.x + b.w + 14, b.y]]);
    for (let i = 0; i < 6; i++) hall += rectPath({ x: b.x + 18 + i * 47, y: b.y + 22, w: 28, h: b.h - 60 });
    hall += rectPath({ x: b.x + b.w / 2 - 18, y: base - 34, w: 36, h: 34 });
    solid.push(hall);
    glow.push(rectPath({ x: b.x + 2, y: b.y + 4, w: b.w - 4, h: b.h - 4 }));
    solid.push(rectPath({ x: 1210, y: base - 200 * tall, w: 4, h: 200 * tall }) + P([[1214, base - 198 * tall], [1262, base - 186 * tall], [1214, base - 172 * tall]]));
    // drawing board on an easel, with a set square pinned to it
    solid.push(P([[700, base], [730, base - 120], [736, base - 120], [710, base]]) + P([[790, base], [764, base - 120], [758, base - 120], [780, base]]) + rectPath({ x: 712, y: base - 132, w: 72, h: 52 }));
    let outline = `M722,${base - 88} l20,-34 v34 Z M752,${base - 120} h24`;
    // a few students' desks in front
    for (let x = 1290; x < 1420; x += 46) solid.push(rectPath({ x, y: base - 26, w: 34, h: 4 }) + rectPath({ x: x + 3, y: base - 22, w: 3, h: 22 }) + rectPath({ x: x + 28, y: base - 22, w: 3, h: 22 }));
    [640, 820, 1180, 1420].forEach((x, i) => trees.push(treeShape(i === 1 ? "cypress" : "broadleaf", x, base, 1, r)));
    return { solid: solid.join(" "), glow: glow.join(" "), outline, puffs: [], trees };
};

// Community: market stalls with striped awnings and bunting, makers' sheds, shade trees
const motifMarket = (base, tall, seed) => {
    const r = random(seed);
    const solid = [];
    const trees = [];
    const glow = [];
    let outline = "";
    [700, 820, 940, 1060].forEach((x) => {
        const w = 100;
        const top = base - 70 * tall;
        let st = rectPath({ x, y: top, w: 4, h: 70 * tall }) + rectPath({ x: x + w - 4, y: top, w: 4, h: 70 * tall });
        st += P([[x - 8, top + 4], [x + w / 2, top - 22 * tall], [x + w + 8, top + 4]]);
        for (let k = 0; k < 5; k++) st += ` M${f(x - 8 + k * 23.2)},${f(top + 4)} q5.8,10 11.6,0Z`; // scalloped awning edge
        st += rectPath({ x: x + 6, y: base - 30, w: w - 12, h: 6 }); // counter
        st += circle(x + 30, base - 36, 6) + circle(x + 52, base - 37, 7) + rectPath({ x: x + 66, y: base - 46, w: 14, h: 16 }); // goods
        solid.push(st);
    });
    // bunting across the stalls
    outline += ` M690,${base - 104 * tall} Q880,${base - 80 * tall} 1170,${base - 104 * tall}`;
    for (let x = 705; x < 1160; x += 26) {
        const y = base - 104 * tall + Math.sin(((x - 690) / 480) * Math.PI) * 18 * tall;
        solid.push(P([[x, y], [x + 12, y], [x + 6, y + 12]]));
    }
    // a makers' shed with lit door
    solid.push(rectPath({ x: 1200, y: base - 96 * tall, w: 140, h: 96 * tall }) + P([[1192, base - 96 * tall], [1270, base - 132 * tall], [1348, base - 96 * tall]]) + rectPath({ x: 1250, y: base - 56, w: 40, h: 56 }));
    glow.push(rectPath({ x: 1252, y: base - 54, w: 36, h: 52 }));
    // people: simple standing figures
    [760, 905, 990, 1130, 1310].forEach((x, i) => solid.push(circle(x, base - 34 - (i % 2) * 3, 5) + P([[x - 6, base], [x - 5, base - 27], [x + 5, base - 27], [x + 6, base]])));
    [640, 1180, 1400].forEach((x) => trees.push(treeShape("acacia", x, base, 1.25, r)));
    return { solid: solid.join(" "), glow: glow.join(" "), outline, puffs: [], trees };
};

export const motifShapes = (motif, base, tall, seed) => {
    if (motif === "construction") return motifConstruction(base, tall, seed);
    if (motif === "workshop") return motifWorkshop(base, tall, seed);
    if (motif === "precast") return motifPrecast(base, tall, seed);
    if (motif === "design") return motifDesign(base, tall, seed);
    if (motif === "plots") return motifPlots(base, tall, seed);
    if (motif === "estate") return motifEstate(base, tall, seed);
    if (motif === "forest") return motifForest(base, tall, seed);
    if (motif === "academy") return motifAcademy(base, tall, seed);
    if (motif === "market") return motifMarket(base, tall, seed);
    return null;
};

// ---------- trees: cut from the same sheet as the hill they stand on ----------
// Kinds seen around Kampala: broadleaf (mango, jackfruit), the flat-topped umbrella acacia,
// tall cypress, and banana (matoke) plants. Each returns one path; trunks run 14 px into the
// ground so the silhouette joins the hill.
const circle = (cx, cy, r) => `M${f(cx - r)},${f(cy)}a${f(r)},${f(r)} 0 1,0 ${f(2 * r)},0a${f(r)},${f(r)} 0 1,0 ${f(-2 * r)},0Z`;

export const treeShape = (kind, x, y, s, r) => {
    if (kind === "acacia") {
        const lean = (r() - 0.5) * 10 * s;
        const top = y - 54 * s;
        let d = P([[x - 2.5 * s, y + 14], [x + lean - 2 * s, top + 8 * s], [x + lean - 26 * s, top + 2 * s], [x + lean - 24 * s, top - 1 * s], [x + lean, top + 4 * s], [x + lean + 22 * s, top - 2 * s], [x + lean + 24 * s, top + 1 * s], [x + lean + 3 * s, top + 8 * s], [x + 2.5 * s, y + 14]]);
        // flat crown: a few overlapping flattened lobes
        for (let i = 0; i < 6; i++) {
            const cx = x + lean + (i - 2.5) * 11 * s + (r() - 0.5) * 4 * s;
            const w = (14 + r() * 8) * s;
            d += ` M${f(cx - w)},${f(top + 2 * s)}a${f(w)},${f(w * 0.42)} 0 1,1 ${f(2 * w)},0Z`;
        }
        d += ` M${f(x + lean - 40 * s)},${f(top + 3 * s)}h${f(80 * s)}v${f(-5 * s)}h${f(-80 * s)}Z`;
        return d;
    }
    if (kind === "cypress") {
        const h = (62 + r() * 22) * s;
        const w = (9 + r() * 3) * s;
        return `M${f(x - 2 * s)},${f(y + 14)}V${f(y - 6 * s)}C${f(x - w * 1.4)},${f(y - h * 0.3)} ${f(x - w)},${f(y - h * 0.8)} ${f(x)},${f(y - h)}C${f(x + w)},${f(y - h * 0.8)} ${f(x + w * 1.4)},${f(y - h * 0.3)} ${f(x + 2 * s)},${f(y - 6 * s)}V${f(y + 14)}Z`;
    }
    if (kind === "banana") {
        const h = (30 + r() * 10) * s;
        let d = rectPath({ x: x - 2.5 * s, y: y - h, w: 5 * s, h: h + 14 });
        // drooping leaves: long tapered blades either side of the crown
        [[-1, 0.9], [1, 0.8], [-1, 0.35], [1, 0.3], [0.2, 1.2]].forEach(([dir, lift]) => {
            const len = (26 + r() * 10) * s;
            const tipX = x + dir * len;
            const tipY = y - h + (1.1 - lift) * 18 * s;
            d += ` M${f(x)},${f(y - h)}Q${f(x + dir * len * 0.5)},${f(y - h - 14 * s * lift)} ${f(tipX)},${f(tipY)}Q${f(x + dir * len * 0.45)},${f(y - h - 4 * s * lift)} ${f(x)},${f(y - h + 5 * s)}Z`;
        });
        return d;
    }
    // broadleaf: round crown of overlapping circles on a short trunk
    const h = (26 + r() * 10) * s;
    const R = (17 + r() * 7) * s;
    let d = P([[x - 3 * s, y + 14], [x - 2 * s, y - h], [x + 2 * s, y - h], [x + 3 * s, y + 14]]);
    d += circle(x, y - h - R * 0.6, R);
    for (let i = 0; i < 4; i++) {
        const a = (i / 4) * Math.PI * 2 + r();
        d += " " + circle(x + Math.cos(a) * R * 0.75, y - h - R * 0.6 + Math.sin(a) * R * 0.45, R * (0.55 + r() * 0.2));
    }
    return d;
};

// y of a ridge (its sampled points) at x — near enough to the drawn curve for planting
export const ridgeY = (pts, x) => {
    for (let i = 0; i < pts.length - 1; i++) {
        const [x0, y0] = pts[i];
        const [x1, y1] = pts[i + 1];
        if (x >= x0 && x <= x1) {
            const t = (x - x0) / (x1 - x0 || 1);
            const e = (1 - Math.cos(t * Math.PI)) / 2;
            return y0 + (y1 - y0) * e;
        }
    }
    return pts[pts.length - 1][1];
};

// Plant trees along a ridge in the given x ranges. Returns one path per tree (drawn as separate
// shapes so overlapping parts never cancel out under the fill rule).
export const plantTrees = ({ pts, seed, ranges, every = 70, scale = 1, kinds = ["broadleaf", "acacia", "cypress", "banana"], sink = 4 }) => {
    const r = random(seed);
    const out = [];
    ranges.forEach(([a, b]) => {
        for (let x = a + r() * every * 0.5; x < b; x += every * (0.55 + r() * 0.9)) {
            const kind = kinds[Math.floor(r() * kinds.length)];
            const s = scale * (0.75 + r() * 0.5);
            out.push(treeShape(kind, x, ridgeY(pts, x) + sink, s, r));
            if (r() < 0.3) out.push(treeShape("broadleaf", x + 14 * s, ridgeY(pts, x + 14 * s) + sink, s * 0.6, r)); // a young tree beside it
        }
    });
    return out;
};
