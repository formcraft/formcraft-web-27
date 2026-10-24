// Studio → Bulk: work on many posts at once: filter, select, change status or date, and import or export CSV.
import { useMemo, useState } from "react";
import { useCollection } from "../../../hooks/useCollection";
import { channelLabel } from "../../../data/socialPlatforms";
import {
    CSV_COLUMNS,
    EDITOR_STATUSES,
    STATUSES,
    addDays,
    bulkDeletePosts,
    bulkUpdatePosts,
    canEditPost,
    csvToPosts,
    dayKey,
    downloadText,
    enabledChannelIds,
    formatDay,
    fromEat,
    importCsvItems,
    parseCSV,
    postsToCSV,
    rangeQuery,
    timeKey,
    todayKey,
    toCSV,
} from "../../../lib/studio";
import { StatusTag } from "./StatusTag";

// Bulk work: pick a date range, filter, select posts and approve / move / change status / delete
// them together (role-checked), export any filtered set as CSV, or import many posts from a CSV
// with matching pictures picked in the same dialog.
export const BulkView = ({ studio }) => {
    const { channels, channelsById, occasionsById, settings, isMarketing, user, openComposer } = studio;
    const today = todayKey();
    const [from, setFrom] = useState(today);
    const [to, setTo] = useState(addDays(today, 30));
    const [filters, setFilters] = useState({ channel: "", status: "", pillar: "" });
    const [selected, setSelected] = useState([]);
    const [shift, setShift] = useState(7);
    const [newStatus, setNewStatus] = useState("draft");
    const [busy, setBusy] = useState(false);
    const [note, setNote] = useState(null);
    const { docs, loading, error } = useCollection("socialPosts", rangeQuery(from, to), [from, to], Boolean(from && to && from <= to));

    const rows = useMemo(
        () => docs.filter((p) => (!filters.channel || p.perChannel?.[filters.channel]?.enabled) && (!filters.status || p.status === filters.status) && (!filters.pillar || p.pillar === filters.pillar)),
        [docs, filters]
    );
    const pillars = [...new Set(docs.map((p) => p.pillar).filter(Boolean))].sort();
    const chosen = rows.filter((p) => selected.includes(p.id));
    const allOn = rows.length > 0 && rows.every((p) => selected.includes(p.id));

    const run = async (fn) => {
        setBusy(true);
        setNote(null);
        try {
            const text = await fn();
            setNote({ ok: true, text });
            setSelected([]);
        } catch (e) {
            setNote({ ok: false, text: e.code === "permission-denied" ? "Firestore refused one of the changes (role)." : e.message });
        } finally {
            setBusy(false);
        }
    };

    // approval needs every care note ticked and a date; others are skipped and reported
    const approve = () =>
        run(async () => {
            const ok = chosen.filter((p) => {
                const care = occasionsById[p.occasionId]?.careNotes ?? [];
                return p.scheduledAt && enabledChannelIds(p).length && care.every((n) => p.careChecked?.includes(n)) && !["published"].includes(p.status);
            });
            const n = await bulkUpdatePosts(ok, () => ({ status: "approved" }), user);
            const skipped = chosen.length - ok.length;
            return `Approved ${n}.${skipped ? ` Skipped ${skipped} (care notes not ticked, no channel, no date, or already published) — open them to finish.` : ""}`;
        });
    const move = () =>
        run(async () => {
            const days = Math.round(Number(shift) || 0);
            const list = chosen.filter((p) => p.scheduledAt && canEditPost(p, isMarketing));
            const n = await bulkUpdatePosts(list, (p) => ({ scheduledAt: fromEat(addDays(dayKey(p.scheduledAt), days), timeKey(p.scheduledAt)) }), user);
            return `Moved ${n} post${n === 1 ? "" : "s"} by ${days} day${Math.abs(days) === 1 ? "" : "s"}.`;
        });
    const setStatus = () =>
        run(async () => {
            if (!isMarketing && !EDITOR_STATUSES.includes(newStatus)) throw new Error("Editors can set idea, draft or review only.");
            const list = chosen.filter((p) => canEditPost(p, isMarketing));
            const n = await bulkUpdatePosts(list, () => ({ status: newStatus }), user);
            return `Set ${n} to “${STATUSES[newStatus]}”.${newStatus === "approved" ? " Note: care notes aren't checked by this action — use Approve for that." : ""}`;
        });
    const remove = () => {
        if (!window.confirm(`Delete ${chosen.length} post${chosen.length === 1 ? "" : "s"}? This can't be undone.`)) return;
        run(async () => `Deleted ${await bulkDeletePosts(chosen.map((p) => p.id))}.`);
    };
    const exportCsv = (list) => downloadText(`formcraft-social-${from}-to-${to}.csv`, postsToCSV(list, channels, settings));

    return (
        <div className="stack" style={{ "--gap": "18px" }}>
            <div className="mkt-filters">
                <div className="field">
                    <label htmlFor="bulk-from">From</label>
                    <input id="bulk-from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
                </div>
                <div className="field">
                    <label htmlFor="bulk-to">To</label>
                    <input id="bulk-to" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
                </div>
                <div className="field">
                    <label htmlFor="bulk-channel">Channel</label>
                    <select id="bulk-channel" value={filters.channel} onChange={(e) => setFilters({ ...filters, channel: e.target.value })}>
                        <option value="">All</option>
                        {channels.map((c) => <option key={c.id} value={c.id}>{channelLabel(c)}</option>)}
                    </select>
                </div>
                <div className="field">
                    <label htmlFor="bulk-status">Status</label>
                    <select id="bulk-status" value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
                        <option value="">All</option>
                        {Object.entries(STATUSES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                </div>
                <div className="field">
                    <label htmlFor="bulk-pillar">Pillar</label>
                    <select id="bulk-pillar" value={filters.pillar} onChange={(e) => setFilters({ ...filters, pillar: e.target.value })}>
                        <option value="">All</option>
                        {pillars.map((p) => <option key={p} value={p}>{p}</option>)}
                    </select>
                </div>
            </div>

            <div className="card card-pad stack mkt-bulkbar" style={{ "--gap": "12px" }}>
                <p className="small"><strong>{chosen.length}</strong> selected of {rows.length} shown.</p>
                <div className="row" style={{ "--gap": "8px", alignItems: "flex-end" }}>
                    {isMarketing && <button type="button" className="btn btn-primary btn-sm" disabled={busy || !chosen.length} onClick={approve}>Approve</button>}
                    <div className="field mkt-inline">
                        <label htmlFor="bulk-shift">Move by days</label>
                        <input id="bulk-shift" type="number" value={shift} onChange={(e) => setShift(e.target.value)} style={{ width: "6em" }} />
                    </div>
                    <button type="button" className="btn btn-line btn-sm" disabled={busy || !chosen.length} onClick={move}>Move</button>
                    <div className="field mkt-inline">
                        <label htmlFor="bulk-newstatus">Status</label>
                        <select id="bulk-newstatus" value={newStatus} onChange={(e) => setNewStatus(e.target.value)}>
                            {Object.entries(STATUSES).filter(([k]) => isMarketing || EDITOR_STATUSES.includes(k)).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                        </select>
                    </div>
                    <button type="button" className="btn btn-line btn-sm" disabled={busy || !chosen.length} onClick={setStatus}>Set status</button>
                    {isMarketing && <button type="button" className="btn btn-line btn-sm" disabled={busy || !chosen.length} onClick={remove}>Delete</button>}
                    <button type="button" className="btn btn-line btn-sm" disabled={!rows.length} onClick={() => exportCsv(chosen.length ? chosen : rows)}>
                        Export CSV ({chosen.length || rows.length})
                    </button>
                </div>
            </div>

            {note && <p className={`alert ${note.ok ? "" : "alert-error"}`} role={note.ok ? "status" : "alert"}>{note.text}</p>}
            {error && <p className="alert alert-error" role="alert">Couldn't load: {error.message}</p>}

            {loading ? (
                <div className="skeleton" style={{ height: 160 }} />
            ) : (
                <div className="table-wrap card" role="region" aria-label="Posts" tabIndex={0}>
                    <table className="table admin-table">
                        <thead>
                            <tr>
                                <th scope="col">
                                    <label className="sr-only" htmlFor="bulk-all">Select all</label>
                                    <input id="bulk-all" type="checkbox" checked={allOn} onChange={(e) => setSelected(e.target.checked ? rows.map((p) => p.id) : [])} />
                                </th>
                                <th scope="col">When</th>
                                <th scope="col">Title</th>
                                <th scope="col">Channels</th>
                                <th scope="col">Pillar</th>
                                <th scope="col">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.length === 0 && (
                                <tr><td colSpan={6} className="small">No posts in this range.</td></tr>
                            )}
                            {rows.map((p) => (
                                <tr key={p.id}>
                                    <td>
                                        <label className="sr-only" htmlFor={`sel-${p.id}`}>Select {p.title}</label>
                                        <input id={`sel-${p.id}`} type="checkbox" checked={selected.includes(p.id)} onChange={(e) => setSelected(e.target.checked ? [...selected, p.id] : selected.filter((x) => x !== p.id))} />
                                    </td>
                                    <td className="fine">{formatDay(dayKey(p.scheduledAt))} {timeKey(p.scheduledAt)}</td>
                                    <td><button type="button" className="admin-more" onClick={() => openComposer(p)}>{p.title || "(untitled)"}</button></td>
                                    <td className="fine">{enabledChannelIds(p).map((id) => channelLabel(channelsById[id] ?? { name: id })).join(", ")}</td>
                                    <td className="fine">{p.pillar || "—"}</td>
                                    <td><StatusTag status={p.status} /></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <CsvImport studio={studio} />
        </div>
    );
};

const CsvImport = ({ studio }) => {
    const { channels, settings, isMarketing, user } = studio;
    const [csvName, setCsvName] = useState("");
    const [files, setFiles] = useState([]);
    const [rows, setRows] = useState(null);
    const [busy, setBusy] = useState(false);
    const [progress, setProgress] = useState(null);
    const [note, setNote] = useState(null);

    const checked = rows ? csvToPosts(rows, { channels, settings, files, isMarketing }) : null;
    const good = checked?.items.filter((i) => !i.errors.length) ?? [];

    const onCsv = async (e) => {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (!file) return;
        setNote(null);
        setCsvName(file.name);
        setRows(parseCSV(await file.text()));
    };

    const doImport = async () => {
        setBusy(true);
        setNote(null);
        try {
            const n = await importCsvItems(good, user, (done, total) => setProgress(`${done} / ${total}`));
            setNote({ ok: true, text: `Imported ${n} post${n === 1 ? "" : "s"}.` });
            setRows(null);
            setFiles([]);
            setCsvName("");
        } catch (err) {
            setNote({ ok: false, text: err.code === "permission-denied" ? "Firestore or Storage refused the import (role)." : err.message });
        } finally {
            setBusy(false);
            setProgress(null);
        }
    };

    const template = () =>
        downloadText(
            "formcraft-social-template.csv",
            toCSV([CSV_COLUMNS, [todayKey(), settings.defaultTime, channels.slice(0, 2).map(channelLabel).join(";"), "Example title", "Caption text, commas and\nnew lines are fine in quotes", "/studio", "BIM & design process", "", "picture.jpg", "draft"]])
        );

    return (
        <section className="card card-pad stack" style={{ "--gap": "14px" }} aria-labelledby="csv-import-title">
            <div className="between" style={{ alignItems: "center" }}>
                <h4 className="h4" id="csv-import-title">Import from CSV</h4>
                <button type="button" className="btn btn-line btn-sm" onClick={template}>Download a template</button>
            </div>
            <p className="small">
                Columns: <code>{CSV_COLUMNS.join(", ")}</code>. Date as YYYY-MM-DD (or DD/MM/YYYY), time HH:MM in Kampala time, several channels separated by “;”. Pick the pictures named in
                <code> imageName</code> at the same time. Nothing is written until you confirm, and existing posts are never changed.
            </p>
            <div className="row" style={{ "--gap": "10px" }}>
                <label className="btn btn-line btn-sm admin-upload" htmlFor="csv-file">Choose CSV file</label>
                <input id="csv-file" className="sr-only" type="file" accept=".csv,text/csv" onChange={onCsv} />
                <label className="btn btn-line btn-sm admin-upload" htmlFor="csv-images">Choose pictures ({files.length})</label>
                <input id="csv-images" className="sr-only" type="file" accept="image/*,video/*" multiple onChange={(e) => setFiles([...e.target.files])} />
                {csvName && <span className="fine">{csvName}</span>}
            </div>
            {note && <p className={`alert ${note.ok ? "" : "alert-error"}`} role={note.ok ? "status" : "alert"}>{note.text}</p>}
            {checked && (
                <>
                    <p className="small" aria-live="polite">
                        {checked.items.length} row{checked.items.length === 1 ? "" : "s"}: {good.length} ready, {checked.items.length - good.length} with errors (skipped).
                    </p>
                    <div className="table-wrap" role="region" aria-label="CSV preview" tabIndex={0}>
                        <table className="table admin-table">
                            <thead>
                                <tr><th scope="col">Line</th><th scope="col">When</th><th scope="col">Title</th><th scope="col">Status</th><th scope="col">Checks</th></tr>
                            </thead>
                            <tbody>
                                {checked.items.map((i) => (
                                    <tr key={i.line} className={i.errors.length ? "mkt-row-bad" : ""}>
                                        <td>{i.line}</td>
                                        <td className="fine">{i.post.scheduledAt ? `${formatDay(dayKey(i.post.scheduledAt))} ${timeKey(i.post.scheduledAt)}` : "—"}</td>
                                        <td>{i.post.title || "—"}{i.file ? <span className="fine"> · {i.file.name}</span> : null}</td>
                                        <td><StatusTag status={i.post.status} /></td>
                                        <td className="fine">
                                            {i.errors.map((e) => <div key={e} className="mkt-over">{e}</div>)}
                                            {i.warnings.map((w) => <div key={w}>{w}</div>)}
                                            {!i.errors.length && !i.warnings.length && "OK"}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="row">
                        <button type="button" className="btn btn-primary btn-sm" disabled={busy || !good.length} onClick={doImport}>{busy ? `Importing… ${progress ?? ""}` : `Import ${good.length} post${good.length === 1 ? "" : "s"}`}</button>
                        <button type="button" className="btn btn-line btn-sm" disabled={busy} onClick={() => { setRows(null); setCsvName(""); }}>Cancel</button>
                    </div>
                </>
            )}
        </section>
    );
};
