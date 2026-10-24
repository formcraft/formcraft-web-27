// Writes the check results as one HTML page (check-report/index.html) that opens in any browser.
//
// The page has: a summary at the top (how many errors and warnings, and of which kind), the click
// checks, the link check, then one section per page of the site with its findings and screenshots.
// Errors are listed first; everything is plain HTML, so it also works without internet.

import { writeFile } from "node:fs/promises";
import { relative } from "node:path";

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

/**
 * @param {string} file  where to write the HTML
 * @param {{ startedAt: Date, browser: string, steps: Array<{name: string, ok: boolean, detail: string}>,
 *           pages: Array<{ path: string, results: Array<{label: string, issues: Array<{severity: string, kind: string, detail: string}>, screenshot: string|null}> }>,
 *           clicks: Array<{name: string, ok: boolean, detail: string}>, links: {checked: number, broken: Array<{link: string, from: string}>} }} data
 */
export async function writeReport(file, data) {
    const dir = file.replace(/[\\/][^\\/]+$/, "");
    const all = data.pages.flatMap((p) => p.results.flatMap((r) => r.issues.map((i) => ({ ...i, path: p.path, label: r.label }))));
    const errors = all.filter((i) => i.severity === "error").length + data.steps.filter((s) => !s.ok).length + data.clicks.filter((c) => !c.ok).length + data.links.broken.length;
    const warnings = all.filter((i) => i.severity === "warning").length;
    const byKind = {};
    for (const i of all) {
        const key = `${i.severity}|${i.kind}`;
        byKind[key] = (byKind[key] || 0) + 1;
    }

    const row = (ok, name, detail) => `<tr class="${ok ? "ok" : "bad"}"><td>${ok ? "✓" : "✗"}</td><td>${esc(name)}</td><td>${esc(detail || "")}</td></tr>`;
    const pageSection = (p) => {
        const issues = p.results.flatMap((r) => r.issues.map((i) => ({ ...i, label: r.label })));
        const errs = issues.filter((i) => i.severity === "error").length;
        const shots = p.results.filter((r) => r.screenshot).map((r) => {
            const src = relative(dir, r.screenshot).replace(/\\/g, "/");
            return `<a href="${esc(src)}" target="_blank"><img loading="lazy" src="${esc(src)}" alt="${esc(p.path)} at ${esc(r.label)}"><span>${esc(r.label)}</span></a>`;
        }).join("");
        const list = issues
            .sort((a, b) => (a.severity === b.severity ? 0 : a.severity === "error" ? -1 : 1))
            .map((i) => `<li class="${i.severity}"><b>${esc(i.kind)}</b> <small>${esc(i.label)}</small><br>${esc(i.detail)}</li>`)
            .join("");
        return `<details ${errs ? "open" : ""}><summary><code>${esc(p.path)}</code> — ${errs} error(s), ${issues.length - errs} warning(s)</summary>
            ${list ? `<ul>${list}</ul>` : "<p class='clean'>No findings.</p>"}<div class="shots">${shots}</div></details>`;
    };

    const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Formcraft site check</title>
<style>
:root { --navy:#1C252D; --orange:#FFAE61; --rust:#D15334; --white:#F1F1F1; --green:#3f6b35; }
body { margin:0; font:15px/1.5 system-ui,sans-serif; background:var(--white); color:var(--navy); }
main { max-width:1200px; margin:0 auto; padding:24px 16px 80px; }
h1 { margin:0 0 4px; } .meta { opacity:.7; margin:0 0 20px; }
.total { display:flex; gap:12px; flex-wrap:wrap; margin:0 0 24px; }
.total div { padding:12px 16px; border-radius:6px; background:#fff; border:1px solid #ddd; }
.total .bad { border-color:var(--rust); } .total b { font-size:24px; display:block; }
table { border-collapse:collapse; width:100%; background:#fff; margin:0 0 24px; } td { border-top:1px solid #e3e3e3; padding:6px 8px; vertical-align:top; }
tr.bad td:first-child { color:var(--rust); font-weight:700; } tr.ok td:first-child { color:var(--green); font-weight:700; }
details { background:#fff; border:1px solid #ddd; border-radius:6px; margin:0 0 10px; padding:8px 12px; }
summary { cursor:pointer; font-weight:600; } ul { padding-left:18px; } li { margin:6px 0; } li.error b { color:var(--rust); } li.warning b { color:#9a6a1a; }
.clean { color:var(--green); } small { opacity:.7; }
.shots { display:flex; gap:10px; overflow-x:auto; padding:8px 0; } .shots a { flex:0 0 auto; text-decoration:none; color:inherit; font-size:12px; }
.shots img { display:block; width:180px; height:260px; object-fit:cover; object-position:top; border:1px solid #ccc; border-radius:4px; }
</style></head><body><main>
<h1>Formcraft site check</h1>
<p class="meta">${esc(data.startedAt.toLocaleString())} · ${esc(data.browser)} · offline (internet blocked) · production build</p>
<div class="total"><div class="${errors ? "bad" : ""}"><b>${errors}</b>errors</div><div><b>${warnings}</b>warnings</div><div><b>${data.pages.length}</b>pages</div><div><b>${data.links.checked}</b>links followed</div></div>
<h2>Steps</h2><table>${data.steps.map((s) => row(s.ok, s.name, s.detail)).join("")}</table>
<h2>Click checks</h2><table>${data.clicks.map((c) => row(c.ok, c.name, c.detail)).join("")}</table>
<h2>Links</h2><table>${data.links.broken.length ? data.links.broken.map((b) => row(false, b.link, `found on ${b.from}`)).join("") : row(true, `${data.links.checked} links`, "none lead to the 404 page")}</table>
<h2>Findings by kind</h2><table>${Object.entries(byKind).sort((a, b) => b[1] - a[1]).map(([k, n]) => { const [sev, kind] = k.split("|"); return row(sev !== "error", kind, `${n} × ${sev}`); }).join("") || row(true, "No findings", "")}</table>
<h2>Pages</h2>${data.pages.map(pageSection).join("")}
</main></body></html>`;
    await writeFile(file, html);
    return { errors, warnings };
}
