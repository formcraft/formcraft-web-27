// Contrast of a see-through ink on several papers, for choosing token values (WCAG formula).
// Usage: node scripts/check/contrast-math.mjs "28,37,45" ".62,.64,.66,.68" "#f8f8f5,#f1f1f1"
const [ink, alphas, bgs] = process.argv.slice(2);
const rgb = (h) => (h.includes(",") ? h.split(",").map(Number) : [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)));
const lum = ([r, g, b]) => { const f = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
const fg = rgb(ink);
for (const a of alphas.split(",").map(Number)) {
    const row = bgs.split(",").map((bg) => { const b = rgb(bg); const mix = b.map((c, i) => c + (fg[i] - c) * a); return `${bg} ${ratio(mix, b).toFixed(2)}`; });
    console.log(`alpha ${a}: ${row.join(" | ")}`);
}
