#!/usr/bin/env node
// Build-time SEO pages. Runs after `vite build`:  vite build && node scripts/seo-pages.mjs
//
// The site renders in the browser, so link previews (WhatsApp, Facebook, LinkedIn, X) and search
// engines would otherwise see the same head on every page. This writes one HTML file per route with
// its own head (title, description, canonical, Open Graph, Twitter, robots, JSON-LD); the body stays
// the React app. Firebase Hosting's `cleanUrls` serves dist/studio.html at /studio and
// dist/stores/oak-armchair.html at /stores/oak-armchair; everything else still falls back to index.html.
// Also writes dist/sitemap.xml and dist/robots.txt.
//
// Options:  --dist <dir>   (default: dist)      Env: SITE_URL=https://example.com (see src/data/seo.js)
// No dependencies: Node 18+ only.
//
// Page titles and descriptions published in Admin → Copy (Firestore `copy/{page}`, public) are read over
// REST and win over seo.js, like on the live site (usePageMeta). The project comes from VITE_FIREBASE_*
// (environment or .env.local). If the database can't be reached, the build says so and uses seo.js.

import { readFile, writeFile, mkdir, access } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const argv = process.argv.slice(2);
const arg = (name, fallback) => {
    const i = argv.indexOf(name);
    return i >= 0 && argv[i + 1] ? argv[i + 1] : fallback;
};
const DIST = resolve(process.cwd(), arg("--dist", join(ROOT, "dist")));

const seo = await import(pathToFileURL(join(ROOT, "src/data/seo.js")).href);
const { SITE_URL, SITE_NAME, LOCALE, ORG, ROUTES, DETAIL_SECTIONS, DEFAULT_OG_IMAGE } = seo;
const { metaForPath, pageTitle, absUrl, metaText, isPlaceholderItem, imagePath, jsonLdFor, jsonLdForRoute, crumbsFor } = seo;

const exists = async (p) => {
    try {
        await access(p);
        return true;
    } catch {
        return false;
    }
};

