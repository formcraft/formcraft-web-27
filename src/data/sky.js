// The sky and weather settings the team tunes in Admin → Sky and weather (Firestore `settings/site.sky`).
// - params: how the stars and clouds respond when a visitor moves the sun or moon (the engine's numbers,
//   src/components/scene/sky/skyPhysics.js); the defaults are the owner's own, set on the tuner page.
// - weather: what the page heroes show: "auto" (Kampala's live weather, once that's switched on in Admin →
//   Features) or one scene for everyone (clear, partly, overcast, mist, rain, storm).
// - rain: how hard it rains in the rain scene (0.5 light, 1 rain, 1.5 heavy; storms are always heavy).
// - wind: wind strength, 0 calm … 2 (it scales Kampala's real wind; with a fixed scene it's the wind itself).
// The weather fields take effect when the weather scenes go live in the page heroes (living sky step 3).
import { SKY_DEFAULTS } from "../components/scene/sky/skyPhysics";

/** localStorage key for the cached settings, so a returning visitor's sky behaves as tuned straight away. */
export const SKY_CACHE = "fc-site-sky";

/**
 * The engine numbers the team can tune: key, group, label, help, range, step and unit.
 * @type {{ key: string, group: "stars"|"letgo"|"clouds", label: string, help: string, min: number, max: number, step: number, unit: string }[]}
 */
export const SKY_FIELDS = [
    { key: "radiusX", group: "stars", label: "How far the stars part", help: "In widths of the moon.", min: 1.5, max: 4.5, step: 0.1, unit: "×" },
    { key: "push", group: "stars", label: "How hard the moon pushes", help: "Higher sweeps the stars aside more firmly.", min: 600, max: 6000, step: 100, unit: "" },
    { key: "k", group: "stars", label: "How fast they close in", help: "Higher closes the gap behind the moon sooner.", min: 4, max: 45, step: 1, unit: "" },
    { key: "zeta", group: "stars", label: "Wobble", help: "Low wobbles once like water; 1 settles with no wobble.", min: 0.3, max: 1.2, step: 0.05, unit: "" },
    { key: "wake", group: "stars", label: "Wake", help: "How much nearby stars are carried along, then swirl back.", min: 0, max: 1, step: 0.05, unit: "" },
    { key: "rest", group: "letgo", label: "Pause before going home", help: "Seconds the sun or moon waits where it was dropped.", min: 0, max: 4, step: 0.1, unit: " s" },
    { key: "returnK", group: "letgo", label: "Glide home", help: "Higher glides back faster; always smooth, never bouncy.", min: 3, max: 40, step: 1, unit: "" },
    { key: "cloudK", group: "clouds", label: "How fast clouds drift back", help: "Clouds are heavy paper: low is slow and lazy.", min: 1, max: 14, step: 0.5, unit: "" },
    { key: "cloudPush", group: "clouds", label: "How firmly the sun nudges them", help: "Higher pushes the clouds further aside.", min: 100, max: 2000, step: 50, unit: "" },
];

/** The weather choices, in the order the admin sees them. "auto" = Kampala's live weather. */
export const WEATHER_MODES = [
    { key: "auto", label: "Kampala's live weather" },
    { key: "clear", label: "Clear" },
    { key: "partly", label: "Partly cloudy" },
    { key: "overcast", label: "Overcast" },
    { key: "mist", label: "Mist" },
    { key: "rain", label: "Rain" },
    { key: "storm", label: "Storm" },
];

/** Rain amounts for the rain scene. */
export const RAIN_AMOUNTS = [
    { value: 0.5, label: "Light" },
    { value: 1, label: "Rain" },
    { value: 1.5, label: "Heavy" },
];

/** The sky settings when nothing is saved: the owner's tuned numbers, live weather, normal rain, normal wind. */
export const SKY_SETTINGS_DEFAULTS = Object.freeze({
    params: Object.fromEntries(SKY_FIELDS.map((f) => [f.key, SKY_DEFAULTS[f.key]])),
    weather: "auto",
    rain: 1,
    wind: 1,
});

const clamp = (v, lo, hi, fallback) => {
    const n = Number(v);
    return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : fallback;
};

/**
 * Saved settings over the defaults, every number kept in its range (so a bad value written straight to the
 * database can't break the sky).
 * @param {object|null} saved  settings/site.sky
 * @returns {{ params: Record<string, number>, weather: string, rain: number, wind: number }}
 */
export const mergeSky = (saved) => {
    const d = SKY_SETTINGS_DEFAULTS;
    return {
        params: Object.fromEntries(SKY_FIELDS.map((f) => [f.key, clamp(saved?.params?.[f.key], f.min, f.max, d.params[f.key])])),
        weather: WEATHER_MODES.some((m) => m.key === saved?.weather) ? saved.weather : d.weather,
        rain: RAIN_AMOUNTS.some((r) => r.value === saved?.rain) ? saved.rain : d.rain,
        wind: clamp(saved?.wind, 0, 2, d.wind),
    };
};
