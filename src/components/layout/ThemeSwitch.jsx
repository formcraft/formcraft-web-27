import { useTheme } from "../../hooks/useTheme";
import { Icon } from "../ui/Icon";

// The day/night switch in the header: a sun or moon button that swaps the site's edition.
// The choice is saved on the device (ThemeContext), so the next visit starts in the same edition.
// Styles live in Header.css (.header-mode).

/** @param {{ className?: string }} props */
export const ThemeSwitch = ({ className = "" }) => {
    const { theme, toggle } = useTheme();
    const next = theme === "night" ? "day" : "night";
    return (
        <button
            type="button"
            className={`icon-btn header-mode ${className}`}
            onClick={toggle}
            aria-label={`Switch to the ${next} edition`}
            title={`${next === "night" ? "Night" : "Day"} edition`}
        >
            <Icon name={theme === "night" ? "sun" : "moon"} size={19} />
        </button>
    );
};
