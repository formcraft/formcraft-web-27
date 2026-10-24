import { useMemo, useState } from "react";
import { PILLARS, STARTER_TOPICS } from "../../../data/socialTopics";
import { FORMATS } from "../../../data/socialPlatforms";
import { formatDay, dayKey, importStarterDocs, saveDoc, removeDoc } from "../../../lib/studio";

// The topic bank: ideas per content pillar that Generate draws from (least used first).
// Editors can add ideas and start a post from one; marketing edits, archives and deletes.
const empty = { pillar: PILLARS[0], newPillar: "", idea: "", notes: "", formats: ["feed"], active: true };

/** Studio → Topics: the bank of post ideas by content pillar; start a post from one. @param {{ studio: object }} props */
export const TopicsView = ({ studio }) => {
    const { topics, isMarketing, openComposer } = studio;
    const [pillar, setPillar] = useState("");
    const [showArchived, setShowArchived] = useState(false);
    const [editing, setEditing] = useState(null);
    const [busy, setBusy] = useState(false);
    const [note, setNote] = useState(null);

    const pillars = useMemo(() => [...new Set([...PILLARS, ...topics.map((t) => t.pillar).filter(Boolean)])], [topics]);
    const list = topics
        .filter((t) => (!pillar || t.pillar === pillar) && (showArchived || t.active !== false))
        .sort((a, b) => pillars.indexOf(a.pillar) - pillars.indexOf(b.pillar) || (a.uses ?? 0) - (b.uses ?? 0) || String(a.idea).localeCompare(String(b.idea)));

    const run = async (fn, done) => {
        setBusy(true);
        setNote(null);
        try {
            const r = await fn();
            setNote({ ok: true, text: typeof done === "function" ? done(r) : done });
        } catch (e) {
            setNote({ ok: false, text: e.code === "permission-denied" ? "Firestore refused: editors can add ideas; changing or archiving them is for marketing." : e.message });
        } finally {
            setBusy(false);
        }
    };

    const save = (e) => {
        e.preventDefault();
        const v = editing.values;
        const p = v.pillar === "__new" ? v.newPillar.trim() : v.pillar;
        if (!p || !v.idea.trim()) {
            setNote({ ok: false, text: "Pick a pillar and write the idea." });
            return;
        }
        run(async () => {
            const data = { pillar: p, idea: v.idea.trim(), notes: v.notes.trim(), formats: v.formats, active: Boolean(v.active) };
            if (!editing.id) Object.assign(data, { channels: [], uses: 0, lastUsedAt: null });
            await saveDoc("socialTopics", editing.id, data);
            setEditing(null);
        }, "Topic saved.");
    };

    if (editing) {
        const v = editing.values;
        const setV = (k, val) => setEditing({ ...editing, values: { ...v, [k]: val } });
        return (
            <form className="card card-pad form" onSubmit={save} aria-labelledby="tp-title">
                <div className="between">
                    <h4 className="h4" id="tp-title">{editing.id ? "Edit topic" : "New topic idea"}</h4>
                    <button type="button" className="btn btn-line btn-sm" onClick={() => setEditing(null)}>Cancel</button>
                </div>
                <div className="form-row">
                    <div className="field">
                        <label htmlFor="tp-pillar">Pillar</label>
                        <select id="tp-pillar" value={v.pillar} onChange={(e) => setV("pillar", e.target.value)}>
                            {pillars.map((p) => <option key={p} value={p}>{p}</option>)}
                            <option value="__new">New pillar…</option>
                        </select>
                    </div>
                    {v.pillar === "__new" && (
                        <div className="field">
                            <label htmlFor="tp-newpillar">New pillar name</label>
                            <input id="tp-newpillar" value={v.newPillar} onChange={(e) => setV("newPillar", e.target.value)} required />
                        </div>
                    )}
                </div>
                <div className="field">
                    <label htmlFor="tp-idea">Idea *</label>
                    <input id="tp-idea" value={v.idea} onChange={(e) => setV("idea", e.target.value)} required aria-describedby="tp-idea-hint" />
                    <span className="hint" id="tp-idea-hint">Use [placeholders] for facts to fill in per post — never invent figures or quotes.</span>
                </div>
                <div className="field">
                    <label htmlFor="tp-notes">Notes</label>
                    <textarea id="tp-notes" rows={2} value={v.notes} onChange={(e) => setV("notes", e.target.value)} />
                </div>
                <fieldset className="mkt-checks">
                    <legend className="label">Formats</legend>
                    {Object.entries(FORMATS).map(([k, label]) => (
                        <label key={k} className="chip">
                            <input type="checkbox" checked={v.formats.includes(k)} onChange={(e) => setV("formats", e.target.checked ? [...v.formats, k] : v.formats.filter((f) => f !== k))} />
                            {label}
                        </label>
                    ))}
                </fieldset>
                {isMarketing && (
                    <label className="admin-check">
                        <input type="checkbox" checked={Boolean(v.active)} onChange={(e) => setV("active", e.target.checked)} />
                        <span>Active (untick to archive)</span>
                    </label>
                )}
                {note && !note.ok && <p className="alert alert-error" role="alert">{note.text}</p>}
                <div className="row">
                    <button type="submit" className="btn btn-primary btn-sm" disabled={busy}>{busy ? "Saving…" : "Save"}</button>
                    {isMarketing && editing.id && (
                        <button type="button" className="btn btn-line btn-sm" disabled={busy} onClick={() => window.confirm("Delete this topic? Archive it instead to keep its history.") && run(async () => { await removeDoc("socialTopics", editing.id); setEditing(null); }, "Deleted.")}>
                            Delete
                        </button>
                    )}
                </div>
            </form>
        );
    }

    return (
        <div className="stack" style={{ "--gap": "16px" }}>
            <div className="between" style={{ alignItems: "flex-end" }}>
                <div className="mkt-filters">
                    <div className="field">
                        <label htmlFor="tp-filter">Pillar</label>
                        <select id="tp-filter" value={pillar} onChange={(e) => setPillar(e.target.value)}>
                            <option value="">All pillars</option>
                            {pillars.map((p) => <option key={p} value={p}>{p}</option>)}
                        </select>
                    </div>
                    <label className="admin-check">
                        <input type="checkbox" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} />
                        <span>Show archived</span>
                    </label>
                </div>
                <div className="row" style={{ "--gap": "8px" }}>
                    {isMarketing && topics.length === 0 && (
                        <button type="button" className="btn btn-line btn-sm" disabled={busy} onClick={() => run(() => importStarterDocs("socialTopics", STARTER_TOPICS, []), (n) => `Imported ${n} topic ideas.`)}>
                            Import the starter topics ({STARTER_TOPICS.length})
                        </button>
                    )}
                    <button type="button" className="btn btn-primary btn-sm" onClick={() => setEditing({ id: null, values: { ...empty, pillar: pillar || PILLARS[0] } })}>Add idea</button>
                </div>
            </div>
            {note && <p className={`alert ${note.ok ? "" : "alert-error"}`} role={note.ok ? "status" : "alert"}>{note.text}</p>}
            {topics.length === 0 && <p className="card card-pad small">No topics yet.{isMarketing ? " Import the starter topics (ideas from the site and Company Profile) or add your own." : ""}</p>}
            <ul className="mkt-topics">
                {list.map((t) => (
                    <li key={t.id} className={`card mkt-topic ${t.active === false ? "mkt-row-off" : ""}`}>
                        <div className="stack" style={{ "--gap": "4px" }}>
                            <span className="fine">{t.pillar}{t.active === false ? " · archived" : ""}</span>
                            <strong>{t.idea}</strong>
                            {t.notes && <span className="small">{t.notes}</span>}
                            <span className="fine">
                                {(t.formats ?? []).map((f) => FORMATS[f] ?? f).join(", ")} · used {t.uses ?? 0}×{t.lastUsedAt ? `, last ${formatDay(dayKey(t.lastUsedAt))}` : ""}
                            </span>
                        </div>
                        <div className="row" style={{ "--gap": "6px" }}>
                            <button type="button" className="btn btn-ink btn-sm" onClick={() => openComposer(null, { topicId: t.id })}>New post</button>
                            {isMarketing && (
                                <>
                                    <button type="button" className="btn btn-line btn-sm" disabled={busy} onClick={() => run(async () => { const { increment, serverTimestamp } = await import("firebase/firestore"); await saveDoc("socialTopics", t.id, { uses: increment(1), lastUsedAt: serverTimestamp() }); }, "Marked as used.")}>Mark used</button>
                                    <button type="button" className="btn btn-line btn-sm" onClick={() => setEditing({ id: t.id, values: { ...empty, ...t, formats: t.formats ?? [], newPillar: "" } })}>Edit</button>
                                    <button type="button" className="btn btn-line btn-sm" disabled={busy} onClick={() => run(() => saveDoc("socialTopics", t.id, { active: t.active === false }), t.active === false ? "Restored." : "Archived.")}>{t.active === false ? "Restore" : "Archive"}</button>
                                </>
                            )}
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
};
