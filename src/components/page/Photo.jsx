// A render printed on paper: WebP with a smaller version for phones, lazy unless it's above the fold.
export const Photo = ({ name, alt, caption, note, ratio = "4 / 3", eager = false, className = "", sizes = "(max-width: 700px) 100vw, 50vw" }) => (
    <figure className={`photo ${className}`.trim()} style={{ "--ar": ratio }}>
        {name ? (
            <img
                src={`/images/${name}.webp`}
                srcSet={`/images/${name}-800.webp 800w, /images/${name}.webp 1600w`}
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
