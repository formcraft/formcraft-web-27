// The site features the admin can switch on and off (Admin → Features), saved in Firestore
// `settings/site.features` and cached on the device. A feature that's off isn't shown and doesn't run.
// Never switchable (by design): the cookie notice, the skip link and other accessibility pieces,
// respecting reduced motion, the 2D drawing (it's the fallback), sign-in, Admin, page switches and this
// panel, and security (honeypots, headers, rules).
//
// To add a switch: add an entry here, then check it where the feature lives with useFeature(key)
// (src/hooks/useSite.js). The living-sky switches (sun and moon, wind, each weather scene) arrive with
// those features (docs/brief-living-sky.md).

/** localStorage key for the cached switches; index.html reads it too (the opening runs before the app). */
export const FEATURES_CACHE = "fc-site-features";

/**
 * Every switch: key, group, label, help, default and (optionally) the key it depends on.
 * @type {{ key: string, group: string, label: string, help: string, on: boolean, needs?: string, note?: string }[]}
 */
export const FEATURES = [
    {
        key: "intro",
        group: "Site",
        label: "Opening animation",
        help: "The drawing sheet with the FC stamp that tears off on a visitor's first visit.",
        on: true,
        note: "It runs before the rest of the site loads, so a change reaches each visitor from their second visit.",
    },
    { key: "subscribePrompt", group: "Site", label: "Email sign-up prompt", help: "The small slip that offers email updates on long pages. The footer sign-up stays.", on: true },
    { key: "plantTree", group: "Site", label: "Plant-a-tree button", help: "The round orange button in the bottom-right corner of every page. The /donate page stays.", on: true },
    { key: "home3d", group: "Home", label: "3D hotel model", help: "The paper model that builds itself on Home. Off: every visitor sees the 2D drawing instead.", on: true },
    { key: "scraps", group: "Home", label: "Falling paper scraps", help: "The small pieces of paper drifting through the 3D model.", on: true, needs: "home3d" },
];

/** The groups in Admin → Features, in order. */
export const FEATURE_GROUPS = ["Site", "Home"];

/** Saved switches over the defaults: { key: true|false } for every feature (unknown saved keys are dropped). */
export const mergeFeatures = (saved) => Object.fromEntries(FEATURES.map((f) => [f.key, typeof saved?.[f.key] === "boolean" ? saved[f.key] : f.on]));
