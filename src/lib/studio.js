// Marketing studio helpers (Admin → Studio): Kampala time, tracked links, captions, Firestore writes
// for posts/channels/topics/occasions, media uploads, "generate the year", CSV import/export and
// the results lookup. Loaded only on /admin. firestore.rules / storage.rules enforce the roles again:
// editors write drafts only; marketing and admins approve, schedule, publish and delete.
import { getDb, getStorageService } from "../config/firebase";
import { PILLARS } from "../data/socialTopics";
import { occasionDate } from "../data/occasions";
import { STUDIO_DEFAULTS } from "../data/socialChannels";
import { captionLimitOf, channelLabel, defaultFormatOf, platformOf, PLATFORMS } from "../data/socialPlatforms";

const fs = () => Promise.all([getDb(), import("firebase/firestore")]);

// ── Site address for tracked links ───────────────────────────────────────────────────────────
// src/data/seo.js holds SITE_URL; imported through a glob so the studio still builds if it moves.
let seoSiteUrl = "";
try {
    const mods = import.meta.glob("../data/seo.js", { eager: true });
    seoSiteUrl = Object.values(mods)[0]?.SITE_URL ?? "";
} catch {
    seoSiteUrl = "";
}
export const siteBase = () => String(seoSiteUrl || (typeof window !== "undefined" ? window.location.origin : "")).replace(/\/+$/, "");

export const slug = (text) =>
    String(text ?? "")
        .toLowerCase()
        .normalize("NFKD")
        .replace(/[̀-ͯ]/g, "")
        .replace(/[^\w\s-]/g, "")
        .trim()
        .replace(/[\s_]+/g, "-")
        .replace(/-+/g, "-")
        .slice(0, 60);

// ── Kampala time (EAT = UTC+3 all year, no daylight saving) ────────────────────────────────
const EAT_MS = 3 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const pad = (n) => String(n).padStart(2, "0");

export const toDate = (v) => {
    if (!v) return null;
    if (v instanceof Date) return v;
    if (typeof v.toDate === "function") return v.toDate();
    if (typeof v.seconds === "number") return new Date(v.seconds * 1000);
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? null : d;
};

// "YYYY-MM-DD" of a moment, in Kampala
export const dayKey = (v) => {
    const d = toDate(v);
    if (!d) return "";
    const e = new Date(d.getTime() + EAT_MS);
    return `${e.getUTCFullYear()}-${pad(e.getUTCMonth() + 1)}-${pad(e.getUTCDate())}`;
};
// "HH:MM" of a moment, in Kampala
export const timeKey = (v) => {
    const d = toDate(v);
    if (!d) return "";
    const e = new Date(d.getTime() + EAT_MS);
    return `${pad(e.getUTCHours())}:${pad(e.getUTCMinutes())}`;
};
// Kampala day + time → the real moment
export const fromEat = (day, time = "07:30") => {
    const [y, m, d] = String(day).split("-").map(Number);
    const [hh, mm] = String(time || "07:30").split(":").map(Number);
    if (!y || !m || !d) return null;
    return new Date(Date.UTC(y, m - 1, d, (hh || 0) - 3, mm || 0));
};
export const todayKey = () => dayKey(new Date());
export const addDays = (day, n) => {
    const [y, m, d] = day.split("-").map(Number);
    const t = new Date(Date.UTC(y, m - 1, d + n));
    return `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}`;
};
// 1 = Monday … 7 = Sunday
export const weekday = (day) => {
    const [y, m, d] = day.split("-").map(Number);
    return ((new Date(Date.UTC(y, m - 1, d)).getUTCDay() + 6) % 7) + 1;
};
export const startOfWeek = (day) => addDays(day, 1 - weekday(day));
export const daysBetween = (a, b) => {
    const [y1, m1, d1] = a.split("-").map(Number);
    const [y2, m2, d2] = b.split("-").map(Number);
    return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / DAY_MS);
};
export const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
export const formatDay = (day, opts = { weekday: "short", day: "numeric", month: "short" }) => {
    const [y, m, d] = String(day).split("-").map(Number);
    if (!y) return "—";
    return new Date(Date.UTC(y, m - 1, d, 12)).toLocaleDateString("en-UG", { ...opts, timeZone: "UTC" });
};

