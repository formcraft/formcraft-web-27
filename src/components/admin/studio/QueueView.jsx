import { useMemo, useState } from "react";
import { useCollection } from "../../../hooks/useCollection";
import { channelLabel, openUrlOf, platformOf } from "../../../data/socialPlatforms";
import { addDays, captionFor, dayKey, enabledChannelIds, formatDay, markPosted, rangeQuery, startOfWeek, timeKey, todayKey } from "../../../lib/studio";
import { CopyButton } from "./CopyButton";
import { StatusTag } from "./StatusTag";

// The manual publishing mode: approved posts due today or this week, one card per channel, with
// everything needed to post by hand — the picture, the channel's caption with its tracked link,
// a link to the platform, and "Mark as posted" with the live link.
const download = async (m) => {
    try {
        const res = await fetch(m.url);
        if (!res.ok) throw new Error();
        const url = URL.createObjectURL(await res.blob());
        const a = document.createElement("a");
        a.href = url;
        a.download = m.name || "formcraft-post";
        document.body.append(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
        // Storage may not allow cross-origin downloads: open it so it can be saved from the browser
        window.open(m.url, "_blank", "noopener");
    }
};

export const QueueView = ({ studio }) => {
    const { channelsById, settings, user, openComposer } = studio;
    const [span, setSpan] = useState("today");
    const [urls, setUrls] = useState({});
    const [busy, setBusy] = useState(null);
    const [error, setError] = useState(null);
    const today = todayKey();
    const to = span === "today" ? today : addDays(startOfWeek(today), 6);
    const from = addDays(today, -7); // last week's unposted ones show as overdue
    const { docs, loading, error: loadError } = useCollection("socialPosts", rangeQuery(from, to), [from, to]);

    const cards = useMemo(() => {
        const out = [];
        docs.filter((p) => ["approved", "scheduled", "failed"].includes(p.status)).forEach((p) => {
            enabledChannelIds(p).forEach((cid) => {
                const r = p.results?.[cid];
                if (r?.status === "published") return;
                if (r?.bufferId && r.status === "scheduled") return; // Buffer is posting this one
                const c = channelsById[cid] ?? { id: cid, name: cid, platform: "other" };
                out.push({ key: `${p.id}-${cid}`, post: p, channel: c, day: dayKey(p.scheduledAt) });
            });
        });
        return out;
    }, [docs, channelsById]);

    const groups = [
        ["Overdue", cards.filter((c) => c.day < today)],
        ["Today", cards.filter((c) => c.day === today)],
        ...(span === "week" ? [["Later this week", cards.filter((c) => c.day > today)]] : []),
    ];

    const posted = async (card) => {
        setBusy(card.key);
        setError(null);
        try {
            await markPosted(card.post, card.channel.id, urls[card.key] ?? "", user);
        } catch (e) {
            setError(e.code === "permission-denied" ? "Firestore refused: only marketing can mark posts published." : e.message);
        } finally {
            setBusy(null);
        }
    };

    return (
        <div className="stack" style={{ "--gap": "16px" }}>
            <div className="between" style={{ alignItems: "center" }}>
                <p className="small">Approved posts waiting to go out. Post them by hand, then paste the live link.{settings.bufferConnected ? " Channels set to Buffer are sent automatically; they show here only if Buffer failed or hasn't sent them yet." : ""}</p>
                <div className="row" style={{ "--gap": "6px" }} role="group" aria-label="Show">
                    <button type="button" className="chip" aria-pressed={span === "today"} onClick={() => setSpan("today")}>Today</button>
                    <button type="button" className="chip" aria-pressed={span === "week"} onClick={() => setSpan("week")}>This week</button>
                </div>
            </div>
            {loadError && <p className="alert alert-error" role="alert">Couldn't load: {loadError.message}</p>}
            {error && <p className="alert alert-error" role="alert">{error}</p>}
            {loading && <div className="skeleton" style={{ height: 120 }} />}
            {!loading &&
                groups.map(([label, list]) =>
                    list.length === 0 ? (
                        label === "Today" && <p key={label} className="card card-pad small">Nothing due today.</p>
                    ) : (
                        <section key={label} className="stack" style={{ "--gap": "10px" }} aria-label={label}>
                            <h4 className="h4">{label} <span className="fine">({list.length})</span></h4>
                            <ul className="mkt-queue">
                                {list.map((card) => {
                                    const { post, channel } = card;
                                    const text = captionFor(post, channel, settings);
                                    const open = openUrlOf(channel);
                                    const media = post.media?.[0];
                                    const viaBuffer = channel.publish === "buffer" && settings.bufferConnected;
                                    return (
                                        <li key={card.key} className="card mkt-queue-card">
                                            {media ? (
                                                media.kind === "video" ? <video src={media.url} muted preload="metadata" className="mkt-queue-media" aria-label={media.name} /> : <img src={media.url} alt={media.name} className="mkt-queue-media" loading="lazy" />
                                            ) : (
                                                <div className="mkt-queue-media mkt-queue-empty">No picture</div>
                                            )}
                                            <div className="stack" style={{ "--gap": "8px" }}>
                                                <div className="row" style={{ "--gap": "8px" }}>
                                                    <strong>{channelLabel(channel)}</strong>
                                                    <span className="fine">{formatDay(card.day)} · {timeKey(post.scheduledAt)}</span>
                                                    <StatusTag status={post.status} />
                                                    {viaBuffer && <span className="tag">Buffer</span>}
                                                </div>
                                                <button type="button" className="admin-more" onClick={() => openComposer(post)}><strong>{post.title}</strong></button>
                                                {post.results?.[channel.id]?.error && <p className="alert alert-error">{post.results[channel.id].error}</p>}
                                                <p className="mkt-queue-text small">{text || "(no caption)"}</p>
                                                <div className="row" style={{ "--gap": "8px" }}>
                                                    {post.media?.map((m, i) => (
                                                        <button key={m.url} type="button" className="btn btn-line btn-sm" onClick={() => download(m)}>Download {post.media.length > 1 ? `#${i + 1}` : m.kind === "video" ? "video" : "image"}</button>
                                                    ))}
                                                    <CopyButton text={text} label="Copy caption" />
                                                    {open && <a className="btn btn-line btn-sm" href={open} target="_blank" rel="noreferrer">Open {platformOf(channel).label === "Other" ? channelLabel(channel) : platformOf(channel).label}</a>}
                                                </div>
                                                <div className="row" style={{ "--gap": "8px", alignItems: "flex-end" }}>
                                                    <div className="field" style={{ flex: "1 1 220px" }}>
                                                        <label htmlFor={`q-${card.key}`}>Live post link</label>
                                                        <input id={`q-${card.key}`} type="url" placeholder="https://" value={urls[card.key] ?? ""} onChange={(e) => setUrls({ ...urls, [card.key]: e.target.value })} />
                                                    </div>
                                                    <button type="button" className="btn btn-ink btn-sm" disabled={busy === card.key} onClick={() => posted(card)}>
                                                        {busy === card.key ? "Saving…" : "Mark as posted"}
                                                    </button>
                                                </div>
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        </section>
                    )
                )}
        </div>
    );
};
