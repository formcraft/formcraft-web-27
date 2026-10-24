// Saving small settings on the visitor's device (localStorage), safely.
// Some browsers block storage (private mode, strict settings). These two helpers never crash: if
// storage is blocked, reading gives the fallback and writing quietly does nothing, so the site
// keeps working. Use them instead of calling localStorage directly.

/**
 * Reads a saved value.
 * @template T
 * @param {string} key       the name it was saved under, e.g. "fc-cart"
 * @param {T} fallback       what to return when nothing is saved or storage is blocked
 * @returns {T} the saved value (parsed from JSON) or the fallback
 */
export const readJSON = (key, fallback) => {
    try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
    } catch {
        return fallback;
    }
};

/**
 * Saves a value (as JSON). Does nothing if storage is blocked or full.
 * @param {string} key    the name to save it under
 * @param {unknown} value anything JSON can hold: numbers, text, lists, objects, null
 */
export const writeJSON = (key, value) => {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch {
        // storage blocked or full: keep the value in memory only
    }
};
