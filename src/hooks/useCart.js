// useCart(): the shopping cart, saved on this device. See src/context/CartContext.jsx.
import { useContext } from "react";
import { CartContext } from "../context/contexts";

/** @returns the cart: its items, and the functions to add, change, remove and clear them and to open the cart drawer. */
export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) throw new Error("useCart must be used inside <CartProvider>");
    return context;
};
