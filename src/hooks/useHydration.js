// Pre-rendered pages (scripts/prerender.mjs) arrive as finished HTML, and React "hydrates" them: it adopts the
// HTML instead of drawing it again, so nothing flickers. For that, React's first render in the browser must
// produce exactly the HTML that was built, and the build can't know anything about the visitor's device
// (saved settings, cached text, the cart, the clock). These two hooks keep device reads out of that first render:
// the component renders like the build did, then shows the device's values straight after.
import { useEffect, useRef, useState, useSyncExternalStore } from "react";

const noSubscribe = () => () => {};
const UNSET = Symbol("unset");

/**
 * True while React is adopting pre-rendered HTML (and while building it); false in every other render.
 * React calls the third function during hydration and on the server, then renders again with the second.
 * @returns {boolean}
 */
export const useIsHydrating = () => useSyncExternalStore(noSubscribe, () => false, () => true);

/**
 * Like useState, but the starting value comes from the visitor's device (storage, clock, screen): `read()` is
 * used straight away in normal renders, and right after hydration when the page was pre-rendered (until then
 * the component shows `fallback`, as the build did).
 * @template T
 * @param {() => T} read  reads the device's value
 * @param {T} fallback   what the build renders (defaults, nothing cached)
 * @returns {[T, (v: T | ((prev: T) => T)) => void]}
 * @example const [items, setItems] = useDeviceState(() => readJSON("fc-cart", []), []);
 */
export const useDeviceState = (read, fallback) => {
    const hydrating = useIsHydrating();
    const [state, setState] = useState(() => (hydrating ? UNSET : read()));
    const touched = useRef(false); // set before the device read arrived: keep that, don't overwrite it
    useEffect(() => {
        if (state === UNSET && !touched.current) setState(read());
        // read once, after the first render: later changes go through setState
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    // an update before the device value arrives works from the fallback, never from the placeholder
    const [set] = useState(() => (v) => {
        touched.current = true;
        setState((prev) => (typeof v === "function" ? v(prev === UNSET ? fallback : prev) : v));
    });
    return [state === UNSET ? fallback : state, set];
};
