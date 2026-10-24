// useTheme(): the day or night edition of the site. See src/context/ThemeContext.jsx.
import { useContext } from "react";
import { ThemeContext } from "../context/contexts";

/** @returns {{ theme: "day"|"night" }} and the functions ThemeContext offers to change it. */
export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) throw new Error("useTheme must be used inside <ThemeProvider>");
    return context;
};
