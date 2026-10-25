// CartContext: the shopping cart, shared with the whole app (read it with useCart()).
import { useCallback, useEffect, useMemo, useState } from "react";
import { CartContext } from "./contexts";
import { readJSON, writeJSON } from "../lib/storage";
import { useDeviceState } from "../hooks/useHydration";
import { productById } from "../data/products";

// The cart holds { productId, color, size, qty } only, never prices: display prices come from
// the product data, and the real total is worked out by the createCheckout Cloud Function (Phase 3).
// Kept in localStorage so it survives navigation and reloads; synced to users/{uid}/cart in Phase 3.
const KEY = "fc-cart";
const NO_ITEMS = []; // the empty cart the build renders (the device's cart arrives right after)

/** True when two cart lines are the same product in the same colour and size (they merge). */
const sameLine = (a, b) => a.productId === b.productId && a.color === b.color && a.size === b.size;

// A product id is known if it's in the starter list or in the store's latest product list from
// Admin → Content (Firestore), which useContent saves on the device as "fc-content-products".
// (Checking only the starter list used to drop Admin-added products from carts on reload.)
const knownProduct = (id) => {
    if (typeof id !== "string" || !id) return false;
    if (productById(id)) return true;
    const latest = readJSON("fc-content-products", []);
    return Array.isArray(latest) && latest.some((p) => p?.id === id || p?.slug === id);
};

/** Keeps only well-formed lines for products we know, with quantities 1–99. */
const clean = (items) =>
    Array.isArray(items)
        ? items.filter((i) => i && knownProduct(i.productId) && Number.isInteger(i.qty) && i.qty > 0).map((i) => ({
              productId: i.productId,
              color: i.color ?? null,
              size: i.size ?? null,
              qty: Math.min(i.qty, 99),
          }))
        : [];

/**
 * Wraps the app (see App.jsx). Provides: items, count, add(productId, {color, size, qty}),
 * update(line, +1/-1), remove(line), clear(), open, openCart(), closeCart().
 */
export const CartProvider = ({ children }) => {
    // saved on the device: read after the first render, so pre-rendered pages hydrate cleanly (useHydration.js)
    const [items, setItems] = useDeviceState(() => clean(readJSON(KEY, [])), NO_ITEMS);
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
    }, [setItems]);

    const update = useCallback((line, delta) => {
        setItems((prev) => prev.map((i) => (sameLine(i, line) ? { ...i, qty: Math.min(99, i.qty + delta) } : i)).filter((i) => i.qty > 0));
    }, [setItems]);

    const remove = useCallback((line) => setItems((prev) => prev.filter((i) => !sameLine(i, line))), [setItems]);
    const clear = useCallback(() => setItems([]), [setItems]);

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

