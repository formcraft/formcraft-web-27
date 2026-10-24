import { useEffect, useRef, useState } from "react";

// useReveal(): tells a component when it has scrolled into view, so it can animate in
// ("sheets settle into place"). Used by the <Reveal> component.
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
 * @returns {[import("react").RefObject<HTMLElement>, boolean]} a ref to put on the element, and
 *   whether it has come into view yet (true straight away in browsers without IntersectionObserver).
 */
export const useReveal = () => {
    const ref = useRef(null);
    const [inView, setInView] = useState(false);
    useEffect(() => {
        const node = ref.current;
        const io = getObserver();
        if (!node || !io) {
            setInView(true);
            return undefined;
        }
        callbacks.set(node, () => setInView(true));
        io.observe(node);
        return () => io.unobserve(node);
    }, []);
    return [ref, inView];
};
