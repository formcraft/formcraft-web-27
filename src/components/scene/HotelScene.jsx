import { useEffect, useRef, useState } from "react";
import { useTheme } from "../../hooks/useTheme";
import { useFeature, useSite } from "../../hooks/useSite";
import { readJSON, writeJSON } from "../../lib/storage";
import { Hotel2D } from "./Hotel2D";
import "./HotelScene.css";

// How the home page shows the hotel (owner, 2026-10-24): the paper background shows first, then the 3D
// model builds itself on top (hotel/build.js). Most devices get the 3D; only the slowest get the 2D
// paper-cut drawing (Hotel2D).
// - "full":     3D at the screen's sharpness (up to 2×), large shadow maps
// - "standard": 3D up to 1.5×, smaller shadow maps and fewer floating scraps (mid-range and older phones, 3G,
//               reduced motion — the model is then held still and not animated)
// - "2d":       the 2D drawing: no WebGL2, software graphics, the oldest phone GPUs, ≤ 1 GB memory, 2G, or
//               the live frame check found frames under ~20 fps even at 1× pixels
// The frame check first steps the pixel ratio down (never below 1×) and remembers "standard"; the result
// is kept on the device for 30 days.
const LEVEL_KEY = "fc-hotel-level"; // renamed 2026-10-24 so results stored by the stricter earlier rule are forgotten
const MONTH = 30 * 24 * 3600 * 1000;

const webglInfo = () => {
    try {
        const c = document.createElement("canvas");
        const gl = c.getContext("webgl2") || c.getContext("webgl");
        if (!gl) return null;
        const ext = gl.getExtension("WEBGL_debug_renderer_info");
        const info = { renderer: ext ? String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)) : "", webgl2: typeof WebGL2RenderingContext !== "undefined" && gl instanceof WebGL2RenderingContext };
        gl.getExtension("WEBGL_lose_context")?.loseContext();
        return info;
    } catch {
        return null;
    }
};

const smallScreen = () => Math.min(window.innerWidth, window.innerHeight) < 700;

// Development only (npm run dev): preview the hotel as different devices get it, so the owner can design
// for all of them (from the local side's try/auto-live branch). Stored in this browser; never read in
// production builds. A preview sets env.fixed, so the frame check never switches it.
const PREVIEW_KEY = "fc-3d-preview";
const PREVIEWS = [
    ["auto", "Auto", null],
    ["ultra", "Ultra (this PC)", { level: "ultra" }],
    ["best", "Best (desktops)", { level: "full" }],
    ["phone", "Mid-range phone", { level: "standard" }],
    ["slow", "Slow connection", { level: "standard", delay: 6000 }],
    ["flat", "2D drawing", { level: "2d" }],
];
const devPreview = () => (import.meta.env.DEV ? PREVIEWS.find(([key]) => key === readJSON(PREVIEW_KEY, "auto"))?.[2] ?? null : null);

const guessLevel = () => {
    if (typeof window === "undefined") return "2d";
    const gl = webglInfo();
    if (!gl) return "2d";
    const preview = devPreview();
    if (preview) return preview.level;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return "standard"; // held still, no build
    const saved = readJSON(LEVEL_KEY, null);
    // results stored by earlier versions ("lite", "still") are ignored: guess again
    if (saved?.level && Date.now() - (saved.at ?? 0) < MONTH && ["full", "standard", "2d"].includes(saved.level)) return saved.level;
    const conn = navigator.connection;
    const mem = navigator.deviceMemory;
    const cores = navigator.hardwareConcurrency;
    if (/(^|-)2g$/.test(conn?.effectiveType ?? "")) return "2d";
    if (mem !== undefined && mem <= 1) return "2d";
    if (!gl.webgl2) return "2d";
    if (/swiftshader|llvmpipe|software/i.test(gl.renderer)) return "2d";
    if (/mali-4\d\d|adreno \(tm\) 3\d\d|powervr sgx|videocore/i.test(gl.renderer)) return "2d"; // the oldest phone GPUs only
    if (/mali-t|adreno \(tm\) [45]\d\d/i.test(gl.renderer)) return "standard";
    if (conn?.saveData || conn?.effectiveType === "3g") return "standard"; // the model may arrive later, never instead
    if (mem !== undefined && mem <= 4) return "standard";
    if (smallScreen() && cores !== undefined && cores < 6) return "standard";
    return "full";
};

