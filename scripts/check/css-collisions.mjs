// CSS collision check: finds class names that two stylesheets both style "on their own".
//
// Why: every stylesheet in this site is loaded into the same page, so if two files both say
// ".h2 { … }", the second one changes the first one's elements too. That's exactly what happened when
// the 2D hotel drawing named its box ".h2": every section heading on the site collapsed and ran over
// the text below it. The project's rule is that component classes start with the component's name
// (".header-…", ".cart-…"), and only src/styles/ defines shared classes like ".h2", ".stack", ".wrap".
//
// How it decides: for each rule, it looks at the class the rule is really about (the last part of the
// selector). A rule like ".hotel2d .w" is "scoped" (it only reaches .w inside .hotel2d) and is safe.
// A rule like ".w { … }" in a component file is "unscoped". It's a collision when a component file
// styles a class unscoped and another file styles the same class too.
//
// Run on its own: node scripts/check/css-collisions.mjs   (also part of `npm run check`)

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { pathToFileURL } from "node:url";
import { ROOT } from "./lib.mjs";

/** All .css files under a folder, as paths relative to the project root with forward slashes. */
function cssFiles(dir) {
    const out = [];
    for (const name of readdirSync(dir)) {
        const p = join(dir, name);
        if (statSync(p).isDirectory()) out.push(...cssFiles(p));
        else if (name.endsWith(".css")) out.push(relative(ROOT, p).split("\\").join("/"));
    }
    return out;
}

// A selector list split at its own commas only, not those inside :is(), :not() or [attr="a,b"]
const topLevel = (list) => {
    const out = [];
    let depth = 0, from = 0;
    for (let i = 0; i < list.length; i++) {
        const c = list[i];
        if (c === "(" || c === "[") depth++;
        else if (c === ")" || c === "]") depth--;
        else if (c === "," && depth === 0) {
            out.push(list.slice(from, i));
            from = i + 1;
        }
    }
    return [...out, list.slice(from)];
};

/**
 * @returns {Array<{ className: string, files: string[] }>} one entry per risky class name
 */
export function findCssCollisions() {
    const files = cssFiles(join(ROOT, "src"));
    const owners = new Map(); // class name → Map(file → "u" unscoped / "s" scoped, combined)
    for (const file of files) {
        const css = readFileSync(join(ROOT, file), "utf8")
            .replace(/\/\*[\s\S]*?\*\//g, "") // comments
            .replace(/@keyframes[^{]+\{(?:[^{}]*\{[^}]*\})*[^}]*\}/g, ""); // animation steps aren't selectors
        for (const match of css.matchAll(/([^{}]+)\{/g)) {
            for (const raw of topLevel(match[1])) {
                const selector = raw.trim();
                if (!selector || selector.startsWith("@")) continue;
                const parts = selector.split(/\s+|>|\+|~/).filter(Boolean);
                const subject = parts.at(-1) ?? "";
                const className = subject.match(/\.([a-zA-Z][\w-]*)/)?.[1];
                if (!className) continue;
                const kind = parts.length > 1 ? "s" : "u";
                if (!owners.has(className)) owners.set(className, new Map());
                const byFile = owners.get(className);
                byFile.set(file, (byFile.get(file) ?? "") + kind);
            }
        }
    }
    const shared = (f) => f.startsWith("src/styles/");
    const risky = [];
    for (const [className, byFile] of owners) {
        const fileList = [...byFile.keys()];
        if (fileList.length < 2) continue;
        const unscopedInComponents = fileList.filter((f) => !shared(f) && byFile.get(f).includes("u"));
        if (!unscopedInComponents.length) continue;
        if (fileList.some(shared) || unscopedInComponents.length > 1) risky.push({ className, files: fileList.map((f) => f + (byFile.get(f).includes("u") ? "" : " (scoped)")) });
    }
    return risky.sort((a, b) => a.className.localeCompare(b.className));
}

// Run directly: print the list.
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
    const risky = findCssCollisions();
    for (const r of risky) console.log(`.${r.className}: ${r.files.join(", ")}`);
    console.log(`\n${risky.length} class name(s) styled unscoped in a component file and also elsewhere`);
}
