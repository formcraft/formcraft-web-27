import { useEffect, useMemo, useState } from "react";
import { CONTENT } from "../data/content";
import { listRest, restReady } from "../lib/firestoreRest";
import { readJSON, writeJSON } from "../lib/storage";
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
    const items = (remote.length ? remote : local).map((item) => ({ ...item, slug: item.slug || item.id, id: item.id || item.slug }));
    memory.set(name, items);
    fetchedAt.set(name, Date.now());
    writeJSON(`fc-content-${name}`, items);
    return items;
};

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

export const useContent = (name) => {
    const { isAdmin } = useAuth();
    const [items, setItems] = useState(() => memory.get(name) ?? readJSON(`fc-content-${name}`, null));
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
    }, [name]);

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
