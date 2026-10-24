// Prints axe's colour-contrast findings with the measured ratios, for a few pages.
// Usage: node scripts/check/contrast-detail.mjs /studio /templates   (needs a build in dist/)
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { BASE, launchBrowser, openContext, startPreview } from "./lib.mjs";

const require = createRequire(import.meta.url);
const axe = readFileSync(require.resolve("axe-core/axe.min.js"), "utf8");
const paths = process.argv.slice(2).map((p) => "/" + p.replaceAll("\\", "/").replace(/^[A-Za-z]:\/.*?\/Git(?=\/|$)/, "").replace(/^\/+/, ""));
const stop = await startPreview();
const { browser } = await launchBrowser();
for (const theme of ["day", "night"]) {
    const ctx = await openContext(browser, { width: 1440, theme });
    for (const path of paths) {
        const page = await ctx.newPage();
        await page.goto(BASE + path, { waitUntil: "load" });
        await page.waitForTimeout(1500);
        await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 600) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)); } scrollTo(0, 0); });
        await page.waitForTimeout(800);
        await page.addScriptTag({ content: axe });
        const v = await page.evaluate(() => window.axe.run(document, { runOnly: ["color-contrast"] }));
        for (const x of v.violations) for (const n of x.nodes) {
            const d = n.any[0]?.data || {};
            console.log(`${theme} ${path} | ${n.target.join(" ")} | ${d.contrastRatio}:1 (needs ${d.expectedContrastRatio}) fg ${d.fgColor} bg ${d.bgColor} ${d.fontSize} | "${(n.html || "").replace(/\s+/g, " ").slice(0, 80)}"`);
        }
        await page.close();
    }
    await ctx.close();
}
await browser.close();
stop();
