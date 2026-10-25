import { Suspense } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { CartProvider } from "./context/CartContext";
import { SiteProvider } from "./context/SiteContext";
import { Layout } from "./components/layout/Layout";
import { PageSkeleton } from "./components/layout/PageSkeleton";
import { routes } from "./routes";

// The app's outer shell. It wraps every page in the "providers" that hold app-wide information,
// then draws the shared layout (header, footer, floating buttons) and the page for the current address.
//
// Providers, outside to inside (each one can use the ones outside it):
//   ThemeProvider  – day or night edition                      (read it with useTheme())
//   AuthProvider   – who is signed in, and their role          (useAuth())
//   SiteProvider   – admin settings: which pages are on, contact details, animation speed (useSite())
//   CartProvider   – the shopping cart, saved on this device   (useCart())
// The router turns the address into a page (the list is in routes.jsx). In the browser that's BrowserRouter;
// at build time scripts/prerender.mjs uses a fixed address instead (src/entry-server.jsx), with the same tree,
// so the pre-built HTML and the browser's first render match.
// Suspense shows a skeleton while a page's code is downloading (each page is loaded only when needed).
//
// Pages render straight away; only the parts that need the signed-in user wait for Firebase.

/**
 * The app inside a router of the caller's choice.
 * @param {{ Router: import("react").ComponentType<{ children: import("react").ReactNode }> }} props
 */
export function AppTree({ Router }) {
    return (
        <ThemeProvider>
            <AuthProvider>
                <SiteProvider>
                <CartProvider>
                    <Router>
                        <Layout>
                            <Suspense fallback={<PageSkeleton />}>
                                <Routes>
                                    {routes.map((route) => (
                                        <Route key={route.path} path={route.path} element={route.element} />
                                    ))}
                                </Routes>
                            </Suspense>
                        </Layout>
                    </Router>
                </CartProvider>
                </SiteProvider>
            </AuthProvider>
        </ThemeProvider>
    );
}

/** The app in the browser. */
function App() {
    return <AppTree Router={BrowserRouter} />;
}

export default App;
