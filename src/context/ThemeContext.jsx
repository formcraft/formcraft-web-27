import { useCallback, useEffect, useMemo, useState } from "react";
import { ThemeContext } from "./contexts";
import { isKampalaDay } from "../lib/skyClock";

// Day and night paper editions. index.html sets data-theme before first paint so there's no flash;
// this context keeps React in step with it. The visitor's choice is remembered; until they choose,
// the edition follows Kampala's clock (day 06:45–18:55 EAT), switching on its own at dusk and dawn.
const KEY = "fc-theme";

const readSaved = () => {
    try {
        const value = localStorage.getItem(KEY);
        return value === "day" || value === "night" ? value : null;
    } catch {
        return null;
    }
};

const clockTheme = () => (isKampalaDay() ? "day" : "night");

/**
 * Wraps the app (App.jsx) and provides the edition: "day" or "night". It follows Kampala's clock until the
 * visitor uses the header switch; their choice is saved on the device. Read it with useTheme().
 */
export const ThemeProvider = ({ children }) => {
    const [saved, setSaved] = useState(readSaved);
    const [clock, setClock] = useState(clockTheme);
    const theme = saved ?? clock;

    useEffect(() => {
        const id = setInterval(() => setClock(clockTheme()), 60 * 1000);
        return () => clearInterval(id);
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

