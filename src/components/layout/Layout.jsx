// The frame around every page: skip link, header, the page itself, footer, and the floating pieces (plant-a-tree
// button, cart drawer, cookie notice, email prompt, and the team's Sky tab). It also starts the funnel tracking, loads
// the page's published text early, and scrolls to the top and moves focus on navigation (not on the first load).
import { Suspense, lazy, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { DonateFab } from "./DonateFab";
import { ConsentBanner } from "./ConsentBanner";
import { CartDrawer } from "../shop/CartDrawer";
import { SubscribePrompt } from "../forms/SubscribePrompt";
import { initAttribution } from "../../lib/attribution";
import { installClickTracking } from "../../lib/track";
import { loadCopy } from "../../lib/copyStore";
import { useFeature } from "../../hooks/useSite";
import { useAuth } from "../../hooks/useAuth";
import { pageForPath } from "../../data/pages";

const SkyTester = lazy(() => import("../scene/SkyTester").then((m) => ({ default: m.SkyTester })));

// On a new page: go to the top (or to the #section in the link) and move focus to the main area
// so keyboard and screen-reader users start at the new content. Not on the first load, so Tab
// still starts at the skip link and the header.
const useScrollOnNavigate = () => {
    const { pathname, hash } = useLocation();
    const shown = useRef(pathname + hash); // the address the page first loaded on
    useEffect(() => {
        const firstLoad = shown.current === pathname + hash;
        shown.current = pathname + hash;
        if (hash) {
            const target = document.getElementById(hash.slice(1));
            if (target) {
                requestAnimationFrame(() => target.scrollIntoView({ behavior: "smooth", block: "start" }));
                return;
            }
        }
        if (firstLoad) return;
        window.scrollTo({ top: 0, behavior: "instant" });
        document.getElementById("main")?.focus({ preventScroll: true });
    }, [pathname, hash]);
};

// Funnel: remember where the visitor came from (tagged links, referrer) and count contact clicks.
const useFunnel = () => {
    useEffect(() => {
        initAttribution();
        installClickTracking();
    }, []);
};

// Start reading the page's edited text (Admin → Copy) as soon as the address is known, in parallel with
// the page's own code, so the edits are usually there before the page first draws.
const useCopyEarly = () => {
    const { pathname } = useLocation();
    useEffect(() => loadCopy(pageForPath(pathname)?.key), [pathname]);
};

/**
 * The frame around every page: skip link, header, the page itself (in <main>), footer, and the floating
 * pieces (plant-a-tree, cart drawer, cookie notice, email prompt). Used once in App.jsx.
 * @param {{ children: import("react").ReactNode }} props  the current page
 */
export const Layout = ({ children }) => {
    useScrollOnNavigate();
    useFunnel();
    useCopyEarly();
    // Admin → Features
    const plantTree = useFeature("plantTree");
    const subscribePrompt = useFeature("subscribePrompt");
    // the team's weather preview tab: signed-in team or `npm run dev` only, loaded on demand (visitors never get it)
    const { isEditor } = useAuth();
    const tester = import.meta.env.DEV || isEditor;
    return (
        <>
            <a className="skip-link" href="#main">
                Skip to content
            </a>
            <Header />
            <main id="main" tabIndex={-1} style={{ outline: "none", flex: 1 }}>
                {children}
            </main>
            <Footer />
            {plantTree && <DonateFab />}
            <CartDrawer />
            <ConsentBanner />
            {subscribePrompt && <SubscribePrompt />}
            {tester && (
                <Suspense fallback={null}>
                    <SkyTester />
                </Suspense>
            )}
        </>
    );
};
