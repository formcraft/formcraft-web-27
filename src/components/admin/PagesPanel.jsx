import { useState } from "react";
import { Link } from "react-router-dom";
import { PAGES, PAGE_GROUPS } from "../../data/pages";
import { useSite } from "../../hooks/useSite";

// Turn pages on and off for visitors. A page that's off drops out of the header, footer and home
// doors, and its address shows "opens soon". Admins keep seeing it, with a "hidden" strip.
export const PagesPanel = () => {
    const { visibility, setPage } = useSite();
    const [pending, setPending] = useState(null);
    const [error, setError] = useState(null);

    const toggle = async (key, on) => {
        setPending(key);
        setError(null);
        try {
            await setPage(key, on);
        } catch (e) {
            setError(e.code === "permission-denied" ? "Firestore refused the change: this account doesn't have the admin claim yet." : e.message);
        } finally {
            setPending(null);
        }
    };

    const onCount = PAGES.filter((p) => visibility[p.key]).length;

    return (
        <div className="stack" style={{ "--gap": "22px" }}>
            <div className="stack" style={{ "--gap": "6px" }}>
                <h3 className="h3">Pages on the site</h3>
                <p className="small">
                    {onCount} of {PAGES.length} pages open to visitors. Start small: open a page when there's real content behind it. Changes reach visitors on their next visit.
                </p>
            </div>
            {error && <p className="alert alert-error" role="alert">{error}</p>}
            {PAGE_GROUPS.map((group) => (
                <fieldset key={group} className="admin-pages">
                    <legend className="eyebrow">{group}</legend>
                    {PAGES.filter((p) => p.group === group).map((p) => {
                        const on = visibility[p.key];
                        const id = `page-${p.key}`;
                        return (
                            <div key={p.key} className="admin-page-row">
                                <div className="stack" style={{ "--gap": "2px" }}>
                                    <label htmlFor={id}><strong>{p.label}</strong></label>
                                    <span className="fine">
                                        <Link to={p.paths[0]} className="link">{p.paths[0]}</Link>
                                        {p.note ? ` · ${p.note}` : ""}
                                        {p.locked ? " · always on" : ""}
                                    </span>
                                </div>
                                <button
                                    id={id}
                                    type="button"
                                    role="switch"
                                    aria-checked={on}
                                    className="admin-switch"
                                    disabled={p.locked || pending === p.key}
                                    onClick={() => toggle(p.key, !on)}
                                >
                                    <span className="admin-switch-knob" aria-hidden="true" />
                                    <span className="admin-switch-text">{on ? "On" : "Off"}</span>
                                </button>
                            </div>
                        );
                    })}
                </fieldset>
            ))}
        </div>
    );
};
