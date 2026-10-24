import { useEffect, useRef, useState } from "react";
import { useTheme } from "../../hooks/useTheme";
import { PaperLayers } from "./PaperLayers";
import "./HotelScene.css";

const canUse3D = () => {
    if (typeof window === "undefined") return false;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return false;
    if (navigator.connection?.saveData) return false;
    if (navigator.deviceMemory && navigator.deviceMemory < 3) return false;
    try {
        const c = document.createElement("canvas");
        return Boolean(c.getContext("webgl2") || c.getContext("webgl"));
    } catch {
        return false;
    }
};

const loaders = {
    day: () => import("./hotel/hotelDay"),
    night: () => import("./hotel/hotelNight"),
};

// The home page's live paper model: a fixed canvas behind the whole page. Sections marked
// data-cam="hero|chain|plan|work|dusk" steer the camera as the visitor scrolls; the hero, the
// plan band and the closing band are see-through windows onto it. Each edition has its own
// lighting script (day: sun on paper; night: lit windows, moon, fireflies), loaded on demand.
// Without WebGL, or with reduced motion, the paper landscape stands in.
export const HotelScene = () => {
    const { theme } = useTheme();
    const [use3D] = useState(canUse3D);
    const [ready, setReady] = useState(false);
    const canvasRef = useRef(null);

    useEffect(() => {
        if (!use3D) return undefined;
        let handle = null;
        let cancelled = false;
        setReady(false);
        loaders[theme === "night" ? "night" : "day"]()
            .then(({ createHotelScene }) => {
                if (cancelled || !canvasRef.current) return;
                handle = createHotelScene(canvasRef.current, {
                    sheetUrl: "/images/fmc-sheet-a1.webp",
                    onReady: () => setReady(true),
                });
            })
            .catch((error) => console.warn("Hotel model unavailable, keeping the paper scene.", error));
        return () => {
            cancelled = true;
            handle?.dispose();
        };
    }, [use3D, theme]);

    return (
        <div className={`hotel-scene ${ready ? "is-ready" : ""}`} aria-hidden="true">
            {use3D ? (
                // a fresh canvas per edition, so each script gets a clean WebGL context
                <canvas key={theme} id="scene" ref={canvasRef} className="hotel-scene-canvas" />
            ) : (
                <PaperLayers seed={7} height={620} className="hotel-scene-fallback" />
            )}
        </div>
    );
};

// Labels pinned to the model by the scene script (it moves them each frame)
export const HotelTags = () => (
    <div className="hotel-tags" aria-hidden="true">
        <div id="tag-design">
            <b>In design</b>
            <i />
            <small>G3 · drawn, not yet built</small>
        </div>
        <div id="tag-cut">
            <b>Cutaway</b>
            <i />
            <small>levels 1–2 guest rooms, fitted out</small>
        </div>
        <div id="tag-built">
            <b>Built</b>
            <i />
            <small>G5 · from the same model</small>
        </div>
    </div>
);
