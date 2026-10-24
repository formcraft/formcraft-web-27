// The site's icons: simple line drawings on a 24 × 24 grid, drawn in code (no image files to download).
// They take the text colour around them (currentColor), so they work in day and night.
// Decorative by default (screen readers skip them); pass `label` when the icon is the only thing
// saying what a button does (better still: put aria-label on the button itself).
// To add an icon: add an entry to PATHS with SVG shapes on the 24 × 24 grid.
const PATHS = {
    arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
    arrowLeft: <path d="M19 12H5M11 6l-6 6 6 6" />,
    sun: (
        <>
            <circle cx="12" cy="12" r="4.2" />
            <path d="M12 2.5v2.2M12 19.3v2.2M4.6 4.6l1.6 1.6M17.8 17.8l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.6 19.4l1.6-1.6M17.8 6.2l1.6-1.6" />
        </>
    ),
    moon: <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z" />,
    user: (
        <>
            <circle cx="12" cy="8" r="4" />
            <path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" />
        </>
    ),
    menu: <path d="M4 7h16M4 12h16M4 17h16" />,
    close: <path d="M6 6l12 12M18 6 6 18" />,
    leaf: (
        <>
            <path d="M12 22V12" />
            <path d="M12 12C12 7 15 3 20 3c0 5-3 9-8 9Z" />
            <path d="M12 15C12 11 9.5 8 5 8c0 4 2.5 7 7 7Z" />
        </>
    ),
    cart: (
        <>
            <path d="M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.5L21 8H6.2" />
            <circle cx="10" cy="20.5" r="1.3" />
            <circle cx="17" cy="20.5" r="1.3" />
        </>
    ),
    check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
    plus: <path d="M12 5v14M5 12h14" />,
    minus: <path d="M5 12h14" />,
    phone: <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z" />,
    mail: (
        <>
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <path d="m3 7 9 6 9-6" />
        </>
    ),
    chat: <path d="M4 20l1.4-4A8 8 0 1 1 8 18.6L4 20Z" />,
    pin: (
        <>
            <path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21Z" />
            <circle cx="12" cy="9.5" r="2.5" />
        </>
    ),
    north: (
        <>
            <circle cx="12" cy="12" r="9" />
            <path d="M12 5l3.2 10L12 13l-3.2 2L12 5Z" fill="currentColor" />
        </>
    ),
    layers: (
        <>
            <path d="m12 3 9 5-9 5-9-5 9-5Z" />
            <path d="m3 13 9 5 9-5" />
        </>
    ),
    cube: (
        <>
            <path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" />
            <path d="M12 12 4 7.5M12 12l8-4.5M12 12v9" />
        </>
    ),
    ruler: (
        <>
            <path d="M3 17 17 3l4 4L7 21l-4-4Z" />
            <path d="m7 13 2 2M10 10l2 2M13 7l2 2" />
        </>
    ),
    hammer: (
        <>
            <path d="M14 6 4 16l4 4L18 10" />
            <path d="m13 3 8 8-3 3-8-8 3-3Z" />
        </>
    ),
    file: (
        <>
            <path d="M14 3H6v18h12V7l-4-4Z" />
            <path d="M14 3v4h4" />
        </>
    ),
    trash: <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" />,
};

/**
 * @param {object} props
 * @param {keyof typeof PATHS} props.name  which icon, e.g. "cart", "leaf", "close"
 * @param {number} [props.size=20]          width and height in px
 * @param {number} [props.strokeWidth=2]    line thickness
 * @param {string} [props.label]            text for screen readers; leave out for decorative icons
 * @param {string} [props.className]
 */
export const Icon = ({ name, size = 20, strokeWidth = 2, label, className }) => (
    <svg
        className={className}
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        role={label ? "img" : undefined}
        aria-label={label}
        aria-hidden={label ? undefined : true}
        focusable="false"
    >
        {PATHS[name]}
    </svg>
);
