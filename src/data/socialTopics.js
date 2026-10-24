// Content pillars and a starter topic bank for the marketing studio (Admin → Studio → Topics →
// "Import the starter topics"). Ideas only, drawn from what the site and Company Profile say
// Formcraft does — not claims. Anything that needs a fact is a [placeholder] to fill in per post.
// Formats are suggestions: feed, carousel, story, reel, text (see src/data/socialPlatforms.js).

export const PILLARS = [
    "Projects & case studies",
    "BIM & design process",
    "Template homes",
    "Craft & workshop (Stores)",
    "Concrete & materials",
    "Site & safety",
    "Team & artisans",
    "Academy & skills",
    "Community & events",
    "Sustainability & trees",
    "Tips for home builders",
    "Behind the scenes",
    "Announcements",
];

const T = (pillar, idea, formats = ["feed"], notes = "") => ({ pillar, idea, formats, notes });

const RAW = [
    // Projects & case studies
    T("Projects & case studies", "Project reveal: [project name] — the brief, the site and the finished building", ["carousel", "feed"], "Social post kit: project reveal (FMC-MKT-SOC)."),
    T("Projects & case studies", "Before / after on [project name]: the plot on day one and the building at handover", ["carousel", "reel"], "Social post kit: before/after."),
    T("Projects & case studies", "From model to site: the same view of [project name] in the BIM model and in a site photo", ["carousel"]),
    T("Projects & case studies", "Flagship work: Karwani Complex — what we did on it", ["carousel"], "Check the project page for the facts; leave anything unknown out."),
    T("Projects & case studies", "Flagship work: Lydia Residential — what we did on it", ["carousel"]),
    T("Projects & case studies", "Flagship work: Lucy’s Kitchen — joinery and fit-out details", ["carousel"]),
    T("Projects & case studies", "Flagship work: Ggaba Apartments — what we did on it", ["carousel"]),
    T("Projects & case studies", "Client words on [project name] (only with the client’s written permission)", ["feed"], "Testimonial request & card (FMC-MKT-TST). Never invent a quote."),

    // BIM & design process
    T("BIM & design process", "Nine to fourteen weeks, in four steps: how a Studio project runs", ["carousel"], "Studio page: process."),
    T("BIM & design process", "What a clash check is, and why we fix clashes in the model instead of on site", ["carousel", "reel"]),
    T("BIM & design process", "Quantities straight from the model: how our bills of quantities are made", ["carousel"]),
    T("BIM & design process", "LOD in plain words: concept → developed design → construction detail → as-built", ["carousel"], "Studio page: BIM stages."),
    T("BIM & design process", "1D to 7D BIM: one slide per dimension (requirements to the asset register)", ["carousel"]),
    T("BIM & design process", "Renders before you buy: seeing finishes in 3D before they’re ordered", ["feed", "reel"]),
    T("BIM & design process", "What the council submission set contains, and how we follow it to a building permit", ["carousel"]),
    T("BIM & design process", "Open-format handover: what IFC files mean for a building owner", ["feed"]),

    // Template homes
    T("Template homes", "Ready-to-build designs for 50 × 100 ft plots: what’s in the drawing set", ["carousel"], "Templates page: what you get."),
    T("Template homes", "Design spotlight: [design name] — floor plan walk-through", ["carousel", "reel"]),
    T("Template homes", "Plans only, or plans and build: which suits you", ["carousel"]),
    T("Template homes", "Why every library design is adapted to your plot: survey, soil test, foundations", ["carousel"]),
    T("Template homes", "Designers: put your home in the library and earn a royalty when it sells", ["feed"], "Royalty terms are TODO on the site — don't quote numbers."),
    T("Template homes", "Every design is versioned: what changes between releases", ["feed"]),

    // Craft & workshop (Stores)
    T("Craft & workshop (Stores)", "Made in the Formcraft workshop: [product] from timber to finished piece", ["reel", "carousel"]),
    T("Craft & workshop (Stores)", "Product spotlight: [product] — materials, sizes, how to order", ["feed"], "Prices only once they're confirmed in Stores."),
    T("Craft & workshop (Stores)", "Made to order: tell us what you need, agree the design, we build it — visit any time", ["carousel"], "Stores page: made-to-order steps."),
    T("Craft & workshop (Stores)", "Kitchens, wardrobes, panelling, doors: joinery we fit out in our buildings", ["carousel"]),
    T("Craft & workshop (Stores)", "Merch: the Formcraft tote, bottle, helmet and vest", ["carousel"]),
    T("Craft & workshop (Stores)", "Detail shot: a joint, a finish or an edge up close, with a line on how it’s made", ["feed", "story"]),
    T("Craft & workshop (Stores)", "What you buy here pays the maker directly — meet [maker] (with their consent)", ["feed"]),

    // Concrete & materials
    T("Concrete & materials", "Precast that arrives ready to build: columns, beams and lintels from the yard", ["carousel"], "Concrete page."),
    T("Concrete & materials", "Pavers for driveways, courtyards and estates", ["feed"]),
    T("Concrete & materials", "Facing bricks and facade panels: finished faces for building fronts", ["carousel"]),
    T("Concrete & materials", "Green concrete: lower-carbon mixes from local aggregates", ["feed"], "Mix names and carbon figures are TODO — no numbers until confirmed."),
    T("Concrete & materials", "Made in the yard, not on your site: why precast saves shutters and time", ["reel"]),
    T("Concrete & materials", "For contractors: how to ask for supply — products, quantities and dates", ["feed"]),

    // Site & safety
    T("Site & safety", "Zone by zone: how we build from a construction-ready model", ["carousel"], "Construction page."),
    T("Site & safety", "Weekly site meeting and the three-week look-ahead, explained", ["feed"]),
    T("Site & safety", "PPE on our sites: helmets, vests and boots", ["feed", "story"]),
    T("Site & safety", "Site logistics model: planning access, cranes and storage before day one", ["carousel"]),
    T("Site & safety", "Digital handover: as-built model, drawings, manuals and warranties", ["carousel"]),
    T("Site & safety", "Progress update from [site] this week", ["story", "reel"]),

    // Team & artisans
    T("Team & artisans", "Team spotlight: [name], [role] — what a day looks like", ["feed"], "Social post kit: team spotlight. Ask before posting anyone's photo."),
    T("Team & artisans", "Founders’ story: from a university workshop in Mukono to a design-build firm", ["carousel"], "About page."),
    T("Team & artisans", "Our values, one per post: designers, artisans, engineers and clients at the same table", ["carousel"]),
    T("Team & artisans", "Meet a maker: [name], [trade] (with their consent)", ["feed", "reel"]),
    T("Team & artisans", "The Studio team at work on [project]", ["story"]),
    T("Team & artisans", "Why artisans work with us: fair prices agreed up front, shared machines, steady work", ["carousel"], "Community page."),

    // Academy & skills
    T("Academy & skills", "Learn the way we design and build: BIM and CAD courses", ["feed"], "Course dates and prices are TODO."),
    T("Academy & skills", "Workshop sessions: joinery, finishing and machine skills alongside our artisans", ["feed"]),
    T("Academy & skills", "Internships: modelling, drawings and time on site", ["feed"]),
    T("Academy & skills", "A quick CAD/BIM tip: [tip]", ["reel", "carousel"]),
    T("Academy & skills", "Student work: [student]’s model (with permission)", ["feed"]),
    T("Academy & skills", "How to register interest for the next course", ["story"]),

    // Community & events
    T("Community & events", "Formcraft sets the market for the work — you focus on the craft: join the community", ["feed"], "Community page line."),
    T("Community & events", "Upcoming event: [event] on [date] at [venue]", ["feed", "story"]),
    T("Community & events", "How joining works: sign up, we meet you, take on orders and commissions", ["carousel"]),
    T("Community & events", "Open commission: [job] for a [trade]", ["story"]),
    T("Community & events", "Event recap: [event] in photos", ["carousel"]),
    T("Community & events", "Carpenters, welders, sculptors, designers and students — who the community is for", ["feed"]),

    // Sustainability & trees
    T("Sustainability & trees", "Plant a tree with Formcraft: give back some of what building takes", ["feed"], "Partner and price per tree are TODO."),
    T("Sustainability & trees", "Native hardwood, shade tree, fruit tree: the three kinds we plant", ["carousel"], "Donate page."),
    T("Sustainability & trees", "Live tree count update: [number] planted", ["story"], "Use the live counter, never an estimate."),
    T("Sustainability & trees", "Eco-conscious materials and efficient workshop fabrication: how we cut waste", ["feed"]),
    T("Sustainability & trees", "Rainwater run-off and harvesting in our landscape designs", ["feed"]),
    T("Sustainability & trees", "Seasoned timber: why it matters and where ours comes from", ["feed"], "Sourcing facts TODO."),

    // Tips for home builders
    T("Tips for home builders", "Before you buy a plot: survey and boundary pegs", ["carousel"], "Social post kit: tip."),
    T("Tips for home builders", "Why a soil test comes before foundations", ["carousel"]),
    T("Tips for home builders", "What a bill of quantities is and how to read one", ["carousel"]),
    T("Tips for home builders", "How building approval works with the council", ["carousel"]),
    T("Tips for home builders", "Budgeting your build: the stages money goes in", ["carousel"]),
    T("Tips for home builders", "Five questions to ask before you hire a builder", ["carousel"]),
    T("Tips for home builders", "Planning for solar, water supply and septic from the start", ["carousel"]),
    T("Tips for home builders", "Choosing finishes: see them in a render before you buy", ["feed"]),

    // Behind the scenes
    T("Behind the scenes", "A day in the studio", ["reel", "story"]),
    T("Behind the scenes", "Workshop sounds: a short clip of a piece being made", ["reel"]),
    T("Behind the scenes", "Sketch to model to render: one design in three steps", ["carousel"]),
    T("Behind the scenes", "Morning at the precast yard", ["story"]),
    T("Behind the scenes", "Mood board for [project]", ["feed"]),
    T("Behind the scenes", "Quote of the week from the team (their own words)", ["feed"], "Social post kit: quote."),

    // Announcements
    T("Announcements", "New on the site: [page or feature]", ["feed", "story"]),
    T("Announcements", "New template home design released: [design name]", ["feed"]),
    T("Announcements", "New product in Stores: [product]", ["feed"]),
    T("Announcements", "We’re hiring: [role]", ["feed"]),
    T("Announcements", "Course intake open: [course]", ["feed"]),
    T("Announcements", "Promo: [offer] until [date] (never on awareness or remembrance days)", ["feed", "story"], "Social post kit: promo."),
];

export const STARTER_TOPICS = RAW.map((t) => ({ ...t, channels: [], lastUsedAt: null, uses: 0, active: true }));
