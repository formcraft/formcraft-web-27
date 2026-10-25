#!/usr/bin/env node
// Pre-rendering: puts each page's finished HTML into its file in dist/, so phones show the text and the hero
// straight from the HTML instead of waiting for the JavaScript (ideas #20; Lighthouse showed ~4.7 s of waiting).
// Runs last in `npm run build`, after scripts/seo-pages.mjs has written one HTML file per page (its own head).
//
// For every app page file in dist/ (index.html = Home, studio.html, stores/oak-armchair.html, …) it:
// 1. renders the page with the server build of the app (dist-ssr/entry-server.js: same components, fixed address);
// 2. writes that HTML into <div id="root"> (without React's image hints: they slowed the first paint);
// 3. adds <meta name="fc-prerendered" content="/studio"> so the browser knows which address the HTML is for.
// In the browser, main.jsx then "hydrates" (adopts the HTML without drawing it again). If a file is served for
// another address (Hosting sends index.html for unknown addresses, and the service worker uses it offline), a
// small script in index.html hides it before anything paints, and main.jsx starts fresh. See docs/architecture.md.
//
// Pages switched off in Admin → Pages are NOT pre-built (their file keeps an empty root, so the app shows "opens
// soon" as before): the switches are read from Firestore settings/site over REST at build time, like the page
// heads. A page switched off after a build still has its old pre-built HTML until the next build and deploy.
//
// Private or address-dependent pages (checkout, order confirmed, account, sign-in, admin, the thank-you page) are never
// pre-built: they depend on the visitor or on ?query values the build can't know.
//
// Options: --dist <dir> (default dist); --strict: fail when the page switches can't be read (npm run build:deploy),
// instead of building every page as switched on. Needs: vite build --ssr src/entry-server.jsx --outDir dist-ssr first.

