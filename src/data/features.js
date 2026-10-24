// The site features the admin can switch on and off (Admin → Features), saved in Firestore
// `settings/site.features` and cached on the device. A feature that's off isn't shown and doesn't run.
// Never switchable (by design): the cookie notice, the skip link and other accessibility pieces,
// respecting reduced motion, the 2D drawing (it's the fallback), sign-in, Admin, page switches and this
// panel, and security (honeypots, headers, rules).
//
// To add a switch: add an entry here, then check it where the feature lives with useFeature(key)
// (src/hooks/useSite.js). The living-sky switches (sun and moon, wind, each weather scene) arrive with
// those features (docs/brief-living-sky.md).

// Said under the weather switches until the scenes are wired into the page heroes (Sky 3)
const WEATHER_NOTE = "The scenes go live with the living sky; these switches take effect from then.";

/** localStorage key for the cached switches; index.html reads it too (the opening runs before the app). */
export const FEATURES_CACHE = "fc-site-features";

/**
 * Every switch: key, group, label, help, default and (optionally) the key it depends on.
 * @type {{ key: string, group: string, label: string, help: string, on: boolean, needs?: string, note?: string }[]}
 */
export const FEATURES = [
    {
        key: "intro",
        group: "Site",
        label: "Opening animation",
        help: "The drawing sheet with the FC stamp that tears off on a visitor's first visit.",
        on: true,
        note: "It runs before the rest of the site loads, so a change reaches each visitor from their second visit.",
    },
    { key: "subscribePrompt", group: "Site", label: "Email sign-up prompt", help: "The small slip that offers email updates on long pages. The footer sign-up stays.", on: true },
    { key: "plantTree", group: "Site", label: "Plant-a-tree button", help: "The round orange button in the bottom-right corner of every page. The /donate page stays.", on: true },
    { key: "home3d", group: "Home", label: "3D hotel model", help: "The paper model that builds itself on Home. Off: every visitor sees the 2D drawing instead.", on: true },
    { key: "scraps", group: "Home", label: "Falling paper scraps", help: "The small pieces of paper drifting through the 3D model.", on: true, needs: "home3d" },
    // Sky in the page heroes (ideas #22). The moon is the owner's secret: no hint anywhere visitors can read.
    { key: "skyBodies", group: "Sky", label: "Move the sun and moon", help: "Visitors can drag the sun (day) or the moon (night) around the hero sky; it glides back to its Kampala-clock place. Not announced anywhere on the site.", on: true },
    { key: "skyFluid", group: "Sky", label: "Stars and clouds make way", help: "While the sun or moon is moved, stars part around it like water and clouds drift aside, then settle.", on: true, needs: "skyBodies" },
    // Weather scenes in the page heroes (owner, 2026-10-24: "turn off the thunderstorm or the rain and leave
    // the main daylight and night-time"). Clear day and night are always on. A scene that's off falls back to
    // the nearest calmer one that's on (fallbackScene in src/components/scene/sky/weatherShapes.js).
    { key: "weather", group: "Weather", label: "Weather scenes", help: "Cloud, mist, rain and storm skies in the page heroes, following Kampala's weather. Off: always a clear sky by day and by night.", on: true, note: WEATHER_NOTE },
    { key: "scenePartly", group: "Weather", label: "Partly cloudy", help: "A few paper clouds.", on: true, needs: "weather" },
    { key: "sceneOvercast", group: "Weather", label: "Overcast", help: "Torn-paper cloud decks; the sun or moon dims behind them.", on: true, needs: "weather" },
    { key: "sceneMist", group: "Weather", label: "Mist", help: "A band of tracing-paper mist over the hills. Off: partly cloudy instead.", on: true, needs: "weather" },
    { key: "sceneRain", group: "Weather", label: "Rain", help: "Cut-paper rain. Off: overcast instead.", on: true, needs: "weather" },
    { key: "sceneStorm", group: "Weather", label: "Storm", help: "Heavy rain, strong wind and a soft glow inside the clouds (never bright flashes). Off: rain instead.", on: true, needs: "weather" },
];

/** The groups in Admin → Features, in order. */
export const FEATURE_GROUPS = ["Site", "Home", "Sky", "Weather"];

/** Saved switches over the defaults: { key: true|false } for every feature (unknown saved keys are dropped). */
export const mergeFeatures = (saved) => Object.fromEntries(FEATURES.map((f) => [f.key, typeof saved?.[f.key] === "boolean" ? saved[f.key] : f.on]));

const SCENE_KEYS = { partly: "scenePartly", overcast: "sceneOvercast", mist: "sceneMist", rain: "sceneRain", storm: "sceneStorm" };

/**
 * Which weather scenes are switched on, in the shape fallbackScene() takes. With "Weather scenes" off, every
 * scene is off (always clear). Clear isn't listed: it's always on.
 * @param {Record<string, boolean>} features  merged switches (useSite().features)
 * @returns {{ partly: boolean, overcast: boolean, mist: boolean, rain: boolean, storm: boolean }}
 * @example fallbackScene("storm", sceneSwitches(features)) // "rain" when Storm is off
 */
export const sceneSwitches = (features) => Object.fromEntries(Object.entries(SCENE_KEYS).map(([scene, key]) => [scene, features?.weather !== false && features?.[key] !== false]));
