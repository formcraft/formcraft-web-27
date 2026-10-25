// Admin → Sky and weather: the team tunes the sky in the page heroes and tries every weather scene before saving.
// Top: a preview hero (SkyPreview) with preview-only controls (scene, day or night, device, reduced motion).
// Below: the settings every visitor gets, saved in Firestore settings/site.sky (src/data/sky.js): what weather to
// show, rain and wind, and how the stars and clouds respond when the sun or moon is moved. The sliders change the
// preview straight away; Save makes them the site's settings.
import { useState } from "react";
import { useSite } from "../../hooks/useSite";
import { useAuth } from "../../hooks/useAuth";
import { useTheme } from "../../hooks/useTheme";
import { SCENES } from "../scene/sky/weatherShapes";
import { RAIN_AMOUNTS, SKY_FIELDS, SKY_SETTINGS_DEFAULTS, WEATHER_MODES, mergeSky } from "../../data/sky";
import { SkyPreview } from "./SkyPreview";
import "./SkyPanel.css";

const GROUPS = [
    { key: "stars", title: "Stars around the moon", help: "When a visitor moves the moon, the stars part around it like water and close in behind it." },
    { key: "letgo", title: "Letting go", help: "After the sun or moon is dropped, it waits, then glides back to its place on Kampala's clock." },
    { key: "clouds", title: "Clouds around the sun", help: "By day the paper clouds drift aside from the sun and float back." },
];

const show = (f, v) => `${f.step < 1 ? Number(v).toFixed(f.step < 0.1 ? 2 : 1) : Math.round(v)}${f.unit}`;

/** A row of buttons where one is chosen (a segmented control). */
const Choice = ({ label, options, value, onChange, id }) => (
    <div className="field">
        <span className="sky-panel-label" id={id}>{label}</span>
        <div className="sky-panel-seg" role="group" aria-labelledby={id}>
            {options.map((o) => (
                <button key={o.value} type="button" aria-pressed={o.value === value} onClick={() => onChange(o.value)}>
                    {o.label}
                </button>
            ))}
        </div>
    </div>
);

