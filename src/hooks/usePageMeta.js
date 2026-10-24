import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { DEFAULT_OG_IMAGE, ROUTES, SITE_URL, absUrl, imagePath, metaForPath, metaText, pageTitle } from "../data/seo";

// Each route sets its own <title>, meta description, canonical link, Open Graph / Twitter tags
// and robots. src/data/seo.js is the source of truth for static routes: the build writes the same
// head into dist/<route>.html (scripts/seo-pages.mjs), so the live page and the pre-built HTML agree.
//
//   usePageMeta(title, description)                         title format: "<title> · Formcraft"
//   usePageMeta(title, description, { image, noindex, canonical })
//
// - Static routes (/studio, /stores, …): the title, description and preview image from seo.js win,
//   unless the call sets `noindex` (a special state such as "not open yet"), which keeps its own title.
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

export const usePageMeta = (title, description, options = {}) => {
    const { pathname } = useLocation();
    const { noindex = false, canonical } = options ?? {};
    const image = options?.image ? imagePath(options.image) : null;

    useEffect(() => {
        const route = noindex ? null : metaForPath(pathname);
        const fullTitle = route ? route.fullTitle : pageTitle(title);
        // Nothing passed → the site defaults, never the previous page's text or picture
        const desc = route ? route.description : metaText(description) ?? ROUTES["/"].description;
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
    }, [pathname, title, description, image, noindex, canonical]);
};
