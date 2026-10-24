// Facts we don't have yet ("pending").
//
// The project rule: never invent copy, prices, clients, numbers or names. When a fact is missing, the
// code holds a clear placeholder instead: text starting with "TODO", or a bracket placeholder such as
// "[price]" or "[Design name]".
//
// Those placeholders are for the Formcraft team, not for visitors. This file decides what counts as
// a placeholder; the <Todo> and <Fact> components (src/components/ui/Todo.jsx) then show visitors a
// neutral, true fallback (or nothing), and show signed-in team members a highlighted
// "To fill in: …" note, so the team can walk through the live site and see what's still missing.

/**
 * True when a piece of text is a placeholder for a missing fact, not real content.
 * @param {unknown} text
 * @returns {boolean} true for "TODO: …", "TODO …", and a lone "[something]"; false for real text and for non-text
 * @example isPending("TODO: confirm the client")  // true
 * @example isPending("[Design name]")             // true
 * @example isPending("Residential project")       // false
 */
export const isPending = (text) => typeof text === "string" && /^\s*(TODO\b|\[[^\]]+\]\s*$)/i.test(text);

/**
 * The real text, or null when it's a placeholder. Handy in data code: `known(project.summary) ?? fallback`.
 * @param {unknown} text
 * @returns {string|null}
 */
export const known = (text) => (typeof text === "string" && text.trim() && !isPending(text) ? text : null);

/**
 * Splits text that is real up to a TODO into its two parts.
 * @param {string} text  e.g. "A better layout means a new version. TODO: whether buyers get updates."
 * @returns {[string, string|null]} the real part (may be "") and the TODO part (null when there is none)
 */
export const splitPending = (text) => {
    const at = String(text ?? "").search(/\bTODO\b/);
    return at < 0 ? [String(text ?? ""), null] : [String(text).slice(0, at).trim(), String(text).slice(at)];
};

/**
 * A placeholder note without its "TODO:" prefix, for showing to the team ("To fill in: …").
 * @param {string} text
 */
export const pendingNote = (text) => String(text).replace(/^\s*TODO\s*:?\s*/i, "").replace(/^\[(.*)\]$/, "$1");
