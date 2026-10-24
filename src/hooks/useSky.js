import { useEffect, useState } from "react";
import { skyPosition } from "../lib/skyClock";

// Kampala's sun and moon positions, updated every minute
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
