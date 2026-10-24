// Official logo SVGs from public/logos. Navy on day paper, white on night paper (and on dark sheets).
const FILES = {
    formcraft: { day: "/logos/formcraft-navy.svg", night: "/logos/formcraft-white.svg", label: "Formcraft", ratio: 157.61 / 34.24 },
    studio: { day: "/logos/studio-navy.svg", night: "/logos/studio-white.svg", label: "Formcraft Studio", ratio: 130.11 / 29.36 },
    construction: { day: "/logos/construction-navy.svg", night: "/logos/construction-white.svg", label: "Formcraft Construction", ratio: 151.24 / 29.36 },
    concrete: { day: "/logos/concrete-navy.svg", night: "/logos/concrete-white.svg", label: "Formcraft Concrete", ratio: 129.98 / 29.36 },
    stores: { day: "/logos/stores-navy.svg", night: "/logos/stores-white.svg", label: "Formcraft Stores", ratio: 130.12 / 29.36 },
};

// tone: "auto" follows the edition, "light" always white (dark sheets), "dark" always navy
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

export const LogoMark = ({ size = 26, className = "" }) => (
    <img src="/logos/fc-mark-orange.svg" alt="" width={Math.round(size * 1.43)} height={size} className={className} />
);
