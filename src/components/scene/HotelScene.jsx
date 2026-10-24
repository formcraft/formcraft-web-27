import { useEffect, useRef, useState } from "react";
import { useTheme } from "../../hooks/useTheme";
import "./HotelScene.css";

// How the home page shows the hotel model:
// - "live": the three.js scene, faded in over the still picture once its first frame is drawn;
// - "tap":  the still picture with a "Tap to explore the model" button (slower phones, Save-Data,
//           reduced motion); tapping switches to live;
// - "still": the still picture only (no WebGL).
const webgl = () => {
    try {
        const c = document.createElement("canvas");
        return Boolean(c.getContext("webgl2") || c.getContext("webgl"));
    } catch {
        return false;
    }
};

const smallScreen = () => Math.min(window.innerWidth, window.innerHeight) < 700;

// ?still=1 (development only): renders the live scene alone, for scripts/render-hotel-stills.mjs
const stillCapture = () => import.meta.env.DEV && typeof window !== "undefined" && new URLSearchParams(window.location.search).has("still");

const pickMode = () => {
    if (typeof window === "undefined" || !webgl()) return "still";
    if (stillCapture()) return "live";
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return "tap";
    const conn = navigator.connection;
    if (conn?.saveData || /(^|-)2g$|^3g$/.test(conn?.effectiveType ?? "")) return "tap";
    if (smallScreen()) {
        const lowMemory = navigator.deviceMemory !== undefined && navigator.deviceMemory < 4;
        const fewCores = navigator.hardwareConcurrency !== undefined && navigator.hardwareConcurrency < 6;
        if (lowMemory || fewCores) return "tap";
    }
    return "live";
};

const loaders = {
    day: () => import("./hotel/hotelDay"),
    night: () => import("./hotel/hotelNight"),
};

// Baked paper textures (see the scripts' imageTex): phones get small ones for both maps;
// desktops get the full-size paper and draw the bump map themselves (it compresses badly).
const loadImage = (src) =>
    new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
        img.src = src;
    });
const loadTextures = () =>
    smallScreen()
        ? Promise.all([loadImage("/textures/hotel-paper-512.webp"), loadImage("/textures/hotel-bump-512.webp")]).then(([paper, bump]) => ({ paper, bump }))
        : loadImage("/textures/hotel-paper.webp").then((paper) => ({ paper }));

// Ask the scene to start from anywhere on the page (the hero's "Tap to explore" button)
export const exploreModel = () => window.dispatchEvent(new Event("fc:explore-model"));

// The still picture: the 3D scene's own first frame, rendered ahead of time for each edition
// and for landscape / portrait screens (scripts: see docs/current-code.md, "Home 3D scene").
const Still = ({ theme }) => (
    <picture className="hotel-scene-still">
        <source media="(orientation: portrait)" srcSet={`/images/hotel-port-${theme}.webp`} />
        <img src={`/images/hotel-land-${theme}.webp`} alt="" fetchPriority="high" decoding="async" />
    </picture>
);

// The home page's live paper model: a fixed layer behind the whole page. Sections marked
// data-cam="hero|chain|plan|work|dusk" steer the camera as the visitor scrolls; the hero, the
// plan band and the closing band are see-through windows onto it. Each edition has its own
// lighting script (day: sun on paper; night: lit windows, moon, fireflies), loaded on demand.
export const HotelScene = () => {
    const { theme } = useTheme();
    const edition = theme === "night" ? "night" : "day";
    const [mode, setMode] = useState(pickMode);
    const [ready, setReady] = useState(false);
    const canvasRef = useRef(null);

    // tell the page which mode is on (the hero shows its "Tap to explore" button in "tap" mode)
    useEffect(() => {
        document.documentElement.dataset.hotel = mode;
        if (stillCapture()) document.documentElement.classList.add("hotel-capture");
        const onExplore = () => setMode((m) => (m === "tap" ? "live" : m));
        window.addEventListener("fc:explore-model", onExplore);
        return () => {
            window.removeEventListener("fc:explore-model", onExplore);
            delete document.documentElement.dataset.hotel;
        };
    }, [mode]);

    useEffect(() => {
        if (mode !== "live") return undefined;
        let handle = null;
        let cancelled = false;
        setReady(false);
        // wait until the page has painted and the browser is idle, so text and buttons come first
        const idle = window.requestIdleCallback ?? ((fn) => setTimeout(fn, 600));
        const cancelIdle = window.cancelIdleCallback ?? clearTimeout;
        const start = () =>
            Promise.all([loaders[edition](), loadTextures()])
                .then(([{ createHotelScene }, textures]) => {
                    if (cancelled || !canvasRef.current) return;
                    handle = createHotelScene(canvasRef.current, {
                        sheetUrl: "/images/fmc-sheet-a1.webp",
                        textures,
                        // fade in only once a frame has really been drawn
                        onReady: () =>
                            requestAnimationFrame(() =>
                                requestAnimationFrame(() => {
                                    if (cancelled) return;
                                    setReady(true);
                                    if (stillCapture()) setTimeout(() => (window.__hotelStillReady = true), 4500);
                                })
                            ),
                    });
                    if (!handle) setMode("still");
                })
                .catch((error) => {
                    console.warn("Hotel model unavailable, keeping the still picture.", error);
                    if (!cancelled) setMode("still");
                });
        const idleId = idle(start, { timeout: 1800 });
        return () => {
            cancelled = true;
            cancelIdle(idleId);
            handle?.dispose();
        };
    }, [mode, edition]);

    return (
        <div className={`hotel-scene ${ready && mode === "live" ? "is-ready" : ""}`} aria-hidden="true">
            {/* the still picture shows straight away and stays underneath, so nothing ever flashes */}
            <Still theme={edition} />
            {mode === "live" && (
                // a fresh canvas per edition, so each script gets a clean WebGL context
                <canvas key={edition} id="scene" ref={canvasRef} className="hotel-scene-canvas" />
            )}
        </div>
    );
};

// "Tap to explore the model": shown by CSS only while the scene is in "tap" mode
export const HotelExplore = () => (
    <button type="button" className="hotel-explore" onClick={exploreModel}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3zM12 12l8-4.5M12 12v9M12 12L4 7.5" />
        </svg>
        Tap to explore the model
    </button>
);

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
