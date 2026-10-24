import { useEffect, useRef } from "react";
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
import { pageForPath } from "../../data/pages";

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
            <DonateFab />
            <CartDrawer />
            <ConsentBanner />
            <SubscribePrompt />
        </>
    );
};