// ── HTML helpers ──────────────────────────────────────────────────────────────────────────────
const esc = (s) =>
    String(s ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
const jsonForScript = (obj) => JSON.stringify(obj).replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026");

const X_HANDLE = "@" + ORG.social.x.split("/").pop();

// One head block for a page
const headBlock = (m) => {
    const url = absUrl(m.path);
    const image = absUrl(m.image || DEFAULT_OG_IMAGE);
    const isCard = /\/og\/[^/]+\.jpg$/.test(m.image || DEFAULT_OG_IMAGE);
    const lines = [
        `<title>${esc(m.fullTitle)}</title>`,
        `<meta name="description" content="${esc(m.description)}" />`,
        `<link rel="canonical" href="${esc(url)}" />`,
        m.noindex ? `<meta name="robots" content="noindex,follow" />` : null,
        `<meta property="og:type" content="${esc(m.ogType || "website")}" />`,
        `<meta property="og:site_name" content="${esc(SITE_NAME)}" />`,
        `<meta property="og:locale" content="${esc(LOCALE)}" />`,
        `<meta property="og:title" content="${esc(m.fullTitle)}" />`,
        `<meta property="og:description" content="${esc(m.description)}" />`,
        `<meta property="og:url" content="${esc(url)}" />`,
        `<meta property="og:image" content="${esc(image)}" />`,
        isCard ? `<meta property="og:image:width" content="1200" />` : null,
        isCard ? `<meta property="og:image:height" content="630" />` : null,
        `<meta property="og:image:alt" content="${esc(m.imageAlt || m.fullTitle)}" />`,
        `<meta name="twitter:card" content="summary_large_image" />`,
        `<meta name="twitter:site" content="${esc(X_HANDLE)}" />`,
        `<meta name="twitter:title" content="${esc(m.fullTitle)}" />`,
        `<meta name="twitter:description" content="${esc(m.description)}" />`,
        `<meta name="twitter:image" content="${esc(image)}" />`,
        ...(m.jsonLd ?? []).map((b) => `<script type="application/ld+json">${jsonForScript(b)}</script>`),
    ];
    return lines.filter(Boolean).map((l) => `    ${l}`).join("\n");
};

// Replace the SEO tags in <head>, leaving everything else (inline scripts, styles, preloads) intact.
// Inline <script>/<style> blocks are masked first, so nothing inside them can be matched.
const rewriteHead = (html, block) => {
    const start = html.search(/<head[^>]*>/i);
    const end = html.search(/<\/head>/i);
    if (start < 0 || end < 0) throw new Error("index.html has no <head>…</head>");
    const openLen = html.slice(start).match(/<head[^>]*>/i)[0].length;
    let head = html.slice(start + openLen, end);

    const masked = [];
    head = head.replace(/<(script|style)\b([^>]*)>[\s\S]*?<\/\1>/gi, (m, tag, attrs) => {
        if (/type\s*=\s*["']application\/ld\+json["']/i.test(attrs)) return m; // our own: removed below
        masked.push(m);
        // a private-use character marks the hidden block; it never appears in real HTML
        return `MASK${masked.length - 1}`;
    });

    const drop = [
        /[ \t]*<title\b[^>]*>[\s\S]*?<\/title>[ \t]*\r?\n?/gi,
        /[ \t]*<meta\s+[^>]*name\s*=\s*["'](?:description|robots|twitter:[^"']*)["'][^>]*>[ \t]*\r?\n?/gi,
        /[ \t]*<meta\s+[^>]*property\s*=\s*["']og:[^"']*["'][^>]*>[ \t]*\r?\n?/gi,
        /[ \t]*<link\s+[^>]*rel\s*=\s*["']canonical["'][^>]*>[ \t]*\r?\n?/gi,
        /[ \t]*<script\b[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>[ \t]*\r?\n?/gi,
    ];
    for (const re of drop) head = head.replace(re, "");

    // New block goes after the viewport meta (else charset, else top of head)
    const anchor = head.match(/<meta\s+[^>]*name\s*=\s*["']viewport["'][^>]*>[ \t]*\r?\n?/i) || head.match(/<meta\s+charset[^>]*>[ \t]*\r?\n?/i);
    if (anchor) {
        const at = anchor.index + anchor[0].length;
        head = `${head.slice(0, at)}${anchor[0].endsWith("\n") ? "" : "\n"}${block}\n${head.slice(at)}`;
    } else {
        head = `\n${block}\n${head}`;
    }
    head = head.replace(/MASK(\d+)/g, (_, i) => masked[Number(i)]);
    return html.slice(0, start + openLen) + head + html.slice(end);
};

const fileFor = (path) => (path === "/" ? join(DIST, "index.html") : join(DIST, `${path.replace(/^\//, "")}.html`));

const write = async (path, html) => {
    const f = fileFor(path);
    await mkdir(dirname(f), { recursive: true });
    await writeFile(f, html);
};

// ── Run ───────────────────────────────────────────────────────────────────────────────────────
// ── Published copy (Admin → Copy) ────────────────────────────────────────────────────────────
const envLocal = async () => {
    try {
        const text = await readFile(join(ROOT, ".env.local"), "utf8");
        return Object.fromEntries(text.split(/\r?\n/).map((l) => l.match(/^\s*([A-Z_]+)\s*=\s*(.*?)\s*$/)).filter(Boolean).map((m) => [m[1], m[2].replace(/^["']|["']$/g, "")]));
    } catch {
        return {};
    }
};
const fileEnv = await envLocal();
const env = (k) => process.env[k] || fileEnv[k] || "";
const copyMod = await import(pathToFileURL(join(ROOT, "src/data/copy.js")).href);
const plain = (t) => String(t ?? "").replace(/\*\*([^*\n]+)\*\*/g, "$1").replace(/\*([^*\n]+)\*/g, "$1").replace(/\s*\n\s*/g, " ").trim();
let copyNote = "";
const readCopy = async (page) => {
    const project = env("VITE_FIREBASE_PROJECT_ID");
    const key = env("VITE_FIREBASE_API_KEY");
    if (!project || !key || copyNote) return {};
    try {
        const url = `https://firestore.googleapis.com/v1/projects/${project}/databases/(default)/documents/copy/${page}?key=${key}`;
        const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
        if (res.status === 404) return {};
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const fields = (await res.json()).fields?.items?.mapValue?.fields ?? {};
        return Object.fromEntries(Object.entries(fields).map(([id, v]) => [id, v.mapValue?.fields?.text?.stringValue ?? ""]));
    } catch (error) {
        copyNote = `published copy not read (${error.message}); page heads use src/data/seo.js`;
        return {};
    }
};
// a route's title and description with any published edits (same rules as usePageMeta)
const withCopy = async (m) => {
    if (!m.key || !copyMod.COPY[m.key]) return m;
    const edits = await readCopy(m.key);
    const titleItem = copyMod.copyItem(m.key, "metaTitle");
    const descItem = copyMod.copyItem(m.key, "metaDescription");
    const title = plain(edits.metaTitle).slice(0, titleItem?.max ?? 60);
    const desc = plain(edits.metaDescription).slice(0, descItem?.max ?? 155);
    return { ...m, ...(title ? { fullTitle: titleItem?.full ? title : pageTitle(title) } : {}), ...(desc ? { description: desc } : {}) };
};

const template = await readFile(join(DIST, "index.html"), "utf8");
const built = new Date().toISOString().slice(0, 10);
const pages = []; // { path, noindex, priority, changefreq }
const warnings = [];

// Static routes
for (const path of Object.keys(ROUTES)) {
    const m = await withCopy(metaForPath(path));
    if (!(await exists(join(ROOT, "public", m.image.replace(/^\//, ""))))) {
        warnings.push(`${path}: ${m.image} not found in public/ (run node scripts/make-og.mjs); using ${DEFAULT_OG_IMAGE}`);
        m.image = DEFAULT_OG_IMAGE;
    }
    m.jsonLd = jsonLdForRoute(path);
    await write(path, rewriteHead(template, headBlock(m)));
    pages.push({ path, noindex: m.noindex, priority: m.priority, changefreq: m.changefreq });
}

// Detail pages from the starter data in src/data/ (the admin's Firestore content isn't read here)
const detailCounts = [];
for (const det of DETAIL_SECTIONS) {
    let items;
    try {
        const mod = await import(pathToFileURL(join(ROOT, "src/data", `${det.data}.js`)).href);
        items = mod[det.list];
        if (!Array.isArray(items)) throw new Error(`no "${det.list}" array export`);
    } catch (e) {
        warnings.push(`${det.prefix}*: skipped, src/data/${det.data}.js didn't load in Node (${e.message})`);
        continue;
    }
    const section = metaForPath(det.section);
    let n = 0;
    let hidden = 0;
    for (const item of items) {
        if (!item?.slug || item.active === false) continue;
        const path = `${det.prefix}${item.slug}`;
        const placeholder = isPlaceholderItem(item);

        // Preview image: its own card (make-og.mjs), else its first photo, else the section card
        const cardKey = `${det.section.slice(1)}-${item.slug}`;
        const firstImg = imagePath(item.images?.[0]);
        let image = section.image;
        let imageAlt = null;
        if (!placeholder && (await exists(join(ROOT, "public/og", `${cardKey}.jpg`)))) image = `/og/${cardKey}.jpg`;
        else if (!placeholder && firstImg) {
            const found = await findImage(firstImg);
            if (found) {
                image = found;
                imageAlt = (typeof item.images[0] === "object" && item.images[0]?.alt) || item.imageAlt || null;
            }
        }

        const m = placeholder
            ? { ...section, path, image: section.image, noindex: true, jsonLd: [] }
            : {
                  path,
                  fullTitle: pageTitle(det.title(item)),
                  description: metaText(det.text(item)) ?? fallbackText(det, item) ?? section.description,
                  image,
                  imageAlt,
                  noindex: false,
                  ogType: det.type === "article" ? "article" : det.type === "product" ? "product" : "website",
                  jsonLd: [
                      jsonLdFor.breadcrumbs(crumbsFor(path, det.title(item).split(" · ")[0])),
                      det.type === "product" ? jsonLdFor.product(item, path) : null,
                      det.type === "article" ? jsonLdFor.article(item, path) : null,
                  ].filter(Boolean),
              };
        await write(path, rewriteHead(template, headBlock(m)));
        pages.push({ path, noindex: m.noindex, priority: det.priority, changefreq: "monthly" });
        n++;
        if (placeholder) hidden++;
    }
    detailCounts.push(`${det.prefix}* ${n}${hidden ? ` (${hidden} sample, noindex)` : ""}`);
}

// A photo path that really exists: full URLs as they are; /images/x-800.webp, else /images/x.webp
async function findImage(src) {
    if (/^https?:/.test(src)) return src;
    const candidates = [src, src.replace(/-800\.webp$/, ".webp")];
    for (const c of candidates) if (await exists(join(ROOT, "public", c.replace(/^\//, "")))) return c;
    return null;
}

// When an item's own text is still a TODO: a plain, true line instead
function fallbackText(det, item) {
    if (det.section === "/projects") return `${item.title}: a project by ${ORG.name}, Kampala.`;
    if (det.section === "/stores") return `${item.title}, from the Formcraft workshop in Kampala.`;
    return null;
}

// Sitemap: indexable pages only, absolute URLs
const indexable = pages.filter((p) => !p.noindex);
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${indexable
    .map(
        (p) =>
            `  <url>\n    <loc>${esc(absUrl(p.path))}</loc>\n    <lastmod>${built}</lastmod>\n${p.changefreq ? `    <changefreq>${p.changefreq}</changefreq>\n` : ""}${p.priority != null ? `    <priority>${Number(p.priority).toFixed(1)}</priority>\n` : ""}  </url>`,
    )
    .join("\n")}
</urlset>
`;
await writeFile(join(DIST, "sitemap.xml"), sitemap);

const robots = `User-agent: *
Allow: /
Disallow: /admin
Disallow: /account
Disallow: /checkout
Disallow: /sign-in

Sitemap: ${SITE_URL}/sitemap.xml
`;
await writeFile(join(DIST, "robots.txt"), robots);

console.log(`seo-pages: ${pages.length} pages in ${DIST} for ${SITE_URL}`);
if (copyNote) console.log(`  ${copyNote}`);
console.log(`  static: ${Object.keys(ROUTES).length} · detail: ${detailCounts.join(", ")}`);
console.log(`  sitemap.xml: ${indexable.length} URLs · robots.txt written`);
for (const w of warnings) console.warn(`  warning: ${w}`);
