// Photo: a render or photo "printed on paper", used across the pages.
// - Loads a WebP image with a smaller 800 px version for phones (the browser picks the right one).
// - Lazy-loads unless it's near the top of the page (`eager`), so phones download less.
// - `name` is either a file in public/images (without "-800"/".webp"), or a full URL / path for photos
//   uploaded from the admin page. (To turn an images[] entry into a name, use imgName from src/lib/images.js.)
// - With no image yet it shows a neat "Photo coming soon" box; the description stays for screen readers.
import { Fact } from "../ui/Todo";

const isUrl = (name) => /^(https?:|\/|blob:)/.test(name);

/** "[Photo: a training session]" → "A training session" (descriptions written as placeholders). */
const plainDescription = (alt) => {
    const text = String(alt ?? "").replace(/^\[|\]$/g, "").replace(/^(photo|render)\s*:\s*/i, "").trim();
    return text ? text[0].toUpperCase() + text.slice(1) : "";
};

/**
 * @param {object} props
 * @param {string} [props.name]      image file name in public/images, or a full URL; leave out when there's no image yet
 * @param {string} props.alt         what the image shows, for people who can't see it
 * @param {string} [props.caption]   bold caption under the image
 * @param {string} [props.note]      lighter note after the caption (a "TODO" note is shown to the team only)
 * @param {string} [props.ratio="4 / 3"]  width / height of the frame
 * @param {boolean} [props.eager=false]   load straight away (only for images near the top of the page)
 * @param {string} [props.className]
 * @param {string} [props.sizes]     how wide the image shows on screen, so the browser picks the right file
 */
export const Photo = ({ name, alt, caption, note, ratio = "4 / 3", eager = false, className = "", sizes = "(max-width: 700px) 100vw, 50vw" }) => (
    <figure className={`photo ${className}`.trim()} style={{ "--ar": ratio }}>
        {name ? (
            <img
                src={isUrl(name) ? name : `/images/${name}.webp`}
                srcSet={isUrl(name) ? undefined : `/images/${name}-800.webp 800w, /images/${name}.webp 1600w`}
                sizes={sizes}
                alt={alt}
                loading={eager ? "eager" : "lazy"}
                decoding="async"
                fetchPriority={eager ? "high" : undefined}
            />
        ) : (
            <div className="placeholder" role="img" aria-label={plainDescription(alt) || "Photo coming soon"}>
                Photo coming soon
            </div>
        )}
        {(caption || note) && (
            <figcaption>
                {caption && <b>{caption}</b>}
                {note && <Fact as="span" text={note} />}
            </figcaption>
        )}
    </figure>
);
