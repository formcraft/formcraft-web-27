#!/usr/bin/env node
// `npm run check:smooth`: how smooth each page feels, measured in the real Chrome on this computer.
//
// For every page, as a desktop and as a mid-range phone (360 px wide, processor slowed 4×):
//   - Layout shift (CLS): how much content jumps around while the page loads and scrolls.
//     Google's "good" limit is 0.1; above 0.25 is "poor".
//   - Blocking time: how long the page's main thread is frozen (tasks over 50 ms) from loading until it
//     settles. While it's blocked, taps and scrolling feel stuck.
//   - Scrolling: the page is scrolled from top to bottom with real mouse-wheel input while every frame
//     is timed. Reported: average frames per second, the share of slow frames (over 50 ms, which
//     reads as a stutter) and the slowest frame.
// The internet is blocked (see lib.mjs), so results only depend on the site itself.
// It writes check-report/smooth.json and prints a table; findings over the limits are flagged.
//
// Options: --only /path (repeat), --no-build (default: builds first unless dist/ exists), --headed
// Run `npm run build` first if you changed the code.

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { BASE, ROOT, launchBrowser, openContext, startPreview, wait } from "./lib.mjs";

const argv = process.argv.slice(2);
const toPath = (p) => "/" + p.replaceAll("\\", "/").replace(/^[A-Za-z]:\/.*?\/Git(?=\/|$)/, "").replace(/^\/+/, "");
const only = argv.flatMap((a, i) => (a === "--only" && argv[i + 1] ? [toPath(argv[i + 1])] : []));
const OUT = join(ROOT, "check-report");

// Limits (from Google's Core Web Vitals and common smoothness practice)
const LIMITS = { cls: 0.1, clsPoor: 0.25, blockingMs: 600, slowFramePct: 10, worstFrameMs: 250 };

const PROFILES = [
    { name: "desktop", width: 1440, height: 900, cpu: 1 },
    { name: "mid-range phone", width: 360, height: 780, cpu: 4 },
];

/** The page addresses in the built sitemap, e.g. "/", "/studio". */
const sitemapPaths = () =>
    [...readFileSync(join(ROOT, "dist", "sitemap.xml"), "utf8").matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname.replace(/\/$/, "") || "/");

// Runs in the page before anything else: starts recording layout shifts and long tasks.
const recorder = () => {
    window.__smooth = { cls: 0, longTasks: [] };
    try {
        new PerformanceObserver((list) => {
            for (const e of list.getEntries()) if (!e.hadRecentInput) window.__smooth.cls += e.value;
        }).observe({ type: "layout-shift", buffered: true });
        new PerformanceObserver((list) => {
            for (const e of list.getEntries()) window.__smooth.longTasks.push([e.startTime, e.duration]);
        }).observe({ type: "longtask", buffered: true });
    } catch {
        // older browsers: no numbers, no crash
    }
};

async function measure(browser, path, profile) {
    const context = await openContext(browser, { width: profile.width, height: profile.height, theme: "day" });
    await context.addInitScript(recorder);
    const page = await context.newPage();
    const cdp = await context.newCDPSession(page);
    if (profile.cpu > 1) await cdp.send("Emulation.setCPUThrottlingRate", { rate: profile.cpu });
    try {
        await page.goto(BASE + path, { waitUntil: "load", timeout: 60000 });
        await page.waitForSelector("main h1", { timeout: 20000 }).catch(() => {});
        await wait(1500); // let it settle (images, fonts, the 3D build start)
        const settledAt = await page.evaluate(() => performance.now());

        // Scroll top to bottom with real wheel input, timing every frame meanwhile.
        await page.mouse.move(profile.width / 2, profile.height / 2);
        await page.evaluate(() => {
            window.__frames = [];
            let last = performance.now();
            const tick = (now) => {
                window.__frames.push(now - last);
                last = now;
                if (!window.__stopFrames) requestAnimationFrame(tick);
            };
            requestAnimationFrame(tick);
        });
        const height = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
        const steps = Math.min(120, Math.ceil(height / 160));
        for (let i = 0; i < steps; i++) {
            await page.mouse.wheel(0, 160);
            await wait(40);
        }
        await wait(600);
        const r = await page.evaluate((settled) => {
            window.__stopFrames = true;
            const frames = window.__frames.slice(2); // the first frames include the start-up gap
            const total = frames.reduce((a, b) => a + b, 0);
            const blocking = window.__smooth.longTasks.filter(([start]) => start <= settled).reduce((sum, [, d]) => sum + Math.max(0, d - 50), 0);
            return {
                cls: Math.round(window.__smooth.cls * 1000) / 1000,
                blockingMs: Math.round(blocking),
                fps: frames.length && total ? Math.round((frames.length / total) * 1000) : null,
                slowFramePct: frames.length ? Math.round((frames.filter((f) => f > 50).length / frames.length) * 1000) / 10 : null,
                worstFrameMs: frames.length ? Math.round(Math.max(...frames)) : null,
                scrolledTo: Math.round(scrollY),
            };
        }, settledAt);
        return { path, profile: profile.name, ...r };
    } catch (e) {
        return { path, profile: profile.name, error: e.message.split("\n")[0] };
    } finally {
        await context.close();
    }
}

const flagsFor = (r) => {
    const f = [];
    if (r.error) return [`failed: ${r.error}`];
    if (r.cls > LIMITS.clsPoor) f.push(`layout shift ${r.cls} (poor)`);
    else if (r.cls > LIMITS.cls) f.push(`layout shift ${r.cls}`);
    if (r.blockingMs > LIMITS.blockingMs) f.push(`blocked ${r.blockingMs} ms while loading`);
    if (r.slowFramePct > LIMITS.slowFramePct) f.push(`${r.slowFramePct}% slow frames while scrolling`);
    if (r.worstFrameMs > LIMITS.worstFrameMs) f.push(`a ${r.worstFrameMs} ms freeze while scrolling`);
    return f;
};

const stop = await startPreview();
const { browser, name } = await launchBrowser({ headless: !argv.includes("--headed") });
const paths = only.length ? only : sitemapPaths().filter((p) => !/^\/(stores|projects|journal)\/./.test(p) || /oak-armchair|karwani|model-it/.test(p));
console.log(`Smoothness check in ${name}: ${paths.length} pages × ${PROFILES.length} profiles\n`);
const results = [];
for (const path of paths) {
    for (const profile of PROFILES) {
        const r = await measure(browser, path, profile);
        results.push(r);
        const flags = flagsFor(r);
        console.log(
            `${(flags.length ? "!" : "✓")} ${path.padEnd(34)} ${profile.name.padEnd(16)} CLS ${String(r.cls ?? "-").padEnd(6)} blocked ${String(r.blockingMs ?? "-").padStart(5)} ms  scroll ${String(r.fps ?? "-").padStart(3)} fps, slow ${String(r.slowFramePct ?? "-").padStart(4)}%, worst ${String(r.worstFrameMs ?? "-").padStart(4)} ms${flags.length ? "  ← " + flags.join("; ") : ""}`
        );
    }
}
await browser.close();
stop();
mkdirSync(OUT, { recursive: true });
writeFileSync(join(OUT, "smooth.json"), JSON.stringify({ at: new Date(), browser: name, limits: LIMITS, results }, null, 1));
const flagged = results.filter((r) => flagsFor(r).length);
console.log(`\n${flagged.length ? "!" : "✓"} ${flagged.length} of ${results.length} measurements over a limit. Details: check-report/smooth.json`);
process.exit(0); // smoothness is reported, not a hard failure: numbers vary a little between runs
