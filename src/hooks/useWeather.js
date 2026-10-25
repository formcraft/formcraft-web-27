// useWeather(): which weather the page heroes show right now, and how windy and wet it is (Sky 3, ideas #23).
// The scene is decided in this order:
//   1. a ?sky= link (?sky=rain&wind=1.5&budget=phone; anyone can open one, nothing is saved, the canonical tag drops it)
//      or the team's Sky tester (this tab only, sessionStorage) — both are previews, so they ignore the scene switches;
//   2. Admin → Sky and weather: a fixed scene, or "auto";
//   3. "auto": Kampala's live weather (stats/weather) when Admin → Features "Kampala's live weather" is on, else clear;
//   4. the scene switches (Admin → Features → Weather): a switched-off scene falls back to the nearest calmer one.
// Wind: the live wind speed through windFromMs (scaled by the Admin slider), or the slider itself with a fixed scene,
// never below the scene's minimum (a storm is windy); the sign is the direction (an easterly blows right → left).
// Pre-rendered pages: the build and React's first render show the defaults (clear, the saved wind), the device's
// preview choices follow straight after (useHydration.js).
import { useEffect } from "react";
import { useFeature, useSite } from "./useSite";
import { usePublicDoc } from "./usePublicDoc";
import { useDeviceState } from "./useHydration";
import { SCENES, fallbackScene, windFromMs } from "../components/scene/sky/weatherShapes";
import { sceneSwitches } from "../data/features";

/** sessionStorage key of the team's Sky tester choices (this tab only; never the site's settings). */
export const SKY_TEST_KEY = "fc-sky-test";
/** Fired on window when the tester changes something; detail: the new choices (or null). */
export const SKY_TEST_EVENT = "fc:sky-test";
const EASTERLY = -1; // Kampala's usual wind; the real direction arrives with the live sync (Sky 4)
const NONE = null;

// A preview from the address (?sky=…) or the tester, or null
const readPreview = () => {
    try {
        const q = new URLSearchParams(window.location.search);
        const kind = q.get("sky");
        const fromLink = kind && SCENES[kind] ? { kind, wind: q.has("wind") ? Number(q.get("wind")) : undefined, budget: q.get("budget") || undefined, source: "link" } : null;
        if (fromLink) return fromLink;
        const saved = JSON.parse(sessionStorage.getItem(SKY_TEST_KEY) || "null");
        return saved && (saved.kind || saved.wind != null) ? { ...saved, source: "tester" } : null;
    } catch {
        return null;
    }
};

const clampWind = (v) => Math.max(0, Math.min(2, Number.isFinite(v) ? v : 1));

/**
 * The weather for the page heroes (and the Home 3D model).
 * @returns {{ kind: string, scene: object, wind: number, strength: number, rain: number, budget: string|null, live: object|null, preview: string|null }}
 *   kind: clear | partly | overcast | mist | rain | storm; scene: SCENES[kind]; wind: −2…2 with direction (negative =
 *   right → left); strength: |wind|; rain: the rain amount (0 none, 0.5 light, 1, 1.5 heavy, × Admin's rain setting);
 *   budget: "phone" when forced by a preview, else null (the caller decides by screen); live: the stats/weather record
 *   when live weather is on; preview: "link" | "tester" | null
 */
export const useWeather = () => {
    const site = useSite();
    const sky = site?.sky ?? {};
    const features = site?.features ?? {};
    const scenesOn = useFeature("weather");
    const liveOn = useFeature("liveWeather");
    const { data: live } = usePublicDoc(liveOn ? "stats/weather" : NONE);
    const [preview, setPreview] = useDeviceState(readPreview, NONE);

    // the tester changes this tab's preview live
    useEffect(() => {
        const onTest = () => setPreview(readPreview());
        window.addEventListener(SKY_TEST_EVENT, onTest);
        return () => window.removeEventListener(SKY_TEST_EVENT, onTest);
    }, [setPreview]);

    let kind;
    if (preview?.kind) kind = preview.kind;
    else {
        const asked = sky.weather && sky.weather !== "auto" ? sky.weather : liveOn && live?.kind ? live.kind : "clear";
        kind = scenesOn ? fallbackScene(asked, sceneSwitches(features)) : "clear";
    }
    if (!SCENES[kind]) kind = "clear";
    const scene = SCENES[kind];

    const slider = clampWind(sky.wind);
    let strength;
    if (preview?.wind != null && Number.isFinite(preview.wind)) strength = clampWind(preview.wind);
    else if (!preview?.kind && (!sky.weather || sky.weather === "auto") && liveOn && live) strength = windFromMs(live.windMs, slider, kind);
    else strength = slider === 0 ? 0 : Math.min(2, Math.max(slider, scene.minWind ?? 0));
    const rain = (scene.rain ?? 0) * (Number.isFinite(Number(preview?.rain)) ? Number(preview.rain) : Number.isFinite(Number(sky.rain)) ? Number(sky.rain) : 1);

    return { kind, scene, wind: strength * EASTERLY, strength, rain, budget: preview?.budget ?? null, live: liveOn ? live ?? null : null, preview: preview?.source ?? null };
};
