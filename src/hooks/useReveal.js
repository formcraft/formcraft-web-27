import { useLayoutEffect, useRef, useState } from "react";
import { useIsHydrating } from "./useHydration";

// useReveal(): tells a component when it has scrolled into view, so it can animate in
// ("sheets settle into place"). Used by the <Reveal> component.
// Content is visible by default and only hidden while it waits to slide in. On a pre-rendered page (adopted
// from its HTML) that means only what's still below the screen: what the visitor already sees stays put, so
// nothing blinks and the first paint isn't held back. After a page change inside the site, everything waits
// and slides in as before.
// One shared IntersectionObserver (the browser's "is this on screen?" watcher) serves the whole page,
// which is much cheaper than one per element. Each element is watched only until it first appears.
let observer = null;
const callbacks = new WeakMap();

const getObserver = () => {
    if (observer || typeof IntersectionObserver === "undefined") return observer;
    observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    callbacks.get(entry.target)?.();
                    observer.unobserve(entry.target);
                }
            });
        },
        { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    );
    return observer;
};

/**
 * @returns {[import("react").RefObject<HTMLElement>, boolean]} a ref to put on the element, and whether it's
 *   waiting to slide in (hidden). False straight away in browsers without IntersectionObserver.
 */
export const useReveal = () => {
    const ref = useRef(null);
    const prerendered = useRef(useIsHydrating()).current; // this element came from the pre-built HTML
    const [waiting, setWaiting] = useState(!prerendered);
    // before the browser paints: an adopted element already on screen stays as it is
    useLayoutEffect(() => {
        const node = ref.current;
        const io = getObserver();
        if (!node || !io) {
            setWaiting(false);
            return undefined;
        }
        if (prerendered) {
            const r = node.getBoundingClientRect();
            if (r.top < window.innerHeight && r.bottom > 0) return undefined; // seen already: no animation
            setWaiting(true); // below the screen: hide it, ready to slide in
        }
        callbacks.set(node, () => setWaiting(false));
        io.observe(node);
        return () => io.unobserve(node);
    }, [prerendered]);
    return [ref, waiting];
};
