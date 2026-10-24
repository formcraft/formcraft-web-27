// Real-estate developments until the team adds real ones in Admin (Firestore `developments`).
// SAMPLE listings from the owner's design: the development types show how the page will look.
// Names, locations, unit counts, prices, tickets, returns and dates are not known yet, so they stay
// null / "[placeholder]". Figures appear only when each development's plans, costs and terms are approved.
// Fields match CONTENT.developments in src/data/content.js; `kind` is a display label for these samples.
const sample = (slug, { kind, status, summary }) => ({
    id: slug,
    slug,
    title: "[Development name]",
    kind,
    location: null,
    status,
    summary,
    units: null,
    unitFromUGX: null,
    minInvestUGX: null,
    completion: null,
    images: [],
    featured: false,
    active: true,
});

// Status values from CONTENT.developments, with the words visitors see
export const DEV_STATUSES = [
    { id: "all", label: "All" },
    { id: "selling", label: "Funding open" },
    { id: "planning", label: "In planning" },
    { id: "building", label: "Under construction" },
    { id: "complete", label: "Completed" },
];
/** A development's stage as words ("Funding", "Under construction"…). */
export const devStatusLabel = (status) => DEV_STATUSES.find((s) => s.id === status && s.id !== "all")?.label ?? (status || "");
/** True for the sample developments (shown to the team only until real ones are added). */
export const isSampleDev = (d) => String(d?.slug ?? "").startsWith("sample-");

/** Starter list of developments (all samples for now). Admin → Content replaces it once real ones are added. */
export const developments = [
    sample("sample-rental-apartments", {
        kind: "Rental apartments",
        status: "selling",
        summary: "[n] rental apartments in [location]. Designed by Formcraft Studio, built by Formcraft Construction with Formcraft Concrete and joinery.",
    }),
    sample("sample-student-hostel", {
        kind: "Student hostel",
        status: "selling",
        summary: "A student hostel in [location]. TODO: who the rooms are for and why the location works.",
    }),
    sample("sample-estate-homes", {
        kind: "Estate homes",
        status: "planning",
        summary: "Estate homes in [location]. TODO: plot count, home types and the buyers they're for.",
    }),
    sample("sample-mixed-use", {
        kind: "Mixed use",
        status: "building",
        summary: "A mixed-use building in [location]. TODO: what's in it and who it serves.",
    }),
];
