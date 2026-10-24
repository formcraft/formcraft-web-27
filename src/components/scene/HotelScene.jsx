import { useEffect, useRef, useState } from "react";
import { useTheme } from "../../hooks/useTheme";
import { readJSON, writeJSON } from "../../lib/storage";
import "./HotelScene.css";

// How the home page shows the hotel model — device levels (owner brief, section 4):
// - "ultra":    dev preview only for now: 2× pixels, 4096 px shadows, antialiasing (strong graphics cards);
// - "full":     live three.js scene at full resolution, faded in over the still picture;
// - "standard": the same, with fewer pixels and smaller shadows (mid-range phones, 3G);
// - "still":    the still picture only (no WebGL).
// No device is sent to a "Tap to explore" step any more (owner, 2026-10-24): slow devices and
// connections get the standard scene, just later. "lite" only survives in old stored results,
// which are ignored. Browser signals give a first guess; a live frame check confirms it (too slow →
// standard), and the result is remembered on the device for 30 days so return visits don't guess again.
const LEVEL_KEY = "fc-3d-level";
const MONTH = 30 * 24 * 3600 * 1000;

const webglInfo = () => {
    try {
        const c = document.createElement("canvas");
        const gl = c.getContext("webgl2") || c.getContext("webgl");
        if (!gl) return null;
        const ext = gl.getExtension("WEBGL_debug_renderer_info");
        return { renderer: ext ? String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)) : "" };
    } catch {
        return null;
    }
};

const smallScreen = () => Math.min(window.innerWidth, window.innerHeight) < 700;

// Development only: preview the hotel as different devices get it (HotelPreviewSwitch below).
// Stored on this browser until changed; never read in production builds.
const PREVIEW_KEY = "fc-3d-preview";
const PREVIEWS = [
    ["auto", "Auto", null],
    ["ultra", "Ultra (this PC)", { level: "ultra" }],
    ["best", "Best (desktops)", { level: "full" }],
    ["phone", "Mid-range phone", { level: "standard" }],
    ["slow", "Slow phone", { level: "standard", delay: 6000 }],
    ["none", "No 3D", { level: "still" }],
];
const devPreview = () => (import.meta.env.DEV ? PREVIEWS.find(([key]) => key === readJSON(PREVIEW_KEY, "auto"))?.[2] ?? null : null);

// ?still=1 (development only): renders the live scene alone, for scripts/render-hotel-stills.mjs
const stillCapture = () => import.meta.env.DEV && typeof window !== "undefined" && new URLSearchParams(window.location.search).has("still");

const guessLevel = () => {
    if (typeof window === "undefined") return "still";
    const gl = webglInfo();
    if (!gl) return "still";
    if (stillCapture()) return "full";
    const preview = devPreview();
    if (preview) return preview.level;
    // Owner's rule: the model always comes in by itself; slow devices and connections only get it later
    // and at a lower quality, never behind a "Tap to explore" button. Reduced motion keeps the model
    // but the scene holds it still.
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return "standard";
    const saved = readJSON(LEVEL_KEY, null);
    if (saved?.level && saved.level !== "lite" && Date.now() - (saved.at ?? 0) < MONTH) return saved.level;
    const conn = navigator.connection;
    const mem = navigator.deviceMemory;
    const cores = navigator.hardwareConcurrency;
    if (conn?.saveData || /(^|-)2g$/.test(conn?.effectiveType ?? "")) return "standard";
    if (mem !== undefined && mem <= 2) return "standard";
    if (/swiftshader|llvmpipe|software/i.test(gl.renderer)) return "standard";
    if (conn?.effectiveType === "3g") return "standard";
    if (mem !== undefined && mem <= 4) return "standard";
    if (/mali-[4t]|adreno \(tm\) [345]\d\d|powervr sgx|videocore/i.test(gl.renderer)) return "standard";
    if (smallScreen() && cores !== undefined && cores < 6) return "standard";
    return "full";
};

const rememberLevel = (level) => writeJSON(LEVEL_KEY, { level, at: Date.now() });

