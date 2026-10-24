import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { DonateFab } from "./DonateFab";
import { CartDrawer } from "../shop/CartDrawer";

// On a new page: go to the top (or to the #section in the link) and move focus to the main area
// so keyboard and screen-reader users start at the new content.
const useScrollOnNavigate = () => {
    const { pathname, hash } = useLocation();
    useEffect(() => {
        if (hash) {
            const target = document.getElementById(hash.slice(1));
            if (target) {
                requestAnimationFrame(() => target.scrollIntoView({ behavior: "smooth", block: "start" }));
                return;
            }
        }
        window.scrollTo({ top: 0, behavior: "instant" });
        document.getElementById("main")?.focus({ preventScroll: true });
    }, [pathname, hash]);
};

export const Layout = ({ children }) => {
    useScrollOnNavigate();
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
        </>
    );
};
