// The official Formcraft logos (SVG files in public/logos, from the Brand Guide; never redraw them).
// Navy on day paper, white on night paper and on dark sheets. Each division has its own lockup.
// In "auto" tone both versions are in the page and CSS shows the right one (.only-day/.only-night),
// so switching edition never waits for an image to load.
const FILES = {
    formcraft: { day: "/logos/formcraft-navy.svg", night: "/logos/formcraft-white.svg", label: "Formcraft", ratio: 157.61 / 34.24 },
    studio: { day: "/logos/studio-navy.svg", night: "/logos/studio-white.svg", label: "Formcraft Studio", ratio: 130.11 / 29.36 },
    construction: { day: "/logos/construction-navy.svg", night: "/logos/construction-white.svg", label: "Formcraft Construction", ratio: 151.24 / 29.36 },
    concrete: { day: "/logos/concrete-navy.svg", night: "/logos/concrete-white.svg", label: "Formcraft Concrete", ratio: 129.98 / 29.36 },
    stores: { day: "/logos/stores-navy.svg", night: "/logos/stores-white.svg", label: "Formcraft Stores", ratio: 130.12 / 29.36 },
};

/**
 * @param {object} props
 * @param {"formcraft"|"studio"|"construction"|"concrete"|"stores"} [props.brand="formcraft"]
 * @param {number} [props.height=30]      height in px (the width follows the logo's proportions)
 * @param {"auto"|"light"|"dark"} [props.tone="auto"]  auto follows the edition; light = always white; dark = always navy
 * @param {string} [props.className]
 * @param {boolean} [props.decorative=false]  true when a link around it already says "Formcraft home"
 */
export const Logo = ({ brand = "formcraft", height = 30, tone = "auto", className = "", decorative = false }) => {
    const file = FILES[brand];
    const width = Math.round(height * file.ratio);
    const alt = decorative ? "" : file.label;
    const img = (src, extra) => (
        <img src={src} alt={alt} width={width} height={height} className={`${className} ${extra}`.trim()} decoding="async" />
    );
    if (tone === "light") return img(file.night, "");
    if (tone === "dark") return img(file.day, "");
    return (
        <>
            {img(file.day, "only-day")}
            {img(file.night, "only-night")}
        </>
    );
};

/** The orange FC mark on its own (decorative). @param {{ size?: number, className?: string }} props */
export const LogoMark = ({ size = 26, className = "" }) => (
    <img src="/logos/fc-mark-orange.svg" alt="" width={Math.round(size * 1.43)} height={size} className={className} />
);
