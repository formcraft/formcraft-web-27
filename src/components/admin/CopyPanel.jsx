// Admin → Site text (the copy editor): every piece of text on the site that the team can edit, page by page, in the order it
// appears (the register in src/data/copy.js). Each piece can be saved as a draft (team only, previewed on
// the real page with ?preview=draft), published (public at once, and in the pre-built page heads from the
// next build), or put back to the built-in wording. Every publish and revert is kept in a history.
// Writes go through the Firestore SDK; firestore.rules check team access and refuse the tagline.
import { useMemo, useState } from "react";
import { getDb } from "../../config/firebase";
import { useAuth } from "../../hooks/useAuth";
import { useDocument } from "../../hooks/useDocument";
import { useCollection } from "../../hooks/useCollection";
import { COPY, COPY_SIZES, SIZED_KINDS } from "../../data/copy";
import { setPublishedItems } from "../../lib/copyStore";
import "./CopyPanel.css";

const KIND = { title: "Heading", text: "Paragraph", button: "Button", label: "Label", alt: "Image description", meta: "Search" };
const FILTERS = { all: "All", changed: "Changed", drafts: "Drafts", near: "Near the limit" };
const fsMod = () => Promise.all([getDb(), import("firebase/firestore")]);

// { text, size } as stored: trimmed text, size only when it isn't the standard one
const clean = (v) => ({ text: String(v?.text ?? "").trim(), ...(v?.size === "sm" || v?.size === "lg" ? { size: v.size } : {}) });
const isDefault = (entry, v) => !v.text || (v.text === entry.text && !v.size);
const when = (ts) => (ts?.toDate ? ts.toDate().toLocaleString("en-UG", { dateStyle: "medium", timeStyle: "short" }) : "");

