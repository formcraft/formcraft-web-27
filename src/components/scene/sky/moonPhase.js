// moonPhase: the real moon phase for the night-edition moon (ideas #22, brief Q10), and the shape of its lit part.
// The phase is counted from a known new moon (2000-01-06 18:14 UTC) in synodic months of 29.53059 days; good to
// within about half a day, which is plenty for a drawing. Kampala detail: on the equator the crescent lies almost
// flat ("boat moon"), so the lit edge is turned to face where the sun has set (evening) or will rise (morning).
// Plain JavaScript, no DOM: the caller puts the path in an SVG clipPath.

/** Days in one cycle of the moon's phases (new moon to new moon). */
export const SYNODIC = 29.530588853;
const NEW_MOON_DAY = Date.UTC(2000, 0, 6, 18, 14) / 86400000; // a known new moon, in days since 1970
const NAMES = ["New moon", "Waxing crescent", "First quarter", "Waxing gibbous", "Full moon", "Waning gibbous", "Last quarter", "Waning crescent"];

/**
 * The moon's phase on a date.
 * @param {Date} [date] defaults to now
 * @returns {{ age: number, fraction: number, waxing: boolean, name: string }}
 *   age: days since the last new moon (0–29.5); fraction: how much of the disc is lit (0–1);
 *   waxing: true in the first half of the cycle (lit on the evening side); name: e.g. "Waxing crescent".
 * @example moonPhase(new Date("2026-10-26T18:00:00Z")).name // "Full moon"
 */
export const moonPhase = (date = new Date()) => {
    const days = date.getTime() / 86400000;
    const age = (((days - NEW_MOON_DAY) % SYNODIC) + SYNODIC) % SYNODIC;
    const fraction = (1 - Math.cos((2 * Math.PI * age) / SYNODIC)) / 2;
    return { age, fraction, waxing: age < SYNODIC / 2, name: NAMES[Math.round((age / SYNODIC) * 8) % 8] };
};

/**
 * The lit part of the moon as an SVG path centred on 0,0, plus the turn that points the lit edge at the sun.
 * Use it as a clipPath over the disc; draw the whole disc faintly underneath so a new moon can still be found.
 * @param {{ age: number, waxing: boolean }} phase  from moonPhase()
 * @param {number} [r=44]  disc radius in SVG units (the site's moon is drawn at r = 44 in a 200-unit box)
 * @param {number} [tilt=60]  degrees the lit edge is turned down toward the horizon (60 ≈ the equator's "boat moon")
 * @returns {{ d: string, rotate: number }}  e.g. <path d={d} transform={`rotate(${rotate})`} />
 */
export const moonLitPath = (phase, r = 44, tilt = 60) => {
    const phi = (2 * Math.PI * phase.age) / SYNODIC;
    const rx = Math.abs(Math.cos(phi)) * r;   // the terminator is an ellipse this wide
    const gibbous = Math.cos(phi) < 0;        // more than half lit: the terminator bulges the other way
    const d = `M0,${-r}A${r},${r} 0 0 1 0,${r}A${rx.toFixed(2)},${r} 0 0 ${gibbous ? 1 : 0} 0,${-r}Z`; // lit on the right
    // waxing (evening): lit side toward the set sun, lower right; waning (morning): lower left
    return { d, rotate: phase.waxing ? tilt : 180 - tilt };
};
