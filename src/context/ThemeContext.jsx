import { useCallback, useEffect, useMemo, useState } from "react";
import { ThemeContext } from "./contexts";

// Day and night paper editions. index.html sets data-theme before first paint so there's no flash;
// this context keeps React in step with it. The visitor's choice is remembered; until they choose,
// the site follows their system setting.
const KEY = "fc-theme";

const readSaved = () => {
    try {
        const value = localStorage.getItem(KEY);
        return value === "day" || value === "night" ? value : null;
    } catch {
        return null;
    }
};

const systemTheme = () =>
    typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "night" : "day";

export const ThemeProvider = ({ children }) => {
    const [saved, setSaved] = useState(readSaved);
    const [system, setSystem] = useState(systemTheme);
    const theme = saved ?? system;

    useEffect(() => {
        const media = window.matchMedia?.("(prefers-color-scheme: dark)");
        if (!media) return undefined;
        const onChange = (event) => setSystem(event.matches ? "night" : "day");
        media.addEventListener("change", onChange);
        return () => media.removeEventListener("change", onChange);
    }, []);

    useEffect(() => {
        const root = document.documentElement;
        root.dataset.theme = theme;
        const meta = document.querySelector('meta[name="theme-color"]');
        if (meta) meta.setAttribute("content", getComputedStyle(root).getPropertyValue("--ground").trim() || meta.content);
    }, [theme]);

    const toggle = useCallback(() => {
        const next = theme === "night" ? "day" : "night";
        setSaved(next);
        try {
            localStorage.setItem(KEY, next);
        } catch {
            // storage blocked: the choice lasts for this visit only
        }
    }, [theme]);

    const value = useMemo(() => ({ theme, toggle }), [theme, toggle]);
    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

