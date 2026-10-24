// Animation timing the team can tune in Admin → Motion (Firestore `settings/site.motion`).
// Each value is a time scale: 1 = the default, 1.5 = half as fast again, 0.5 = twice as fast.
// The opening animation runs before the app loads, so index.html reads the cached copy
// (localStorage "fc-site-motion"); a visitor's very first visit uses the defaults below.
export const MOTION_CACHE = "fc-site-motion";
export const MOTION_MIN = 0.5;
export const MOTION_MAX = 3;

export const MOTION_FIELDS = [
    { key: "intro", label: "Opening animation", help: "The drawing sheet, the logo stamp, the tagline and the logo gliding to the header.", base: 2.6 },
    { key: "tear", label: "Tearing the sheet off", help: "How long the rip takes to run across the page before the sheet falls away.", base: 1.9 },
    { key: "build", label: "Home model building itself", help: "The paper backdrop rising, then the hotel going up floor by floor and the trees growing (3D and 2D).", base: 6 },
    { key: "reveal", label: "Text and sections appearing", help: "Headlines, paragraphs and cards fading up as you scroll, on every page.", base: 0.9 },
];

export const MOTION_DEFAULTS = Object.fromEntries(MOTION_FIELDS.map((f) => [f.key, 1]));

export const clampMotion = (v) => {
    const n = Number(v);
    if (!Number.isFinite(n)) return 1;
    return Math.round(Math.min(MOTION_MAX, Math.max(MOTION_MIN, n)) * 100) / 100;
};

export const mergeMotion = (saved) => {
    const out = { ...MOTION_DEFAULTS };
    if (saved) Object.keys(out).forEach((k) => k in saved && (out[k] = clampMotion(saved[k])));
    return out;
};

// CSS custom properties on <html>, used by base.css (reveal) and Hotel2D (build)
export const applyMotion = (motion) => {
    const root = document.documentElement.style;
    root.setProperty("--fc-motion", String(motion.reveal));
    root.setProperty("--fc-motion-build", String(motion.build));
};
