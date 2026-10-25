// weatherShapes: the paper weather for the page heroes (ideas #23, docs/brief-living-sky.md Q4–Q6).
// Six scenes, all cut paper with the site's paper grain: cumulus clouds (a cool shade sheet, a lit sheet laid on it,
// curled highlights), cloud ceilings with round lobes, a storm of heavy rows lit softly from inside with paper bolts
// that fade in and out (never a flash), strips of tracing paper for mist, and rain as thin paper slivers that splash on
// the front hill. The look follows the owner's references (2026-10-24 and 2026-10-25).
// Plain JavaScript: shapes come back as SVG path strings in the hero's CSS pixels; rain draws on a canvas context the
// caller passes in. Colours are never here: the caller fills with the weather tokens in src/styles/tokens.css.

/** Seeded random numbers (same seed, same shapes on every visit). @param {number} seed @returns {() => number} */
export const seeded = (seed) => () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

/**
 * What each scene shows. `wash` is the token laid over the sky gradient; `glowK` scales the horizon glow;
 * `sun` / `moon` are the body's opacity behind the clouds; `rain` is the rain amount (0 none, 0.5 light,
 * 1 rain, 1.5 heavy); `minWind` is the least wind the scene shows.
 */
export const SCENES = Object.freeze({
    clear: { label: "Clear", wash: null, glowK: 1, decks: 0, puffs: 2, storm: false, mist: false, rain: 0, wet: false, stars: 1, sun: 1, moon: 1, minWind: 0 },
    partly: { label: "Partly cloudy", wash: "--sky-wash-partly", glowK: 0.8, decks: 0, puffs: 4, storm: false, mist: false, rain: 0, wet: false, stars: 1, sun: 1, moon: 1, minWind: 0 },
    overcast: { label: "Overcast", wash: "--sky-wash-overcast", glowK: 0.33, decks: 2, puffs: 2, storm: false, mist: false, rain: 0, wet: false, stars: 0, sun: 0.35, moon: 0.4, minWind: 0 },
    mist: { label: "Mist", wash: null, glowK: 0.7, decks: 0, puffs: 0, storm: false, mist: true, rain: 0, wet: false, stars: 0.5, sun: 0.7, moon: 0.6, minWind: 0 },
    rain: { label: "Rain", wash: "--sky-wash-rain", glowK: 0.33, decks: 2, puffs: 1, storm: false, mist: false, rain: 1, wet: true, stars: 0, sun: 0.35, moon: 0.4, minWind: 0 },
    storm: { label: "Storm", wash: "--sky-wash-storm", glowK: 0.25, decks: 3, puffs: 0, storm: true, mist: false, rain: 1.5, wet: true, stars: 0, sun: 0.2, moon: 0.25, minWind: 1.2 },
});

// When a scene is switched off in Admin → Features, show the nearest calmer one that's on (owner, 2026-10-24).
const CALMER = { storm: "rain", rain: "overcast", overcast: "partly", partly: "clear", mist: "partly", clear: null };

/**
 * The scene to show, given the one asked for and which are switched on. Clear is always on.
 * @param {string} kind  clear | partly | overcast | mist | rain | storm
 * @param {Record<string, boolean>} [enabled]  e.g. { storm: false }; missing keys count as on
 * @returns {string}
 * @example fallbackScene("storm", { storm: false, rain: false }) // "overcast"
 */
export const fallbackScene = (kind, enabled = {}) => {
    let k = SCENES[kind] ? kind : "clear";
    while (k !== "clear" && enabled[k] === false) k = CALMER[k];
    return k;
};

/**
 * Wind strength for the sway (0 calm … 2), from the live wind speed and the Admin slider.
 * 0 below 1 m/s, 1 at 4 m/s, 2 at 10 m/s; a storm is at least 1.2 before the slider; capped at 2.
 * @param {number} ms  wind speed in metres per second
 * @param {number} [slider=1]  Admin → Motion "Wind strength" (0–2)
 * @param {string} [kind]  the scene, for its minimum wind
 * @returns {number}
 */
