import { useCallback, useMemo, useState } from "react";
import { useAuth } from "../../../hooks/useAuth";
import { useCollection } from "../../../hooks/useCollection";
import { useDocument } from "../../../hooks/useDocument";
import { readJSON, writeJSON } from "../../../lib/storage";
import { studioSettings } from "../../../lib/studio";
import { STARTER_OCCASIONS } from "../../../data/occasions";
import { channelLabel } from "../../../data/socialPlatforms";
import { CalendarView } from "./CalendarView";
import { QueueView } from "./QueueView";
import { GenerateView } from "./GenerateView";
import { BulkView } from "./BulkView";
import { ChannelsView } from "./ChannelsView";
import { TopicsView } from "./TopicsView";
import { OccasionsView } from "./OccasionsView";
import { ResultsView } from "./ResultsView";
import { Composer } from "./Composer";
import "./StudioPanel.css";

// Admin → Studio: Formcraft's social media planning. Everything lives in Firestore
// (socialChannels, occasions, socialTopics, socialPosts, settings/studio) and is edited here.
// Editors plan drafts; marketing and admins approve, schedule, publish and manage the lists.
const TABS = [
    { key: "calendar", label: "Calendar", editor: true },
    { key: "queue", label: "Queue" },
    { key: "generate", label: "Generate" },
    { key: "bulk", label: "Bulk" },
    { key: "channels", label: "Channels" },
    { key: "topics", label: "Topics", editor: true },
    { key: "occasions", label: "Occasions", editor: true },
    { key: "results", label: "Results" },
];
const TAB_KEY = "fc-studio-tab";

const byName = (a, b) => String(a.name ?? "").localeCompare(String(b.name ?? ""));

export const StudioPanel = () => {
    const { user, role, isMarketing, isEditor } = useAuth();
    const tabs = TABS.filter((t) => isMarketing || t.editor);
    const [tab, setTabState] = useState(() => {
        const saved = readJSON(TAB_KEY, "calendar");
        return tabs.some((t) => t.key === saved) ? saved : "calendar";
    });
    const setTab = (key) => {
        setTabState(key);
        writeJSON(TAB_KEY, key);
    };
    const current = tabs.some((t) => t.key === tab) ? tab : "calendar";

    const channelsQ = useCollection("socialChannels", null, [], isEditor);
    const occasionsQ = useCollection("occasions", null, [], isEditor);
    const topicsQ = useCollection("socialTopics", null, [], isEditor);
    const settingsQ = useDocument("settings/studio");

    const channels = useMemo(() => [...channelsQ.docs].sort((a, b) => (b.active !== false) - (a.active !== false) || channelLabel(a).localeCompare(channelLabel(b))), [channelsQ.docs]);
    // Until the calendar is imported, show the register's occasions as day badges (read-only)
    const occasionsStored = occasionsQ.docs.length > 0;
    const occasions = useMemo(() => [...(occasionsStored ? occasionsQ.docs : STARTER_OCCASIONS)].sort(byName), [occasionsQ.docs, occasionsStored]);
    const topics = topicsQ.docs;
    const settings = useMemo(() => studioSettings(settingsQ.data), [settingsQ.data]);

    const [composer, setComposer] = useState(null); // null | { post } | { draft: {...} }
    const openComposer = useCallback((post, draft) => setComposer(post ? { post } : { draft: draft ?? {} }), []);

    const studio = useMemo(
        () => ({
            user,
            role,
            isMarketing,
            channels,
            activeChannels: channels.filter((c) => c.active !== false),
            channelsById: Object.fromEntries(channels.map((c) => [c.id, c])),
            occasions,
            occasionsStored,
            occasionsById: Object.fromEntries(occasions.map((o) => [o.id, o])),
            topics,
            topicsById: Object.fromEntries(topics.map((t) => [t.id, t])),
            settings,
            openComposer,
        }),
        [user, role, isMarketing, channels, occasions, occasionsStored, topics, settings, openComposer]
    );

    const loadError = channelsQ.error || occasionsQ.error || topicsQ.error;

    return (
        <div className="stack studio" style={{ "--gap": "18px" }}>
            <div className="between" style={{ alignItems: "center" }}>
                <div className="stack" style={{ "--gap": "4px" }}>
                    <h3 className="h3">Marketing studio</h3>
                    <p className="small">
                        Plan, approve and publish Formcraft’s social posts. Times are Kampala time (EAT).
                        {!isMarketing && " You can write drafts and send them for review; marketing approves and publishes."}
                    </p>
                </div>
                <button type="button" className="btn btn-primary btn-sm" onClick={() => openComposer(null, {})} disabled={!channels.length}>
                    New post
                </button>
            </div>

            {loadError && (
                <p className="alert alert-error" role="alert">
                    {loadError.code === "permission-denied" ? "Firestore refused: this account's team role hasn't reached the database rules yet (sign out and back in once it's set)." : `Couldn't load the studio: ${loadError.message}`}
                </p>
            )}
            {!channelsQ.loading && !channels.length && (
                <p className="alert" role="status">
                    No channels yet. {isMarketing ? "Open Channels and import the starter channels (Instagram, X, LinkedIn…) or add your own." : "Ask marketing to set up the channels first."}
                </p>
            )}

            <div className="mkt-tabs" role="tablist" aria-label="Studio sections">
                {tabs.map((t) => (
                    <button
                        key={t.key}
                        id={`mkt-tab-${t.key}`}
                        type="button"
                        role="tab"
                        aria-selected={current === t.key}
                        aria-controls="mkt-tabpanel"
                        tabIndex={current === t.key ? 0 : -1}
                        className="mkt-tab"
                        onClick={() => setTab(t.key)}
                        onKeyDown={(e) => {
                            if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
                            const i = tabs.findIndex((x) => x.key === current);
                            const next = tabs[(i + (e.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length];
                            setTab(next.key);
                            document.getElementById(`mkt-tab-${next.key}`)?.focus();
                        }}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            <div id="mkt-tabpanel" role="tabpanel" aria-labelledby={`mkt-tab-${current}`}>
                {current === "calendar" && <CalendarView studio={studio} />}
                {current === "queue" && <QueueView studio={studio} />}
                {current === "generate" && <GenerateView studio={studio} />}
                {current === "bulk" && <BulkView studio={studio} />}
                {current === "channels" && <ChannelsView studio={studio} />}
                {current === "topics" && <TopicsView studio={studio} />}
                {current === "occasions" && <OccasionsView studio={studio} />}
                {current === "results" && <ResultsView studio={studio} />}
            </div>

            {composer && <Composer key={composer.post?.id ?? "new"} studio={studio} post={composer.post ?? null} draft={composer.draft} onClose={() => setComposer(null)} />}
        </div>
    );
};
