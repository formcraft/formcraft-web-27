#!/usr/bin/env node
// Branded link-preview images (Open Graph / Twitter cards), 1200 × 630 JPEG, in public/og/.
//   node scripts/make-og.mjs            all cards
//   node scripts/make-og.mjs studio     only the keys given (route keys from src/data/seo.js, or "og")
//
// One card per public route in src/data/seo.js (public/og/<key>.jpg), a default public/og/og.jpg,
// and a card per starter item that has a photo (public/og/<section>-<slug>.jpg: products, projects,
// Journal posts). scripts/seo-pages.mjs picks them up at build time. Re-run after changing a title
// in seo.js or a starter item. Needs Playwright with Chromium (dev machine only; not a site dependency):
//   npx --yes playwright@1 install chromium
//
// The look is the day edition: paper texture, the official navy logo file (not redrawn), the headline
// in Clash Grotesk (JPEG quality 78 keeps each card under ~150 kB despite the paper grain), an orange torn-paper strip and the drawing title block from the site footer.
// Colours mirror src/styles/tokens.css (this runs outside the app, so it can't read the CSS variables).

import { mkdir, writeFile, rm, stat, mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "public/og");
const only = process.argv.slice(2).filter((a) => !a.startsWith("-"));

const C = { navy: "#1C252D", orange: "#FFAE61", rust: "#D15334", rustText: "#C24A2C", white: "#F1F1F1" };
const file = (p) => pathToFileURL(join(ROOT, p)).href;

const seo = await import(pathToFileURL(join(ROOT, "src/data/seo.js")).href);
const { sheetFor } = await import(pathToFileURL(join(ROOT, "src/data/sheets.js")).href);
const { ROUTES, ORG, TAGLINE, DETAIL_SECTIONS, isPlaceholderItem } = seo;

let chromium;
try {
    ({ chromium } = await import("playwright"));
} catch {
    try {
        ({ chromium } = createRequire(import.meta.url)("playwright"));
    } catch {
        console.error("make-og: Playwright isn't installed. Run: npx --yes playwright@1 install chromium (and npm i -D playwright, or run with npx)");
        process.exit(1);
    }
}

// ── Cards to draw ─────────────────────────────────────────────────────────────────────────────
const cards = [];
cards.push({ key: "og", eyebrow: "Kampala, Uganda", headline: TAGLINE, sheet: "A000", tagIsHeadline: true });
for (const [path, r] of Object.entries(ROUTES)) {
    if (!r.og) continue; // private pages use og.jpg
    const [sheet] = sheetFor(path);
    cards.push({ key: r.key, eyebrow: r.og.eyebrow, headline: r.og.headline, sheet: sheet === "X404" ? "—" : sheet, tagIsHeadline: r.og.headline === TAGLINE });
}

// Starter items with a photo get their own card (section label + item title + the photo)
const photoFile = (img) => {
    const n = typeof img === "string" ? img : img?.name;
    if (!n || /^(https?:|\/)/.test(n)) return null; // uploaded URLs aren't drawn here
    return `public/images/${n}.webp`;
};
for (const det of DETAIL_SECTIONS) {
    if (!["products", "projects", "posts"].includes(det.data)) continue;
    let items = [];
    try {
        items = (await import(pathToFileURL(join(ROOT, "src/data", `${det.data}.js`)).href))[det.list] ?? [];
    } catch (e) {
        console.warn(`make-og: skipped ${det.data}.js (${e.message})`);
    }
    for (const item of items) {
        if (!item?.slug || item.active === false || isPlaceholderItem(item)) continue;
        const photo = photoFile(item.images?.[0]);
        if (!photo) continue;
        try {
            await stat(join(ROOT, photo));
        } catch {
            continue;
        }
        const [sheet, sheetName] = sheetFor(`${det.prefix}${item.slug}`);
        cards.push({
            key: `${det.section.slice(1)}-${item.slug}`,
            eyebrow: sheetName.replace(" · ", " · "),
            headline: item.title,
            sheet,
            photo,
        });
    }
}

const todo = only.length ? cards.filter((c) => only.includes(c.key)) : cards;

// ── Template ──────────────────────────────────────────────────────────────────────────────────
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// Seeded ragged edge, like TornEdge.jsx
const tear = (seed, width, base, amp) => {
    let s = seed;
    const r = () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
    let x = 0;
    let y = base;
    const pts = [[0, y]];
    while (x < width) {
        x += 3 + r() * 10;
        y = Math.max(base - amp, Math.min(base + amp, y + (r() - 0.5) * 6));
        pts.push([Math.min(x, width), y]);
    }
    return pts;
};
const seedOf = (k) => [...k].reduce((a, ch) => (a * 31 + ch.charCodeAt(0)) % 2147483647, 7) || 7;

