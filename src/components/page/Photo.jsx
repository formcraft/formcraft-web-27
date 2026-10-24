// A render printed on paper: WebP with a smaller version for phones, lazy unless it's above the fold.
// `name` is either a file in public/images (without "-800"/".webp"), or a full URL / path for photos
// uploaded from the admin page.
const isUrl = (name) => /^(https?:|\/|blob:)/.test(name);

export const imageName = (img) => (typeof img === "string" ? img : img?.name ?? img?.url ?? null);

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
            <div className="placeholder">{alt}</div>
        )}
        {(caption || note) && (
            <figcaption>
                {caption && <b>{caption}</b>}
                {note && <span>{note}</span>}
            </figcaption>
        )}
    </figure>
);