const rememberLevel = (level) => writeJSON(LEVEL_KEY, { level, at: Date.now() });

// The opening animation (index.html) runs on the main thread too: building the scene while it plays
// stalled its timers (night first visits took 9–11 s). Start only once it has gone, or after 8 s.
const introDone = () =>
    new Promise((resolve) => {
        const root = document.documentElement;
        if (!root.classList.contains("fci-run")) return resolve();
        const done = () => {
            observer.disconnect();
            clearTimeout(timer);
            resolve();
        };
        const observer = new MutationObserver(() => !root.classList.contains("fci-run") && done());
        observer.observe(root, { attributes: true, attributeFilter: ["class"] });
        const timer = setTimeout(done, 8000);
    });

const loaders = {
    day: () => import("./hotel/hotelDay"),
    night: () => import("./hotel/hotelNight"),
};

// Baked paper textures (see the scripts' imageTex): phones 512 px paper, desktops 1024 px; the
// bump map is 512 px everywhere.
const loadImage = (src) =>
    new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
        img.src = src;
    });
// Bump TEX_V whenever scripts/make-hotel-textures.py writes new files, so browsers fetch them again.
const TEX_V = 5;
const loadTextures = () =>
    Promise.all([
        loadImage(`/textures/${smallScreen() ? "hotel-paper-512" : "hotel-paper"}.webp?v=${TEX_V}`),
        loadImage(`/textures/hotel-normal-512.webp?v=${TEX_V}`),
    ]).then(([paper, normal]) => ({ paper, normal }));

// Views and zoom, from the buttons in the hero (HotelControls)
const hotelCommand = (detail) => window.dispatchEvent(new CustomEvent("fc:hotel", { detail }));

// A fixed layer behind the whole page. Sections marked data-cam="hero|chain|plan|work|dusk" steer
// the 3D camera as the visitor scrolls; the hero, the plan band and the closing band are
// see-through windows onto it. Each edition has its own 3D script, loaded on demand.
export const HotelScene = () => {
    const { theme } = useTheme();
    const { motion } = useSite();
    const edition = theme === "night" ? "night" : "day";
    // Admin → Features "3D hotel model" off: everyone gets the 2D drawing (the dev preview still wins)
    const model3d = useFeature("home3d") || Boolean(devPreview());
    const scraps = useFeature("scraps");
    const [guessed, setLevel] = useState(guessLevel);
    const level = model3d ? guessed : "2d";
    const [ready, setReady] = useState(false);
    const [switched, setSwitched] = useState(false); // 3D handed over to 2D mid-visit: no second build
    const canvasRef = useRef(null);
    const handleRef = useRef(null);
    const live = level === "ultra" || level === "full" || level === "standard";

    useEffect(() => {
        const root = document.documentElement;
        root.dataset.hotel = live ? "live" : "2d";
        const onCommand = (e) => {
            const h = handleRef.current;
            if (!h) return;
            const { view, zoom, reset } = e.detail ?? {};
            if (view) h.setView?.(view);
            if (zoom) h.zoomBy?.(zoom);
            if (reset) h.resetView?.();
        };
        window.addEventListener("fc:hotel", onCommand);
        return () => {
            window.removeEventListener("fc:hotel", onCommand);
            delete root.dataset.hotel;
        };
    }, [live]);

    useEffect(() => {
        document.documentElement.toggleAttribute("data-hotel-ready", ready && live);
    }, [ready, live]);

    useEffect(() => {
        if (!live) return undefined;
        const controller = new AbortController();
        setReady(false);
        const toFlat = () => {
            if (controller.signal.aborted) return;
            setSwitched(true);
            setLevel("2d");
        };
        // wait until the page has painted and the browser is idle, so text and buttons come first
        const idle = window.requestIdleCallback ?? ((fn) => setTimeout(fn, 600));
        const cancelIdle = window.cancelIdleCallback ?? clearTimeout;
        const start = () =>
            // ultra draws its own uncompressed paper in code; the others use the baked WebP textures
            Promise.all([loaders[edition](), level === "ultra" ? Promise.resolve({}) : loadTextures(), introDone()])
                .then(([{ createHotelScene }, textures]) => {
                    if (controller.signal.aborted || !canvasRef.current) return null;
                    return createHotelScene(canvasRef.current, {
                        sheetUrl: "/images/fmc-sheet-a1.webp",
                        textures,
                        quality: level,
                        scraps, // Admin → Features "Falling paper scraps"
                        buildScale: motion.build, // Admin → Motion
                        fixed: Boolean(devPreview()), // dev preview: shows exactly the chosen level
                        signal: controller.signal,
                        debug: new URLSearchParams(window.location.search).has("hoteldebug"), // ?hoteldebug: step timings in the console
                        // called by the script once its first frames (shadows included) are on screen
                        onReady: () => requestAnimationFrame(() => !controller.signal.aborted && setReady(true)),
                        // live frame check: frames keep running slow at full sharpness → the 2D drawing
                        onStepDown: () => rememberLevel("standard"),
                        onSlow: () => {
                            rememberLevel("2d");
                            toFlat();
                        },
                        onSmooth: () => rememberLevel(level),
                    });
                })
                .then((handle) => {
                    if (controller.signal.aborted) {
                        handle?.dispose();
                        return;
                    }
                    if (!handle) toFlat();
                    else handleRef.current = handle;
                })
                .catch((error) => {
                    console.warn("3D model unavailable, showing the drawing.", error);
                    toFlat();
                });
        const delay = devPreview()?.delay; // "Slow connection" preview: the model arrives late
        const idleId = delay ? setTimeout(start, delay) : idle(start, { timeout: 1800 });
        return () => {
            controller.abort();
            if (delay) clearTimeout(idleId);
            else cancelIdle(idleId);
            handleRef.current?.dispose();
            handleRef.current = null;
        };
    }, [live, level, edition, motion.build, scraps]); // a new build time replays the build (handy while tuning it in Admin)

    return (
        <>
            <div className={`hotel-scene ${ready && live ? "is-ready" : ""}`} aria-hidden="true">
                {/* the paper background is the layer itself (--hotel-bg + grain); the model builds on it */}
                {!live && <Hotel2D edition={edition} animate={!switched} />}
                {live && (
                    // a fresh canvas per edition, so each script gets a clean WebGL context
                    <canvas key={`${edition}-${level}`} id="scene" ref={canvasRef} className="hotel-scene-canvas" />
                )}
                <div className="hotel-scene-grain" />
            </div>
            {import.meta.env.DEV && <HotelPreviewSwitch level={level} />}
        </>
    );
};