export const windFromMs = (ms, slider = 1, kind = "clear") => {
    const v = Number(ms) || 0;
    let w = v < 1 ? 0 : v <= 4 ? (v - 1) / 3 : 1 + Math.min(1, (v - 4) / 6);
    w = Math.max(w, SCENES[kind]?.minWind ?? 0);
    return Math.min(2, w * Math.max(0, Number(slider) || 0));
};

// ---------- shapes ----------
// Every cloud is cut paper (the owner's references, 2026-10-25): a shade sheet (the whole silhouette, a cool tint),
// a lit sheet laid on it (the upper bumps, lifted a little so a rim of shade shows under each one), small curled
// highlights cut into the shade, and the site's paper grain over the lot (Weather.jsx). Shapes are SVG paths in px;
// every circle is drawn clockwise, so overlapping pieces join instead of cutting holes.
const f1 = (n) => Math.round(n * 10) / 10;
const TAU = Math.PI * 2;
// the hero's words, as boxes in the hero's px ({ x0, y0, x1, y1 }): the weather is placed around them
const hits = (b, avoid, pad = 12) => avoid.some((a) => b.x < a.x1 + pad && b.x + b.w > a.x0 - pad && b.y < a.y1 + pad && b.y + b.h > a.y0 - pad);
// the top of the first words (breadcrumbs included: small grey text needs the clearest background; decorative words,
// like the sheet number, don't count)
const textTop = (avoid, h) => { const real = avoid.filter((a) => !a.deco); return real.length ? Math.min(...real.map((a) => a.y0)) : h; };
const circle = (x, y, r) => `M${f1(x - r)},${f1(y)}a${f1(r)},${f1(r)} 0 1,1 ${f1(2 * r)},0a${f1(r)},${f1(r)} 0 1,1 ${f1(-2 * r)},0Z`;

// the arc of circle (cx, cy, r) from angle a0 to a1 that passes through angle am, as points
const arcPts = (cx, cy, r, a0, a1, am, n = 10) => {
    const norm = (x) => ((x % TAU) + TAU) % TAU;
    const ccw = norm(a1 - a0), span = norm(am - a0) < ccw ? ccw : ccw - TAU;
    return Array.from({ length: n + 1 }, (_, i) => { const a = a0 + (span * i) / n; return [cx + r * Math.cos(a), cy + r * Math.sin(a)]; });
};

/**
 * A curled highlight: the crescent of circle 1 left outside circle 2 (circle 2 sits a little down and right, so the
 * crescent hugs the upper left, like the white curls in the owner's cloud reference).
 * @returns {string} SVG path, or "" when the circles don't make a crescent
 */
export const crescent = (x1, y1, r1, x2, y2, r2) => {
    const dx = x2 - x1, dy = y2 - y1, d = Math.hypot(dx, dy);
    if (d <= 0 || d >= r1 + r2 || d + r1 <= r2 || d + r2 <= r1) return "";
    const a = (r1 * r1 - r2 * r2 + d * d) / (2 * d), hh = Math.sqrt(Math.max(0, r1 * r1 - a * a));
    const ux = dx / d, uy = dy / d, px = x1 + a * ux, py = y1 + a * uy;
    const P = [px - hh * uy, py + hh * ux], Q = [px + hh * uy, py - hh * ux];
    const away = Math.atan2(-uy, -ux);
    const outer = arcPts(x1, y1, r1, Math.atan2(P[1] - y1, P[0] - x1), Math.atan2(Q[1] - y1, Q[0] - x1), away);
    const inner = arcPts(x2, y2, r2, Math.atan2(Q[1] - y2, Q[0] - x2), Math.atan2(P[1] - y2, P[0] - x2), away);
    return "M" + [...outer, ...inner].map(([x, y]) => `${f1(x)},${f1(y)}`).join("L") + "Z";
};

/**
 * One paper-cut cumulus, centred on (cx, cy), w px wide and about 0.46 w tall: rounded bumps on top (biggest in the
 * middle), small round lobes underneath, sometimes a tapering wisp trailing from one side (the owner's reference).
 * @param {{ cx: number, cy: number, w: number, seed?: number, wisp?: -1 | 0 | 1, flat?: number }} o
 *   wisp: which side trails a wisp (0 none); flat: 0 round-bottomed … 1 flatter (storm rows)
 * @returns {{ shade: string, lit: string, curls: string, box: { x: number, y: number, w: number, h: number } }}
 */
