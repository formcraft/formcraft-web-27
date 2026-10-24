import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { usePageMeta } from "../hooks/usePageMeta";
import { useAuth } from "../hooks/useAuth";
import { useSite } from "../hooks/useSite";
import { PAGES } from "../data/pages";
import { CONTENT } from "../data/content";
import { Section } from "../components/page/Section";
import { PagesPanel } from "../components/admin/PagesPanel";
import { ContentPanel } from "../components/admin/ContentPanel";
import { InboxPanel } from "../components/admin/InboxPanel";
import { INBOXES } from "../components/admin/inboxes";
import { LeadsPanel } from "../components/admin/LeadsPanel";
import { LinkBuilderPanel } from "../components/admin/LinkBuilderPanel";
import { DetailsPanel } from "../components/admin/DetailsPanel";
import { MotionPanel } from "../components/admin/MotionPanel";
import { StudioPanel } from "../components/admin/studio/StudioPanel";
import { TeamPanel } from "../components/admin/TeamPanel";
import { firebaseConfigured } from "../config/firebase";
import "./Admin.css";

// The team's control room: leads, which pages are open, the site's content, and what visitors sent.
// Each item says which team roles see it (custom claims: admin, role "marketing", role "editor");
// admins see everything. Everything here is enforced again by firestore.rules / storage.rules.
// To add a section, add an item { key, label, roles, render } to a group.
const TEAM = ["admin", "marketing"];

const SiteDetails = () => {
    const { loading } = useSite();
    return <DetailsPanel key={loading ? "loading" : "ready"} />;
};

const SiteMotion = () => {
    const { loading } = useSite();
    return <MotionPanel key={loading ? "loading" : "ready"} />;
};

const SECTIONS = [
    {
        group: "Marketing",
        items: [
            { key: "leads", label: "Leads", roles: TEAM, render: () => <LeadsPanel /> },
            { key: "studio", label: "Studio", roles: ["admin", "marketing", "editor"], render: () => <StudioPanel /> },
            { key: "links", label: "Link builder", roles: TEAM, render: () => <LinkBuilderPanel /> },
        ],
    },
    {
        group: "Site",
        items: [
            { key: "overview", label: "Overview", roles: ["admin"], render: (go) => <Overview go={go} /> },
            { key: "pages", label: "Pages", roles: ["admin"], render: () => <PagesPanel /> },
            { key: "details", label: "Site details", roles: ["admin"], render: () => <SiteDetails /> },
            { key: "motion", label: "Motion", roles: ["admin"], render: () => <SiteMotion /> },
            { key: "team", label: "Team", roles: ["admin"], render: () => <TeamPanel /> },
        ],
    },
    {
        group: "Content",
        items: Object.entries(CONTENT).map(([k, v]) => ({ key: k, label: v.label, roles: TEAM, render: () => <ContentPanel key={k} name={k} /> })),
    },
    {
        group: "Inbox",
        items: Object.entries(INBOXES).map(([k, v]) => ({ key: k, label: v.label, roles: ["admin"], render: () => <InboxPanel key={k} name={k} /> })),
    },
];

// The groups and items a role can see (admins: everything)
const sectionsFor = (role) =>
    SECTIONS.map((s) => ({ ...s, items: s.items.filter((i) => role === "admin" || i.roles.includes(role)) })).filter((s) => s.items.length > 0);

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
                <button type="button" className="card card-pad admin-tile" onClick={() => go("leads")}>
                    <span className="fine">Leads</span>
                    <strong className="h3">Quotes, messages, subscribers</strong>
                    <span className="small">Everything sent through the site's forms, where it came from, and a CSV export.</span>
                </button>
            </div>
            <p className="small">Payments: orders and donations are marked paid only by the server after Flutterwave confirms them — never from this screen.</p>
        </div>
    );
};

export const Admin = () => {
    usePageMeta("Admin", "Formcraft team admin.");
    const { user, isAdmin, isEditor, role, loading, openSignIn } = useAuth();
    const { hash } = useLocation();
    const navigate = useNavigate();
    const myRole = isAdmin ? "admin" : role;
    const sections = useMemo(() => sectionsFor(myRole), [myRole]);
    const items = useMemo(() => sections.flatMap((s) => s.items), [sections]);
    const [picked, setPicked] = useState(() => hash.slice(1) || null);
    const current = items.find((i) => i.key === picked) ?? items[0] ?? null;
    const tab = current?.key;

    useEffect(() => {
        const h = hash.slice(1);
        if (h) setPicked(h);
    }, [hash]);

    const go = (key) => {
        setPicked(key);
        navigate(`/admin#${key}`, { replace: true });
    };

    let body;
    if (loading) body = <div className="skeleton" style={{ height: 320 }} />;
    else if (!user)
        body = (
            <div className="card card-pad stack admin-gate" style={{ "--gap": "14px" }}>
                <h2 className="h3">Sign in to the admin page</h2>
                <p className="body">Only Formcraft team accounts (admin, marketing or editor) can use this page.</p>
                <button type="button" className="btn btn-primary" style={{ alignSelf: "flex-start" }} onClick={openSignIn}>Sign in</button>
            </div>
        );
    else if (!isEditor)
        body = (
            <div className="card card-pad stack admin-gate" style={{ "--gap": "14px" }}>
                <h2 className="h3">This account isn't on the Formcraft team.</h2>
                <p className="body">You're signed in as {user.email}. An admin can add you in Admin → Team (or with <code>scripts/set-admin.js</code>); sign out and back in afterwards.</p>
                <Link to="/" className="btn btn-line" style={{ alignSelf: "flex-start" }}>Back to the site</Link>
            </div>
        );
    else {
        body = (
            <div className="admin-layout">
                <nav className="admin-nav" aria-label="Admin sections">
                    {sections.map((s) => (
                        <div key={s.group} className="stack" style={{ "--gap": "2px" }}>
                            <p className="fine admin-nav-head">{s.group}</p>
                            {s.items.map(({ key, label }) => (
                                <button key={key} type="button" className="admin-nav-btn" aria-current={tab === key ? "page" : undefined} onClick={() => go(key)}>
                                    {label}
                                </button>
                            ))}
                        </div>
                    ))}
                </nav>
                <div className="admin-main" id="admin-main">
                    {current?.render(go)}
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
                    {isEditor && <span className="tag tag-accent">Signed in as {myRole} · {user?.email}</span>}
                </div>
                {body}
            </Section>
        </div>
    );
};
