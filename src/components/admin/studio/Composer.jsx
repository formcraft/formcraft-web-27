import { useEffect, useMemo, useState } from "react";
import { Drawer } from "../../ui/Drawer";
import { PILLARS } from "../../../data/socialTopics";
import { PREP_NOTE, occasionDate } from "../../../data/occasions";
import { FORMATS, captionLimitOf, channelLabel, defaultFormatOf, openUrlOf, platformOf, sizesFor } from "../../../data/socialPlatforms";
import {
    EDITOR_STATUSES,
    addDays,
    campaignOf,
    canEditPost,
    captionFor,
    countChars,
    dayKey,
    deletePost,
    enabledChannelIds,
    formatDay,
    fromEat,
    looksPromotional,
    markPosted,
    newPostId,
    ratioFits,
    savePost,
    timeKey,
    todayKey,
    trackedUrl,
    uploadMedia,
} from "../../../lib/studio";
import { StatusTag } from "./StatusTag";
import { CopyButton } from "./CopyButton";

// Write or edit one post: caption with per-channel overrides and live counters, tracked link,
// media, Kampala date/time, the linked occasion's care notes (all ticked before approval) and the
// status actions the signed-in role may take.
const blank = (studio, draft = {}) => {
    const topic = draft.topicId ? studio.topicsById[draft.topicId] : null;
    const channels = studio.activeChannels;
    return {
        title: draft.title ?? topic?.idea ?? "",
        pillar: draft.pillar ?? topic?.pillar ?? "",
        topicId: draft.topicId ?? null,
        occasionId: draft.occasionId ?? null,
        occasionYear: null,
        templateCode: "",
        caption: "",
        hashtags: "",
        link: "",
        campaign: "",
        perChannel: Object.fromEntries(channels.map((c) => [c.id, { enabled: true, caption: "", format: (topic?.formats ?? []).find((f) => platformOf(c).formats.includes(f)) ?? defaultFormatOf(c) }])),
        media: [],
        status: "draft",
        notes: topic?.notes ?? "",
        careChecked: [],
        confirmDate: false,
        results: {},
    };
};