export const cumulus = ({ cx, cy, w, seed = 1, wisp = 0, flat = 0 }) => {
    const r = seeded(seed), u = w / 100, X = (x) => cx + x * u, Y = (y) => cy + y * u;
    const base = 8, shade = [], lit = [], curls = [];
    const nTop = 4 + Math.floor(r() * 2);
    for (let i = 0; i < nTop; i++) {
        const t = (i / (nTop - 1)) * 2 - 1, rr = 10 + 13 * (1 - t * t) * (0.8 + r() * 0.45);
        const x = t * 31 + (r() - 0.5) * 6, y = base - rr * (0.5 + r() * 0.25);
        shade.push(circle(X(x), Y(y), rr * u));
        lit.push(circle(X(x - 0.6), Y(y - 3.2), rr * 0.97 * u)); // lifted: a rim of shade shows under each bump
        if (i > 0 && i < nTop - 1 && r() < 0.35) curls.push(crescent(X(x - rr * 0.1), Y(y + rr * 0.62), rr * 0.5 * u, X(x - rr * 0.1 + rr * 0.14), Y(y + rr * 0.62 + rr * 0.18), rr * 0.47 * u));
    }
    const nBot = 5 + Math.floor(r() * 3);
    for (let i = 0; i < nBot; i++) {
        const t = (i / (nBot - 1)) * 2 - 1, rr = (6 + r() * 4) * (1 - flat * 0.35);
        const x = t * 33 + (r() - 0.5) * 4, y = base + 1 - flat * 3;
        shade.push(circle(X(x), Y(y), rr * u));
        if (i % 2 === 1 && r() < 0.7) curls.push(crescent(X(x), Y(y), rr * u, X(x + rr * 0.3), Y(y + rr * 0.34), rr * 0.95 * u));
    }
    // the body that joins them: a rounded bar, drawn clockwise
    const q = 8 * u, l = X(-38) + q, rt = X(38) - q, top = Y(base - 12);
    shade.push(`M${f1(l)},${f1(top)}H${f1(rt)}a${f1(q)},${f1(q)} 0 0 1 0,${f1(2 * q)}H${f1(l)}a${f1(q)},${f1(q)} 0 0 1 0,${f1(-2 * q)}Z`);
    let x0 = -40, x1 = 40;
    if (wisp) {
        // a tapering lens trailing from one side, its top edge lit; drawn clockwise whichever side it's on
        // a soft wave of paper: rounded at the tip, curling up a little as it thins
        const s = wisp, rootX = s * 24, tipX = s * (62 + r() * 14), midX = (rootX + tipX) / 2, yb = base + 2, tr = 1.4;
        const P = (x, y) => `${f1(X(x))},${f1(Y(y))}`;
        const lens = (dy, k) => {
            const t = yb - 2 * k + dy, b = yb + 4.6 * k + dy;
            const upper = [P(rootX, t - 2 * k), P(midX, t + 0.6 * k), P(tipX - s * 3, yb - 1.4 + dy)];
            const lower = [P(tipX - s * 3, yb + 1.4 + dy), P(midX + s * 4, b), P(rootX, b + 0.8 * k)];
            const arcTo = `A${f1(tr * u)},${f1(tr * u)} 0 0 1 `; // round the tip, bulging outwards on either side
            return s > 0
                ? `M${upper[0]}Q${upper[1]} ${upper[2]}${arcTo}${lower[0]}Q${lower[1]} ${lower[2]}Z`
                : `M${lower[2]}Q${lower[1]} ${lower[0]}${arcTo}${upper[2]}Q${upper[1]} ${upper[0]}Z`;
        };
        shade.push(lens(0, 1));
        lit.push(lens(-1.6, 0.55));
        if (s > 0) x1 = tipX + 2; else x0 = tipX - 2;
    }
    const y0 = base - 23 * 1.3 - 6, y1 = base + 12;
    return { shade: shade.join(""), lit: lit.join(""), curls: curls.join(""), box: { x: X(x0), y: Y(y0), w: (x1 - x0) * u, h: (y1 - y0) * u } };
};

