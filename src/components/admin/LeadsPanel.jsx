import { useMemo, useState } from "react";
import { useCollection } from "../../hooks/useCollection";
import { setStatus } from "../../lib/adminContent";
import { RankBars, WeekBars } from "./LeadCharts";
import "./LeadsPanel.css";

// Every lead in one place: contact messages, sign-ups and course/event requests (messages with a
// [topic] subject), quote requests, investor leads and email subscribers — with where each one came
// from (source, campaign, page), a status pipeline, charts and CSV export. Contact clicks (`clicks`)
// are counted alongside. firestore.rules let admins and the marketing team read these and set status.
const STATUSES = ["new", "contacted", "qualified", "won", "lost"];
const TYPES = [
    ["leads", "All leads"],
    ["message", "Messages"],
    ["interest", "Sign-ups & places"],
    ["quote", "Quote requests"],
    ["investor", "Investor leads"],
    ["subscriber", "Subscribers"],
    ["click", "Contact clicks"],
];
const TYPE_LABEL = Object.fromEntries(TYPES);
const RANGES = [
    ["7", "Last 7 days"],
    ["30", "Last 30 days"],
    ["90", "Last 90 days"],
    ["all", "All time"],
];
const DAY = 24 * 60 * 60 * 1000;
const NO_SOURCE = "(not recorded)";

const toDate = (ts) => ts?.toDate?.() ?? (ts ? new Date(ts) : new Date()); // pending server time → now
const recent = (fs, ref, n) => fs.query(ref, fs.orderBy("createdAt", "desc"), fs.limit(n));

const touch = (src) => ({
    source: src?.last?.source || src?.first?.source || NO_SOURCE,
    medium: src?.last?.medium || src?.first?.medium || "",
    campaign: src?.last?.campaign || src?.first?.campaign || "",
    firstSource: src?.first?.source || "",
    firstCampaign: src?.first?.campaign || "",
    landing: src?.first?.landing || "",
});

const normalise = (collection, d) => {
    const base = { id: d.id, collection, status: d.status || "new", createdAt: toDate(d.createdAt), page: d.page || d.source?.page || "", ...touch(d.source) };
    switch (collection) {
        case "messages": {
            const topic = /^\[(.+)\]$/.exec(d.subject ?? "")?.[1];
            return { ...base, type: topic ? "interest" : "message", name: d.name, contact: d.email, detail: topic || d.subject || "", note: d.body };
        }
        case "quotes":
            return { ...base, type: "quote", name: d.name, contact: d.contact, detail: [d.type, d.location].filter(Boolean).join(" · "), note: d.message };
        case "investorLeads":
            return { ...base, type: "investor", name: d.name, contact: d.email, detail: [d.org, d.ticketSize].filter(Boolean).join(" · "), note: d.message };
        case "subscribers":
            return { ...base, type: "subscriber", name: d.name, contact: d.email, detail: [(d.interests ?? []).join(", "), d.download ? `download: ${d.download}` : ""].filter(Boolean).join(" · "), note: "" };
        default:
            return { ...base, type: "click", status: "", name: "", contact: "", detail: `${d.type}: ${d.target}`, clickType: d.type, note: "" };
    }
};

const count = (items, key, top = 8) => {
    const map = new Map();
    items.forEach((i) => {
        const k = typeof key === "function" ? key(i) : i[key];
        if (k) map.set(k, (map.get(k) ?? 0) + 1);
    });
    return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, top);
};

const startOfWeek = (date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); // Monday
    return d;
};

