// moonArt: the paper-cut moon (the owner's reference, 2026-10-25): a cream top sheet with the dark "seas" (maria) cut
// out of it, a taupe sheet under it with their deepest parts cut out, and a grey-brown sheet at the bottom. Each sheet
// casts a soft shadow into the holes of the one below, so the seas look recessed, like layered card in a box frame.
// The seas sit where they really are on the near side of the moon (north up): Oceanus Procellarum on the left, Imbrium
// above it, Serenitatis, Tranquillitatis and Crisium to the right, Nubium and Humorum below; a few punched craters
// (Tycho, Copernicus, Kepler, Plato…). Plain JavaScript: SVG paths in the moon's own box (disc radius 44 at 0,0).

const R = 44;
const f1 = (n) => Math.round(n * 10) / 10;

const seeded = (seed) => () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

// a soft, irregular blob (clockwise, so overlapping blobs join): an ellipse whose radius wobbles, smoothed into curves
const blob = (cx, cy, rx, ry, rot, rough, ph) => {
    const n = 32, pts = [];
    for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2;
        const k = 1 + rough * (0.5 * Math.sin(3 * a + ph[0]) + 0.3 * Math.sin(5 * a + ph[1]) + 0.2 * Math.sin(9 * a + ph[2]));
        const x = Math.cos(a) * rx * k, y = Math.sin(a) * ry * k;
        pts.push([cx + x * Math.cos(rot) - y * Math.sin(rot), cy + x * Math.sin(rot) + y * Math.cos(rot)]);
    }
    // Catmull-Rom through the points, as cubic curves
    let d = `M${f1(pts[0][0])},${f1(pts[0][1])}`;
    for (let i = 0; i < n; i++) {
        const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
        d += `C${f1(p1[0] + (p2[0] - p0[0]) / 6)},${f1(p1[1] + (p2[1] - p0[1]) / 6)} ${f1(p2[0] - (p3[0] - p1[0]) / 6)},${f1(p2[1] - (p3[1] - p1[1]) / 6)} ${f1(p2[0])},${f1(p2[1])}`;
    }
    return d + "Z";
};

// [cx, cy, rx, ry, rotation] as fractions of the radius (y grows southwards); the near side's seas
const SEAS = [
    [-0.5, 0.06, 0.27, 0.44, 0.2],   // Oceanus Procellarum
    [-0.27, -0.38, 0.27, 0.21, 0],   // Mare Imbrium
    [0.06, -0.69, 0.36, 0.07, -0.06], // Mare Frigoris
    [0.18, -0.35, 0.15, 0.14, 0],    // Mare Serenitatis
    [0.37, -0.05, 0.2, 0.17, 0.4],   // Mare Tranquillitatis
    [0.69, -0.28, 0.1, 0.12, 0],     // Mare Crisium
    [0.58, 0.19, 0.11, 0.16, 0.3],   // Mare Fecunditatis
    [0.34, 0.34, 0.08, 0.08, 0],     // Mare Nectaris
    [-0.14, 0.38, 0.17, 0.13, 0.2],  // Mare Nubium
    [-0.46, 0.44, 0.09, 0.09, 0],    // Mare Humorum
    [0.0, -0.16, 0.12, 0.08, 0],     // Mare Vaporum
    [-0.24, -0.02, 0.12, 0.1, 0],    // Mare Insularum
];
// [cx, cy, r]: craters punched through the top sheet
const CRATERS = [[-0.12, 0.72, 0.055], [-0.3, 0.08, 0.042], [-0.56, 0.05, 0.028], [-0.12, -0.66, 0.034], [0.14, 0.62, 0.024], [0.6, 0.52, 0.022]];

/**
 * The moon's paper sheets, in its own box (disc radius 44 at 0, 0).
 * @param {number} [seed]
 * @returns {{ r: number, seas: string, deep: string, craters: string }}  seas: holes in the top sheet; deep: holes in
 *   the middle sheet (inside the seas); craters: small holes punched in the top sheet
 */
export const moonArt = (seed = 3) => {
    const r = seeded(seed);
    const phases = SEAS.map(() => [r() * 6.3, r() * 6.3, r() * 6.3]);
    const seas = SEAS.map(([x, y, rx, ry, rot], i) => blob(x * R, y * R, rx * R, ry * R, rot, 0.3, phases[i])).join("");
    // the deep parts follow each sea's own outline, smaller and set a little down and right, like a terrace cut deeper
    // into the card (the light comes from the upper left)
    const deep = SEAS.filter((sea) => sea[2] * sea[3] > 0.012).map(([x, y, rx, ry, rot]) => {
        const i = SEAS.findIndex((sea) => sea[0] === x && sea[1] === y);
        return blob((x + rx * 0.08) * R, (y + ry * 0.1) * R, rx * 0.62 * R, ry * 0.62 * R, rot, 0.36, phases[i]);
    }).join("");
    const craters = CRATERS.map(([x, y, cr]) => {
        const c = cr * R;
        return `M${f1(x * R - c)},${f1(y * R)}a${f1(c)},${f1(c)} 0 1,1 ${f1(2 * c)},0a${f1(c)},${f1(c)} 0 1,1 ${f1(-2 * c)},0Z`;
    }).join("");
    return { r: R, seas, deep, craters };
};
