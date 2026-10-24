import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CONTENT } from "../../data/content";
import { useCollection } from "../../hooks/useCollection";
import { deleteItem, importStarter, saveItem, toForm } from "../../lib/adminContent";
import { formatUGX } from "../../lib/money";
import { Photo, imageName } from "../page/Photo";
import { Icon } from "../ui/Icon";
import { AdminField } from "./AdminField";

const PUBLIC_PATH = { products: "/stores", templates: "/templates", projects: "/projects", developments: "/real-estate", posts: "/journal", courses: "/academy", events: "/community" };
const DETAIL = { products: true, templates: true, projects: true, developments: true, posts: true };

// Add, edit, hide and delete one kind of content. Lists the Firestore collection live; when it's
// empty the site shows the starter data from src/data/, which can be imported to edit here.
export const ContentPanel = ({ name }) => {
    const def = CONTENT[name];
    const { docs, loading, error } = useCollection(name);
    const [editing, setEditing] = useState(null); // null | { id, values }
    const [busy, setBusy] = useState(false);
    const [note, setNote] = useState(null);

    const sorted = useMemo(() => [...docs].sort((a, b) => String(a.title).localeCompare(String(b.title))), [docs]);

    const run = async (fn, done) => {
        setBusy(true);
        setNote(null);
        try {
            await fn();
            if (done) setNote({ ok: true, text: done });
        } catch (e) {
            setNote({ ok: false, text: e.code === "permission-denied" ? "Firestore refused the change: this account doesn't have the admin claim yet (sign out and back in after it's set)." : e.message });
        } finally {
            setBusy(false);
        }
    };

    if (editing) {
        const set = (field, v) => setEditing((e) => ({ ...e, values: { ...e.values, [field]: v } }));
        const onSubmit = (event) => {
            event.preventDefault();
            run(async () => {
                await saveItem(name, editing.id, editing.values);
                setEditing(null);
            }, "Saved. The site shows the change within a few minutes (straight away in this browser).");
        };
        return (
            <form className="card card-pad form admin-editor" onSubmit={onSubmit} aria-labelledby="admin-editor-title">
                <div className="between">
                    <h3 className="h3" id="admin-editor-title">{editing.id ? `Edit “${editing.values.title || "item"}”` : `New ${def.label.toLowerCase().replace(/s$/, "")}`}</h3>
                    <button type="button" className="btn btn-line btn-sm" onClick={() => setEditing(null)}>Cancel</button>
                </div>
                <div className="admin-fields">
                    {def.fields.map((f) => (
                        <div key={f.name} className={f.type === "textarea" || f.type === "images" ? "admin-wide" : ""}>
                            <AdminField collection={name} field={f} value={editing.values[f.name]} onChange={(v) => set(f.name, v)} idPrefix={`edit-${name}`} />
                        </div>
                    ))}
                </div>
                {note && !note.ok && <p className="alert alert-error" role="alert">{note.text}</p>}
                <div className="row">
                    <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? "Saving…" : "Save"}</button>
                    {editing.id && (
                        <button
                            type="button"
                            className="btn btn-line"
                            disabled={busy}
                            onClick={() => {
                                if (window.confirm(`Delete “${editing.values.title}”? This can't be undone. To take it off the site but keep it, untick “Show on the site” instead.`))
                                    run(async () => {
                                        await deleteItem(name, editing.id);
                                        setEditing(null);
                                    }, "Deleted.");
                            }}
                        >
                            Delete
                        </button>
                    )}
                </div>
            </form>
        );
    }

    return (
        <div className="stack" style={{ "--gap": "18px" }}>
            <div className="between" style={{ alignItems: "center" }}>
                <div className="stack" style={{ "--gap": "4px" }}>
                    <h3 className="h3">{def.label}</h3>
                    <p className="small">
                        Shown on <Link className="link" to={PUBLIC_PATH[name]}>{PUBLIC_PATH[name]}</Link>. Untick “Show on the site” to hide an item without deleting it.
                    </p>
                </div>
                <button type="button" className="btn btn-primary btn-sm" onClick={() => setEditing({ id: null, values: toForm(name) })}>
                    <Icon name="plus" size={16} /> Add
                </button>
            </div>

            {note && <p className={`alert ${note.ok ? "" : "alert-error"}`} role="status">{note.text}</p>}
            {error && <p className="alert alert-error" role="alert">Couldn't load {def.label.toLowerCase()}: {error.message}</p>}

            {loading ? (
                <div className="skeleton" style={{ height: 160 }} />
            ) : sorted.length === 0 ? (
                <div className="card card-pad stack" style={{ "--gap": "12px" }}>
                    <p className="body">Nothing added here yet, so the site shows the starter list from the code.</p>
                    <p className="small">Import it to edit those items here, or just add new ones (once there's at least one item here, the starter list is no longer shown).</p>
                    <button type="button" className="btn btn-line btn-sm" style={{ alignSelf: "flex-start" }} disabled={busy} onClick={() => run(async () => {
                        const n = await importStarter(name);
                        setNote({ ok: true, text: `Imported ${n} starter item${n === 1 ? "" : "s"}.` });
                    })}>
                        Import the starter list
                    </button>
                </div>
            ) : (
                <ul className="admin-items">
                    {sorted.map((item) => (
                        <li key={item.id} className="card admin-item">
                            <Photo name={imageName(item.images?.[0])} alt={item.title} ratio="1 / 1" sizes="72px" />
                            <div className="stack" style={{ "--gap": "4px" }}>
                                <strong>{item.title || "(untitled)"}</strong>
                                <span className="fine">
                                    {[item.category || item.status || item.level, "priceUGX" in item ? formatUGX(item.priceUGX) : null, item.featured ? "Featured" : null].filter(Boolean).join(" · ")}
                                </span>
                            </div>
                            <span className={`tag ${item.active === false ? "" : "tag-accent"}`}>{item.active === false ? "Hidden" : "Live"}</span>
                            <div className="row" style={{ "--gap": "8px" }}>
                                {DETAIL[name] && item.active !== false && (
                                    <Link to={`${PUBLIC_PATH[name]}/${item.slug || item.id}`} className="btn btn-line btn-sm">View</Link>
                                )}
                                <button type="button" className="btn btn-ink btn-sm" onClick={() => setEditing({ id: item.id, values: toForm(name, item) })}>Edit</button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};
