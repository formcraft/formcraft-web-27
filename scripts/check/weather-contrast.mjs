// Weather contrast check (part of `npm run check`): the page heroes' words must stay readable in every weather scene.
// For each hero page × scene (?sky=…) × edition × screen size it reads each line of hero text's colour, hides the text,
// takes a screenshot of what's behind it (sky, clouds, rain, hills) and measures the WCAG contrast ratio against the
// background pixels. The worst 10 % of pixels count, so a few rain streaks don't fail it but a dark cloud deck does.
// Limits: 4.5 for normal text, 3 for large text (24 px, or 18.5 px bold). Reduced motion gives one still frame.
import { BASE, runPool } from "./lib.mjs";

const SCENES = ["clear", "partly", "overcast", "mist", "rain", "storm"];
const PAGES_FULL = ["/studio", "/construction", "/concrete", "/stores", "/about", "/community", "/invest"];
const PAGES_FAST = ["/studio", "/stores", "/invest"];
const SIZES = [
    { width: 360, height: 780 },
    { width: 1440, height: 900 },
];
// hides every word in the hero but keeps the scenery: text-fill only paints text (SVG fills use currentColor, untouched),
// and it survives the page re-rendering once its data arrives
const HIDE = ".page-hero, .page-hero * { -webkit-text-fill-color: transparent !important; text-shadow: none !important; text-decoration-color: transparent !important; caret-color: transparent !important; }";

// In the page: mark the hero's text, return each one's colour, size and box
const findText = () => {
    const hero = document.querySelector(".page-hero");
    if (!hero) return [];
    const out = [];
    for (const el of hero.querySelectorAll("h1, p, li, a, span, .eyebrow")) {
        if (el.closest("[aria-hidden='true'], button, .btn, .sky-tester")) continue;
        const own = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
        if (!own) continue;
        const r = el.getBoundingClientRect(), cs = getComputedStyle(el);
        if (r.width < 4 || r.height < 4 || r.bottom < 0 || r.top > innerHeight || cs.visibility === "hidden" || Number(cs.opacity) === 0) continue;
        const size = parseFloat(cs.fontSize), bold = Number(cs.fontWeight) >= 700;
        out.push({ text: el.textContent.trim().slice(0, 40), color: cs.color, large: size >= 24 || (bold && size >= 18.5), box: { x: r.x, y: Math.max(0, r.y), w: r.width, h: Math.min(r.bottom, innerHeight) - Math.max(0, r.y) } });
    }
    return out;
};

// In the page: the 10th-percentile contrast of each text against the screenshot's pixels behind it
const measure = async ({ png, items }) => {
    const img = new Image();
    img.src = `data:image/png;base64,${png}`;
    await img.decode();
    const c = document.createElement("canvas");
    c.width = img.width;
    c.height = img.height;
    const ctx = c.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(img, 0, 0);
    const lin = (v) => ((v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
    const lum = (r, g, b) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
    return items.map(({ color, box }) => {
        const [fr, fg, fb, fa = 1] = color.match(/[\d.]+/g).map(Number);
        const x = Math.round(box.x), y = Math.round(box.y), w = Math.max(1, Math.round(box.w)), h = Math.max(1, Math.round(box.h));
        const data = ctx.getImageData(x, y, Math.min(w, c.width - x), Math.min(h, c.height - y)).data;
        const ratios = [];
        for (let i = 0; i < data.length; i += 4 * 3) {
            const br = data[i], bg = data[i + 1], bb = data[i + 2];
            // see-through ink: the text's real colour over this pixel
            const a = lum(br + (fr - br) * fa, bg + (fg - bg) * fa, bb + (fb - bb) * fa), b = lum(br, bg, bb);
            ratios.push((Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05));
        }
        ratios.sort((p, q) => p - q);
        return ratios.length ? ratios[Math.floor(ratios.length * 0.1)] : 21;
    });
};

/**
 * Runs the weather contrast check.
 * @param {import("playwright-core").Browser} browser
 * @param {{ fast?: boolean, log?: (s: string) => void }} [o]
 * @returns {Promise<{ checked: number, failures: { page: string, scene: string, theme: string, width: number, text: string, ratio: number, need: number }[] }>}
 */
export async function checkWeatherContrast(browser, { fast = false, log = () => {} } = {}) {
    const pages = fast ? PAGES_FAST : PAGES_FULL;
    const jobs = pages.flatMap((page) =>
        ["day", "night"].flatMap((theme) =>
            SIZES.map((size) => async () => {
                const context = await browser.newContext({ viewport: size, serviceWorkers: "block", reducedMotion: "reduce", hasTouch: size.width < 768 });
                await context.route(/^(?!http:\/\/localhost:\d+\/)/, (route) => route.abort("blockedbyclient"));
                await context.addInitScript((edition) => {
                    try {
                        localStorage.setItem("fc-theme", edition);
                        localStorage.setItem("fc-consent", JSON.stringify({ analytics: false, at: Date.now() }));
                        sessionStorage.setItem("fc-intro", "1");
                    } catch {
                        // storage blocked: defaults
                    }
                }, theme);
                const p = await context.newPage();
                const found = [];
                let checked = 0;
                for (const scene of SCENES) {
                    await p.goto(`${BASE}${page}?sky=${scene}`, { waitUntil: "load" });
                    await p.waitForSelector(`.page-hero[data-weather="${scene}"]`, { timeout: 15000 }).catch(() => {});
                    await p.waitForTimeout(1300); // the weather layers fade in
                    const items = await p.evaluate(findText);
                    const style = await p.addStyleTag({ content: HIDE });
                    const png = (await p.screenshot()).toString("base64");
                    await style.evaluate((el) => el.remove());
                    const again = await p.evaluate(findText); // the boxes must not have moved while hiding
                    if (JSON.stringify(again.map((i) => i.box)) !== JSON.stringify(items.map((i) => i.box))) throw new Error(`${page} ?sky=${scene}: the hero moved during the contrast check`);
                    const ratios = await p.evaluate(measure, { png, items });
                    items.forEach((it, i) => {
                        checked++;
                        const need = it.large ? 3 : 4.5;
                        if (ratios[i] < need) found.push({ page, scene, theme, width: size.width, text: it.text, ratio: Math.round(ratios[i] * 100) / 100, need });
                    });
                }
                await context.close();
                log(`   ${page} ${theme} ${size.width}px: ${found.length ? `${found.length} below the limit` : "all readable"}`);
                return { checked, found };
            })
        )
    );
    const results = await runPool(jobs, 4);
    return { checked: results.reduce((n, r) => n + r.checked, 0), failures: results.flatMap((r) => r.found) };
}
