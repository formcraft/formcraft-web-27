// Projects until Phase 2–3 moves them to Firestore `projects`. Names come from the project
// folders and the Company Profile. Anything not confirmed is a TODO, never invented.
export const projects = [
    {
        slug: "karwani-complex",
        title: "Karwani Complex",
        divisions: ["studio"],
        summary: "TODO: one-line summary of the brief and the result, approved by the client.",
        client: null,
        location: null,
        year: null,
        images: [
            { name: "karwani-1", alt: "Karwani Complex, render" },
            { name: "karwani-2", alt: "Karwani Complex, street front render" },
            { name: "karwani-3", alt: "Karwani Complex, render of the entrance" },
        ],
        featured: true,
    },
    {
        slug: "muyenga-school",
        title: "Muyenga School",
        divisions: ["studio"],
        summary: "TODO: one-line summary of the brief and the result, approved by the client.",
        images: [
            { name: "muyenga-1", alt: "Muyenga School, render" },
            { name: "muyenga-3", alt: "Muyenga School from above, render" },
            { name: "muyenga-2", alt: "Muyenga School, model view" },
        ],
        featured: true,
    },
    {
        slug: "bwebajja-landscape",
        title: "Bwebajja landscape",
        divisions: ["studio"],
        summary: "A terraced landscape modelled as real elements: one model, a day model view and a night render.",
        images: [
            { name: "bwebajja-night", alt: "Bwebajja landscape at night, render from the model" },
            { name: "bwebajja-iso", alt: "Bwebajja landscape, model view of the terraces" },
            { name: "bwebajja-night-2", alt: "Bwebajja landscape from above at night" },
        ],
        featured: true,
    },
    {
        slug: "green-yard",
        title: "Green Yard",
        divisions: ["studio"],
        summary: "TODO: one-line summary of the brief and the result, approved by the client.",
        images: [
            { name: "greenyard-1", alt: "Green Yard, street view render" },
            { name: "greenyard-3", alt: "Green Yard, render of the garden pavilion" },
            { name: "greenyard-2", alt: "Green Yard, render" },
        ],
        featured: false,
    },
    {
        slug: "coffee-factory",
        title: "Coffee factory",
        divisions: ["studio"],
        summary: "TODO: one-line summary of the brief and the result, approved by the client.",
        images: [
            { name: "coffee-aerial", alt: "Coffee factory from above, render" },
            { name: "coffee-loading", alt: "Coffee factory loading area, render" },
            { name: "coffee-ortho", alt: "Coffee factory, orthographic view" },
        ],
        featured: false,
    },
    {
        slug: "jalobo",
        title: "Jalobo",
        divisions: ["studio"],
        summary: "TODO: project name and one-line summary, approved by the client.",
        images: [
            { name: "jalobo-pool", alt: "Jalobo, render by the pool" },
            { name: "jalobo-aerial", alt: "Jalobo site from above, render" },
            { name: "jalobo-night", alt: "Jalobo at night, render" },
        ],
        featured: false,
    },
    {
        slug: "bamboo-hut",
        title: "Bamboo hut concept",
        divisions: ["studio"],
        summary: "A concept pavilion in bamboo, its curved surfaces generated parametrically in Dynamo.",
        images: [
            { name: "bamboo-1", alt: "Bamboo hut concept, interior render" },
            { name: "bamboo-2", alt: "Bamboo hut concept, exterior render" },
        ],
        featured: false,
    },
    {
        slug: "church",
        title: "Church",
        divisions: ["studio"],
        summary: "TODO: project name and one-line summary, approved by the client.",
        images: [
            { name: "church-1", alt: "Church, render at dusk" },
            { name: "church-2", alt: "Church from above, render" },
        ],
        featured: false,
    },
];

// Flagship work named in the Company Profile; only Karwani has images in the repo so far
export const flagship = [
    { title: "Karwani Complex", division: "Studio", text: "TODO: confirm the one-line description with the client.", slug: "karwani-complex", image: "karwani-1" },
    { title: "Lydia Residential", division: "Studio", text: "Residential project", image: null },
    { title: "Lucy's Kitchen", division: "Craft", text: "Interior outfit", image: null },
    { title: "Ggaba Apartments", division: "Craft", text: "Furniture and joinery for 12 rental units across 4 floors", image: null },
];

export const DIVISIONS = [
    { id: "all", label: "All work" },
    { id: "studio", label: "Studio" },
    { id: "construction", label: "Construction" },
    { id: "concrete", label: "Concrete" },
    { id: "stores", label: "Craft & joinery" },
];

export const projectBySlug = (slug) => projects.find((p) => p.slug === slug);