// ---------- CSV ----------
const cell = (v) => {
    let s = v == null ? "" : v instanceof Date ? v.toISOString() : String(v);
    if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`; // stop spreadsheets running a cell as a formula
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const download = (rows, name) => {
    const csv = "﻿" + rows.map((r) => r.map(cell).join(",")).join("\r\n"); // BOM so Excel reads UTF-8
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
};
const today = () => new Date().toISOString().slice(0, 10);

const when = (d) => d.toLocaleString("en-UG", { dateStyle: "medium", timeStyle: "short" });

export const LeadsPanel = () => {
    const messages = useCollection("messages", (fs, ref) => recent(fs, ref, 500));
    const quotes = useCollection("quotes", (fs, ref) => recent(fs, ref, 500));
    const investors = useCollection("investorLeads", (fs, ref) => recent(fs, ref, 500));
    const subscribers = useCollection("subscribers", (fs, ref) => recent(fs, ref, 500));
    const clicks = useCollection("clicks", (fs, ref) => recent(fs, ref, 1000));
    const sources = [messages, quotes, investors, subscribers, clicks];
    const loading = sources.some((s) => s.loading);
    const errors = sources.map((s) => s.error).filter(Boolean);

    const [type, setType] = useState("leads");
    const [source, setSource] = useState("all");
    const [status, setStatusFilter] = useState("all");
    const [range, setRange] = useState("30");
    const [q, setQ] = useState("");
    const [saveError, setSaveError] = useState(null);

    const all = useMemo(
        () =>
            [
                ...messages.docs.map((d) => normalise("messages", d)),
                ...quotes.docs.map((d) => normalise("quotes", d)),
                ...investors.docs.map((d) => normalise("investorLeads", d)),
                ...subscribers.docs.map((d) => normalise("subscribers", d)),
                ...clicks.docs.map((d) => normalise("clicks", d)),
            ].sort((a, b) => b.createdAt - a.createdAt),
        [messages.docs, quotes.docs, investors.docs, subscribers.docs, clicks.docs]
    );
    const leads = useMemo(() => all.filter((l) => l.type !== "click"), [all]);
    const clickList = useMemo(() => all.filter((l) => l.type === "click"), [all]);

    const sourceOptions = useMemo(() => count(all, "source", 50).map(([s]) => s), [all]);

    const filtered = useMemo(() => {
        const since = range === "all" ? 0 : Date.now() - Number(range) * DAY;
        const text = q.trim().toLowerCase();
        return all.filter((l) => {
            if (type === "leads" ? l.type === "click" : l.type !== type) return false;
            if (source !== "all" && l.source !== source) return false;
            if (status !== "all" && l.status !== status) return false;
            if (l.createdAt.getTime() < since) return false;
            if (text && ![l.name, l.contact, l.detail, l.note, l.source, l.campaign, l.page].some((v) => String(v ?? "").toLowerCase().includes(text))) return false;
            return true;
        });
    }, [all, type, source, status, range, q]);

    // ---------- KPIs ----------
    const now = Date.now();
    const inDays = (list, from, to = 0) => list.filter((l) => l.createdAt.getTime() >= now - from * DAY && l.createdAt.getTime() < now - to * DAY).length;
    const thisWeek = inDays(leads, 7);
    const lastWeek = inDays(leads, 14, 7);
    const subs = leads.filter((l) => l.type === "subscriber");
    const quotes30 = inDays(leads.filter((l) => l.type === "quote"), 30);
    const clicks7 = inDays(clickList, 7);
    const clickTypes = count(clickList.filter((l) => l.createdAt.getTime() >= now - 7 * DAY), "clickType", 5);

    // ---------- charts (leads only, not clicks) ----------
    const chartBase = filtered.filter((l) => l.type !== "click");
    const weeks = useMemo(() => {
        const start = startOfWeek(new Date());
        const out = [];
        for (let i = 11; i >= 0; i--) {
            const from = new Date(start);
            from.setDate(from.getDate() - i * 7);
            const to = new Date(from);
            to.setDate(to.getDate() + 7);
            const n = leads.filter((l) => (type === "leads" || type === "click" || l.type === type) && l.createdAt >= from && l.createdAt < to).length;
            out.push([from.toLocaleDateString("en-UG", { day: "numeric", month: "short" }), n]);
        }
        return out;
    }, [leads, type]);
    const bySource = count(chartBase, "source");
    const byPage = count(chartBase, "page");
    const byCampaign = count(chartBase, "campaign");
    const weeksTotal = weeks.reduce((s, [, n]) => s + n, 0);
    const rangeLabel = RANGES.find(([v]) => v === range)?.[1].toLowerCase();

    const change = async (lead, value) => {
        setSaveError(null);
        try {
            await setStatus(lead.collection, lead.id, value);
        } catch (e) {
            setSaveError(e.code === "permission-denied" ? "This account can't change lead status (admin or marketing role needed)." : e.message);
        }
    };

    const exportLeads = () =>
        download(
            [
                ["Received", "Type", "Detail", "Name", "Contact", "Status", "Source", "Medium", "Campaign", "First source", "First campaign", "Landing page", "Sent from page", "Message", "Collection", "Id"],
                ...filtered.map((l) => [l.createdAt, TYPE_LABEL[l.type] ?? l.type, l.detail, l.name, l.contact, l.status, l.source, l.medium, l.campaign, l.firstSource, l.firstCampaign, l.landing, l.page, l.note, l.collection, l.id]),
            ],
            `formcraft-leads-${today()}.csv`
        );
    const exportSubscribers = () =>
        download(
            [
                ["Subscribed", "Email", "Name", "Interests", "Download", "Consent", "Status", "Source", "Campaign", "First source", "Sent from page"],
                ...subscribers.docs.map((d) => {
                    const t = touch(d.source);
                    return [toDate(d.createdAt), d.email, d.name, (d.interests ?? []).join("; "), d.download, d.consent ? "yes" : "no", d.status || "new", t.source, t.campaign, t.firstSource, d.page];
                }),
            ],
            `formcraft-subscribers-${today()}.csv`
        );

    return (
        <div className="stack leads" style={{ "--gap": "22px" }}>
            <div className="between" style={{ alignItems: "center" }}>
                <div className="stack" style={{ "--gap": "4px" }}>
                    <h3 className="h3">Leads</h3>
                    <p className="small">Everything people sent through the site, and where they came from. Tag your social links with the Link builder so “source” and “campaign” fill in.</p>
                </div>
                <div className="row" style={{ "--gap": "8px" }}>
                    <button type="button" className="btn btn-ink btn-sm" onClick={exportLeads} disabled={filtered.length === 0}>Download CSV ({filtered.length})</button>
                    <button type="button" className="btn btn-line btn-sm" onClick={exportSubscribers} disabled={subscribers.docs.length === 0}>All subscribers CSV</button>
                </div>
            </div>

            {errors.length > 0 && <p className="alert alert-error" role="alert">Couldn't load some lists: {errors[0].message}</p>}
            {saveError && <p className="alert alert-error" role="alert">{saveError}</p>}

            <div className="kpis leads-kpis">
                <div>
                    <span className="fine">Leads, last 7 days</span>
                    <strong className="num">{loading ? "…" : thisWeek}</strong>
                    <span className="small">{loading ? "" : `${lastWeek} the 7 days before${lastWeek || thisWeek ? ` (${thisWeek >= lastWeek ? "+" : "−"}${Math.abs(thisWeek - lastWeek)})` : ""}`}</span>
                </div>
                <div>
                    <span className="fine">Email subscribers</span>
                    <strong className="num">{loading ? "…" : subs.length}</strong>
                    <span className="small">{loading ? "" : `${inDays(subs, 7)} new this week`}</span>
                </div>
                <div>
                    <span className="fine">Quote requests, 30 days</span>
                    <strong className="num">{loading ? "…" : quotes30}</strong>
                    <span className="small">{loading ? "" : `${leads.filter((l) => l.type === "quote" && l.status === "new").length} still marked new`}</span>
                </div>
                <div>
                    <span className="fine">Contact clicks, 7 days</span>
                    <strong className="num">{loading ? "…" : clicks7}</strong>
                    <span className="small">{loading ? "" : clickTypes.map(([t, n]) => `${t} ${n}`).join(" · ") || "Phone, WhatsApp, email and socials"}</span>
                </div>
            </div>

            <fieldset className="leads-filters">
                <legend className="sr-only">Filter leads</legend>
                <div className="field">
                    <label htmlFor="lf-type">Type</label>
                    <select id="lf-type" value={type} onChange={(e) => setType(e.target.value)}>
                        {TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                </div>
                <div className="field">
                    <label htmlFor="lf-source">Source</label>
                    <select id="lf-source" value={source} onChange={(e) => setSource(e.target.value)}>
                        <option value="all">All sources</option>
                        {sourceOptions.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
                <div className="field">
                    <label htmlFor="lf-status">Status</label>
                    <select id="lf-status" value={status} onChange={(e) => setStatusFilter(e.target.value)}>
                        <option value="all">Any status</option>
                        {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
                <div className="field">
                    <label htmlFor="lf-range">Dates</label>
                    <select id="lf-range" value={range} onChange={(e) => setRange(e.target.value)}>
                        {RANGES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                </div>
                <div className="field leads-search">
                    <label htmlFor="lf-q">Search</label>
                    <input id="lf-q" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name, email, campaign, page…" />
                </div>
            </fieldset>

            <div className="leads-charts">
                <WeekBars
                    title="Leads per week"
                    rows={weeks}
                    summary={`${weeksTotal} ${type === "leads" || type === "click" ? "leads" : TYPE_LABEL[type].toLowerCase()} in the last 12 weeks; ${weeks[11]?.[1] ?? 0} so far this week.`}
                />
                <RankBars
                    title="Leads by source"
                    rows={bySource}
                    summary={bySource.length ? `Most leads ${rangeLabel} came from ${bySource[0][0]} (${bySource[0][1]}).` : `No leads ${rangeLabel}.`}
                />
                <RankBars
                    title="Leads by page"
                    rows={byPage}
                    summary={byPage.length ? `${byPage[0][0]} brought the most leads ${rangeLabel} (${byPage[0][1]}).` : `No leads ${rangeLabel}.`}
                />
                <RankBars
                    title="Leads by campaign"
                    rows={byCampaign}
                    summary={byCampaign.length ? `Top campaign ${rangeLabel}: ${byCampaign[0][0]} (${byCampaign[0][1]}). Leads without a tagged link aren't counted here.` : "No tagged campaign has brought a lead in this range yet. Use the Link builder to tag posts."}
                />
            </div>

            {loading ? (
                <div className="skeleton" style={{ height: 200 }} />
            ) : filtered.length === 0 ? (
                <p className="card card-pad small">Nothing matches these filters.</p>
            ) : (
                <div className="table-wrap card" role="region" aria-label="Leads" tabIndex={0}>
                    <table className="table admin-table leads-table">
                        <thead>
                            <tr>
                                <th scope="col">Received</th>
                                <th scope="col">Type</th>
                                <th scope="col">Who</th>
                                <th scope="col">About</th>
                                <th scope="col">Source</th>
                                <th scope="col">Page</th>
                                <th scope="col">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.slice(0, 300).map((l) => (
                                <tr key={`${l.collection}-${l.id}`}>
                                    <td className="fine">{when(l.createdAt)}</td>
                                    <td><span className="tag">{TYPE_LABEL[l.type]}</span></td>
                                    <td>
                                        <span className="admin-cell">{l.name || "—"}</span>
                                        {l.contact && <span className="fine leads-contact">{l.contact}</span>}
                                    </td>
                                    <td>
                                        <span className="admin-cell">{l.detail || "—"}</span>
                                        {l.note && (
                                            <details className="leads-note">
                                                <summary className="fine">Message</summary>
                                                <span className="admin-cell small">{l.note}</span>
                                            </details>
                                        )}
                                    </td>
                                    <td>
                                        <span className="admin-cell">{l.source}</span>
                                        {l.campaign && <span className="fine leads-contact">{l.campaign}</span>}
                                    </td>
                                    <td className="fine">{l.page || "—"}</td>
                                    <td>
                                        {l.type === "click" ? (
                                            <span className="fine">—</span>
                                        ) : (
                                            <>
                                                <label className="sr-only" htmlFor={`ls-${l.collection}-${l.id}`}>Status for {l.name || l.contact || "this lead"}</label>
                                                <select id={`ls-${l.collection}-${l.id}`} className="admin-status" value={l.status} onChange={(e) => change(l, e.target.value)}>
                                                    {(STATUSES.includes(l.status) ? STATUSES : [l.status, ...STATUSES]).map((s) => <option key={s} value={s}>{s}</option>)}
                                                </select>
                                            </>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filtered.length > 300 && <p className="fine leads-more">Showing the newest 300 of {filtered.length}. The CSV has them all.</p>}
                </div>
            )}
        </div>
    );
};
