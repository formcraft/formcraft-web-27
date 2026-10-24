import { useState } from "react";
import { useCollection } from "../../hooks/useCollection";
import { setStatus } from "../../lib/adminContent";
import { INBOXES } from "./inboxes";

// Read-only lists of what visitors have sent (newest first), with a status the team can set
// where firestore.rules allow it. Money collections (orders, donations) are read-only here:
// only Cloud Functions change them.
const when = (ts) => {
    const d = ts?.toDate?.() ?? (ts ? new Date(ts) : null);
    return d ? d.toLocaleString("en-UG", { dateStyle: "medium", timeStyle: "short" }) : "—";
};


export const InboxPanel = ({ name }) => {
    const def = INBOXES[name];
    const { docs, loading, error } = useCollection(name, (fs, ref) => (name === "members" ? ref : fs.query(ref, fs.orderBy("createdAt", "desc"), fs.limit(200))), [name]);
    const [open, setOpen] = useState(null);
    const [saveError, setSaveError] = useState(null);

    const change = async (id, status) => {
        setSaveError(null);
        try {
            await setStatus(name, id, status);
        } catch (e) {
            setSaveError(e.message);
        }
    };

    return (
        <div className="stack" style={{ "--gap": "16px" }}>
            <div className="between" style={{ alignItems: "center" }}>
                <h3 className="h3">{def.label}</h3>
                <span className="fine">{loading ? "Loading…" : `${docs.length} shown`}</span>
            </div>
            {def.readOnly && <p className="small">Read-only. {name === "members" ? "Approvals arrive with member accounts in Phase 4." : "Only the server marks payments; nothing here can mark an order or donation paid."}</p>}
            {error && <p className="alert alert-error" role="alert">Couldn't load: {error.message}</p>}
            {saveError && <p className="alert alert-error" role="alert">{saveError}</p>}
            {loading ? (
                <div className="skeleton" style={{ height: 140 }} />
            ) : docs.length === 0 ? (
                <p className="card card-pad small">Nothing yet.</p>
            ) : (
                <div className="table-wrap card" role="region" aria-label={def.label} tabIndex={0}>
                    <table className="table admin-table">
                        <thead>
                            <tr>
                                <th scope="col">Received</th>
                                {def.cols.map(([key, label]) => <th key={key} scope="col">{label}</th>)}
                                {def.statuses && <th scope="col">Status</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {docs.map((d) => (
                                <tr key={d.id}>
                                    <td className="fine">{when(d.createdAt)}</td>
                                    {def.cols.map(([key, , fmt]) => {
                                        const raw = key === "id" ? d.id : d[key];
                                        const text = fmt ? fmt(raw) : raw == null || raw === "" ? "—" : String(raw);
                                        const long = typeof text === "string" && text.length > 90;
                                        return (
                                            <td key={key}>
                                                {long && open !== `${d.id}-${key}` ? (
                                                    <button type="button" className="admin-more" onClick={() => setOpen(`${d.id}-${key}`)}>
                                                        {text.slice(0, 90)}… <u>more</u>
                                                    </button>
                                                ) : (
                                                    <span className="admin-cell">{text}</span>
                                                )}
                                            </td>
                                        );
                                    })}
                                    {def.statuses && (
                                        <td>
                                            <label className="sr-only" htmlFor={`st-${d.id}`}>Status</label>
                                            <select id={`st-${d.id}`} className="admin-status" value={d.status ?? "new"} onChange={(e) => change(d.id, e.target.value)}>
                                                {def.statuses.map((s) => <option key={s} value={s}>{s}</option>)}
                                            </select>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};
