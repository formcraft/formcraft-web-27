import { useTheme } from "../../hooks/useTheme";
import { Icon } from "../ui/Icon";

// The day/night switch in the header: a sun or moon button that swaps the site's edition.
// The choice is saved on the device (ThemeContext), so the next visit starts in the same edition.
// Styles live in Header.css (.header-mode).

/** @param {{ className?: string }} props */
export const ThemeSwitch = ({ className = "" }) => {
    const { toggle } = useTheme();
    // The same markup in both editions (pre-rendered pages must match): both icons are drawn and Header.css
    // shows the one for the other edition; the label names both.
    return (
        <button type="button" className={`icon-btn header-mode ${className}`} onClick={toggle} aria-label="Switch between the day and night editions" title="Day or night edition">
            <Icon name="moon" size={19} className="header-mode-to-night" />
            <Icon name="sun" size={19} className="header-mode-to-day" />
        </button>
    );
};
