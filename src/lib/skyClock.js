// Where the sun and moon are in Kampala right now. Kampala sits almost on the equator, so the sun
// rises around 06:45 and sets around 18:55 all year (EAT, UTC+3, no daylight saving). The clock is
// corrected to the server's time when one is known (see setServerOffset), so a visitor abroad or
// with a wrong phone clock still sees Kampala's sky.
const SUNRISE = 6 * 60 + 45;
const SUNSET = 18 * 60 + 55;
let offsetMs = 0;

// Called with the Date header of any server response
export const setServerOffset = (serverDate) => {
    const t = Date.parse(serverDate);
    if (Number.isFinite(t)) offsetMs = t - Date.now();
};

// Minutes since midnight in Kampala
export const kampalaMinutes = (now = Date.now() + offsetMs) => {
    const d = new Date(now);
    return (d.getUTCHours() * 60 + d.getUTCMinutes() + 3 * 60) % (24 * 60);
};

export const isKampalaDay = (m = kampalaMinutes()) => m >= SUNRISE && m < SUNSET;

// t runs 0 → 1 from rising (left horizon) to setting (right horizon), for whichever body is up.
// Returns both: the sun's arc by day and the moon's by night (the moon is drawn opposite the sun).
export const skyPosition = (m = kampalaMinutes()) => {
    const day = SUNSET - SUNRISE;
    const night = 24 * 60 - day;
    const sinceSet = (m - SUNSET + 24 * 60) % (24 * 60);
    return {
        isDay: isKampalaDay(m),
        sun: (m - SUNRISE) / day, // < 0 before sunrise, > 1 after sunset
        moon: sinceSet / night, // 0 at sunset, 1 at sunrise
        minutes: m,
    };
};
