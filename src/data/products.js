// Stores catalogue until Phase 3, when scripts/seed-products.js copies it into Firestore `products`.
// Shape matches the Firestore model in docs/build-plan.md. Prices are whole UGX integers;
// null means "not set yet" and shows as "Price on request". Never put made-up prices here.
export const products = [
    {
        id: "oak-armchair",
        slug: "oak-armchair",
        title: "Oak armchair",
        division: "stores",
        category: "furniture",
        priceUGX: null, // TODO: price from the workshop
        description: "Made to order in the Formcraft workshop, Kampala, with the Formcraft mark branded into the frame. TODO: timber, joinery, finish and dimensions from the workshop.",
        images: ["chair"],
        imageAlt: "Oak armchair with the Formcraft mark branded into the frame",
        colors: [],
        sizes: [],
        maker: "[artisan name]",
        leadTime: "Made to order · 2–3 weeks",
        stock: null,
        isDigital: false,
        active: true,
    },
    {
        id: "walnut-desk-organiser",
        slug: "walnut-desk-organiser",
        title: "Walnut desk organiser",
        division: "stores",
        category: "goods",
        priceUGX: null, // TODO
        description: "Solid timber desk organiser with the Formcraft wordmark engraved. TODO: dimensions and finish.",
        images: ["organiser"],
        imageAlt: "Walnut desk organiser with the Formcraft wordmark engraved",
        colors: [],
        sizes: [],
        maker: "[artisan name]",
        leadTime: null,
        stock: null,
        isDigital: false,
        active: true,
    },
    {
        id: "canvas-tote",
        slug: "canvas-tote",
        title: "Canvas tote",
        division: "stores",
        category: "goods",
        priceUGX: null, // TODO
        description: "Formcraft canvas tote. TODO: fabric, size and print details.",
        images: ["tote"],
        imageAlt: "Formcraft canvas tote bag on a wooden chair",
        colors: [],
        sizes: [],
        maker: null,
        leadTime: null,
        stock: null,
        isDigital: false,
        active: true,
    },
    {
        id: "water-bottle",
        slug: "water-bottle",
        title: "Water bottle",
        division: "stores",
        category: "goods",
        priceUGX: null, // TODO
        description: "Formcraft branded water bottle. TODO: capacity and material.",
        images: ["bottles"],
        imageAlt: "Formcraft branded water bottles",
        colors: [],
        sizes: [],
        maker: null,
        leadTime: null,
        stock: null,
        isDigital: false,
        active: true,
    },
    {
        id: "site-safety-helmet",
        slug: "site-safety-helmet",
        title: "Site safety helmet",
        division: "stores",
        category: "site-gear",
        priceUGX: null, // TODO
        description: "Formcraft site safety helmet. TODO: safety standard and sizes.",
        images: ["helmets"],
        imageAlt: "Formcraft site safety helmets",
        colors: [],
        sizes: [],
        maker: null,
        leadTime: null,
        stock: null,
        isDigital: false,
        active: true,
    },
    {
        id: "reflector-vest",
        slug: "reflector-vest",
        title: "Reflector vest",
        division: "stores",
        category: "site-gear",
        priceUGX: null, // TODO
        description: "Formcraft reflector vest for site work. TODO: sizes and standard.",
        images: ["vest"],
        imageAlt: "Formcraft reflector vest",
        colors: [],
        sizes: [],
        maker: null,
        leadTime: null,
        stock: null,
        isDigital: false,
        active: true,
    },
];

/** Shop categories, for the filter on /stores. */
export const CATEGORIES = [
    { id: "all", label: "All" },
    { id: "furniture", label: "Furniture" },
    { id: "goods", label: "Goods" },
    { id: "site-gear", label: "Site gear" },
];

/** A category id as words ("site-gear" → "Site gear"). */
export const categoryLabel = (id) => CATEGORIES.find((c) => c.id === id)?.label ?? id;
/** A starter product by its id (the built-in list only; the shop itself reads useContent("products")). */
export const productById = (id) => products.find((p) => p.id === id);
/** A starter product by its web-address name. */
export const productBySlug = (slug) => products.find((p) => p.slug === slug);
