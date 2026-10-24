// Geometry for Hotel2D, the paper-cut drawing of the home page hotel. It is the same model as
// the 3D scene (hotel/hotelDay.js, hotelNight.js): the same boxes, torn sheets and noise, projected
// through the same hero camera (KEYS.hero, with the scene's portrait fit), then sorted back to
// front and written out as SVG paths. So the drawing lines up with the live model on any device.
// Everything is computed from fixed seeds: the output is the same on every visit.
//
// Units: one "composition" per orientation, in the viewBox units of the reference still
// (landscape 1600 × 1000, portrait 860 × 1800). Hotel2D picks the viewBox for the real screen.

// ---------- noise: the 3D scene's own functions, so torn edges match it point for point ----------
const hash = (x, y) => {
    const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
    return n - Math.floor(n);
};
const vnoise = (x, y) => {
    const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
    const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    const a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
};
const fbm = (x, y) => {
    let s = 0, a = 0.5, f = 1;
    for (let i = 0; i < 5; i++) { s += a * vnoise(x * f, y * f); f *= 2.03; a *= 0.5; }
    return s;
};
const seeded = (seed) => {
    let s = seed;
    return () => (s = (s * 16807) % 2147483647) / 2147483647;
};
const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
const TAU = Math.PI * 2;

// ---------- the model (same numbers as the 3D scene) ----------
const BAY = 3.6, NB = 6, X0 = -10.8, ZF = 6.5;
const LV = [0, 4.5, 7.9, 11.3, 14.7];
const RY = LV[4] + 0.36;
const CX0 = X0 + 4 * BAY, CX1 = X0 + 6 * BAY, CY0 = LV[1] + 0.36, CY1 = LV[3];
const isCut = (b, f) => b >= 4 && (f === 1 || f === 2);
const isDesign = (b, f) => b <= 1 && f === 3;
const MPX = 44 / 4096; // board: the A1 sheet, 44 m wide
const BOARD = { x0: -20.157, x1: 23.843, z0: -15.533, z1: 15.557 };
const sx = (px) => BOARD.x0 + px * MPX; // sheet px → model metres
const sz = (py) => BOARD.z0 + py * MPX;
// Light travels from the key light (-40, 30, 30) towards the origin, direction (40, -30, -30):
// a point's shadow moves 4/3 m right and 1 m back for every metre it drops (see ground(), glassShadow()).

// ---------- timing of the build-in (seconds; Hotel2D.css multiplies by --fc-motion-build) ----------
export const TIMING = {
    sheet: (i) => 0.05 + i * 0.16,     // six sheets rise back to front, 1.0 s each → done by ~1.85 s
    board: 1.4,                         // settles 1.4 → 2.2 s
    piece: (y, x) => 2.0 + clamp01(y / 18) * 2.2 + clamp01((x + 11) / 22) * 0.3, // + 0.55 s each → 2.0 … 4.95 s
    green: (x) => 4.6 + clamp01((x + 16) / 32) * 0.5, // + 0.65 s each → 4.6 … 5.8 s
    shadow: 4.3,
    lamps: 5.2,
};
const q = (t) => Math.round(t * 20) / 20; // delays in 0.05 s steps, so neighbouring pieces share a group

// ---------- camera: the hero keyframe, with the scene's portrait fit and view offset ----------
const COMP = {
    land: { w: 1600, h: 1000 },
    port: { w: 860, h: 1800 },
};
const camera = (kind) => {
    const T = [0.5, 6.5, 0], C0 = [31, 15, 38];
    const { w, h } = COMP[kind];
    const D = Math.PI / 180;
    let fov = 34, fit = 1, ax = w * 0.67, ay = h / 2;
    if (kind === "port") {
        const a = w / h, fm = Math.min(1.32, 1 + (1.5 - a) * 0.3), f = 17 * D;
        fov = 34 * fm;
        fit = ((Math.tan(f) * 1.25) / (Math.tan(f * fm) * a)) * 0.95;
        ax = w / 2;
        ay = h / 2 - h * 0.24;
    }
    const C = C0.map((c, i) => T[i] + (c - T[i]) * fit);
    const sub = (p, o) => [p[0] - o[0], p[1] - o[1], p[2] - o[2]];
    const dot = (p, o) => p[0] * o[0] + p[1] * o[1] + p[2] * o[2];
    const nrm = (p) => { const l = Math.hypot(p[0], p[1], p[2]); return [p[0] / l, p[1] / l, p[2] / l]; };
    const fw = nrm(sub(T, C));
    const rt = nrm([-fw[2], 0, fw[0]]); // fw × up
    const up = [rt[1] * fw[2] - rt[2] * fw[1], rt[2] * fw[0] - rt[0] * fw[2], rt[0] * fw[1] - rt[1] * fw[0]];
    const k = h / 2 / Math.tan((fov * D) / 2);
    const p = (x, y, z) => {
        const v = [x - C[0], y - C[1], z - C[2]];
        const d = Math.max(0.5, dot(v, fw));
        return [ax + (dot(v, rt) / d) * k, ay - (dot(v, up) / d) * k, d];
    };
    // horizon of the floor plane, and pixels per metre at the hotel
    const pitch = Math.asin(-fw[1]);
    return { C, rt, k, p, w, h, horizon: ay - Math.tan(pitch) * k, ppm: k / dot(sub(T, C), fw) };
};

// ---------- path writing: rounded absolute points, relative moves, so the markup stays small ----------
const num = (v) => {
    let s = String(v);
    if (s.startsWith("0.")) s = s.slice(1);
    else if (s.startsWith("-0.")) s = "-" + s.slice(2);
    return s;
};
const add = (s, t) => s + (t[0] === "-" || /[a-zA-Z]$/.test(s) ? "" : " ") + t;
export const enc = (pts, close = true, dec = 1) => {
    const m = dec ? 10 : 1;
    let s = "", px = 0, py = 0;
    pts.forEach((pt, i) => {
        const x = Math.round(pt[0] * m), y = Math.round(pt[1] * m);
        if (i === 0) s = add("M" + num(x / m), num(y / m)) + "l";
        else { s = add(s, num((x - px) / m)); s = add(s, num((y - py) / m)); }
        px = x; py = y;
    });
    if (pts.length === 1) s = s.slice(0, -1);
    return close ? s + "z" : s;
};
// polygon area in screen units (to skip faces that would be invisible)
const area = (pts) => {
    let a = 0;
    for (let i = 0; i < pts.length; i++) { const p = pts[i], o = pts[(i + 1) % pts.length]; a += p[0] * o[1] - o[0] * p[1]; }
    return Math.abs(a / 2);
};
const hull = (points) => {
    const P = points.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    if (P.length < 3) return P;
    const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
    const lo = [], hi = [];
    for (const p of P) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); }
    for (let i = P.length - 1; i >= 0; i--) { const p = P[i]; while (hi.length >= 2 && cr(hi[hi.length - 2], hi[hi.length - 1], p) <= 0) hi.pop(); hi.push(p); }
    return lo.slice(0, -1).concat(hi.slice(0, -1));
};
// a closed outline of quadratic curves, relative, from rounded absolute points
const quads = (start, segs) => {
    const r = (v) => Math.round(v * 10);
    let px = r(start[0]), py = r(start[1]);
    let s = add("M" + num(px / 10), num(py / 10)) + "q";
    segs.forEach(([c, e]) => {
        const cx = r(c[0]), cy = r(c[1]), ex = r(e[0]), ey = r(e[1]);
        [cx - px, cy - py, ex - px, ey - py].forEach((v) => (s = add(s, num(v / 10))));
        px = ex; py = ey;
    });
    return s + "z";
};
// Sutherland–Hodgman against an axis-aligned rectangle [x0,x1] × [y0,y1]
const clipRect = (poly, x0, x1, y0, y1) => {
    const edge = (pts, inside, cut) => {
        const out = [];
        for (let i = 0; i < pts.length; i++) {
            const a = pts[i], b = pts[(i + 1) % pts.length], ia = inside(a), ib = inside(b);
            if (ia) out.push(a);
            if (ia !== ib) out.push(cut(a, b));
        }
        return out;
    };
    const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
    let p = poly;
    p = edge(p, (v) => v[0] >= x0, (a, b) => lerp(a, b, (x0 - a[0]) / (b[0] - a[0])));
    if (p.length) p = edge(p, (v) => v[0] <= x1, (a, b) => lerp(a, b, (x1 - a[0]) / (b[0] - a[0])));
    if (p.length) p = edge(p, (v) => v[1] >= y0, (a, b) => lerp(a, b, (y0 - a[1]) / (b[1] - a[1])));
    if (p.length) p = edge(p, (v) => v[1] <= y1, (a, b) => lerp(a, b, (y1 - a[1]) / (b[1] - a[1])));
    return p;
};