/**
 * A cloud ceiling hanging from the top of the sky (overcast, rain and storm): a paper band whose lower edge is a row
 * of round lobes, lit like the cumulus (a lifted lit sheet, curls in the lowest lobes).
 * @param {{ w: number, base: number, seed?: number, size?: number, curls?: boolean }} o
 *   base: how far down the lobes hang (px); size: lobe size (1 ≈ 30 px radius on desktop)
 * @returns {{ shade: string, lit: string, curls: string }}
 */
export const ceiling = ({ w, base, seed = 1, size = 1, curls: withCurls = true }) => {
    const r = seeded(seed), shade = [], lit = [], curls = [];
    const band = base - 30 * size * 0.6;
    shade.push(`M-60,-60H${f1(w + 60)}V${f1(band)}H-60Z`);
    lit.push(`M-60,-60H${f1(w + 60)}V${f1(band - 4 * size)}H-60Z`);
    for (let x = -50 + r() * 20, i = 0; x < w + 60; i++) {
        // big and small lobes in turn, hanging to slightly different depths
        // `base` is the lowest any lobe reaches: each hangs to it or a little short of it
        const big = i % 3 !== 1, rr = (big ? 30 + r() * 30 : 16 + r() * 12) * size, y = base - rr * (big ? 1 + r() * 0.3 : 1.1 + r() * 0.4);
        shade.push(circle(x, y, rr));
        lit.push(circle(x - 1.5 * size, y - 5 * size, rr * 0.95));
        if (withCurls && big && r() < 0.35) curls.push(crescent(x - rr * 0.15, y + rr * 0.35, rr * 0.55, x - rr * 0.15 + rr * 0.16, y + rr * 0.55, rr * 0.52));
        x += rr * (big ? 1.05 + r() * 0.35 : 0.9 + r() * 0.3);
    }
    return { shade: shade.join(""), lit: lit.join(""), curls: curls.join("") };
};

/**
 * The cloud ceilings for a scene, deepest first: [{ ...ceiling, tone }]. tone picks the tokens:
 * "deck-back" / "deck-front" (overcast, rain) or "storm-back" / "storm-front" (storm).
 * @param {string} kind @param {number} w @param {number} h @param {number} [seed]
 * @param {{ x0: number, y0: number, x1: number, y1: number }[]} [avoid]  the hero's words: the ceilings stop just above them
 */
export const deckFor = (kind, w, h, seed = 7, avoid = []) => {
    // the ceilings and their soft shadow stop above the first words
    const n = SCENES[kind]?.decks ?? 0, size = w < 600 ? 0.6 : 1, lim = textTop(avoid, h) - 24;
    const cap = (y) => Math.min(y, Math.max(8, lim));
    if (n === 2) return [
        { ...ceiling({ w, base: cap(h * 0.22), seed: seed + 2, size }), tone: "deck-front" },
        { ...ceiling({ w, base: cap(h * 0.22) * 0.6, seed: seed + 1, size: size * 0.85 }), tone: "deck-back" },
    ];
    if (n === 3) return [
        { ...ceiling({ w, base: cap(h * 0.2), seed: seed + 4, size }), tone: "storm-back" },
        { ...ceiling({ w, base: cap(h * 0.2) * 0.6, seed: seed + 3, size: size * 0.85 }), tone: "deck-front" },
    ];
    return [];
};

/**
 * Paper cumulus clouds for a scene, on the right and in the top band, never on the hero's words.
 * @param {string} kind @param {number} w @param {number} h @param {number} [seed]
 * @param {{ x0: number, y0: number, x1: number, y1: number }[]} [avoid]  the hero's words
 * @returns {{ shade: string, lit: string, curls: string, box: object, cx: number, cy: number, w: number }[]}
 */
