// Contact clicks for the admin Leads screen: one delegated listener (installed once from Layout)
// notices taps on phone, WhatsApp, email and social links and on anything marked data-track="cta",
// and writes a small `clicks` document { type, target, page, source, createdAt } — at most once per
// link per page view. Fire and forget: navigation is never held up, and nothing is sent when
// Firebase isn't configured. Analytics gets a `contact_click` event too (only after consent).
// (The collection is `clicks`, not `events`: `events` already holds the Community workshops.)
import { firebaseConfigured } from "../config/firebase";
import { createDocRest } from "./firestoreRest";
import { getSource } from "./attribution";
import { track } from "./analytics";

const SOCIAL = /(^|\.)(instagram\.com|x\.com|twitter\.com|linkedin\.com|facebook\.com|fb\.com|tiktok\.com|pinterest\.com)$/i;
const WHATSAPP = /(^|\.)(wa\.me|api\.whatsapp\.com|chat\.whatsapp\.com)$/i;

const ready = () => firebaseConfigured || (import.meta.env.DEV && import.meta.env.VITE_USE_EMULATORS === "true");

const classify = (el) => {
    const cta = el.closest("[data-track='cta']");
    const link = el.closest("a[href]");
    if (link) {
        const href = link.getAttribute("href") ?? "";
        if (/^tel:/i.test(href)) return { type: "phone", target: href.split("?")[0] };
        if (/^mailto:/i.test(href)) return { type: "email", target: href.split("?")[0] };
        if (/^whatsapp:/i.test(href)) return { type: "whatsapp", target: href.split("?")[0] };
        try {
            const url = new URL(link.href);
            if (WHATSAPP.test(url.hostname)) return { type: "whatsapp", target: `${url.origin}${url.pathname}` };
            if (SOCIAL.test(url.hostname)) return { type: "social", target: `${url.origin}${url.pathname}` };
        } catch {
            // not a URL we understand
        }
    }
    if (cta) {
        const name = cta.dataset.trackTarget || cta.getAttribute("href") || cta.textContent;
        return { type: "cta", target: String(name ?? "").trim().split("?")[0] };
    }
    return null;
};

let seen = new Set();
let seenFor = "";
let installed = false;

const onClick = (event) => {
    const hit = event.target instanceof Element ? classify(event.target) : null;
    if (!hit || !hit.target) return;
    const page = window.location.pathname;
    if (seenFor !== page) {
        seen = new Set();
        seenFor = page;
    }
    const key = `${hit.type}|${hit.target}`;
    if (seen.has(key)) return;
    seen.add(key);
    const target = hit.target.slice(0, 300);
    track("contact_click", { type: hit.type, target });
    if (!ready()) return;
    createDocRest("clicks", { type: hit.type, target, page: page.slice(0, 200), source: getSource() }).catch(() => {
        // a lost click count is fine; never bother the visitor
    });
};

export const installClickTracking = () => {
    if (installed || typeof document === "undefined") return;
    installed = true;
    document.addEventListener("click", onClick, { capture: true, passive: true });
};