// ---------- the drawing ----------
export const buildHotel2D = (kind, edition) => {
    const night = edition === "night";
    const cam = camera(kind);
    const { p, C } = cam;
    const P = (v) => p(v[0], v[1], v[2]);
    const tree = seeded(777); // tree shapes are the same in both editions
    const S = (v) => [v[0], v[1]];
    const ground = (x, y, z) => p(x + (4 / 3) * y, 0.01, z - y); // a point's shadow on the board
    const xMin = kind === "land" ? -1300 : -700, xMax = kind === "land" ? 2900 : 1560;

    // ===== back layer: floor, torn sheets, scraps, stars =====
    const back = {};
    back.horizon = cam.horizon;
    const sheetsDay = [[300, 36, 12, 1.3, -46], [280, 29, 11, 4.1, -40], [260, 22, 9, 7.7, -34], [240, 15.5, 8, 2.2, -28.5], [220, 9.5, 6, 5.6, -23.5], [200, 4.5, 4.5, 9.9, -19]];
    const sheetsNight = [[300, 27, 10, 1.3, -46], [280, 22, 9, 4.1, -40], [260, 16.5, 7.5, 7.7, -34], [240, 11.5, 6.5, 2.2, -28.5], [220, 7.2, 5, 5.6, -23.5], [200, 3.8, 3.8, 9.9, -19]];
    back.sheets = (night ? sheetsNight : sheetsDay).map(([width, topY, amp, seed, z], si) => {
        const n = 220, x0 = -width / 2, edge = [], rim = [];
        for (let i = 0; i <= n; i++) {
            const x = x0 + (width * i) / n;
            const base = topY + (fbm(x * 0.035 + seed, seed * 0.3) - 0.5) * amp * 2;
            edge.push([x, base + (hash(i, seed) - 0.5) * 0.35]);
            rim.push([x, base + 0.45 + hash(i + 7, seed) * 0.55]);
        }
        const step = si < 3 ? 2 : 1; // the far sheets need half the points
        const outline = (pts) => {
            const sp = pts.filter((_, i) => i % step === 0 || i === pts.length - 1).map(([x, y]) => S(p(x, y, z)));
            pts = pts.filter((_, i) => i % step === 0 || i === pts.length - 1);
            let a = 0, b = sp.length - 1;
            while (a < b && sp[a + 1][0] < xMin) a++;
            while (b > a && sp[b - 1][0] > xMax) b--;
            const top = sp.slice(a, b + 1);
            const bl = S(p(pts[a][0], -0.8, z)), br = S(p(pts[b][0], -0.8, z));
            return { pts: top.concat([br, bl]), x0: pts[a][0], x1: pts[b][0] };
        };
        const e = outline(edge), r = outline(rim);
        const bl = S(p(e.x0, -0.8, z)), br = S(p(e.x1, -0.8, z));
        // the strip above this sheet's foot, so a rising sheet comes up out of the floor
        const clip = enc([[bl[0], bl[1]], [br[0], br[1]], [br[0], br[1] - 4000], [bl[0], bl[1] - 4000]], true, 0);
        return { d: enc(e.pts, true, 0), rim: enc(r.pts, true, 0), clip, i: si + 1, delay: TIMING.sheet(si), rise: Math.round(cam.k / Math.abs(z - C[2]) * 30) };
    });
    // the floor in front of the sheets: from the horizon down, lighter towards the viewer
    back.floor = enc([[xMin - 2000, cam.horizon], [xMax + 2000, cam.horizon], [xMax + 2000, cam.h * 4], [xMin - 2000, cam.h * 4]], true, 0);

    // drifting paper scraps of the 3D scene, held still
    back.scraps = [[-30, 22, -8, 0.5, "o"], [-27, 8, 4, 0.4, "w"], [-9, 25, -10, 0.45, "w"], [-3, 21.5, -6, 0.35, "n"], [16, 25, -12, 0.42, "o"], [24, 17, -10, 0.4, "w"], [-18, 15, 8, 0.32, "n"]].map(([x, y, z, r, m], i) => {
        const r2 = seeded(31 + i * 7), k = 5 + ((r2() * 3) | 0), pts = [];
        for (let j = 0; j < k; j++) {
            const a = (j / k) * TAU + r2() * 0.4, rr = r * (0.6 + r2() * 0.6);
            pts.push(S(p(x + Math.cos(a) * rr * cam.rt[0], y + Math.sin(a) * rr, z + Math.cos(a) * rr * cam.rt[2])));
        }
        return { d: enc(pts), m };
    });

    // night: paper stars across the sky and five hanging from threads (the 3D mobile)
    if (night) {
        const star = (cx, cy, r, pts, rot) => {
            const out = [];
            for (let i = 0; i < pts * 2; i++) { const a = rot - Math.PI / 2 + (i / (pts * 2)) * TAU, rr = i % 2 ? r * (pts === 5 ? 0.45 : 0.3) : r; out.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]); }
            return out;
        };
        const sr = seeded(97), small = [], warm = [];
        const wide = kind === "land" ? [xMin, xMax] : [-300, 1160];
        const top = kind === "land" ? [-260, 330] : [-300, 470];
        for (let i = 0; i < (kind === "land" ? 70 : 46); i++) {
            const x = wide[0] + sr() * (wide[1] - wide[0]);
            const y = top[0] + Math.pow(sr(), 0.85) * (top[1] - top[0]);
            const big = sr() < 0.22, r = (big ? 6 + sr() * 3.5 : 2.4 + sr() * 2.2) * (kind === "land" ? 1 : 1.15);
            (sr() < 0.3 ? warm : small).push(enc(star(x, y, r, sr() < 0.6 ? 5 : 4, sr() * 6), true, 1));
        }
        const threads = [], hung = [];
        [[-19, 19, -16, 0.55], [-10, 21.5, -17, 0.42], [5, 20.2, -15.5, 0.5], [16, 22, -17.5, 0.4], [26, 18.6, -16.5, 0.48]].forEach(([x, y, z, s]) => {
            const a = S(p(x, 40, z)), b = S(p(x, y + s, z)), c = p(x, y, z);
            threads.push(enc([a, b], false, 1));
            hung.push(enc(star(c[0], c[1], (s * cam.k) / c[2], 5, 0.2), true, 1));
        });
        back.stars = { small: small.join(""), warm: warm.join(""), threads: threads.join(""), hung: hung.join("") };
    }

    // ===== front layer =====
    const front = { ppm: cam.ppm };

    // --- the board: the A1 sheet the model stands on ---
    const faces = (b) => {
        // visible faces of an axis-aligned box: [shade, corners]
        const { x0, x1, y0, y1, z0, z1 } = b, out = [];
        if (C[2] > z1) out.push(["f", [[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]]]);
        if (C[0] > x1) out.push(["s", [[x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1]]]);
        if (C[1] > y1) out.push(["t", [[x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0]]]);
        if (C[1] < y0) out.push(["u", [[x0, y0, z1], [x1, y0, z1], [x1, y0, z0], [x0, y0, z0]]]);
        return out.map(([s, c]) => [s, c.map((v) => S(P(v)))]).filter(([, c]) => area(c) > 0.8);
    };
    const B = (x0, x1, y0, y1, z0, z1, m) => ({ x0, x1, y0, y1, z0, z1, m });
    const BC = (w, h, d, x, y, z, m) => B(x - w / 2, x + w / 2, y - h / 2, y + h / 2, z - d / 2, z + d / 2, m);
    front.board = faces(B(BOARD.x0, BOARD.x1, -0.8, 0, BOARD.z0, BOARD.z1, "b")).map(([s, c]) => ({ cls: `b ${s}`, d: enc(c) }));

    // --- the printed site plan: grid, plot boundary, setback, grass, dimension, title block ---
    const Y0 = 0.01;
    const line = (pts) => enc(pts.map(([x, z]) => S(p(x, Y0, z))), false, 1);
    const seg = (x0, z0, x1, z1) => line([[x0, z0], [x1, z1]]);
    const rect = (x0, z0, x1, z1) => enc([[x0, z0], [x1, z0], [x1, z1], [x0, z1]].map(([x, z]) => S(p(x, Y0, z))), true, 1);
    const circle = (cx, cz, r, n = 14) => enc(Array.from({ length: n }, (_, i) => S(p(cx + Math.cos((i / n) * TAU) * r, Y0, cz + Math.sin((i / n) * TAU) * r))), true, 1);
    const print = { fine: "", grid: "", strong: "", acc: "", green: "", ink: "", greenFill: "", contour: "" };
    const F = { x0: sx(274), x1: sx(3479), z0: sz(186), z1: sz(2706) };
    for (let x = F.x0 + 1.8; x < F.x1; x += 1.8) print.fine += seg(x, F.z0, x, F.z1);
    for (let z = F.z0 + 1.8; z < F.z1; z += 1.8) print.fine += seg(F.x0, z, F.x1, z);
    const gx = [-10.8, -7.2, -3.6, 0, 3.6, 7.2, 10.8], gz = [-6.5, -1, 6.5];
    gx.forEach((x) => { print.grid += seg(x, -11.6, x, 11.0); print.acc += circle(x, -12.5, 0.32); });
    gz.forEach((z) => { print.grid += seg(-15.2, z, 15.6, z); print.acc += circle(-16.3, z, 0.32); });
    print.strong += rect(-16.9, -13.2, 16.9, 13.2);
    print.acc += rect(-12.6, -8.4, 12.6, 9.0);
    print.ink += seg(-10.8, 13.0, 10.8, 13.0) + seg(-11.0, 13.2, -10.6, 12.8) + seg(10.6, 13.2, 11.0, 12.8);
    for (let k = 0; k < 6; k++) print.ink += seg(-15.6 + k * 2.5, 9.2, -15.6 + k * 2.5, 12.0);
    print.ink += seg(-15.6, 12.0, -3.1, 12.0);
    // the sheet's frame and title block
    print.ink += rect(BOARD.x0 + 0.45, BOARD.z0 + 0.45, BOARD.x1 - 0.45, BOARD.z1 - 0.45) + rect(F.x0, F.z0, F.x1, F.z1);
    const TB = { x0: F.x1 + 0.5, x1: BOARD.x1 - 0.9 };
    print.ink += rect(TB.x0, F.z0, TB.x1, F.z1);
    [0.42, 0.62, 0.74, 0.84, 0.92].forEach((t) => (print.ink += seg(TB.x0, F.z0 + (F.z1 - F.z0) * t, TB.x1, F.z0 + (F.z1 - F.z0) * t)));
    print.ink += seg((TB.x0 + TB.x1) / 2, F.z0 + (F.z1 - F.z0) * 0.84, (TB.x0 + TB.x1) / 2, F.z1);
    const GRASS = [[11.9, 16.6, -12.8, 8.6], [-16.6, -11.9, -6.4, 8.2], [-9.9, -7.4, -12.9, -7.9], [9.9, 11.7, -12.9, -7.9]];
    GRASS.forEach(([x0, x1, z0, z1]) => { print.green += rect(x0, z0, x1, z1); print.greenFill += rect(x0, z0, x1, z1); });
    // printed contour lines across the back of the plot
    for (let c = 0; c < 5; c++) {
        const pts = [];
        for (let x = F.x0 + 0.3; x <= F.x1 - 0.3; x += 0.9) pts.push([x, -12.6 + c * 0.75 + (fbm(x * 0.12 + c * 1.7, c) - 0.5) * 2.2]);
        print.contour += line(pts);
    }
    front.print = print;

    // grass tufts (the 3D scene's paper blades) as small V cuts
    const tufts = ["", "", ""];
    GRASS.forEach(([x0, x1, z0, z1], gi) => {
        const n = Math.round((x1 - x0) * (z1 - z0) * 0.2);
        const tr = seeded(400 + gi);
        for (let i = 0; i < n; i++) {
            const x = x0 + 0.4 + tr() * (x1 - x0 - 0.8), z = z0 + 0.4 + tr() * (z1 - z0 - 0.8), h = 0.35 + tr() * 0.3;
            const b = S(p(x, 0, z)), l = S(p(x - 0.16, h, z)), m2 = S(p(x + 0.02, h * 1.25, z)), r = S(p(x + 0.18, h * 0.9, z));
            const w = Math.max(0.5, (0.035 * cam.k) / p(x, 0, z)[2]);
            tufts[(tr() * 3) | 0] += enc([[b[0] - w, b[1]], l, [b[0], b[1] - w * 2], m2, [b[0] + w * 0.6, b[1] - w * 2], r, [b[0] + w, b[1]]], true, 1);
        }
    });
    front.tufts = tufts;

    // laser-cut contour layers at the back corner of the board
    front.contours = [];
    for (let c = 0; c < 4; c++) {
        const r = 2.5 - c * 0.55, seed = 3 + c * 0.7, ring = (y) => Array.from({ length: 28 }, (_, i) => {
            const a = (i / 28) * TAU, rr = r * (0.75 + fbm(Math.cos(a) * 1.5 + seed, Math.sin(a) * 1.5 + seed) * 0.5);
            return S(p(13.6 + Math.cos(a) * rr, y, -11.2 + Math.sin(a) * rr * 0.7));
        });
        front.contours.push({ cls: `${c % 2 ? "w" : "w2"} s`, d: enc(hull(ring(0.36 * c).concat(ring(0.36 * (c + 1))))) });
        front.contours.push({ cls: `${c % 2 ? "w" : "w2"} t`, d: enc(ring(0.36 * (c + 1))) });
    }

    // --- shadows on the board (one path, so overlaps never darken twice) ---
    let shadow = "";
    const castBox = (b) => {
        const pts = [];
        for (const x of [b.x0, b.x1]) for (const y of [b.y0, b.y1]) for (const z of [b.z0, b.z1]) pts.push(S(ground(x, y, z)));
        shadow += enc(hull(pts));
    };
    castBox(B(-11.2, 11.2, 0, 15.96, -6.9, 6.9));
    castBox(B(-7.2, 1.2, 15, 18.26, -4.9, 1.3));
    castBox(B(2.8, 10.8, 15, 18.14, -0.5, 4.5));
    castBox(B(-4.2, 4.2, 4.04, 4.26, 6.4, 9.8));
    [-3.8, 3.8].forEach((x) => castBox(BC(0.18, 4, 0.18, x, 2, ZF + 3.1)));

    // ===== the hotel, back to front =====
    // pieces: { delay, items: [{ cls, d }] } in painter's order
    const pieces = [];
    let cur = null;
    // Faces join an earlier path of the same class when nothing drawn in between overlaps them,
    // so the painter's order is kept with far fewer elements. bb: the face's screen bounding box.
    const bbox = (pts) => {
        const b = [Infinity, Infinity, -Infinity, -Infinity];
        pts.forEach(([x, y]) => { if (x < b[0]) b[0] = x; if (y < b[1]) b[1] = y; if (x > b[2]) b[2] = x; if (y > b[3]) b[3] = y; });
        return b;
    };
    const hits = (a, b) => !a || !b || (a[0] < b[2] && b[0] < a[2] && a[1] < b[3] && b[1] < a[3]);
    const put = (delay, cls, d, bb) => {
        if (!d) return;
        const dl = q(delay);
        if (!cur || cur.delay !== dl) { cur = { delay: dl, items: [] }; pieces.push(cur); }
        for (let i = cur.items.length - 1; i >= 0; i--) {
            const it = cur.items[i];
            if (it.cls === cls) {
                it.d += d;
                it.bb = it.bb && bb ? [Math.min(it.bb[0], bb[0]), Math.min(it.bb[1], bb[1]), Math.max(it.bb[2], bb[2]), Math.max(it.bb[3], bb[3])] : null;
                return;
            }
            if (hits(it.bb, bb)) break;
        }
        cur.items.push({ cls, d, bb });
    };
    const drawBox = (b, delayY) => {
        const dl = TIMING.piece(delayY ?? b.y0, (b.x0 + b.x1) / 2);
        faces(b).forEach(([s, c]) => put(dl, `${b.m} ${s}`, enc(c), bbox(c)));
    };
    const poly3 = (pts) => enc(pts.map((v) => S(P(v))));
    // a wireframe box: every edge (it is see-through) and a faint fill
    const wireBox = (b) => {
        const v = [];
        for (const x of [b.x0, b.x1]) for (const y of [b.y0, b.y1]) for (const z of [b.z0, b.z1]) v.push(S(p(x, y, z)));
        const E = [[0, 1], [2, 3], [4, 5], [6, 7], [0, 2], [1, 3], [4, 6], [5, 7], [0, 4], [1, 5], [2, 6], [3, 7]];
        const dl = TIMING.piece(b.y0, (b.x0 + b.x1) / 2);
        put(dl, "wf", enc(hull(v)));
        put(dl, "wi", E.map(([a, c]) => enc([v[a], v[c]], false, 1)).join(""));
    };
    // glass panes: day shades, or a lit / dark window at night
    const winR = seeded(53);
    const pane = (f, b) => {
        if (!night) return f === 0 ? "g1" : (b + f) % 3 ? "g1" : "g2";
        const r = winR();
        return r < 0.42 ? "l1" : r < 0.6 ? "l2" : r < 0.7 ? "l3" : r < 0.8 ? "lc" : "ld";
    };
    // shadows cast on a glass pane (plane z = zp, rectangle in x, y): slabs, balconies, fins, canopy
    const glassShadow = (zp, x0, x1, y0, y1, occluders, delay) => {
        let d = "";
        occluders.forEach((o) => {
            if (o.z1 <= zp) return;
            const z0 = Math.max(o.z0, zp), pts = [];
            for (const x of [o.x0, o.x1]) for (const y of [o.y0, o.y1]) for (const z of [z0, o.z1]) pts.push([x + (4 / 3) * (z - zp), y - (z - zp)]);
            const c = clipRect(hull(pts), x0, x1, y0, y1);
            if (c.length > 2) d += enc(c.map(([x, y]) => S(p(x, y, zp))));
        });
        if (d) put(delay, night ? "gs gsn" : "gs", d);
    };

    // the creeper climbing the back wall shows at the back right corner
    {
        const cr = seeded(19), leaves = ["", "", ""];
        for (let y = 0.3; y < 13.4; y += 0.42) {
            const spread = 0.25 + (1 - y / 13.6) * 0.5;
            for (let k = 0; k < 3; k++) {
                const x = 10.95 + cr() * (0.35 + spread * 0.5), z = -6.75 - cr() * 0.3, c = p(x, y + cr() * 0.3, z), r = (0.32 * cam.k) / c[2];
                leaves[(cr() * 3) | 0] += leafPath(c[0], c[1], r, cr() * TAU);
            }
        }
        const dl = TIMING.green(11);
        front.creeper = { delay: q(dl), d: leaves };
    }

    // slab with its top cut back to the side wall's inner face (the wall stands there)
    const slab = (y, z0 = -6.9, z1 = 6.9) => {
        const dl = TIMING.piece(y, 0);
        faces(B(-11.2, 11.2, y, y + 0.36, z0, z1)).forEach(([s, c]) => {
            if (s === "t") c = [[-11.2, y + 0.36, z1], [10.75, y + 0.36, z1], [10.75, y + 0.36, z0], [-11.2, y + 0.36, z0]].map((v) => S(P(v)));
            put(dl, `w ${s}`, enc(c), bbox(c));
        });
    };
    // the side wall, floor by floor, with its punched windows
    const sideWall = (y0, y1, f) => {
        // the left wall only shows its front edge (beside the wire bays it's the building's edge)
        put(TIMING.piece(y0, -11), "w f", poly3([[-11.15, y0, 6.7], [-10.75, y0, 6.7], [-10.75, y1, 6.7], [-11.15, y1, 6.7]]));
        drawBox(B(10.75, 11.15, y0, y1, -6.7, 6.7, "w"), y0);
        if (f >= 1) for (let k = 0; k < 3; k++) drawBox(BC(0.08, 1.9, 1.5, 11.17, LV[f] + 1.6, -4 + k * 4, pane(f, k + 3)), y0);
    };
    // the interior behind an opening: back wall, left wall and the floor of that storey
    const interior = (f, x0, x1) => {
        // interiors come in with the slab above them, so a room never shows without its ceiling
        const y0 = LV[f] + 0.36, y1 = LV[f + 1], dl = TIMING.piece(y1, 11), m = night ? "in" : "id";
        put(dl, `${m} s`, poly3([[-10.75, y0, -6.3], [-10.75, y0, 5.9], [-10.75, y1, 5.9], [-10.75, y1, -6.3]]));
        put(dl, `${m} f`, poly3([[-10.75, y0, -6.3], [x1, y0, -6.3], [x1, y1, -6.3], [-10.75, y1, -6.3]]));
    };
    // guest rooms in the cutaway
    const rooms = (cf) => {
        const fy = LV[cf] + 0.36, fh = LV[cf + 1] - fy, m = night ? "in" : "id", cy2 = LV[cf + 1];
        const dl = TIMING.piece(cy2, 11);
        put(dl, `${m} f`, poly3([[CX0 - 4, fy, -1], [CX1, fy, -1], [CX1, fy + fh, -1], [CX0 - 4, fy + fh, -1]]));
        put(dl, `${m} s`, poly3([[CX0 - 4, fy, -1], [CX0 - 4, fy, 5.9], [CX0 - 4, fy + fh, 5.9], [CX0 - 4, fy + fh, -1]]));
        drawBox(BC(0.15, fh, 7.0, CX0 + BAY, fy + fh / 2, 2.4, night ? "inw" : "w2"), cy2);
        for (let cb = 0; cb < 2; cb++) {
            const rx = CX0 + BAY / 2 + cb * BAY;
            drawBox(BC(0.85, 2.1, 0.06, rx + 1.1, fy + 1.05, -0.93, "r"), cy2);
            drawBox(BC(1.7, 1.1, 0.12, rx, fy + 0.85, -0.85, "n"), cy2);
            drawBox(BC(0.45, 0.45, 0.4, rx - 1.25, fy + 0.22, -0.55, "w"), cy2);
            const lamp = p(rx - 1.25, fy + 0.75, -0.55);
            put(dl, "lamp", enc(Array.from({ length: 10 }, (_, i) => [lamp[0] + Math.cos((i / 10) * TAU) * (0.17 * cam.k) / lamp[2], lamp[1] + Math.sin((i / 10) * TAU) * (0.17 * cam.k) / lamp[2]])));
            drawBox(BC(1.6, 0.45, 2.0, rx, fy + 0.225, 0.2, "w"), cy2);
            drawBox(BC(1.64, 0.12, 1.1, rx, fy + 0.5, 0.75, (cb + cf) % 2 ? "o" : "r"), cy2);
            drawBox(BC(0.06, 0.75, 0.5, rx + 1.5, fy + 0.375, 3.6, "w"), cy2);
            drawBox(BC(1.1, 0.06, 0.5, rx + 1.0, fy + 0.75, 3.6, "w"), cy2);
        }
    };
    // the torn façade over the cutaway: three sheets, each with a ragged hole (the 3D tornHole)
    const tornSheet = (inset, seed, rough, z, m) => {
        const pts = [], n = 60;
        const cx = (CX0 + CX1) / 2, cy = (CY0 + CY1) / 2, hw = (CX1 - CX0) / 2 - inset, hh = (CY1 - CY0) / 2 - inset;
        for (let i = 0; i < n * 4; i++) {
            const side = Math.floor(i / n), t = (i % n) / n;
            let x, y;
            if (side === 0) { x = -hw + 2 * hw * t; y = -hh; }
            else if (side === 1) { x = hw; y = -hh + 2 * hh * t; }
            else if (side === 2) { x = hw - 2 * hw * t; y = hh; }
            else { x = -hw; y = hh - 2 * hh * t; }
            const k = 1 - 0.18 * Math.pow(Math.abs(Math.sin((i / (n * 4)) * Math.PI * 4)), 2);
            const j = (fbm(i * 0.11 + seed, seed) - 0.5) * rough + (hash(i, seed) - 0.5) * rough * 0.25;
            if (i % 2 === 0) pts.push(S(p(cx + x * k + (side % 2 ? j : 0), cy + y * k + (side % 2 ? 0 : j), z)));
        }
        const outer = [[CX0, CY0], [CX1, CY0], [CX1, CY1], [CX0, CY1]].map(([x, y]) => S(p(x, y, z)));
        put(TIMING.piece(LV[2], 11), `${m} f`, enc(outer) + enc(pts.reverse()));
    };

    // === draw order ===
    // floors bottom-up: slab, interior, glass, side wall, then fins and balconies left to right
    for (let f = 0; f <= 3; f++) {
        // the second-floor slab is split at the torn sheets: its back part goes in before the rooms
        // above it (seen through the tear), its front lip after the sheets
        if (f === 2) slab(LV[2], 5.5);
        else slab(LV[f]);
        const y0 = LV[f] + 0.36, y1 = LV[f + 1], hgt = y1 - y0, ym = (y0 + y1) / 2;
        if (f === 0) {
            // ground floor: lobby glass, door, mullions, then the side wall, columns and the canopy
            drawBox(B(-10.7, 10.7, 0.15, 4.25, 5.91, 5.99, night ? "lobby" : "g1"), y0);
            glassShadow(5.99, -10.7, 10.7, 0.15, 4.25, [B(-11.2, 11.2, 4.5, 4.86, -6.9, 6.9), B(-4.2, 4.2, 4.04, 4.26, 6.4, 9.8), ...Array.from({ length: 6 }, (_, b) => BC(0.45, 4.5, 0.45, X0 + b * BAY, 2.25, ZF - 0.1))], TIMING.piece(y0, 0));
            drawBox(BC(2.6, 2.6, 0.08, 0, 1.3, ZF - 0.5, "n"), y0);
            drawBox(BC(0.12, 4.1, 0.2, -3.6, 2.2, ZF - 0.5, "w"), y0);
            drawBox(BC(0.12, 4.1, 0.2, 3.6, 2.2, ZF - 0.5, "w"), y0);
            sideWall(0.36, LV[1], 0);
            for (let b = 0; b < NB; b++) drawBox(BC(0.45, 4.5, 0.45, X0 + b * BAY, 2.25, ZF - 0.1, "w"), y0);
            drawBox(BC(0.18, 4.0, 0.18, -3.8, 2.0, ZF + 3.1, "w"), y0);
            drawBox(BC(0.18, 4.0, 0.18, 3.8, 2.0, ZF + 3.1, "w"), y0);
            drawBox(BC(8.4, 0.22, 3.4, 0, 4.15, ZF + 1.6, "w"), 3.0);
            continue;
        }
        if (f === 1) { interior(1, CX0, CX1); rooms(1); slab(LV[2], -6.9, 5.5); interior(2, CX0, CX1); rooms(2); }
        if (f === 3) interior(3, X0, X0 + 2 * BAY);
        if (f === 1) {
            tornSheet(1.7, 9.3, 1.0, ZF - 0.86 + 0.05, "o");
            tornSheet(1.3, 5.1, 1.2, ZF - 0.72 + 0.05, "n");
            tornSheet(0.95, 2.7, 1.45, ZF - 0.56 + 0.08, "w");
        }
        // glass first, with the shadows the floor above and the fins throw on it
        for (let b = 0; b < NB; b++) {
            if (isCut(b, f) || isDesign(b, f)) continue;
            const xc = X0 + BAY / 2 + b * BAY, gb = B(xc - 1.65, xc + 1.65, ym - (hgt - 0.1) / 2, ym + (hgt - 0.1) / 2, 5.91, 5.99, pane(f, b));
            drawBox(gb, y0);
            const occ = [B(-11.2, 11.2, y1, y1 + 0.36, -6.9, 6.9)];
            if (f < 3) for (let k = Math.max(0, b - 1); k <= b; k++) {
                const xk = X0 + BAY / 2 + k * BAY;
                if (!isCut(k, f + 1)) occ.push(B(xk - 1.6, xk + 1.6, y1 + 0.335, y1 + 0.485, 6.45, 7.75), B(xk - 1.6, xk + 1.6, y1 + 0.46, y1 + 1.46, 7.69, 7.75));
            } else occ.push(B(-11.2, 11.2, RY, RY + 0.9, 6.71, 6.89));
            for (let fn = 0; fn <= b; fn++) occ.push(B(X0 + fn * BAY - 0.14, X0 + fn * BAY + 0.14, y0, y1, 6.0, 7.6));
            if (f < 3) for (let fn = 0; fn <= b; fn++) occ.push(B(X0 + fn * BAY - 0.14, X0 + fn * BAY + 0.14, y1 + 0.36, y1 + 3, 6.0, 7.6));
            glassShadow(5.99, gb.x0, gb.x1, gb.y0, gb.y1, occ, TIMING.piece(y0, xc));
        }
        sideWall(y0, y1, f);
        if (f === 3) {
            drawBox(BC(0.4, LV[4] - LV[3], 0.4, X0 + 0.2, (LV[3] + LV[4]) / 2, ZF - 0.3, "w"), y0);
            drawBox(BC(0.4, LV[4] - LV[3], 0.4, X0 + 2 * BAY, (LV[3] + LV[4]) / 2, ZF - 0.3, "w"), y0);
        }
        // fins and balconies, left to right
        for (let fn = 0; fn <= NB; fn++) {
            const xf = X0 + fn * BAY;
            const finOn = !((f === 1 || f === 2) && fn >= 5);
            if (finOn) {
                const fb = B(xf - 0.14, xf + 0.14, y0 - 0.36, y1, fn === NB ? 6.7 : 6.0, 7.6, "w");
                if (f === 3 && fn <= 1) wireBox(fb);
                else drawBox(fb, y0);
            }
            if (fn === NB) break;
            const xc = X0 + BAY / 2 + fn * BAY;
            if (isCut(fn, f)) continue;
            const flo = B(xc - 1.6, xc + 1.6, y0 - 0.025, y0 + 0.125, 6.45, 7.75, "w");
            const rail = B(xc - 1.6, xc + 1.6, y0 + 0.1, y0 + 1.1, 7.69, 7.75, "w");
            if (isDesign(fn, f)) {
                wireBox(B(xc - 1.65, xc + 1.65, ym - (hgt - 0.1) / 2, ym + (hgt - 0.1) / 2, 5.91, 5.99));
                wireBox(flo);
                wireBox(rail);
                continue;
            }
            drawBox(flo, y0);
            if ((fn * 7 + f * 3) % 5 === 0) drawBox(BC(1.0, 0.35, 0.35, xc + 0.9, y0 + 0.32, ZF + 0.95, "o"), y0);
            drawBox(rail, y0);
        }
        // the fin framing the cutaway, over both floors
        if (f === 2) drawBox(B(CX1 - 0.14, CX1 + 0.14, LV[1], CY1, 6.7, 7.6, "w"), LV[1]);
    }
    const roofSlab = B(-11.2, 11.2, LV[4], RY, -6.9, 6.9, "w");
    // rooftop, after the floors: slab, back parapet, tanks, pavilion, pergola, then the front parapet
    const roof = () => {
        drawBox(roofSlab);
        drawBox(B(-11.2, 11.2, RY, RY + 0.9, -6.69, -6.51, "w"));
        [[7.5, -4.2], [9.4, -4.2]].forEach(([x, z]) => {
            const ring = (y) => Array.from({ length: 20 }, (_, i) => S(p(x + Math.cos((i / 20) * TAU) * 0.75, y, z + Math.sin((i / 20) * TAU) * 0.75)));
            const dl = TIMING.piece(RY, x);
            put(dl, "cyl", enc(hull(ring(RY).concat(ring(RY + 1.8)))));
            if (C[1] > RY + 1.8) put(dl, "w t", enc(ring(RY + 1.8)));
        });
        drawBox(B(-7.2, 1.2, RY, RY + 3.2, -4.9, 1.3, "w"));
        const pav = B(-7, 1, RY + 0.2, RY + 2.8, 1.29, 1.37, night ? "l1" : "g1");
        drawBox(pav, RY);
        for (let k = 0; k < 9; k++) drawBox(BC(0.16, 0.16, 5, 3.4 + k * 0.85, RY + 3.0, 2.0, "w"));
        drawBox(BC(8.0, 0.16, 0.16, 6.8, RY + 3.0, 4.4, "w"));
        drawBox(BC(0.16, 3.0, 0.16, 3.2, RY + 1.5, 4.4, "w"));
        drawBox(BC(0.16, 3.0, 0.16, 10.2, RY + 1.5, 4.4, "w"));
    };
    roof();
    drawBox(B(-11.2, 11.2, RY, RY + 0.9, 6.71, 6.89, "w"));
    pieces.forEach((pc) => pc.items.forEach((it) => delete it.bb));
    front.pieces = pieces;

    // ===== landscape: trees, shrubs, hedges, figures (sorted by depth around the building) =====
    const items = [];
    const ppmAt = (x, y, z) => cam.k / p(x, y, z)[2];
    // billboard point: lx metres to the camera's right, y up
    const bb = (x, z, lx, y) => S(p(x + cam.rt[0] * lx, y, z + cam.rt[2] * lx));
    const shadowOf = (pts3) => (shadow += enc(hull(pts3.map(([x, y, z]) => S(ground(x, y, z))))));

    const greens = (x) => q(TIMING.green(x) + tree() * 0.1);
    // a scalloped leaf cluster (paper-cut canopy): quadratic bumps round an ellipse
    const cluster = (cx, cy, rx, ry, n, seed) => {
        const r2 = seeded(seed), pts = [];
        for (let i = 0; i < n; i++) {
            const a = (i / n) * TAU, k = 0.86 + r2() * 0.22;
            pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]);
        }
        const segs = [];
        for (let i = 0; i < n; i++) {
            const a0 = pts[i], a1 = pts[(i + 1) % n], mx = (a0[0] + a1[0]) / 2, my = (a0[1] + a1[1]) / 2;
            segs.push([[mx + (mx - cx) * 0.42, my + (my - cy) * 0.42], a1]);
        }
        return quads(pts[0], segs);
    };
    const limb = (a, b, w0, w1) => {
        const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l;
        return enc([[a[0] + nx * w0, a[1] + ny * w0], [b[0] + nx * w1, b[1] + ny * w1], [b[0] - nx * w1, b[1] - ny * w1], [a[0] - nx * w0, a[1] - ny * w0]]);
    };

    const broadleaf = (x, z, s) => {
        const ppm = ppmAt(x, 3 * s, z), base = bb(x, z, 0, 0), trunkTop = bb(x, z, 0.15 * s, 2.3 * s);
        let bark = limb(base, trunkTop, 0.24 * s * ppm, 0.17 * s * ppm);
        const layers = ["", "", "", ""], sh = [];
        const forks = 5;
        for (let f = 0; f < forks; f++) {
            const a = (f / forks) * TAU + tree() * 0.6, rad = (1.1 + tree() * 0.5) * s, h = (3.4 + tree() * 0.9) * s;
            const end = bb(x, z, Math.cos(a) * rad, h);
            bark += limb(trunkTop, end, 0.13 * s * ppm, 0.06 * s * ppm);
            const cy = end[1] - 0.35 * s * ppm, rx = 1.3 * s * ppm, ry = 1.0 * s * ppm, sd = 100 + f * 13 + Math.round(x * 7);
            layers[0] += cluster(end[0] + rx * 0.08, cy + ry * 0.12, rx * 1.02, ry, 9, sd);
            layers[1] += cluster(end[0] - rx * 0.04, cy - ry * 0.05, rx * 0.86, ry * 0.84, 8, sd + 1);
            layers[2] += cluster(end[0] - rx * 0.16, cy - ry * 0.22, rx * 0.56, ry * 0.5, 6, sd + 2);
            sh.push([x + Math.cos(a) * rad, h, z + Math.sin(a) * rad * 0.3]);
        }
        const tc = bb(x, z, 0.1 * s, 4.6 * s), trx = 1.6 * s * ppm, try_ = 1.1 * s * ppm;
        layers[0] += cluster(tc[0], tc[1], trx, try_, 12, 300 + x);
        layers[1] += cluster(tc[0] - trx * 0.06, tc[1] - try_ * 0.08, trx * 0.85, try_ * 0.82, 11, 301 + x);
        layers[3] += cluster(tc[0] - trx * 0.22, tc[1] - try_ * 0.3, trx * 0.5, try_ * 0.45, 8, 302 + x);
        shadowOf([[x - 1.6 * s, 4.6 * s, z], [x + 1.6 * s, 4.6 * s, z], [x, 5.8 * s, z], [x - 2 * s, 3.4 * s, z - 1.5 * s], [x + 2 * s, 3.4 * s, z + 1.5 * s], [x, 3 * s, z]]);
        shadow += enc(hull([[x - 0.25 * s, 0, z], [x + 0.25 * s, 0, z], [x + 0.15 * s, 2.6 * s, z], [x, 2.6 * s, z]].map(([a, b, c]) => S(ground(a, b, c)))));
        return { x, z, ext: [3.2 * s, 6 * s], kind: "tree", delay: greens(x), layers: [["bark", bark], ["gr1", layers[0]], ["gr3", layers[1]], ["gr4", layers[2]], ["gr5", layers[3]]] };
    };

    const acacia = (x, z, s) => {
        const lean = (tree() - 0.5) * 0.8, ppm = ppmAt(x, 3 * s, z);
        const base = bb(x, z, 0, 0), mid = bb(x, z, lean * s, 2.6 * s);
        let bark = limb(base, mid, 0.22 * s * ppm, 0.14 * s * ppm);
        for (let f = 0; f < 3; f++) {
            const a = f * 2.1 + tree(), rad = (1.4 + tree() * 0.8) * s;
            bark += limb(mid, bb(x, z, lean * s + Math.cos(a) * rad, (4.6 + tree() * 0.4) * s), 0.12 * s * ppm, 0.05 * s * ppm);
        }
        const cy = 4.9 * s, mx = x + lean * s * cam.rt[0] + 0.2, mz = z + lean * s * cam.rt[2];
        const disc = (r, dy, seed, squash = 0.86) => Array.from({ length: 48 }, (_, i) => {
            const a = (i / 48) * TAU, k = r * (0.82 + fbm(Math.cos(a) * 1.6 + seed, Math.sin(a) * 1.6 + seed) * 0.34) + (hash(i, seed) - 0.5) * 0.18;
            return S(p(mx + Math.cos(a) * k, cy + dy, mz + Math.sin(a) * k * squash));
        });
        const L4 = [[3.6, 0, 2], [3.1, 0.22, 3], [2.4, 0.42, 4], [1.6, 0.6, 4]];
        const layers = [["bark", bark]];
        // the dark underside of the crown, then the torn discs from the bottom up
        layers.push(["gr1", enc(disc(3.75 * s, -0.25 * s, x + 11))]);
        // a fringe of leaves under the crown's rim
        let fringe = "";
        const fr = seeded(Math.round(x * 100));
        for (let i = 0; i < 44; i++) {
            const a = fr() * TAU, r = (2.6 + fr() * 1.1) * s, c = p(mx + Math.cos(a) * r, cy - 0.3 * s, mz + Math.sin(a) * r * 0.86);
            fringe += leafPath(c[0], c[1], 0.4 * s * ppm, a + Math.PI / 2 + fr());
        }
        layers.push(["gr2", fringe]);
        L4.forEach(([r, dy, g], i) => layers.push([`gr${g + 1}`, enc(disc(r * s, dy * s, x + i * 3.7))]));
        shadowOf(Array.from({ length: 16 }, (_, i) => [mx + Math.cos((i / 16) * TAU) * 3.4 * s, cy, mz + Math.sin((i / 16) * TAU) * 3 * s]));
        return { x, z, ext: [4 * s, 5.6 * s], kind: "tree", delay: greens(x), layers };
    };

    const palm = (x, z, s) => {
        const h = 6.2 * s, bend = (tree() - 0.5) * 0.9, seg = 9, ppm = ppmAt(x, h / 2, z);
        let barkA = "", barkB = "", prev = [x, 0, z];
        for (let i = 1; i <= seg; i++) {
            const t = i / seg, pt = [x + bend * t * t, h * t, z + bend * 0.4 * t * t];
            const d = limb(S(P(prev)), S(P(pt)), 0.2 * s * (1 - (t - 1 / seg) * 0.3) * ppm, 0.17 * s * (1 - t * 0.3) * ppm);
            if (i % 2) barkA += d; else barkB += d;
            prev = pt;
        }
        // fronds: the 3D rotation (YXZ: azimuth φ, droop θ), serrated and sorted back to front
        const fronds = [];
        for (let f = 0; f < 11; f++) {
            const phi = (f / 11) * TAU + tree() * 0.3, th = -(0.9 + tree() * 0.8), len = 3.2 * s * (0.85 + tree() * 0.3);
            const dir = [Math.sin(th) * Math.sin(phi), Math.cos(th), Math.sin(th) * Math.cos(phi)];
            const side = [Math.cos(phi), 0, -Math.sin(phi)];
            const outl = [], back2 = [];
            const n = 7;
            for (let i = 0; i <= n; i++) {
                const t = i / n, w = Math.sin(t * Math.PI) * 0.42 * (1 - t * 0.35) * s * (i % 2 ? 1 : 0.55);
                const droop = -t * t * 0.9 * s;
                const c = [prev[0] + dir[0] * len * t, prev[1] + dir[1] * len * t + droop, prev[2] + dir[2] * len * t];
                outl.push(S(p(c[0] + side[0] * w, c[1], c[2] + side[2] * w)));
                back2.push(S(p(c[0] - side[0] * w, c[1], c[2] - side[2] * w)));
            }
            const mid = p(prev[0] + dir[0] * len * 0.5, prev[1] + dir[1] * len * 0.5, prev[2] + dir[2] * len * 0.5);
            // the frond's own shadow on the board: crown, the two widest points, the tip
            const at = (t, w) => { const y = prev[1] + dir[1] * len * t - t * t * 0.9 * s; return S(ground(prev[0] + dir[0] * len * t + side[0] * w, y, prev[2] + dir[2] * len * t + side[2] * w)); };
            shadow += enc([at(0, 0), at(0.45, 0.36 * s), at(1, 0), at(0.45, -0.36 * s)]);
            fronds.push({ depth: mid[2], g: 2 + (f % 4), d: enc(outl.concat(back2.reverse())) });
        }
        fronds.sort((a, b) => b.depth - a.depth);
        shadow += enc(hull([[x - 0.2 * s, 0, z], [x + 0.2 * s, 0, z], [prev[0] + 0.15 * s, prev[1], prev[2]], [prev[0] - 0.15 * s, prev[1], prev[2]]].map(([a, b, c]) => S(ground(a, b, c)))));
        return { x, z, ext: [3.4 * s, 7.4 * s], kind: "tree", delay: greens(x), layers: [["bark", barkA], ["bark2", barkB], ...fronds.map((fr) => [`gr${fr.g}`, fr.d])] };
    };

    const shrub = (x, z, r, blooms) => {
        const c = p(x, r * 0.7, z), ppm = cam.k / c[2], rx = r * ppm * 1.05, ry = r * 0.78 * ppm, sd = Math.round(x * 31 + z * 7);
        const layers = [["gr1", cluster(c[0] + rx * 0.06, c[1] + ry * 0.1, rx, ry, 10, sd)], ["gr3", cluster(c[0] - rx * 0.05, c[1] - ry * 0.06, rx * 0.84, ry * 0.8, 9, sd + 1)], ["gr4", cluster(c[0] - rx * 0.2, c[1] - ry * 0.28, rx * 0.48, ry * 0.42, 7, sd + 2)]];
        if (blooms) {
            const br = seeded(sd + 9);
            let d = "";
            for (let i = 0; i < blooms; i++) {
                const a = br() * TAU, rr = 0.55 + br() * 0.4, bx = c[0] + Math.cos(a) * rx * rr, by = c[1] + Math.sin(a) * ry * rr * 0.8 - ry * 0.15, br2 = 0.16 * ppm;
                d += enc(Array.from({ length: 7 }, (_, k) => [bx + Math.cos((k / 7) * TAU + a) * br2, by + Math.sin((k / 7) * TAU + a) * br2]));
            }
            layers.push(["bloom", d]);
        }
        shadowOf(Array.from({ length: 10 }, (_, i) => [x + Math.cos((i / 10) * TAU) * r, r * 0.7, z + Math.sin((i / 10) * TAU) * r]));
        return { x, z, ext: [r * 1.1, r * 1.5], kind: "tree", delay: greens(x), layers };
    };

    const hedge = (x0, x1, z, hh) => {
        const n = Math.round((x1 - x0) * 1.3), h2 = seeded(Math.round(x0 * 10 + 5000));
        const outline = (inset, hk, zo) => {
            const pts = [S(p(x0 + inset, 0, z + 0.45 - inset)), S(p(x1 - inset, 0, z + 0.45 - inset))];
            const tops = [];
            for (let i = n; i >= 0; i--) {
                const x = x0 + inset + ((x1 - x0 - 2 * inset) * i) / n;
                tops.push(S(p(x, hh * hk * (0.82 + h2() * 0.3), z + zo)));
            }
            return pts.concat(tops);
        };
        // scalloped top: bumps between the top points
        const scallop = (pts) => {
            let d = `M${num(Math.round(pts[0][0] * 10) / 10)} ${num(Math.round(pts[0][1] * 10) / 10)}L${num(Math.round(pts[1][0] * 10) / 10)} ${num(Math.round(pts[1][1] * 10) / 10)}`;
            for (let i = 2; i < pts.length; i++) {
                const a = pts[i - 1], b = pts[i], up2 = Math.abs(b[0] - a[0]) * 0.45;
                d += `Q${num(Math.round(((a[0] + b[0]) / 2) * 10) / 10)} ${num(Math.round(((a[1] + b[1]) / 2 - up2) * 10) / 10)} ${num(Math.round(b[0] * 10) / 10)} ${num(Math.round(b[1] * 10) / 10)}`;
            }
            return d + "z";
        };
        shadowOf([[x0, hh, z], [x1, hh, z], [x0, 0, z], [x1, 0, z]]);
        // leaf cards over the base, lighter towards the top (the 3D hedge is all leaves)
        const lv = ["", "", ""], lr = seeded(Math.round(x0 * 10 + 6000));
        for (let i = 0; i < (x1 - x0) * 4.5; i++) {
            const t = lr(), x = x0 + 0.1 + t * (x1 - x0 - 0.2), y = hh * (0.25 + lr() * 0.8), zz = z + 0.45 - lr() * 0.5;
            const c = p(x, y, zz), sz2 = (0.34 * cam.k) / c[2];
            lv[Math.min(2, Math.floor((y / hh) * 2.2 + lr() * 0.6))] += leafPath(c[0], c[1], sz2, lr() * TAU);
        }
        return { x: (x0 + x1) / 2, z, kind: "tree", delay: greens((x0 + x1) / 2), layers: [["gr1", scallop(outline(0, 1, 0))], ["gr2", scallop(outline(0.15, 0.8, 0.12))], ["gr3", lv[0]], ["gr4", lv[1]], ["gr5", lv[2]]] };
    };

    const person = (x, z, m) => {
        const ring = (y, r) => Array.from({ length: 12 }, (_, i) => S(p(x + Math.cos((i / 12) * TAU) * r, y, z + Math.sin((i / 12) * TAU) * r)));
        const head = p(x, 1.42, z), hr = (0.15 * cam.k) / head[2];
        castBox(B(x - 0.2, x + 0.2, 0, 1.55, z - 0.2, z + 0.2));
        return { x, z, kind: "fig", delay: greens(x), layers: [[`cyl-${m}`, enc(hull(ring(0, 0.22).concat(ring(1.25, 0.17))))], [`cyl-${m}`, enc(Array.from({ length: 10 }, (_, i) => [head[0] + Math.cos((i / 10) * TAU) * hr, head[1] + Math.sin((i / 10) * TAU) * hr]))]] };
    };

    items.push(broadleaf(-14.2, -9.9, 0.95), broadleaf(-13.9, 9.4, 0.88), broadleaf(11.6, -11.4, 0.82));
    items.push(acacia(14.4, 1.0, 0.74), acacia(-14.9, 0.3, 0.7));
    items.push(palm(13.7, 9.6, 0.9), palm(-8.4, 10.9, 0.78), palm(8.6, 10.9, 0.82), palm(-9.8, -11.6, 0.85));
    items.push(shrub(12.6, -4.8, 0.6, 5), shrub(-12.7, 4.8, 0.6, 4), shrub(12.4, 6.0, 0.5, 0));
    items.push(hedge(-15.8, -3.4, 12.6, 0.7), hedge(3.4, 11.2, 12.6, 0.7));
    [[-1.6, 10.2, "w"], [-1.0, 10.6, "o"], [3.2, 10.0, "n"], [2.4, 9.0, "w"], [5.8, 11.2, "w"], [-6.4, 11.6, "w"], [1.0, 12.4, "w"]].forEach(([x, z, m]) => items.push(person(x, z, m)));

    // night: bollard lights along the forecourt, light pools under the canopy and at the bollards
    front.pools = [];
    if (night) {
        const pool = (x, z, r, cls) => front.pools.push({ cls, d: enc(Array.from({ length: 18 }, (_, i) => S(p(x + Math.cos((i / 18) * TAU) * r, 0.02, z + Math.sin((i / 18) * TAU) * r)))) });
        pool(0, ZF + 3.6, 6.5, "glow-wide");
        [-2.6, 0, 2.6].forEach((x) => pool(x, ZF + 3.2, 2.2, "glow"));
        [-14, -11, -8, -5, 5, 8, 11, 14].forEach((x) => {
            pool(x, 12, 1.3, "glow");
            const ring = (y) => Array.from({ length: 10 }, (_, i) => S(p(x + Math.cos((i / 10) * TAU) * 0.1, y, 12 + Math.sin((i / 10) * TAU) * 0.1)));
            const t = p(x, 0.72, 12), r = (0.13 * cam.k) / t[2];
            items.push({ x, z: 12, kind: "lamp", delay: q(TIMING.lamps), layers: [["post", enc(hull(ring(0).concat(ring(0.7))))], ["bulb", enc(Array.from({ length: 8 }, (_, i) => [t[0] + Math.cos((i / 8) * TAU) * r, t[1] + Math.sin((i / 8) * TAU) * r * 0.7]))]] });
        });
        // canopy downlights
        [-2.6, 0, 2.6].forEach((x) => {
            const t = p(x, 4.03, ZF + 2.4), r = (0.16 * cam.k) / t[2];
            pieces.push({ delay: q(TIMING.lamps), lamp: true, items: [{ cls: "bulb", d: enc(Array.from({ length: 8 }, (_, i) => [t[0] + Math.cos((i / 8) * TAU) * r, t[1] + Math.sin((i / 8) * TAU) * r * 0.45])) }] });
        });
    }

    // trees the building hides completely are left out
    const bodyHull = (() => {
        const pts = [];
        for (const x of [-11.2, 11.2]) for (const y of [0, 15.06]) for (const z of [-6.9, 6.9]) pts.push(S(p(x, y, z)));
        return hull(pts);
    })();
    const inside = (pt) => {
        for (let i = 0; i < bodyHull.length; i++) {
            const a = bodyHull[i], b = bodyHull[(i + 1) % bodyHull.length];
            if ((b[0] - a[0]) * (pt[1] - a[1]) - (b[1] - a[1]) * (pt[0] - a[0]) < 0) return false;
        }
        return true;
    };
    const hidden = (it) => it.ext && it.z < 6.9 && [[-1, 0], [1, 0], [-1, 1], [1, 1], [0, 1.15]].every(([u, v]) => inside(S(p(it.x + u * it.ext[0] * cam.rt[0], v * it.ext[1], it.z + u * it.ext[0] * cam.rt[2]))));
    for (let i = items.length - 1; i >= 0; i--) if (hidden(items[i])) items.splice(i, 1);
    // behind the building: anything whose depth is greater than the building's back corner
    const depthOf = (it) => p(it.x, 1, it.z)[2];
    const behind = (it) => it.z < -6.9 || (it.x < -11.2 && it.z < 6.9);
    items.forEach((it) => (it.depth = depthOf(it)));
    front.backItems = items.filter(behind).sort((a, b) => b.depth - a.depth);
    front.frontItems = items.filter((it) => !behind(it)).sort((a, b) => b.depth - a.depth);
    front.shadow = shadow;
    front.drop = Math.round(2.4 * cam.ppm);
    front.settle = Math.round(1.2 * cam.ppm);
    return { w: cam.w, h: cam.h, back, front };
};

