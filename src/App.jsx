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
// BrowserRouter turns the address bar into pages; the list of pages is in routes.jsx.
// Suspense shows a skeleton while a page's code is downloading (each page is loaded only when needed).
//
// Pages render straight away; only the parts that need the signed-in user wait for Firebase.
function App() {
    return (
        <ThemeProvider>
            <AuthProvider>
                <SiteProvider>
                <CartProvider>
                    <BrowserRouter>
                        <Layout>
                            <Suspense fallback={<PageSkeleton />}>
                                <Routes>
                                    {routes.map((route) => (
                                        <Route key={route.path} path={route.path} element={route.element} />
                                    ))}
                                </Routes>
                            </Suspense>
                        </Layout>
                    </BrowserRouter>
                </CartProvider>
                </SiteProvider>
            </AuthProvider>
        </ThemeProvider>
    );
}

export default App;