export const puffsFor = (kind, w, h, seed = 7, avoid = []) => {
    const n = SCENES[kind]?.puffs ?? 0, small = w < 600, out = [];
    // preferred spots first; a spot is skipped if the cloud would sit on the hero's words or on another cloud
    const spots = [[0.7, 0.15, 1, 1], [0.92, 0.32, 0.72, -1], [0.6, 0.06, 0.6, 0], [0.86, 0.22, 0.85, 1], [0.8, 0.04, 0.7, -1], [0.95, 0.1, 0.6, 0], [0.75, 0.42, 0.65, 1], [0.5, 0.02, 0.55, 0]];
    for (const [x, y, sz, wisp] of spots) {
        if (out.length >= n) break;
        const cw = 230 * sz * (small ? 0.62 : 1), cx = x * w, cy = y * h + cw * 0.22;
        const c = cumulus({ cx, cy, w: cw, seed: seed + 20 + out.length * 7, wisp });
        if (hits(c.box, avoid, 14) || hits(c.box, out.map((o) => ({ x0: o.box.x, y0: o.box.y, x1: o.box.x + o.box.w, y1: o.box.y + o.box.h })), -c.box.w * 0.15)) continue;
        out.push({ ...c, cx, cy, w: cw });
    }
    return out;
};

/**
 * The storm: two rows of heavy, flatter-bottomed cumuli (the lighter row behind, the darker in front, as in the
 * owner's thunderstorm reference), where the soft inner glow sits, and where paper lightning bolts hang. The rows sit
 * to the right of the hero's words on wide screens and above them on phones; bolts only where they touch no words.
 * @param {number} w @param {number} h @param {number} [seed]
 * @param {{ x0: number, y0: number, x1: number, y1: number }[]} [avoid]  the hero's words
 * @returns {{ rows: { tone: "storm-back" | "storm-front", clouds: ReturnType<typeof cumulus>[] }[], d: string,
 *   glow: { cx: number, cy: number, r: number } | null (no rows: no glow), bolts: { d: string, x: number, y: number, box: object }[] }}
 */
export const stormCloud = (w, h, seed = 7, avoid = []) => {
    const small = w < 600, r = seeded(seed + 40);
    // where there's room: to the right of the words (wide screens), or above them (phones, where the words fill the sky)
    let x0 = w * 0.5;
    for (const a of avoid) if (a.y1 > h * 0.06 && a.y0 < h * 0.5 && a.x0 < w * 0.75) x0 = Math.max(x0, a.x1 + 24);
    const right = w - x0 >= Math.min(300, w * 0.28);
    let cw, rowAt;
    if (right) {
        cw = Math.max(130, Math.min(300, (w - x0) * 0.5));
        // small words on the right (the sheet number) stay above the rows
        const ceil = Math.max(0, ...avoid.filter((a) => a.x1 > x0).map((a) => a.y1 + 8));
        const y0 = Math.max(h * 0.17, ceil + 0.3 * cw * 0.9);
        rowAt = [[y0, "storm-back", 0.9, x0 + cw * 0.15], [y0 + h * 0.1, "storm-front", 1, x0 + cw * 0.45]];
    } else {
        // every word counts here, the breadcrumbs and logo too: the rows hang along the top edge above them all
        const top = avoid.length ? textTop(avoid, h) : h * 0.3;
        cw = Math.max(70, Math.min(160, top * 2.4));
        const bottom = top - 24; // the front row's lobes (and their shadow) stop above the first words
        if (bottom < 12) return { rows: [], d: "", glow: null, bolts: [] }; // no room: the storm ceiling, wash and rain carry it
        rowAt = [[bottom - cw * 0.3, "storm-back", 0.85, w * 0.06], [bottom - cw * 0.17, "storm-front", 1, w * 0.26]];
    }
    const rows = rowAt.map(([y, tone, sz, from], k) => {
        const clouds = [];
        for (let x = from; x < w + cw * 0.3; x += cw * (0.62 + r() * 0.2)) {
            clouds.push(cumulus({ cx: x, cy: y + (r() - 0.5) * h * 0.02, w: cw * sz * (0.85 + r() * 0.3), seed: seed + 60 + clouds.length * 3 + k * 17, flat: 0.8 }));
        }
        return { tone, clouds };
    });
    const front = rows[1].clouds;
    // bolts hang from the front row where they'd touch no words; none if there's no such place
    const len = h * (small ? 0.12 : 0.16), bolts = [];
    for (const c of front) {
        if (bolts.length >= (small ? 2 : 3)) break;
        const x = c.box.x + c.box.w * (0.35 + r() * 0.3), y = c.box.y + c.box.h * 0.92;
        const box = { x: x - len * 0.32, y: y - 4, w: len * 0.64, h: len + 8 };
        if (box.x + box.w > w - 4 || hits(box, avoid, 10)) continue;
        bolts.push({ d: bolt({ x, y, len, seed: seed + 80 + bolts.length }), x, y, box });
    }
    const mid = front[Math.floor(front.length / 2)] ?? front[0];
    const glow = mid ? { cx: mid.box.x + mid.box.w / 2, cy: mid.box.y + mid.box.h * 0.55, r: cw * 0.9 } : null;
    return { rows, d: front.map((c) => c.shade).join(""), glow, bolts };
};

