// useSite(): the site settings the admin controls (which pages are on, contact details, motion speed).
// See src/context/SiteContext.jsx.
import { useContext } from "react";
import { SiteContext } from "../context/contexts";
import { pageForPath } from "../data/pages";
import { FEATURES } from "../data/features";

// Site settings: { visibility, isOn(key), canSee(key), isAdmin, setPage(key, on), details, setDetails(partial),
// motion, setMotion(partial), features, setFeature(key, on), sky, setSky(settings) }
export const useSite = () => useContext(SiteContext);

/**
 * Whether a feature is switched on in Admin → Features (src/data/features.js). A feature that needs
 * another one (e.g. paper scraps need the 3D model) is off when its parent is off.
 * @param {string} key  e.g. "plantTree"
 * @returns {boolean}
 */
export const useFeature = (key) => {
    const features = useSite()?.features;
    if (!features) return true;
    const entry = FEATURES.find((f) => f.key === key);
    return features[key] !== false && (!entry?.needs || features[entry.needs] !== false);
};

// (to) => whether a link to that address should show: outside links and unknown paths always do;
// links to hidden pages don't (admins still see them).
export const useShowLink = () => {
    const site = useSite();
    return (to) => {
        const page = pageForPath(to);
        return !page || !site || site.canSee(page.key);
    };
};
