#!/usr/bin/env node
// Pre-rendering: puts each page's finished HTML into its file in dist/, so phones show the text and the hero
// straight from the HTML instead of waiting for the JavaScript (ideas #20; Lighthouse showed ~4.7 s of waiting).
// Runs last in `npm run build`, after scripts/seo-pages.mjs has written one HTML file per page (its own head).
//
// For every app page file in dist/ (index.html = Home, studio.html, stores/oak-armchair.html, …) it:
// 1. renders the page with the server build of the app (dist-ssr/entry-server.js: same components, fixed address);
// 2. writes that HTML into <div id="root">, and moves React's image hints (<link rel="preload">) into the head;
// 3. adds <meta name="fc-prerendered" content="/studio"> so the browser knows which address the HTML is for.
// In the browser, main.jsx then "hydrates" (adopts the HTML without drawing it again). If a file is served for
// another address (Hosting sends index.html for unknown addresses, and the service worker uses it offline), a
// small script in index.html hides it before anything paints, and main.jsx starts fresh. See docs/architecture.md.
//
// Options: --dist <dir> (default dist). Needs: vite build --ssr src/entry-server.jsx --outDir dist-ssr first.

import { readFile, readdir, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const argv = process.argv.slice(2);
const DIST = resolve(process.cwd(), argv.includes("--dist") ? argv[argv.indexOf("--dist") + 1] : join(ROOT, "dist"));
const SKIP_DIRS = new Set(["assets", "fonts", "images", "logos", "og", "textures"]);

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

const { render } = await import(pathToFileURL(join(ROOT, "dist-ssr", "entry-server.js")).href);
const files = await htmlFiles(DIST);
let done = 0, kb = 0;
const failed = [];
for (const file of files) {
    const html = await readFile(file, "utf8");
    if (!html.includes('<div id="root"></div>')) continue; // not an app page, or done already
    const path = pathFor(file);
    try {
        let body = await render(path);
        // React lists image hints first; they belong in the head
        const hints = [];
        body = body.replace(/^(?:<link [^>]*rel="preload"[^>]*\/?>)+/, (m) => (hints.push(m), ""));
        const out = html
            .replace(/<meta charset="UTF-8" \/>/i, (m) => `${m}\n    <meta name="fc-prerendered" content="${path}" />`)
            .replace("</head>", `${hints.join("")}\n  </head>`)
            .replace('<div id="root"></div>', `<div id="root">${body}</div>`);
        await writeFile(file, out);
        done++;
        kb += body.length / 1024;
    } catch (error) {
        failed.push(`${path}: ${error.message.split("\n")[0]}`);
    }
}
console.log(`prerender: ${done} pages (${Math.round(kb)} kB of HTML before compression)`);
if (failed.length) {
    console.error(`prerender: ${failed.length} failed\n  ${failed.join("\n  ")}`);
    process.exit(1);
}
