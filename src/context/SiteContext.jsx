import { useCallback, useEffect, useMemo, useState } from "react";
import { SiteContext } from "./contexts";
import { useAuth } from "../hooks/useAuth";
import { getDb } from "../config/firebase";
import { getDocRest, restReady } from "../lib/firestoreRest";
import { PAGES, defaultVisibility, pageByKey } from "../data/pages";
import { CONTACT_DEFAULTS } from "../data/contact";
import { readJSON, writeJSON } from "../lib/storage";
import { MOTION_CACHE, MOTION_DEFAULTS, applyMotion, clampMotion, mergeMotion } from "../data/motion";
import { FEATURES, FEATURES_CACHE, mergeFeatures } from "../data/features";

// Site settings from Firestore `settings/site`, read over REST (no SDK on public pages) and cached in
// localStorage so the next visit knows straight away:
// - `pages`: { key: bool } — which pages visitors can see (Admin → Pages)
// - `details`: { whatsapp, phone, email, address, hours, instagram, x, linkedin, tiktok, facebook,
//   pinterest } — public contact details (Admin → Site details), merged over src/data/contact.js
// - `motion`: { intro, tear, build, reveal } — animation time scales (Admin → Motion), see src/data/motion.js
// - `features`: { key: bool } — features switched on or off (Admin → Features), see src/data/features.js
// firestore.rules let only the team write it.
const CACHE = "fc-site-pages";
const DETAILS_CACHE = "fc-site-details";

// A saved key wins even when empty (so an admin can remove a default); empty means "not set" (null)
const mergeDetails = (saved) => {
    const out = { ...CONTACT_DEFAULTS };
    Object.keys(CONTACT_DEFAULTS).forEach((k) => {
        if (saved && k in saved) {
            const v = typeof saved[k] === "string" ? saved[k].trim() : saved[k];
            out[k] = v ? v : null;
        }
    });
    return out;
};

const writeSettings = async (data) => {
    const [db, { doc, setDoc, serverTimestamp }] = await Promise.all([getDb(), import("firebase/firestore")]);
    await setDoc(doc(db, "settings", "site"), { ...data, updatedAt: serverTimestamp() }, { merge: true });
};

/**
 * Wraps the app (App.jsx) and provides the admin's site settings: which pages are on, contact details and
 * animation speed, plus the functions the admin page uses to change them. Read it with useSite().
 */
