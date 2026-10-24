// Page checks: opens one page at one screen size and edition, and looks for layout problems.
//
// In plain words, for each page it:
// 1. loads the page and waits until it's settled;
// 2. scrolls slowly to the bottom and back (so animated sections and lazy images appear, like for a visitor);
// 3. looks at every piece of visible text on the page and asks:
//    - does it sit on top of another piece of text? (the "text clash" the owner noticed)
//    - does it run off the side of the screen?
//    - is it cut off by its box?
// 4. at the top, middle and bottom of the page, checks the floating pieces (cookie notice, plant-a-tree
//    button, pop-ups): do two of them sit on top of each other, and do they cover page text?
// 5. checks the basics every page needs: exactly one main heading, a title, a description, no sideways
//    scrolling, no broken images, no script errors;
// 6. optionally runs axe (an accessibility checker) and takes a screenshot.
//
// Every finding has a severity: "error" (must fix, makes `npm run check` fail) or "warning" (look at it).

import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { isExpectedOfflineNoise, wait } from "./lib.mjs";

const require = createRequire(import.meta.url);
let axeSource = null;
const loadAxe = async () => (axeSource ??= await readFile(require.resolve("axe-core/axe.min.js"), "utf8"));

/** The heading the site's 404 page shows; a link that lands here is broken. */
export const NOT_FOUND_HEADING = /isn't on the drawings/i;

/**
 * Runs inside the browser page. Measures the page and returns raw findings.
 * Kept self-contained (no outside variables), because the browser runs a copy of it.
 * @param {{ fixedOnly?: boolean }} options  fixedOnly: only check floating pieces (used at other scroll positions)
 */
