import { useEffect, useMemo, useState } from "react";
import { useCollection } from "../../../hooks/useCollection";
import { PILLARS } from "../../../data/socialTopics";
import { occasionDate } from "../../../data/occasions";
import { channelLabel } from "../../../data/socialPlatforms";
import { addDays, canEditPost, dayKey, enabledChannelIds, formatDay, fromEat, rangeQuery, savePost, startOfWeek, STATUSES, timeKey, todayKey, WEEKDAYS } from "../../../lib/studio";
import { StatusTag } from "./StatusTag";

// Month, week and agenda views of the posts, with occasions as day badges. Drag a post to another
// day (mouse), or use "Move to…" in the agenda or the composer's date field (keyboard and touch).
const useNarrow = () => {
    const query = "(max-width: 700px)";
    const [narrow, setNarrow] = useState(() => typeof window !== "undefined" && window.matchMedia?.(query).matches);
    useEffect(() => {
        const mq = window.matchMedia?.(query);
        if (!mq) return undefined;
        const on = () => setNarrow(mq.matches);
        mq.addEventListener("change", on);
        return () => mq.removeEventListener("change", on);
    }, []);
    return narrow;
};

const monthLabel = (day) => formatDay(day, { month: "long", year: "numeric" });

export const CalendarView = ({ studio }) => {
    const { channels, channelsById, occasions, isMarketing, user, openComposer } = studio;
    const narrow = useNarrow();
    const [view, setView] = useState("month");
    const [cursor, setCursor] = useState(todayKey());
    const [filters, setFilters] = useState({ channel: "", status: "", pillar: "" });
    const [moveError, setMoveError] = useState(null);
    const shown = narrow && view !== "list" ? "list" : view;
    const today = todayKey();

    const range = useMemo(() => {
        if (shown === "week") {
            const from = startOfWeek(cursor);
            return { from, to: addDays(from, 6) };
        }
        if (shown === "list") return { from: cursor, to: addDays(cursor, 34) };
        const first = `${cursor.slice(0, 7)}-01`;
        const from = startOfWeek(first);
        const [y, m] = cursor.split("-").map(Number);
        const lastDay = `${cursor.slice(0, 7)}-${String(new Date(Date.UTC(y, m, 0)).getUTCDate()).padStart(2, "0")}`;
        return { from, to: addDays(startOfWeek(lastDay), 6) };
    }, [shown, cursor]);

    const { docs, loading, error } = useCollection("socialPosts", rangeQuery(range.from, range.to), [range.from, range.to]);
    const undated = useCollection("socialPosts", (f, ref) => f.query(ref, f.where("scheduledAt", "==", null)), []);

    const pass = (p) =>
        (!filters.channel || p.perChannel?.[filters.channel]?.enabled) && (!filters.status || p.status === filters.status) && (!filters.pillar || p.pillar === filters.pillar);
    const byDay = useMemo(() => {
        const map = new Map();
        docs.filter(pass).forEach((p) => {
            const d = dayKey(p.scheduledAt);
            map.set(d, [...(map.get(d) ?? []), p]);
        });
        return map;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [docs, filters]);

    // occasion badges for the days on screen
    const badges = useMemo(() => {
        const map = new Map();
        const years = [...new Set([range.from.slice(0, 4), range.to.slice(0, 4)])];
        occasions
            .filter((o) => o.active !== false)
            .forEach((o) =>
                years.forEach((y) => {
                    const { date, confirm } = occasionDate(o, y);
                    if (date && date >= range.from && date <= range.to) map.set(date, [...(map.get(date) ?? []), { ...o, confirmDate: confirm }]);
                })
            );
        return map;
    }, [occasions, range.from, range.to]);

    const days = useMemo(() => {
        const out = [];
        for (let d = range.from; d <= range.to; d = addDays(d, 1)) out.push(d);
        return out;
    }, [range.from, range.to]);

    const move = async (post, day) => {
        setMoveError(null);
        if (!day || day === dayKey(post.scheduledAt)) return;
        if (!canEditPost(post, isMarketing)) {
            setMoveError("Only marketing can move approved, scheduled or published posts.");
            return;
        }
        try {
            await savePost(post.id, { scheduledAt: fromEat(day, timeKey(post.scheduledAt) || studio.settings.defaultTime) }, user);
        } catch (e) {
            setMoveError(e.code === "permission-denied" ? "Firestore refused the move (role)." : e.message);
        }
    };

    const step = (dir) => {
        if (shown === "month") {
            const [y, m] = cursor.split("-").map(Number);
            const t = new Date(Date.UTC(y, m - 1 + dir, 1));
            setCursor(`${t.getUTCFullYear()}-${String(t.getUTCMonth() + 1).padStart(2, "0")}-01`);
        } else setCursor(addDays(cursor, dir * (shown === "week" ? 7 : 35)));
    };

    const chip = (p, compact) => {
        const ids = enabledChannelIds(p);
        return (
            <button
                key={p.id}
                type="button"
                className={`studio-chip studio-chip-${p.status || "draft"}`}
                draggable={canEditPost(p, isMarketing)}
                onDragStart={(e) => {
                    e.dataTransfer.setData("text/plain", p.id);
                    e.dataTransfer.effectAllowed = "move";
                }}
                onClick={() => openComposer(p)}
                title={`${p.title || "(untitled)"} — ${STATUSES[p.status] ?? p.status}`}
            >
                <span className="studio-chip-time">{timeKey(p.scheduledAt)}</span>
                <span className="studio-chip-title">{p.title || "(untitled)"}</span>
                {!compact && <span className="studio-chip-meta">{ids.map((id) => channelLabel(channelsById[id] ?? { name: id })).join(" · ")}</span>}
                <span className="sr-only">, {STATUSES[p.status] ?? p.status}</span>
                {p.confirmDate && <span className="studio-flag">confirm date</span>}
            </button>
        );
    };

    const dropProps = (day) => ({
        onDragOver: (e) => {
            e.preventDefault();
            e.currentTarget.classList.add("studio-drop");
        },
        onDragLeave: (e) => e.currentTarget.classList.remove("studio-drop"),
        onDrop: (e) => {
            e.preventDefault();
            e.currentTarget.classList.remove("studio-drop");
            const post = docs.find((p) => p.id === e.dataTransfer.getData("text/plain"));
            if (post) move(post, day);
        },
    });

    const pillars = [...new Set([...PILLARS, ...docs.map((p) => p.pillar).filter(Boolean)])];

    return (
        <div className="stack" style={{ "--gap": "16px" }}>
            <div className="studio-toolbar">
                <div className="row" style={{ "--gap": "8px" }}>
                    <button type="button" className="btn btn-line btn-sm" onClick={() => step(-1)} aria-label="Previous">‹</button>
                    <button type="button" className="btn btn-line btn-sm" onClick={() => setCursor(today)}>Today</button>
                    <button type="button" className="btn btn-line btn-sm" onClick={() => step(1)} aria-label="Next">›</button>
                    <strong className="studio-range" aria-live="polite">
                        {shown === "month" ? monthLabel(cursor) : `${formatDay(range.from)} – ${formatDay(range.to)}`}
                    </strong>
                </div>
                <div className="row" style={{ "--gap": "6px" }} role="group" aria-label="View">
                    {["month", "week", "list"].map((v) => (
                        <button key={v} type="button" className="chip" aria-pressed={shown === v} onClick={() => setView(v)} disabled={narrow && v !== "list"}>
                            {v === "list" ? "Agenda" : v[0].toUpperCase() + v.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            <div className="studio-filters">
                <div className="field">
                    <label htmlFor="cal-channel">Channel</label>
                    <select id="cal-channel" value={filters.channel} onChange={(e) => setFilters({ ...filters, channel: e.target.value })}>
                        <option value="">All</option>
                        {channels.map((c) => <option key={c.id} value={c.id}>{channelLabel(c)}</option>)}
                    </select>
                </div>
                <div className="field">
                    <label htmlFor="cal-status">Status</label>
                    <select id="cal-status" value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
                        <option value="">All</option>
                        {Object.entries(STATUSES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                </div>
                <div className="field">
                    <label htmlFor="cal-pillar">Pillar</label>
                    <select id="cal-pillar" value={filters.pillar} onChange={(e) => setFilters({ ...filters, pillar: e.target.value })}>
                        <option value="">All</option>
                        {pillars.map((p) => <option key={p} value={p}>{p}</option>)}
                    </select>
                </div>
            </div>

            {narrow && view !== "list" && <p className="fine">On a small screen the calendar shows as an agenda.</p>}
            {error && <p className="alert alert-error" role="alert">Couldn't load posts: {error.message}</p>}
            {moveError && <p className="alert alert-error" role="alert">{moveError}</p>}
            {loading && <div className="skeleton" style={{ height: 80 }} />}

            {shown !== "list" ? (
                <div className={`studio-grid studio-grid-${shown}`}>
                    {WEEKDAYS.map((w) => <div key={w} className="studio-grid-head" aria-hidden="true">{w}</div>)}
                    {days.map((d) => {
                        const outside = shown === "month" && d.slice(0, 7) !== cursor.slice(0, 7);
                        return (
                            <section key={d} className={`studio-day ${outside ? "studio-day-out" : ""} ${d === today ? "studio-day-today" : ""}`} aria-label={formatDay(d, { weekday: "long", day: "numeric", month: "long" })} {...dropProps(d)}>
                                <div className="studio-day-head">
                                    <span className="studio-day-num">{Number(d.slice(8))}{d === today && <span className="sr-only"> (today)</span>}</span>
                                    <button type="button" className="studio-add" onClick={() => openComposer(null, { day: d })} aria-label={`New post on ${formatDay(d)}`}>+</button>
                                </div>
                                {(badges.get(d) ?? []).map((o) => (
                                    <span key={o.id} className={`studio-badge studio-badge-${o.category}`} title={o.postAngle}>
                                        {o.name}{o.confirmDate ? " (confirm)" : ""}
                                    </span>
                                ))}
                                {(byDay.get(d) ?? []).map((p) => chip(p, shown === "month"))}
                            </section>
                        );
                    })}
                </div>
            ) : (
                <ol className="studio-agenda">
                    {days
                        .filter((d) => byDay.has(d) || badges.has(d) || d === today)
                        .map((d) => (
                            <li key={d} className={`studio-agenda-day ${d === today ? "studio-day-today" : ""}`}>
                                <div className="between" style={{ alignItems: "center", gap: "8px" }}>
                                    <h4 className="h4">{formatDay(d, { weekday: "long", day: "numeric", month: "long" })}{d === today ? " · today" : ""}</h4>
                                    <button type="button" className="btn btn-line btn-sm" onClick={() => openComposer(null, { day: d })}>Add post</button>
                                </div>
                                {(badges.get(d) ?? []).map((o) => (
                                    <span key={o.id} className={`studio-badge studio-badge-${o.category}`}>{o.name}{o.confirmDate ? " (confirm date)" : ""}</span>
                                ))}
                                <ul className="studio-agenda-posts">
                                    {(byDay.get(d) ?? []).map((p) => (
                                        <li key={p.id} className="studio-agenda-post">
                                            {chip(p, false)}
                                            <StatusTag status={p.status} />
                                            {canEditPost(p, isMarketing) && (
                                                <div className="field studio-move">
                                                    <label htmlFor={`mv-${p.id}`}>Move to…</label>
                                                    <input id={`mv-${p.id}`} type="date" defaultValue={d} onChange={(e) => move(p, e.target.value)} />
                                                </div>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            </li>
                        ))}
                </ol>
            )}

            <details className="card card-pad studio-undated">
                <summary>
                    <strong>Ideas without a date</strong> <span className="fine">({undated.docs.length})</span>
                </summary>
                {undated.docs.length === 0 ? (
                    <p className="small">None.</p>
                ) : (
                    <ul className="studio-agenda-posts">
                        {undated.docs.map((p) => (
                            <li key={p.id} className="studio-agenda-post">
                                {chip(p, false)}
                                <StatusTag status={p.status} />
                            </li>
                        ))}
                    </ul>
                )}
            </details>

            <p className="fine">
                Drag a post to another day to move it (same time). With a keyboard or on a phone, use the Agenda’s “Move to…” or open the post and change its date.
            </p>
        </div>
    );
};