// ── Statuses and roles ───────────────────────────────────────────────────────────────────
export const STATUSES = {
    idea: "Idea",
    draft: "Draft",
    review: "In review",
    approved: "Approved",
    scheduled: "Scheduled",
    published: "Published",
    failed: "Failed",
    skipped: "Skipped",
};
export const EDITOR_STATUSES = ["idea", "draft", "review"]; // all an editor may set (rules agree)
export const canEditPost = (post, isMarketing) => isMarketing || !post?.status || EDITOR_STATUSES.includes(post.status);

// ── Channels on a post ───────────────────────────────────────────────────────────────────
export const enabledChannelIds = (post) => Object.entries(post?.perChannel ?? {}).filter(([, v]) => v?.enabled).map(([k]) => k);

// ── Tracked links ────────────────────────────────────────────────────────────────────────
// A site path ("/studio") or a full link on the site gets utm tags; links to other sites are left alone.
export const campaignOf = (post, settings) => {
    if (post?.campaign) return slug(post.campaign);
    const prefix = settings?.campaignPrefix ? `${slug(settings.campaignPrefix)}-` : "";
    if (post?.occasionId) return `${prefix}${post.occasionId}${post.occasionYear ? `-${post.occasionYear}` : ""}`;
    return `${prefix}${slug(post?.pillar || post?.title || "social")}`;
};

export const trackedUrl = (post, channel, settings) => {
    const raw = String(post?.link ?? "").trim();
    if (!raw) return "";
    const base = siteBase();
    let url;
    try {
        url = new URL(raw.startsWith("/") ? `${base}${raw}` : raw);
    } catch {
        return raw;
    }
    let ours = raw.startsWith("/");
    try {
        ours = ours || (base && new URL(base).hostname.replace(/^www\./, "") === url.hostname.replace(/^www\./, ""));
    } catch {
        // keep ours as is
    }
    if (!ours) return url.toString();
    url.searchParams.set("utm_source", channel?.platform && channel.platform !== "other" ? channel.platform : slug(channelLabel(channel)) || "social");
    url.searchParams.set("utm_medium", "social");
    url.searchParams.set("utm_campaign", campaignOf(post, settings));
    if (post?.id) url.searchParams.set("utm_content", post.id); // per-post results
    return url.toString();
};

// The text that goes on one channel: its own caption (or the base one), hashtags and the tracked link
export const captionFor = (post, channel, settings) => {
    const own = post?.perChannel?.[channel?.id]?.caption;
    const body = String(own || post?.caption || "").trim();
    const tags = String(post?.hashtags ?? "").trim();
    const link = trackedUrl(post, channel, settings);
    return [body, tags, link].filter(Boolean).join("\n\n");
};

// Characters as the platform counts them (X counts every link as 23)
export const countChars = (text, channel) => {
    const s = String(text ?? "");
    if (channel?.platform === "x") return [...s.replace(/https?:\/\/\S+/g, "x".repeat(23))].length;
    return [...s].length;
};
export const overLimit = (post, channel, settings) => {
    const limit = captionLimitOf(channel);
    const n = countChars(captionFor(post, channel, settings), channel);
    return { n, limit, over: Boolean(limit && n > limit) };
};

// Promo words to warn about on "no promotions" occasions (register care notes)
const PROMO = /\b(ugx|price[sd]?|discount|offer|sale|shop now|buy now|order now|deal|% off)\b/i;
export const looksPromotional = (text) => PROMO.test(String(text ?? ""));

// ── Media ────────────────────────────────────────────────────────────────────────────────
export const MAX_IMAGE = 15 * 1024 * 1024;
export const MAX_VIDEO = 100 * 1024 * 1024;

const readDims = (file) =>
    new Promise((resolve) => {
        const url = URL.createObjectURL(file);
        const done = (w, h) => {
            URL.revokeObjectURL(url);
            resolve({ width: w || null, height: h || null });
        };
        if (file.type.startsWith("video/")) {
            const v = document.createElement("video");
            v.preload = "metadata";
            v.onloadedmetadata = () => done(v.videoWidth, v.videoHeight);
            v.onerror = () => done(null, null);
            v.src = url;
        } else {
            const img = new Image();
            img.onload = () => done(img.naturalWidth, img.naturalHeight);
            img.onerror = () => done(null, null);
            img.src = url;
        }
    });

