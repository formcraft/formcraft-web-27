// useCopy(page): the text of a page as the team last published it in Admin → Copy, falling back to the
// built-in wording in src/data/copy.js. Signed-in team members can add ?preview=draft to the address to
// see unpublished drafts on the real page (visitors never can: drafts are team-only in the rules).
import { createElement, useEffect, useMemo, useSyncExternalStore } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "./useAuth";
import { copyItem, SIZED_KINDS } from "../data/copy";
import { draftItems, loadCopy, loadDraft, noItems, publishedItems, subscribeCopy } from "../lib/copyStore";
import { plainCopy, renderCopy } from "../lib/copyText";

// The text to show for one entry: an edit wins unless it's empty (empty = back to the built-in wording).
// Clipped a little past the limit, so even an edit written straight to the database can't break a layout.
const resolve = (entry, edit) => {
    const text = typeof edit?.text === "string" && edit.text.trim() ? edit.text.trim() : entry.text;
    return text.length > entry.max * 1.1 ? `${text.slice(0, Math.floor(entry.max * 1.1)).trimEnd()}…` : text;
};

/**
 * The editable text of a page.
 * @param {string} page  a page key in src/data/copy.js, e.g. "home"
 * @returns {((id: string) => import("react").ReactNode) & { str: (id: string) => string }}
 *   t(id): the text as React children (bold, italic, line breaks; wrapped for a size preset);
 *   t.str(id): plain text, for alt text, aria-labels and titles.
 * @example
 *   const t = useCopy("home");
 *   <p className="lead">{t("heroLead")}</p>
 *   <img alt={t.str("bimModelAlt")} … />
 */
export const useCopy = (page) => {
    const { isAdmin } = useAuth();
    const { search } = useLocation();
    const preview = isAdmin && new URLSearchParams(search).get("preview") === "draft";
    // the third function is for pre-rendered pages: the build (and React adopting its HTML) shows the built-in
    // wording, then the device's saved edits follow straight after (useHydration.js)
    const items = useSyncExternalStore(subscribeCopy, () => publishedItems(page), noItems);
    const draft = useSyncExternalStore(subscribeCopy, () => (preview ? draftItems(page) : null), () => null);

    useEffect(() => loadCopy(page), [page]);
    useEffect(() => {
        if (preview) loadDraft(page).catch((error) => console.warn("Couldn't load the drafts.", error));
    }, [preview, page]);

    return useMemo(() => {
        const edits = draft ? { ...items, ...draft } : items;
        const lookup = (id) => {
            const entry = copyItem(page, id);
            if (!entry) {
                if (import.meta.env.DEV) console.warn(`useCopy: "${id}" isn't in the ${page} register (src/data/copy.js).`);
                return { entry: null, text: id };
            }
            return { entry, text: resolve(entry, edits[id]), size: edits[id]?.size };
        };
        const t = (id) => {
            const { entry, text, size } = lookup(id);
            const node = renderCopy(text);
            return entry && SIZED_KINDS.includes(entry.kind) && (size === "sm" || size === "lg") ? createElement("span", { className: `copy-${size}` }, node) : node;
        };
        t.str = (id) => plainCopy(lookup(id).text);
        return t;
    }, [page, items, draft]);
};
