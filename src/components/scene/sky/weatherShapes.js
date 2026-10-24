// weatherShapes: the paper weather for the page heroes (ideas #23, docs/brief-living-sky.md Q4–Q6).
// Six scenes: clear, partly cloudy, overcast, mist, rain and storm. Everything is cut paper: torn strips for the
// cloud deck, puffy paper clouds, a tall storm cloud lit softly from inside (never a flash), a sheet of tracing paper
// for morning mist, and rain as thin paper slivers that splash on the front hill.
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
const f1 = (n) => Math.round(n * 10) / 10;

/**
 * A torn-paper strip hanging from the top of the sky (overcast and storm cloud decks). The lower edge is torn:
 * a slow wave, smaller bites, and fine fibres.
 * @param {{ w: number, base: number, amp?: number, seed?: number }} o  w: hero width; base: average depth of the edge
 * @returns {string}  SVG path
 */
export const deckStrip = ({ w, base, amp = 14, seed = 1 }) => {
    const r = seeded(seed), ph = r() * 6, ph2 = r() * 6;
    let d = `M-30,-20L${f1(w + 30)},-20`;
    const pts = [];
    for (let x = w + 30; x >= -30; x -= 7) {
        let y = base + amp * (Math.sin(x / 170 + ph) * 0.6 + Math.sin(x / 61 + ph2) * 0.25);
        y += (r() - 0.5) * 5;                      // fibres
        if (r() < 0.05) y += 6 + r() * 10;         // a deeper bite now and then
        pts.push(`L${f1(x)},${f1(y)}`);
    }
    return d + pts.join("") + "Z";
};

/**
 * The deck strips for a scene, in drawing order: [{ d, tone }]. Every strip hangs from the top of the sky, so the
 * longest is drawn first and each shorter one on top; that way all the torn edges show, lighter above, darker
 * below (the heavy underside of the cloud). tone = "back" | "front" | "storm-back" | "storm-front" (the token).
 */
export const deckFor = (kind, w, h, seed = 7) => {
    const n = SCENES[kind]?.decks ?? 0;
    if (n === 2) return [
        { d: deckStrip({ w, base: h * 0.24, amp: 12, seed: seed + 2 }), tone: "front" },
        { d: deckStrip({ w, base: h * 0.16, amp: 14, seed: seed + 1 }), tone: "back" },
    ];
    if (n === 3) return [
        { d: deckStrip({ w, base: h * 0.4, amp: 14, seed: seed + 5 }), tone: "storm-front" },
        { d: deckStrip({ w, base: h * 0.3, amp: 16, seed: seed + 4 }), tone: "storm-back" },
        { d: deckStrip({ w, base: h * 0.2, amp: 16, seed: seed + 3 }), tone: "front" },
    ];
    return [];
};

/**
 * One puffy paper cloud as overlapping circles with a flat base, centred on (cx, cy).
 * @param {{ cx: number, cy: number, w: number, seed?: number }} o  w: overall width in px
 * @returns {string}
 */
export const puffCloud = ({ cx, cy, w, seed = 1 }) => {
    const r = seeded(seed), s = w / 200, base = cy + 18 * s;
    const bumps = [[-70, -2, 26], [-38, -20, 34], [4, -26, 38], [44, -14, 30], [74, 0, 22]];
    let d = "";
    for (const [x, y, rr] of bumps) {
        const k = rr * s * (0.88 + r() * 0.24), X = cx + x * s, Y = cy + y * s;
        // clockwise, like the base below: opposite windings would cut holes where the shapes overlap
        d += `M${f1(X - k)},${f1(Y)}a${f1(k)},${f1(k)} 0 1,1 ${f1(2 * k)},0a${f1(k)},${f1(k)} 0 1,1 ${f1(-2 * k)},0`;
    }
    const l = cx - 92 * s, rgt = cx + 92 * s, t = base - 9 * s;
    return d + `M${f1(l)},${f1(t)}H${f1(rgt)}a${f1(9 * s)},${f1(9 * s)} 0 0 1 0,${f1(18 * s)}H${f1(l)}a${f1(9 * s)},${f1(9 * s)} 0 0 1 0,${f1(-18 * s)}Z`;
};