export const uploadMedia = async (postId, file) => {
    const kind = file.type.startsWith("video/") ? "video" : file.type.startsWith("image/") ? "image" : null;
    if (!kind) throw new Error(`${file.name}: use an image (JPG, PNG, WebP) or a video (MP4).`);
    if (kind === "image" && file.size > MAX_IMAGE) throw new Error(`${file.name} is over 15 MB. Save it smaller and try again.`);
    if (kind === "video" && file.size > MAX_VIDEO) throw new Error(`${file.name} is over 100 MB.`);
    const dims = await readDims(file);
    const [storage, { ref, uploadBytes, getDownloadURL }] = await Promise.all([getStorageService(), import("firebase/storage")]);
    const path = `public/social/${postId}/${Date.now()}-${file.name.replace(/[^\w.-]+/g, "_")}`;
    const r = ref(storage, path);
    await uploadBytes(r, file, { contentType: file.type, cacheControl: "public, max-age=31536000, immutable" });
    return { url: await getDownloadURL(r), name: file.name, kind, path, ...dims };
};

// Does the picture's shape fit the recommended sizes? (within 3 %)
export const ratioFits = (media, sizes) => {
    if (!media?.width || !media?.height || !sizes?.length) return true;
    const r = media.width / media.height;
    return sizes.some(([w, h]) => Math.abs(r - w / h) / (w / h) < 0.03);
};

// ── Posts ────────────────────────────────────────────────────────────────────────────────
const POST_FIELDS = ["title", "pillar", "topicId", "occasionId", "occasionYear", "templateCode", "caption", "hashtags", "link", "campaign", "perChannel", "media", "status", "notes", "careChecked", "confirmDate", "generated"];

const clean = (data) => {
    const out = {};
    POST_FIELDS.forEach((k) => {
        if (data[k] !== undefined) out[k] = data[k];
    });
    return out;
};

export const newPostId = async () => {
    const [db, { doc, collection }] = await fs();
    return doc(collection(db, "socialPosts")).id;
};

// Save a post. `scheduledAt` is a Date (or null). Approval stamps approvedBy.
export const savePost = async (id, data, user, { isNew = false } = {}) => {
    const [db, { doc, setDoc, serverTimestamp, Timestamp, deleteField }] = await fs();
    const out = clean(data);
    // re-approving a failed post clears the failed channel results so Buffer can try again
    if (data.status === "approved" && data.results) {
        const failed = Object.entries(data.results).filter(([, r]) => r?.status === "failed").map(([k]) => k);
        if (failed.length) out.results = Object.fromEntries(failed.map((k) => [k, deleteField()]));
    }
    if ("scheduledAt" in data) out.scheduledAt = data.scheduledAt ? Timestamp.fromDate(toDate(data.scheduledAt)) : null;
    out.updatedAt = serverTimestamp();
    out.updatedBy = user?.email ?? null;
    if (isNew) {
        out.createdAt = serverTimestamp();
        out.createdBy = user?.email ?? null;
    }
    if (data.status === "approved" && data.approvedBy === undefined) out.approvedBy = user?.email ?? null;
    await setDoc(doc(db, "socialPosts", id), out, { merge: true });
    return id;
};

export const deletePost = async (id) => {
    const [db, { doc, deleteDoc }] = await fs();
    await deleteDoc(doc(db, "socialPosts", id));
};

// Write many docs in batches of at most 450 operations
const commitInBatches = async (ops) => {
    const [db, { writeBatch, doc }] = await fs();
    for (let i = 0; i < ops.length; i += 450) {
        const batch = writeBatch(db);
        ops.slice(i, i + 450).forEach((op) => {
            const ref = doc(db, op.collection, op.id);
            if (op.type === "delete") batch.delete(ref);
            else if (op.type === "update") batch.update(ref, op.data);
            else batch.set(ref, op.data, op.merge ? { merge: true } : undefined);
        });
        await batch.commit();
    }
    return ops.length;
};

