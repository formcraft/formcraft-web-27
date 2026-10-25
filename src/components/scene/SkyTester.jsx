// The team's Sky tester (Sky 3, the cloud's design, brief Q7): a small paper tab at the bottom left, for signed-in
// team members on the live site and for everyone in `npm run dev`, never for visitors. It previews every weather scene,
// the rain amount, the wind (and a gust on demand), day or night and the phone budget in THIS browser tab only
// (sessionStorage); the site's settings are changed in Admin → Sky and weather. Loaded on demand by Layout.jsx, so
// visitors never download it. It says nothing about moving the sun or moon (the owner's secret).
import { useState } from "react";
import { useTheme } from "../../hooks/useTheme";
import { useFeature, useSite } from "../../hooks/useSite";
import { GUST_EVENT, SKY_TEST_EVENT, SKY_TEST_KEY, useWeather } from "../../hooks/useWeather";
import { sceneSwitches } from "../../data/features";
import { SCENES } from "./sky/weatherShapes";
import { RAIN_AMOUNTS } from "../../data/sky";
import "./SkyTester.css";

const KINDS = ["clear", "partly", "overcast", "mist", "rain", "storm"];

const read = () => {
    try {
        return JSON.parse(sessionStorage.getItem(SKY_TEST_KEY) || "null") ?? {};
    } catch {
        return {};
    }
};
const write = (next) => {
    try {
        if (Object.keys(next).length) sessionStorage.setItem(SKY_TEST_KEY, JSON.stringify(next));
        else sessionStorage.removeItem(SKY_TEST_KEY);
    } catch {
        // storage blocked: the preview lasts until the next change
    }
    window.dispatchEvent(new CustomEvent(SKY_TEST_EVENT, { detail: next }));
};
const ago = (at) => {
    const t = Date.parse(at?.toDate ? at.toDate() : at);
    if (!Number.isFinite(t)) return "";
    const m = Math.round((Date.now() - t) / 60000);
    return m < 1 ? "just now" : m < 60 ? `${m} min ago` : `${Math.round(m / 60)} h ago`;
};

/** The Sky tester (team and development only). */
export const SkyTester = () => {
    const [open, setOpen] = useState(false);
    const [test, setTest] = useState(read);
    const { theme, toggle } = useTheme();
    const features = useSite()?.features ?? {};
    const liveOn = useFeature("liveWeather");
    const weather = useWeather();
    const on = sceneSwitches(features);
    const set = (patch) => {
        const next = { ...test, ...patch };
        Object.keys(next).forEach((k) => next[k] === undefined && delete next[k]);
        setTest(next);
        write(next);
    };
    const kind = test.kind ?? null;
    const status = !liveOn
        ? "Live weather is off (Admin → Features → Kampala's live weather)."
        : weather.live
          ? `Live Kampala: ${SCENES[weather.live.kind]?.label ?? weather.live.kind}, ${Number(weather.live.windMs ?? 0).toFixed(1)} m/s, ${ago(weather.live.at ?? weather.live.updatedAt)}.`
          : "No live data yet: showing a clear sky.";

    return (
        <div className={`sky-tester ${open ? "is-open" : ""}`}>
            <button type="button" className="sky-tester-tab" aria-expanded={open} aria-controls="sky-tester-card" onClick={() => setOpen((o) => !o)}>
                Sky
            </button>
            {open && (
                <section id="sky-tester-card" className="sky-tester-card" aria-label="Sky tester (this tab only)">
                    <p className="fine sky-tester-note">Preview only, in this tab. The site's settings are in Admin → Sky and weather.</p>
                    <fieldset className="sky-tester-set">
                        <legend>Weather</legend>
                        <div className="sky-tester-row">
                            <button type="button" className="chip" aria-pressed={!kind} onClick={() => set({ kind: undefined })}>Auto</button>
                            {KINDS.map((k) => (
                                <button key={k} type="button" className="chip" aria-pressed={kind === k} onClick={() => set({ kind: k })} title={k !== "clear" && on[k] === false ? "Switched off for visitors" : undefined}>
                                    {SCENES[k].label}
                                    {k !== "clear" && on[k] === false ? " (off)" : ""}
                                </button>
                            ))}
                        </div>
                    </fieldset>
                    {(weather.kind === "rain" || weather.kind === "storm") && (
                        <fieldset className="sky-tester-set">
                            <legend>Rain</legend>
                            <div className="sky-tester-row">
                                {RAIN_AMOUNTS.map((r) => (
                                    <button key={r.value} type="button" className="chip" aria-pressed={(test.rain ?? 1) === r.value} onClick={() => set({ rain: r.value })}>{r.label}</button>
                                ))}
                            </div>
                        </fieldset>
                    )}
                    <div className="sky-tester-set">
                        <label htmlFor="sky-tester-wind">Wind {weather.strength.toFixed(1)}</label>
                        <div className="sky-tester-row">
                            <input id="sky-tester-wind" type="range" min="0" max="2" step="0.1" value={test.wind ?? weather.strength} onChange={(e) => set({ wind: Number(e.target.value) })} />
                            <button type="button" className="btn btn-line btn-sm" onClick={() => window.dispatchEvent(new Event(GUST_EVENT))}>Gust now</button>
                        </div>
                    </div>
                    <div className="sky-tester-row">
                        <button type="button" className="btn btn-line btn-sm" onClick={toggle}>{theme === "night" ? "Day" : "Night"}</button>
                        <button type="button" className="chip" aria-pressed={test.budget === "phone"} onClick={() => set({ budget: test.budget === "phone" ? undefined : "phone" })}>Phone budget</button>
                        <button type="button" className="btn btn-line btn-sm" onClick={() => (setTest({}), write({}))}>Reset</button>
                    </div>
                    <p className="fine sky-tester-status" role="status">{status}</p>
                </section>
            )}
        </div>
    );
};
