// skyPhysics: the motion behind dragging the sun (day) or the moon (night) on the page heroes (ideas #22).
// Stars part around the moon like water and close in behind it; paper clouds drift aside from the sun; when the
// visitor lets go, the body rests a moment, then glides back to its Kampala-clock place.
// Plain JavaScript with no DOM, timers or React: the caller (Sky.jsx) owns requestAnimationFrame, the canvas and the
// elements, and calls step(dt) each frame until it returns false (everything settled → stop drawing, zero frames).
// The numbers are the owner's, set on the tuner page (2026-10-24), starting from the design (brief Q1–Q2); see SKY_DEFAULTS.

/**
 * The design numbers. Units: px and seconds. Override any of them with createSkyField({ params }).
 * - radiusX: how far stars part, in moon widths (never less than 90 px)
 * - push: how hard the body shoves stars aside (px/s² at contact)
 * - k, zeta: the stars' spring back home (stiffness /s², damping: below 1 wobbles once like water)
 * - wake: how strongly nearby stars are carried along with the moving body (0–1)
 * - rest: seconds the body waits where it was dropped; returnK: stiffness of the glide home (always no bounce)
 * - cloudK, cloudZeta, cloudPush, cloudMax: the clouds' heavier spring, push and largest offset (px)
 */
export const SKY_DEFAULTS = Object.freeze({
    radiusX: 3.2, push: 2800, k: 18, zeta: 0.7, wake: 0.35,
    rest: 1.5, returnK: 10,
    cloudK: 1.5, cloudZeta: 0.85, cloudPush: 500, cloudMax: 140,
});

const DT = 1 / 120;               // fixed physics step: same feel at 60, 90 or 120 Hz
const RING_K = [220, 140, 90];    // the sun's rings trail the disc like ripples (zeta 0.6)
const FLICK = 600;                // px/s: faster than this on release and the body carries on with friction
const MAX_V = 2500;               // px/s: the body's speed as felt by the stars
const BAND = 0.35;                // past the hero's edges the body moves 35 % of the pointer's distance

/**
 * Creates the motion state for one hero.
 * @param {object} o
 * @param {{ x: number, y: number, r: number, a: number }[]} [o.stars]  star homes in CSS px; r = size, a = alpha
 * @param {{ x: number, y: number, w: number, h: number }[]} [o.clouds]  cloud centres and sizes in CSS px
 * @param {number} o.discR  the sun/moon disc radius in CSS px
 * @param {{ x: number, y: number }} o.home  where the body rests (its Kampala-clock place)
 * @param {{ w: number, h: number }} o.bounds  the hero's size in CSS px
 * @param {Partial<typeof SKY_DEFAULTS>} [o.params]  overrides of the design numbers
 * @param {boolean} [o.reduced]  reduced motion: stars and clouds stay still, the drag still works
 * @returns {{ body: { x: number, y: number, held: boolean }, rings: { x: number, y: number }[],
 *   stars: object[], clouds: { dx: number, dy: number, tilt: number }[],
 *   grab: (x: number, y: number, t: number) => void, drag: (x: number, y: number, t: number) => void,
 *   release: (t: number) => void, setHome: (x: number, y: number) => void, setBounds: (w: number, h: number) => void,
 *   setParams: (p: object) => void, step: (dt: number) => boolean }}
 *   step(dt) returns true while anything still moves; stop the animation loop when it returns false.
 * @example
 *   const field = createSkyField({ stars, discR: 32, home: { x: 900, y: 120 }, bounds: { w: 1440, h: 560 } });
 *   el.onpointerdown = (e) => { field.grab(x, y, e.timeStamp); loop(); };
 *   const loop = (t) => { const busy = field.step(dt); draw(field); if (busy) requestAnimationFrame(loop); };
 */