// Development only (`npm run dev`, never in the live site): a small floating panel to switch between
// what different devices get. Choosing an option reloads the page.
// - It starts in the bottom-right corner, just above the plant-a-tree button.
// - Drag its title bar (mouse or finger) to move it anywhere; the spot is remembered.
//   Double-click the title to put it back in the corner.
// - A plain click on the title folds it down to a small tab (also remembered).
const PREVIEW_OPEN_KEY = "fc-3d-preview-open";
const PREVIEW_SPOT_KEY = "fc-3d-preview-spot";
const DRAG_THRESHOLD = 4; // px the pointer must move before a press counts as a drag, not a click

/** Keeps a panel of size w × h fully on screen, with an 8 px margin. */
const keepOnScreen = ({ x, y }, w, h) => ({
    x: Math.min(Math.max(8, x), Math.max(8, window.innerWidth - w - 8)),
    y: Math.min(Math.max(8, y), Math.max(8, window.innerHeight - h - 8)),
});

const HotelPreviewSwitch = ({ level }) => {
    const current = readJSON(PREVIEW_KEY, "auto");
    const gpu = webglInfo()?.renderer.replace(/^ANGLE \(|\s*\(0x.*$|,\s*Direct3D.*$/g, "") || "no WebGL";
    const panelRef = useRef(null);
    const drag = useRef(null); // { startX, startY, fromX, fromY, moved } while the pointer is down
    // null = the default corner (CSS); otherwise { x, y } = the panel's top-left corner on screen
    const [spot, setSpot] = useState(() => readJSON(PREVIEW_SPOT_KEY, null));

    // Remember where the panel is (null = the default corner).
    useEffect(() => writeJSON(PREVIEW_SPOT_KEY, spot), [spot]);

    // If the window gets smaller, pull the panel back on screen.
    useEffect(() => {
        if (!spot) return undefined;
        const onResize = () => {
            const r = panelRef.current?.getBoundingClientRect();
            if (r) setSpot((s) => (s ? keepOnScreen(s, r.width, r.height) : s));
        };
        window.addEventListener("resize", onResize);
        return () => window.removeEventListener("resize", onResize);
    }, [spot]);

    const choose = (key) => {
        writeJSON(PREVIEW_KEY, key);
        window.location.reload();
    };
    const onPointerDown = (e) => {
        if (e.button !== 0) return;
        const r = panelRef.current.getBoundingClientRect();
        drag.current = { startX: e.clientX, startY: e.clientY, fromX: r.left, fromY: r.top, moved: false };
        e.currentTarget.setPointerCapture(e.pointerId);
    };
    const onPointerMove = (e) => {
        const d = drag.current;
        if (!d) return;
        const dx = e.clientX - d.startX, dy = e.clientY - d.startY;
        if (!d.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
        d.moved = true;
        const r = panelRef.current.getBoundingClientRect();
        setSpot(keepOnScreen({ x: d.fromX + dx, y: d.fromY + dy }, r.width, r.height));
    };
    // A click that ended a drag mustn't also fold the panel.
    const onClick = (e) => {
        if (drag.current?.moved) e.preventDefault();
        drag.current = null;
    };
    const onDoubleClick = (e) => {
        e.preventDefault();
        setSpot(null);
    };

    return (
        <details
            ref={panelRef}
            className={`hotel-preview ${spot ? "is-moved" : ""}`}
            style={spot ? { left: spot.x, top: spot.y } : undefined}
            open={readJSON(PREVIEW_OPEN_KEY, true)}
            onToggle={(e) => writeJSON(PREVIEW_OPEN_KEY, e.currentTarget.open)}
            aria-label="3D preview, development only"
        >
            <summary
                className="hotel-preview-title"
                title="Drag to move · click to fold · double-click to put back in the corner"
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onClick={onClick}
                onDoubleClick={onDoubleClick}
            >
                <span aria-hidden="true">⠿ </span>3D preview (dev only)
            </summary>
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
        </details>
    );
};

// View buttons and zoom for the live model: a slim vertical rail on the left of the hero
// (owner, 2026-10-24). Shown by CSS only once the 3D model is ready. The plain mouse wheel keeps
// scrolling the page; Ctrl + wheel and pinch zoom.
const VIEW_ICONS = {
    front: <path d="M5 8l7-4 7 4v9l-7 4-7-4zM5 8l7 4 7-4M12 12v9" />,
    back: <path d="M5 8l7-4 7 4v9l-7 4-7-4zM12 4v9M5 17l7-4 7 4" />,
    cutaway: <path d="M5 8l7-4 7 4v9l-7 4-7-4zM12 12l7-4M12 12v9M5 8l4 2.3v4L5 12" />,
    site: <path d="M4 6h16v12H4zM8 10h4v4H8zM15 9v6M4 14h3" />,
};
const VIEWS = [
    ["front", "Front view"],
    ["back", "Back view"],
    ["cutaway", "Cutaway view"],
    ["site", "Site plan view"],
];
const RailIcon = ({ children }) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {children}
    </svg>
);
/** The slim rail of view buttons for the 3D model (Front, Back, Cutaway, Site, zoom in/out, reset), shown once the model is ready. */
export const HotelControls = () => {
    const [view, setView] = useState("front");
    const go = (v) => {
        setView(v);
        hotelCommand({ view: v });
    };
    return (
        <div className="hotel-controls" role="group" aria-label="Look at the model">
            {VIEWS.map(([key, label]) => (
                <button key={key} type="button" aria-pressed={view === key} aria-label={label} data-tip={label} onClick={() => go(key)}>
                    <RailIcon>{VIEW_ICONS[key]}</RailIcon>
                </button>
            ))}
            <span className="hotel-controls-rule" aria-hidden="true" />
            <button type="button" aria-label="Zoom in" data-tip="Zoom in" onClick={() => hotelCommand({ zoom: 0.15 })}>
                <RailIcon><path d="M12 6v12M6 12h12" /></RailIcon>
            </button>
            <button type="button" aria-label="Zoom out" data-tip="Zoom out" onClick={() => hotelCommand({ zoom: -0.15 })}>
                <RailIcon><path d="M6 12h12" /></RailIcon>
            </button>
            <button
                type="button"
                aria-label="Reset the view"
                data-tip="Reset"
                onClick={() => {
                    setView("front");
                    hotelCommand({ reset: true });
                }}
            >
                <RailIcon><path d="M4 12a8 8 0 1 0 2.4-5.7M4 4v4h4" /></RailIcon>
            </button>
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
