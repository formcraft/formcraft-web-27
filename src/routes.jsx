import { lazy } from "react";
import { Navigate } from "react-router-dom";
import { PageGate } from "./components/layout/PageGate";
import { pageForPath } from "./data/pages";

// One lazy chunk per page. Pages use named exports that match the file name.
const load = (name) => import(`./pages/${name}.jsx`);
const cache = {};
const page = (name) => (cache[name] ??= lazy(() => load(name).then((m) => ({ default: m[name] }))));

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

// Load a page's code before the visitor clicks (called on hover / focus / touch of a link)
const matches = (pattern, path) => {
    const a = pattern.split("/").filter(Boolean);
    const b = path.split(/[?#]/)[0].split("/").filter(Boolean);
    return a.length === b.length && a.every((seg, i) => seg.startsWith(":") || seg === b[i]);
};
const prefetched = new Set();
export const prefetchRoute = (href) => {
    if (!href?.startsWith("/")) return;
    const hit = TABLE.find(([pattern]) => matches(pattern, href));
    if (!hit || prefetched.has(hit[1])) return;
    prefetched.add(hit[1]);
    load(hit[1]).catch(() => prefetched.delete(hit[1]));
};
