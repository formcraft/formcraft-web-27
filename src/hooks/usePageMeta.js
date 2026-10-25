// usePageMeta: sets each page's title, description, link-preview tags and search hints (details below the imports).
import { useEffect, useSyncExternalStore } from "react";
import { useLocation } from "react-router-dom";
import { DEFAULT_OG_IMAGE, ROUTES, SITE_URL, absUrl, imagePath, metaForPath, metaText, pageTitle } from "../data/seo";
import { COPY, copyItem } from "../data/copy";
import { pageForPath } from "../data/pages";
import { noItems, publishedItems, subscribeCopy } from "../lib/copyStore";
import { plainCopy } from "../lib/copyText";

const NONE = Object.freeze({});
// A published title or description from Admin → Copy (plain text, within the register's limit), or null
const edited = (edits, page, id) => {
    const text = plainCopy(edits[id]?.text ?? "").trim();
    const max = copyItem(page, id)?.max ?? 160;
    return text ? text.slice(0, max) : null;
};

// Each route sets its own <title>, meta description, canonical link, Open Graph / Twitter tags
// and robots. src/data/seo.js is the source of truth for static routes: the build writes the same
// head into dist/<route>.html (scripts/seo-pages.mjs), so the live page and the pre-built HTML agree.
//
//   usePageMeta(title, description)                         title format: "<title> · Formcraft"
//   usePageMeta(title, description, { image, noindex, canonical })
//
// - Static routes (/studio, /stores, …): a title or description published in Admin → Copy wins, then the
//   title, description and preview image from seo.js, unless the call sets `noindex` (a special state
//   such as "not open yet"), which keeps its own title. The build bakes published edits in too
//   (scripts/seo-pages.mjs), so the pre-built head matches from the next build.
// - Detail and other pages: the title and description passed in ("TODO: …" notes are left out);
//   with no description or image, the site's default ones (never the previous page's).
// - `image`: a path, URL or images[] entry ("chair", { name, alt }). `canonical`: a path or URL;
//   default is SITE_URL + the current path without the query string.
const upsert = (selector, make) => {
    let el = document.head.querySelector(selector);
    if (!el) {
        el = make();
        document.head.appendChild(el);
    }
    return el;
};
const setMeta = (attr, key, content) => {
    const el = upsert(`meta[${attr}="${key}"]`, () => {
        const m = document.createElement("meta");
        m.setAttribute(attr, key);
        return m;
    });
    el.setAttribute("content", content);
};
const removeMeta = (attr, key) => document.head.querySelector(`meta[${attr}="${key}"]`)?.remove();

/**
 * Sets the page's title, description, link-preview tags and search-engine hints. Call it once at the top of a page.
 * On the public pages, the values in src/data/seo.js win, so the live page matches its pre-built HTML file.
 * @param {string|null} title        the page's own title ("Stores"); null on Home
 * @param {string} [description]    one sentence, up to about 155 characters
 * @param {{ image?: string|object, noindex?: boolean, canonical?: string }} [options]
 *   image: the link-preview picture; noindex: keep it out of search results; canonical: the preferred address
 */
export const usePageMeta = (title, description, options = {}) => {
    const { pathname } = useLocation();
    const { noindex = false, canonical } = options ?? {};
    const image = options?.image ? imagePath(options.image) : null;
    const page = pageForPath(pathname)?.key;
    const edits = useSyncExternalStore(subscribeCopy, () => (page && COPY[page] ? publishedItems(page) : NONE), noItems);

    useEffect(() => {
        const route = noindex ? null : metaForPath(pathname);
        // copy edits only on the page's own address, never on detail pages under it
        const own = route && route.key === page;
        const titleEdit = own ? edited(edits, page, "metaTitle") : null;
        const descEdit = own ? edited(edits, page, "metaDescription") : null;
        const fullTitle = titleEdit ? (copyItem(page, "metaTitle")?.full ? titleEdit : pageTitle(titleEdit)) : route ? route.fullTitle : pageTitle(title);
        // Nothing passed → the site defaults, never the previous page's text or picture
        const desc = descEdit ?? (route ? route.description : metaText(description) ?? ROUTES["/"].description);
        const img = absUrl(image || route?.image || DEFAULT_OG_IMAGE);
        const path = pathname.length > 1 ? pathname.replace(/\/+$/, "") : "/";
        const url = canonical ? absUrl(canonical) : `${SITE_URL}${path}`;

        document.title = fullTitle;
        setMeta("property", "og:title", fullTitle);
        setMeta("name", "twitter:title", fullTitle);
        setMeta("name", "description", desc);
        setMeta("property", "og:description", desc);
        setMeta("name", "twitter:description", desc);
        setMeta("property", "og:url", url);
        setMeta("property", "og:image", img);
        setMeta("name", "twitter:image", img);
        upsert('link[rel="canonical"]', () => {
            const l = document.createElement("link");
            l.rel = "canonical";
            return l;
        }).setAttribute("href", url);

        if (noindex || route?.noindex) setMeta("name", "robots", "noindex,follow");
        else removeMeta("name", "robots");
    }, [pathname, title, description, image, noindex, canonical, page, edits]);
};
