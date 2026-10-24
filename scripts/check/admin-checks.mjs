// The admin pass of the offline checks (`npm run check:admin`): signs in as a test team member against the
// Firebase emulators, opens every screen in Admin and checks it, at desktop width and at 360 px.
//
// What it checks on each screen:
// - the menu label and the panel heading say the same thing (owner, 2026-10-24: "text mismatches");
// - nothing runs off the side of the screen;
// - no script errors;
// - accessibility (axe, the same rules as the public pages);
// - in Leads, every status menu offers only the one status list (src/data/leads.js), plus an old value
//   on a lead that still has one.
// Screenshots go to check-report/admin/. Errors make the command fail.
//
// Needs the emulators running (`firebase emulators:start`, auth 9099, Firestore 8081). It creates its own
// test account (check-admin@formcraft.test, owner + team) in the auth emulator and starts its own dev
// server on port 4179, so nothing else has to be open. It never touches the real Firebase project.

import { spawn } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { createRequire } from "node:module";
import { ROOT, launchBrowser, wait } from "./lib.mjs";
import { LEAD_STATUSES } from "../../src/data/leads.js";

const require = createRequire(import.meta.url);
const PORT = 4179;
const BASE = `http://localhost:${PORT}`;
const AUTH = "http://localhost:9099";
const EMAIL = "check-admin@formcraft.test";
const OUT = join(ROOT, "check-report", "admin");

const projectId = async () => {
    try {
        const env = await readFile(join(ROOT, ".env.local"), "utf8");
        return /^\s*VITE_FIREBASE_PROJECT_ID\s*=\s*(\S+)/m.exec(env)?.[1] ?? "formcraft2027";
    } catch {
        return "formcraft2027";
    }
};

const up = async (url) => {
    try {
        await fetch(url, { signal: AbortSignal.timeout(2000) });
        return true;
    } catch {
        return false;
    }
};

// A Google account in the auth emulator, with the owner and team claims
const makeTestOwner = async (project) => {
    const res = await fetch(`${AUTH}/identitytoolkit.googleapis.com/v1/accounts:signInWithIdp?key=emulator`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            requestUri: "http://localhost",
            postBody: `id_token=${encodeURIComponent(JSON.stringify({ sub: "check-admin", email: EMAIL, email_verified: true, name: "Check Admin" }))}&providerId=google.com`,
            returnSecureToken: true,
        }),
    });
    const { localId } = await res.json();
    if (!localId) throw new Error("Couldn't create the test account in the auth emulator.");
    await fetch(`${AUTH}/identitytoolkit.googleapis.com/v1/projects/${project}/accounts:update`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer owner" },
        body: JSON.stringify({ localId, customAttributes: JSON.stringify({ admin: true, role: "team", owner: true }) }),
    });
};

const startDev = async () => {
    const vite = join(ROOT, "node_modules", "vite", "bin", "vite.js");
    const child = spawn(process.execPath, [vite, "--port", String(PORT), "--strictPort"], { cwd: ROOT, stdio: "ignore", env: { ...process.env, VITE_USE_EMULATORS: "true" } });
    for (let i = 0; i < 60; i++) {
        if (await up(BASE)) return child;
        await wait(500);
    }
    child.kill();
    throw new Error(`The dev server didn't start on port ${PORT}.`);
};

// Runs in the page: the open panel's heading, sideways overflow, and the Leads status menus
const measure = () => {
    const main = document.querySelector(".admin-main");
    const heading = main?.querySelector("h3")?.textContent.trim() ?? "";
    const overflow = document.documentElement.scrollWidth - window.innerWidth;
    const statusMenus = [...document.querySelectorAll('.admin-main select[id^="ls-"]')].map((s) => ({ value: s.value, options: [...s.options].map((o) => o.value) }));
    return { heading, overflow, statusMenus };
};