/** Admin → Sky and weather (team): preview every scene, tune the sky, save it for every visitor. */
export const SkyPanel = () => {
    const { sky, setSky, features } = useSite();
    const { isAdmin } = useAuth();
    const { theme } = useTheme();
    const [values, setValues] = useState(sky);
    const [preview, setPreview] = useState(() => ({
        scene: sky.weather === "auto" ? "clear" : sky.weather,
        edition: theme === "night" ? "night" : "day",
        budget: "desktop",
        reduced: false,
        dir: -1,
    }));
    const [busy, setBusy] = useState(false);
    const [note, setNote] = useState(null);
    const changed = JSON.stringify(mergeSky(values)) !== JSON.stringify(sky);

    const setParam = (key, v) => setValues((s) => ({ ...s, params: { ...s.params, [key]: Number(v) } }));
    const setWeather = (weather) => {
        setValues((s) => ({ ...s, weather }));
        if (weather !== "auto") setPreview((p) => ({ ...p, scene: weather })); // show what was just picked
    };

    const save = async (event) => {
        event.preventDefault();
        setBusy(true);
        setNote(null);
        try {
            await setSky(values);
            setNote({ ok: true, text: "Saved. Visitors get the new sky on their next page load." });
        } catch (e) {
            setNote({ ok: false, text: e.code === "permission-denied" ? "Firestore refused the change: this account isn't on the team yet." : e.message });
        } finally {
            setBusy(false);
        }
    };

    const dragOff = features?.skyBodies === false;
    const weatherOff = features?.weather === false;

    return (
        <form className="stack sky-panel" style={{ "--gap": "22px" }} onSubmit={save} aria-labelledby="sky-title">
            <div className="stack" style={{ "--gap": "6px" }}>
                <h3 className="h3" id="sky-title">Sky and weather</h3>
                <p className="small">
                    How the sky in the page heroes behaves. Try anything in the preview, including dragging the sun or moon; Save makes the settings below the site's for every visitor. Home's 3D model has its own sky.
                </p>
            </div>

            <section className="stack sky-panel-preview" style={{ "--gap": "12px" }} aria-label="Preview">
                <SkyPreview
                    edition={preview.edition}
                    scene={preview.scene}
                    wind={values.wind}
                    dir={preview.dir}
                    rain={values.rain}
                    params={values.params}
                    budget={preview.budget}
                    reduced={preview.reduced}
                />
                <div className="sky-panel-row">
                    <Choice id="skyp-scene" label="Scene (preview)" value={preview.scene} onChange={(scene) => setPreview((p) => ({ ...p, scene }))} options={Object.entries(SCENES).map(([value, s]) => ({ value, label: s.label }))} />
                    <Choice id="skyp-ed" label="Edition (preview)" value={preview.edition} onChange={(edition) => setPreview((p) => ({ ...p, edition }))} options={[{ value: "day", label: "Day" }, { value: "night", label: "Night" }]} />
                </div>
                <div className="sky-panel-row">
                    <Choice id="skyp-dir" label="Wind direction (preview)" value={preview.dir} onChange={(dir) => setPreview((p) => ({ ...p, dir }))} options={[{ value: -1, label: "From the east" }, { value: 1, label: "From the west" }]} />
                    <Choice id="skyp-dev" label="As seen on (preview)" value={preview.budget} onChange={(budget) => setPreview((p) => ({ ...p, budget }))} options={[{ value: "desktop", label: "Computer" }, { value: "phone", label: "Phone" }, { value: "lite", label: "Slow phone" }]} />
                    <label className="sky-panel-check" htmlFor="skyp-reduced">
                        <input id="skyp-reduced" type="checkbox" checked={preview.reduced} onChange={(e) => setPreview((p) => ({ ...p, reduced: e.target.checked }))} />
                        Reduced motion
                    </label>
                </div>
                <p className="small">These preview choices only change this screen; nothing is saved until you press Save below.</p>
            </section>

            {!isAdmin && <p className="alert">Only the team can change these.</p>}
            {(dragOff || weatherOff) && (
                <p className="alert">
                    {dragOff && "“Move the sun and moon” is off in Features, so visitors can't drag them. "}
                    {weatherOff && "“Weather scenes” is off in Features, so visitors always see a clear sky. "}
                    The preview still shows everything.
                </p>
            )}

            <fieldset className="card card-pad stack sky-panel-group" style={{ "--gap": "16px" }}>
                <legend className="eyebrow">Weather</legend>
                <div className="field">
                    <label htmlFor="sky-weather">What visitors see</label>
                    <select id="sky-weather" value={values.weather} onChange={(e) => setWeather(e.target.value)} disabled={!isAdmin} aria-describedby="sky-weather-hint">
                        {WEATHER_MODES.map((m) => <option key={m.key} value={m.key}>{m.label}</option>)}
                    </select>
                    <span className="hint" id="sky-weather-hint">
                        “Kampala's live weather” follows the forecast once “Live Kampala weather” is switched on (it needs the paid Firebase plan); until then it shows a clear sky. The weather scenes go live in the page heroes with the next step of the living sky.
                    </span>
                </div>
                <Choice id="sky-rain" label="Rain" value={values.rain} onChange={(rain) => setValues((s) => ({ ...s, rain }))} options={RAIN_AMOUNTS.map((r) => ({ value: r.value, label: r.label }))} />
                <div className="field">
                    <label htmlFor="sky-wind">Wind strength <output htmlFor="sky-wind" className="sky-panel-value">{Number(values.wind).toFixed(1)}×</output></label>
                    <input id="sky-wind" type="range" min="0" max="2" step="0.1" value={values.wind} onChange={(e) => setValues((s) => ({ ...s, wind: Number(e.target.value) }))} disabled={!isAdmin} aria-describedby="sky-wind-hint" />
                    <span className="hint" id="sky-wind-hint">0 is calm. With live weather it scales Kampala's real wind; storms always blow at least 1.2×. It drifts the clouds and slants the rain.</span>
                </div>
            </fieldset>

            {GROUPS.map((g) => (
                <fieldset key={g.key} className="card card-pad stack sky-panel-group" style={{ "--gap": "16px" }}>
                    <legend className="eyebrow">{g.title}</legend>
                    <p className="small">{g.help}</p>
                    {SKY_FIELDS.filter((f) => f.group === g.key).map((f) => (
                        <div className="field" key={f.key}>
                            <label htmlFor={`sky-${f.key}`}>
                                {f.label} <output htmlFor={`sky-${f.key}`} className="sky-panel-value">{show(f, values.params[f.key])}</output>
                            </label>
                            <input
                                id={`sky-${f.key}`}
                                type="range"
                                min={f.min}
                                max={f.max}
                                step={f.step}
                                value={values.params[f.key]}
                                onChange={(e) => setParam(f.key, e.target.value)}
                                disabled={!isAdmin}
                                aria-describedby={`sky-${f.key}-hint`}
                            />
                            <span className="hint" id={`sky-${f.key}-hint`}>{f.help}</span>
                        </div>
                    ))}
                </fieldset>
            ))}

            {note && <p className={`alert ${note.ok ? "" : "alert-error"}`} role={note.ok ? "status" : "alert"}>{note.text}</p>}
            <div className="row sky-panel-actions">
                <button type="submit" className="btn btn-primary" disabled={busy || !isAdmin || !changed}>{busy ? "Saving…" : "Save"}</button>
                <button type="button" className="btn btn-line" onClick={() => setValues(SKY_SETTINGS_DEFAULTS)} disabled={!isAdmin}>Back to the original</button>
                {changed && <span className="small">Not saved yet.</span>}
            </div>
        </form>
    );
};
