// Click checks: uses the site like a visitor would, by clicking, typing and pressing keys,
// and checks that each thing does what it should.
//
// Each check below is a small story ("open the menu, press Escape, the menu closes and the focus goes
// back to the menu button"). A check passes or fails, and a failure says what went wrong.
// They run in the real Chrome on this computer, with the internet blocked (see lib.mjs).

import { BASE, isExpectedOfflineNoise, openContext, runPool, wait } from "./lib.mjs";
import { NOT_FOUND_HEADING } from "./page-checks.mjs";

/** Opens a page and waits for its main heading. */
async function open(context, path) {
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message.split("\n")[0]));
    page.on("console", (m) => m.type() === "error" && !isExpectedOfflineNoise(m.text()) && errors.push(m.text().slice(0, 160)));
    await page.goto(BASE + path, { waitUntil: "load" });
    await page.waitForSelector("main h1", { timeout: 15000 }).catch(() => {});
    await wait(300);
    return { page, errors };
}

const h1Text = (page) => page.locator("main h1").first().textContent({ timeout: 5000 }).then((t) => t.trim()).catch(() => "");
const focused = (page) => page.evaluate(() => { const e = document.activeElement; return e ? (e.getAttribute("aria-label") || e.textContent || e.tagName).trim().slice(0, 40) : ""; });

/**
 * The list of click checks. Each has a name and a `run(browser)` that throws an Error to fail.
 * Add new checks here; keep each one short and say in plain words what it proves.
 */
