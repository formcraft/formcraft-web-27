// The list of pages: which address shows which page, plus old addresses that redirect.
//
// - Each page lives in src/pages/<Name>.jsx and is downloaded only when someone visits it ("lazy"),
//   so phones on slow data don't load the whole site up front.
// - PageGate (around most pages) hides a page the admin has switched off in Admin → Pages.
// - prefetchRoute() starts downloading a page's code when a visitor hovers over or touches a link,
//   so the page usually appears instantly when they click.
// To add a page: create src/pages/MyPage.jsx exporting `MyPage`, add a line to TABLE below, and
// (if the admin should be able to switch it off) add it to src/data/pages.js. See docs/recipes.md.
import { createElement, lazy } from "react";
import { Navigate } from "react-router-dom";
import { PageGate } from "./components/layout/PageGate";
import { pageForPath } from "./data/pages";
import { loadedPage, registerPages } from "./lib/pageRegistry";

// One lazy chunk per page. Pages use named exports that match the file name.
// At build time src/entry-server.jsx hands every page over up front (lib/pageRegistry.js), so React writes each page
// straight into its HTML instead of a skeleton; the browser still loads each page only when it's visited, and
// adopts the pre-written HTML meanwhile. (The pages are registered from there, not imported here: an import here
// would put every page into the browser's main file.)
const load = (name) => import(`./pages/${name}.jsx`);
const cache = {};
const page = (name) =>
    (cache[name] ??= (() => {
        const onDemand = lazy(() => load(name).then((m) => ({ default: m[name] })));
        const show = (props) => createElement(loadedPage(name) ?? onDemand, props);
        show.displayName = name; // the page's name in React DevTools
        return show;
    })());

// Route table: path → page component. `PageGate` hides pages the admin has turned off
// (src/data/pages.js decides which page key a path belongs to).
const TABLE = [
    ["/", "Home"],
    ["/about", "About"],
    ["/studio", "Studio"],
    ["/construction", "Construction"],
    ["/concrete", "Concrete"],
    ["/templates", "Templates"],
    ["/templates/:slug", "TemplateDesign"],
    ["/projects", "Projects"],
    ["/projects/:slug", "ProjectPage"],
    ["/stores", "Stores"],
    ["/stores/:slug", "ProductPage"],
    ["/checkout", "Checkout"],
    ["/checkout/confirmed", "OrderConfirmed"],
    ["/community", "Community"],
    ["/academy", "Academy"],
    ["/journal", "Journal"],
    ["/journal/:slug", "Post"],
    ["/invest", "Invest"],
    ["/real-estate", "RealEstate"],
    ["/real-estate/:slug", "RealEstateProject"],
    ["/donate", "Donate"],
    ["/donate/thank-you", "DonateThanks"],
    ["/contact", "Contact"],
    ["/links", "Links"],
    ["/privacy", "Privacy"],
    ["/account", "Account"],
    ["/sign-in", "SignIn"],
    ["/admin", "Admin"],
];

const gated = (path, name) => {
    const Page = page(name);
    const key = pageForPath(path.replace(/:\w+/g, "x"))?.key;
    return key ? (
        <PageGate pageKey={key}>
            <Page />
        </PageGate>
    ) : (
        <Page />
    );
};

const NotFound = page("NotFound");

/** Every route: { path, element }. App.jsx turns these into <Route>s. */
export const routes = [
    ...TABLE.map(([path, name]) => ({ path, element: gated(path, name) })),

    // Old paths keep working
    { path: "/shop", element: <Navigate to="/stores" replace /> },
    { path: "/portfolio", element: <Navigate to="/projects" replace /> },
    { path: "/services", element: <Navigate to="/studio" replace /> },
    { path: "/blog", element: <Navigate to="/journal" replace /> },
    { path: "/plans", element: <Navigate to="/templates" replace /> },

    { path: "*", element: <NotFound /> },
];

/** True when an address (e.g. "/stores/oak-armchair") fits a route pattern (e.g. "/stores/:slug"). */
const matches = (pattern, path) => {
    const a = pattern.split("/").filter(Boolean);
    const b = path.split(/[?#]/)[0].split("/").filter(Boolean);
    return a.length === b.length && a.every((seg, i) => seg.startsWith(":") || seg === b[i]);
};
const prefetched = new Set();
/**
 * The page component's name for an address ("NotFound" when nothing matches), e.g. "/stores/oak-armchair" →
 * "ProductPage". Also used at build time to find a page's stylesheets (scripts/prerender.mjs).
 * @param {string} pathname
 * @returns {string}
 */
export const pageNameFor = (pathname) => TABLE.find(([pattern]) => matches(pattern, pathname))?.[1] ?? "NotFound";

/**
 * Loads the code of the page at an address and hands it over, so React can render that page straight away (no
 * Suspense). main.jsx does this before adopting a pre-rendered page: while a page is still loading, React keeps the
 * pre-built HTML on hold, and any update above it (the cart, settings, sign-in) makes React throw it away and draw it
 * again from a skeleton (found in review, 2026-10-25). The HTML is on screen meanwhile, so the wait costs nothing.
 * @param {string} pathname  e.g. "/studio"
 * @returns {Promise<void>}
 */
export const preloadPage = async (pathname) => {
    const name = pageNameFor(pathname);
    const mod = await load(name);
    registerPages({ [`./pages/${name}.jsx`]: mod });
};

/**
 * Starts downloading a page's code before the visitor clicks (called on hover, focus or touch of a link).
 * Each page is fetched at most once; outside links and unknown addresses are ignored.
 * @param {string} href  the link's address, e.g. "/studio"
 */
export const prefetchRoute = (href) => {
    if (!href?.startsWith("/")) return;
    const hit = TABLE.find(([pattern]) => matches(pattern, href));
    if (!hit || prefetched.has(hit[1])) return;
    prefetched.add(hit[1]);
    load(hit[1]).catch(() => prefetched.delete(hit[1]));
};
