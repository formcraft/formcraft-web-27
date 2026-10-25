// Marketing studio: publishing through Buffer (optional; off until the owner connects Buffer).
// Imported from index.js:  export { bufferChannels, publishApprovedPosts } from "./studio.js";
//
// - bufferChannels (callable, marketing/admin): lists the Buffer channels so Admin → Studio →
//   Channels can map each Formcraft channel to its Buffer channel id.
// - publishApprovedPosts (every 15 min): sends approved posts whose channels use publish:"buffer"
//   to Buffer at their scheduled time, stores Buffer's post ids in results[channelId] and sets the
//   post to "scheduled" (or "failed" with the reason). Does nothing unless settings/studio
//   .bufferConnected is true and the BUFFER_TOKEN secret is set.
//
// Buffer API (developers.buffer.com, read 2026-10-24): GraphQL at https://api.buffer.com, header
// `Authorization: Bearer <API key>`. Organisations: `account { organizations { id name } }`.
// Channels: `channels(input: { organizationId }) { id name displayName service avatar isQueuePaused }`.
// Posts: `createPost(input: { text, channelId, schedulingType: automatic, mode: customScheduled,
// dueAt: "<ISO UTC>", assets: [{ image: { url } } | { video: { url } }], metadata })` returning
// `... on PostActionSuccess { post { id dueAt } } ... on MutationError { message }`.
// Instagram metadata: `{ instagram: { type: post|story|reel, shouldShareToFeed: true } }`.
// Media URLs must be public (Storage download URLs from the composer are).
//
// TODO (not in the docs we read): Pinterest needs a board (PostInputMetaData) — Pinterest channels
// are marked failed with a message until that's added; TikTok/YouTube may need metadata too, in
// which case Buffer's MutationError message is stored on the post. Editing a post after it's been
// sent does not update Buffer: change it in Buffer too.
import { getFirestore, FieldValue, Timestamp } from "firebase-admin/firestore";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { defineSecret } from "firebase-functions/params";
import { logger } from "firebase-functions";

const BUFFER_TOKEN = defineSecret("BUFFER_TOKEN");
// This module is evaluated before index.js runs setGlobalOptions(), so the region is set here too.
// TODO: keep in step with index.js (same region as the Firestore database; open question).
const REGION = process.env.FUNCTIONS_REGION || "africa-south1";
const API = "https://api.buffer.com";
// Same domain as src/data/seo.js SITE_URL; SITE_URL in functions/.env overrides it.
const SITE_URL = String(process.env.SITE_URL || "https://formcraftdesignconstruction.com").replace(/\/+$/, "");

// The app is initialised in index.js; Firestore is fetched lazily so import order doesn't matter.
const db = () => getFirestore();

// ---------- GraphQL literals (the docs show inline arguments, so we build them safely) ----------
class Enum {
    constructor(name) {
        this.name = name;
    }
}
const literal = (v) => {
    if (v instanceof Enum) return v.name;
    if (v === null || v === undefined) return "null";
    if (typeof v === "string") return JSON.stringify(v);
    if (typeof v === "number" || typeof v === "boolean") return String(v);
    if (Array.isArray(v)) return `[${v.map(literal).join(", ")}]`;
    return `{ ${Object.entries(v)
        .filter(([, x]) => x !== undefined)
        .map(([k, x]) => `${k}: ${literal(x)}`)
        .join(", ")} }`;
};

const gql = async (token, query) => {
    const res = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ query }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok || body.errors?.length) {
        const msg = body.errors?.map((e) => e.message).join("; ") || `HTTP ${res.status}`;
        throw new Error(`Buffer: ${msg}`);
    }
    return body.data;
};

const isMarketing = (token) => token?.admin === true || token?.role === "marketing";

