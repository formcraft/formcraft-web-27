// Where the site's edited text comes from (Admin → Copy). One small Firestore document per page:
// - `copy/{page}`: published text, public. Read over REST (no Firestore SDK on public pages), once per
//   visit, and saved on the visitor's device so the next visit shows it straight away.
// - `copyDrafts/{page}`: unpublished edits, team only. Read with the SDK, only when a team member opens a
//   page with ?preview=draft.
// Both hold { items: { [id]: { text, size } } }. Pages read this through useCopy() (src/hooks/useCopy.js).
// The layout starts the read for the current page as soon as the route is known (Layout.jsx), so the text
// usually arrives before the page's own code does.
import { getDb } from "../config/firebase";
import { getDocRest, restReady } from "./firestoreRest";
import { readJSON, writeJSON } from "./storage";
import { COPY } from "../data/copy";

const EMPTY = Object.freeze({});
const published = new Map(); // page → items (frozen; replaced on change, so React can compare by reference)
const drafts = new Map();
const requested = new Set();
const listeners = new Set();
const cacheKey = (page) => `fc-copy-${page}`;

const notify = () => listeners.forEach((fn) => fn());

/** Calls back whenever any page's text changes. @returns {() => void} stop listening */
export const subscribeCopy = (fn) => {
    listeners.add(fn);
    return () => listeners.delete(fn);
};

/** The published edits for a page (from this visit's read, else the device's saved copy). */
export const publishedItems = (page) => {
    if (!published.has(page)) published.set(page, Object.freeze(readJSON(cacheKey(page), null) ?? EMPTY));
    return published.get(page);
};

/** What the build renders, and React's first render when it adopts a pre-rendered page: no edits yet. */
export const noItems = () => EMPTY;

/** The unpublished edits for a page, once loadDraft() has read them (team preview only). */
export const draftItems = (page) => drafts.get(page) ?? EMPTY;

/** Fetches a page's published text once per visit (safe to call often). Pages not in the register are ignored. */
export const loadCopy = (page) => {
    if (!page || !COPY[page] || requested.has(page) || !restReady()) return;
    requested.add(page);
    getDocRest(`copy/${page}`)
        .then((doc) => {
            const items = Object.freeze(doc?.items ?? {});
            writeJSON(cacheKey(page), items);
            if (JSON.stringify(items) !== JSON.stringify(publishedItems(page))) {
                published.set(page, items);
                notify();
            }
        })
        .catch((error) => console.warn(`Couldn't read the text for ${page}; using the built-in wording.`, error));
};

/** Reads a page's drafts (team members only; the rules refuse anyone else). */
export const loadDraft = async (page) => {
    const [db, { doc, getDoc }] = await Promise.all([getDb(), import("firebase/firestore")]);
    const snap = await getDoc(doc(db, "copyDrafts", page));
    drafts.set(page, Object.freeze(snap.exists() ? snap.data().items ?? {} : {}));
    notify();
};

/** After Admin → Copy saves: show the new published text on this device straight away. */
export const setPublishedItems = (page, items) => {
    const next = Object.freeze({ ...items });
    published.set(page, next);
    writeJSON(cacheKey(page), next);
    notify();
};

/** After Admin → Copy saves a draft: update the preview on this device. */
export const setDraftItems = (page, items) => {
    drafts.set(page, Object.freeze({ ...items }));
    notify();
};