/**
 * A paper lightning bolt hanging from (x, y): a zigzag that tapers to a point, cut from one sheet.
 * @param {{ x: number, y: number, len: number, seed?: number }} o
 * @returns {string} SVG path
 */
export const bolt = ({ x, y, len, seed = 1 }) => {
    const r = seeded(seed), n = 4, pts = [[x, y]];
    for (let i = 1; i <= n; i++) pts.push([x + (i % 2 ? 1 : -0.6) * len * (0.12 + r() * 0.08), y + (len * i) / n]);
    const left = [], right = [];
    pts.forEach(([px, py], i) => { const t = len * 0.045 * (1 - i / n) + 0.6; left.push([px - t, py]); right.unshift([px + t, py]); });
    return "M" + [...left, ...right].map(([a, b]) => `${f1(a)},${f1(b)}`).join("L") + "Z";
};

/**
 * Morning mist behind the hills: a sheet of tracing paper laid over the far hills, from the horizon up about 35 % of
 * the sky, with a gently wavy top. Fill it with a vertical gradient (the mist token at the bottom, clear at the top).
 * @param {{ w: number, h: number, horizon: number, seed?: number }} o  horizon: y of the hills' top edge in px
 * @returns {{ d: string, top: number, bottom: number }}
 */
export const mistBand = ({ w, h, horizon, seed = 7 }) => {
    const r = seeded(seed), ph = r() * 6, top = horizon - h * 0.35 * (horizon / h), bottom = horizon + h * 0.12;
    let d = `M-20,${f1(bottom)}`;
    for (let x = -20; x <= w + 20; x += 24) d += `L${x},${f1(top + 10 * Math.sin(x / 140 + ph) + 5 * Math.sin(x / 47 + ph * 2))}`;
    return { d: d + `L${f1(w + 20)},${f1(bottom)}Z`, top, bottom };
};

/**
 * Mist in front of the hills: three strips of tracing paper with soft torn tops, lying across the hills at different
 * heights. Each strip is drawn twice its period wide (its edge repeats every `period` px), so sliding it left by one
 * period and starting again is seamless.
 * @param {{ w: number, h: number, horizon: number, seed?: number, avoid?: object[] }} o  avoid: the hero's words
 * @returns {{ d: string, edge: string, period: number, speed: number, depth: number }[]}  back to front; edge: the torn top
 *   edge alone (for its lit line); speed in px per second at wind 1
 */
