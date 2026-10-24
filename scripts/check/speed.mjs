#!/usr/bin/env node
// `npm run check:speed`: Google Lighthouse speed and quality scores, run locally for free.
//
// It serves the built site (run `npm run build` first), then runs Lighthouse in the Chrome on this
// computer for a few key pages, as a mid-range phone on a slowed-down mobile connection (Lighthouse's
// standard mobile test). Each page gets an HTML report in check-report/speed/. The aim from the
// build plan is 90+ for Performance on mobile.
//
// Options: --only /path (repeat for more pages). Lighthouse is fetched by npx the first time (needs
// internet once); after that it runs from the npx cache.

import { spawn } from "node:child_process";
import { mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { BASE, ROOT, startPreview } from "./lib.mjs";

const argv = process.argv.slice(2);
const only = argv.flatMap((a, i) => (a === "--only" && argv[i + 1] ? [argv[i + 1]] : []));
const PAGES = only.length ? only : ["/", "/stores", "/studio", "/contact"];
const OUT = join(ROOT, "check-report", "speed");
mkdirSync(OUT, { recursive: true });

const run = (args) =>
    new Promise((done) => {
        const child = spawn(process.platform === "win32" ? "npx.cmd" : "npx", args, { cwd: ROOT, shell: process.platform === "win32", stdio: ["ignore", "pipe", "pipe"] });
        child.on("close", (code) => done(code));
    });

const stop = await startPreview();
const rows = [];
for (const path of PAGES) {
    const slug = path === "/" ? "home" : path.slice(1).replace(/[^a-z0-9]+/gi, "-");
    const file = join(OUT, slug);
    process.stdout.write(`Lighthouse ${path}… `);
    const code = await run(["--yes", "lighthouse@12", BASE + path, "--quiet", "--chrome-flags=--headless=new", "--output=html", "--output=json", `--output-path=${file}`]);
    if (code !== 0) {
        rows.push(`${path}: Lighthouse failed (exit ${code})`);
        process.stdout.write("failed\n");
        continue;
    }
    const report = JSON.parse(readFileSync(`${file}.report.json`, "utf8"));
    const score = (k) => Math.round((report.categories[k]?.score ?? 0) * 100);
    const line = `${path}: Performance ${score("performance")} · Accessibility ${score("accessibility")} · Best practices ${score("best-practices")} · SEO ${score("seo")}`;
    rows.push(line);
    process.stdout.write(`${line.split(": ")[1]}\n`);
}
stop();
process.stdout.write(`\nReports: ${OUT}\n`);