const loaders = {
    day: () => import("./hotel/hotelDay"),
    night: () => import("./hotel/hotelNight"),
};

// Baked paper textures (see the scripts' imageTex), so no device draws a megapixel of noise on
// start-up: phones get 512 px paper, desktops 1024 px; the bump map is 512 px everywhere (fine at
// the scene's small bump scale, and it compresses badly at larger sizes).
const loadImage = (src) =>
    new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
        img.src = src;
    });
const loadTextures = () =>
    Promise.all([
        loadImage(smallScreen() ? "/textures/hotel-paper-512.webp" : "/textures/hotel-paper.webp"),
        loadImage("/textures/hotel-bump-512.webp"),
    ]).then(([paper, bump]) => ({ paper, bump }));

// Ask the scene to start from anywhere on the page (the hero's "Tap to explore" button)
export const exploreModel = () => window.dispatchEvent(new Event("fc:explore-model"));
// Views and zoom, from the buttons in the hero (HotelControls)
const hotelCommand = (detail) => window.dispatchEvent(new CustomEvent("fc:hotel", { detail }));

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
    const [level, setLevel] = useState(guessLevel);
    const [ready, setReady] = useState(false);
    const canvasRef = useRef(null);
    const handleRef = useRef(null);
    const live = level === "ultra" || level === "full" || level === "standard";

    // tell the page which level is on (CSS shows "Tap to explore" in lite, the view buttons when live + ready)
    useEffect(() => {
        const root = document.documentElement;
        root.dataset.hotel = live ? "live" : level === "lite" ? "tap" : "still";
        if (stillCapture()) root.classList.add("hotel-capture");
        const onExplore = () => setLevel((l) => (l === "lite" ? "standard" : l));
        const onCommand = (e) => {
            const h = handleRef.current;
            if (!h) return;
            const { view, zoom, reset } = e.detail ?? {};
            if (view) h.setView?.(view);
            if (zoom) h.zoomBy?.(zoom);
            if (reset) h.resetView?.();
        };
        window.addEventListener("fc:explore-model", onExplore);
        window.addEventListener("fc:hotel", onCommand);
        return () => {
            window.removeEventListener("fc:explore-model", onExplore);
            window.removeEventListener("fc:hotel", onCommand);
            delete root.dataset.hotel;
        };
    }, [level, live]);

    useEffect(() => {
        document.documentElement.toggleAttribute("data-hotel-ready", ready && live);
    }, [ready, live]);

    useEffect(() => {
        if (!live) return undefined;
        const controller = new AbortController();
        setReady(false);
        // wait until the page has painted and the browser is idle, so text and buttons come first
        const idle = window.requestIdleCallback ?? ((fn) => setTimeout(fn, 600));
        const cancelIdle = window.cancelIdleCallback ?? clearTimeout;
        const start = () =>
            // ultra draws its own uncompressed paper (the concept's look); the others use the baked WebP textures
            Promise.all([loaders[edition](), level === "ultra" ? Promise.resolve({}) : loadTextures()])
                .then(([{ createHotelScene }, textures]) => {
                    if (controller.signal.aborted || !canvasRef.current) return null;
                    return createHotelScene(canvasRef.current, {
                        sheetUrl: "/images/fmc-sheet-a1.webp",
                        textures,
                        quality: level,
                        still: stillCapture(), // capture mode: hold the idle turn and scraps at their first frame
                        fixed: Boolean(devPreview()), // dev preview: no automatic step-down
                        signal: controller.signal,
                        debug: new URLSearchParams(window.location.search).has("hoteldebug"), // ?hoteldebug: step timings in the console
                        // fade in only once a frame has really been drawn
                        onReady: () =>
                            requestAnimationFrame(() =>
                                requestAnimationFrame(() => {
                                    if (controller.signal.aborted) return;
                                    setReady(true);
                                    if (stillCapture()) setTimeout(() => (window.__hotelStillReady = true), 4500);
                                })
                            ),
                        // live frame check: too slow even at the lowest resolution → step down to the
                        // standard scene (fewer pixels, smaller shadows), but keep the model live
                        onSlow: () => {
                            rememberLevel("standard");
                            if (level === "full") setLevel("standard");
                        },
                        onSmooth: (atFull) => rememberLevel(level === "full" && atFull ? "full" : "standard"),
                    });
                })
                .then((handle) => {
                    if (controller.signal.aborted) {
                        handle?.dispose();
                        return;
                    }
                    if (!handle) setLevel("still");
                    else handleRef.current = handle;
                })
                .catch((error) => {
                    console.warn("Hotel model unavailable, keeping the still picture.", error);
                    if (!controller.signal.aborted) setLevel("still");
                });
        const delay = devPreview()?.delay; // "Slow phone" preview: the model arrives late, as on a slow connection
        const idleId = delay ? setTimeout(start, delay) : idle(start, { timeout: 1800 });
        return () => {
            controller.abort();
            if (delay) clearTimeout(idleId);
            else cancelIdle(idleId);
            handleRef.current?.dispose();
            handleRef.current = null;
        };
    }, [live, level, edition]);

    return (
        <>
            <div className={`hotel-scene ${ready && live ? "is-ready" : ""}`} aria-hidden="true">
                {/* the still picture shows straight away and stays underneath, so nothing ever flashes */}
                <Still theme={edition} />
                {live && (
                    // a fresh canvas per edition, so each script gets a clean WebGL context
                    <canvas key={`${edition}-${level}`} id="scene" ref={canvasRef} className="hotel-scene-canvas" />
                )}
            </div>
            {import.meta.env.DEV && !stillCapture() && <HotelPreviewSwitch level={level} />}
        </>
    );
};

