#!/usr/bin/env node
// `npm run check`: the site's offline quality check. Free, runs on this computer, no GitHub needed.
//
// What it does, step by step:
//   1. Lint      – oxlint reads the code for mistakes.
//   2. Build     – builds the site exactly as it would go live (`npm run build`, which also writes
//                  the SEO pages, sitemap.xml and robots.txt).
//   3. Files     – checks the build has a page for every address in the sitemap, plus robots.txt,
//                  and that no class name is styled by two stylesheets (css-collisions.mjs).
//   4. Size      – checks the main JavaScript file stays under the budget (phones on slow data).
//   5. Pages     – opens every page in Chrome at phone, tablet and desktop sizes, day and night,
//                  and looks for layout problems (see page-checks.mjs).
//   6. Clicks    – uses the site like a visitor: menu, cart, pop-ups, forms, keyboard (click-checks.mjs).
//   7. Links     – follows every link between pages and reports any that land on the 404 page.
//                  Then the weather check: hero text against every weather scene (weather-contrast.mjs);
//                  below AA on a clear sky is an error, in another scene a warning for the sky's designer.
//   8. Report    – writes check-report/index.html with every finding and screenshots.
// The internet is blocked during steps 5–7, so results never depend on Firebase or the network.
//
// Options:
//   --fast        fewer combinations (phone and desktop by day, desktop at night): about 3× quicker
//   --no-build    use the existing dist/ folder (skip lint and build)
//   --only /path  check just these pages (repeat for more), e.g. --only / --only /stores
//   --no-axe      skip the accessibility checker
//   --no-shots    skip screenshots
//   --headed      show the browser windows while checking
//   --no-weather  skip the weather contrast check
// Exit code: 0 when there are no errors (warnings are fine), 1 otherwise.

import { spawn } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { gzipSync } from "node:zlib";
import { CLICK_CHECKS, checkLinks } from "./click-checks.mjs";
import { findCssCollisions } from "./css-collisions.mjs";
import { BASE, ROOT, launchBrowser, openContext, runPool, startPreview } from "./lib.mjs";
import { checkPage } from "./page-checks.mjs";
import { checkWeatherContrast } from "./weather-contrast.mjs";
import { writeReport } from "./report.mjs";

const argv = process.argv.slice(2);
const flag = (name) => argv.includes(name);
// Page paths for --only. Accepts "/studio" or "studio". Git Bash on Windows rewrites "/studio" into
// "C:/Program Files/Git/studio" before Node sees it, so that prefix is removed again here.
const toPath = (p) =>
    "/" +
    p
        .replaceAll("\\", "/")
        .replace(/^[A-Za-z]:\/.*?\/Git(?=\/|$)/, "")
        .replace(/^\/+/, "");
const only = argv.flatMap((a, i) => (a === "--only" && argv[i + 1] ? [toPath(argv[i + 1])] : []));
const FAST = flag("--fast");
const DIST = join(ROOT, "dist");
const OUT = join(ROOT, "check-report");
const MAIN_JS_BUDGET_KB = 250; // gzipped; the build plan's limit for the first JavaScript a phone downloads

// Pages that aren't in the sitemap (private or after an action) but must still work.
const EXTRA_PAGES = ["/checkout", "/checkout/confirmed", "/account", "/sign-in", "/admin", "/donate/thank-you", "/this-page-does-not-exist"];

// Which screen sizes and editions each page is checked at; axe and screenshots only where marked.
const VIEWS = FAST
    ? [
          { width: 360, theme: "day", axe: true, shot: true },
          { width: 1440, theme: "day", axe: true, shot: true },
          { width: 1440, theme: "night", axe: true, shot: true },
      ]
    : [
          { width: 360, theme: "day", axe: true, shot: true },
          { width: 360, theme: "night" },
          { width: 768, theme: "day" },
          { width: 768, theme: "night" },
          { width: 1440, theme: "day", axe: true, shot: true },
          { width: 1440, theme: "night", axe: true, shot: true },
      ];

const steps = [];
const log = (msg) => process.stdout.write(msg + "\n");