// ---------- bufferChannels ----------
export const bufferChannels = onCall({ region: REGION, secrets: [BUFFER_TOKEN] }, async (req) => {
    if (!isMarketing(req.auth?.token)) throw new HttpsError("permission-denied", "Marketing or admin only.");
    const token = BUFFER_TOKEN.value();
    if (!token) throw new HttpsError("failed-precondition", "BUFFER_TOKEN isn't set (firebase functions:secrets:set BUFFER_TOKEN).");
    try {
        const { account } = await gql(token, "query { account { organizations { id name } } }");
        const channels = [];
        for (const org of account?.organizations ?? []) {
            const data = await gql(token, `query { channels(input: { organizationId: ${literal(org.id)} }) { id name displayName service avatar isQueuePaused } }`);
            (data?.channels ?? []).forEach((c) => channels.push({ ...c, organizationId: org.id, organization: org.name }));
        }
        return { channels };
    } catch (e) {
        throw new HttpsError("unavailable", e.message);
    }
});

// ---------- caption and link (same rules as src/lib/studio.js) ----------
const slug = (t) =>
    String(t ?? "")
        .toLowerCase()
        .normalize("NFKD")
        .replace(/[̀-ͯ]/g, "")
        .replace(/[^\w\s-]/g, "")
        .trim()
        .replace(/[\s_]+/g, "-")
        .replace(/-+/g, "-")
        .slice(0, 60);

const campaignOf = (post, settings) => {
    if (post.campaign) return slug(post.campaign);
    const prefix = settings.campaignPrefix ? `${slug(settings.campaignPrefix)}-` : "";
    if (post.occasionId) return `${prefix}${post.occasionId}${post.occasionYear ? `-${post.occasionYear}` : ""}`;
    return `${prefix}${slug(post.pillar || post.title || "social")}`;
};

const trackedUrl = (post, postId, channel, settings) => {
    const raw = String(post.link ?? "").trim();
    if (!raw) return "";
    let url;
    try {
        url = new URL(raw.startsWith("/") ? `${SITE_URL}${raw}` : raw);
    } catch {
        return raw;
    }
    const ours = raw.startsWith("/") || new URL(SITE_URL).hostname.replace(/^www\./, "") === url.hostname.replace(/^www\./, "");
    if (!ours) return url.toString();
    url.searchParams.set("utm_source", channel.platform && channel.platform !== "other" ? channel.platform : slug(channel.name) || "social");
    url.searchParams.set("utm_medium", "social");
    url.searchParams.set("utm_campaign", campaignOf(post, settings));
    url.searchParams.set("utm_content", postId);
    return url.toString();
};

const captionFor = (post, postId, channel, settings) => {
    const own = post.perChannel?.[channel.id]?.caption;
    return [String(own || post.caption || "").trim(), String(post.hashtags ?? "").trim(), trackedUrl(post, postId, channel, settings)].filter(Boolean).join("\n\n");
};

const metadataFor = (channel, format) => {
    if (channel.platform === "instagram") {
        const type = format === "story" ? "story" : format === "reel" ? "reel" : "post";
        return { instagram: type === "post" ? { type: new Enum("post"), shouldShareToFeed: true } : { type: new Enum(type) } };
    }
    return undefined;
};

const createBufferPost = async (token, { text, channelId, dueAt, media, metadata }) => {
    const assets = (media ?? []).filter((m) => m?.url).map((m) => (m.kind === "video" ? { video: { url: m.url } } : { image: { url: m.url } }));
    const input = {
        text,
        channelId,
        schedulingType: new Enum("automatic"),
        mode: new Enum("customScheduled"),
        dueAt,
        ...(assets.length ? { assets } : {}),
        ...(metadata ? { metadata } : {}),
    };
    const data = await gql(token, `mutation { createPost(input: ${literal(input)}) { ... on PostActionSuccess { post { id dueAt } } ... on MutationError { message } } }`);
    const r = data?.createPost ?? {};
    if (r.post?.id) return { id: r.post.id, dueAt: r.post.dueAt ?? dueAt };
    throw new Error(r.message || "Buffer didn't accept the post.");
};

