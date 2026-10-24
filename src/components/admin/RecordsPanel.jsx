import { useState } from "react";
import { useCollection } from "../../hooks/useCollection";
import { RECORDS } from "./records";

// Admin → Records: read-only lists (orders, donations, members), newest first. Nothing here changes them:
// only Cloud Functions mark payments, and member approvals arrive with member accounts in Phase 4.
const when = (ts) => {
    const d = ts?.toDate?.() ?? (ts ? new Date(ts) : null);
    return d ? d.toLocaleString("en-UG", { dateStyle: "medium", timeStyle: "short" }) : "—";
};

const INTRO = {
    orders: "Every order, newest first. Only the server marks an order paid, after the payment provider confirms it.",
    donations: "Every plant-a-tree donation, newest first. Only the server marks a donation paid.",
    members: "Community members who have signed up. Approvals arrive with member accounts in Phase 4.",
};

/**
 * One record list on the admin page (orders, donations or members), read-only.
 * @param {{ name: string }} props  which list, a key of RECORDS in ./records.js
 */
export const RecordsPanel = ({ name }) => {
    const def = RECORDS[name];
    const { docs, loading, error } = useCollection(name, (fs, ref) => (name === "members" ? ref : fs.query(ref, fs.orderBy("createdAt", "desc"), fs.limit(200))), [name]);
    const [open, setOpen] = useState(null);

    return (
        <div className="stack" style={{ "--gap": "16px" }}>
            <div className="stack" style={{ "--gap": "6px" }}>
                <div className="between" style={{ alignItems: "center" }}>
                    <h3 className="h3">{def.label}</h3>
                    <span className="fine">{loading ? "Loading…" : `${docs.length} shown`}</span>
                </div>
                <p className="small">{INTRO[name]}</p>
            </div>
            {error && <p className="alert alert-error" role="alert">Couldn't load: {error.message}</p>}
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
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};
