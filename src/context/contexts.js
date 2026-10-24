import { createContext } from "react";

// The app-wide contexts. Providers live in AuthContext.jsx, ThemeContext.jsx, CartContext.jsx and SiteContext.jsx;
// read them with useAuth(), useTheme(), useCart() and useSite() from src/hooks/.
export const AuthContext = createContext(null);
export const ThemeContext = createContext(null);
export const CartContext = createContext(null);
export const SiteContext = createContext(null);
