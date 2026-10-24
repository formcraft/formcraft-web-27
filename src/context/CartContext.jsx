import { useCallback, useEffect, useMemo, useState } from "react";
import { CartContext } from "./contexts";
import { readJSON, writeJSON } from "../lib/storage";
import { productById } from "../data/products";

// The cart holds { productId, color, size, qty } only, never prices: display prices come from
// the product data, and the real total is worked out by the createCheckout Cloud Function (Phase 3).
// Kept in localStorage so it survives navigation and reloads; synced to users/{uid}/cart in Phase 3.
const KEY = "fc-cart";

const sameLine = (a, b) => a.productId === b.productId && a.color === b.color && a.size === b.size;

const clean = (items) =>
    Array.isArray(items)
        ? items.filter((i) => i && productById(i.productId) && Number.isInteger(i.qty) && i.qty > 0).map((i) => ({
              productId: i.productId,
              color: i.color ?? null,
              size: i.size ?? null,
              qty: Math.min(i.qty, 99),
          }))
        : [];

export const CartProvider = ({ children }) => {
    const [items, setItems] = useState(() => clean(readJSON(KEY, [])));
    const [open, setOpen] = useState(false);

    useEffect(() => writeJSON(KEY, items), [items]);

    // Same product + colour + size adds to the quantity instead of a new line
    const add = useCallback((productId, { color = null, size = null, qty = 1 } = {}) => {
        setItems((prev) => {
            const line = { productId, color, size, qty };
            const existing = prev.find((i) => sameLine(i, line));
            if (existing) return prev.map((i) => (i === existing ? { ...i, qty: Math.min(99, i.qty + qty) } : i));
            return [...prev, line];
        });
    }, []);

    const update = useCallback((line, delta) => {
        setItems((prev) => prev.map((i) => (sameLine(i, line) ? { ...i, qty: Math.min(99, i.qty + delta) } : i)).filter((i) => i.qty > 0));
    }, []);

    const remove = useCallback((line) => setItems((prev) => prev.filter((i) => !sameLine(i, line))), []);
    const clear = useCallback(() => setItems([]), []);

    const value = useMemo(
        () => ({
            items,
            count: items.reduce((sum, i) => sum + i.qty, 0),
            add,
            update,
            remove,
            clear,
            open,
            openCart: () => setOpen(true),
            closeCart: () => setOpen(false),
        }),
        [items, add, update, remove, clear, open]
    );

    return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