// Development only (npm run dev): switch between what different devices get, to design for all of them.
const HotelPreviewSwitch = ({ level }) => {
    const current = readJSON(PREVIEW_KEY, "auto");
    const gpu = webglInfo()?.renderer.replace(/^ANGLE \(|\s*\(0x.*$|,\s*Direct3D.*$/g, "") || "no WebGL";
    const choose = (key) => {
        writeJSON(PREVIEW_KEY, key);
        window.location.reload();
    };
    return (
        <div className="hotel-preview" role="group" aria-label="3D preview, development only">
            <span className="hotel-preview-title">Preview (dev only)</span>
            <div className="hotel-preview-options">
                {PREVIEWS.map(([key, label]) => (
                    <button key={key} type="button" aria-pressed={current === key} onClick={() => choose(key)}>
                        {label}
                    </button>
                ))}
            </div>
            <span className="hotel-preview-info">
                Showing: {level} · GPU: {gpu}
            </span>
        </div>
    );
};

// View buttons and zoom for the live model (owner brief, section 3). Shown by CSS only when the
// live scene is ready. The plain mouse wheel keeps scrolling the page; Ctrl + wheel and pinch zoom.
const VIEWS = [
    ["front", "Front"],
    ["back", "Back"],
    ["cutaway", "Cutaway"],
    ["site", "Site"],
];
export const HotelControls = () => {
    const [view, setView] = useState("front");
    const go = (v) => {
        setView(v);
        hotelCommand({ view: v });
    };
    return (
        <div className="hotel-controls" role="group" aria-label="Look at the model">
            <div className="hotel-controls-views">
                {VIEWS.map(([key, label]) => (
                    <button key={key} type="button" aria-pressed={view === key} onClick={() => go(key)}>
                        {label}
                    </button>
                ))}
            </div>
            <div className="hotel-controls-zoom">
                <button type="button" aria-label="Zoom in" onClick={() => hotelCommand({ zoom: 0.15 })}>+</button>
                <button type="button" aria-label="Zoom out" onClick={() => hotelCommand({ zoom: -0.15 })}>−</button>
                <button
                    type="button"
                    aria-label="Reset the view"
                    onClick={() => {
                        setView("front");
                        hotelCommand({ reset: true });
                    }}
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                        <path d="M4 12a8 8 0 1 0 2.4-5.7M4 4v4h4" />
                    </svg>
                </button>
            </div>
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
