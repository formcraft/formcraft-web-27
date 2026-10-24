// Everything the admin page can add to the site. Each collection lists:
// - `local`: the starter data in src/data/ that public pages show until the team adds items in admin
//   (and whenever Firestore can't be reached). Once a collection has any document in Firestore, the
//   Firestore list replaces the local list for that collection.
// - `fields`: the admin form. Types: text, textarea, ugx (whole UGX integer, null = "not set"),
//   number, select, tags (comma-separated list), images (uploads to Storage public/content/…),
//   bool, date, file (one PDF or image uploaded to Storage public/content/…; stores its URL).
// Money fields here are display prices only; checkout reads prices again on the server (Phase 3).
const CATEGORY = ["furniture", "joinery", "goods", "merch", "plans"];
const DIVISIONS = ["studio", "construction", "concrete", "stores"];

const base = [
    { name: "title", label: "Title", type: "text", required: true },
    { name: "slug", label: "Web address (slug)", type: "text", help: "Lower-case words joined by dashes. Left empty, it's made from the title." },
];
const tail = [
    { name: "featured", label: "Featured", type: "bool" },
    { name: "active", label: "Show on the site", type: "bool", default: true },
];

/**
 * Every kind of content the admin can edit (products, templates, projects, developments, posts, courses,
 * events, downloads): its label, its fields for the admin form, and where its starter data comes from.
 */
export const CONTENT = {
    products: {
        label: "Shop products",
        page: "stores",
        local: () => import("./products.js").then((m) => m.products),
        fields: [
            ...base,
            { name: "category", label: "Category", type: "select", options: CATEGORY },
            { name: "priceUGX", label: "Price (UGX)", type: "ugx", help: "Leave empty until the price is agreed. Checkout reads prices on the server." },
            { name: "description", label: "Description", type: "textarea" },
            { name: "images", label: "Photos", type: "images" },
            { name: "imageAlt", label: "Photo description (for screen readers)", type: "text" },
            { name: "colors", label: "Colours", type: "tags" },
            { name: "sizes", label: "Sizes", type: "tags" },
            { name: "maker", label: "Maker", type: "text" },
            { name: "leadTime", label: "Lead time", type: "text" },
            { name: "stock", label: "Stock", type: "number" },
            { name: "isDigital", label: "Digital download", type: "bool" },
            ...tail,
        ],
    },
    templates: {
        label: "Template home designs",
        page: "templates",
        local: () => import("./templates.js").then((m) => m.templates),
        fields: [
            ...base,
            { name: "summary", label: "Short description", type: "textarea" },
            { name: "plot", label: "Plot size", type: "text", default: "50 × 100 ft" },
            { name: "bedrooms", label: "Bedrooms", type: "number" },
            { name: "bathrooms", label: "Bathrooms", type: "number" },
            { name: "floors", label: "Floors", type: "number" },
            { name: "areaM2", label: "Floor area (m²)", type: "number" },
            { name: "plansPriceUGX", label: "Plans price (UGX)", type: "ugx" },
            { name: "buildFromUGX", label: "Build from (UGX, estimate)", type: "ugx" },
            { name: "architect", label: "Designed by", type: "text" },
            { name: "release", label: "Release", type: "text", default: "2026.1" },
            { name: "images", label: "Renders and plans", type: "images" },
            { name: "tags", label: "Tags", type: "tags" },
            ...tail,
        ],
    },
    projects: {
        label: "Projects",
        page: "projects",
        local: () => import("./projects.js").then((m) => m.projects),
        fields: [
            ...base,
            { name: "divisions", label: "Divisions", type: "tags", help: DIVISIONS.join(", ") },
            { name: "summary", label: "Summary", type: "textarea" },
            { name: "brief", label: "The brief", type: "textarea" },
            { name: "work", label: "What we did", type: "textarea" },
            { name: "client", label: "Client", type: "text" },
            { name: "location", label: "Location", type: "text" },
            { name: "year", label: "Year", type: "number" },
            { name: "images", label: "Images", type: "images" },
            ...tail,
        ],
    },
    developments: {
        label: "Real-estate developments",
        page: "realEstate",
        local: () => import("./developments.js").then((m) => m.developments),
        fields: [
            ...base,
            { name: "location", label: "Location", type: "text" },
            { name: "status", label: "Status", type: "select", options: ["planning", "selling", "building", "complete"] },
            { name: "summary", label: "Summary", type: "textarea" },
            { name: "units", label: "Units", type: "number" },
            { name: "unitFromUGX", label: "Units from (UGX)", type: "ugx" },
            { name: "minInvestUGX", label: "Minimum investment (UGX)", type: "ugx" },
            { name: "completion", label: "Expected completion", type: "text" },
            { name: "images", label: "Images", type: "images" },
            ...tail,
        ],
    },
    posts: {
        label: "Journal posts",
        page: "journal",
        local: () => import("./posts.js").then((m) => m.posts),
        fields: [
            ...base,
            { name: "category", label: "Category", type: "select", options: ["project stories", "community", "workshops", "news"] },
            { name: "excerpt", label: "Excerpt", type: "textarea" },
            { name: "body", label: "Body", help: "Blank line between paragraphs. Start a line with ## for a subheading, or - for a list item.", type: "textarea", rows: 14 },
            { name: "author", label: "Author", type: "text" },
            { name: "publishedAt", label: "Published", type: "date" },
            { name: "images", label: "Images", type: "images" },
            ...tail,
        ],
    },
    courses: {
        label: "Academy courses",
        page: "academy",
        local: () => import("./courses.js").then((m) => m.courses),
        fields: [
            ...base,
            { name: "level", label: "Level", type: "select", options: ["beginner", "intermediate", "advanced"] },
            { name: "summary", label: "Summary", type: "textarea" },
            { name: "duration", label: "Duration", type: "text" },
            { name: "priceUGX", label: "Price (UGX)", type: "ugx", help: "Empty = to be confirmed. 0 = free." },
            { name: "starts", label: "Next start", type: "date" },
            { name: "tools", label: "Software", type: "tags" },
            ...tail,
        ],
    },
    events: {
        label: "Events and workshops",
        page: "community",
        local: () => import("./events.js").then((m) => m.events),
        fields: [
            ...base,
            { name: "date", label: "Date", type: "date" },
            { name: "venue", label: "Venue", type: "text" },
            { name: "summary", label: "Summary", type: "textarea" },
            { name: "capacity", label: "Places", type: "number" },
            { name: "priceUGX", label: "Price (UGX)", type: "ugx" },
            ...tail,
        ],
    },
    downloads: {
        label: "Free downloads",
        page: "templates",
        local: () => import("./downloads.js").then((m) => m.downloads),
        fields: [
            ...base,
            { name: "description", label: "What's in it", type: "textarea" },
            { name: "file", label: "File (PDF or image)", type: "file", help: "Visitors get this link after they subscribe. Until a file is uploaded, the site says it isn't ready and that we'll email it." },
            { name: "images", label: "Cover image", type: "images" },
            { name: "active", label: "Show on the site", type: "bool", default: true },
        ],
    },
};

/** Text → a web-address-friendly name: "Oak Armchair!" → "oak-armchair". */
export const slugify = (text) =>
    String(text ?? "")
        .toLowerCase()
        .normalize("NFKD")
        .replace(/[^\w\s-]/g, "")
        .trim()
        .replace(/[\s_]+/g, "-")
        .replace(/-+/g, "-")
        .slice(0, 80);
