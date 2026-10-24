// Showing prices. Money on this site is always a whole number of Uganda shillings (no cents),
// and every price on screen goes through formatUGX so they all look the same: "UGX 120,000".
// The real prices are kept on the server (Firestore); the browser only ever displays them.
const ugx = new Intl.NumberFormat("en-UG", {
    style: "currency",
    currency: "UGX",
    currencyDisplay: "code",
    maximumFractionDigits: 0,
});

/**
 * Formats a price for display.
 * @param {number|null|undefined} amount  whole shillings, e.g. 120000; null when the price isn't set yet
 * @returns {string} "UGX 120,000", or "Price on request" when there's no price yet (never a made-up number)
 */
export const formatUGX = (amount) => (Number.isInteger(amount) ? ugx.format(amount) : PRICE_ON_REQUEST);

/** What visitors see where a price isn't set yet. True, and standard wording; never a guessed number. */
export const PRICE_ON_REQUEST = "Price on request";
