import { createContext } from "react";

// The app-wide contexts. Providers live in AuthContext.jsx, ThemeContext.jsx, CartContext.jsx and SiteContext.jsx;
// read them with useAuth(), useTheme(), useCart() and useSite() from src/hooks/.
export const AuthContext = createContext(null);
/** Day or night edition. Provided by ThemeProvider; read with useTheme(). */
export const ThemeContext = createContext(null);
/** The shopping cart. Provided by CartProvider; read with useCart(). */
export const CartContext = createContext(null);
/** The admin's site settings. Provided by SiteProvider; read with useSite(). */
export const SiteContext = createContext(null);