/** Puffy clouds for a scene, kept to the right 55 % of the sky and the top band (away from the headline). */
export const puffsFor = (kind, w, h, seed = 7) => {
    const n = SCENES[kind]?.puffs ?? 0, small = w < 600;
    const spots = [[0.7, 0.14, 1], [0.92, 0.3, 0.75], [0.56, 0.07, 0.62], [0.83, 0.2, 0.85]];
    return spots.slice(0, n).map(([x, y, s], i) => {
        const cw = 220 * s * (small ? 0.62 : 1);
        return { d: puffCloud({ cx: x * w, cy: y * h + cw * 0.2, w: cw, seed: seed + 20 + i }), cx: x * w, cy: y * h + cw * 0.2, w: cw };
    });
};

/**
 * The tall storm cloud on the right: three rows of stacked puffs, plus where its inner glow sits.
 * @returns {{ d: string, glow: { cx: number, cy: number, r: number } }}
 */
export const stormCloud = (w, h, seed = 7) => {
    const cx = w * (w < 600 ? 0.78 : 0.8), cw = Math.min(360, w * 0.32);
    const rows = [[h * 0.4, 1], [h * 0.27, 0.82], [h * 0.15, 0.62]];
    const d = rows.map(([y, s], i) => puffCloud({ cx: cx + (i % 2 ? -cw * 0.06 : cw * 0.04), cy: y, w: cw * s, seed: seed + 40 + i })).join("");
    return { d, glow: { cx, cy: h * 0.28, r: cw * 0.55 } };
};

/**
 * Morning mist: a sheet of tracing paper laid over the far hills, from the horizon up about 35 % of the sky,
 * with a gently wavy top. Fill it with a vertical gradient (the mist token at the bottom, clear at the top).
 * @param {{ w: number, h: number, horizon: number, seed?: number }} o  horizon: y of the hills' top edge in px
 * @returns {{ d: string, top: number, bottom: number }}
 */
export const mistBand = ({ w, h, horizon, seed = 7 }) => {
    const r = seeded(seed), ph = r() * 6, top = horizon - h * 0.35 * (horizon / h), bottom = horizon + h * 0.12;
    let d = `M-20,${f1(bottom)}`;
    for (let x = -20; x <= w + 20; x += 24) d += `L${x},${f1(top + 10 * Math.sin(x / 140 + ph) + 5 * Math.sin(x / 47 + ph * 2))}`;
    return { d: d + `L${f1(w + 20)},${f1(bottom)}Z`, top, bottom };
};

// ---------- storm glow ----------
/**
 * The storm cloud's inner glow, as an opacity over time: every 9–18 s it rises over 400 ms, holds 150 ms and fades
 * over 900 ms; one time in three a smaller second pulse follows 300 ms later. Far below flash-safety limits.
 * @param {number} [seed]
 * @returns {{ step: (dt: number) => number }}  step(dt) → opacity 0–1 for this frame
 */
export const createStormGlow = (seed = 9) => {
    const r = seeded(seed);
    let t = 0, next = 3 + r() * 6, pulses = [];
    const shape = (u) => (u < 0 ? 0 : u < 0.4 ? u / 0.4 : u < 0.55 ? 1 : u < 1.45 ? 1 - (u - 0.55) / 0.9 : 0);
    return {
        step(dt) {
            t += dt;
            if (t >= next) {
                pulses = [{ at: t, k: 1 }];
                if (r() < 1 / 3) pulses.push({ at: t + 0.3, k: 0.55 });
                next = t + 9 + r() * 9;
            }
            return Math.min(1, pulses.reduce((m, p) => Math.max(m, shape(t - p.at) * p.k), 0));
        },
    };
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
 * @param {number} [o.seed]
 * @returns {{ step: (dt: number) => void, draw: (ctx: CanvasRenderingContext2D, colours: { near: string, far: string }) => void,
 *   resize: (w: number, h: number) => void, setWind: (wind: number) => void, setAmount: (amount: number) => void }}
 */
export const createRain = ({ w, h, amount = 1, wind = 0, budget = "desktop", ridge, seed = 5 }) => {
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
        },
    };
};