export const CLICK_CHECKS = [
    {
        name: "Old addresses redirect to the new pages",
        async run(browser) {
            const ctx = await openContext(browser, { width: 1440 });
            const wrong = [];
            for (const [from, to] of [["/shop", "/stores"], ["/portfolio", "/projects"], ["/services", "/studio"], ["/blog", "/journal"], ["/plans", "/templates"]]) {
                const { page } = await open(ctx, from);
                const at = new URL(page.url()).pathname;
                if (at !== to) wrong.push(`${from} went to ${at}, expected ${to}`);
                await page.close();
            }
            await ctx.close();
            if (wrong.length) throw new Error(wrong.join("; "));
        },
    },
    {
        name: "A page that doesn't exist shows the friendly 404 page with a way back",
        async run(browser) {
            const ctx = await openContext(browser, { width: 1440 });
            const { page } = await open(ctx, "/this-page-does-not-exist");
            const heading = await h1Text(page);
            const links = await page.locator("main a[href='/'], main a[href^='/']").count();
            await ctx.close();
            if (!NOT_FOUND_HEADING.test(heading)) throw new Error(`heading was "${heading}"`);
            if (!links) throw new Error("no links back into the site");
        },
    },
    {
        name: "The first Tab press lands on 'Skip to content', then the header",
        async run(browser) {
            const ctx = await openContext(browser, { width: 1440 });
            const { page } = await open(ctx, "/about");
            await page.keyboard.press("Tab");
            const first = await focused(page);
            await page.keyboard.press("Tab");
            const second = await page.evaluate(() => !!document.activeElement?.closest("header"));
            await ctx.close();
            if (!/skip to content/i.test(first)) throw new Error(`first Tab stop was "${first}"`);
            if (!second) throw new Error("the second Tab stop isn't in the header");
        },
    },
    {
        name: "Phone menu opens, closes with Escape, and gives the focus back",
        async run(browser) {
            const ctx = await openContext(browser, { width: 360, height: 780 });
            const { page } = await open(ctx, "/about");
            const button = page.getByRole("button", { name: /open menu/i }).first();
            await button.click();
            await wait(400);
            // The phone menu is a slide-out panel (a dialog) with the site's links in it.
            const linksShown = await page.getByRole("dialog").locator("a[href='/studio']").first().isVisible().catch(() => false);
            await page.keyboard.press("Escape");
            await wait(400);
            const back = await focused(page);
            const stillOpen = await page.locator("[role=dialog]:visible").count();
            await ctx.close();
            if (!linksShown) throw new Error("the menu didn't show the Studio link");
            if (stillOpen) throw new Error("Escape didn't close the menu");
            if (!/menu/i.test(back)) throw new Error(`focus went to "${back}" instead of the menu button`);
        },
    },
    {
        name: "Day/night switch changes the edition and saves the choice for the next visit",
        async run(browser) {
            const ctx = await openContext(browser, { width: 1440, theme: "day" });
            const { page } = await open(ctx, "/about");
            await page.getByRole("button", { name: /switch to the night edition/i }).first().click();
            await wait(300);
            const now = await page.evaluate(() => document.documentElement.dataset.theme);
            const saved = await page.evaluate(() => localStorage.getItem("fc-theme")); // what the next visit starts with
            await ctx.close();
            if (now !== "night") throw new Error(`edition after the switch: ${now}`);
            if (saved !== "night") throw new Error(`saved edition: ${saved}`);
        },
    },
    {
        // Pre-rendered pages must be adopted by React, not thrown away and drawn again from the skeleton (which
        // flickers and replays the animations). Found in review on 2026-10-25: a page still loading while the
        // providers updated made React redraw it; main.jsx now loads the page's code before adopting it.
        name: "Pre-rendered pages are adopted, not redrawn (no skeleton, the built heading stays the same element)",
        async run(browser) {
            for (const path of ["/", "/studio", "/contact", "/stores/oak-armchair"]) {
                const ctx = await openContext(browser, { width: 1440 });
                await ctx.addInitScript(() => {
                    window.__skeleton = false;
                    document.addEventListener("DOMContentLoaded", () => {
                        window.__builtH1 = document.querySelector("#root h1");
                        new MutationObserver(() => {
                            if (document.querySelector('#main [aria-busy="true"]')) window.__skeleton = true;
                        }).observe(document.getElementById("root"), { childList: true, subtree: true, attributes: true, attributeFilter: ["aria-busy"] });
                    });
                });
                const page = await ctx.newPage();
                await page.goto(BASE + path, { waitUntil: "load" });
                await wait(2500);
                const r = await page.evaluate(() => ({ built: Boolean(window.__builtH1), kept: Boolean(window.__builtH1?.isConnected), skeleton: window.__skeleton }));
                await ctx.close();
                if (!r.built) throw new Error(`${path}: no pre-built heading in the HTML`);
                if (!r.kept || r.skeleton) throw new Error(`${path}: the pre-built page was redrawn${r.skeleton ? " (skeleton shown)" : ""}`);
            }
        },
    },
    {
        name: "Shop: add a product to the cart, change the quantity, close with Escape",
        async run(browser) {
            const ctx = await openContext(browser, { width: 1440 });
            const { page, errors } = await open(ctx, "/stores");
            const href = await page.locator("main a[href^='/stores/']").first().getAttribute("href");
            if (!href) throw new Error("no product links on /stores");
            await page.goto(BASE + href, { waitUntil: "load" });
            await page.waitForSelector("main h1");
            await page.getByRole("button", { name: /add to cart/i }).first().click();
            await wait(500);
            const drawer = page.getByRole("dialog").first();
            if (!(await drawer.isVisible().catch(() => false))) throw new Error("the cart didn't open after 'Add to cart'");
            await drawer.getByRole("button", { name: /one more/i }).first().click();
            await wait(300);
            const text = (await drawer.innerText()).replace(/\s+/g, " ");
            await page.keyboard.press("Escape");
            await wait(400);
            const closed = !(await drawer.isVisible().catch(() => false));
            const label = await page.getByRole("button", { name: /^cart/i }).first().getAttribute("aria-label").catch(() => "");
            await ctx.close();
            if (!/\b2\b/.test(text)) throw new Error(`quantity didn't go to 2: "${text.slice(0, 120)}"`);
            if (!closed) throw new Error("Escape didn't close the cart");
            if (!/2 items/.test(label || "")) throw new Error(`cart button says "${label}"`);
            if (errors.length) throw new Error(errors.join("; "));
        },
    },
    {
        name: "Plant-a-tree opens a small pop-up by its button (not over the middle of the page), Escape closes it",
        async run(browser) {
            for (const width of [1440, 360]) {
                const ctx = await openContext(browser, { width, height: width < 768 ? 780 : 900 });
                const { page } = await open(ctx, "/about");
                // on phones the button only appears after scrolling past the first screen
                await page.evaluate(() => window.scrollTo({ top: window.innerHeight, behavior: "instant" }));
                await wait(500);
                await page.locator(".donate-fab").first().click();
                await wait(500);
                const box = await page.locator(".donate-fab-pop").first().boundingBox();
                const view = page.viewportSize();
                await page.keyboard.press("Escape");
                await wait(400);
                const open_ = await page.locator(".donate-fab-pop").first().isVisible().catch(() => false);
                const back = await page.evaluate(() => !!document.activeElement?.closest(".donate-fab"));
                await ctx.close();
                if (!box) throw new Error(`${width}px: the pop-up didn't open`);
                const coversMiddle = box.x < view.width / 2 - 1 && box.x + box.width > view.width / 2 + 1 && box.y < view.height / 2 && box.y + box.height > view.height / 2;
                if (width >= 768 && coversMiddle) throw new Error(`${width}px: the pop-up covers the middle of the screen`);
                if (open_) throw new Error(`${width}px: Escape didn't close the pop-up`);
                if (!back) throw new Error(`${width}px: focus didn't return to the plant-a-tree button`);
            }
        },
    },
    {
        name: "Cookie notice: 'Accept' hides it and it stays hidden after a reload",
        async run(browser) {
            const ctx = await openContext(browser, { width: 1440 });
            const { page } = await open(ctx, "/about");
            const notice = page.locator(".consent").first();
            if (!(await notice.isVisible().catch(() => false))) throw new Error("the cookie notice didn't show on a first visit");
            await notice.getByRole("button", { name: /accept/i }).click();
            await wait(300);
            await page.reload({ waitUntil: "load" });
            await wait(800);
            const again = await page.locator(".consent").first().isVisible().catch(() => false);
            await ctx.close();
            if (again) throw new Error("the cookie notice came back after accepting");
        },
    },
    {
        name: "Contact form: sending it empty shows what's missing and stays on the page",
        async run(browser) {
            const ctx = await openContext(browser, { width: 1440 });
            const { page } = await open(ctx, "/contact");
            const form = page.locator("main form").first();
            await form.locator("button[type=submit], button:not([type])").last().click();
            await wait(500);
            const stillHere = new URL(page.url()).pathname === "/contact";
            const flagged = await form.evaluate((f) => f.querySelectorAll(":invalid, [aria-invalid=true]").length);
            await ctx.close();
            if (!stillHere) throw new Error("the page changed after sending an empty form");
            if (!flagged) throw new Error("no field was marked as missing");
        },
    },
    {
        name: "Home: the hero shows the 3D model or the 2D drawing, and the view buttons work",
        async run(browser) {
            const ctx = await openContext(browser, { width: 1440 });
            const { page, errors } = await open(ctx, "/");
            await page.waitForFunction(() => document.documentElement.hasAttribute("data-hotel-built") || document.querySelector(".hotel-2d svg, .hotel2d svg"), null, { timeout: 30000 }).catch(() => {});
            const mode = await page.evaluate(() => document.documentElement.dataset.hotel || (document.querySelector("canvas") ? "3d" : "2d"));
            const back = page.getByRole("button", { name: /^back$/i }).first();
            if (await back.isVisible().catch(() => false)) {
                await back.click();
                await wait(1200);
            }
            const preview = await page.locator(".hotel-preview").count();
            await ctx.close();
            if (preview) throw new Error("the dev-only preview switch is in the production build");
            if (errors.length) throw new Error(`${mode}: ${errors.join("; ")}`);
        },
    },
];

