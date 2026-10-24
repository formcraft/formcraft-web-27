// Image sources for an images[] entry: a public/images name ("chair"), an object { name, alt },
// or a full URL uploaded from the admin page (no smaller copy, so no srcset).
export const imgName = (img) => (typeof img === "string" ? img : img?.name ?? img?.url ?? null);
export const imgAlt = (img, fallback = "") => (typeof img === "object" && img?.alt) || fallback;
const isUrl = (n) => /^(https?:|\/|blob:)/.test(n);

export const imgProps = (img, { small = false } = {}) => {
    const n = imgName(img);
    if (!n) return null;
    if (isUrl(n)) return { src: n };
    return { src: `/images/${n}${small ? "-800" : ""}.webp`, srcSet: `/images/${n}-800.webp 800w, /images/${n}.webp 1600w` };
};
