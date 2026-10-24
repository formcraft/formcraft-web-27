import { useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { usePageMeta } from "../hooks/usePageMeta";
import { useAuth } from "../hooks/useAuth";
import { useCollection } from "../hooks/useCollection";
import { useShowLink } from "../hooks/useSite";
import { formatUGX } from "../lib/money";
import { PageHero } from "../components/page/PageHero";
import { Section } from "../components/page/Section";
import { Icon } from "../components/ui/Icon";
import "./Account.css";

// The signed-in customer's page. Orders and enrolments are written only by Cloud Functions; the
// queries filter by uid so they match firestore.rules. Statuses come from those records only.
const TABS = [
    { id: "orders", label: "Orders" },
    { id: "downloads", label: "Downloads" },
    { id: "courses", label: "Courses" },
    { id: "donations", label: "Donations" },
    { id: "profile", label: "Profile" },
];

const dateFmt = new Intl.DateTimeFormat("en-UG", { day: "numeric", month: "short", year: "numeric" });
const when = (ts) => {
    const d = ts?.toDate ? ts.toDate() : ts ? new Date(ts) : null;
    return d && !Number.isNaN(d.getTime()) ? dateFmt.format(d) : "—";
};
const statusTag = (status) => (
    <span className={status === "paid" || status === "shipped" || status === "enrolled" ? "tag tag-accent account-status" : "tag account-status"}>{status ?? "—"}</span>
);

const Empty = ({ icon = "file", children, to, cta }) => (
    <div className="card card-pad stack center account-empty" style={{ "--gap": "14px" }}>
        <Icon name={icon} size={34} strokeWidth={1.5} />
        <p className="body mw" style={{ "--mw": "460px" }}>{children}</p>
        {to && <Link to={to} className="btn btn-line">{cta}</Link>}
    </div>
);

const Loading = () => (
    <div className="stack" style={{ "--gap": "10px" }} aria-hidden="true">
        <div className="skeleton" style={{ height: 48 }} />
        <div className="skeleton" style={{ height: 48 }} />
        <div className="skeleton" style={{ height: 48 }} />
    </div>
);

const LoadError = ({ what }) => <p className="alert alert-error" role="alert">We couldn't load your {what} just now. Check your connection and try again.</p>;

/** The Account page (/account), for signed-in visitors: orders, downloads, courses, donations and profile. */
export const Account = () => {
    usePageMeta("Your account", "Your Formcraft orders, downloads, courses, trees and profile.");
    const { user, loading: authLoading, openSignIn, signOut } = useAuth();
    const [params] = useSearchParams();
    const orderId = params.get("order");
    const show = useShowLink();
    const [tab, setTab] = useState("orders");
    const tabRefs = useRef([]);

    const signedIn = Boolean(user);
    const orders = useCollection("orders", (fs, ref) => fs.query(ref, fs.where("uid", "==", user.uid)), [user?.uid], signedIn);
    const enrolments = useCollection("enrolments", (fs, ref) => fs.query(ref, fs.where("uid", "==", user.uid)), [user?.uid], signedIn);

    const onKey = (e, i) => {
        const delta = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
        const next = e.key === "Home" ? 0 : e.key === "End" ? TABS.length - 1 : delta ? (i + delta + TABS.length) % TABS.length : null;
        if (next === null) return;
        e.preventDefault();
        setTab(TABS[next].id);
        tabRefs.current[next]?.focus();
    };

    if (authLoading) {
        return (
            <div className="account">
                <PageHero motif="city" sheet="U101" seed={81} sceneHeight={200} eyebrow="Your account" title="Your account" />
                <Section tone="sheet" seed={2}><Loading /></Section>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="account">
                <PageHero motif="city" sheet="U101" seed={81} sceneHeight={200} eyebrow="Your account" title="Sign in to see your account." crumbs={[["/", "Home"], [null, "Account"]]}
                    lead="Your orders, plans, courses and trees, in one place. Browsing the site doesn't need an account." />
                <Section tone="sheet" seed={2}>
                    <div className="card card-pad stack account-signin" style={{ "--gap": "16px" }}>
                        <Icon name="user" size={34} strokeWidth={1.5} />
                        <h2 className="h3">Sign in to Formcraft</h2>
                        <p className="body">Sign in to see orders, download plans, join the community or enrol on a course.</p>
                        {orderId && <p className="alert small">Sign in to see the status of order #{orderId}.</p>}
                        <div className="row">
                            <button type="button" className="btn btn-primary" onClick={openSignIn}>Sign in</button>
                            <Link to={`/sign-in?next=${encodeURIComponent(`/account${orderId ? `?order=${orderId}` : ""}`)}`} className="link">Other ways to sign in</Link>
                        </div>
                    </div>
                </Section>
            </div>
        );
    }

    const first = (user.displayName || "").split(" ")[0] || "there";
    const since = user.metadata?.creationTime ? when(new Date(user.metadata.creationTime)) : null; // shown only when Firebase knows it
    const focusOrder = orderId ? orders.docs.find((o) => o.id === orderId || o.txRef === orderId) : null;
    const digital = orders.docs.filter((o) => o.status === "paid" || o.status === "shipped").flatMap((o) => (o.items ?? []).filter((it) => it.isDigital).map((it) => ({ ...it, orderId: o.id, paidAt: o.paidAt })));

    return (
        <div className="account">
            <PageHero motif="city" sheet="U101" seed={81} sceneHeight={200} eyebrow="Your account" title={`Hello, ${first}.`} crumbs={[["/", "Home"], [null, "Account"]]}
                lead={[user.email, since && `member since ${since}`].filter(Boolean).join(" · ")}>
                <button type="button" className="btn btn-line" onClick={signOut}>Sign out</button>
            </PageHero>

            <Section tone="sheet" seed={2}>
                {orderId && (
                    <div className="alert account-notice" role="status">
                        {orders.loading ? (
                            <span>Checking order #{orderId}…</span>
                        ) : focusOrder ? (
                            <span>Order <b>#{focusOrder.id}</b>: {statusTag(focusOrder.status)} {focusOrder.status === "pending" && "Waiting for Flutterwave to confirm the payment. This updates on its own."}</span>
                        ) : (
                            <span>We can't find order #{orderId} in your account yet. If you've just paid, give it a minute — it appears once Flutterwave confirms the payment.</span>
                        )}
                    </div>
                )}

                <div className="account-tabs" role="tablist" aria-label="Your account">
                    {TABS.map((t, i) => (
                        <button key={t.id} ref={(el) => (tabRefs.current[i] = el)} type="button" role="tab" id={`account-tab-${t.id}`} aria-controls={`account-panel-${t.id}`}
                            aria-selected={tab === t.id} tabIndex={tab === t.id ? 0 : -1} className="account-tab" onClick={() => setTab(t.id)} onKeyDown={(e) => onKey(e, i)}>
                            {t.label}
                        </button>
                    ))}
                </div>

                <div className="account-panel" role="tabpanel" id={`account-panel-${tab}`} aria-labelledby={`account-tab-${tab}`} tabIndex={0}>
                    {tab === "orders" && (
                        <>
                            <h2 className="h3">Your orders</h2>
                            {orders.loading ? <Loading /> : orders.error ? <LoadError what="orders" /> : orders.docs.length === 0 ? (
                                <Empty icon="cart" to="/stores" cta="Browse the store">No orders yet. When you buy something, it shows here with its status.</Empty>
                            ) : (
                                <div className="table-wrap card" role="region" aria-label="Your orders" tabIndex={0}>
                                    <table className="table">
                                        <thead><tr><th scope="col">Order</th><th scope="col">Date</th><th scope="col">Total</th><th scope="col">Status</th></tr></thead>
                                        <tbody>
                                            {[...orders.docs].sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0)).map((o) => (
                                                <tr key={o.id} className={o.id === focusOrder?.id ? "account-row-focus" : undefined}>
                                                    <td>#{o.id}</td>
                                                    <td>{when(o.createdAt)}</td>
                                                    <td>{formatUGX(Number.isInteger(o.totalUGX) ? o.totalUGX : null)}</td>
                                                    <td>{statusTag(o.status)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                            <p className="fine">Status comes from our records after Flutterwave confirms payment.</p>
                        </>
                    )}

                    {tab === "downloads" && (
                        <>
                            <h2 className="h3">Your plans</h2>
                            {orders.loading ? <Loading /> : digital.length === 0 ? (
                                <Empty icon="file" to={show("/templates") ? "/templates" : "/stores"} cta={show("/templates") ? "Browse template builds" : "Browse the store"}>
                                    No downloads yet. Plans you buy appear here once the payment clears.
                                </Empty>
                            ) : (
                                <div className="table-wrap card" role="region" aria-label="Your plans" tabIndex={0}>
                                    <table className="table">
                                        <thead><tr><th scope="col">Design</th><th scope="col">Bought</th><th scope="col">Download</th></tr></thead>
                                        <tbody>
                                            {digital.map((d, i) => (
                                                <tr key={`${d.orderId}-${i}`}>
                                                    <td>{d.title}</td>
                                                    <td>{when(d.paidAt)}</td>
                                                    <td><span className="tag">Link coming in Phase 3</span></td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                            <p className="fine">Download links are private and expire after a short time; open this page again for a fresh link.</p>
                        </>
                    )}

                    {tab === "courses" && (
                        <>
                            <h2 className="h3">Your courses</h2>
                            {enrolments.loading ? <Loading /> : enrolments.error ? <LoadError what="courses" /> : enrolments.docs.length === 0 ? (
                                <Empty icon="layers" to={show("/academy") ? "/academy" : null} cta="See the Academy">You're not enrolled on a course yet.</Empty>
                            ) : (
                                <div className="table-wrap card" role="region" aria-label="Your courses" tabIndex={0}>
                                    <table className="table">
                                        <thead><tr><th scope="col">Course</th><th scope="col">Status</th></tr></thead>
                                        <tbody>
                                            {enrolments.docs.map((e) => (
                                                <tr key={e.id}><td>{e.courseTitle ?? e.courseId}</td><td>{statusTag(e.status)}</td></tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                            <p className="fine">Paid courses show as enrolled once payment clears.</p>
                        </>
                    )}

                    {tab === "donations" && (
                        <>
                            <h2 className="h3">Your trees</h2>
                            <Empty icon="leaf" to={show("/donate") ? "/donate" : null} cta="Plant a tree">
                                Trees you plant will show here. Tree payments open once the planting partner and price per tree are agreed.
                            </Empty>
                            <p className="fine">Certificates are on the thank-you page for each donation.</p>
                        </>
                    )}

                    {tab === "profile" && (
                        <>
                            <h2 className="h3">Your profile</h2>
                            <dl className="card card-pad account-profile">
                                <div><dt>Name</dt><dd>{user.displayName || "—"}</dd></div>
                                <div><dt>Email</dt><dd>{user.email || "—"}</dd></div>
                                {since && <div><dt>Member since</dt><dd>{since}</dd></div>}
                            </dl>
                            <p className="small">Member profiles for the artisan directory arrive with the community.{show("/community") && <> <Link to="/community" className="link">About the community</Link></>}</p>
                            <button type="button" className="btn btn-line" onClick={signOut} style={{ alignSelf: "flex-start" }}>Sign out</button>
                        </>
                    )}
                </div>
            </Section>
        </div>
    );
};