export const SiteProvider = ({ children }) => {
    const { isAdmin } = useAuth();
    const [stored, setStored] = useState(() => readJSON(CACHE, null));
    const [savedDetails, setSavedDetails] = useState(() => readJSON(DETAILS_CACHE, null));
    const [savedMotion, setSavedMotion] = useState(() => readJSON(MOTION_CACHE, null));
    const [savedFeatures, setSavedFeatures] = useState(() => readJSON(FEATURES_CACHE, null));
    const [loading, setLoading] = useState(restReady());

    useEffect(() => {
        if (!restReady()) return undefined;
        const controller = new AbortController();
        getDocRest("settings/site", controller.signal)
            .then((doc) => {
                const pages = doc?.pages ?? {};
                setStored(pages);
                writeJSON(CACHE, pages);
                const details = doc?.details ?? {};
                setSavedDetails(details);
                writeJSON(DETAILS_CACHE, details);
                const motion = doc?.motion ?? {};
                setSavedMotion(motion);
                writeJSON(MOTION_CACHE, motion);
                const features = doc?.features ?? {};
                setSavedFeatures(features);
                writeJSON(FEATURES_CACHE, features);
            })
            .catch((error) => {
                if (error.name !== "AbortError") console.warn("Couldn't read site settings; using the defaults.", error);
            })
            .finally(() => setLoading(false));
        return () => controller.abort();
    }, []);

    const visibility = useMemo(() => {
        const merged = { ...defaultVisibility(), ...(stored ?? {}) };
        PAGES.forEach((p) => {
            if (p.locked) merged[p.key] = true;
        });
        return merged;
    }, [stored]);

    const details = useMemo(() => mergeDetails(savedDetails), [savedDetails]);
    const motion = useMemo(() => mergeMotion(savedMotion), [savedMotion]);
    const features = useMemo(() => mergeFeatures(savedFeatures), [savedFeatures]);
    useEffect(() => applyMotion(motion), [motion]);

    const setPage = useCallback(
        async (key, on) => {
            if (!isAdmin) throw new Error("Only the team can change which pages are shown.");
            if (pageByKey(key)?.locked) return;
            const previous = stored;
            const next = { ...(stored ?? {}), [key]: on };
            setStored(next);
            writeJSON(CACHE, next);
            try {
                await writeSettings({ pages: { [key]: on } });
            } catch (error) {
                setStored(previous);
                writeJSON(CACHE, previous);
                throw error;
            }
        },
        [isAdmin, stored]
    );

    // Merge-write some of the contact details (admin only; the rules check the claim too)
    const setDetails = useCallback(
        async (partial) => {
            if (!isAdmin) throw new Error("Only the team can change the site details.");
            const clean = Object.fromEntries(
                Object.entries(partial)
                    .filter(([k]) => k in CONTACT_DEFAULTS)
                    .map(([k, v]) => [k, typeof v === "string" ? v.trim().slice(0, 300) : v ?? ""])
            );
            const previous = savedDetails;
            const next = { ...(savedDetails ?? {}), ...clean };
            setSavedDetails(next);
            writeJSON(DETAILS_CACHE, next);
            try {
                await writeSettings({ details: clean });
            } catch (error) {
                setSavedDetails(previous);
                writeJSON(DETAILS_CACHE, previous);
                throw error;
            }
        },
        [isAdmin, savedDetails]
    );

    // Animation timing (admin only): { key: scale } merged into settings/site.motion
    const setMotion = useCallback(
        async (partial) => {
            if (!isAdmin) throw new Error("Only the team can change the animation timing.");
            const clean = Object.fromEntries(Object.entries(partial).filter(([k]) => k in MOTION_DEFAULTS).map(([k, v]) => [k, clampMotion(v)]));
            const previous = savedMotion;
            const next = { ...(savedMotion ?? {}), ...clean };
            setSavedMotion(next);
            writeJSON(MOTION_CACHE, next);
            try {
                await writeSettings({ motion: clean });
            } catch (error) {
                setSavedMotion(previous);
                writeJSON(MOTION_CACHE, previous);
                throw error;
            }
        },
        [isAdmin, savedMotion]
    );

    // Switch one feature on or off (admin only): merged into settings/site.features
    const setFeature = useCallback(
        async (key, on) => {
            if (!isAdmin) throw new Error("Only the team can switch features.");
            if (!FEATURES.some((f) => f.key === key)) return;
            const previous = savedFeatures;
            const next = { ...(savedFeatures ?? {}), [key]: Boolean(on) };
            setSavedFeatures(next);
            writeJSON(FEATURES_CACHE, next);
            try {
                await writeSettings({ features: { [key]: Boolean(on) } });
            } catch (error) {
                setSavedFeatures(previous);
                writeJSON(FEATURES_CACHE, previous);
                throw error;
            }
        },
        [isAdmin, savedFeatures]
    );

    const value = useMemo(
        () => ({
            visibility,
            loading,
            isAdmin,
            isOn: (key) => visibility[key] !== false,
            canSee: (key) => isAdmin || visibility[key] !== false,
            setPage,
            details,
            setDetails,
            motion,
            setMotion,
            features,
            setFeature,
        }),
        [visibility, loading, isAdmin, setPage, details, setDetails, motion, setMotion, features, setFeature]
    );

    return <SiteContext.Provider value={value}>{children}</SiteContext.Provider>;
};
