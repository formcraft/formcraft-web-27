// Template home designs until the team adds real ones in Admin (Firestore `templates`).
// These are SAMPLE listings from the owner's design: the bedroom/floor mixes show how the library
// will be organised. Names, floor areas, architects, prices and images are not known yet, so they
// stay as placeholders (null shows as "Price on request", or the line is left out). Never replace them with made-up values.
// Fields match CONTENT.templates in src/data/content.js. The "sample" tag marks these listings.
const sample = (slug, { bedrooms, bathrooms, floors, tags, summary }) => ({
    id: slug,
    slug,
    title: "[Design name]",
    summary,
    plot: "50 × 100 ft",
    bedrooms,
    bathrooms,
    floors,
    areaM2: null,
    plansPriceUGX: null,
    buildFromUGX: null,
    architect: null,
    release: "2026.1",
    images: [],
    tags: ["sample", ...tags],
    featured: false,
    active: true,
});

// Display helpers shared by the Templates and TemplateDesign pages (work for admin-added items too)
export const TEMPLATE_KINDS = [
    { id: "all", label: "All designs" },
    { id: "bungalow", label: "Bungalows", name: "Bungalow" },
    { id: "two-storey", label: "Two-storey", name: "Two-storey" },
    { id: "rental", label: "Rentals", name: "Rental units" },
];

export const templateKind = (t) => {
    const tags = (t?.tags ?? []).map((x) => String(x).toLowerCase());
    if (tags.includes("rental")) return "rental";
    if (tags.includes("two-storey") || (t?.floors ?? 1) >= 2) return "two-storey";
    return "bungalow";
};

export const templateKindName = (t) => TEMPLATE_KINDS.find((k) => k.id === templateKind(t))?.name ?? "Home";

export const isSample = (t) => (t?.tags ?? []).includes("sample");

/** "3 bed · 2 bath", built only from the numbers that are set ("" when none are). */
export const templateSpec = (t) =>
    [Number.isInteger(t.bedrooms) && `${t.bedrooms} bed`, Number.isInteger(t.bathrooms) && `${t.bathrooms} bath`].filter(Boolean).join(" · ");
/** "120 m²", or null while the floor area isn't set. */
export const templateArea = (t) => (Number.isFinite(t.areaM2) ? `${t.areaM2} m²` : null);

export const templates = [
    sample("sample-bungalow-2-bed", {
        bedrooms: 2, bathrooms: 1, floors: 1, tags: ["bungalow"],
        summary: "A 2-bedroom bungalow for a 50 × 100 ft plot. TODO: two lines on what makes this design good to live in.",
    }),
    sample("sample-bungalow-3-bed", {
        bedrooms: 3, bathrooms: 2, floors: 1, tags: ["bungalow"],
        summary: "A 3-bedroom bungalow for a 50 × 100 ft plot. TODO: two lines on what makes this design good to live in.",
    }),
    sample("sample-two-storey-4-bed", {
        bedrooms: 4, bathrooms: 3, floors: 2, tags: ["two-storey"],
        summary: "A 4-bedroom two-storey home for a 50 × 100 ft plot. TODO: two lines on what makes this design good to live in.",
    }),
    sample("sample-rental-units", {
        bedrooms: 1, bathrooms: 1, floors: null, tags: ["rental"],
        summary: "[n] rental units, 1 bedroom each, on a 50 × 100 ft plot. TODO: two lines on who the units are for.",
    }),
];