import { readFile, readdir, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const argv = process.argv.slice(2);
const DIST = resolve(process.cwd(), argv.includes("--dist") ? argv[argv.indexOf("--dist") + 1] : join(ROOT, "dist"));
const SKIP_DIRS = new Set(["assets", "fonts", "images", "logos", "og", "textures"]);
const STRICT = argv.includes("--strict");
// pages that depend on the visitor or the address's ?query: rendered by the app as before
const PRIVATE = new Set(["/checkout", "/checkout/confirmed", "/account", "/sign-in", "/admin", "/donate/thank-you"]);

const htmlFiles = async (dir) => {
    const out = [];
    for (const entry of await readdir(dir, { withFileTypes: true })) {
        if (entry.isDirectory()) {
            if (!SKIP_DIRS.has(entry.name)) out.push(...(await htmlFiles(join(dir, entry.name))));
        } else if (entry.name.endsWith(".html")) out.push(join(dir, entry.name));
    }
    return out;
};

// dist/index.html → "/", dist/studio.html → "/studio", dist/stores/oak-armchair.html → "/stores/oak-armchair"
const pathFor = (file) => {
    const rel = relative(DIST, file).replace(/\\/g, "/").replace(/\.html$/, "");
    return rel === "index" ? "/" : `/${rel.replace(/\/index$/, "")}`;
};

const { render, pageNameFor } = await import(pathToFileURL(join(ROOT, "dist-ssr", "entry-server.js")).href);

// Each page's own stylesheets, from Vite's manifest: the page module's CSS plus that of everything it imports
// statically. Linked in the head so the pre-built page paints already styled (otherwise it jumped into place when
// the page's code brought its CSS). The browser's page loader sees them there and doesn't add them again.
const manifest = JSON.parse(await readFile(join(DIST, ".vite", "manifest.json"), "utf8"));
const entryCss = new Set((manifest["index.html"]?.css ?? []).map((c) => `/${c}`));
const cssFor = (name) => {
    const out = new Set(), seen = new Set();
    const walk = (key) => {
        if (!key || seen.has(key)) return;
        seen.add(key);
        const m = manifest[key];
        if (!m) return;
        (m.css ?? []).forEach((c) => out.add(`/${c}`));
        (m.imports ?? []).forEach(walk);
    };
    walk(`src/pages/${name}.jsx`);
    return [...out].filter((href) => !entryCss.has(href));
};
const { PAGES, defaultVisibility, pageForPath } = await import(pathToFileURL(join(ROOT, "src", "data", "pages.js")).href);

// Which pages are switched on (Admin → Pages), read over REST; the defaults if the database can't be reached
const env = async () => {
    try {
        const text = await readFile(join(ROOT, ".env.local"), "utf8");
        return Object.fromEntries([...text.matchAll(/^\s*([A-Z_]+)\s*=\s*(.*?)\s*$/gm)].map((m) => [m[1], m[2].replace(/^["']|["']$/g, "")]));
    } catch {
        return {};
    }
};
const fileEnv = await env();
const envVar = (k) => process.env[k] || fileEnv[k] || "";
let switchNote = "";
const visibility = defaultVisibility();
try {
    const project = envVar("VITE_FIREBASE_PROJECT_ID"), key = envVar("VITE_FIREBASE_API_KEY");
    if (!project || !key) throw new Error("no Firebase project in the environment");
    // the Referer lets a key restricted to the site's domains (owner checklist) still answer the build
    const site = (envVar("SITE_URL") || envVar("VITE_SITE_URL") || "https://formcraftdesignconstruction.com").replace(/\/+$/, "");
    const res = await fetch(`https://firestore.googleapis.com/v1/projects/${project}/databases/(default)/documents/settings/site?key=${key}`, { signal: AbortSignal.timeout(5000), headers: { Referer: `${site}/` } });
    if (res.status !== 404) {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const saved = (await res.json()).fields?.pages?.mapValue?.fields ?? {};
        for (const [k, v] of Object.entries(saved)) if (typeof v.booleanValue === "boolean") visibility[k] = v.booleanValue;
    }
} catch (error) {
    switchNote = `page switches not read (${error.message}); every page counts as on`;
    if (STRICT) {
        console.error(`prerender: ${switchNote}. A page switched off in Admin could be pre-built, so the deploy build stops here.`);
        process.exit(1);
    }
}
for (const p of PAGES) if (p.locked) visibility[p.key] = true;
let skipped = 0;
const files = await htmlFiles(DIST);
let done = 0, kb = 0;
const failed = [];
for (const file of files) {
    const html = await readFile(file, "utf8");
    if (!html.includes('<div id="root"></div>')) continue; // not an app page, or done already
    const path = pathFor(file);
    if (PRIVATE.has(path)) continue;
    const pageKey = pageForPath(path)?.key;
    if (pageKey && visibility[pageKey] === false) {
        skipped++; // switched off in Admin → Pages: leave it to the app ("opens soon")
        continue;
    }
    try {
        let body = await render(path);
        // React lists image hints first; dropped: on a slow connection they compete with the stylesheet, and the
        // images are found in the HTML straight after anyway
        body = body.replace(/^(?:<link [^>]*rel="preload"[^>]*\/?>)+/, "");
        const links = cssFor(pageNameFor(path)).filter((href) => !html.includes(`href="${href}"`));
        const out = html
            .replace("</head>", `${links.map((href) => `    <link rel="stylesheet" crossorigin href="${href}">`).join("\n")}\n  </head>`)
            .replace(/<meta charset="UTF-8" \/>/i, (m) => `${m}\n    <meta name="fc-prerendered" content="${encodeURI(path)}" />`)
            .replace('<div id="root"></div>', `<div id="root">${body}</div>`);
        await writeFile(file, out);
        done++;
        kb += body.length / 1024;
    } catch (error) {
        failed.push(`${path}: ${error.message.split("\n")[0]}`);
    }
}
if (switchNote) console.warn(`prerender: WARNING: ${switchNote}. Before a deploy, use npm run build:deploy (it stops when they can't be read).`);
console.log(`prerender: ${done} pages (${Math.round(kb)} kB of HTML before compression)${skipped ? `, ${skipped} switched off in Admin left to the app` : ""}`);
if (failed.length) {
    console.error(`prerender: ${failed.length} failed\n  ${failed.join("\n  ")}`);
    process.exit(1);
}
