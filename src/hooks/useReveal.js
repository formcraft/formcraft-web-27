import { useEffect, useRef, useState } from "react";

// Sheets settle into place as they scroll into view. One shared observer for the whole page.
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
