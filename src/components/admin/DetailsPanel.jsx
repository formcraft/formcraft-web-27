import { useState } from "react";
import { useSite } from "../../hooks/useSite";
import { useAuth } from "../../hooks/useAuth";
import { CONTACT_DEFAULTS, DETAIL_FIELDS, waHref } from "../../data/contact";

// Public contact details shown in the footer, on Contact and on /links (Firestore settings/site.details).
// Empty fields are left off the site. Admins only (firestore.rules: settings are admin-write).
export const DetailsPanel = () => {
    const { details, setDetails } = useSite();
    const { isAdmin } = useAuth();
    const [values, setValues] = useState(() => Object.fromEntries(DETAIL_FIELDS.map(([k]) => [k, details[k] ?? ""])));
    const [busy, setBusy] = useState(false);
    const [note, setNote] = useState(null);

    const onSubmit = async (event) => {
        event.preventDefault();
        setBusy(true);
        setNote(null);
        try {
            await setDetails(values);
            setNote({ ok: true, text: "Saved. Visitors see the new details on their next visit (straight away in this browser)." });
        } catch (e) {
            setNote({ ok: false, text: e.code === "permission-denied" ? "Firestore refused the change: only admins can edit the site details." : e.message });
        } finally {
            setBusy(false);
        }
    };

    const wa = waHref(values.whatsapp);

    return (
        <form className="card card-pad form admin-editor" onSubmit={onSubmit} aria-labelledby="details-title">
            <div className="stack" style={{ "--gap": "6px" }}>
                <h3 className="h3" id="details-title">Site details</h3>
                <p className="small">Contact details and social profiles shown in the footer, on the Contact page and on the Links page. Leave a field empty to take it off the site.</p>
            </div>
            {!isAdmin && <p className="alert">Only admins can change these.</p>}
            <div className="admin-fields">
                {DETAIL_FIELDS.map(([key, label, help]) => (
                    <div className="field" key={key}>
                        <label htmlFor={`sd-${key}`}>{label}</label>
                        <input
                            id={`sd-${key}`}
                            value={values[key]}
                            onChange={(e) => setValues((v) => ({ ...v, [key]: e.target.value }))}
                            maxLength={300}
                            inputMode={key === "whatsapp" || key === "phone" ? "tel" : key === "email" ? "email" : undefined}
                            placeholder={CONTACT_DEFAULTS[key] ?? ""}
                            aria-describedby={help ? `sd-${key}-hint` : undefined}
                            disabled={!isAdmin}
                        />
                        {help && <span className="hint" id={`sd-${key}-hint`}>{help}</span>}
                    </div>
                ))}
            </div>
            {wa && (
                <p className="small">
                    WhatsApp link: <a className="link" href={wa} target="_blank" rel="noreferrer">{wa.split("?")[0]}</a> — it appears in the footer, on Contact and on /links once saved.
                </p>
            )}
            {note && <p className={`alert ${note.ok ? "" : "alert-error"}`} role={note.ok ? "status" : "alert"}>{note.text}</p>}
            <div className="row">
                <button type="submit" className="btn btn-primary" disabled={busy || !isAdmin}>{busy ? "Saving…" : "Save details"}</button>
            </div>
        </form>
    );
};
