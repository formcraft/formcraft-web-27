// SEO and link previews: one source of truth for page titles, descriptions, preview images,
// the sitemap and structured data (JSON-LD).
// - In the browser, `usePageMeta` (src/hooks/usePageMeta.js) reads it on every navigation.
// - At build time, `scripts/seo-pages.mjs` imports it in Node and writes one HTML file per route
//   (head only), dist/sitemap.xml and dist/robots.txt. `scripts/make-og.mjs` draws public/og/*.jpg.
// So this file must stay plain ESM: no JSX, CSS or Vite-only imports.
// Facts only (CLAUDE.md): anything not known is left out or marked TODO, never invented.

// ── Site address ──────────────────────────────────────────────────────────────────────────────
// TODO: domain not confirmed by the owner. The social posters use formcraftdesign.com.
// Set SITE_URL (build, Node) and VITE_SITE_URL (browser, .env.local / CI) to the real domain.
const DEFAULT_SITE_URL = "https://formcraftdesign.com";

const fromNode = () => {
    try {
        return typeof process !== "undefined" && process.env ? process.env.SITE_URL || process.env.VITE_SITE_URL : undefined;
    } catch {
        return undefined;
    }
};
const fromVite = () => {
    try {
        return import.meta.env ? import.meta.env.VITE_SITE_URL : undefined;
    } catch {
        return undefined;
    }
};

export const SITE_URL = String(fromNode() || fromVite() || DEFAULT_SITE_URL).replace(/\/+$/, "");
export const SITE_NAME = "Formcraft";
export const TAGLINE = "Designing spaces. Empowering communities."; // never reworded
export const LOCALE = "en_UG";
export const DEFAULT_OG_IMAGE = "/og/og.jpg";

// Same format as usePageMeta has always used
export const pageTitle = (title) => (title ? `${title} · ${SITE_NAME}` : `${SITE_NAME} · ${TAGLINE}`);

