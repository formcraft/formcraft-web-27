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
        <button type="button" className={`icon-btn header-mode ${className}`} onClick={toggle} title="Day or night edition">
            <Icon name="moon" size={19} className="header-mode-to-night" />
            <Icon name="sun" size={19} className="header-mode-to-day" />
            {/* the button's name: Header.css hides the one that doesn't apply (display: none, so it isn't read out) */}
            <span className="sr-only header-mode-to-night">Switch to the night edition</span>
            <span className="sr-only header-mode-to-day">Switch to the day edition</span>
        </button>
    );
};