const html = (c) => {
    const pts = tear(seedOf(c.key), 1200, 30, 5);
    const clip = `polygon(0 0, 1200px 0, ${pts
        .slice()
        .reverse()
        .map(([x, y]) => `${x.toFixed(1)}px ${y.toFixed(1)}px`)
        .join(", ")})`;
    const fibre = `M${pts.map(([x, y]) => `${x.toFixed(1)},${(y + 0.6).toFixed(1)}`).join(" L")}`;
    const strip = c.tagIsHeadline ? `${ORG.name}` : TAGLINE;
    return `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face { font-family: "Clash Grotesk"; src: url("${file("public/fonts/ClashGrotesk-Variable.woff2")}") format("woff2"); font-weight: 200 700; }
@font-face { font-family: "Satoshi"; src: url("${file("public/fonts/Satoshi-Variable.woff2")}") format("woff2"); font-weight: 300 900; }
* { box-sizing: border-box; }
html, body { margin: 0; }
body { width: 1200px; height: 630px; overflow: hidden; position: relative; color: ${C.navy};
  font-family: "Satoshi", sans-serif;
  background: linear-gradient(rgba(241,241,241,.16), rgba(241,241,241,.16)), url("${file("public/textures/paper.webp")}") 0 0 / 384px, ${C.white}; }
.grid { position: absolute; inset: 0; background-image: linear-gradient(rgba(28,37,45,.055) 1px, transparent 1px), linear-gradient(90deg, rgba(28,37,45,.055) 1px, transparent 1px); background-size: 48px 48px; background-position: 24px 24px; }
.frame { position: absolute; left: 24px; right: 24px; top: 58px; bottom: 24px; border: 1.5px solid rgba(28,37,45,.32); }
.strip { position: absolute; left: 0; right: 0; top: 0; height: 40px; background: url("${file("public/textures/orange.webp")}") 0 0 / 384px, ${C.orange}; clip-path: ${clip}; }
.fibre { position: absolute; left: 0; top: 0; width: 1200px; height: 40px; }
.fibre path { fill: none; stroke: rgba(255,255,255,.75); stroke-width: 1.4; }
.logo { position: absolute; left: 64px; top: 92px; height: 44px; width: auto; }
.body { position: absolute; left: 64px; top: 176px; width: ${c.photo ? 600 : 1000}px; height: 270px; display: flex; flex-direction: column; justify-content: center; gap: 18px; }
.eyebrow { font: 700 21px/1.1 "Satoshi", sans-serif; letter-spacing: .14em; text-transform: uppercase; color: ${C.rustText}; }
.headline { margin: 0; font-family: "Clash Grotesk", sans-serif; font-weight: 600; letter-spacing: -.015em; line-height: 1.02; font-size: 84px; text-wrap: balance; }
.photo { position: absolute; right: 64px; top: 92px; width: 440px; height: 352px; padding: 10px; background: #FAFAF8; box-shadow: 0 1px 0 rgba(28,37,45,.08), 0 10px 24px -8px rgba(28,37,45,.35); transform: rotate(1.6deg); }
.photo img { display: block; width: 100%; height: 100%; object-fit: cover; }
.tb { position: absolute; left: 48px; right: 48px; bottom: 48px; height: 92px; display: grid; grid-template-columns: 2.3fr 1fr .9fr; border: 1.5px solid rgba(28,37,45,.32); background: rgba(250,250,248,.5); }
.tb > div { display: flex; flex-direction: column; justify-content: center; gap: 8px; padding: 0 20px; border-left: 1px solid rgba(28,37,45,.32); min-width: 0; }
.tb > div:first-child { border-left: 0; }
.tb small { font: 700 12px/1 "Satoshi", sans-serif; letter-spacing: .18em; text-transform: uppercase; color: rgba(28,37,45,.62); }
.tb strong { font: 700 21px/1.2 "Satoshi", sans-serif; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.tb .no { font: 600 42px/.9 "Clash Grotesk", sans-serif; letter-spacing: -.02em; }
</style></head><body>
<div class="grid"></div>
<div class="frame"></div>
<div class="strip"></div>
<svg class="fibre" viewBox="0 0 1200 40"><path d="${fibre}"/></svg>
<img class="logo" src="${file("public/logos/formcraft-navy.svg")}" alt="">
${c.photo ? `<div class="photo"><img src="${file(c.photo)}" alt=""></div>` : ""}
<div class="body">
  <div class="eyebrow">${esc(c.eyebrow)}</div>
  <h1 class="headline">${esc(c.headline)}</h1>
</div>
<div class="tb">
  <div><small>${c.tagIsHeadline ? "Company" : "Formcraft"}</small><strong>${esc(strip)}</strong></div>
  <div><small>Based in</small><strong>Kampala, Uganda</strong></div>
  <div><small>Sheet</small><span class="no">${esc(c.sheet)}</span></div>
</div>
<script>
  // Shrink the headline until it fits its box (max 3 lines)
  document.fonts.ready.then(() => {
    const h = document.querySelector(".headline"), box = document.querySelector(".body");
    let size = ${c.photo ? 72 : 84};
    h.style.fontSize = size + "px";
    while (size > 40 && (box.scrollHeight > box.clientHeight + 1 || h.getBoundingClientRect().height > size * 1.02 * 3 + 2)) { size -= 2; h.style.fontSize = size + "px"; }
    document.body.dataset.ready = "1";
  });
</script>
</body></html>`;
};

// ── Render ────────────────────────────────────────────────────────────────────────────────────
await mkdir(OUT, { recursive: true });
const tmp = await mkdtemp(join(tmpdir(), "fc-og-"));
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
const report = [];
try {
    for (const c of todo) {
        const f = join(tmp, `${c.key}.html`);
        await writeFile(f, html(c));
        await page.goto(pathToFileURL(f).href);
        await page.waitForSelector("body[data-ready]", { timeout: 15000 });
        await page.evaluate(() => Promise.all([...document.images].map((i) => (i.complete ? null : new Promise((r) => (i.onload = i.onerror = r))))));
        const out = join(OUT, `${c.key}.jpg`);
        await page.screenshot({ path: out, type: "jpeg", quality: 78 });
        const { size } = await stat(out);
        report.push(`${c.key}.jpg ${(size / 1024).toFixed(0)} kB${size > 150 * 1024 ? "  (over 150 kB)" : ""}`);
    }
} finally {
    await browser.close();
    await rm(tmp, { recursive: true, force: true });
}
console.log(`make-og: ${report.length} cards in public/og/`);
for (const r of report) console.log(`  ${r}`);
