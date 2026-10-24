// Formcraft service worker: keeps the site quick on repeat visits and on patchy mobile data.
// - Install: caches the home page and everything its HTML loads (entry script, CSS, module
//   preloads, fonts), so the site opens offline even after a single visit.
// - The page also posts the /assets/ files it already loaded before the worker took control
//   (lazy page chunks of that first visit); they're cached too (see "message").
// - Pages (navigations): network first, so visitors always get the latest site; the last copy is
//   used when offline (that address, else the home page's HTML, which boots the app anywhere).
// - Built code in /assets/ (file names carry a content hash): cache first, kept for good.
// - Fonts, paper textures, logos and images: served from the cache at once and refreshed in the
//   background (stale-while-revalidate).
// Anything missing offline (e.g. the 3D scene's chunks) fails quietly; the pages fall back.
// Requests to other sites (Firebase, Google, Flutterwave) are never touched.
const VERSION = "fc-2026-10-24c";
const PAGES = `${VERSION}-pages`;
const STATIC = `${VERSION}-static`;
const MEDIA = `${VERSION}-media`;
const MEDIA_MAX = 160; // images kept at most
const PAGES_MAX = 40; // page copies kept at most
const CORE = ["/favicon.svg", "/fonts/Satoshi-Variable.woff2", "/fonts/ClashGrotesk-Variable.woff2"];

const sameOrigin = (u) => {
    try {
        const url = new URL(u, self.location.origin);
        return url.origin === self.location.origin ? url : null;
    } catch {
        return null;
    }
};
const isStatic = (path) => path.startsWith("/assets/") || /^\/(fonts|textures|logos)\//.test(path) || path === "/favicon.svg";
const isMedia = (path) => path.startsWith("/images/");

// Every same-origin script, stylesheet, modulepreload or preload the HTML refers to
const urlsInHtml = (html) => {
    const out = new Set();
    const tags = html.match(/<(script|link)\b[^>]*>/gi) || [];
    for (const tag of tags) {
        const isScript = /^<script/i.test(tag);
        const rel = (tag.match(/\brel=["']?([^"'\s>]+)/i) || [])[1] || "";
        if (!isScript && !/^(stylesheet|modulepreload|preload|icon)$/i.test(rel)) continue;
        const ref = (tag.match(isScript ? /\bsrc=["']([^"']+)["']/i : /\bhref=["']([^"']+)["']/i) || [])[1];
        const url = ref && sameOrigin(ref);
        if (url && (isStatic(url.pathname) || isMedia(url.pathname))) out.add(url.pathname + url.search);
    }
    return [...out];
};

// Cache what isn't cached yet, one by one, ignoring failures (offline, 404 after a deploy)
const cacheMissing = async (urls) => {
    const stat = await caches.open(STATIC);
    const media = await caches.open(MEDIA);
    for (const u of urls) {
        const url = sameOrigin(u);
        if (!url) continue;
        const cache = isStatic(url.pathname) ? stat : isMedia(url.pathname) ? media : null;
        if (!cache) continue;
        const key = url.pathname + url.search;
        if (await cache.match(key)) continue;
        try {
            const res = await fetch(key, { credentials: "same-origin" });
            if (res.ok) await cache.put(key, res);
        } catch {
            /* offline or gone: skip */
        }
    }
};

const precache = async () => {
    await cacheMissing(CORE);
    try {
        const res = await fetch("/", { cache: "no-cache", credentials: "same-origin" });
        if (!res.ok) return;
        const html = await res.clone().text();
        await (await caches.open(PAGES)).put("/", res);
        await cacheMissing(urlsInHtml(html));
    } catch {
        /* offline during install: the fetch handler fills the caches later */
    }
};

self.addEventListener("install", (event) => {
    event.waitUntil(precache().then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches
            .keys()
            .then((keys) => Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k))))
            .then(() => self.clients.claim())
    );
});

// From src/main.jsx: { type: "fc-cache-urls", urls: [...] } — files the page loaded before the
// worker controlled it
self.addEventListener("message", (event) => {
    const data = event.data;
    if (!data || data.type !== "fc-cache-urls" || !Array.isArray(data.urls)) return;
    event.waitUntil(cacheMissing(data.urls.slice(0, 300)));
});

// Drop the oldest entries over the limit (the home page's copy is always kept: it's the offline fallback)
const trim = async (name, max) => {
    const cache = await caches.open(name);
    const keys = (await cache.keys()).filter((k) => new URL(k.url).pathname !== "/");
    for (let i = 0; i < keys.length - max; i++) await cache.delete(keys[i]);
};

self.addEventListener("fetch", (event) => {
    const { request } = event;
    if (request.method !== "GET") return;
    const url = new URL(request.url);
    if (url.origin !== self.location.origin) return;
    if (url.pathname === "/sw.js") return;

    if (request.mode === "navigate") {
        event.respondWith(
            fetch(request)
                .then((res) => {
                    if (res.ok && res.type === "basic") {
                        const copy = res.clone();
                        event.waitUntil(
                            caches
                                .open(PAGES)
                                .then((c) => c.put(url.pathname, copy))
                                .then(() => trim(PAGES, PAGES_MAX))
                        );
                    }
                    return res;
                })
                .catch(async () => {
                    const cache = await caches.open(PAGES);
                    return (
                        (await cache.match(url.pathname)) ||
                        (await cache.match("/")) ||
                        (await caches.match("/")) ||
                        new Response("<!doctype html><meta charset=utf-8><title>Formcraft</title><p>You're offline. Reconnect and try again.</p>", {
                            status: 503,
                            headers: { "Content-Type": "text/html; charset=utf-8" },
                        })
                    );
                })
        );
        return;
    }

    if (url.pathname.startsWith("/assets/")) {
        event.respondWith(
            caches.match(request).then(
                (hit) =>
                    hit ||
                    fetch(request)
                        .then((res) => {
                            if (res.ok) {
                                const copy = res.clone();
                                event.waitUntil(caches.open(STATIC).then((c) => c.put(request, copy)));
                            }
                            return res;
                        })
                        .catch(() => Response.error())
            )
        );
        return;
    }

    if (/^\/(fonts|textures|logos|images)\//.test(url.pathname) || url.pathname === "/favicon.svg") {
        const bucket = url.pathname.startsWith("/images/") ? MEDIA : STATIC;
        event.respondWith(
            caches.open(bucket).then(async (cache) => {
                const hit = await cache.match(request);
                const fresh = fetch(request)
                    .then((res) => {
                        if (res.ok) {
                            cache.put(request, res.clone());
                            if (bucket === MEDIA) trim(MEDIA, MEDIA_MAX);
                        }
                        return res;
                    })
                    .catch(() => hit || Response.error());
                if (hit) {
                    event.waitUntil(fresh);
                    return hit;
                }
                return fresh;
            })
        );
    }
});