export const createSkyField = ({ stars = [], clouds = [], discR, home, bounds, params, reduced = false }) => {
    let P = { ...SKY_DEFAULTS, ...params };
    const B = { x: home.x, y: home.y, vx: 0, vy: 0, hx: home.x, hy: home.y, state: "home", restLeft: 0, held: false };
    let W = bounds.w, H = bounds.h, acc = 0, lastBusy = true;
    let grabOff = { x: 0, y: 0 }, last = null;

    const S = stars.map((s) => ({ ...s, hx: s.x, hy: s.y, vx: 0, vy: 0, m: 0.6 + (s.r ?? 1), alpha: s.a ?? 1 }));
    const C = clouds.map((c) => ({ ...c, dx: 0, dy: 0, vx: 0, vy: 0, tilt: 0 }));
    const R = RING_K.map(() => ({ x: B.x, y: B.y, vx: 0, vy: 0 }));
    const band = (v, lo, hi) => (v < lo ? lo + (v - lo) * BAND : v > hi ? hi + (v - hi) * BAND : v);
    const clampV = (v) => Math.max(-MAX_V, Math.min(MAX_V, v));

    // one fixed step of everything; returns true if anything is still moving or out of balance
    const tick = () => {
        // the body
        if (B.state === "fling") {
            const f = Math.exp(-5 * DT);
            B.vx *= f; B.vy *= f; B.x += B.vx * DT; B.y += B.vy * DT;
            if (Math.hypot(B.vx, B.vy) < 60) { B.state = "rest"; B.restLeft = P.rest; }
        } else if (B.state === "rest") {
            B.vx = B.vy = 0; B.restLeft -= DT;
            if (B.restLeft <= 0) B.state = "return";
        } else if (B.state === "return") {
            const c = 2 * Math.sqrt(P.returnK); // critically damped: smooth, no bounce, and interruptible
            B.vx += (P.returnK * (B.hx - B.x) - c * B.vx) * DT;
            B.vy += (P.returnK * (B.hy - B.y) - c * B.vy) * DT;
            B.x += B.vx * DT; B.y += B.vy * DT;
            if (Math.hypot(B.hx - B.x, B.hy - B.y) < 0.3 && Math.hypot(B.vx, B.vy) < 2) {
                B.x = B.hx; B.y = B.hy; B.vx = B.vy = 0; B.state = "home";
            }
        }
        let busy = B.state !== "home";
        // the rings
        R.forEach((r, i) => {
            const k = RING_K[i], c = 2 * 0.6 * Math.sqrt(k);
            r.vx += (k * (B.x - r.x) - c * r.vx) * DT; r.vy += (k * (B.y - r.y) - c * r.vy) * DT;
            r.x += r.vx * DT; r.y += r.vy * DT;
            if (Math.hypot(B.x - r.x, B.y - r.y) > 0.3 || Math.hypot(r.vx, r.vy) > 2) busy = true;
        });
        if (reduced) return busy;
        const bvx = clampV(B.vx), bvy = clampV(B.vy);
        // the stars: spring home + push from the body + a wake that carries them along
        if (S.length) {
            const c = 2 * P.zeta * Math.sqrt(P.k), Rp = Math.max(90, P.radiusX * discR * 2), wr = 1.6 * Rp, lim = 1.6 * Rp;
            for (const s of S) {
                let ax = P.k * (s.hx - s.x) - c * s.vx, ay = P.k * (s.hy - s.y) - c * s.vy;
                const dx = s.x - B.x, dy = s.y - B.y, d = Math.hypot(dx, dy);
                if (d < Rp && d > 0.01) { const f = (P.push * (1 - d / Rp) ** 2) / s.m; ax += (f * dx) / d; ay += (f * dy) / d; }
                if (d < wr) { const w = P.wake * 8 * (1 - d / wr); ax += w * (bvx - s.vx); ay += w * (bvy - s.vy); }
                s.vx += ax * DT; s.vy += ay * DT; s.x += s.vx * DT; s.y += s.vy * DT;
                const ox = s.x - s.hx, oy = s.y - s.hy, o = Math.hypot(ox, oy);
                if (o > lim) { s.x = s.hx + (ox / o) * lim; s.y = s.hy + (oy / o) * lim; }
                const sp = Math.hypot(s.vx, s.vy);
                s.alpha = Math.min(1, (s.a ?? 1) + Math.min(0.25, sp / 800)); // a disturbed star sparkles a little
                // settled = still and in balance (stars beside a resting moon stay parted, so offset alone isn't enough)
                if (!busy && (sp > 3 || Math.hypot(ax, ay) > 15)) busy = true;
            }
        }
        // the clouds: rigid paper pieces on a slow spring, pushed away from the body, tilting a little
        if (C.length) {
            const c = 2 * P.cloudZeta * Math.sqrt(P.cloudK);
            for (const cl of C) {
                let ax = -P.cloudK * cl.dx - c * cl.vx, ay = -P.cloudK * cl.dy - c * cl.vy;
                const dx = cl.x + cl.dx - B.x, dy = cl.y + cl.dy - B.y, d = Math.hypot(dx, dy), Rc = cl.w / 2 + 1.8 * discR;
                if (d < Rc && d > 0.01) { const f = P.cloudPush * (1 - d / Rc) ** 2; ax += (f * dx) / d; ay += (f * dy) / d; }
                cl.vx += ax * DT; cl.vy += ay * DT; cl.dx += cl.vx * DT; cl.dy += cl.vy * DT;
                const o = Math.hypot(cl.dx, cl.dy);
                if (o > P.cloudMax) { cl.dx *= P.cloudMax / o; cl.dy *= P.cloudMax / o; }
                cl.tilt = Math.max(-2, Math.min(2, (cl.dx / P.cloudMax) * 2)); // degrees, away from the sun
                if (!busy && (Math.hypot(cl.vx, cl.vy) > 3 || Math.hypot(ax, ay) > 15)) busy = true;
            }
        }
        return busy;
    };

    return {
        body: B,
        rings: R,
        stars: S,
        clouds: C,
        /** Pointer down on the disc (CSS px in the hero, t = event time in ms). */
        grab(x, y, t) {
            grabOff = { x: B.x - x, y: B.y - y };
            last = { x: B.x, y: B.y, t };
            B.state = "drag"; B.held = true; B.vx = B.vy = 0; lastBusy = true;
        },
        /** Pointer move while held: follows the pointer, rubber-banding past the hero's edges. */
        drag(x, y, t) {
            if (B.state !== "drag") return;
            const nx = band(x + grabOff.x, 0, W), ny = band(y + grabOff.y, 0, H);
            const dt = Math.max(1, t - last.t) / 1000;
            B.vx = B.vx * 0.6 + ((nx - last.x) / dt) * 0.4; // smoothed: feeds the wake and the flick
            B.vy = B.vy * 0.6 + ((ny - last.y) / dt) * 0.4;
            B.x = nx; B.y = ny; last = { x: nx, y: ny, t };
        },
        /** Pointer up or cancelled: a flick carries on with friction, then it rests, then glides home. */
        release() {
            if (B.state !== "drag") return;
            B.held = false;
            if (Math.hypot(B.vx, B.vy) > FLICK) B.state = "fling";
            else { B.state = "rest"; B.restLeft = P.rest; }
        },
        /** New resting place (the clock moved it, or the hero was resized). */
        setHome(x, y) {
            B.hx = x; B.hy = y;
            if (B.state === "home") { B.x = x; B.y = y; R.forEach((r) => { r.x = x; r.y = y; }); }
        },
        /** New hero size (for the rubber band). */
        setBounds(w, h) { W = w; H = h; },
        /** Change the numbers live (the tuner). */
        setParams(p) { P = { ...P, ...p }; },
        /** Advance by dt seconds (fixed sub-steps inside). Returns false once everything has settled. */
        step(dt) {
            acc += Math.min(0.1, dt); // a long pause (tab hidden) doesn't fire a burst of steps
            while (acc >= DT) { lastBusy = tick(); acc -= DT; } // a frame shorter than one step keeps the last answer
            return lastBusy || B.state === "drag";
        },
    };
};
