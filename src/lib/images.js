// Image sources for an images[] entry: a public/images name ("chair"), an object { name, alt },
// or a full URL uploaded from the admin page (no smaller copy, so no srcset).
export const imgName = (img) => (typeof img === "string" ? img : img?.name ?? img?.url ?? null);
/** The description of an images[] entry, or the fallback. */
export const imgAlt = (img, fallback = "") => (typeof img === "object" && img?.alt) || fallback;
const isUrl = (n) => /^(https?:|\/|blob:)/.test(n);

/**
 * The <img> attributes for an images[] entry: src, srcSet (800 px and 1600 px copies) and sizes.
 * @param {string|object} img  a file name in public/images, an uploaded file's address, or { name, alt }
 * @param {{ small?: boolean }} [options]  small: prefer the 800 px copy (cards, thumbnails)
 * @returns {object|null}  null when there's no image
 */
export const imgProps = (img, { small = false } = {}) => {
    const n = imgName(img);
    if (!n) return null;
    if (isUrl(n)) return { src: n };
    return { src: `/images/${n}${small ? "-800" : ""}.webp`, srcSet: `/images/${n}-800.webp 800w, /images/${n}.webp 1600w` };
};
