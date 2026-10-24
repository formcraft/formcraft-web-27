// The four doors from the site map, mirrored in the header and the mobile menu.
// Links to pages the admin has turned off are filtered out where they're rendered (useShowLink).
export const NAV_GROUPS = [
    {
        label: "Hire us",
        links: [
            { to: "/studio", label: "Studio", note: "Design, pre-construction & BIM" },
            { to: "/construction", label: "Construction", note: "Building what the model promised" },
            { to: "/concrete", label: "Concrete", note: "Precast and green concrete" },
            { to: "/templates", label: "Template builds", note: "Ready-to-build home designs" },
            { to: "/projects", label: "Projects", note: "Work we've designed and built" },
        ],
    },
    { label: "Shop", to: "/stores" },
    {
        label: "Join",
        links: [
            { to: "/community", label: "Community", note: "Artisans and creatives" },
            { to: "/academy", label: "Academy", note: "BIM and CAD courses" },
            { to: "/journal", label: "Journal", note: "Project stories and community news" },
        ],
    },
    {
        label: "Back us",
        links: [
            { to: "/invest", label: "Invest", note: "Roadmap and the investor pack" },
            { to: "/real-estate", label: "Real estate", note: "Developments you can invest in" },
            { to: "/donate", label: "Plant a tree", note: "Give back some of what building takes" },
        ],
    },
    { label: "About", to: "/about" },
    { label: "Contact", to: "/contact" },
];

// Drop links the visitor can't see, and groups left empty
export const filterNav = (groups, show) =>
    groups
        .map((g) => (g.links ? { ...g, links: g.links.filter((l) => show(l.to)) } : g))
        .filter((g) => (g.links ? g.links.length > 0 : show(g.to)));