/** Runs an npm script and returns its exit code and output. */
function npm(script) {
    return new Promise((done) => {
        const child = spawn(process.platform === "win32" ? "npm.cmd" : "npm", ["run", script], { cwd: ROOT, shell: process.platform === "win32" });
        let out = "";
        child.stdout.on("data", (d) => (out += d));
        child.stderr.on("data", (d) => (out += d));
        child.on("close", (code) => done({ code, out }));
    });
}

/** The page addresses listed in dist/sitemap.xml, e.g. "/", "/studio". */
function sitemapPaths() {
    const xml = readFileSync(join(DIST, "sitemap.xml"), "utf8");
    return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname.replace(/\/$/, "") || "/");
}

// ---------------------------------------------------------------------------------------------
const startedAt = new Date();
log(`Formcraft offline check${FAST ? " (fast)" : ""}\n`);

if (!flag("--no-build")) {
    log("1/8 Lint…");
    const lint = await npm("lint");
    const warnings = (lint.out.match(/warning/gi) || []).length;
    steps.push({ name: "Lint (oxlint)", ok: lint.code === 0, detail: lint.code === 0 ? `${warnings} warning(s)` : lint.out.split("\n").filter((l) => /error/i.test(l)).slice(0, 5).join(" | ") });
    log("2/8 Build…");
    const build = await npm("build");
    steps.push({ name: "Build (vite + SEO pages)", ok: build.code === 0, detail: build.code === 0 ? (build.out.match(/seo-pages: [^\n]+/)?.[0] ?? "built") : build.out.slice(-400) });
    if (build.code !== 0) {
        log(build.out);
        log("\nThe build failed, so the browser checks can't run. Fix the build first.");
        process.exit(1);
    }
}

// Two stylesheets styling the same class can break pages far away (see css-collisions.mjs).
const collisions = findCssCollisions();
steps.push({ name: "CSS: no class name styled by two stylesheets", ok: !collisions.length, detail: collisions.length ? collisions.map((c) => `.${c.className} in ${c.files.join(" + ")}`).join("; ") : "none" });

log("3/8 Files in dist/…");
const missing = [];
if (!existsSync(join(DIST, "robots.txt"))) missing.push("robots.txt");
if (!existsSync(join(DIST, "sitemap.xml"))) missing.push("sitemap.xml");
const paths = missing.includes("sitemap.xml") ? ["/"] : sitemapPaths();
for (const p of paths) {
    const candidates = p === "/" ? ["index.html"] : [`${p.slice(1)}.html`, `${p.slice(1)}/index.html`];
    if (!candidates.some((c) => existsSync(join(DIST, c)))) missing.push(`${p} (no HTML page)`);
}
steps.push({ name: "SEO files: a page per sitemap address, sitemap.xml, robots.txt", ok: !missing.length, detail: missing.length ? `missing: ${missing.join(", ")}` : `${paths.length} addresses` });

log("4/8 Size budget…");
const indexHtml = readFileSync(join(DIST, "index.html"), "utf8");
const mainSrc = indexHtml.match(/<script[^>]+src="\/assets\/(index-[^"]+\.js)"/)?.[1];
const mainKb = mainSrc ? Math.round(gzipSync(readFileSync(join(DIST, "assets", mainSrc))).length / 1024) : 0;
const preloadKb = [...indexHtml.matchAll(/href="\/assets\/([^"]+\.js)"/g)].reduce((sum, m) => sum + gzipSync(readFileSync(join(DIST, "assets", m[1]))).length / 1024, 0);
steps.push({ name: `Main JavaScript under ${MAIN_JS_BUDGET_KB} kB (gzipped)`, ok: mainKb > 0 && mainKb <= MAIN_JS_BUDGET_KB, detail: `main ${mainKb} kB + ${Math.round(preloadKb)} kB preloaded` });

const pagesToCheck = only.length ? only : [...new Set([...paths, ...EXTRA_PAGES])];
log(`5/8 Pages: ${pagesToCheck.length} pages × ${VIEWS.length} views…`);
const stopPreview = await startPreview();
const { browser, name: browserName } = await launchBrowser({ headless: !flag("--headed") });
rmSync(OUT, { recursive: true, force: true });
mkdirSync(join(OUT, "shots"), { recursive: true });

