import { useCallback, useEffect, useMemo, useState } from "react";
import { SiteContext } from "./contexts";
import { useAuth } from "../hooks/useAuth";
import { getDb } from "../config/firebase";
import { getDocRest, restReady } from "../lib/firestoreRest";
import { PAGES, defaultVisibility, pageByKey } from "../data/pages";
import { readJSON, writeJSON } from "../lib/storage";

// Which pages visitors can see. Firestore `settings/site` { pages: { key: bool } }, read over REST
// (no SDK on public pages) and cached in localStorage so the next visit knows straight away.
// Admins change it from /admin; firestore.rules lets only admins write it.
const CACHE = "fc-site-pages";

export const SiteProvider = ({ children }) => {
    const { isAdmin } = useAuth();
    const [stored, setStored] = useState(() => readJSON(CACHE, null));
    const [loading, setLoading] = useState(restReady());

    useEffect(() => {
        if (!restReady()) return undefined;
        const controller = new AbortController();
        getDocRest("settings/site", controller.signal)
            .then((doc) => {
                const pages = doc?.pages ?? {};
                setStored(pages);
                writeJSON(CACHE, pages);
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

    const setPage = useCallback(
        async (key, on) => {
            if (!isAdmin) throw new Error("Only admins can change which pages are shown.");
            if (pageByKey(key)?.locked) return;
            const previous = stored;
            const next = { ...(stored ?? {}), [key]: on };
            setStored(next);
            writeJSON(CACHE, next);
            try {
                const [db, { doc, setDoc, serverTimestamp }] = await Promise.all([getDb(), import("firebase/firestore")]);
                await setDoc(doc(db, "settings", "site"), { pages: { [key]: on }, updatedAt: serverTimestamp() }, { merge: true });
            } catch (error) {
                setStored(previous);
                writeJSON(CACHE, previous);
                throw error;
            }
        },
        [isAdmin, stored]
    );

    const value = useMemo(
        () => ({
            visibility,
            loading,
            isAdmin,
            isOn: (key) => visibility[key] !== false,
            canSee: (key) => isAdmin || visibility[key] !== false,
            setPage,
        }),
        [visibility, loading, isAdmin, setPage]
    );

    return <SiteContext.Provider value={value}>{children}</SiteContext.Provider>;
};
