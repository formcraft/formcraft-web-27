// Formcraft service worker: keeps the site quick on repeat visits and on patchy mobile data.
// - Pages (navigations): network first, so visitors always get the latest site; the last copy is
//   used when offline.
// - Built code in /assets/ (file names carry a content hash): cache first, kept for good.
// - Fonts, paper textures, logos and images: served from the cache at once and refreshed in the
//   background (stale-while-revalidate).
// Requests to other sites (Firebase, Google, Flutterwave) are never touched.
const VERSION = "fc-2026-10-24b";
const PAGES = `${VERSION}-pages`;
const STATIC = `${VERSION}-static`;
const MEDIA = `${VERSION}-media`;
const MEDIA_MAX = 160; // images kept at most

self.addEventListener("install", (event) => {
    event.waitUntil(
        caches
            .open(STATIC)
            .then((c) => c.addAll(["/", "/favicon.svg", "/fonts/Satoshi-Variable.woff2", "/fonts/ClashGrotesk-Variable.woff2"]))
            .catch(() => {})
            .then(() => self.skipWaiting())
    );
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches
            .keys()
            .then((keys) => Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k))))
            .then(() => self.clients.claim())
    );
});

const trim = async (name, max) => {
    const cache = await caches.open(name);
    const keys = await cache.keys();
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
                    const copy = res.clone();
                    caches.open(PAGES).then((c) => c.put("/", copy));
                    return res;
                })
                .catch(() => caches.match("/", { cacheName: PAGES }).then((r) => r || caches.match("/")))
        );
        return;
    }

    if (url.pathname.startsWith("/assets/")) {
        event.respondWith(
            caches.match(request).then(
                (hit) =>
                    hit ||
                    fetch(request).then((res) => {
                        if (res.ok) {
                            const copy = res.clone();
                            caches.open(STATIC).then((c) => c.put(request, copy));
                        }
                        return res;
                    })
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
                    .catch(() => hit);
                if (hit) {
                    event.waitUntil(fresh);
                    return hit;
                }
                return fresh;
            })
        );
    }
});