function measurePage({ fixedOnly = false } = {}) {
    const vw = document.documentElement.clientWidth;
    const vh = window.innerHeight;
    const describe = (el) => {
        if (!el) return "?";
        const id = el.id ? `#${el.id}` : "";
        const cls = typeof el.className === "string" && el.className.trim() ? "." + el.className.trim().split(/\s+/).slice(0, 2).join(".") : "";
        return `${el.tagName.toLowerCase()}${id}${cls}`;
    };
    // How see-through an element really is: opacity multiplies down the tree.
    const shownAmount = (el) => {
        let o = 1;
        for (let n = el; n && n.nodeType === 1; n = n.parentElement) {
            const cs = getComputedStyle(n);
            if (cs.display === "none" || cs.visibility === "hidden" || cs.visibility === "collapse") return 0;
            o *= parseFloat(cs.opacity || "1");
            if (o < 0.05) return 0;
        }
        return o;
    };
    // Screen-reader-only text is deliberately squeezed into 1 px; it isn't a visual clash.
    const isScreenReaderOnly = (el) => {
        const r = el.getBoundingClientRect();
        if (r.width <= 2 || r.height <= 2) return true;
        const cs = getComputedStyle(el);
        return cs.clip === "rect(0px, 0px, 0px, 0px)" || cs.clipPath === "inset(50%)";
    };
    // Which floating layer (fixed or sticky) an element belongs to, if any.
    const floatingLayer = (el) => {
        for (let n = el; n && n.nodeType === 1; n = n.parentElement) {
            const p = getComputedStyle(n).position;
            if (p === "fixed" || p === "sticky") return n;
        }
        return null;
    };
    // An ancestor that scrolls or hides overflow sideways (a table in a scroll box, a carousel).
    const clippingAncestor = (el) => {
        for (let n = el.parentElement; n && n !== document.body; n = n.parentElement) {
            const ox = getComputedStyle(n).overflowX;
            if (ox === "auto" || ox === "scroll" || ox === "hidden" || ox === "clip") return n;
        }
        return null;
    };

    // ---- collect every visible line of text, line by line ----
    const pieces = [];
    const placeholders = new Set(); // raw "TODO" notes or [bracket] placeholders a visitor can see
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
        acceptNode: (t) => (t.nodeValue.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT),
    });
    for (let t = walker.nextNode(); t; t = walker.nextNode()) {
        const el = t.parentElement;
        if (!el || el.closest("script,style,noscript,template,title,.hotel-preview")) continue;
        if (shownAmount(el) < 0.05 || isScreenReaderOnly(el)) continue;
        const raw = t.nodeValue.trim();
        if (/\bTODO\b/.test(raw) || /\[[A-Za-z][^\]]{0,40}\]/.test(raw)) placeholders.add(`"${raw.slice(0, 70)}" (${describe(el)})`);
        const range = document.createRange();
        range.selectNodeContents(t);
        const layer = floatingLayer(el);
        for (const r of range.getClientRects()) {
            if (r.width < 2 || r.height < 2) continue;
            pieces.push({ el, layer, text: t.nodeValue.trim().slice(0, 40), x: r.left, y: r.top + scrollY, w: r.width, h: r.height, vy: r.top });
        }
    }

    const found = { overlaps: [], offscreen: [], clipped: [], floatingClash: [], floatingCover: [] };

    if (!fixedOnly) {
        // ---- text on top of text (only text that scrolls with the page; floating layers are checked below) ----
        const flow = pieces.filter((p) => !p.layer).sort((a, b) => a.y - b.y);
        const seen = new Set();
        for (let i = 0; i < flow.length; i++) {
            const a = flow[i];
            for (let j = i + 1; j < flow.length && flow[j].y < a.y + a.h; j++) {
                const b = flow[j];
                if (a.el === b.el || a.el.contains(b.el) || b.el.contains(a.el)) continue;
                const ix = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
                const iy = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
                if (ix < 4 || iy < 4) continue;
                if (ix * iy < 0.25 * Math.min(a.w * a.h, b.w * b.h)) continue;
                const key = describe(a.el) + "|" + describe(b.el);
                if (seen.has(key)) continue;
                seen.add(key);
                found.overlaps.push({ a: `"${a.text}" (${describe(a.el)})`, b: `"${b.text}" (${describe(b.el)})`, at: Math.round(a.y) });
            }
        }
        // ---- text running off the side of the screen, or cut off by its box ----
        const offSeen = new Set();
        for (const p of pieces) {
            if (p.layer) continue;
            if ((p.x + p.w > vw + 1 || p.x < -1) && !clippingAncestor(p.el) && !offSeen.has(p.el)) {
                offSeen.add(p.el);
                found.offscreen.push({ text: `"${p.text}" (${describe(p.el)})`, at: Math.round(p.y) });
            }
        }
        const clipSeen = new Set();
        for (const p of pieces) {
            const el = p.el;
            if (clipSeen.has(el)) continue;
            clipSeen.add(el);
            const cs = getComputedStyle(el);
            const cutSideways = (cs.overflowX === "hidden" || cs.textOverflow === "ellipsis") && el.scrollWidth > el.clientWidth + 2;
            const cutBelow = cs.overflowY === "hidden" && el.scrollHeight > el.clientHeight + 2 && el.clientHeight > 0;
            if (cutSideways || cutBelow) found.clipped.push({ text: `"${p.text}" (${describe(el)})`, at: Math.round(p.y) });
        }
    }

    // ---- floating pieces (fixed): do two of them collide? do they cover page text? ----
    // The header and the full-screen 3D background are meant to sit over or under the page, so they're skipped.
    const floating = [...document.querySelectorAll("body *")].filter((el) => {
        if (getComputedStyle(el).position !== "fixed" || shownAmount(el) < 0.05) return false;
        if (el.closest("header") || el.closest(".hotel-scene") || el.matches(".hotel-tags, .skip-link")) return false;
        for (let n = el.parentElement; n; n = n.parentElement) if (getComputedStyle(n).position === "fixed") return false; // only the outermost floating box
        const r = el.getBoundingClientRect();
        if (r.width < 8 || r.height < 8 || r.bottom < 0 || r.top > vh || r.right < 0 || r.left > vw) return false;
        return r.width * r.height < 0.6 * vw * vh; // a full-screen overlay (an open dialog) isn't a "floating piece"
    });
    for (let i = 0; i < floating.length; i++) {
        for (let j = i + 1; j < floating.length; j++) {
            const a = floating[i], b = floating[j];
            if (a.contains(b) || b.contains(a)) continue;
            const ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
            const ix = Math.min(ra.right, rb.right) - Math.max(ra.left, rb.left);
            const iy = Math.min(ra.bottom, rb.bottom) - Math.max(ra.top, rb.top);
            if (ix > 2 && iy > 2) found.floatingClash.push({ a: describe(a), b: describe(b) });
        }
    }
    const coverSeen = new Set();
    for (const f of floating) {
        // notices that float over the page on purpose until the visitor answers them (cookie, email prompt)
        if (f.matches(".consent, .subscribe-prompt")) continue;
        const r = f.getBoundingClientRect();
        for (const p of pieces) {
            if (p.layer || f.contains(p.el)) continue;
            const ix = Math.min(r.right, p.x + p.w) - Math.max(r.left, p.x);
            const iy = Math.min(r.bottom, p.vy + p.h) - Math.max(r.top, p.vy);
            if (ix > 4 && iy > 4 && !coverSeen.has(f)) {
                coverSeen.add(f);
                found.floatingCover.push({ floating: describe(f), text: `"${p.text}" (${describe(p.el)})` });
            }
        }
    }

    if (fixedOnly) return found;

    // ---- the basics ----
    const visibleH1 = [...document.querySelectorAll("h1")].filter((h) => shownAmount(h) > 0.05);
    const meta = (name) => document.querySelector(`meta[name="${name}"]`)?.getAttribute("content")?.trim() || "";
    const brokenImages = [...document.images]
        .filter((img) => img.complete && img.naturalWidth === 0 && img.currentSrc && shownAmount(img) > 0.05)
        .map((img) => img.currentSrc.replace(location.origin, ""));
    return {
        ...found,
        sidewaysScroll: document.documentElement.scrollWidth - vw,
        h1: visibleH1.map((h) => h.textContent.trim().slice(0, 60)),
        title: document.title,
        description: meta("description"),
        brokenImages,
        placeholders: [...placeholders],
        height: document.documentElement.scrollHeight,
    };
}

