import { createContext } from "react";

// The app-wide contexts. Providers live in AuthContext.jsx, ThemeContext.jsx and CartContext.jsx;
// read them with useAuth(), useTheme() and useCart() from src/hooks/.
export const AuthContext = createContext(null);
export const ThemeContext = createContext(null);
export const CartContext = createContext(null);
