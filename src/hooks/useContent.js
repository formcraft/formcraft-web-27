import { useEffect, useMemo, useState } from "react";
import { CONTENT } from "../data/content";
import { listRest, restReady } from "../lib/firestoreRest";
import { readJSON, writeJSON } from "../lib/storage";
import { useDeviceState } from "./useHydration";
import { useAuth } from "./useAuth";

// Site content (products, templates, projects, posts, courses, events, developments).
// Stale-while-revalidate: shows the cached list (or the local starter data) at once, then fetches
// the Firestore collection over REST in the background. If Firestore has any documents for the
// collection, they replace the local starter data. Items with active === false are hidden from
// visitors; admins see them (marked `hidden`).
const memory = new Map(); // collection → items, shared by every component this visit
const inflight = new Map();
const TTL = 5 * 60 * 1000; // refetch at most every 5 minutes per visit
const fetchedAt = new Map();
// The starter lists, loaded up front for pre-rendered pages (see preloadStarters): the build renders with them, and
// React's first render in the browser must show exactly the same, so they have to be there before it starts.
const starters = new Map();
const tidy = (item) => ({ ...item, slug: item.slug || item.id, id: item.id || item.slug });

/**
 * Loads every content list's starter data (src/data/) so the first render can show it without waiting. Called by
 * src/entry-server.jsx before building pages, and by main.jsx before adopting a pre-rendered page.
 * @returns {Promise<void>}
 */
export const preloadStarters = async () => {
    await Promise.all(
        Object.entries(CONTENT).map(async ([name, def]) => {
            if (!starters.has(name)) starters.set(name, ((await def.local().catch(() => [])) ?? []).map(tidy));
        })
    );
};

const load = async (name) => {
    const def = CONTENT[name];
    const local = (await def.local().catch(() => [])) ?? [];
    let remote = [];
    if (restReady()) {
        try {
            remote = await listRest(name);
        } catch (error) {
            console.warn(`Couldn't load ${name}; showing the starter data.`, error);
            const cached = readJSON(`fc-content-${name}`, null);
            if (cached) return cached;
        }
    }
    const items = (remote.length ? remote : local).map(tidy);
    memory.set(name, items);
    fetchedAt.set(name, Date.now());
    writeJSON(`fc-content-${name}`, items);
    return items;
};

/** Fetches a content list again straight away (after the admin saves a change). @param {string} name e.g. "products" */
export const refreshContent = (name) => {
    fetchedAt.delete(name);
    inflight.delete(name);
    return fetchContent(name);
};

const fetchContent = (name) => {
    if (memory.has(name) && Date.now() - (fetchedAt.get(name) ?? 0) < TTL) return Promise.resolve(memory.get(name));
    if (!inflight.has(name)) inflight.set(name, load(name).finally(() => inflight.delete(name)));
    return inflight.get(name);
};

/**
 * A list of site content (products, templates, projects, posts, courses, events, developments): shows the saved
 * copy or the starter data at once, then fetches the latest from Firestore.
 * @param {string} name  which list, a key of CONTENT in src/data/content.js
 * @returns {{ items: object[], loading: boolean }}  items hidden by the admin are left out for visitors (marked "hidden" for admins)
 */
export const useContent = (name) => {
    const { isAdmin } = useAuth();
    // the device's saved copy after hydration (useHydration.js); the build and the first render use the starter data
    // (preloadStarters), so a pre-rendered product, project or post page is complete in its HTML
    const [items, setItems] = useDeviceState(() => memory.get(name) ?? readJSON(`fc-content-${name}`, null) ?? starters.get(name) ?? null, starters.get(name) ?? null);
    const [loading, setLoading] = useState(!memory.has(name));

    useEffect(() => {
        let alive = true;
        fetchContent(name).then((list) => {
            if (!alive) return;
            setItems(list);
            setLoading(false);
        });
        return () => {
            alive = false;
        };
    }, [name, setItems]);

    const visible = useMemo(
        () =>
            (items ?? [])
                .filter((item) => isAdmin || item.active !== false)
                .map((item) => (item.active === false ? { ...item, hidden: true } : item)),
        [items, isAdmin]
    );
    return { items: visible, loading: loading && !items };
};

// One item by slug (or id)
export const useContentItem = (name, slug) => {
    const { items, loading } = useContent(name);
    const item = items.find((i) => i.slug === slug || i.id === slug) ?? null;
    return { item, loading, items };
};
