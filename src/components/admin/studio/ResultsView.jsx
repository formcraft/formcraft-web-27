import { useEffect, useMemo, useState } from "react";
import { useCollection } from "../../../hooks/useCollection";
import { channelLabel } from "../../../data/socialPlatforms";
import { LEAD_COLLECTIONS, addDays, campaignOf, dayKey, downloadText, enabledChannelIds, fetchLeadsByCampaign, formatDay, rangeQuery, toCSV, todayKey } from "../../../lib/studio";

// Results per post: the live links, and the leads that arrived through the post's tracked link
// (the site stores `source` on every lead; we match utm_campaign, and utm_content = post id).
// Visits aren't stored in Firestore — they're in Analytics (only for visitors who accepted cookies).
export const ResultsView = ({ studio }) => {
    const { channelsById, settings } = studio;
    const [days, setDays] = useState(90);
    const today = todayKey();
    const from = addDays(today, -days);
    const { docs, loading, error } = useCollection("socialPosts", rangeQuery(from, today), [from, today]);
    const posts = useMemo(() => docs.filter((p) => p.status === "published" || Object.values(p.results ?? {}).some((r) => r?.url)).reverse(), [docs]);
    const campaigns = useMemo(() => [...new Set(posts.map((p) => campaignOf(p, settings)))].sort(), [posts, settings]);
    const [leads, setLeads] = useState({ leads: [], errors: {} });
    const [busy, setBusy] = useState(false);

    const key = campaigns.join("|");
    useEffect(() => {
        if (!campaigns.length) {
            setLeads({ leads: [], errors: {} });
            return undefined;
        }
        let cancelled = false;
        setBusy(true);
        fetchLeadsByCampaign(campaigns)
            .then((r) => !cancelled && setLeads(r))
            .catch((e) => !cancelled && setLeads({ leads: [], errors: { all: e.message } }))
            .finally(() => !cancelled && setBusy(false));
        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [key]);

    const forPost = (p) => {
        const c = campaignOf(p, settings);
        const all = leads.leads.filter((l) => l.source?.last?.campaign === c);
        const exact = all.filter((l) => l.source?.last?.content === p.id);
        const by = Object.fromEntries(Object.keys(LEAD_COLLECTIONS).map((k) => [k, all.filter((l) => l.collection === k).length]));
        return { campaign: c, all: all.length, exact: exact.length, by };
    };

    const exportCsv = () =>
        downloadText(
            `formcraft-social-results-${from}-to-${today}.csv`,
            toCSV([
                ["date", "title", "channels", "campaign", "liveLinks", "leadsCampaign", "leadsThisPost", ...Object.values(LEAD_COLLECTIONS)],
                ...posts.map((p) => {
                    const r = forPost(p);
                    return [dayKey(p.scheduledAt), p.title, enabledChannelIds(p).map((id) => channelLabel(channelsById[id] ?? { name: id })).join(";"), r.campaign, Object.values(p.results ?? {}).map((x) => x?.url).filter(Boolean).join(" "), r.all, r.exact, ...Object.keys(LEAD_COLLECTIONS).map((k) => r.by[k])];
                }),
            ])
        );

    const errs = Object.entries(leads.errors);

    return (
        <div className="stack" style={{ "--gap": "16px" }}>
            <div className="between" style={{ alignItems: "flex-end" }}>
                <div className="field">
                    <label htmlFor="res-days">Period</label>
                    <select id="res-days" value={days} onChange={(e) => setDays(Number(e.target.value))}>
                        <option value={30}>Last 30 days</option>
                        <option value={90}>Last 90 days</option>
                        <option value={365}>Last 12 months</option>
                    </select>
                </div>
                <button type="button" className="btn btn-line btn-sm" onClick={exportCsv} disabled={!posts.length}>Export CSV</button>
            </div>
            <p className="small">
                Leads are counted when a visitor’s last tagged link carried the post’s campaign (<code>utm_campaign</code>); “this post” means the exact post (<code>utm_content</code>). Visits are in Google
                Analytics → Traffic acquisition, filtered by campaign, for visitors who accepted cookies.
            </p>
            {error && <p className="alert alert-error" role="alert">Couldn't load posts: {error.message}</p>}
            {errs.length > 0 && <p className="alert" role="status">Some lists couldn’t be read: {errs.map(([k, v]) => `${LEAD_COLLECTIONS[k] ?? k} (${v})`).join(", ")}.</p>}
            {loading ? (
                <div className="skeleton" style={{ height: 160 }} />
            ) : posts.length === 0 ? (
                <p className="card card-pad small">No published posts in this period yet.</p>
            ) : (
                <div className="table-wrap card" role="region" aria-label="Results per post" tabIndex={0} aria-busy={busy}>
                    <table className="table admin-table">
                        <thead>
                            <tr><th scope="col">Date</th><th scope="col">Post</th><th scope="col">Live links</th><th scope="col">Campaign</th><th scope="col">Leads</th><th scope="col">Breakdown</th></tr>
                        </thead>
                        <tbody>
                            {posts.map((p) => {
                                const r = forPost(p);
                                return (
                                    <tr key={p.id}>
                                        <td className="fine">{formatDay(dayKey(p.scheduledAt))}</td>
                                        <td>{p.title}</td>
                                        <td className="fine">
                                            {Object.entries(p.results ?? {}).filter(([, x]) => x?.url).map(([cid, x]) => (
                                                <div key={cid}><a className="link" href={x.url} target="_blank" rel="noreferrer">{channelLabel(channelsById[cid] ?? { name: cid })}</a></div>
                                            ))}
                                            {Object.entries(p.results ?? {}).filter(([, x]) => x?.error).map(([cid, x]) => (
                                                <div key={cid} className="studio-over">{channelLabel(channelsById[cid] ?? { name: cid })}: {x.error}</div>
                                            ))}
                                        </td>
                                        <td><code className="fine">{r.campaign}</code></td>
                                        <td>{busy ? "…" : <><strong>{r.all}</strong>{r.all ? <span className="fine"> ({r.exact} this post)</span> : null}</>}</td>
                                        <td className="fine">{Object.entries(r.by).filter(([, n]) => n).map(([k, n]) => `${LEAD_COLLECTIONS[k]} ${n}`).join(" · ") || "—"}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};