export const mistStrips = ({ w, h, horizon, seed = 7, avoid = [] }) => {
    const r = seeded(seed), period = Math.max(600, Math.round(w));
    // the strips lie across the hills, below the words (a strip over the words would fog them)
    const floor = Math.max(horizon, ...avoid.filter((a) => a.x1 - a.x0 > 160).map((a) => a.y1 + 12));
    const room = Math.max(24, h - floor);
    // big, slow waves (tracing paper laid in loose folds), a smaller ripple, and fine fibres along the cut
    const a = Math.max(10, Math.min(26, room * 0.14));
    const spec = [[floor + room * 0.1, a, 5, 0], [floor + room * 0.42, a * 1.15, 7, 1], [floor + room * 0.74, a * 0.8, 10, 2]];
    return spec.map(([top, amp, speed, depth]) => {
        const k1 = 1 + Math.floor(r() * 2), k2 = 5 + Math.floor(r() * 4), k3 = 13 + Math.floor(r() * 6), p1 = r() * TAU, p2 = r() * TAU, p3 = r() * TAU;
        const edge = (x) => { const t = (x / period) * TAU; return top + amp * Math.sin(k1 * t + p1) + amp * 0.4 * Math.sin(k2 * t + p2) + Math.min(2.5, amp * 0.1) * Math.sin(k3 * t + p3); };
        let e = "";
        for (let x = 0; x <= period * 2; x += 8) e += `${e ? "L" : "M"}${x},${f1(edge(x))}`;
        return { d: `M0,${f1(h + 20)}L` + e.slice(1) + `L${period * 2},${f1(h + 20)}Z`, edge: e, period, speed, depth };
    });
};

// ---------- storm glow ----------
/**
 * The storm cloud's inner glow, as an opacity over time: every 9–18 s it rises over 400 ms, holds 150 ms and fades
 * over 900 ms; one time in three a smaller second pulse follows 300 ms later. With bolts, three pulses in four also
 * show one paper bolt (faded in and out over a second; never more than one, never a full-sky flash). Far below
 * flash-safety limits (at most one change every 9 s, and a small part of the screen).
 * @param {number} [seed]
 * @param {number} [bolts=0]  how many bolts the storm has (stormCloud().bolts.length)
 * @returns {{ step: (dt: number) => number, bolt: number, boltK: number }}  step(dt) → glow opacity 0–1; then bolt/boltK
 */
export const createStormGlow = (seed = 9, bolts = 0) => {
    const r = seeded(seed);
    let t = 0, next = 3 + r() * 6, pulses = [], boltAt = -9;
    const shape = (u) => (u < 0 ? 0 : u < 0.4 ? u / 0.4 : u < 0.55 ? 1 : u < 1.45 ? 1 - (u - 0.55) / 0.9 : 0);
    // a bolt fades in over 160 ms, holds 260 ms and fades over 600 ms: one at a time, never a flash
    const boltShape = (u) => (u < 0 ? 0 : u < 0.16 ? u / 0.16 : u < 0.42 ? 1 : u < 1.02 ? 1 - (u - 0.42) / 0.6 : 0);
    const api = {
        /** which bolt shows (-1 none) and how strongly (0–1), after the last step */
        bolt: -1,
        boltK: 0,
        step(dt) {
            t += dt;
            if (t >= next) {
                pulses = [{ at: t, k: 1 }];
                if (r() < 1 / 3) pulses.push({ at: t + 0.3, k: 0.55 });
                if (bolts > 0 && r() < 0.75) { api.bolt = Math.floor(r() * bolts); boltAt = t + 0.12; }
                next = t + 9 + r() * 9;
            }
            api.boltK = api.bolt >= 0 ? boltShape(t - boltAt) : 0;
            if (api.bolt >= 0 && t - boltAt > 1.1) api.bolt = -1;
            return Math.min(1, pulses.reduce((m, p) => Math.max(m, shape(t - p.at) * p.k), 0));
        },
    };
    return api;
};

// ---------- rain ----------
const COUNTS = { desktop: [160, 220], phone: [64, 88], lite: [0, 60] }; // near, far at "rain" (1)

/**
 * Rain as thin cut-paper slivers in two layers, angled by the wind, splashing on the front hill.
 * @param {object} o
 * @param {number} o.w  hero width (CSS px)   @param {number} o.h  hero height
 * @param {number} [o.amount=1]  0.5 light, 1 rain, 1.5 heavy
 * @param {number} [o.wind=0]  -2…2: strength and direction (negative blows right → left)
 * @param {"desktop"|"phone"|"lite"} [o.budget="desktop"]
 * @param {(x: number) => number} [o.ridge]  y of the front hill's top edge at x (for splashes); default 88 % of h
 * @param {{ x0: number, y0: number, x1: number, y1: number }[]} [o.clear]  the hero's words: the rain leaves a soft gap
 *   round each one, so it never falls across the text
 * @param {number} [o.seed]
 * @returns {{ step: (dt: number) => void, draw: (ctx: CanvasRenderingContext2D, colours: { near: string, far: string }) => void,
 *   resize: (w: number, h: number) => void, setWind: (wind: number) => void, setAmount: (amount: number) => void }}
 */