/** Admin → Copy (team): edit, preview, publish and undo the site's text. */
export const CopyPanel = () => {
    const { user } = useAuth();
    const email = user?.email ?? null;
    const [page, setPage] = useState("home");
    const reg = COPY[page];
    const pub = useDocument(`copy/${page}`);
    const drf = useDocument(`copyDrafts/${page}`);
    const history = useCollection(`copy/${page}/history`, (fs, ref) => fs.query(ref, fs.orderBy("at", "desc"), fs.limit(25)), [page]);
    const published = pub.data?.items ?? {};
    const drafts = drf.data?.items ?? {};
    const [working, setWorking] = useState({}); // unsaved edits in this browser: { id: { text, size } }
    const [filter, setFilter] = useState("all");
    const [query, setQuery] = useState("");
    const [busy, setBusy] = useState(null);
    const [note, setNote] = useState(null);

    const current = (entry) => working[entry.id] ?? drafts[entry.id] ?? published[entry.id] ?? { text: entry.text };

    const shown = useMemo(() => {
        const q = query.trim().toLowerCase();
        return reg.items.filter((e) => {
            const v = current(e);
            if (filter === "changed" && !published[e.id]) return false;
            if (filter === "drafts" && !drafts[e.id] && !working[e.id]) return false;
            if (filter === "near" && String(v.text).length < e.max * 0.9) return false;
            return !q || `${e.id} ${e.section} ${e.text} ${v.text}`.toLowerCase().includes(q);
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [reg, filter, query, published, drafts, working]);
    const sections = useMemo(() => [...new Set(shown.map((e) => e.section))], [shown]);

    const run = async (id, fn, done) => {
        setBusy(id);
        setNote(null);
        try {
            await fn();
            setWorking((w) => {
                const next = { ...w };
                delete next[id];
                return next;
            });
            setNote({ ok: true, text: done });
        } catch (e) {
            setNote({ ok: false, text: e.code === "permission-denied" ? "Firestore refused: only signed-in team members can change the text." : e.message });
        } finally {
            setBusy(null);
        }
    };

    const tooLong = (entry, v) => v.text.length > entry.max;

    const saveDraft = (entry) => {
        const v = clean(current(entry));
        if (tooLong(entry, v)) return setNote({ ok: false, text: `Too long: ${v.text.length} of ${entry.max} characters.` });
        return run(entry.id, async () => {
            const [db, { doc, setDoc, serverTimestamp }] = await fsMod();
            await setDoc(doc(db, "copyDrafts", page), { items: { [entry.id]: v }, updatedAt: serverTimestamp(), updatedBy: email }, { merge: true });
        }, "Draft saved. Use “Preview drafts on the page” to see it in place.");
    };

    const discardDraft = (entry) =>
        run(entry.id, async () => {
            if (!drafts[entry.id]) return;
            const [db, { doc, updateDoc, deleteField, serverTimestamp }] = await fsMod();
            await updateDoc(doc(db, "copyDrafts", page), { [`items.${entry.id}`]: deleteField(), updatedAt: serverTimestamp(), updatedBy: email });
        }, "Draft discarded.");

    // Publish (or, when it matches the built-in wording, go back to it) + a history entry, in one batch
    const publish = (entry, revert = false) => {
        const v = revert ? { text: "" } : clean(current(entry));
        if (!revert && tooLong(entry, v)) return setNote({ ok: false, text: `Too long: ${v.text.length} of ${entry.max} characters.` });
        const backToOriginal = revert || isDefault(entry, v);
        if (backToOriginal && !published[entry.id] && !drafts[entry.id]) return setNote({ ok: true, text: "That's already the built-in wording." });
        return run(entry.id, async () => {
            const [db, fs] = await fsMod();
            const batch = fs.writeBatch(db);
            const stamp = { updatedAt: fs.serverTimestamp(), updatedBy: email };
            if (backToOriginal) {
                if (published[entry.id]) batch.update(fs.doc(db, "copy", page), { [`items.${entry.id}`]: fs.deleteField(), ...stamp });
            } else {
                batch.set(fs.doc(db, "copy", page), { items: { [entry.id]: v }, ...stamp }, { merge: true });
            }
            if (drafts[entry.id]) batch.update(fs.doc(db, "copyDrafts", page), { [`items.${entry.id}`]: fs.deleteField(), ...stamp });
            if (published[entry.id] || !backToOriginal)
                batch.set(fs.doc(fs.collection(db, "copy", page, "history")), {
                    key: entry.id,
                    from: published[entry.id]?.text ?? null,
                    to: backToOriginal ? null : v.text,
                    size: backToOriginal ? null : v.size ?? null,
                    action: backToOriginal ? "revert" : "publish",
                    by: email,
                    at: fs.serverTimestamp(),
                });
            await batch.commit();
            // this device shows the change at once (visitors get it on their next page load)
            const next = { ...published };
            if (backToOriginal) delete next[entry.id];
            else next[entry.id] = v;
            setPublishedItems(page, next);
        }, backToOriginal ? "Back to the built-in wording." : "Published. Visitors see it on their next page load.");
    };

    const edit = (entry, patch) => setWorking((w) => ({ ...w, [entry.id]: { ...current(entry), ...patch } }));

    return (
        <div className="stack copy" style={{ "--gap": "20px" }}>
            <div className="stack" style={{ "--gap": "6px" }}>
                <h3 className="h3">Site text</h3>
                <p className="small">
                    The words on the site, page by page. Save a draft to try it on the real page, then publish. “Back to the original” restores the built-in wording. Plain text with <code>**bold**</code>, <code>*italic*</code> and line breaks. The tagline is fixed (Brand Guide) and isn’t listed.
                </p>
            </div>

            <div className="copy-bar">
                <div className="field">
                    <label htmlFor="copy-page">Page</label>
                    <select id="copy-page" value={page} onChange={(e) => {
                        setPage(e.target.value);
                        setWorking({});
                    }}>
                        {Object.entries(COPY).map(([k, p]) => <option key={k} value={k}>{p.label}</option>)}
                    </select>
                </div>
                <div className="field copy-search">
                    <label htmlFor="copy-q">Search</label>
                    <input id="copy-q" type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Words or an id" />
                </div>
                <a className="btn btn-line btn-sm" href={`${reg.path}?preview=draft`} target="_blank" rel="noreferrer">Preview drafts on the page</a>
            </div>
            <div className="row copy-filters" role="group" aria-label="Show">
                {Object.entries(FILTERS).map(([k, label]) => (
                    <button key={k} type="button" className="chip" aria-pressed={filter === k} onClick={() => setFilter(k)}>{label}</button>
                ))}
            </div>

            {note && <p className={`alert ${note.ok ? "" : "alert-error"}`} role={note.ok ? "status" : "alert"}>{note.text}</p>}
            {(pub.error || drf.error) && <p className="alert alert-error" role="alert">Couldn’t load the saved text: {(pub.error || drf.error).message}</p>}

            {pub.loading ? (
                <div className="skeleton" style={{ height: 240 }} />
            ) : shown.length === 0 ? (
                <p className="small">Nothing matches.</p>
            ) : (
                sections.map((section) => (
                    <section key={section} className="stack" style={{ "--gap": "12px" }} aria-labelledby={`copy-s-${section}`}>
                        <h4 className="h4" id={`copy-s-${section}`}>{section}</h4>
                        {shown.filter((e) => e.section === section).map((entry) => {
                            const v = current(entry);
                            const n = String(v.text).length;
                            const over = n > entry.max;
                            const id = `copy-${page}-${entry.id}`;
                            return (
                                <div key={entry.id} className="card card-pad copy-item">
                                    <div className="between copy-item-head">
                                        <label htmlFor={id} className="copy-label">{entry.label ?? KIND[entry.kind]} <code className="fine">{entry.id}</code></label>
                                        <span className="row copy-tags">
                                            {published[entry.id] && <span className="tag">Published edit</span>}
                                            {drafts[entry.id] && <span className="tag tag-accent">Draft</span>}
                                            {working[entry.id] && <span className="tag tag-accent">Unsaved</span>}
                                        </span>
                                    </div>
                                    <textarea
                                        id={id}
                                        className="copy-text"
                                        rows={Math.min(8, Math.max(1, Math.ceil(entry.max / 90)))}
                                        value={v.text}
                                        onChange={(e) => edit(entry, { text: e.target.value })}
                                        aria-describedby={`${id}-n`}
                                        aria-invalid={over || undefined}
                                    />
                                    <div className="between copy-item-foot">
                                        <span id={`${id}-n`} className={`fine ${over ? "copy-over" : ""}`}>{n} / {entry.max} characters{over ? " — too long" : ""}</span>
                                        {SIZED_KINDS.includes(entry.kind) && (
                                            <label className="fine copy-size">
                                                Size{" "}
                                                <select className="admin-status" value={v.size ?? "md"} onChange={(e) => edit(entry, { size: e.target.value })}>
                                                    {Object.entries(COPY_SIZES).map(([k, label]) => <option key={k} value={k}>{label}</option>)}
                                                </select>
                                            </label>
                                        )}
                                    </div>
                                    <details className="fine">
                                        <summary>Built-in wording</summary>
                                        <p className="copy-default">{entry.text}</p>
                                    </details>
                                    {/* actions only where there's something to act on, so the long list stays calm */}
                                    {(working[entry.id] || drafts[entry.id] || published[entry.id]) && (
                                    <div className="row copy-actions">
                                        {working[entry.id] && <button type="button" className="btn btn-line btn-sm" disabled={busy === entry.id || over} onClick={() => saveDraft(entry)}>Save draft</button>}
                                        {(working[entry.id] || drafts[entry.id]) && <button type="button" className="btn btn-primary btn-sm" disabled={busy === entry.id || over} onClick={() => publish(entry)}>Publish</button>}
                                        {drafts[entry.id] && <button type="button" className="btn btn-line btn-sm" disabled={busy === entry.id} onClick={() => discardDraft(entry)}>Discard draft</button>}
                                        {published[entry.id] && (
                                            <button type="button" className="btn btn-line btn-sm" disabled={busy === entry.id} onClick={() => window.confirm("Put this text back to the built-in wording?") && publish(entry, true)}>
                                                Back to the original
                                            </button>
                                        )}
                                    </div>
                                    )}
                                </div>
                            );
                        })}
                    </section>
                ))
            )}

            <section className="stack" style={{ "--gap": "10px" }} aria-labelledby="copy-history">
                <h4 className="h4" id="copy-history">Recent changes</h4>
                {history.docs.length === 0 ? (
                    <p className="small">No changes published yet.</p>
                ) : (
                    <ul className="copy-history">
                        {history.docs.map((h) => (
                            <li key={h.id} className="small">
                                <strong>{h.action === "revert" ? "Back to the original" : "Published"}</strong> <code>{h.key}</code> · {h.by} · {when(h.at)}
                                {h.to && <span className="copy-history-to">“{h.to}”</span>}
                            </li>
                        ))}
                    </ul>
                )}
            </section>
        </div>
    );
};