/**
 * Visits every page in `paths`, collects every link to another page of the site, and opens each one
 * to make sure it doesn't land on the 404 page.
 * @param {import("playwright-core").Browser} browser
 * @param {string[]} paths
 * @returns {Promise<{ checked: number, broken: Array<{ link: string, from: string }> }>}
 */
export async function checkLinks(browser, paths) {
    const ctx = await openContext(browser, { width: 1440 });
    const found = new Map(); // link → the first page it was found on
    for (const path of paths) {
        const { page } = await open(ctx, path);
        const hrefs = await page.evaluate(() => [...document.querySelectorAll("a[href]")].map((a) => a.getAttribute("href")));
        for (const h of hrefs) {
            if (!h || !h.startsWith("/") || h.startsWith("//")) continue;
            const clean = h.split("#")[0].split("?")[0] || "/";
            if (!found.has(clean)) found.set(clean, path);
        }
        await page.close();
    }
    // Open the links six at a time; files (PDFs, images) are just fetched.
    const results = await runPool(
        [...found].map(([link, from]) => async () => {
            if (/\.(pdf|png|jpe?g|webp|svg|xml|txt|zip)$/i.test(link)) {
                const res = await fetch(BASE + link).catch(() => null);
                return !res || !res.ok ? { link, from } : null;
            }
            const { page } = await open(ctx, link);
            const lost = NOT_FOUND_HEADING.test(await h1Text(page));
            await page.close();
            return lost ? { link, from } : null;
        }),
        6
    );
    const broken = results.filter(Boolean);
    await ctx.close();
    return { checked: found.size, broken };
}
