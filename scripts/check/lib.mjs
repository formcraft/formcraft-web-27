// Shared helpers for the offline checks (`npm run check`).
//
// What this file does, in plain words:
// - finds the project folder and the Chrome (or Edge) already installed on this computer;
// - starts and stops a small local web server that serves the built site (`dist/`);
// - opens browser "contexts" (think: a fresh private window) set up the way the checks need them:
//   a given screen size, day or night edition, no internet, no service worker;
// - decides which browser console messages are real problems and which are just the site
//   noticing it's offline (those are expected here, because the checks block the internet on purpose);
// - runs a list of jobs a few at a time, so the checks finish faster.
//
// Nothing here is shipped to visitors. It only runs on a developer's computer.

import { spawn } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";

/** The project's root folder (the one with package.json). */
export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");

/** The port the local preview server listens on during the checks. */
export const PORT = Number(process.env.CHECK_PORT || 4178);

/** The address the checks open in the browser, e.g. http://localhost:4178 */
export const BASE = `http://localhost:${PORT}`;

/**
 * Starts `vite preview` (it serves the built `dist/` folder) and waits until it answers.
 * @returns {Promise<() => void>} a function that stops the server again.
 */
export async function startPreview() {
    const child = spawn(process.platform === "win32" ? "npx.cmd" : "npx", ["vite", "preview", "--port", String(PORT), "--strictPort"], {
        cwd: ROOT,
        stdio: "ignore",
        shell: process.platform === "win32",
    });
    // Ask the server for the home page every 250 ms, for up to 30 s, until it answers.
    for (let i = 0; i < 120; i++) {
        try {
            const res = await fetch(BASE + "/");
            if (res.ok) return () => killTree(child);
        } catch {
            // not up yet
        }
        await new Promise((r) => setTimeout(r, 250));
    }
    killTree(child);
    throw new Error(`The preview server didn't start on ${BASE}. Is port ${PORT} free? (set CHECK_PORT to use another)`);
}

/** Stops a child process and everything it started (on Windows `npx` starts a second process). */
function killTree(child) {
    if (!child.pid) return;
    if (process.platform === "win32") spawn("taskkill", ["/pid", String(child.pid), "/T", "/F"], { stdio: "ignore" });
    else child.kill("SIGTERM");
}

/**
 * Opens the browser installed on this computer: Chrome first (what the owner uses), then Edge.
 * Uses the strong graphics card when there is one, so the 3D scene is tested as it really looks.
 * @param {{ headless?: boolean }} [options]
 */
export async function launchBrowser({ headless = true } = {}) {
    const args = ["--force_high_performance_gpu"];
    for (const channel of ["chrome", "msedge"]) {
        try {
            const browser = await chromium.launch({ channel, headless, args });
            return { browser, name: channel === "chrome" ? "Chrome" : "Edge" };
        } catch {
            // try the next one
        }
    }
    throw new Error("Neither Chrome nor Edge could be started. Install Google Chrome to run the checks.");
}

/**
 * Opens a fresh "private window" set up for a check.
 * - The internet is blocked: only requests to the local server go through, so results never depend on
 *   Firebase, Google or the network. The site falls back to its built-in data, as it does offline.
 * - Service workers are blocked, so every page load is fresh.
 * - The edition (day/night) is chosen through the same saved setting the header switch uses.
 * - The opening animation is skipped (it also skips itself for automated browsers).
 * @param {import("playwright-core").Browser} browser
 * @param {{ width: number, height?: number, theme?: "day"|"night", touch?: boolean }} view
 */
export async function openContext(browser, { width, height = 900, theme = "day", touch = width < 768 }) {
    const context = await browser.newContext({
        viewport: { width, height },
        hasTouch: touch,
        serviceWorkers: "block",
        reducedMotion: "no-preference",
    });
    await context.route(/^(?!http:\/\/localhost:\d+\/)/, (route) => route.abort("blockedbyclient"));
    await context.addInitScript((edition) => {
        try {
            localStorage.setItem("fc-theme", edition);
            sessionStorage.setItem("fc-intro", "1");
        } catch {
            // storage blocked: the site still works, just with its defaults
        }
    }, theme);
    return context;
}

/**
 * True for console messages that are expected in these offline checks and aren't bugs:
 * blocked requests to the internet, and Firebase saying it can't reach its servers.
 * @param {string} text
 */
export function isExpectedOfflineNoise(text) {
    return /ERR_BLOCKED_BY_CLIENT|ERR_INTERNET_DISCONNECTED|ERR_FAILED|blockedbyclient|Could not reach Cloud Firestore|Firestore .*offline|Failed to fetch|googleapis|firebase|net::ERR_NAME_NOT_RESOLVED|status of 404/i.test(text);
}

/**
 * Runs `jobs` (functions returning promises) with at most `limit` running at the same time.
 * @template T
 * @param {Array<() => Promise<T>>} jobs
 * @param {number} limit
 * @returns {Promise<T[]>} the results, in the same order as the jobs
 */
export async function runPool(jobs, limit) {
    const results = new Array(jobs.length);
    let next = 0;
    const worker = async () => {
        while (next < jobs.length) {
            const i = next++;
            results[i] = await jobs[i]();
        }
    };
    await Promise.all(Array.from({ length: Math.min(limit, jobs.length) }, worker));
    return results;
}

/** Waits `ms` milliseconds. */
export const wait = (ms) => new Promise((r) => setTimeout(r, ms));