// ---------- publishApprovedPosts ----------
export const publishApprovedPosts = onSchedule({ region: REGION, schedule: "every 15 minutes", timeZone: "Africa/Kampala", secrets: [BUFFER_TOKEN], timeoutSeconds: 300 }, async () => {
    const settingsSnap = await db().doc("settings/studio").get();
    const settings = settingsSnap.exists ? settingsSnap.data() : {};
    if (!settings.bufferConnected) {
        logger.info("Buffer not connected (settings/studio.bufferConnected is false); nothing to do.");
        return;
    }
    const token = BUFFER_TOKEN.value();
    if (!token) {
        logger.warn("BUFFER_TOKEN secret is empty; nothing sent.");
        return;
    }

    const channelSnap = await db().collection("socialChannels").get();
    const channels = Object.fromEntries(channelSnap.docs.map((d) => [d.id, { id: d.id, ...d.data() }]));
    const buffered = (id) => channels[id]?.active !== false && channels[id]?.publish === "buffer";

    const horizon = Timestamp.fromMillis(Date.now() + 60 * 24 * 60 * 60 * 1000);
    const posts = await db().collection("socialPosts").where("status", "==", "approved").where("scheduledAt", "<=", horizon).orderBy("scheduledAt").limit(100).get();

    for (const docSnap of posts.docs) {
        const ref = docSnap.ref;
        const post = docSnap.data();
        const enabled = Object.entries(post.perChannel ?? {}).filter(([, v]) => v?.enabled).map(([k]) => k);
        const targets = enabled.filter((id) => buffered(id) && !post.results?.[id]?.bufferId && !["sending", "failed", "published"].includes(post.results?.[id]?.status));
        if (!targets.length) continue;
        const due = post.scheduledAt?.toDate?.();

        for (const cid of targets) {
            const channel = channels[cid];
            // claim this channel so an overlapping run can't send it twice
            const claimed = await db().runTransaction(async (tx) => {
                const fresh = await tx.get(ref);
                const r = fresh.data()?.results?.[cid];
                if (fresh.data()?.status !== "approved" || r?.bufferId || r?.status === "sending") return false;
                tx.update(ref, { [`results.${cid}`]: { status: "sending", at: FieldValue.serverTimestamp(), error: null } });
                return true;
            });
            if (!claimed) continue;

            let result;
            try {
                if (!channel.bufferChannelId) throw new Error("No Buffer channel id on this channel (Admin → Studio → Channels).");
                if (!due || due.getTime() < Date.now() + 2 * 60 * 1000) throw new Error("The scheduled time had passed before Buffer could take it. Post it by hand from the Queue.");
                if (channel.platform === "pinterest") throw new Error("Pinterest through Buffer needs a board, which isn't set up yet. Post it by hand."); // TODO
                const sent = await createBufferPost(token, {
                    text: captionFor(post, docSnap.id, channel, settings),
                    channelId: channel.bufferChannelId,
                    dueAt: due.toISOString(),
                    media: post.media,
                    metadata: metadataFor(channel, post.perChannel?.[cid]?.format),
                });
                result = { status: "scheduled", bufferId: sent.id, dueAt: sent.dueAt, at: FieldValue.serverTimestamp(), error: null };
            } catch (e) {
                logger.warn(`Buffer send failed for ${docSnap.id}/${cid}`, e.message);
                result = { status: "failed", at: FieldValue.serverTimestamp(), error: String(e.message).slice(0, 500) };
            }
            await ref.update({ [`results.${cid}`]: result });
            post.results = { ...(post.results ?? {}), [cid]: result };
        }

        // whole-post status: failed if any Buffer channel failed (shows in the Queue to post by hand);
        // scheduled once every enabled channel is with Buffer; otherwise stays approved for the manual ones
        const states = enabled.map((id) => post.results?.[id]?.status);
        const anyFailed = enabled.some((id) => buffered(id) && post.results?.[id]?.status === "failed");
        const allScheduled = enabled.length > 0 && states.every((s) => s === "scheduled" || s === "published");
        if (anyFailed || allScheduled) await ref.update({ status: anyFailed ? "failed" : "scheduled", updatedAt: FieldValue.serverTimestamp(), updatedBy: "buffer" });
    }
});
