// Where visitors came from (tagged links from Instagram, TikTok, LinkedIn, WhatsApp, campaigns…).
// `first` is the first touch on this device and is never overwritten; `last` is replaced when a
// new tagged link (utm_*) or an outside referrer arrives. Both live in localStorage (via
// lib/storage.js, so it works with storage blocked) and are attached to every lead as `source`.
// Click ids (fbclid, gclid) are never stored, only the fact that one was present.
import { readJSON, writeJSON } from "./storage";

const KEY = "fc-source";
const MAX = 100;
const UTM = ["source", "medium", "campaign", "content", "term"];

const clip = (v) => (v == null ? "" : String(v).trim().slice(0, MAX));

let state = null; // { first, last } for this visit

const referrerHost = () => {
    try {
        if (!document.referrer) return "";
        const host = new URL(document.referrer).hostname.replace(/^www\./, "");
        return host === window.location.hostname.replace(/^www\./, "") ? "" : host;
    } catch {
        return "";
    }
};

// A known click id tells us the platform even without utm tags
const CLICK_IDS = [
    ["fbclid", "facebook"],
    ["gclid", "google"],
    ["ttclid", "tiktok"],
    ["li_fat_id", "linkedin"],
];

const readTouch = () => {
    const params = new URLSearchParams(window.location.search);
    const touch = {};
    UTM.forEach((k) => {
        const v = clip(params.get(`utm_${k}`));
        if (v) touch[k] = v;
    });
    const clickId = CLICK_IDS.find(([k]) => params.has(k));
    if (clickId) {
        touch.clickId = clickId[0];
        if (!touch.source) touch.source = clickId[1];
        if (!touch.medium) touch.medium = clickId[0] === "gclid" ? "cpc" : "paid-social";
    }
    const referrer = referrerHost();
    if (referrer) touch.referrer = clip(referrer);
    const tagged = Boolean(touch.source || touch.campaign);
    if (!tagged && referrer) {
        touch.source = referrer;
        touch.medium = "referral";
    }
    return { touch, isNew: tagged || Boolean(referrer) };
};

// Called once from Layout on the first page load.
export const initAttribution = () => {
    if (state || typeof window === "undefined") return;
    const saved = readJSON(KEY, null) ?? {};
    const { touch, isNew } = readTouch();
    const now = new Date().toISOString();
    const stamped = { ...touch, landing: clip(window.location.pathname), at: now };
    const direct = { source: "direct", landing: clip(window.location.pathname), at: now };
    const first = saved.first ?? (isNew ? stamped : direct);
    const last = isNew ? stamped : saved.last ?? first;
    state = { first, last };
    writeJSON(KEY, state);
};

const compact = (t) => {
    if (!t) return null;
    const out = {};
    ["source", "medium", "campaign", "content", "term", "referrer", "landing", "at"].forEach((k) => {
        const v = clip(t[k]);
        if (v) out[k] = v;
    });
    if (t.clickId) out.clickId = clip(t.clickId);
    return out;
};

// { first: {source, medium, campaign, content, term, referrer, landing, at}, last: {…}, page }
export const getSource = () => {
    if (!state) initAttribution();
    const s = state ?? readJSON(KEY, null) ?? {};
    return {
        first: compact(s.first),
        last: compact(s.last),
        page: clip(typeof window === "undefined" ? "" : window.location.pathname),
    };
};

// A one-word summary for charts: last touch first, then first touch
export const sourceLabel = (source) => source?.last?.source || source?.first?.source || "direct";
