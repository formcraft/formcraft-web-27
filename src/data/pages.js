// Every page on the site, in one list. The admin page turns pages on and off for visitors
// (Firestore `settings/site`, field `pages`); `defaultOn` is used until that document exists
// and while it loads. `locked` pages can't be turned off. Hidden pages drop out of the header,
// footer and home doors, and their addresses show a "not open yet" sheet to visitors.
// Admins always see every page, marked "Hidden" when it's off.
export const PAGES = [
    { key: "home", label: "Home", paths: ["/"], group: "Company", locked: true },
    { key: "studio", label: "Studio", note: "Design, pre-construction & BIM", paths: ["/studio"], group: "Hire us", defaultOn: true },
    { key: "construction", label: "Construction", note: "Building what the model promised", paths: ["/construction"], group: "Hire us", defaultOn: true },
    { key: "concrete", label: "Concrete", note: "Precast and green concrete", paths: ["/concrete"], group: "Hire us", defaultOn: true },
    { key: "templates", label: "Template builds", note: "Ready-to-build home designs", paths: ["/templates", "/templates/:slug"], group: "Hire us", defaultOn: true },
    { key: "projects", label: "Projects", note: "Work we've designed and built", paths: ["/projects", "/projects/:slug"], group: "Hire us", defaultOn: true },
    { key: "stores", label: "Stores", note: "Furniture, joinery and goods", paths: ["/stores", "/stores/:slug"], group: "Shop", defaultOn: true },
    { key: "checkout", label: "Checkout", note: "Cart, delivery and payment", paths: ["/checkout", "/checkout/confirmed"], group: "Shop", defaultOn: true, unlisted: true },
    { key: "community", label: "Community", note: "Artisans and creatives", paths: ["/community"], group: "Join", defaultOn: true },
    { key: "academy", label: "Academy", note: "BIM and CAD courses", paths: ["/academy"], group: "Join", defaultOn: true },
    { key: "invest", label: "Invest", note: "Roadmap and the investor pack", paths: ["/invest"], group: "Back us", defaultOn: true },
    { key: "realEstate", label: "Real estate", note: "Developments you can invest in", paths: ["/real-estate", "/real-estate/:slug"], group: "Back us", defaultOn: true },
    { key: "donate", label: "Plant a tree", note: "Give back some of what building takes", paths: ["/donate", "/donate/thank-you"], group: "Back us", defaultOn: true },
    { key: "journal", label: "Journal", note: "Project stories and community news", paths: ["/journal", "/journal/:slug"], group: "Company", defaultOn: true },
    { key: "about", label: "About", paths: ["/about"], group: "Company", defaultOn: true },
    { key: "contact", label: "Contact", paths: ["/contact"], group: "Company", locked: true },
    { key: "links", label: "Links", note: "Link-in-bio page for social profiles", paths: ["/links"], group: "Company", defaultOn: true, unlisted: true },
    { key: "privacy", label: "Privacy", paths: ["/privacy"], group: "Company", locked: true, unlisted: true },
    { key: "account", label: "Your account", paths: ["/account"], group: "Account", defaultOn: true, unlisted: true },
    { key: "signIn", label: "Sign in", paths: ["/sign-in"], group: "Account", locked: true, unlisted: true },
    { key: "admin", label: "Admin", paths: ["/admin"], group: "Account", locked: true, unlisted: true },
];

/** The groups pages are listed under on Admin → Pages (the menu's four doors, then Company and Account). */
export const PAGE_GROUPS = ["Hire us", "Shop", "Join", "Back us", "Company", "Account"];

/** The page entry for a key, e.g. pageByKey("stores"). */
export const pageByKey = (key) => PAGES.find((p) => p.key === key);

const matches = (pattern, path) => {
    const a = pattern.split("/").filter(Boolean);
    const b = path.split(/[?#]/)[0].split("/").filter(Boolean);
    return a.length === b.length && a.every((seg, i) => seg.startsWith(":") || seg === b[i]);
};

// Which page a link or address belongs to (null for outside links and unknown paths)
export const pageForPath = (path) => {
    if (!path || !path.startsWith("/")) return null;
    return PAGES.find((p) => p.paths.some((pattern) => matches(pattern, path))) ?? null;
};

/** Which pages are on before the admin has changed anything: { key: true|false }. */
export const defaultVisibility = () => Object.fromEntries(PAGES.map((p) => [p.key, p.locked ? true : p.defaultOn !== false]));
