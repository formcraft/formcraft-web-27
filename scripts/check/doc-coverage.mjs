// Documentation coverage: which source files have a plain-English header comment at the top,
// and which exported functions/components have a comment right above them.
// Usage: node scripts/check/doc-coverage.mjs [--list]
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { ROOT } from "./lib.mjs";

const walk = (d) => readdirSync(d).flatMap((n) => { const p = join(d, n); return statSync(p).isDirectory() ? walk(p) : [p]; });
const files = ["src", "functions", "scripts"].flatMap((d) => walk(join(ROOT, d)))
    .filter((p) => /\.(jsx?|mjs|cjs|css)$/.test(p) && !p.includes("node_modules"))
    .map((p) => relative(ROOT, p).split("\\").join("/"));

let withHeader = 0, exportsTotal = 0, exportsDocumented = 0;
const missing = [];
for (const f of files) {
    const text = readFileSync(join(ROOT, f), "utf8");
    // A header: a comment among the first lines, before or right after the imports.
    const lines = text.split("\n");
    const firstCode = lines.findIndex((l) => l.trim() && !/^\s*(import\b|\/\/|\/\*|\*|#!|["']use)/.test(l));
    const head = lines.slice(0, firstCode < 0 ? 30 : firstCode + 1).join("\n");
    const hasHeader = /^\s*(\/\/|\/\*)/m.test(head) && (head.match(/^\s*(\/\/|\*|\/\*)/gm) || []).length >= 2;
    if (hasHeader) withHeader++; else missing.push(f);
    if (/\.css$/.test(f)) continue;
    for (const m of text.matchAll(/^export (?:const|function|async function|class|default function) ?([A-Za-z0-9_]*)/gm)) {
        exportsTotal++;
        const before = text.slice(0, m.index).trimEnd().split("\n").pop() || "";
        if (/^\s*(\/\/|\*\/|\*)/.test(before)) exportsDocumented++;
    }
}
console.log(`${files.length} files: ${withHeader} with a header comment, ${missing.length} without`);
console.log(`${exportsTotal} exports: ${exportsDocumented} with a comment right above, ${exportsTotal - exportsDocumented} without`);
if (process.argv.includes("--list")) console.log("\nNo header:\n" + missing.join("\n"));
