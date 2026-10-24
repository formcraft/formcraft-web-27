#!/usr/bin/env node
// Which elements cause layout shift (CLS) on a page, and when. For diagnosing check:smooth findings.
// Usage: node scripts/check/shift-detail.mjs /about [/studio …]   (needs a build in dist/)
import { BASE, launchBrowser, openContext, startPreview, wait } from "./lib.mjs";

const toPath = (p) => "/" + p.replaceAll("\\", "/").replace(/^[A-Za-z]:\/.*?\/Git(?=\/|$)/, "").replace(/^\/+/, "");
const paths = process.argv.slice(2).map(toPath);
const stop = await startPreview();
const { browser } = await launchBrowser();
for (const width of [1440, 360]) {
    for (const path of paths) {
        const ctx = await openContext(browser, { width, height: width < 768 ? 780 : 900 });
        await ctx.addInitScript(() => {
            window.__shifts = [];
            const name = (n) => (n && n.nodeType === 1 ? `${n.tagName.toLowerCase()}${n.id ? "#" + n.id : ""}${typeof n.className === "string" && n.className.trim() ? "." + n.className.trim().split(/\s+/).slice(0, 2).join(".") : ""}` : n ? "#text" : "?");
            new PerformanceObserver((list) => {
                for (const e of list.getEntries()) {
                    if (e.hadRecentInput) continue;
                    window.__shifts.push({
                        at: Math.round(e.startTime),
                        value: Math.round(e.value * 1000) / 1000,
                        sources: (e.sources || []).slice(0, 8).map((s) => `${name(s.node)} y ${Math.round(s.previousRect.y)}→${Math.round(s.currentRect.y)} h ${Math.round(s.previousRect.height)}→${Math.round(s.currentRect.height)}`),
                    });
                }
            }).observe({ type: "layout-shift", buffered: true });
        });
        const page = await ctx.newPage();
        await page.goto(BASE + path, { waitUntil: "load" });
        await wait(2500);
        const shifts = await page.evaluate(() => window.__shifts);
        const total = shifts.reduce((s, x) => s + x.value, 0);
        console.log(`\n${path} at ${width}px: CLS ${total.toFixed(3)}`);
        for (const s of shifts.sort((a, b) => b.value - a.value).slice(0, 5)) console.log(`  ${s.value} at ${s.at} ms: ${s.sources.join(" | ")}`);
        await ctx.close();
    }
}
await browser.close();
stop();