let done = 0;
const total = pagesToCheck.length * VIEWS.length;
const jobs = pagesToCheck.flatMap((path) =>
    VIEWS.map((v) => async () => {
        const label = `${v.width}px ${v.theme}`;
        const slug = (path === "/" ? "home" : path.slice(1).replace(/[^a-z0-9]+/gi, "-")) + `-${v.width}-${v.theme}`;
        const context = await openContext(browser, { width: v.width, height: v.width < 768 ? 780 : 900, theme: v.theme });
        const result = await checkPage(context, BASE + path, {
            label,
            axe: v.axe && !flag("--no-axe"),
            screenshot: v.shot && !flag("--no-shots") ? join(OUT, "shots", `${slug}.png`) : null,
        });
        await context.close();
        done++;
        const errs = result.issues.filter((i) => i.severity === "error").length;
        if (errs || done % 10 === 0) log(`   ${done}/${total} ${path} ${label}${errs ? ` – ${errs} error(s)` : ""}`);
        return { path, result };
    })
);
const pageResults = await runPool(jobs, 6); // six pages at a time
const pages = pagesToCheck.map((path) => ({ path, results: pageResults.filter((r) => r.path === path).map((r) => r.result) }));

log("6/8 Click checks…");
const clicks = [];
for (const c of CLICK_CHECKS) {
    try {
        await c.run(browser);
        clicks.push({ name: c.name, ok: true, detail: "" });
    } catch (e) {
        clicks.push({ name: c.name, ok: false, detail: e.message.split("\n")[0] });
    }
    log(`   ${clicks.at(-1).ok ? "✓" : "✗"} ${c.name}${clicks.at(-1).ok ? "" : " – " + clicks.at(-1).detail}`);
}

log("7/8 Links…");
const links = only.length ? { checked: 0, broken: [] } : await checkLinks(browser, pagesToCheck.filter((p) => !p.includes("does-not-exist")));
for (const b of links.broken) log(`   ✗ ${b.link} (on ${b.from}) leads to the 404 page`);

if (!only.length && !flag("--no-weather")) {
    log("   Weather scenes: hero text contrast…");
    const wx = await checkWeatherContrast(browser, { fast: FAST, log });
    const clear = wx.failures.filter((f) => f.scene === "clear");
    steps.push({ name: "Hero text readable on a clear sky (AA)", ok: !clear.length, detail: clear.length ? clear.map((f) => `${f.page} ${f.theme} ${f.width}px "${f.text}" ${f.ratio}`).join("; ") : `${wx.checked} text checks in all scenes` });
    pages.push({
        path: "weather scenes (?sky=…)",
        results: [{ label: "contrast", url: "", screenshot: null, h1: [], issues: wx.failures.filter((f) => f.scene !== "clear").map((f) => ({ severity: "warning", kind: "weather contrast", label: `${f.scene} ${f.theme} ${f.width}px`, detail: `${f.page} "${f.text}": ${f.ratio} (needs ${f.need})` })) }],
    });
}

await browser.close();
stopPreview();

log("8/8 Report…");
const { errors, warnings } = await writeReport(join(OUT, "index.html"), { startedAt, browser: browserName, steps, pages, clicks, links });
// The same results as data, for scripts and for comparing one run with the next.
writeFileSync(join(OUT, "results.json"), JSON.stringify({ startedAt, browser: browserName, steps, pages, clicks, links }, null, 1));
const kinds = {};
for (const p of pages) for (const r of p.results) for (const i of r.issues) if (i.severity === "error") kinds[i.kind] = (kinds[i.kind] || 0) + 1;
log(`\n${errors ? "✗" : "✓"} ${errors} error(s), ${warnings} warning(s) – ${Math.round((Date.now() - startedAt) / 1000)} s`);
for (const [k, n] of Object.entries(kinds).sort((a, b) => b[1] - a[1])) log(`   ${n} × ${k}`);
log(`Report: ${join(OUT, "index.html")}`);
process.exit(errors ? 1 : 0);
