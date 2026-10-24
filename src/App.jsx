import { Suspense } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { CartProvider } from "./context/CartContext";
import { SiteProvider } from "./context/SiteContext";
import { Layout } from "./components/layout/Layout";
import { PageSkeleton } from "./components/layout/PageSkeleton";
import { routes } from "./routes";

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