// Bulk: change many posts. patch(post) returns the fields to change (or null to skip).
export const bulkUpdatePosts = async (posts, patch, user) => {
    const { serverTimestamp, Timestamp } = await import("firebase/firestore");
    const ops = [];
    posts.forEach((p) => {
        const change = patch(p);
        if (!change) return;
        const data = { ...change, updatedAt: serverTimestamp(), updatedBy: user?.email ?? null };
        if (change.scheduledAt instanceof Date) data.scheduledAt = Timestamp.fromDate(change.scheduledAt);
        if (change.status === "approved") data.approvedBy = user?.email ?? null;
        ops.push({ type: "update", collection: "socialPosts", id: p.id, data });
    });
    return commitInBatches(ops);
};
export const bulkDeletePosts = (ids) => commitInBatches(ids.map((id) => ({ type: "delete", collection: "socialPosts", id })));

// Manual publishing: the live link for one channel. When every enabled channel has one, the post is published.
export const markPosted = async (post, channelId, url, user) => {
    const [db, { doc, updateDoc, serverTimestamp, increment }] = await fs();
    const results = { ...(post.results ?? {}), [channelId]: { status: "published", url: url || "", at: new Date().toISOString(), error: null } };
    const all = enabledChannelIds(post).every((c) => results[c]?.status === "published");
    await updateDoc(doc(db, "socialPosts", post.id), {
        [`results.${channelId}`]: { status: "published", url: url || "", at: serverTimestamp(), error: null },
        ...(all ? { status: "published" } : {}),
        updatedAt: serverTimestamp(),
        updatedBy: user?.email ?? null,
    });
    if (all && post.topicId) {
        try {
            await updateDoc(doc(db, "socialTopics", post.topicId), { uses: increment(1), lastUsedAt: serverTimestamp() });
        } catch {
            // the topic may have been deleted; the post still counts as published
        }
    }
    return all;
};

// ── Channels, topics, occasions, settings ────────────────────────────────────────────────
export const saveDoc = async (collectionName, id, data, { merge = true } = {}) => {
    const [db, { doc, collection, setDoc, serverTimestamp }] = await fs();
    const ref = id ? doc(db, collectionName, id) : doc(collection(db, collectionName));
    await setDoc(ref, { ...data, updatedAt: serverTimestamp() }, { merge });
    return ref.id;
};
export const removeDoc = async (collectionName, id) => {
    const [db, { doc, deleteDoc }] = await fs();
    await deleteDoc(doc(db, collectionName, id));
};
export const saveStudioSettings = (data) => saveDoc("settings", "studio", data);
export const studioSettings = (data) => ({ ...STUDIO_DEFAULTS, ...(data ?? {}) });

// Copy starter data into a collection without touching documents that already exist
export const importStarterDocs = async (collectionName, items, existingIds = []) => {
    const { serverTimestamp } = await import("firebase/firestore");
    const have = new Set(existingIds);
    const ops = items
        .map((item, i) => ({ ...item, id: item.id || `${slug(item.pillar || "")}-${slug(item.idea || item.name || "")}`.slice(0, 80) || `item-${i}` }))
        .filter((item) => !have.has(item.id))
        .map(({ id, ...data }) => ({ type: "set", collection: collectionName, id, data: { ...data, updatedAt: serverTimestamp() } }));
    return commitInBatches(ops);
};

