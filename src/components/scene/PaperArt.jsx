// PaperArt: how the paper weather and the moon are drawn (the shapes come from sky/weatherShapes.js and sky/moonArt.js).
// Every piece is a stack of cut paper sheets: a cool shade sheet, a lit sheet laid on it with a soft shadow under its
// edge, small curled highlights, and the site's own paper grain (public/textures/paper.webp) over the top, so the sky
// has the same tooth as the page. Used by Weather.jsx and PaperLayers.jsx (clouds), Sky.jsx (the moon) and Admin's
// SkyPreview. Everything here is drawn once and then only moved, so scrolling and drifting never repaint it.
import "./PaperArt.css";

/** The site's paper grain as an SVG pattern (one per SVG; the image is cached by the browser). */
export const PAPER_GRAIN_URL = "/textures/paper.webp?v=2";

/**
 * A `<pattern>` of the paper grain, for `fill="url(#id)"`.
 * @param {{ id: string, size?: number }} props  size: one tile, in the SVG's own units
 */
export const PaperGrain = ({ id, size = 256 }) => (
    <pattern id={id} patternUnits="userSpaceOnUse" width={size} height={size}>
        <image href={PAPER_GRAIN_URL} width={size} height={size} preserveAspectRatio="none" />
    </pattern>
);

/**
 * One paper cloud (a cumulus or a ceiling from weatherShapes.js) as layered sheets.
 * @param {{ c: { shade: string, lit: string, curls?: string }, tone?: string, grain?: string }} props
 *   tone: "cloud" (fair weather), "deck-back", "deck-front", "storm-back" or "storm-front"; grain: a PaperGrain id
 */
export const PaperCloud = ({ c, tone = "cloud", grain }) => (
    <g className={`pa-cloud pa-${tone}`}>
        <path className="pa-shade" d={c.shade} />
        <path className="pa-lit" d={c.lit} />
        {c.curls ? <path className="pa-curl" d={c.curls} /> : null}
        {grain ? <path className="pa-grain" d={c.shade + c.lit} fill={`url(#${grain})`} /> : null}
    </g>
);

/**
 * The paper-cut moon (sky/moonArt.js): three sheets, the seas cut out of the top one and their deepest parts out of
 * the middle one, each shadowing the one below; paper grain over it. Drawn in the moon's box (disc radius 44 at 0, 0).
 * @param {{ id: string, art: ReturnType<typeof import("./sky/moonArt").moonArt> }} props  id: unique per moon on the page
 */
export const PaperMoon = ({ id, art }) => (
    <g className="pa-moon">
        <defs>
            <mask id={`${id}-top`} maskUnits="userSpaceOnUse" x="-50" y="-50" width="100" height="100">
                <rect x="-50" y="-50" width="100" height="100" fill="white" />
                <path d={art.seas + art.craters} fill="black" />
            </mask>
            <mask id={`${id}-mid`} maskUnits="userSpaceOnUse" x="-50" y="-50" width="100" height="100">
                <rect x="-50" y="-50" width="100" height="100" fill="white" />
                <path d={art.deep} fill="black" />
            </mask>
            <clipPath id={`${id}-disc`}>
                <circle r={art.r} />
            </clipPath>
            <PaperGrain id={`${id}-grain`} size={70} />
        </defs>
        <g clipPath={`url(#${id}-disc)`}>
            <circle className="pa-moon-deep" r={art.r} />
            <g className="pa-moon-sheet">
                <circle className="pa-moon-mid" r={art.r} mask={`url(#${id}-mid)`} />
            </g>
            <g className="pa-moon-sheet">
                <circle className="pa-moon-top" r={art.r} mask={`url(#${id}-top)`} />
            </g>
            <circle className="pa-grain" r={art.r} fill={`url(#${id}-grain)`} />
        </g>
    </g>
);
