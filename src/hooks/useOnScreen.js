// useOnScreen(): whether an element is on screen right now (watched by the browser's
// IntersectionObserver, so it costs nothing while scrolling).
//
// Used to pause decorative animations (drifting clouds, blinking lamps, the pulsing sun) once their
// scene has scrolled out of view: they keep running otherwise, and on phones repainting a shadowed
// scene every frame is what made scrolling stutter (measured with `npm run check:smooth`).
import { useEffect, useRef, useState } from "react";

/**
 * @param {string} [rootMargin="80px"]  how far outside the screen still counts as "on screen"
 * @returns {[import("react").RefObject<HTMLElement>, boolean]} a ref for the element, and whether it's on screen
 *   (true until the browser has answered, and in browsers without IntersectionObserver)
 */
export const useOnScreen = (rootMargin = "80px") => {
    const ref = useRef(null);
    const [onScreen, setOnScreen] = useState(true);
    useEffect(() => {
        const node = ref.current;
        if (!node || typeof IntersectionObserver === "undefined") return undefined;
        const io = new IntersectionObserver(([entry]) => setOnScreen(entry.isIntersecting), { rootMargin });
        io.observe(node);
        return () => io.disconnect();
    }, [rootMargin]);
    return [ref, onScreen];
};