// Absolute URL on the site (leaves full URLs alone)
export const absUrl = (path = "/") => (/^https?:\/\//.test(path) ? path : `${SITE_URL}${path.startsWith("/") ? "" : "/"}${path}`);

// ── Organisation (JSON-LD) ────────────────────────────────────────────────────────────────────
export const ORG = {
    name: "Formcraft Design and Construction Co. Ltd",
    shortName: "Formcraft",
    slogan: TAGLINE,
    locality: "Kampala",
    country: "UG",
    countryName: "Uganda",
    streetAddress: null, // TODO: street address of the Kampala office (owner)
    telephone: "+256 753 929 921",
    email: "formcraftdesign@gmail.com", // TODO: owner to confirm the public email (posters say formcraft@gmail.com)
    logo: "/logos/formcraft-navy.svg",
    founders: ["Emlyn Atochon", "Peter Isingoma"],
    social: {
        instagram: "https://www.instagram.com/formcraft.ug",
        x: "https://x.com/formcraft_ug",
        linkedin: "https://www.linkedin.com/company/formcraftinc", // TODO: verify the LinkedIn URL (company page vs profile)
    },
};

// ── Routes ────────────────────────────────────────────────────────────────────────────────────
// `title` is the part before " · Formcraft" (null on Home: `fullTitle` is used as-is).
// Full titles stay at 60 characters or fewer; descriptions at 155 or fewer.
// `label` is the breadcrumb name; `og` the preview card's eyebrow and headline (headline = the page's
// own hero title where it has one). `noindex` pages get robots noindex and stay out of the sitemap.
export const ROUTES = {
    "/": {
        key: "home",
        label: "Home",
        fullTitle: "Formcraft · Design and construction company in Kampala",
        description:
            "Formcraft Design and Construction, Kampala: BIM-led architectural design, construction, precast concrete and workshop-made furniture, with local artisans.",
        og: { eyebrow: "Design and construction · Kampala", headline: "Designing spaces. Empowering communities." },
        priority: 1.0,
        changefreq: "weekly",
    },
    "/studio": {
        key: "studio",
        label: "Studio",
        title: "Architects in Kampala: design & BIM services",
        description:
            "Architectural design in Uganda from survey to permit: plans, 3D views, engineering, bill of quantities and Revit BIM, at a clear share of your budget.",
        og: { eyebrow: "Studio · architecture & BIM", headline: "Plan it properly before you build." },
        priority: 0.9,
        changefreq: "monthly",
    },
    "/construction": {
        key: "construction",
        label: "Construction",
        title: "Construction company in Kampala, design & build",
        description:
            "Building contractors in Uganda who build from a construction-ready model, zone by zone. Design and build with one team, and ready-to-build homes.",
        og: { eyebrow: "Construction · design & build", headline: "Built in the model first, then on site." },
        priority: 0.9,
        changefreq: "monthly",
    },
    "/concrete": {
        key: "concrete",
        label: "Concrete",
        title: "Precast concrete Uganda: beams, lintels, pavers",
        description:
            "Precast columns, beams and lintels, concrete pavers, facing bricks, facade panels and green concrete, supplied to contractors and developers in Kampala.",
        og: { eyebrow: "Concrete · precast & green concrete", headline: "Precast that arrives ready to build." },
        priority: 0.9,
        changefreq: "monthly",
    },
    "/templates": {
        key: "templates",
        label: "Template builds",
        title: "House plans in Uganda for 50 by 100 ft plots",
        description:
            "Ready-to-build, permit-ready house plans for 50 by 100 ft plots in Uganda: bungalow designs and two-storey homes. Buy the plans, or we build it for you.",
        og: { eyebrow: "Template builds · house plans", headline: "Choose your home. We'll build it." },
        priority: 0.9,
        changefreq: "weekly",
    },
    "/projects": {
        key: "projects",
        label: "Projects",
        title: "Projects: architecture and construction",
        description:
            "Work Formcraft has designed, built and made: from factory complexes and schools to landscapes and joinery. See the models, renders and what we did.",
        og: { eyebrow: "Projects", headline: "Work we've designed, built and made." },
        priority: 0.8,
        changefreq: "monthly",
    },
    "/stores": {
        key: "stores",
        label: "Stores",
        title: "Handmade furniture in Kampala · Stores",
        description:
            "Wooden furniture, made-to-order kitchens, wardrobes, joinery and everyday goods, made in the Formcraft workshop in Kampala. Every piece has a maker.",
        og: { eyebrow: "Stores · furniture & joinery", headline: "Made in our Kampala workshop." },
        priority: 0.8,
        changefreq: "weekly",
    },
    "/community": {
        key: "community",
        label: "Community",
        title: "Artisans in Uganda · the Formcraft community",
        description:
            "Carpenters, welders, sculptors, designers and students working with Formcraft as equals: fair pricing, shared machinery and a steady market for your craft.",
        og: { eyebrow: "Community · artisans & creatives", headline: "Formcraft sets the market for the work — you focus on the craft." },
        priority: 0.7,
        changefreq: "monthly",
    },
    "/academy": {
        key: "academy",
        label: "Academy",
        title: "Revit and BIM training in Kampala · Academy",
        description:
            "Formcraft Academy: Revit and BIM courses, CAD, visualisation, workshop sessions and internships in Kampala, taught from how we work on real projects.",
        og: { eyebrow: "Academy · BIM & CAD courses", headline: "Learn the way we design and build." },
        priority: 0.7,
        changefreq: "monthly",
    },
    "/journal": {
        key: "journal",
        label: "Journal",
        title: "Journal: BIM, construction and craft",
        description:
            "The Formcraft Journal: notes on construction, BIM and craft from real projects in Kampala, written by the team.",
        og: { eyebrow: "Journal", headline: "Notes on construction, BIM and craft." },
        priority: 0.7,
        changefreq: "weekly",
    },
    "/invest": {
        key: "invest",
        label: "Invest",
        title: "Invest in a Ugandan design-build company",
        description:
            "Formcraft's vision, roadmap from 2023 to 2028 and targets: $1M annual revenue and 20% of profits reinvested in artisans. Request the investor pack.",
        og: { eyebrow: "Invest in Formcraft", headline: "Africa's built environment, designed and made locally." },
        priority: 0.6,
        changefreq: "monthly",
    },
    "/real-estate": {
        key: "real-estate",
        label: "Real estate",
        title: "Real estate investment in Uganda",
        description:
            "Property investment with Formcraft: rental apartments, hostels and homes designed by our Studio and built by our Construction team. Share in the returns.",
        og: { eyebrow: "Real estate · property investment", headline: "Invest in the buildings we design and build." },
        priority: 0.6,
        changefreq: "monthly",
    },
    "/donate": {
        key: "donate",
        label: "Plant a tree",
        title: "Plant a tree",
        description:
            "Give back some of what building takes: choose how many trees to plant with Formcraft and see the live count.",
        og: { eyebrow: "Plant a tree", headline: "Plant a tree with Formcraft." },
        priority: 0.5,
        changefreq: "monthly",
    },
    "/about": {
        key: "about",
        label: "About",
        title: "About Formcraft, design-build firm in Kampala",
        description:
            "Formcraft Design and Construction Co. Ltd: architecture, engineering, concrete, joinery and real estate in one value chain, built with local craftspeople.",
        og: { eyebrow: "About Formcraft", headline: "Designing spaces. Empowering communities." },
        priority: 0.6,
        changefreq: "monthly",
    },
    "/contact": {
        key: "contact",
        label: "Contact",
        title: "Contact Formcraft in Kampala",
        description: "Talk to Formcraft in Kampala: phone +256 753 929 921, email formcraftdesign@gmail.com, or send a message.",
        og: { eyebrow: "Contact · Kampala, Uganda", headline: "Talk to us." },
        priority: 0.6,
        changefreq: "yearly",
    },
    "/privacy": {
        key: "privacy",
        label: "Privacy",
        title: "Privacy",
        description: "How Formcraft collects, uses and looks after the information you share on this site.",
        og: { eyebrow: "Privacy", headline: "How we look after your information." },
        priority: 0.2,
        changefreq: "yearly",
    },
    // Link-in-bio page: shared from social profiles, so it gets a preview card but stays out of search
    "/links": {
        key: "links",
        label: "Links",
        title: "Links",
        description: "Formcraft in one place: hire us, shop, join the community or back us.",
        og: { eyebrow: "Formcraft", headline: "Hire us. Shop. Join. Back us." },
        noindex: true,
    },

    // Private and transactional pages: never indexed, never in the sitemap
    "/checkout": { key: "checkout", label: "Checkout", title: "Checkout", description: "Check your order, add delivery details and pay with MTN or Airtel mobile money or card.", noindex: true },
    "/checkout/confirmed": { key: "checkout-confirmed", label: "Order confirmation", title: "Order confirmation", description: "The status of your Formcraft order, read from our records after Flutterwave confirms payment.", noindex: true },
    "/account": { key: "account", label: "Your account", title: "Your account", description: "Your Formcraft orders, downloads, courses, trees and profile.", noindex: true },
    "/sign-in": { key: "sign-in", label: "Sign in", title: "Sign in", description: "Sign in to Formcraft to see your orders, download plans, join the community or enrol on a course.", noindex: true },
    "/admin": { key: "admin", label: "Admin", title: "Admin", description: "Formcraft team admin.", noindex: true },
    "/donate/thank-you": { key: "donate-thanks", label: "Thank you", title: "Thank you for planting", description: "Thank you for planting trees with Formcraft. Your certificate and the live tree count.", noindex: true },
};

// Detail pages (dynamic): which starter-data file feeds them and how the page titles itself.
// Titles match what each page passes to usePageMeta, so the pre-built head and the live page agree.
export const DETAIL_SECTIONS = [
    { prefix: "/stores/", section: "/stores", data: "products", list: "products", type: "product", title: (x) => x.title, text: (x) => x.description, priority: 0.6 },
    { prefix: "/templates/", section: "/templates", data: "templates", list: "templates", type: "page", title: (x) => `${x.title} · Template builds`, text: (x) => x.summary, priority: 0.6 },
    { prefix: "/projects/", section: "/projects", data: "projects", list: "projects", type: "page", title: (x) => x.title, text: (x) => x.summary, priority: 0.6 },
    { prefix: "/journal/", section: "/journal", data: "posts", list: "posts", type: "article", title: (x) => x.title, text: (x) => x.excerpt, priority: 0.6 },
    { prefix: "/real-estate/", section: "/real-estate", data: "developments", list: "developments", type: "page", title: (x) => `${x.title} · Real estate`, text: (x) => x.summary, priority: 0.5 },
];

// ── Helpers ───────────────────────────────────────────────────────────────────────────────────
const clean = (p) => {
    const path = String(p || "/").split(/[?#]/)[0];
    return path.length > 1 ? path.replace(/\/+$/, "") : "/";
};

export const ogImageFor = (route) => (route?.key && !route.noindex) || route?.key === "links" ? `/og/${route.key}.jpg` : DEFAULT_OG_IMAGE;

// Static route meta for a path, or null (detail pages and unknown paths)
export const metaForPath = (pathname) => {
    const path = clean(pathname);
    const r = ROUTES[path];
    if (!r) return null;
    return {
        ...r,
        path,
        fullTitle: r.fullTitle ?? pageTitle(r.title),
        image: ogImageFor(r),
        noindex: !!r.noindex,
    };
};

export const detailSectionFor = (pathname) => DETAIL_SECTIONS.find((d) => clean(pathname).startsWith(d.prefix)) ?? null;

// Text from starter data or the admin can carry "TODO: …" notes or "[placeholder]" words.
// Previews and search snippets get only the finished part, or null if nothing real is left.
export const metaText = (text, max = 155) => {
    if (!text || typeof text !== "string") return null;
    let t = text.split(/\bTODO\b/)[0].replace(/\s+/g, " ").trim().replace(/[\s,;:·–—-]+$/, "");
    if (!t || /\[[^\]]*\]/.test(t)) return null;
    if (t.length > max) t = `${t.slice(0, max - 1).replace(/\s+\S*$/, "")}…`;
    return t;
};

// Is a starter item a placeholder (sample data, or a "[name]" title)? Those pages stay out of search.
export const isPlaceholderItem = (item) =>
    !item || /\[[^\]]*\]/.test(String(item.title ?? "")) || String(item.slug ?? "").startsWith("sample-") || (item.tags ?? []).includes("sample");

// An images[] entry → preview image path. Public image names use their 800 px copy.
export const imagePath = (img) => {
    const n = typeof img === "string" ? img : img?.url ?? img?.name ?? null;
    if (!n) return null;
    if (/^(https?:|\/)/.test(n)) return n;
    return `/images/${n}-800.webp`;
};

// ── JSON-LD builders ──────────────────────────────────────────────────────────────────────────
const ORG_ID = () => `${SITE_URL}/#organization`;
const SITE_ID = () => `${SITE_URL}/#website`;
const compact = (o) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== null && v !== undefined && !(Array.isArray(v) && !v.length)));

