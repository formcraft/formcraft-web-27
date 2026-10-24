import { useState } from "react";
import { getDb } from "../../config/firebase";
import { useAuth } from "../../hooks/useAuth";
import { useCollection } from "../../hooks/useCollection";
import { ROLES, STARTER_TEAM } from "../../data/team";
import "./TeamPanel.css";

// Admin → Team (admins only): who can use the admin page and with which role. Each person is a
// Firestore doc team/{email in lower case}; the onTeamChange and claimTeamRole Cloud Functions turn
// it into custom claims (admin / role), which firestore.rules and storage.rules check.
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const fsMod = () => Promise.all([getDb(), import("firebase/firestore")]);

const writeMember = async (email, data, by, isNew) => {
    const [db, { doc, setDoc, serverTimestamp }] = await fsMod();
    await setDoc(
        doc(db, "team", email.toLowerCase()),
        { ...data, email: email.toLowerCase(), updatedAt: serverTimestamp(), ...(isNew ? { addedBy: by ?? null, createdAt: serverTimestamp() } : {}) },
        { merge: true }
    );
};
const deleteMember = async (email) => {
    const [db, { doc, deleteDoc }] = await fsMod();
    await deleteDoc(doc(db, "team", email.toLowerCase()));
};

export const TeamPanel = () => {
    const { user } = useAuth();
    const me = user?.email?.toLowerCase() ?? "";
    const { docs, loading, error } = useCollection("team");
    const [form, setForm] = useState({ name: "", email: "", role: "editor", title: "" });
    const [busy, setBusy] = useState(false);
    const [note, setNote] = useState(null);
    const members = [...docs].sort((a, b) => (a.active === false) - (b.active === false) || String(a.name).localeCompare(String(b.name)));
    const known = new Set(docs.map((d) => d.id));
    const starterToAdd = STARTER_TEAM.filter((m) => m.email && !known.has(m.email.toLowerCase()));
    const starterNoEmail = STARTER_TEAM.filter((m) => !m.email && !docs.some((d) => d.name === m.name));

    const run = async (fn, done) => {
        setBusy(true);
        setNote(null);
        try {
            await fn();
            setNote({ ok: true, text: done });
        } catch (e) {
            setNote({ ok: false, text: e.code === "permission-denied" ? "Firestore refused: only admins can change the team." : e.message });
        } finally {
            setBusy(false);
        }
    };

    const add = (e) => {
        e.preventDefault();
        const email = form.email.trim().toLowerCase();
        if (!EMAIL.test(email)) return setNote({ ok: false, text: "That email address doesn't look right." });
        if (!ROLES[form.role]) return setNote({ ok: false, text: "Pick a role." });
        if (known.has(email)) return setNote({ ok: false, text: `${email} is on the team already — change their role in the list.` });
        run(async () => {
            await writeMember(email, { name: form.name.trim(), role: form.role, title: form.title.trim(), active: true }, user?.email, true);
            setForm({ name: "", email: "", role: "editor", title: "" });
        }, `Added ${email}. Access switches on the next time they sign in.`);
    };

    const importStarter = () =>
        run(async () => {
            for (const m of starterToAdd) await writeMember(m.email, { name: m.name, role: m.role, title: m.title, active: true }, user?.email, true);
        }, `Imported ${starterToAdd.length} team member${starterToAdd.length === 1 ? "" : "s"}.`);

    return (
        <div className="stack" style={{ "--gap": "20px" }}>
            <div className="stack" style={{ "--gap": "6px" }}>
                <h3 className="h3">Team</h3>
                <p className="small">Who can use this admin page, and what they can do. Use the Google account each person signs in with.</p>
            </div>
            <div className="alert">
                Access switches on the next time they sign in. Cloud Functions must be deployed (Blaze plan) for this to work; until then use <code>scripts/set-admin.js</code> (with <code>--role marketing</code> or <code>--role editor</code>).
            </div>

            <dl className="team-roles">
                {Object.entries(ROLES).map(([k, r]) => (
                    <div key={k}>
                        <dt>{r.label}</dt>
                        <dd className="small">{r.help}</dd>
                    </div>
                ))}
            </dl>

            {note && <p className={`alert ${note.ok ? "" : "alert-error"}`} role={note.ok ? "status" : "alert"}>{note.text}</p>}
            {error && <p className="alert alert-error" role="alert">Couldn't load the team: {error.message}</p>}

            {(starterToAdd.length > 0 || starterNoEmail.length > 0) && (
                <div className="card card-pad stack" style={{ "--gap": "10px" }}>
                    <h4 className="h4">Starter team</h4>
                    <ul className="team-starter">
                        {STARTER_TEAM.map((m) => (
                            <li key={m.name} className="small">
                                <strong>{m.name}</strong> · {m.title} · {ROLES[m.role].label} ·{" "}
                                {m.email ? (known.has(m.email.toLowerCase()) ? "on the team" : m.email) : <span className="team-missing">add email</span>}
                            </li>
                        ))}
                    </ul>
                    {starterToAdd.length > 0 && (
                        <button type="button" className="btn btn-line btn-sm" style={{ alignSelf: "flex-start" }} disabled={busy} onClick={importStarter}>
                            Import starter team ({starterToAdd.length})
                        </button>
                    )}
                    {starterNoEmail.length > 0 && <p className="fine">People without an email aren’t imported: add them with the form below once you know the address they sign in with.</p>}
                </div>
            )}

            {loading ? (
                <div className="skeleton" style={{ height: 120 }} />
            ) : (
                <div className="table-wrap card" role="region" aria-label="Team members" tabIndex={0}>
                    <table className="table admin-table">
                        <thead>
                            <tr><th scope="col">Name</th><th scope="col">Email</th><th scope="col">Title</th><th scope="col">Role</th><th scope="col">Active</th><th scope="col"><span className="sr-only">Remove</span></th></tr>
                        </thead>
                        <tbody>
                            {members.length === 0 && <tr><td colSpan={6} className="small">Nobody added yet.</td></tr>}
                            {members.map((m) => {
                                const self = m.id === me;
                                return (
                                    <tr key={m.id} className={m.active === false ? "team-off" : ""}>
                                        <td><strong>{m.name || "—"}</strong>{self && <span className="fine"> (you)</span>}</td>
                                        <td className="fine">{m.email || m.id}</td>
                                        <td>
                                            <label className="sr-only" htmlFor={`tt-${m.id}`}>Title for {m.name || m.id}</label>
                                            <input id={`tt-${m.id}`} className="admin-status team-title" defaultValue={m.title ?? ""} onBlur={(e) => e.target.value !== (m.title ?? "") && run(() => writeMember(m.id, { title: e.target.value.trim() }, user?.email, false), "Title saved.")} />
                                        </td>
                                        <td>
                                            <label className="sr-only" htmlFor={`tr-${m.id}`}>Role for {m.name || m.id}</label>
                                            <select
                                                id={`tr-${m.id}`}
                                                className="admin-status"
                                                value={m.role ?? "editor"}
                                                disabled={busy || (self && m.role === "admin")}
                                                title={self ? "You can't take away your own admin role" : undefined}
                                                onChange={(e) => run(() => writeMember(m.id, { role: e.target.value }, user?.email, false), `Role changed to ${ROLES[e.target.value].label}. It applies at their next sign-in.`)}
                                            >
                                                {Object.entries(ROLES).map(([k, r]) => <option key={k} value={k}>{r.label}</option>)}
                                            </select>
                                        </td>
                                        <td>
                                            <label className="admin-check">
                                                <input type="checkbox" checked={m.active !== false} disabled={busy || self} onChange={(e) => run(() => writeMember(m.id, { active: e.target.checked }, user?.email, false), e.target.checked ? "Reactivated." : "Deactivated: their access ends at their next sign-in or token refresh (within an hour).")} />
                                                <span className="sr-only">Active: {m.name || m.id}</span>
                                            </label>
                                        </td>
                                        <td>
                                            <button
                                                type="button"
                                                className="btn btn-line btn-sm"
                                                disabled={busy || self}
                                                title={self ? "You can't remove yourself" : undefined}
                                                onClick={() => window.confirm(`Remove ${m.name || m.id} from the team? Their admin access ends.`) && run(() => deleteMember(m.id), "Removed.")}
                                            >
                                                Remove
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            <form className="card card-pad form" onSubmit={add} aria-labelledby="team-add-title">
                <h4 className="h4" id="team-add-title">Add someone</h4>
                <div className="form-row">
                    <div className="field">
                        <label htmlFor="team-name">Name</label>
                        <input id="team-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                    </div>
                    <div className="field">
                        <label htmlFor="team-email">Sign-in email *</label>
                        <input id="team-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required autoComplete="off" />
                    </div>
                </div>
                <div className="form-row">
                    <div className="field">
                        <label htmlFor="team-role">Role</label>
                        <select id="team-role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} aria-describedby="team-role-hint">
                            {Object.entries(ROLES).map(([k, r]) => <option key={k} value={k}>{r.label}</option>)}
                        </select>
                        <span className="hint" id="team-role-hint">{ROLES[form.role]?.help}</span>
                    </div>
                    <div className="field">
                        <label htmlFor="team-title">Title</label>
                        <input id="team-title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Head of Sales & Marketing" />
                    </div>
                </div>
                <button type="submit" className="btn btn-primary btn-sm" style={{ justifySelf: "start" }} disabled={busy}>{busy ? "Saving…" : "Add to the team"}</button>
            </form>
        </div>
    );
};