// ── Queries ──────────────────────────────────────────────────────────────────────────────
// Posts scheduled between two Kampala days (inclusive), for one-off reads (generate, export)
export const fetchPostsBetween = async (fromDay, toDay) => {
    const [db, { collection, query, where, orderBy, getDocs, Timestamp }] = await fs();
    const q = query(
        collection(db, "socialPosts"),
        where("scheduledAt", ">=", Timestamp.fromDate(fromEat(fromDay, "00:00"))),
        where("scheduledAt", "<", Timestamp.fromDate(fromEat(addDays(toDay, 1), "00:00"))),
        orderBy("scheduledAt")
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};
export const fetchUnscheduled = async () => {
    const [db, { collection, query, where, getDocs }] = await fs();
    const snap = await getDocs(query(collection(db, "socialPosts"), where("scheduledAt", "==", null)));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

// Range helpers for useCollection: build(fs, ref) with Kampala days
export const rangeQuery = (fromDay, toDay) => (f, ref) =>
    f.query(ref, f.where("scheduledAt", ">=", f.Timestamp.fromDate(fromEat(fromDay, "00:00"))), f.where("scheduledAt", "<", f.Timestamp.fromDate(fromEat(addDays(toDay, 1), "00:00"))), f.orderBy("scheduledAt"));

// ── Generate the year ────────────────────────────────────────────────────────────────────
// Pure planning step: returns the drafts to create, never touching existing posts.
// Occasion posts first (one per active occasion, on its date, all chosen channels), then
// everyday drafts to reach each channel's weekly target on its posting days, rotating pillars
// and drawing the least-used topic ideas.
export const planYear = ({ year, channels, occasions, topics, settings, existing, fromDay }) => {
    const s = studioSettings(settings);
    const y = Number(year);
    const first = `${y}-01-01`;
    const last = `${y}-12-31`;
    const start = fromDay && fromDay > first ? fromDay : first;
    const time = s.defaultTime || "07:30";
    const chosen = channels.map((c) => c.id);
    const byId = Object.fromEntries(channels.map((c) => [c.id, c]));
    const fmt = (c, wanted = []) => {
        const allowed = platformOf(c).formats;
        return wanted.find((f) => allowed.includes(f)) ?? defaultFormatOf(c);
    };

    // what's already there: channels posting per day, occasion posts per day, topics in use
    const posting = new Map(); // day → Set(channelId)
    const occasionDays = new Set();
    const usedTopics = new Map(); // topicId → count
    const doneOccasions = new Set();
    const note = (day, ids) => {
        if (!day) return;
        const set = posting.get(day) ?? new Set();
        ids.forEach((id) => set.add(id));
        posting.set(day, set);
    };
    existing.forEach((p) => {
        if (p.occasionId && Number(p.occasionYear) === y) doneOccasions.add(p.occasionId);
        if (p.status === "skipped") return;
        const day = dayKey(p.scheduledAt);
        note(day, enabledChannelIds(p));
        if (p.occasionId && day) occasionDays.add(day);
        if (p.topicId) usedTopics.set(p.topicId, (usedTopics.get(p.topicId) ?? 0) + 1);
    });

    // 1. occasions
    const occasionPosts = [];
    occasions
        .filter((o) => o.active !== false && !doneOccasions.has(o.id))
        .forEach((o) => {
            const { date, confirm } = occasionDate(o, y);
            if (date && (date < start || date > last)) return;
            const perChannel = Object.fromEntries(chosen.map((id) => [id, { enabled: true, caption: "", format: fmt(byId[id], ["feed"]) }]));
            occasionPosts.push({
                title: o.name,
                pillar: "",
                topicId: null,
                occasionId: o.id,
                occasionYear: y,
                templateCode: o.templateCode || "",
                caption: o.postAngle || "",
                hashtags: "",
                link: "",
                campaign: "",
                perChannel,
                media: [],
                status: date ? "draft" : "idea",
                notes: date ? "" : "Date not known yet — set it in Occasions, then move this post to its day.",
                careChecked: [],
                confirmDate: Boolean(confirm || !date),
                generated: true,
                scheduledAt: date ? fromEat(date, time) : null,
                day: date,
            });
            if (date) {
                note(date, chosen);
                occasionDays.add(date);
            }
        });

    // 2. everyday posts per week and channel
    const want = new Map(); // day → Set(channelId)
    for (let wk = startOfWeek(first); wk <= last; wk = addDays(wk, 7)) {
        const week = Array.from({ length: 7 }, (_, i) => addDays(wk, i)).filter((d) => d >= first && d <= last);
        channels.forEach((c) => {
            const target = Math.max(0, Math.floor(Number(s.targets?.[c.id]) || 0));
            if (!target) return;
            const days = (s.channelDays?.[c.id]?.length ? s.channelDays[c.id] : s.postingDays).map(Number);
            const have = week.filter((d) => posting.get(d)?.has(c.id) || want.get(d)?.has(c.id)).length;
            let need = Math.min(target, days.length) - have;
            if (need <= 0) return;
            const open = week.filter((d) => d >= start && days.includes(weekday(d)) && !posting.get(d)?.has(c.id) && !want.get(d)?.has(c.id));
            const free = open.filter((d) => !occasionDays.has(d));
            const pick = (list, k) => {
                const out = [];
                for (let i = 0; i < k && i < list.length; i++) out.push(list[Math.floor((i * list.length) / Math.min(k, list.length))]);
                return [...new Set(out)];
            };
            const chosenDays = pick(free, need);
            need -= chosenDays.length;
            if (need > 0) chosenDays.push(...pick(open.filter((d) => occasionDays.has(d)), need));
            chosenDays.forEach((d) => {
                const set = want.get(d) ?? new Set();
                set.add(c.id);
                want.set(d, set);
            });
        });
    }

    // 3. one draft per day, rotating pillars and drawing topics
    const activeTopics = topics.filter((t) => t.active !== false);
    const pillars = [...PILLARS, ...new Set(activeTopics.map((t) => t.pillar).filter((p) => p && !PILLARS.includes(p)))].filter((p) => activeTopics.some((t) => t.pillar === p));
    const runUses = new Map();
    const lastUsed = (t) => toDate(t.lastUsedAt)?.getTime() ?? 0;
    let turn = 0;
    const everydayPosts = [...want.keys()].sort().map((day) => {
        let topic = null;
        let pillar = pillars.length ? pillars[turn % pillars.length] : "";
        for (let tries = 0; tries < pillars.length && !topic; tries++) {
            pillar = pillars[(turn + tries) % pillars.length];
            const pool = activeTopics.filter((t) => t.pillar === pillar);
            pool.sort((a, b) => (runUses.get(a.id) ?? 0) + (usedTopics.get(a.id) ?? 0) + (a.uses ?? 0) - ((runUses.get(b.id) ?? 0) + (usedTopics.get(b.id) ?? 0) + (b.uses ?? 0)) || lastUsed(a) - lastUsed(b));
            topic = pool[0] ?? null;
        }
        turn += 1;
        if (topic) runUses.set(topic.id, (runUses.get(topic.id) ?? 0) + 1);
        const ids = [...want.get(day)];
        return {
            title: topic?.idea || `${pillar || "Everyday"} post`,
            pillar: topic?.pillar || pillar || "",
            topicId: topic?.id ?? null,
            occasionId: null,
            occasionYear: null,
            templateCode: "",
            caption: "",
            hashtags: "",
            link: "",
            campaign: "",
            perChannel: Object.fromEntries(ids.map((id) => [id, { enabled: true, caption: "", format: fmt(byId[id], topic?.formats ?? []) }])),
            media: [],
            status: "draft",
            notes: topic?.notes || "",
            careChecked: [],
            confirmDate: false,
            generated: true,
            scheduledAt: fromEat(day, time),
            day,
        };
    });

    return { occasionPosts, everydayPosts, ideas: occasionPosts.filter((p) => !p.day).length };
};

export const writePlan = async (plan, user) => {
    const [db, { collection, doc, serverTimestamp, Timestamp }] = await fs();
    const ops = [...plan.occasionPosts, ...plan.everydayPosts].map(({ day: _day, scheduledAt, ...p }) => ({
        type: "set",
        collection: "socialPosts",
        id: doc(collection(db, "socialPosts")).id,
        data: {
            ...p,
            scheduledAt: scheduledAt ? Timestamp.fromDate(scheduledAt) : null,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            createdBy: user?.email ?? null,
            updatedBy: user?.email ?? null,
        },
    }));
    return commitInBatches(ops);
};

// Posts in a year plus that year's undated occasion ideas (for planYear)
export const fetchYearPosts = async (year) => {
    const [db, { collection, query, where, getDocs }] = await fs();
    const dated = await fetchPostsBetween(`${year}-01-01`, `${year}-12-31`);
    const snap = await getDocs(query(collection(db, "socialPosts"), where("occasionYear", "==", Number(year))));
    const byId = new Map(dated.map((p) => [p.id, p]));
    snap.docs.forEach((d) => byId.set(d.id, { id: d.id, ...d.data() }));
    return [...byId.values()];
};

// ── CSV ──────────────────────────────────────────────────────────────────────────────────
// RFC 4180-style: quoted fields with commas, quotes ("") and newlines; CRLF or LF; UTF-8 BOM.
export const parseCSV = (text) => {
    const s = String(text ?? "").replace(/^﻿/, "");
    const rows = [];
    let row = [];
    let field = "";
    let quoted = false;
    for (let i = 0; i < s.length; i++) {
        const ch = s[i];
        if (quoted) {
            if (ch === '"') {
                if (s[i + 1] === '"') {
                    field += '"';
                    i++;
                } else quoted = false;
            } else field += ch;
        } else if (ch === '"' && field === "") quoted = true;
        else if (ch === ",") {
            row.push(field);
            field = "";
        } else if (ch === "\n" || ch === "\r") {
            if (ch === "\r" && s[i + 1] === "\n") i++;
            row.push(field);
            rows.push(row);
            row = [];
            field = "";
        } else field += ch;
    }
    if (field !== "" || row.length) {
        row.push(field);
        rows.push(row);
    }
    return rows.filter((r) => r.some((c) => String(c).trim() !== ""));
};

const csvCell = (v) => {
    const t = v == null ? "" : String(v);
    return /[",\n\r]/.test(t) || /^\s|\s$/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
};
// Leading BOM so Excel opens it as UTF-8
export const toCSV = (rows) => `﻿${rows.map((r) => r.map(csvCell).join(",")).join("\r\n")}\r\n`;

export const CSV_COLUMNS = ["date", "time", "channels", "title", "caption", "link", "pillar", "templateCode", "imageName", "status"];

const normDate = (v) => {
    const t = String(v ?? "").trim();
    let m = t.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (m) return `${m[1]}-${pad(m[2])}-${pad(m[3])}`;
    m = t.match(/^(\d{1,2})[/.](\d{1,2})[/.](\d{4})$/); // DD/MM/YYYY (Uganda)
    if (m) return `${m[3]}-${pad(m[2])}-${pad(m[1])}`;
    return null;
};
const normTime = (v, fallback) => {
    const t = String(v ?? "").trim();
    if (!t) return fallback;
    const m = t.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(am|pm)?$/i);
    if (!m) return null;
    let h = Number(m[1]);
    if (m[3]) h = (h % 12) + (m[3].toLowerCase() === "pm" ? 12 : 0);
    return h < 24 && Number(m[2]) < 60 ? `${pad(h)}:${m[2]}` : null;
};

// CSV rows → checked posts: [{ line, post, errors[], warnings[], imageName }]
export const csvToPosts = (rows, { channels, settings, files = [], isMarketing }) => {
    if (!rows.length) return { header: [], items: [] };
    const header = rows[0].map((h) => String(h).trim().replace(/^﻿/, ""));
    const lower = header.map((h) => h.toLowerCase());
    const col = (name) => lower.indexOf(name.toLowerCase());
    const s = studioSettings(settings);
    const findChannel = (name) => {
        const n = name.trim().toLowerCase();
        return channels.find((c) => c.id.toLowerCase() === n || channelLabel(c).toLowerCase() === n || (c.handle && c.handle.replace(/^@/, "").toLowerCase() === n.replace(/^@/, "")) || PLATFORMS[c.platform]?.label.toLowerCase() === n);
    };
    const fileNames = new Map(files.map((f) => [f.name.toLowerCase(), f]));
    const missing = ["date", "channels", "title"].filter((c) => col(c) < 0);
    const items = rows.slice(1).map((r, i) => {
        const get = (name) => (col(name) >= 0 ? String(r[col(name)] ?? "").trim() : "");
        const errors = [];
        const warnings = [];
        if (missing.length) errors.push(`Missing column${missing.length > 1 ? "s" : ""}: ${missing.join(", ")}`);
        const day = normDate(get("date"));
        if (!day) errors.push("Date must be YYYY-MM-DD (or DD/MM/YYYY).");
        const time = normTime(get("time"), s.defaultTime);
        if (!time) errors.push("Time must be HH:MM (24-hour, Kampala).");
        const names = get("channels").split(";").map((x) => x.trim()).filter(Boolean);
        const found = names.map((n) => [n, findChannel(n)]);
        found.filter(([, c]) => !c).forEach(([n]) => errors.push(`Unknown channel “${n}”. Add it in Channels first.`));
        if (!names.length) errors.push("List at least one channel (separate several with ;).");
        const status = (get("status") || "draft").toLowerCase();
        if (!STATUSES[status]) errors.push(`Unknown status “${status}”.`);
        else if (!isMarketing && !EDITOR_STATUSES.includes(status)) errors.push(`Editors can import ideas, drafts and posts for review only (not “${status}”).`);
        else if (["scheduled", "published"].includes(status)) warnings.push(`Imported as “${status}” — make sure it really is.`);
        const title = get("title");
        if (!title) errors.push("Title is empty.");
        const imageName = get("imageName");
        if (imageName && !fileNames.has(imageName.toLowerCase())) warnings.push(`Image “${imageName}” isn't among the files you picked; the post is imported without it.`);
        const perChannel = Object.fromEntries(found.filter(([, c]) => c).map(([, c]) => [c.id, { enabled: true, caption: "", format: defaultFormatOf(c) }]));
        const post = {
            title,
            caption: get("caption"),
            link: get("link"),
            pillar: get("pillar"),
            templateCode: get("templateCode"),
            hashtags: "",
            campaign: "",
            perChannel,
            media: [],
            status: STATUSES[status] ? status : "draft",
            notes: "",
            careChecked: [],
            topicId: null,
            occasionId: null,
            scheduledAt: day && time ? fromEat(day, time) : null,
        };
        found.forEach(([, c]) => {
            if (!c) return;
            const { over, n, limit } = overLimit(post, c, settings);
            if (over) warnings.push(`${channelLabel(c)}: ${n}/${limit} characters.`);
        });
        return { line: i + 2, post, errors, warnings, file: imageName ? fileNames.get(imageName.toLowerCase()) ?? null : null };
    });
    return { header, items };
};

export const postsToCSV = (posts, channels, settings) => {
    const byId = Object.fromEntries(channels.map((c) => [c.id, c]));
    const rows = [["id", ...CSV_COLUMNS, "trackedLink", "liveLinks"]];
    posts.forEach((p) => {
        const ids = enabledChannelIds(p);
        const firstChannel = byId[ids[0]];
        rows.push([
            p.id,
            dayKey(p.scheduledAt),
            timeKey(p.scheduledAt),
            ids.map((id) => channelLabel(byId[id] ?? { name: id })).join(";"),
            p.title ?? "",
            p.caption ?? "",
            p.link ?? "",
            p.pillar ?? "",
            p.templateCode ?? "",
            p.media?.[0]?.name ?? "",
            p.status ?? "",
            firstChannel ? trackedUrl(p, firstChannel, settings) : "",
            Object.values(p.results ?? {}).map((r) => r?.url).filter(Boolean).join(" "),
        ]);
    });
    return toCSV(rows);
};

export const downloadText = (name, text, type = "text/csv;charset=utf-8") => {
    const url = URL.createObjectURL(new Blob([text], { type }));
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
};

// Import checked CSV items: uploads matched images, then writes the posts (new ids, never overwrites)
export const importCsvItems = async (items, user, onProgress) => {
    const [db, { collection, doc, serverTimestamp, Timestamp }] = await fs();
    const ops = [];
    let done = 0;
    for (const item of items) {
        const id = doc(collection(db, "socialPosts")).id;
        const media = item.file ? [await uploadMedia(id, item.file)] : [];
        const { scheduledAt, ...p } = item.post;
        ops.push({
            type: "set",
            collection: "socialPosts",
            id,
            data: {
                ...p,
                media,
                scheduledAt: scheduledAt ? Timestamp.fromDate(scheduledAt) : null,
                ...(p.status === "approved" ? { approvedBy: user?.email ?? null } : {}),
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                createdBy: user?.email ?? null,
                updatedBy: user?.email ?? null,
            },
        });
        done += 1;
        onProgress?.(done, items.length);
    }
    return commitInBatches(ops);
};

// ── Results: leads that arrived through a post's tracked link ───────────────────────────
// Every lead stores `source: { first, last, page }` (src/lib/attribution.js); we match the last
// touch's campaign (utm_campaign) and, where present, content (utm_content = post id).
export const LEAD_COLLECTIONS = { messages: "Messages", quotes: "Quotes", investorLeads: "Investor leads", subscribers: "Subscribers", clicks: "Contact taps" };

export const fetchLeadsByCampaign = async (campaigns) => {
    const [db, { collection, query, where, getDocs }] = await fs();
    const list = [...new Set(campaigns.filter(Boolean))];
    const out = { leads: [], errors: {} };
    for (const name of Object.keys(LEAD_COLLECTIONS)) {
        for (let i = 0; i < list.length; i += 30) {
            try {
                const snap = await getDocs(query(collection(db, name), where("source.last.campaign", "in", list.slice(i, i + 30))));
                snap.docs.forEach((d) => out.leads.push({ id: d.id, collection: name, ...d.data() }));
            } catch (e) {
                out.errors[name] = e.code === "permission-denied" ? "no access" : e.message;
                break;
            }
        }
    }
    return out;
};