export const jsonLdFor = {
    // GeneralContractor and ProfessionalService are both LocalBusiness types; multi-typing is valid schema.org
    organization: () =>
        compact({
            "@context": "https://schema.org",
            "@type": ["GeneralContractor", "ProfessionalService"],
            "@id": ORG_ID(),
            name: ORG.name,
            alternateName: ORG.shortName,
            slogan: ORG.slogan,
            url: `${SITE_URL}/`,
            logo: absUrl(ORG.logo),
            image: absUrl(DEFAULT_OG_IMAGE),
            telephone: ORG.telephone,
            email: ORG.email,
            address: compact({ "@type": "PostalAddress", streetAddress: ORG.streetAddress, addressLocality: ORG.locality, addressCountry: ORG.country }),
            founder: ORG.founders.map((name) => ({ "@type": "Person", name })),
            sameAs: Object.values(ORG.social),
        }),

    website: () => ({
        "@context": "https://schema.org",
        "@type": "WebSite",
        "@id": SITE_ID(),
        name: SITE_NAME,
        alternateName: ORG.name,
        url: `${SITE_URL}/`,
        inLanguage: "en-UG",
        publisher: { "@id": ORG_ID() },
    }),

    // crumbs: [[name, path], …], Home first
    breadcrumbs: (crumbs) => ({
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: crumbs.map(([name, path], i) => ({ "@type": "ListItem", position: i + 1, name, item: absUrl(path) })),
    }),

    // Offers only when the price is a real whole-UGX integer
    product: (p, path) =>
        compact({
            "@context": "https://schema.org",
            "@type": "Product",
            name: p.title,
            description: metaText(p.description, 500),
            image: (p.images ?? []).map(imagePath).filter(Boolean).map(absUrl),
            sku: p.id ?? p.slug,
            category: p.category,
            url: absUrl(path),
            brand: { "@type": "Brand", name: SITE_NAME },
            manufacturer: { "@id": ORG_ID() },
            offers: Number.isInteger(p.priceUGX)
                ? { "@type": "Offer", price: p.priceUGX, priceCurrency: "UGX", url: absUrl(path), seller: { "@id": ORG_ID() } }
                : null,
        }),

    // Only fields we know: no invented dates or authors
    article: (post, path) =>
        compact({
            "@context": "https://schema.org",
            "@type": "Article",
            headline: post.title,
            description: metaText(post.excerpt, 300),
            image: (post.images ?? []).map(imagePath).filter(Boolean).map(absUrl),
            articleSection: post.category,
            datePublished: post.publishedAt || null,
            author: post.author ? { "@type": "Person", name: post.author } : null,
            publisher: { "@id": ORG_ID() },
            mainEntityOfPage: absUrl(path),
            url: absUrl(path),
        }),
};

// Breadcrumbs for a path: Home › Section › Item
export const crumbsFor = (path, itemTitle) => {
    if (path === "/") return [["Home", "/"]];
    const det = detailSectionFor(path);
    if (det) return [["Home", "/"], [ROUTES[det.section].label, det.section], [itemTitle ?? path, path]];
    const parent = path.split("/").slice(0, -1).join("/");
    const out = [["Home", "/"]];
    if (parent && ROUTES[parent]) out.push([ROUTES[parent].label, parent]);
    out.push([ROUTES[path]?.label ?? itemTitle ?? path, path]);
    return out;
};

// JSON-LD blocks for a static route
export const jsonLdForRoute = (path) => {
    const r = ROUTES[path];
    if (!r || r.noindex) return [];
    if (path === "/") return [jsonLdFor.organization(), jsonLdFor.website()];
    const blocks = [jsonLdFor.breadcrumbs(crumbsFor(path))];
    if (path === "/about" || path === "/contact") blocks.unshift(jsonLdFor.organization());
    return blocks;
};
