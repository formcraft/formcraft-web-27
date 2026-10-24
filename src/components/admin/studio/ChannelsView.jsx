import { useState } from "react";
import { getFunctionsService } from "../../../config/firebase";
import { STARTER_CHANNELS } from "../../../data/socialChannels";
import { PLATFORMS, PLATFORM_KEYS, captionLimitOf, channelLabel, profileUrlOf } from "../../../data/socialPlatforms";
import { WEEKDAYS, importStarterDocs, removeDoc, saveDoc, saveStudioSettings, slug } from "../../../lib/studio";

// The channel list (any platform, growing without code changes), weekly targets and posting
// days, studio settings, and how Buffer publishing is connected.
const emptyChannel = { platform: "instagram", name: "", handle: "", url: "", active: true, publish: "manual", bufferChannelId: "", captionLimit: "", notes: "" };

const DayPicker = ({ id, label, value, onChange }) => (
    <fieldset className="mkt-checks" id={id}>
        <legend className="label">{label}</legend>
        {WEEKDAYS.map((w, i) => (
            <label key={w} className="chip">
                <input type="checkbox" checked={value.includes(i + 1)} onChange={(e) => onChange(e.target.checked ? [...value, i + 1].sort() : value.filter((d) => d !== i + 1))} />
                {w}
            </label>
        ))}
    </fieldset>
);

