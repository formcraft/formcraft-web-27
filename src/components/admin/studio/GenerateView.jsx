import { useState } from "react";
import { channelLabel } from "../../../data/socialPlatforms";
import { addDays, fetchYearPosts, formatDay, planYear, todayKey, WEEKDAYS, writePlan } from "../../../lib/studio";

// "Generate the year": drafts for every active occasion on its date, then everyday drafts to reach
// each channel's weekly target. Preview first; writing never overwrites, and running it again only
// fills the gaps.
export const GenerateView = ({ studio }) => {
    const { activeChannels, occasions, occasionsStored, topics, settings, user } = studio;
    const thisYear = Number(todayKey().slice(0, 4));
    const [year, setYear] = useState(thisYear + (Number(todayKey().slice(5, 7)) >= 10 ? 1 : 0));
    const [excluded, setExcluded] = useState([]); // channels unticked (so channels that load later start ticked)
    const [plan, setPlan] = useState(null);
    const [busy, setBusy] = useState(false);
    const [note, setNote] = useState(null);

    const chosen = activeChannels.filter((c) => !excluded.includes(c.id));
    const targets = chosen.map((c) => [c, Number(settings.targets?.[c.id]) || 0]);
    const noTargets = targets.every(([, t]) => !t);

    const preview = async () => {
        setBusy(true);
        setNote(null);
        setPlan(null);
        try {
            const existing = await fetchYearPosts(year);
            const fromDay = year === thisYear ? addDays(todayKey(), 1) : `${year}-01-01`;
            setPlan(planYear({ year, channels: chosen, occasions, topics, settings, existing, fromDay }));
        } catch (e) {
            setNote({ ok: false, text: e.code === "failed-precondition" ? `Firestore needs an index: ${e.message}` : e.message });
        } finally {
            setBusy(false);
        }
    };

    const write = async () => {
        if (!plan) return;
        setBusy(true);
        setNote(null);
        try {
            const n = await writePlan(plan, user);
            setNote({ ok: true, text: `Created ${n} draft${n === 1 ? "" : "s"}. They're on the calendar; nothing was overwritten.` });
            setPlan(null);
        } catch (e) {
            setNote({ ok: false, text: e.code === "permission-denied" ? "Firestore refused: only marketing and admins can generate the year." : e.message });
        } finally {
            setBusy(false);
        }
    };

    const total = plan ? plan.occasionPosts.length + plan.everydayPosts.length : 0;
    const byMonth = plan
        ? Array.from({ length: 12 }, (_, m) => {
              const key = `${year}-${String(m + 1).padStart(2, "0")}`;
              return [key, plan.occasionPosts.filter((p) => p.day?.startsWith(key)).length, plan.everydayPosts.filter((p) => p.day.startsWith(key)).length];
          })
        : [];

    return (
        <div className="stack" style={{ "--gap": "18px" }}>
            <p className="small">
                Creates <strong>drafts</strong> only — someone still writes the captions, adds pictures and approves each one. Occasion posts use the template code and post angle from the
                calendar; everyday posts rotate the content pillars and draw the least-used topic ideas.
            </p>
            {!occasionsStored && <p className="alert">The occasions calendar hasn’t been imported yet, so the register’s starter calendar is used. Import it in Occasions to edit dates and care notes first.</p>}

            <div className="card card-pad stack" style={{ "--gap": "14px" }}>
                <div className="form-row">
                    <div className="field">
                        <label htmlFor="gen-year">Year</label>
                        <select id="gen-year" value={year} onChange={(e) => { setYear(Number(e.target.value)); setPlan(null); }}>
                            {[thisYear, thisYear + 1, thisYear + 2].map((y) => <option key={y} value={y}>{y}</option>)}
                        </select>
                    </div>
                </div>
                <fieldset className="mkt-checks">
                    <legend className="label">Channels</legend>
                    {activeChannels.length === 0 && <p className="small">No active channels.</p>}
                    {activeChannels.map((c) => (
                        <label key={c.id} className="chip">
                            <input type="checkbox" checked={!excluded.includes(c.id)} onChange={(e) => { setExcluded(e.target.checked ? excluded.filter((x) => x !== c.id) : [...excluded, c.id]); setPlan(null); }} />
                            {channelLabel(c)} · {Number(settings.targets?.[c.id]) || 0}/week
                        </label>
                    ))}
                </fieldset>
                <p className="fine">
                    Posting days: {(settings.postingDays ?? []).map((d) => WEEKDAYS[d - 1]).join(", ") || "none"} at {settings.defaultTime} (EAT). Targets and days are set in Channels.
                    {year === thisYear ? ` Only days from ${formatDay(addDays(todayKey(), 1))} are filled.` : ""}
                </p>
                {noTargets && <p className="alert">No weekly targets set for these channels, so only occasion posts will be created. Set targets in Channels for everyday posts.</p>}
                <div className="row">
                    <button type="button" className="btn btn-ink btn-sm" onClick={preview} disabled={busy || !chosen.length}>{busy && !plan ? "Working…" : "Preview"}</button>
                </div>
            </div>

            {note && <p className={`alert ${note.ok ? "" : "alert-error"}`} role={note.ok ? "status" : "alert"}>{note.text}</p>}

            {plan && (
                <div className="card card-pad stack" style={{ "--gap": "14px" }} aria-live="polite">
                    <p className="body">
                        This will create <strong>{total}</strong> draft{total === 1 ? "" : "s"}: {plan.occasionPosts.length} occasion post{plan.occasionPosts.length === 1 ? "" : "s"} and {plan.everydayPosts.length} everyday post{plan.everydayPosts.length === 1 ? "" : "s"}
                        {plan.ideas ? ` (${plan.ideas} as undated ideas — their date has to be set each year)` : ""}.
                    </p>
                    {total > 0 && (
                        <div className="table-wrap" role="region" aria-label="Drafts per month" tabIndex={0}>
                            <table className="table">
                                <thead>
                                    <tr><th scope="col">Month</th><th scope="col">Occasions</th><th scope="col">Everyday</th></tr>
                                </thead>
                                <tbody>
                                    {byMonth.map(([m, o, e]) => (
                                        <tr key={m}><td>{formatDay(`${m}-01`, { month: "long" })}</td><td>{o}</td><td>{e}</td></tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                    <div className="row">
                        <button type="button" className="btn btn-primary btn-sm" onClick={write} disabled={busy || total === 0}>{busy ? "Creating…" : `Create ${total} drafts`}</button>
                        <button type="button" className="btn btn-line btn-sm" onClick={() => setPlan(null)} disabled={busy}>Cancel</button>
                    </div>
                </div>
            )}
        </div>
    );
};
