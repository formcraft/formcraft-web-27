#!/usr/bin/env node
// Where scrolling time goes on a page (for diagnosing check:smooth "slow frames"): records a Chrome
// trace while scrolling with the phone profile (360 px, CPU slowed 4×) and sums the main-thread time
// by kind of work: script, style, layout, paint, compositing, image decoding.
// Usage: node scripts/check/scroll-profile.mjs /invest [--desktop]   (needs a build in dist/)
import { BASE, launchBrowser, openContext, startPreview, wait } from "./lib.mjs";

const toPath = (p) => "/" + p.replaceAll("\\", "/").replace(/^[A-Za-z]:\/.*?\/Git(?=\/|$)/, "").replace(/^\/+/, "");
const path = toPath(process.argv.slice(2).find((a) => !a.startsWith("--")) || "/");
const desktop = process.argv.includes("--desktop");
const stop = await startPreview();
const { browser } = await launchBrowser();
const ctx = await openContext(browser, desktop ? { width: 1440, height: 900 } : { width: 360, height: 780 });
const page = await ctx.newPage();
const cdp = await ctx.newCDPSession(page);
if (!desktop) await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
await page.goto(BASE + path, { waitUntil: "load" });
await wait(3000);
await page.mouse.move(150, 300);
await browser.startTracing(page, { categories: ["devtools.timeline", "disabled-by-default-devtools.timeline"] });
for (let i = 0; i < 40; i++) {
    await page.mouse.wheel(0, 160);
    await wait(40);
}
await wait(500);
const trace = JSON.parse((await browser.stopTracing()).toString());
await browser.close();
stop();

const ev = trace.traceEvents;
const mainThread = ev.find((e) => e.name === "thread_name" && e.args?.name === "CrRendererMain" && ev.some((x) => x.pid === e.pid && x.tid === e.tid && x.name === "RunTask" && x.dur > 1000));
const kinds = {
    script: ["FunctionCall", "EvaluateScript", "TimerFire", "FireAnimationFrame", "EventDispatch", "v8.callFunction"],
    style: ["UpdateLayoutTree", "RecalculateStyles", "ParseAuthorStyleSheet"],
    layout: ["Layout"],
    paint: ["Paint", "PaintImage", "RasterTask", "PrePaint"],
    composite: ["Layerize", "UpdateLayer", "CompositeLayers", "Commit"],
    decode: ["Decode Image", "ImageDecodeTask", "Decode LazyPixelRef"],
};
const totals = Object.fromEntries(Object.keys(kinds).map((k) => [k, 0]));
for (const e of ev) {
    if (e.pid !== mainThread?.pid || e.tid !== mainThread?.tid || !e.dur) continue;
    for (const [k, names] of Object.entries(kinds)) if (names.includes(e.name)) totals[k] += e.dur / 1000;
}
const frames = ev.filter((e) => e.name === "DrawFrame" || e.name === "Graphics.Pipeline.SubmitCompositorFrame").length;
console.log(`${path} (${desktop ? "desktop" : "phone, CPU ×4"}): main-thread time while scrolling ~2 s`);
for (const [k, ms] of Object.entries(totals).sort((a, b) => b[1] - a[1])) console.log(`  ${k.padEnd(10)} ${Math.round(ms)} ms`);
console.log(`  frames drawn: ${frames}`);
// the heaviest single paints, by the layer/element name Chrome records
const paints = ev.filter((e) => e.pid === mainThread?.pid && e.name === "Paint" && e.dur).sort((a, b) => b.dur - a.dur).slice(0, 5);
for (const p of paints) console.log(`  paint ${Math.round(p.dur / 1000)} ms  ${JSON.stringify(p.args?.data?.clip?.slice?.(0, 4) ?? p.args?.data?.layerId ?? "")}`);
