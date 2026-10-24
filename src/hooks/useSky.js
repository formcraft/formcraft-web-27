import { useEffect, useState } from "react";
import { skyPosition } from "../lib/skyClock";

// useSky(): where the sun and moon are in Kampala's sky right now (from src/lib/skyClock.js),
// refreshed every minute and when the visitor comes back to the tab. Used by the hero skies.
/** @returns the current sun and moon positions (see skyPosition() in src/lib/skyClock.js). */
export const useSky = () => {
    const [sky, setSky] = useState(skyPosition);
    useEffect(() => {
        const id = setInterval(() => setSky(skyPosition()), 60 * 1000);
        const onShow = () => document.visibilityState === "visible" && setSky(skyPosition());
        document.addEventListener("visibilitychange", onShow);
        return () => {
            clearInterval(id);
            document.removeEventListener("visibilitychange", onShow);
        };
    }, []);
    return sky;
};