const main = async () => {
    if (!(await up(AUTH)) || !(await up("http://localhost:8081"))) {
        console.error("The Firebase emulators aren't running. Start them with: firebase emulators:start --import=emulator-data");
        process.exit(1);
    }
    const project = await projectId();
    await makeTestOwner(project);
    await mkdir(OUT, { recursive: true });
    const dev = await startDev();
    const { browser, name } = await launchBrowser();
    const issues = [];
    const add = (severity, where, text) => issues.push({ severity, where, text });
    try {
        const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
        await context.addInitScript(() => {
            try {
                sessionStorage.setItem("fc-intro", "1");
                localStorage.setItem("fc-consent", JSON.stringify({ analytics: false, at: "check" }));
            } catch {
                // storage blocked: fine
            }
        });
        const page = await context.newPage();
        page.on("pageerror", (e) => add("error", page.url(), `Script error: ${e.message}`));
        await page.goto(`${BASE}/sign-in`, { waitUntil: "load" });
        await page.locator("main h1").first().waitFor();
        const [popup] = await Promise.all([context.waitForEvent("page"), page.getByRole("button", { name: /google/i }).first().click()]);
        await popup.waitForLoadState("load");
        await popup.getByText(EMAIL, { exact: true }).first().click();
        await page.waitForFunction(() => !location.pathname.startsWith("/sign-in") || document.querySelector("[data-signed-in]"), null, { timeout: 8000 }).catch(() => {});
        await wait(1500);
        await page.goto(`${BASE}/admin`, { waitUntil: "load" });
        await page.locator(".admin-nav-btn").first().waitFor({ timeout: 15000 });
        const labels = (await page.locator(".admin-nav-btn").allTextContents()).map((t) => t.trim());
        const axeSource = await readFile(require.resolve("axe-core/axe.min.js"), "utf8");

        for (const [width, height] of [[1440, 900], [360, 780]]) {
            await page.setViewportSize({ width, height });
            for (const label of labels) {
                const where = `${label} @ ${width}px`;
                // the side menu on wide screens; the grouped "Admin section" menu on phones
                const navButton = page.locator(".admin-nav-btn", { hasText: label }).first();
                if (await navButton.isVisible()) await navButton.click();
                else await page.selectOption("#admin-section", { label });
                // panels load their data live; wait for the heading
                await page.locator(".admin-main h3").first().waitFor({ timeout: 10000 }).catch(() => {});
                await wait(700);
                const m = await page.evaluate(measure);
                if (m.heading !== label) add("error", where, `Menu says “${label}”, the panel heading says “${m.heading || "(none)"}”.`);
                if (m.overflow > 1) add("error", where, `The screen scrolls sideways by ${m.overflow}px.`);
                for (const s of m.statusMenus) {
                    const extra = s.options.filter((o) => !LEAD_STATUSES.includes(o) && o !== s.value);
                    if (extra.length) add("error", where, `A status menu offers values outside the one list: ${extra.join(", ")}.`);
                }
                if (width === 1440) {
                    await page.addScriptTag({ content: axeSource });
                    const results = await page.evaluate(() =>
                        window.axe.run(document.querySelector(".admin-main"), { resultTypes: ["violations"], runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] } })
                    );
                    for (const v of results.violations) {
                        const sev = v.impact === "critical" || v.impact === "serious" ? "error" : "warning";
                        add(sev, where, `Accessibility: ${v.id}: ${v.help} (${v.nodes.length} place(s): ${v.nodes.slice(0, 2).map((n) => n.target.join(" ")).join(" · ")})`);
                    }
                }
                const file = `${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${width}.png`;
                await page.screenshot({ path: join(OUT, file), fullPage: false });
            }
        }
        const errors = issues.filter((i) => i.severity === "error");
        await writeFile(join(OUT, "results.json"), JSON.stringify({ browser: name, at: new Date().toISOString(), screens: labels, issues }, null, 1));
        console.log(`Admin pass (${name}): ${labels.length} screens × 2 widths`);
        for (const i of issues) console.log(`${i.severity === "error" ? "✗" : "!"} ${i.where}: ${i.text}`);
        console.log(errors.length ? `\n✗ ${errors.length} error(s), ${issues.length - errors.length} warning(s)` : `\n✓ 0 errors, ${issues.length} warning(s). Screenshots: check-report/admin/`);
        process.exitCode = errors.length ? 1 : 0;
    } finally {
        await browser.close();
        dev.kill();
    }
};

main().catch((e) => {
    console.error(e.message);
    process.exit(1);
});