/**
 * Checks one page at one size and edition.
 * @param {import("playwright-core").BrowserContext} context  a context from openContext()
 * @param {string} url   the full address to open
 * @param {{ axe?: boolean, screenshot?: string|null, label: string }} options
 * @returns {Promise<{ label: string, url: string, issues: Array<{severity: "error"|"warning", kind: string, detail: string}>, screenshot: string|null, h1: string[] }>}
 */
export async function checkPage(context, url, { axe = false, screenshot = null, label }) {
    const page = await context.newPage();
    const issues = [];
    const add = (severity, kind, detail) => issues.push({ severity, kind, detail });
    // How long each step took, in ms (shown in the report, so slow pages stand out).
    const timings = {};
    let last = Date.now();
    const lap = (name) => {
        timings[name] = Date.now() - last;
        last = Date.now();
    };
    page.on("pageerror", (e) => add("error", "Script error", e.message.split("\n")[0]));
    page.on("console", (m) => {
        if (m.type() === "error" && !isExpectedOfflineNoise(m.text())) add("error", "Console error", m.text().slice(0, 200));
    });
    try {
        const res = await page.goto(url, { waitUntil: "load", timeout: 45000 });
        if (res && res.status() >= 400) add("error", "HTTP status", `${res.status()} for ${url}`);
        lap("load");
        // Wait for the page's own content (not just the loading skeleton).
        await page.waitForFunction(() => document.querySelector("main h1, main [role=heading]") && !document.querySelector('main [aria-busy="true"]'), null, { timeout: 15000 }).catch(() => add("warning", "Slow to settle", "the page's heading didn't appear within 15 s"));
        await wait(400);
        lap("settle");
        // Scroll down like a visitor, so scroll animations and lazy images run. Done inside the page in
        // one go (each round trip to a busy page is slow), jumping instead of the site's smooth scroll.
        await page.evaluate(async () => {
            const step = Math.round(innerHeight * 0.8);
            for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
                window.scrollTo({ top: y, behavior: "instant" });
                await new Promise((r) => setTimeout(r, 90));
            }
        });
        await wait(700);
        lap("scroll");
        // Floating pieces at three scroll positions (middle, bottom, then top), measured in one go.
        await page.addScriptTag({ content: `window.__fcMeasure = ${measurePage.toString()};` });
        const floatingAt = await page.evaluate(async () => {
            const out = {};
            for (const [name, frac] of [["middle", 0.5], ["bottom", 1], ["top", 0]]) {
                window.scrollTo({ top: frac * (document.documentElement.scrollHeight - innerHeight), behavior: "instant" });
                await new Promise((r) => setTimeout(r, 250));
                out[name] = window.__fcMeasure({ fixedOnly: true });
            }
            return out;
        });
        lap("floating");
        const m = await page.evaluate(measurePage, {});
        lap("measure");

        if (m.sidewaysScroll > 1) add("error", "Sideways scroll", `the page is ${m.sidewaysScroll}px wider than the screen`);
        if (m.h1.length !== 1) add("error", "Main heading", m.h1.length ? `${m.h1.length} visible h1 headings: ${m.h1.join(" | ")}` : "no visible h1 heading");
        if (!m.title || /^formcraft$/i.test(m.title.trim())) add("warning", "Page title", `generic or missing title: "${m.title}"`);
        if (!m.description) add("warning", "Description", "no meta description");
        // Visitors must never see raw placeholders (the team sees them via <Todo>; these checks run signed out)
        for (const p of m.placeholders) add("error", "Placeholder visible", p);
        if (/\bTODO\b|\[[A-Za-z][^\]]*\]/.test(m.title + " " + m.description)) add("error", "Placeholder visible", `in the page title or description: "${(m.title + " | " + m.description).slice(0, 120)}"`);
        for (const src of m.brokenImages) add(/^https?:/.test(src) ? "warning" : "error", "Broken image", src);
        for (const o of m.overlaps) add("error", "Text on text", `${o.a} overlaps ${o.b} (${o.at}px from the top)`);
        for (const o of m.offscreen) add("error", "Text off screen", `${o.text} runs past the edge of the screen (${o.at}px from the top)`);
        for (const c of m.clipped) add("warning", "Text cut off", `${c.text} is cut off by its box (${c.at}px from the top)`);
        const clashSeen = new Set(), coverSeen = new Set();
        for (const [where, f] of Object.entries(floatingAt)) {
            for (const c of f.floatingClash) {
                const key = c.a + c.b;
                if (clashSeen.has(key)) continue;
                clashSeen.add(key);
                add("error", "Floating pieces collide", `${c.a} and ${c.b} overlap (scrolled to the ${where})`);
            }
            for (const c of f.floatingCover) {
                const key = c.floating;
                if (coverSeen.has(key)) continue;
                coverSeen.add(key);
                add("warning", "Floating piece covers text", `${c.floating} covers ${c.text} (scrolled to the ${where})`);
            }
        }
        if (axe) {
            await page.addScriptTag({ content: await loadAxe() });
            const results = await page.evaluate(() =>
                window.axe.run(document, { resultTypes: ["violations"], runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] } })
            );
            for (const v of results.violations) {
                const severity = v.impact === "critical" || v.impact === "serious" ? "error" : "warning";
                const where = v.nodes.slice(0, 3).map((n) => n.target.join(" ")).join(" · ");
                add(severity, `Accessibility: ${v.id}`, `${v.help} — ${v.nodes.length} place(s): ${where}`);
            }
        }
        lap("axe");
        if (screenshot) await page.screenshot({ path: screenshot, fullPage: true });
        lap("screenshot");
        return { label, url, issues, screenshot, h1: m.h1, timings };
    } catch (e) {
        add("error", "Check failed", e.message.split("\n")[0]);
        return { label, url, issues, screenshot: null, h1: [], timings };
    } finally {
        await page.close();
    }
}