// a pointed leaf card (the 3D leaf shape) at (x, y), r long, turned by a
function leafPath(x, y, r, a) {
    const c = Math.cos(a), s = Math.sin(a);
    const pt = (u, v) => [x + (u * c - v * s) * r, y + (u * s + v * c) * r];
    return enc([pt(0, -0.5), pt(0.3, -0.1), pt(0, 0.5), pt(-0.3, -0.1)], true, 1);
}

// The viewBox for a screen of w × h px: the composition's framing, extended (never squeezed)
// to the screen's shape, like the 3D camera does. Landscape: wider screens see more to the sides,
// with the camera's axis kept at 67 % of the width; taller ones more above and below.
// Portrait: the hotel keeps the width and sits in the top half; extra height goes mostly below.
export const viewBoxFor = (w, h) => {
    const a = w / Math.max(1, h);
    if (a >= 1) {
        if (a >= 1.6) { const vw = 1000 * a; return { kind: "land", x: 1072 - 0.67 * vw, y: 0, w: vw, h: 1000 }; }
        const vh = 1600 / a;
        return { kind: "land", x: 0, y: (1000 - vh) * 0.42, w: 1600, h: vh };
    }
    const vh = 860 / a;
    return { kind: "port", x: 0, y: (1800 - vh) * (vh > 1800 ? 0.18 : 0.1), w: 860, h: vh };
};