export const createRain = ({ w, h, amount = 1, wind = 0, budget = "desktop", ridge, clear = [], seed = 5 }) => {
    const r = seeded(seed);
    let W = w, H = h, A = amount, wd = wind, near = [], far = [], splashes = [];
    const ridgeY = ridge || ((x) => H * 0.88 + Math.sin(x / 300) * 6);
    const slant = () => 0.18 * wd; // tan of the angle from vertical
    const spawn = (layer, anywhere) => {
        const isNear = layer === "near";
        const len = isNear ? 14 + r() * 12 : 8 + r() * 4, speed = isNear ? 900 : 600;
        const spread = Math.abs(slant()) * H; // slanted drops drift sideways: start them upwind of the screen too
        return {
            x: (slant() > 0 ? -spread : 0) + r() * (W + spread),
            y: anywhere ? r() * H : -len - r() * H * 0.25,
            len, speed: speed * (0.9 + r() * 0.2),
        };
    };
    const fill = () => {
        const [n, f] = COUNTS[budget] || COUNTS.desktop;
        near = Array.from({ length: Math.round(n * A) }, () => spawn("near", true));
        far = Array.from({ length: Math.round(f * A) }, () => spawn("far", true));
    };
    fill();
    return {
        resize(w2, h2) { W = w2; H = h2; fill(); },
        setWind(v) { wd = v; },
        setAmount(v) { A = v; fill(); },
        step(dt) {
            const s = slant();
            for (const d of far) { d.y += d.speed * dt; d.x += d.speed * dt * s; if (d.y > H * 0.78) Object.assign(d, spawn("far")); }
            for (const d of near) {
                d.y += d.speed * dt; d.x += d.speed * dt * s;
                const g = ridgeY(d.x);
                if (d.y >= g) {
                    if (splashes.length < 12 && d.x > 0 && d.x < W) splashes.push({ x: d.x, y: g, t: 0 });
                    Object.assign(d, spawn("near"));
                }
            }
            splashes = splashes.filter((p) => (p.t += dt) < 0.18);
        },
        draw(ctx, colours) {
            const s = slant();
            ctx.lineCap = "round";
            ctx.strokeStyle = colours.far; ctx.lineWidth = 1; ctx.beginPath();
            for (const d of far) { ctx.moveTo(d.x, d.y); ctx.lineTo(d.x - d.len * s, d.y - d.len); }
            ctx.stroke();
            ctx.strokeStyle = colours.near; ctx.lineWidth = 1.5; ctx.beginPath();
            for (const d of near) { ctx.moveTo(d.x, d.y); ctx.lineTo(d.x - d.len * s, d.y - d.len); }
            for (const p of splashes) { // a tiny paper "V" that opens and fades
                const k = p.t / 0.18, a = 3 + k * 2;
                ctx.moveTo(p.x - a, p.y - a * 0.9); ctx.lineTo(p.x, p.y); ctx.lineTo(p.x + a, p.y - a * 0.9);
            }
            ctx.stroke();
            if (clear.length) {
                // rub the rain out behind the words: three nested boxes, each erasing a little more, for a soft edge
                ctx.save();
                ctx.globalCompositeOperation = "destination-out";
                for (const [pad, a] of [[14, 0.35], [8, 0.6], [3, 1]]) {
                    ctx.globalAlpha = a;
                    for (const b of clear) ctx.fillRect(b.x0 - pad, b.y0 - pad, b.x1 - b.x0 + 2 * pad, b.y1 - b.y0 + 2 * pad);
                }
                ctx.restore();
            }
        },
    };
};
