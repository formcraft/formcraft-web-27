// Public contact details. These are the defaults; an admin can change them in Admin → Site details
// (Firestore settings/site.details), and SiteContext merges the saved values over these.
// null = not known yet (TODO), and the site leaves that line out rather than guessing.
export const CONTACT_DEFAULTS = {
    whatsapp: null, // TODO: the WhatsApp number (the WhatsApp links appear only once it's set)
    phone: "+256 753 929 921",
    // TODO: the owner hasn't confirmed which public email to use (formcraftdesign@gmail.com is on the
    // site and business cards; the social posters use formcraft@gmail.com).
    email: "formcraftdesign@gmail.com",
    address: null, // TODO: street address of the Kampala office
    hours: null, // TODO: office hours
    instagram: "formcraft.ug",
    x: "formcraft_ug",
    linkedin: "formcraftinc", // TODO: confirm it's a LinkedIn company page (linkedin.com/company/formcraftinc)
    tiktok: null, // TODO
    facebook: null, // TODO
    pinterest: null, // TODO
};

export const DETAIL_FIELDS = [
    ["whatsapp", "WhatsApp number", "With the country code, e.g. +256 7…"],
    ["phone", "Phone", "Shown as written; used for the call button"],
    ["email", "Public email", ""],
    ["address", "Office address", "Leave empty until it's confirmed"],
    ["hours", "Office hours", "e.g. Mon–Fri 8:00–17:00"],
    ["instagram", "Instagram", "Handle without @, or the full profile link"],
    ["x", "X", "Handle without @, or the full profile link"],
    ["linkedin", "LinkedIn", "Company page name, or the full link"],
    ["tiktok", "TikTok", "Handle without @, or the full profile link"],
    ["facebook", "Facebook", "Page name, or the full link"],
    ["pinterest", "Pinterest", "Handle, or the full profile link"],
];

const isUrl = (v) => /^https?:\/\//i.test(v);
const handle = (v) => String(v).trim().replace(/^@/, "");

// [key, label, url(value), shown handle(value)]
export const SOCIALS = [
    ["instagram", "Instagram", (v) => (isUrl(v) ? v : `https://www.instagram.com/${handle(v)}/`), (v) => (isUrl(v) ? "Instagram" : `@${handle(v)}`)],
    ["tiktok", "TikTok", (v) => (isUrl(v) ? v : `https://www.tiktok.com/@${handle(v)}`), (v) => (isUrl(v) ? "TikTok" : `@${handle(v)}`)],
    ["linkedin", "LinkedIn", (v) => (isUrl(v) ? v : `https://www.linkedin.com/company/${handle(v)}/`), (v) => (isUrl(v) ? "LinkedIn" : handle(v))],
    ["x", "X", (v) => (isUrl(v) ? v : `https://x.com/${handle(v)}`), (v) => (isUrl(v) ? "X" : `@${handle(v)}`)],
    ["facebook", "Facebook", (v) => (isUrl(v) ? v : `https://www.facebook.com/${handle(v)}`), (v) => (isUrl(v) ? "Facebook" : handle(v))],
    ["pinterest", "Pinterest", (v) => (isUrl(v) ? v : `https://www.pinterest.com/${handle(v)}/`), (v) => (isUrl(v) ? "Pinterest" : handle(v))],
];

// The socials that are set, ready to render: [{ key, label, href, text }]
export const socialLinks = (details) =>
    SOCIALS.filter(([key]) => details?.[key]).map(([key, label, url, text]) => ({ key, label, href: url(details[key]), text: text(details[key]) }));

const digits = (v) => String(v ?? "").replace(/\D/g, "");

export const telHref = (phone) => (digits(phone) ? `tel:${String(phone).trim().startsWith("+") ? "+" : ""}${digits(phone)}` : null);

export const WHATSAPP_HELLO = "Hello Formcraft, I found you on your website.";

// wa.me link, only when a WhatsApp number is set
export const waHref = (whatsapp, text = WHATSAPP_HELLO) =>
    digits(whatsapp) ? `https://wa.me/${digits(whatsapp)}?text=${encodeURIComponent(text)}` : null;
