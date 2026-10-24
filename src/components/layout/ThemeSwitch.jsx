import { useTheme } from "../../hooks/useTheme";
import { Icon } from "../ui/Icon";

// Day / night edition switch (styles in Header.css)
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