export const Composer = ({ studio, post, draft, onClose }) => {
    const { channels, channelsById, occasions, occasionsById, topics, settings, isMarketing, user } = studio;
    const isNew = !post;
    const [id, setId] = useState(post?.id ?? null);
    const [form, setForm] = useState(() => (post ? { ...blank(studio), ...post, perChannel: { ...(post.perChannel ?? {}) } } : blank(studio, draft)));
    const [day, setDay] = useState(post ? dayKey(post.scheduledAt) : draft?.day ?? "");
    const [time, setTime] = useState(post ? timeKey(post.scheduledAt) || settings.defaultTime : settings.defaultTime);
    const [busy, setBusy] = useState(false);
    const [note, setNote] = useState(null);
    const [liveUrls, setLiveUrls] = useState({});
    const editable = canEditPost(post ?? form, isMarketing);

    useEffect(() => {
        if (!id) newPostId().then(setId).catch(() => {});
    }, [id]);

    const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
    const setChannel = (cid, patch) => setForm((f) => ({ ...f, perChannel: { ...f.perChannel, [cid]: { ...(f.perChannel[cid] ?? { enabled: false, caption: "", format: defaultFormatOf(channelsById[cid]) }), ...patch } } }));

    const postNow = { ...form, id };
    const occasion = form.occasionId ? occasionsById[form.occasionId] : null;
    const care = occasion?.careNotes ?? [];
    const careDone = care.every((n) => form.careChecked?.includes(n));
    const enabled = enabledChannelIds(form);
    // channels shown: active ones plus any already on this post
    const shownChannels = channels.filter((c) => c.active !== false || form.perChannel[c.id]);
    const pillars = [...new Set([...PILLARS, ...topics.map((t) => t.pillar).filter(Boolean)])];
    const pillarTopics = topics.filter((t) => t.active !== false && (!form.pillar || t.pillar === form.pillar));
    const promoWarning = care.some((n) => /promotion/i.test(n)) && [form.caption, ...Object.values(form.perChannel).map((c) => c?.caption)].some(looksPromotional);

    const counters = useMemo(
        () =>
            enabled.map((cid) => {
                const c = channelsById[cid];
                const limit = captionLimitOf(c);
                const n = countChars(captionFor(postNow, c, settings), c);
                return { cid, c, limit, n, over: Boolean(limit && n > limit) };
            }),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [form, id, settings]
    );

    const pickOccasion = (oid) => {
        const o = occasionsById[oid];
        setForm((f) => ({
            ...f,
            occasionId: oid || null,
            occasionYear: o ? Number((day || todayKey()).slice(0, 4)) : null,
            templateCode: o?.templateCode || f.templateCode,
            title: f.title || o?.name || "",
            caption: f.caption || o?.postAngle || "",
            careChecked: [],
        }));
        if (o && !day) {
            const { date } = occasionDate(o, Number(todayKey().slice(0, 4)));
            const next = date && date >= todayKey() ? date : occasionDate(o, Number(todayKey().slice(0, 4)) + 1).date;
            if (next) setDay(next);
        }
    };

    const pickTopic = (tid) => {
        const t = studio.topicsById[tid];
        setForm((f) => ({ ...f, topicId: tid || null, pillar: t?.pillar ?? f.pillar, title: f.title || t?.idea || "", notes: f.notes || t?.notes || "" }));
    };

    const onFiles = async (e) => {
        const files = [...e.target.files];
        e.target.value = "";
        if (!files.length || !id) return;
        setBusy(true);
        setNote(null);
        try {
            const added = [];
            for (const file of files) added.push(await uploadMedia(id, file));
            set("media", [...(form.media ?? []), ...added]);
        } catch (err) {
            setNote({ ok: false, text: err.code === "storage/unauthorized" ? "Storage refused the upload (team role not active yet)." : err.message });
        } finally {
            setBusy(false);
        }
    };

    const save = async (status, extra = {}) => {
        if (!id) return;
        setBusy(true);
        setNote(null);
        try {
            if (!form.title.trim()) throw new Error("Give the post a title.");
            if (!isMarketing && !EDITOR_STATUSES.includes(status)) throw new Error("Only marketing can approve or publish.");
            if (status === "approved") {
                if (!day) throw new Error("Set a date before approving.");
                if (!enabled.length) throw new Error("Pick at least one channel.");
                if (!careDone) throw new Error("Tick every care note first.");
                const over = counters.filter((c) => c.over);
                if (over.length && !window.confirm(`Over the limit on ${over.map((o) => channelLabel(o.c)).join(", ")}. Approve anyway?`)) return;
            }
            const { results: _r, id: _i, createdAt: _c, updatedAt: _u, scheduledAt: _s, ...data } = form;
            await savePost(id, { ...data, ...extra, results: form.results, status, scheduledAt: day ? fromEat(day, time) : null, occasionYear: form.occasionId ? Number((day || todayKey()).slice(0, 4)) : null }, user, { isNew: isNew && !post });
            onClose();
        } catch (err) {
            setNote({ ok: false, text: err.code === "permission-denied" ? "Firestore refused: your role can't make this change." : err.message });
        } finally {
            setBusy(false);
        }
    };

    const remove = async () => {
        if (!post || !window.confirm(`Delete “${form.title || "this post"}”? This can't be undone. To keep it but not post it, choose Skip.`)) return;
        setBusy(true);
        try {
            await deletePost(post.id);
            onClose();
        } catch (err) {
            setNote({ ok: false, text: err.message });
            setBusy(false);
        }
    };

    const posted = async (cid) => {
        if (!post) return;
        setBusy(true);
        try {
            await markPosted({ ...post, perChannel: form.perChannel }, cid, liveUrls[cid] ?? "", user);
            setNote({ ok: true, text: `Marked as posted on ${channelLabel(channelsById[cid])}.` });
        } catch (err) {
            setNote({ ok: false, text: err.message });
        } finally {
            setBusy(false);
        }
    };

    const status = post?.status ?? form.status;
    const field = (key, label, props = {}) => (
        <div className="field">
            <label htmlFor={`cmp-${key}`}>{label}</label>
            <input id={`cmp-${key}`} value={form[key] ?? ""} onChange={(e) => set(key, e.target.value)} disabled={!editable} {...props} />
        </div>
    );

    const footer = (
        <div className="stack" style={{ "--gap": "10px" }}>
            {note && <p className={`alert ${note.ok ? "" : "alert-error"}`} role={note.ok ? "status" : "alert"}>{note.text}</p>}
            {editable ? (
                <div className="row" style={{ "--gap": "8px" }}>
                    <button type="button" className="btn btn-line btn-sm" disabled={busy || !id} onClick={() => save(EDITOR_STATUSES.includes(status) ? (status === "review" ? "draft" : status) : status)}>
                        {busy ? "Saving…" : EDITOR_STATUSES.includes(status) ? "Save draft" : "Save"}
                    </button>
                    {EDITOR_STATUSES.includes(status) && status !== "review" && (
                        <button type="button" className="btn btn-ink btn-sm" disabled={busy || !id} onClick={() => save("review")}>Send for review</button>
                    )}
                    {isMarketing && !["approved", "scheduled", "published"].includes(status) && (
                        <button type="button" className="btn btn-primary btn-sm" disabled={busy || !id || !careDone} onClick={() => save("approved")} title={careDone ? "" : "Tick every care note first"}>
                            Approve
                        </button>
                    )}
                    {isMarketing && status === "approved" && (
                        <button type="button" className="btn btn-line btn-sm" disabled={busy} onClick={() => save("scheduled")} title="Use when you've scheduled it in the platform's own scheduler">Mark scheduled</button>
                    )}
                    {isMarketing && ["approved", "scheduled", "failed"].includes(status) && (
                        <button type="button" className="btn btn-line btn-sm" disabled={busy} onClick={() => save("draft")}>Back to draft</button>
                    )}
                    {isMarketing && status !== "skipped" && post && (
                        <button type="button" className="btn btn-line btn-sm" disabled={busy} onClick={() => save("skipped")}>Skip</button>
                    )}
                    {isMarketing && post && <button type="button" className="btn btn-line btn-sm" disabled={busy} onClick={remove}>Delete</button>}
                </div>
            ) : (
                <p className="small">This post is {status}; only marketing can change it now.</p>
            )}
        </div>
    );

    return (
        <Drawer open onClose={onClose} title={isNew ? "New post" : "Edit post"} footer={footer} labelledBy="mkt-composer-title">
            <form className="form mkt-composer" onSubmit={(e) => e.preventDefault()} aria-label="Post">
                <div className="row" style={{ "--gap": "8px" }}>
                    <StatusTag status={status} />
                    {form.confirmDate && <span className="mkt-flag">Confirm the date before posting</span>}
                    {post?.approvedBy && <span className="fine">Approved by {post.approvedBy}</span>}
                </div>

                {field("title", "Title (for the team) *", { required: true })}

                <div className="form-row">
                    <div className="field">
                        <label htmlFor="cmp-pillar">Pillar</label>
                        <select id="cmp-pillar" value={form.pillar ?? ""} onChange={(e) => set("pillar", e.target.value)} disabled={!editable}>
                            <option value="">—</option>
                            {pillars.map((p) => <option key={p} value={p}>{p}</option>)}
                        </select>
                    </div>
                    <div className="field">
                        <label htmlFor="cmp-topic">Topic idea</label>
                        <select id="cmp-topic" value={form.topicId ?? ""} onChange={(e) => pickTopic(e.target.value)} disabled={!editable}>
                            <option value="">—</option>
                            {pillarTopics.map((t) => <option key={t.id} value={t.id}>{t.idea.slice(0, 80)}{t.uses ? ` (used ${t.uses}×)` : ""}</option>)}
                        </select>
                    </div>
                </div>

                <div className="form-row">
                    <div className="field">
                        <label htmlFor="cmp-occasion">Occasion</label>
                        <select id="cmp-occasion" value={form.occasionId ?? ""} onChange={(e) => pickOccasion(e.target.value)} disabled={!editable}>
                            <option value="">None</option>
                            {occasions.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
                        </select>
                    </div>
                    {field("templateCode", "Template code", { placeholder: "e.g. FMC-MKT-HOL-10-09" })}
                </div>
                {occasion && (
                    <div className="card card-pad stack mkt-occasion" style={{ "--gap": "8px" }}>
                        <p className="small"><strong>Angle:</strong> {occasion.postAngle || "—"}{occasion.ribbonColour ? ` · Ribbon: ${occasion.ribbonColour}` : ""}</p>
                        <p className="fine">{PREP_NOTE}{day ? ` Prepare by ${formatDay(addDays(day, -3))}.` : ""}</p>
                        {care.length > 0 && (
                            <fieldset className="mkt-care">
                                <legend className="label">Care notes — tick each before approval</legend>
                                {care.map((n, i) => (
                                    <label key={i} className="admin-check mkt-care-item">
                                        <input
                                            type="checkbox"
                                            checked={form.careChecked?.includes(n) ?? false}
                                            disabled={!editable}
                                            onChange={(e) => set("careChecked", e.target.checked ? [...(form.careChecked ?? []), n] : (form.careChecked ?? []).filter((x) => x !== n))}
                                        />
                                        <span>{n}</span>
                                    </label>
                                ))}
                            </fieldset>
                        )}
                        {promoWarning && <p className="alert alert-error" role="alert">The caption looks promotional (price, offer, “shop now”…). This occasion carries no promotions.</p>}
                    </div>
                )}

                <div className="form-row">
                    <div className="field">
                        <label htmlFor="cmp-day">Date (Kampala)</label>
                        <input id="cmp-day" type="date" value={day} onChange={(e) => setDay(e.target.value)} disabled={!editable} />
                    </div>
                    <div className="field">
                        <label htmlFor="cmp-time">Time (EAT)</label>
                        <input id="cmp-time" type="time" value={time} onChange={(e) => setTime(e.target.value)} disabled={!editable} />
                    </div>
                </div>

                <div className="field">
                    <label htmlFor="cmp-caption">Caption</label>
                    <textarea id="cmp-caption" rows={6} value={form.caption ?? ""} onChange={(e) => set("caption", e.target.value)} disabled={!editable} aria-describedby="cmp-counters" />
                    <ul className="mkt-counters" id="cmp-counters" aria-live="polite">
                        {counters.map(({ cid, c, n, limit, over }) => (
                            <li key={cid} className={over ? "mkt-over" : ""}>
                                {channelLabel(c)}: {n}{limit ? ` / ${limit}` : ""}{over ? " — over the limit" : ""}
                            </li>
                        ))}
                    </ul>
                    <span className="hint">Counts include the hashtags and the tracked link{enabled.some((cid) => channelsById[cid]?.platform === "x") ? " (X counts a link as 23)" : ""}.</span>
                </div>

                <div className="field">
                    <label htmlFor="cmp-hashtags">Hashtags</label>
                    <input id="cmp-hashtags" value={form.hashtags ?? ""} onChange={(e) => set("hashtags", e.target.value)} disabled={!editable} placeholder="#Formcraft #Kampala" aria-describedby="cmp-tag-advice" />
                    <ul className="hint mkt-advice" id="cmp-tag-advice">
                        {[...new Set(enabled.map((cid) => channelsById[cid]?.platform))].filter(Boolean).map((p) => {
                            const pl = platformOf({ platform: p });
                            return pl.hashtags ? <li key={p}>{pl.label}: {pl.hashtags}</li> : null;
                        })}
                    </ul>
                </div>

                <div className="form-row">
                    {field("link", "Link (a site path like /studio, or a full URL)", { placeholder: "/templates" })}
                    {field("campaign", "Campaign (optional)", { placeholder: campaignOf(postNow, settings) })}
                </div>
                {form.link && enabled.length > 0 && (
                    <ul className="mkt-links">
                        {enabled.map((cid) => {
                            const url = trackedUrl(postNow, channelsById[cid], settings);
                            return (
                                <li key={cid}>
                                    <span className="fine">{channelLabel(channelsById[cid])}</span>
                                    <code className="mkt-url">{url}</code>
                                    <CopyButton text={url} label="Copy link" className="btn btn-line btn-sm" />
                                </li>
                            );
                        })}
                    </ul>
                )}

                <fieldset className="mkt-channels">
                    <legend className="label">Channels</legend>
                    {shownChannels.length === 0 && <p className="small">No channels yet.</p>}
                    {shownChannels.map((c) => {
                        const pc = form.perChannel[c.id] ?? { enabled: false, caption: "", format: defaultFormatOf(c) };
                        const counter = counters.find((x) => x.cid === c.id);
                        const sizes = sizesFor(c, pc.format);
                        return (
                            <div key={c.id} className={`mkt-channel ${pc.enabled ? "" : "mkt-channel-off"}`}>
                                <div className="row" style={{ "--gap": "10px" }}>
                                    <label className="admin-check">
                                        <input type="checkbox" checked={Boolean(pc.enabled)} onChange={(e) => setChannel(c.id, { enabled: e.target.checked })} disabled={!editable} />
                                        <span>{channelLabel(c)}{c.handle ? ` · @${c.handle.replace(/^@/, "")}` : ""}</span>
                                    </label>
                                    {pc.enabled && (
                                        <div className="field mkt-inline">
                                            <label htmlFor={`fmt-${c.id}`} className="sr-only">Format on {channelLabel(c)}</label>
                                            <select id={`fmt-${c.id}`} value={pc.format} onChange={(e) => setChannel(c.id, { format: e.target.value })} disabled={!editable}>
                                                {platformOf(c).formats.map((f) => <option key={f} value={f}>{FORMATS[f]}</option>)}
                                            </select>
                                        </div>
                                    )}
                                    {c.publish === "buffer" && <span className="tag">Buffer</span>}
                                </div>
                                {pc.enabled && (
                                    <>
                                        {sizes.length > 0 && <p className="fine">Recommended: {sizes.map(([w, h]) => `${w} × ${h}`).join(" or ")}</p>}
                                        <details>
                                            <summary className="small">Own caption for {channelLabel(c)}{pc.caption ? " (set)" : ""}</summary>
                                            <div className="field">
                                                <label htmlFor={`cap-${c.id}`}>Caption on {channelLabel(c)} (leave empty to use the main one)</label>
                                                <textarea id={`cap-${c.id}`} rows={4} value={pc.caption ?? ""} onChange={(e) => setChannel(c.id, { caption: e.target.value })} disabled={!editable} />
                                                {counter && <span className={`hint ${counter.over ? "mkt-over" : ""}`}>{counter.n}{counter.limit ? ` / ${counter.limit}` : ""} characters</span>}
                                            </div>
                                        </details>
                                        {post && isMarketing && ["approved", "scheduled", "published", "failed"].includes(status) && (
                                            <div className="mkt-posted">
                                                {post.results?.[c.id]?.status === "published" ? (
                                                    <p className="small">Posted{post.results[c.id].url ? <> · <a className="link" href={post.results[c.id].url} target="_blank" rel="noreferrer">live post</a></> : ""}</p>
                                                ) : (
                                                    <div className="row" style={{ "--gap": "8px", alignItems: "flex-end" }}>
                                                        <div className="field" style={{ flex: "1 1 200px" }}>
                                                            <label htmlFor={`live-${c.id}`}>Live post link on {channelLabel(c)}</label>
                                                            <input id={`live-${c.id}`} type="url" value={liveUrls[c.id] ?? ""} onChange={(e) => setLiveUrls({ ...liveUrls, [c.id]: e.target.value })} placeholder="https://" />
                                                        </div>
                                                        {openUrlOf(c) && <a className="btn btn-line btn-sm" href={openUrlOf(c)} target="_blank" rel="noreferrer">Open {platformOf(c).label}</a>}
                                                        <button type="button" className="btn btn-ink btn-sm" disabled={busy} onClick={() => posted(c.id)}>Mark as posted</button>
                                                    </div>
                                                )}
                                                {post.results?.[c.id]?.error && <p className="alert alert-error">{post.results[c.id].error}</p>}
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        );
                    })}
                </fieldset>

                <fieldset className="mkt-media">
                    <legend className="label">Pictures and video</legend>
                    {(form.media ?? []).length > 0 && (
                        <ul className="mkt-thumbs">
                            {form.media.map((m, i) => {
                                const misfit = enabled.filter((cid) => !ratioFits(m, sizesFor(channelsById[cid], form.perChannel[cid]?.format)));
                                return (
                                    <li key={`${m.url}-${i}`} className="mkt-thumb">
                                        {m.kind === "video" ? <video src={m.url} muted preload="metadata" aria-label={m.name} /> : <img src={m.url} alt={m.name} loading="lazy" />}
                                        <span className="fine">{m.name}{m.width ? ` · ${m.width} × ${m.height}` : ""}</span>
                                        {misfit.length > 0 && <span className="fine mkt-over">Shape doesn’t match {misfit.map((cid) => channelLabel(channelsById[cid])).join(", ")}</span>}
                                        {editable && (
                                            <button type="button" className="btn btn-line btn-sm" onClick={() => set("media", form.media.filter((_, k) => k !== i))} aria-label={`Remove ${m.name}`}>Remove</button>
                                        )}
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                    {editable && (
                        <>
                            <label className="btn btn-line btn-sm admin-upload" htmlFor="cmp-files">{busy ? "Uploading…" : "Add pictures or video"}</label>
                            <input id="cmp-files" className="sr-only" type="file" accept="image/*,video/*" multiple onChange={onFiles} disabled={busy || !id} />
                            <span className="hint">Images up to 15 MB, video up to 100 MB. Stored publicly (Storage public/social/) so the platforms can fetch them.</span>
                        </>
                    )}
                </fieldset>

                <div className="field">
                    <label htmlFor="cmp-notes">Notes for the team</label>
                    <textarea id="cmp-notes" rows={3} value={form.notes ?? ""} onChange={(e) => set("notes", e.target.value)} disabled={!editable} />
                </div>
            </form>
        </Drawer>
    );
};
