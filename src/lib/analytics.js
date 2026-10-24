// Analytics only after the visitor says yes (ConsentBanner). Until then track() does nothing and
// Firebase Analytics isn't even downloaded. Production builds with a measurement id only.
import { app, firebaseConfigured } from "../config/firebase";
import { readJSON, writeJSON } from "./storage";

const env = import.meta.env;
const KEY = "fc-consent"; // { analytics: true|false, at }
const OPEN_EVENT = "fc-consent-open";

const enabled = () => Boolean(env.PROD && firebaseConfigured && env.VITE_FIREBASE_MEASUREMENT_ID);

let consent = readJSON(KEY, null)?.analytics ?? null; // null = not asked yet
let loading = null;

const load = () => {
    if (!enabled()) return null;
    loading ??= import("firebase/analytics")
        .then(async ({ getAnalytics, isSupported, logEvent, setAnalyticsCollectionEnabled }) => {
            if (!(await isSupported())) return null;
            const analytics = getAnalytics(app);
            return { analytics, logEvent, setAnalyticsCollectionEnabled };
        })
        .catch(() => null);
    return loading;
};

// true / false once answered, null before
export const getConsent = () => consent;

export const setConsent = (yes) => {
    consent = Boolean(yes);
    writeJSON(KEY, { analytics: consent, at: new Date().toISOString() });
    if (consent) {
        load()?.then((a) => a?.setAnalyticsCollectionEnabled(a.analytics, true));
    } else if (loading) {
        // already loaded this visit (they said yes, then changed their mind): stop collecting
        loading.then((a) => a?.setAnalyticsCollectionEnabled(a.analytics, false));
    }
};

// Start Analytics on page load when the visitor said yes on an earlier visit
export const initAnalytics = () => {
    if (consent === true) load();
};

// Fire and forget; never throws, never blocks
export const track = (name, params = {}) => {
    if (consent !== true) return;
    load()?.then((a) => {
        try {
            a?.logEvent(a.analytics, name, params);
        } catch {
            // analytics is never allowed to break the page
        }
    });
};

// "Cookie settings" in the footer reopens the banner
export const openConsent = () => window.dispatchEvent(new Event(OPEN_EVENT));
export const onConsentOpen = (callback) => {
    window.addEventListener(OPEN_EVENT, callback);
    return () => window.removeEventListener(OPEN_EVENT, callback);
};
