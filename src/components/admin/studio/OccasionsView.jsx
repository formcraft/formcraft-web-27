import { useMemo, useState } from "react";
import { CARE, OCCASION_CATEGORIES, OCCASION_TONES, STARTER_OCCASIONS, describeRule, occasionDate } from "../../../data/occasions";
import { formatDay, importStarterDocs, removeDoc, saveDoc, slug, todayKey } from "../../../lib/studio";

// The annual calendar (from the Template Master Register): dates for any year, switches, template
// codes, post angles and care notes. Movable dates (Eid) are set here each year.
const RULES = { fixed: "Fixed date", month: "Whole month", "nth-weekday": "Nth weekday of a month", range: "Date range", movable: "Movable (set per year)" };
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const blank = {
    name: "",
    category: "industry",
    rule: { type: "fixed", month: 1, day: 1 },
    dates: {},
    confirm: false,
    templateCode: "",
    postAngle: "",
    tone: "celebrate",
    careNotes: [],
    ribbonColour: "",
    active: true,
    siteTheme: { enabled: false, accent: null, intensity: "quiet" },
};

const num = (v, min, max) => Math.max(min, Math.min(max, Math.round(Number(v) || min)));

/** Studio → Occasions: holidays and awareness days for a year, with their dates and post ideas. @param {{ studio: object }} props */
export const OccasionsView = ({ studio }) => {
    const { occasions, occasionsStored, isMarketing } = studio;
    const [year, setYear] = useState(Number(todayKey().slice(0, 4)));
    const [category, setCategory] = useState("");
    const [editing, setEditing] = useState(null);
    const [busy, setBusy] = useState(false);
    const [note, setNote] = useState(null);
    const missing = occasionsStored ? STARTER_OCCASIONS.filter((o) => !occasions.some((x) => x.id === o.id)) : STARTER_OCCASIONS;

    const rows = useMemo(
        () =>
            occasions
                .filter((o) => !category || o.category === category)
                .map((o) => ({ o, ...occasionDate(o, year) }))
                .sort((a, b) => String(a.date ?? "9999").localeCompare(String(b.date ?? "9999"))),
        [occasions, category, year]
    );

    const run = async (fn, done) => {
        setBusy(true);
        setNote(null);
        try {
            const r = await fn();
            setNote({ ok: true, text: typeof done === "function" ? done(r) : done });
        } catch (e) {
            setNote({ ok: false, text: e.code === "permission-denied" ? "Firestore refused: only marketing and admins can change the calendar." : e.message });
        } finally {
            setBusy(false);
        }
    };

    const save = (e) => {
        e.preventDefault();
        const v = editing.values;
        const r = v.rule;
        const rule =
            r.type === "fixed" ? { type: "fixed", month: num(r.month, 1, 12), day: num(r.day, 1, 31) }
            : r.type === "month" ? { type: "month", month: num(r.month, 1, 12) }
            : r.type === "nth-weekday" ? { type: "nth-weekday", month: num(r.month, 1, 12), weekday: num(r.weekday, 0, 6), n: Number(r.n) === -1 ? -1 : num(r.n, 1, 5) }
            : r.type === "range" ? { type: "range", start: { month: num(r.start?.month, 1, 12), day: num(r.start?.day, 1, 31) }, end: { month: num(r.end?.month, 1, 12), day: num(r.end?.day, 1, 31) } }
            : { type: "movable" };
        const id = editing.id || slug(v.name);
        if (!id) return setNote({ ok: false, text: "Give the occasion a name." });
        run(async () => {
            await saveDoc(
                "occasions",
                id,
                {
                    name: v.name.trim(),
                    category: v.category,
                    rule,
                    dates: Object.fromEntries(Object.entries(v.dates ?? {}).filter(([, d]) => /^\d{4}-\d{2}-\d{2}$/.test(d))),
                    ...(typeof v.easterOffset === "number" ? { easterOffset: v.easterOffset } : {}),
                    confirm: Boolean(v.confirm),
                    templateCode: v.templateCode.trim(),
                    postAngle: v.postAngle.trim(),
                    tone: v.tone,
                    careNotes: v.careNotes.map((n) => n.trim()).filter(Boolean),
                    ribbonColour: v.ribbonColour?.trim() || null,
                    active: Boolean(v.active),
                    siteTheme: { enabled: Boolean(v.siteTheme?.enabled), accent: v.siteTheme?.accent?.trim() || null, intensity: v.siteTheme?.intensity || "quiet" },
                },
                { merge: false }
            );
            setEditing(null);
        }, "Occasion saved.");
    };

    if (editing) {
        const v = editing.values;
        const setV = (k, val) => setEditing({ ...editing, values: { ...v, [k]: val } });
        const setRule = (patch) => setV("rule", { ...v.rule, ...patch });
        const years = [year, year + 1];
        const monthSelect = (id, value, onChange, label = "Month") => (
            <div className="field">
                <label htmlFor={id}>{label}</label>
                <select id={id} value={value ?? 1} onChange={(e) => onChange(Number(e.target.value))}>
                    {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                </select>
            </div>
        );
        const dayInput = (id, value, onChange, label = "Day") => (
            <div className="field">
                <label htmlFor={id}>{label}</label>
                <input id={id} inputMode="numeric" value={value ?? ""} onChange={(e) => onChange(e.target.value.replace(/\D/g, ""))} />
            </div>
        );
        return (
            <form className="card card-pad form" onSubmit={save} aria-labelledby="oc-title">
                <div className="between">
                    <h4 className="h4" id="oc-title">{editing.id ? `Edit ${v.name}` : "New occasion"}</h4>
                    <button type="button" className="btn btn-line btn-sm" onClick={() => setEditing(null)}>Cancel</button>
                </div>
                <div className="form-row">
                    <div className="field">
                        <label htmlFor="oc-name">Name *</label>
                        <input id="oc-name" value={v.name} onChange={(e) => setV("name", e.target.value)} required />
                    </div>
                    <div className="field">
                        <label htmlFor="oc-cat">Category</label>
                        <select id="oc-cat" value={v.category} onChange={(e) => setV("category", e.target.value)}>
                            {Object.entries(OCCASION_CATEGORIES).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                        </select>
                    </div>
                    <div className="field">
                        <label htmlFor="oc-tone">Tone</label>
                        <select id="oc-tone" value={v.tone} onChange={(e) => setV("tone", e.target.value)}>
                            {Object.entries(OCCASION_TONES).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                        </select>
                    </div>
                </div>

                <fieldset className="mkt-fieldset">
                    <legend className="label">When</legend>
                    <div className="field">
                        <label htmlFor="oc-rule">Rule</label>
                        <select id="oc-rule" value={v.rule.type} onChange={(e) => setV("rule", { type: e.target.value, month: v.rule.month ?? 1, day: v.rule.day ?? 1, weekday: 0, n: 1, start: { month: 1, day: 1 }, end: { month: 1, day: 1 } })}>
                            {Object.entries(RULES).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                        </select>
                    </div>
                    <div className="form-row">
                        {(v.rule.type === "fixed" || v.rule.type === "month" || v.rule.type === "nth-weekday") && monthSelect("oc-month", v.rule.month, (m) => setRule({ month: m }))}
                        {v.rule.type === "fixed" && dayInput("oc-day", v.rule.day, (d) => setRule({ day: d }))}
                        {v.rule.type === "nth-weekday" && (
                            <>
                                <div className="field">
                                    <label htmlFor="oc-n">Which</label>
                                    <select id="oc-n" value={v.rule.n} onChange={(e) => setRule({ n: Number(e.target.value) })}>
                                        {[[1, "1st"], [2, "2nd"], [3, "3rd"], [4, "4th"], [-1, "Last"]].map(([n, l]) => <option key={n} value={n}>{l}</option>)}
                                    </select>
                                </div>
                                <div className="field">
                                    <label htmlFor="oc-wd">Weekday</label>
                                    <select id="oc-wd" value={v.rule.weekday} onChange={(e) => setRule({ weekday: Number(e.target.value) })}>
                                        {DAYS.map((d, i) => <option key={d} value={i}>{d}</option>)}
                                    </select>
                                </div>
                            </>
                        )}
                        {v.rule.type === "range" && (
                            <>
                                {monthSelect("oc-sm", v.rule.start?.month, (m) => setRule({ start: { ...v.rule.start, month: m } }), "From month")}
                                {dayInput("oc-sd", v.rule.start?.day, (d) => setRule({ start: { ...v.rule.start, day: d } }), "From day")}
                                {monthSelect("oc-em", v.rule.end?.month, (m) => setRule({ end: { ...v.rule.end, month: m } }), "To month")}
                                {dayInput("oc-ed", v.rule.end?.day, (d) => setRule({ end: { ...v.rule.end, day: d } }), "To day")}
                            </>
                        )}
                    </div>
                    <div className="form-row">
                        {years.map((y) => (
                            <div key={y} className="field">
                                <label htmlFor={`oc-date-${y}`}>Date in {y}{v.rule.type === "movable" ? "" : " (overrides the rule)"}</label>
                                <input id={`oc-date-${y}`} type="date" value={v.dates?.[y] ?? ""} onChange={(e) => setV("dates", { ...(v.dates ?? {}), [y]: e.target.value })} />
                            </div>
                        ))}
                    </div>
                    <label className="admin-check">
                        <input type="checkbox" checked={Boolean(v.confirm)} onChange={(e) => setV("confirm", e.target.checked)} />
                        <span>Date must be confirmed before posting (e.g. Eid, moon sighting)</span>
                    </label>
                </fieldset>

                <div className="form-row">
                    <div className="field">
                        <label htmlFor="oc-code">Template code</label>
                        <input id="oc-code" value={v.templateCode} onChange={(e) => setV("templateCode", e.target.value)} placeholder="FMC-MKT-DAY-MM-DD" />
                    </div>
                    <div className="field">
                        <label htmlFor="oc-ribbon">Ribbon colour</label>
                        <input id="oc-ribbon" value={v.ribbonColour ?? ""} onChange={(e) => setV("ribbonColour", e.target.value)} />
                    </div>
                </div>
                <div className="field">
                    <label htmlFor="oc-angle">Post angle</label>
                    <textarea id="oc-angle" rows={2} value={v.postAngle} onChange={(e) => setV("postAngle", e.target.value)} />
                </div>
                <div className="field">
                    <label htmlFor="oc-care">Care notes (one per line; each becomes a tick box before approval)</label>
                    <textarea id="oc-care" rows={4} value={v.careNotes.join("\n")} onChange={(e) => setV("careNotes", e.target.value.split("\n"))} />
                    <div className="row" style={{ "--gap": "6px" }}>
                        {Object.entries(CARE).map(([k, text]) => (
                            <button key={k} type="button" className="btn btn-line btn-sm" disabled={v.careNotes.includes(text)} onClick={() => setV("careNotes", [...v.careNotes.filter(Boolean), text])}>
                                + {{ safeMessaging: "Safe messaging", helpline: "Helpline check", noPromo: "No promotions", faith: "Faith check", eidHold: "Hold until announced" }[k]}
                            </button>
                        ))}
                    </div>
                </div>
                <label className="admin-check">
                    <input type="checkbox" checked={Boolean(v.active)} onChange={(e) => setV("active", e.target.checked)} />
                    <span>Active (shown on the calendar and used by Generate)</span>
                </label>
                <fieldset className="mkt-fieldset">
                    <legend className="label">Seasonal site theme (decided later — needs brand approval)</legend>
                    <label className="admin-check">
                        <input type="checkbox" checked={Boolean(v.siteTheme?.enabled)} onChange={(e) => setV("siteTheme", { ...v.siteTheme, enabled: e.target.checked })} />
                        <span>Use a seasonal accent on the site (not wired up yet)</span>
                    </label>
                    <div className="form-row">
                        <div className="field">
                            <label htmlFor="oc-accent">Accent (token name, e.g. --fc-studio)</label>
                            <input id="oc-accent" value={v.siteTheme?.accent ?? ""} onChange={(e) => setV("siteTheme", { ...v.siteTheme, accent: e.target.value })} />
                        </div>
                        <div className="field">
                            <label htmlFor="oc-int">Intensity</label>
                            <select id="oc-int" value={v.siteTheme?.intensity ?? "quiet"} onChange={(e) => setV("siteTheme", { ...v.siteTheme, intensity: e.target.value })}>
                                <option value="quiet">Quiet</option>
                                <option value="bold">Bold</option>
                            </select>
                        </div>
                    </div>
                </fieldset>
                {note && !note.ok && <p className="alert alert-error" role="alert">{note.text}</p>}
                <div className="row">
                    <button type="submit" className="btn btn-primary btn-sm" disabled={busy}>{busy ? "Saving…" : "Save"}</button>
                    {editing.id && (
                        <button type="button" className="btn btn-line btn-sm" disabled={busy} onClick={() => window.confirm(`Delete “${v.name}”? To stop using it, untick Active instead.`) && run(async () => { await removeDoc("occasions", editing.id); setEditing(null); }, "Deleted.")}>
                            Delete
                        </button>
                    )}
                </div>
            </form>
        );
    }

    return (
        <div className="stack" style={{ "--gap": "16px" }}>
            {!occasionsStored && (
                <p className="alert">
                    Showing the starter calendar from the Template Master Register (not saved yet).{isMarketing ? " Import it to edit dates, switches and care notes." : ""}
                </p>
            )}
            <div className="between" style={{ alignItems: "flex-end" }}>
                <div className="mkt-filters">
                    <div className="field">
                        <label htmlFor="oc-year">Year</label>
                        <select id="oc-year" value={year} onChange={(e) => setYear(Number(e.target.value))}>
                            {[0, 1, 2].map((d) => Number(todayKey().slice(0, 4)) + d).map((y) => <option key={y} value={y}>{y}</option>)}
                        </select>
                    </div>
                    <div className="field">
                        <label htmlFor="oc-filter">Category</label>
                        <select id="oc-filter" value={category} onChange={(e) => setCategory(e.target.value)}>
                            <option value="">All</option>
                            {Object.entries(OCCASION_CATEGORIES).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                        </select>
                    </div>
                </div>
                {isMarketing && (
                    <div className="row" style={{ "--gap": "8px" }}>
                        {missing.length > 0 && (
                            <button type="button" className="btn btn-line btn-sm" disabled={busy} onClick={() => run(() => importStarterDocs("occasions", missing, occasionsStored ? occasions.map((o) => o.id) : []), (n) => `Imported ${n} occasion${n === 1 ? "" : "s"}.`)}>
                                Import the starter calendar ({missing.length})
                            </button>
                        )}
                        <button type="button" className="btn btn-primary btn-sm" disabled={!occasionsStored} onClick={() => setEditing({ id: null, values: { ...blank } })}>Add occasion</button>
                    </div>
                )}
            </div>
            {note && <p className={`alert ${note.ok ? "" : "alert-error"}`} role={note.ok ? "status" : "alert"}>{note.text}</p>}
            <div className="table-wrap card" role="region" aria-label={`Occasions in ${year}`} tabIndex={0}>
                <table className="table admin-table">
                    <thead>
                        <tr><th scope="col">Date in {year}</th><th scope="col">Occasion</th><th scope="col">Template</th><th scope="col">Tone</th><th scope="col">Care</th><th scope="col">On</th>{isMarketing && occasionsStored && <th scope="col"><span className="sr-only">Edit</span></th>}</tr>
                    </thead>
                    <tbody>
                        {rows.map(({ o, date, confirm }) => (
                            <tr key={o.id} className={o.active === false ? "mkt-row-off" : ""}>
                                <td className="fine">
                                    {date ? formatDay(date) : <strong className="mkt-over">Set the date</strong>}
                                    {confirm && date ? <div className="mkt-flag">confirm</div> : null}
                                    <div>{describeRule(o)}</div>
                                </td>
                                <td>
                                    <strong>{o.name}</strong>
                                    <div className="fine">{OCCASION_CATEGORIES[o.category] ?? o.category}{o.ribbonColour ? ` · ${o.ribbonColour} ribbon` : ""}</div>
                                    <div className="fine">{o.postAngle}</div>
                                </td>
                                <td className="fine">{o.templateCode || "—"}</td>
                                <td className="fine">{OCCASION_TONES[o.tone] ?? o.tone}</td>
                                <td className="fine">{o.careNotes?.length ? <span title={o.careNotes.join("\n")}>{o.careNotes.length} note{o.careNotes.length === 1 ? "" : "s"}</span> : "—"}</td>
                                <td>
                                    {isMarketing && occasionsStored ? (
                                        <label className="admin-check">
                                            <input type="checkbox" checked={o.active !== false} disabled={busy} onChange={(e) => run(() => saveDoc("occasions", o.id, { active: e.target.checked }), e.target.checked ? `${o.name} on.` : `${o.name} off.`)} />
                                            <span className="sr-only">Active: {o.name}</span>
                                        </label>
                                    ) : o.active === false ? "Off" : "On"}
                                </td>
                                {isMarketing && occasionsStored && (
                                    <td><button type="button" className="btn btn-ink btn-sm" onClick={() => setEditing({ id: o.id, values: { ...blank, ...o, careNotes: o.careNotes ?? [], ribbonColour: o.ribbonColour ?? "", siteTheme: o.siteTheme ?? blank.siteTheme } })}>Edit</button></td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
