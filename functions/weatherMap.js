// weatherMap: pure helpers for the Kampala weather sync (functions/weather.js), kept apart so they can be tested
// without Firebase (node --test functions/weatherMap.test.js).
// Turns MET Norway's Locationforecast answer into the site's six sky scenes (clear, partly, overcast, mist, rain,
// storm), as designed in docs/brief-living-sky.md Q6.

/** Kampala, to 4 decimals (MET Norway's terms: more decimals are refused). */
export const KAMPALA = { lat: 0.3476, lon: 32.5825 };

/**
 * The scene for a MET Norway symbol code (e.g. "lightrainshowers_day"); the _day / _night / _polartwilight ending is
 * ignored. Anything with thunder is a storm; snow and sleet (not expected in Kampala) count as rain.
 * @param {string} symbol
 * @returns {{ kind: "clear"|"partly"|"overcast"|"mist"|"rain"|"storm", intensity: number }}  intensity 0.5 light, 1, 1.5 heavy
 * @example sceneFromSymbol("heavyrainandthunder") // { kind: "storm", intensity: 1.5 }
 */
export const sceneFromSymbol = (symbol) => {
    const s = String(symbol || "").replace(/_(day|night|polartwilight)$/, "");
    if (s.includes("thunder")) return { kind: "storm", intensity: 1.5 };
    if (s === "clearsky" || s === "fair") return { kind: "clear", intensity: 0 };
    if (s === "partlycloudy") return { kind: "partly", intensity: 0 };
    if (s === "cloudy") return { kind: "overcast", intensity: 0 };
    if (s === "fog") return { kind: "mist", intensity: 0 };
    if (/rain|sleet|snow/.test(s)) return { kind: "rain", intensity: s.startsWith("light") ? 0.5 : s.startsWith("heavy") ? 1.5 : 1 };
    return { kind: "clear", intensity: 0 }; // unknown code: never invent weather
};

/**
 * The next hours of the forecast in a small shape the sync can keep (the full answer is far bigger).
 * @param {object} json  Locationforecast 2.0 "compact" answer
 * @param {number} [hours=12]
 * @returns {{ time: string, symbol: string, windMs: number, windFromDeg: number }[]}
 */
export const toSeries = (json, hours = 12) =>
    (json?.properties?.timeseries ?? [])
        .slice(0, hours)
        .map((t) => ({
            time: t.time,
            symbol: t.data?.next_1_hours?.summary?.symbol_code ?? t.data?.next_6_hours?.summary?.symbol_code ?? "",
            windMs: Number(t.data?.instant?.details?.wind_speed ?? 0),
            windFromDeg: Number(t.data?.instant?.details?.wind_from_direction ?? 0),
        }))
        .filter((t) => t.time && t.symbol);

/**
 * The forecast hour that covers `now` (the latest one that has started), or null if the series is empty or too old.
 * @param {{ time: string }[]} series  sorted by time
 * @param {Date} [now]
 * @returns {object|null}
 */
export const pickNow = (series, now = new Date()) => {
    let best = null;
    for (const t of series ?? []) if (new Date(t.time) <= now) best = t;
    if (!best && series?.length && new Date(series[0].time) - now < 60 * 60 * 1000) best = series[0]; // first hour just ahead
    if (best && now - new Date(best.time) > 2 * 60 * 60 * 1000) return null; // older than 2 h: don't show stale weather
    return best;
};

/**
 * The public record for the site (Firestore stats/weather), from one forecast hour.
 * @param {{ time: string, symbol: string, windMs: number, windFromDeg: number }} hour
 * @param {{ kind?: string }} [previous]  the record before, to remember when the scene changed (for a rainbow later)
 * @returns {{ kind: string, intensity: number, windMs: number, windFromDeg: number, symbol: string, validFor: string, prevKind: string|null, changed: boolean }}
 */
export const recordFor = (hour, previous) => {
    const { kind, intensity } = sceneFromSymbol(hour.symbol);
    const changed = Boolean(previous?.kind) && previous.kind !== kind;
    return {
        kind, intensity,
        windMs: Math.round(hour.windMs * 10) / 10,
        windFromDeg: Math.round(hour.windFromDeg),
        symbol: hour.symbol,
        validFor: hour.time,
        prevKind: changed ? previous.kind : previous?.prevKind ?? null,
        changed,
    };
};
