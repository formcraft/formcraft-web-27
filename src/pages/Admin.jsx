import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { usePageMeta } from "../hooks/usePageMeta";
import { useAuth } from "../hooks/useAuth";
import { useSite } from "../hooks/useSite";
import { PAGES } from "../data/pages";
import { CONTENT } from "../data/content";
import { Section } from "../components/page/Section";
import { PagesPanel } from "../components/admin/PagesPanel";
import { ContentPanel } from "../components/admin/ContentPanel";
import { InboxPanel, INBOXES } from "../components/admin/InboxPanel";
import { firebaseConfigured } from "../config/firebase";
import "./Admin.css";

// The team's control room: which pages are open, the site's content, and what visitors sent.
// Everything here is enforced again by firestore.rules / storage.rules (admin custom claim).
const SECTIONS = [
    { group: "Site", items: [["overview", "Overview"], ["pages", "Pages"]] },
    { group: "Content", items: Object.entries(CONTENT).map(([k, v]) => [k, v.label]) },
    { group: "Inbox", items: Object.entries(INBOXES).map(([k, v]) => [k, v.label]) },
];
const ALL = SECTIONS.flatMap((s) => s.items.map(([k]) => k));

const Overview = ({ go }) => {
    const { visibility } = useSite();
    const hidden = PAGES.filter((p) => !visibility[p.key]);
    return (
        <div className="stack" style={{ "--gap": "22px" }}>
            <h3 className="h3">Overview</h3>
            {!firebaseConfigured && <p className="alert alert-error">No Firebase config in this build (`VITE_FIREBASE_*` in .env.local), so nothing here can load or save.</p>}
            <div className="grid-3">
                <button type="button" className="card card-pad admin-tile" onClick={() => go("pages")}>
                    <span className="fine">Pages</span>
                    <strong className="h3">{PAGES.length - hidden.length} open · {hidden.length} hidden</strong>
                    <span className="small">{hidden.length ? `Hidden: ${hidden.map((p) => p.label).join(", ")}` : "Every page is open to visitors."}</span>
                </button>
                <button type="button" className="card card-pad admin-tile" onClick={() => go("products")}>
                    <span className="fine">Content</span>
                    <strong className="h3">Products, designs, projects…</strong>
                    <span className="small">Add a new template design, a product or a Journal post, with photos.</span>
                </button>
                <button type="button" className="card card-pad admin-tile" onClick={() => go("quotes")}>
                    <span className="fine">Inbox</span>
                    <strong className="h3">Quotes and messages</strong>
                    <span className="small">Everything sent through the site's forms, newest first.</span>
                </button>
            </div>
            <p className="small">Payments: orders and donations are marked paid only by the server after Flutterwave confirms them — never from this screen.</p>
        </div>
    );
};

export const Admin = () => {
    usePageMeta("Admin", "Formcraft team admin.");
    const { user, isAdmin, loading, openSignIn } = useAuth();
    const { hash } = useLocation();
    const navigate = useNavigate();
    const initial = ALL.includes(hash.slice(1)) ? hash.slice(1) : "overview";
    const [tab, setTab] = useState(initial);

    useEffect(() => {
        const h = hash.slice(1);
        if (ALL.includes(h)) setTab(h);
    }, [hash]);

    const go = (key) => {
        setTab(key);
        navigate(`/admin#${key}`, { replace: true });
    };

    let body;
    if (loading) body = <div className="skeleton" style={{ height: 320 }} />;
    else if (!user)
        body = (
            <div className="card card-pad stack admin-gate" style={{ "--gap": "14px" }}>
                <h2 className="h3">Sign in to the admin page</h2>
                <p className="body">Only Formcraft team accounts with the admin role can use this page.</p>
                <button type="button" className="btn btn-primary" style={{ alignSelf: "flex-start" }} onClick={openSignIn}>Sign in</button>
            </div>
        );
    else if (!isAdmin)
        body = (
            <div className="card card-pad stack admin-gate" style={{ "--gap": "14px" }}>
                <h2 className="h3">This account isn't an admin.</h2>
                <p className="body">You're signed in as {user.email}. Admin rights are given with <code>scripts/set-admin.js</code> by someone with access to the Firebase project; sign out and back in afterwards.</p>
                <Link to="/" className="btn btn-line" style={{ alignSelf: "flex-start" }}>Back to the site</Link>
            </div>
        );
    else {
        body = (
            <div className="admin-layout">
                <nav className="admin-nav" aria-label="Admin sections">
                    {SECTIONS.map((s) => (
                        <div key={s.group} className="stack" style={{ "--gap": "2px" }}>
                            <p className="fine admin-nav-head">{s.group}</p>
                            {s.items.map(([key, label]) => (
                                <button key={key} type="button" className="admin-nav-btn" aria-current={tab === key ? "page" : undefined} onClick={() => go(key)}>
                                    {label}
                                </button>
                            ))}
                        </div>
                    ))}
                </nav>
                <div className="admin-main" id="admin-main">
                    {tab === "overview" && <Overview go={go} />}
                    {tab === "pages" && <PagesPanel />}
                    {CONTENT[tab] && <ContentPanel key={tab} name={tab} />}
                    {INBOXES[tab] && <InboxPanel key={tab} name={tab} />}
                </div>
            </div>
        );
    }

    return (
        <div className="admin">
            <Section tone="ground" torn={false} small>
                <div className="between admin-head">
                    <div className="stack" style={{ "--gap": "6px" }}>
                        <p className="eyebrow">Sheet U103 · team only</p>
                        <h1 className="h2">Admin</h1>
                    </div>
                    {isAdmin && <span className="tag tag-accent">Signed in as admin · {user?.email}</span>}
                </div>
                {body}
            </Section>
        </div>
    );
};
