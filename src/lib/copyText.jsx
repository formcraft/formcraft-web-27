// Turns copy text from Admin → Copy into React elements. Only a tiny markup is understood:
// **bold**, *italic* and line breaks. Everything else stays plain text (React escapes it), so an edit
// can never inject HTML or scripts (no dangerouslySetInnerHTML anywhere).
import { Fragment } from "react";

const TOKENS = /(\*\*[^*\n]+\*\*|\*[^*\n]+\*|\n)/;

/**
 * Copy text → React children.
 * @param {string} text  e.g. "Our BIM stands on **two** foundations"
 * @returns {import("react").ReactNode}
 * @example renderCopy("as *okwekoza* — pretence") // → ["as ", <em>okwekoza</em>, " — pretence"]
 */
export const renderCopy = (text) => {
    if (!text) return text;
    const parts = String(text).split(TOKENS).filter((p) => p !== "");
    if (parts.length === 1 && !TOKENS.test(parts[0])) return parts[0];
    return parts.map((p, i) => {
        if (p === "\n") return <br key={i} />;
        if (p.startsWith("**") && p.endsWith("**") && p.length > 4) return <strong key={i}>{p.slice(2, -2)}</strong>;
        if (p.startsWith("*") && p.endsWith("*") && p.length > 2) return <em key={i}>{p.slice(1, -1)}</em>;
        return <Fragment key={i}>{p}</Fragment>;
    });
};

/** Copy text without its markup, for places that take plain text (alt text, aria-labels, page titles). */
export const plainCopy = (text) => String(text ?? "").replace(/\*\*([^*\n]+)\*\*/g, "$1").replace(/\*([^*\n]+)\*/g, "$1").replace(/\s*\n\s*/g, " ");
