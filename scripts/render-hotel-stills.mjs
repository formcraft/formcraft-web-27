// Re-render the still pictures of the Home 3D hotel (public/images/hotel-{land|port}-{day|night}.webp)
// after changing the scene. They must match the scene's first frame, because the live 3D fades in
// over them.
//
//   npm run dev                                   # in one terminal
//   npx --yes playwright@1 install chromium       # once
//   node scripts/render-hotel-stills.mjs          # in another (needs Python + Pillow for WebP)
//
// Uses your real GPU (headed Chromium) for the best shadows. Output: PNGs in ./hotel-stills/, then
// converted to WebP into public/images/.
import { chromium } from "playwright";
import { execFileSync } from "node:child_process";
import { mkdirSync } from "node:fs";

const BASE = process.env.DEV_URL || "http://localhost:5173";
mkdirSync("hotel-stills", { recursive: true });
const browser = await chromium.launch({ headless: false });
for (const [name, width, height] of [["land", 1600, 1000], ["port", 860, 1800]]) {
    for (const theme of ["day", "night"]) {
        const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1 });
        await ctx.addInitScript((t) => {
            localStorage.setItem("fc-theme", t);
            sessionStorage.setItem("fc-intro", "1"); // skip the opening animation
        }, theme);
        const page = await ctx.newPage();
        await page.goto(`${BASE}/?still=1`);
        await page.waitForFunction(() => window.__hotelStillReady === true, null, { timeout: 120000 });
        await page.screenshot({ path: `hotel-stills/${name}-${theme}.png` });
        console.log("rendered", name, theme);
        await ctx.close();
    }
}
await browser.close();
execFileSync("python3", ["-c", `
from PIL import Image
for n in ['land-day','land-night','port-day','port-night']:
    Image.open(f'hotel-stills/{n}.png').convert('RGB').save(f'public/images/hotel-{n}.webp','WEBP',quality=72,method=6)
print('saved WebP stills to public/images/')
`], { stdio: "inherit" });