/** Studio → Channels: the social accounts the team posts to, with posting targets and the Buffer link. @param {{ studio: object }} props */
export const ChannelsView = ({ studio }) => {
    const { channels, settings } = studio;
    const [editing, setEditing] = useState(null); // { id, values }
    const [busy, setBusy] = useState(false);
    const [note, setNote] = useState(null);
    const [draftSettings, setDraftSettings] = useState(null);
    const [buffer, setBuffer] = useState(null);
    const s = draftSettings ?? settings;
    const missingStarters = STARTER_CHANNELS.filter((c) => !channels.some((x) => x.id === c.id));

    const run = async (fn, done) => {
        setBusy(true);
        setNote(null);
        try {
            const r = await fn();
            setNote({ ok: true, text: typeof done === "function" ? done(r) : done });
            return r;
        } catch (e) {
            setNote({ ok: false, text: e.code === "permission-denied" ? "Firestore refused: only marketing and admins can change channels and settings." : e.message });
            return null;
        } finally {
            setBusy(false);
        }
    };

    const saveChannel = (e) => {
        e.preventDefault();
        const v = editing.values;
        const id = editing.id || slug(v.name || PLATFORMS[v.platform]?.label || "channel") || undefined;
        if (!editing.id && channels.some((c) => c.id === id)) {
            setNote({ ok: false, text: `A channel with the id “${id}” exists already; give this one a different name.` });
            return;
        }
        const limit = Number(v.captionLimit);
        run(async () => {
            await saveDoc("socialChannels", id, {
                platform: v.platform,
                name: v.name.trim() || PLATFORMS[v.platform].label,
                handle: v.handle.trim().replace(/^@/, ""),
                url: v.url.trim(),
                active: Boolean(v.active),
                publish: v.publish === "buffer" ? "buffer" : "manual",
                bufferChannelId: v.bufferChannelId.trim(),
                captionLimit: Number.isFinite(limit) && limit > 0 ? Math.round(limit) : null,
                notes: v.notes.trim(),
            });
            setEditing(null);
        }, "Channel saved.");
    };

    const saveSettings = () =>
        run(async () => {
            const targets = Object.fromEntries(Object.entries(s.targets ?? {}).map(([k, v]) => [k, Math.max(0, Math.min(50, Math.round(Number(v) || 0)))]));
            await saveStudioSettings({
                targets,
                defaultTime: /^\d{2}:\d{2}$/.test(s.defaultTime) ? s.defaultTime : "07:30",
                timezone: "Africa/Kampala",
                postingDays: s.postingDays ?? [],
                channelDays: s.channelDays ?? {},
                campaignPrefix: slug(s.campaignPrefix ?? ""),
                bufferConnected: Boolean(s.bufferConnected),
            });
            setDraftSettings(null);
        }, "Settings saved.");

    const setS = (patch) => setDraftSettings({ ...s, ...patch });

    const loadBuffer = () =>
        run(async () => {
            const [functions, { httpsCallable }] = await Promise.all([getFunctionsService(), import("firebase/functions")]);
            const { data } = await httpsCallable(functions, "bufferChannels")();
            setBuffer(data?.channels ?? []);
            return data?.channels?.length ?? 0;
        }, (n) => `Buffer has ${n} channel${n === 1 ? "" : "s"}. Copy an id into a channel's “Buffer channel id”.`);

    if (editing) {
        const v = editing.values;
        const setV = (k, val) => setEditing({ ...editing, values: { ...v, [k]: val } });
        return (
            <form className="card card-pad form" onSubmit={saveChannel} aria-labelledby="ch-edit-title">
                <div className="between">
                    <h4 className="h4" id="ch-edit-title">{editing.id ? `Edit ${channelLabel(v)}` : "New channel"}</h4>
                    <button type="button" className="btn btn-line btn-sm" onClick={() => setEditing(null)}>Cancel</button>
                </div>
                <div className="form-row">
                    <div className="field">
                        <label htmlFor="ch-platform">Platform</label>
                        <select id="ch-platform" value={v.platform} onChange={(e) => setV("platform", e.target.value)}>
                            {PLATFORM_KEYS.map((k) => <option key={k} value={k}>{PLATFORMS[k].label}</option>)}
                        </select>
                    </div>
                    <div className="field">
                        <label htmlFor="ch-name">Name shown in the studio</label>
                        <input id="ch-name" value={v.name} onChange={(e) => setV("name", e.target.value)} placeholder={PLATFORMS[v.platform].label} required={v.platform === "other"} />
                    </div>
                </div>
                <div className="form-row">
                    <div className="field">
                        <label htmlFor="ch-handle">Handle (without @)</label>
                        <input id="ch-handle" value={v.handle} onChange={(e) => setV("handle", e.target.value)} />
                    </div>
                    <div className="field">
                        <label htmlFor="ch-url">Profile link</label>
                        <input id="ch-url" type="url" value={v.url} onChange={(e) => setV("url", e.target.value)} placeholder={profileUrlOf({ platform: v.platform, handle: v.handle }) ?? "https://"} />
                    </div>
                </div>
                <div className="form-row">
                    <div className="field">
                        <label htmlFor="ch-limit">Caption limit (characters)</label>
                        <input id="ch-limit" inputMode="numeric" value={v.captionLimit ?? ""} onChange={(e) => setV("captionLimit", e.target.value)} placeholder={String(PLATFORMS[v.platform].captionLimit ?? "none")} aria-describedby="ch-limit-hint" />
                        <span className="hint" id="ch-limit-hint">Leave empty to use the platform’s limit.</span>
                    </div>
                    <div className="field">
                        <label htmlFor="ch-publish">Publishing</label>
                        <select id="ch-publish" value={v.publish} onChange={(e) => setV("publish", e.target.value)}>
                            <option value="manual">By hand (Queue)</option>
                            <option value="buffer">Through Buffer</option>
                        </select>
                    </div>
                </div>
                {v.publish === "buffer" && (
                    <div className="field">
                        <label htmlFor="ch-buffer">Buffer channel id</label>
                        <input id="ch-buffer" value={v.bufferChannelId} onChange={(e) => setV("bufferChannelId", e.target.value)} />
                    </div>
                )}
                <div className="field">
                    <label htmlFor="ch-notes">Notes</label>
                    <textarea id="ch-notes" rows={2} value={v.notes} onChange={(e) => setV("notes", e.target.value)} />
                </div>
                <label className="admin-check">
                    <input type="checkbox" checked={Boolean(v.active)} onChange={(e) => setV("active", e.target.checked)} />
                    <span>Active (shown in the composer and used by Generate)</span>
                </label>
                {note && !note.ok && <p className="alert alert-error" role="alert">{note.text}</p>}
                <div className="row">
                    <button type="submit" className="btn btn-primary btn-sm" disabled={busy}>{busy ? "Saving…" : "Save channel"}</button>
                    {editing.id && (
                        <button
                            type="button"
                            className="btn btn-line btn-sm"
                            disabled={busy}
                            onClick={() => {
                                if (window.confirm(`Delete the channel “${channelLabel(v)}”? Posts keep their text but lose this channel. To pause it, untick Active instead.`))
                                    run(async () => {
                                        await removeDoc("socialChannels", editing.id);
                                        setEditing(null);
                                    }, "Channel deleted.");
                            }}
                        >
                            Delete
                        </button>
                    )}
                </div>
            </form>
        );
    }

    return (
        <div className="stack" style={{ "--gap": "18px" }}>
            {note && <p className={`alert ${note.ok ? "" : "alert-error"}`} role={note.ok ? "status" : "alert"}>{note.text}</p>}

            <div className="between" style={{ alignItems: "center" }}>
                <h4 className="h4">Channels</h4>
                <div className="row" style={{ "--gap": "8px" }}>
                    {missingStarters.length > 0 && (
                        <button type="button" className="btn btn-line btn-sm" disabled={busy} onClick={() => run(() => importStarterDocs("socialChannels", missingStarters, channels.map((c) => c.id)), (n) => `Imported ${n} starter channel${n === 1 ? "" : "s"}.`)}>
                            Import the starter channels ({missingStarters.length})
                        </button>
                    )}
                    <button type="button" className="btn btn-primary btn-sm" onClick={() => setEditing({ id: null, values: { ...emptyChannel } })}>Add channel</button>
                </div>
            </div>

            <div className="table-wrap card" role="region" aria-label="Channels and weekly targets" tabIndex={0}>
                <table className="table admin-table">
                    <thead>
                        <tr><th scope="col">Channel</th><th scope="col">Handle</th><th scope="col">Limit</th><th scope="col">Publishing</th><th scope="col">Posts / week</th><th scope="col">Own days</th><th scope="col"><span className="sr-only">Edit</span></th></tr>
                    </thead>
                    <tbody>
                        {channels.length === 0 && <tr><td colSpan={7} className="small">No channels yet.</td></tr>}
                        {channels.map((c) => {
                            const own = s.channelDays?.[c.id] ?? [];
                            return (
                                <tr key={c.id} className={c.active === false ? "mkt-row-off" : ""}>
                                    <td><strong>{channelLabel(c)}</strong>{c.active === false && <span className="fine"> · inactive</span>}{c.notes ? <div className="fine">{c.notes}</div> : null}</td>
                                    <td className="fine">{c.handle ? (profileUrlOf(c) ? <a className="link" href={profileUrlOf(c)} target="_blank" rel="noreferrer">@{c.handle}</a> : `@${c.handle}`) : "TODO"}</td>
                                    <td className="fine">{captionLimitOf(c) ?? "—"}</td>
                                    <td className="fine">{c.publish === "buffer" ? `Buffer${c.bufferChannelId ? "" : " (no id yet)"}` : "By hand"}</td>
                                    <td>
                                        <label className="sr-only" htmlFor={`tg-${c.id}`}>Posts per week on {channelLabel(c)}</label>
                                        <input id={`tg-${c.id}`} className="admin-status" inputMode="numeric" style={{ width: "4.5em" }} value={s.targets?.[c.id] ?? ""} placeholder="0" onChange={(e) => setS({ targets: { ...(s.targets ?? {}), [c.id]: e.target.value.replace(/\D/g, "") } })} />
                                    </td>
                                    <td>
                                        <details>
                                            <summary className="fine">{own.length ? own.map((d) => WEEKDAYS[d - 1]).join(" ") : "Usual days"}</summary>
                                            <DayPicker id={`days-${c.id}`} label={`Posting days for ${channelLabel(c)} (empty = usual days)`} value={own} onChange={(val) => setS({ channelDays: { ...(s.channelDays ?? {}), [c.id]: val } })} />
                                        </details>
                                    </td>
                                    <td><button type="button" className="btn btn-ink btn-sm" onClick={() => setEditing({ id: c.id, values: { ...emptyChannel, ...c, captionLimit: c.captionLimit ?? "" } })}>Edit</button></td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <div className="card card-pad form">
                <h4 className="h4">Studio settings</h4>
                <DayPicker id="days-global" label="Usual posting days" value={s.postingDays ?? []} onChange={(val) => setS({ postingDays: val })} />
                <div className="form-row">
                    <div className="field">
                        <label htmlFor="st-time">Default time (Kampala)</label>
                        <input id="st-time" type="time" value={s.defaultTime ?? "07:30"} onChange={(e) => setS({ defaultTime: e.target.value })} aria-describedby="st-time-hint" />
                        <span className="hint" id="st-time-hint">The register says 7–8 am for occasion posts.</span>
                    </div>
                    <div className="field">
                        <label htmlFor="st-prefix">Campaign prefix (optional)</label>
                        <input id="st-prefix" value={s.campaignPrefix ?? ""} onChange={(e) => setS({ campaignPrefix: e.target.value })} placeholder="e.g. fc" aria-describedby="st-prefix-hint" />
                        <span className="hint" id="st-prefix-hint">Added to utm_campaign on every tracked link.</span>
                    </div>
                </div>
                <label className="admin-check">
                    <input type="checkbox" checked={Boolean(s.bufferConnected)} onChange={(e) => setS({ bufferConnected: e.target.checked })} />
                    <span>Buffer is connected (the publishApprovedPosts function sends approved posts)</span>
                </label>
                <div className="row">
                    <button type="button" className="btn btn-primary btn-sm" disabled={busy || !draftSettings} onClick={saveSettings}>{busy ? "Saving…" : "Save targets and settings"}</button>
                    {draftSettings && <button type="button" className="btn btn-line btn-sm" onClick={() => setDraftSettings(null)}>Discard changes</button>}
                </div>
            </div>

            <div className="card card-pad stack" style={{ "--gap": "10px" }}>
                <h4 className="h4">Publishing through Buffer (optional)</h4>
                <p className="small">
                    Without Buffer, approved posts wait in the Queue to be posted by hand — everything works that way. To have them sent automatically:
                </p>
                <ol className="small mkt-steps">
                    <li>Create a Buffer account, connect Formcraft’s social accounts there, and create an API key in Buffer’s API settings.</li>
                    <li>Store the key as a Cloud Functions secret: <code>firebase functions:secrets:set BUFFER_TOKEN</code>, then deploy the functions (Blaze plan).</li>
                    <li>Press “Load Buffer channels” below, set each channel’s Publishing to “Through Buffer” and paste its Buffer channel id.</li>
                    <li>Tick “Buffer is connected” above. Every 15 minutes the server sends newly approved posts to Buffer at their scheduled time and marks them Scheduled (or Failed, with the reason).</li>
                </ol>
                <p className="fine">The key never reaches the browser. Pictures must be uploaded in the composer (public links) so Buffer can fetch them.</p>
                <div className="row">
                    <button type="button" className="btn btn-line btn-sm" disabled={busy} onClick={loadBuffer}>Load Buffer channels</button>
                </div>
                {buffer && (
                    <ul className="mkt-buffer">
                        {buffer.map((b) => (
                            <li key={b.id}><strong>{b.name || b.displayName}</strong> · {b.service} · <code>{b.id}</code></li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};
