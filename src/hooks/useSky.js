import { useEffect } from "react";
import { useDeviceState } from "./useHydration";
import { skyPosition } from "../lib/skyClock";

const MIDDAY = Object.freeze({ sun: 0.5, moon: -0.5 });

// useSky(): where the sun and moon are in Kampala's sky right now (from src/lib/skyClock.js),
// refreshed every minute and when the visitor comes back to the tab. Used by the hero skies.
/** @returns the current sun and moon positions (see skyPosition() in src/lib/skyClock.js). */
export const useSky = () => {
    // the clock is the device's: read after hydration (useHydration.js); the build uses midday
    const [sky, setSky] = useDeviceState(skyPosition, MIDDAY);
    useEffect(() => {
        const id = setInterval(() => setSky(skyPosition()), 60 * 1000);
        const onShow = () => document.visibilityState === "visible" && setSky(skyPosition());
        document.addEventListener("visibilitychange", onShow);
        return () => {
            clearInterval(id);
            document.removeEventListener("visibilitychange", onShow);
        };
    }, [setSky]);
    return sky;
};
