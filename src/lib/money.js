// Money is whole UGX integers, shown only through formatUGX.
const ugx = new Intl.NumberFormat("en-UG", {
    style: "currency",
    currency: "UGX",
    currencyDisplay: "code",
    maximumFractionDigits: 0,
});

// Prices not set yet (null) read as a placeholder instead of a made-up number
export const formatUGX = (amount) => (Number.isInteger(amount) ? ugx.format(amount) : "UGX [price]");
