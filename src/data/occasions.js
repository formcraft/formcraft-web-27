// The annual social calendar, transcribed from the FormCraft Document & Template Master Register
// (pages 7–12, "Holiday & awareness day posts") and the template codes from the Template Master
// Catalogue (pages 8–16). Starter data for Firestore `occasions/{id}` (Admin → Studio → Occasions →
// "Import the starter calendar"); after import the team edits dates, care notes and switches there.
//
// rule: { type: "fixed", month, day } | { type: "month", month } |
//       { type: "nth-weekday", month, weekday (0 = Sunday … 6 = Saturday), n (1–5, or -1 = last) } |
//       { type: "range", start: { month, day }, end: { month, day } } | { type: "movable" }
// Movable occasions carry `dates: { "2026": "2026-03-20", … }`. Easter days also carry
// `easterOffset` (days from Easter Sunday), so a year without a date is worked out automatically.
// `confirm: true` → the date depends on the moon sighting (Eid): check it before posting.
// Register: "Movable dates re-checked each January."

// Care notes for sensitive days (register, page 12), attached automatically by category/tone
export const CARE = {
    safeMessaging:
        "Safe messaging (WHO): no mention of methods, no dramatic images, always a hopeful message.",
    helpline: "Include a verified local helpline or support contact — confirm the number before this post goes out.",
    noPromo: "No promotions, prices or “shop now” lines on this post.",
    faith: "Use the correct greeting for that faith; if unsure, have it approved by someone of that faith.",
    eidHold: "Prepare the graphic but hold it until the Uganda Muslim Supreme Council announces the date.",
};

// Applies to every occasion post (register): shown as a reminder, not a tick box
export const PREP_NOTE = "Prepare each post at least 3 days ahead; schedule for 7–8 am on the day.";

const fixed = (month, day) => ({ type: "fixed", month, day });
const month = (m) => ({ type: "month", month: m });
const nth = (m, weekday, n) => ({ type: "nth-weekday", month: m, weekday, n });

const RAW = [
    // ── Uganda public holidays (FMC-MKT-HOL) ──
    ["new-years-day", "New Year’s Day", "public-holiday", fixed(1, 1), "FMC-MKT-HOL-01-01", "“Building a stronger [year] together”; year-in-review collage of projects", "celebrate"],
    ["nrm-liberation-day", "NRM Liberation Day", "public-holiday", fixed(1, 26), "FMC-MKT-HOL-01-26", "Respectful national greeting, flag colours", "celebrate"],
    ["janani-luwum-day", "Archbishop Janani Luwum Day", "public-holiday", fixed(2, 16), "FMC-MKT-HOL-02-16", "Remembrance tone, simple and quiet design", "remember", { care: ["noPromo"] }],
    ["international-womens-day", "International Women’s Day", "public-holiday", fixed(3, 8), "FMC-MKT-HOL-03-08", "Celebrate women in design, craft and construction; team photos", "celebrate"],
    ["eid-al-fitr", "Eid al-Fitr", "public-holiday", { type: "movable" }, "FMC-MKT-HOL-03-10", "“Eid Mubarak” greeting, crescent motif", "celebrate", { dates: { 2026: "2026-03-20", 2027: "2027-03-09" }, confirm: true, care: ["faith", "eidHold"] }],
    ["good-friday", "Good Friday", "public-holiday", { type: "movable" }, "FMC-MKT-HOL-03-26", "Reflective tone, cross motif", "remember", { dates: { 2026: "2026-04-03", 2027: "2027-03-26" }, easterOffset: -2, care: ["faith"] }],
    ["easter-sunday", "Easter Sunday", "public-holiday", { type: "movable" }, "FMC-MKT-HOL-03-28", "“Happy Easter”; not a public holiday but widely posted", "celebrate", { dates: { 2026: "2026-04-05", 2027: "2027-03-28" }, easterOffset: 0, care: ["faith"] }],
    ["easter-monday", "Easter Monday", "public-holiday", { type: "movable" }, "", "Optional; usually covered by the Easter post", "celebrate", { dates: { 2026: "2026-04-06", 2027: "2027-03-29" }, easterOffset: 1, care: ["faith"], active: false }],
    ["labour-day", "Labour Day", "public-holiday", fixed(5, 1), "FMC-MKT-HOL-05-01", "Thank your craftsmen, site crews and staff; photos of the team at work", "celebrate"],
    ["eid-al-adha", "Eid al-Adha", "public-holiday", { type: "movable" }, "FMC-MKT-HOL-05-17", "“Eid Mubarak” greeting", "celebrate", { dates: { 2026: "2026-05-27", 2027: "2027-05-16" }, confirm: true, care: ["faith", "eidHold"] }],
    ["martyrs-day", "Martyrs’ Day", "public-holiday", fixed(6, 3), "FMC-MKT-HOL-06-03", "Respectful greeting; Namugongo pilgrimage reference", "remember", { care: ["faith"] }],
    ["national-heroes-day", "National Heroes Day", "public-holiday", fixed(6, 9), "FMC-MKT-HOL-06-09", "Honour heroes; can feature “builders of the nation” angle", "celebrate"],
    ["independence-day", "Independence Day", "public-holiday", fixed(10, 9), "FMC-MKT-HOL-10-09", "Flag colours, crested crane, “building Uganda” message", "celebrate"],
    ["christmas-day", "Christmas Day", "public-holiday", fixed(12, 25), "FMC-MKT-HOL-12-25", "“Merry Christmas”; warm, festive design", "celebrate", { care: ["faith"] }],
    ["boxing-day", "Boxing Day", "public-holiday", fixed(12, 26), "FMC-MKT-HOL-12-26", "Optional; season’s greetings follow-up", "celebrate"],

    // ── Health awareness days (FMC-MKT-AWR): respectful, never salesy ──
    ["cervical-cancer-awareness-month", "Cervical Cancer Awareness Month", "awareness", month(1), "FMC-MKT-AWR-01", "Teal and white ribbon; encourage screening", "awareness", { ribbon: "Teal and white" }],
    ["world-cancer-day", "World Cancer Day", "awareness", fixed(2, 4), "FMC-MKT-AWR-02-04", "Support for all fighting cancer; encourage early checks", "awareness"],
    ["international-childhood-cancer-day", "International Childhood Cancer Day", "awareness", fixed(2, 15), "FMC-MKT-AWR-02-15", "Gold ribbon; support for children and families", "awareness", { ribbon: "Gold" }],
    ["world-kidney-day", "World Kidney Day", "awareness", nth(3, 4, 2), "FMC-MKT-AWR-03-11", "Health check reminder", "awareness"],
    ["world-tb-day", "World TB Day", "awareness", fixed(3, 24), "FMC-MKT-AWR-03-24", "Get tested, finish treatment", "awareness"],
    ["world-health-day", "World Health Day", "awareness", fixed(4, 7), "FMC-MKT-AWR-04-07", "Healthy workplaces and homes", "awareness"],
    ["world-malaria-day", "World Malaria Day", "awareness", fixed(4, 25), "FMC-MKT-AWR-04-25", "Sleep under a net, clear stagnant water on sites", "awareness"],
    ["world-day-for-safety-and-health-at-work", "World Day for Safety and Health at Work", "awareness", fixed(4, 28), "FMC-MKT-AWR-04-28", "Strong fit: your site safety culture, PPE photos", "awareness"],
    ["world-no-tobacco-day", "World No Tobacco Day", "awareness", fixed(5, 31), "FMC-MKT-AWR-05-31", "Health message", "awareness"],
    ["world-blood-donor-day", "World Blood Donor Day", "awareness", fixed(6, 14), "FMC-MKT-AWR-06-14", "Thank donors; staff donation drive", "awareness"],
    ["world-sickle-cell-day", "World Sickle Cell Day", "awareness", fixed(6, 19), "FMC-MKT-AWR-06-19", "Red/burgundy ribbon; know your status, support warriors", "awareness", { ribbon: "Red/burgundy" }],
    ["world-hepatitis-day", "World Hepatitis Day", "awareness", fixed(7, 28), "FMC-MKT-AWR-07-28", "Testing and vaccination", "awareness"],
    ["childhood-cancer-awareness-month", "Childhood Cancer Awareness Month", "awareness", month(9), "FMC-MKT-AWR-09", "Gold ribbon", "awareness", { ribbon: "Gold" }],
    ["world-suicide-prevention-day", "World Suicide Prevention Day", "awareness", fixed(9, 10), "FMC-MKT-AWR-09-10", "Teal and purple ribbon; “you are not alone”, helpline (see care notes)", "awareness", { ribbon: "Teal and purple", care: ["safeMessaging", "helpline"] }],
    ["world-heart-day", "World Heart Day", "awareness", fixed(9, 29), "FMC-MKT-AWR-09-29", "Heart health", "awareness"],
    ["breast-cancer-awareness-month", "Breast Cancer Awareness Month", "awareness", month(10), "FMC-MKT-AWR-10", "Pink ribbon; self-exam and screening", "awareness", { ribbon: "Pink" }],
    ["world-mental-health-day", "World Mental Health Day", "awareness", fixed(10, 10), "FMC-MKT-AWR-10-10", "Green ribbon; mental health at work, especially for site workers", "awareness", { ribbon: "Green", care: ["safeMessaging", "helpline"] }],
    ["movember", "Movember / prostate cancer", "awareness", month(11), "FMC-MKT-AWR-11", "Light blue ribbon; men’s health checks", "awareness", { ribbon: "Light blue" }],
    ["world-diabetes-day", "World Diabetes Day", "awareness", fixed(11, 14), "FMC-MKT-AWR-11-14", "Blue circle; health checks", "awareness", { ribbon: "Blue circle" }],
    ["world-aids-day", "World AIDS Day", "awareness", fixed(12, 1), "FMC-MKT-AWR-12-01", "Red ribbon; test, treat, end stigma", "awareness", { ribbon: "Red" }],
    ["international-day-of-persons-with-disabilities", "International Day of Persons with Disabilities", "awareness", fixed(12, 3), "FMC-MKT-AWR-12-03", "Accessible design and building — strong fit for the studio", "awareness"],

    // ── Social and family days (FMC-MKT-DAY) ──
    ["valentines-day", "Valentine’s Day", "social", fixed(2, 14), "FMC-MKT-DAY-02-14", "Craft gift pieces; strong sales fit for CRF", "sales"],
    ["mothers-day", "Mother’s Day", "social", nth(5, 0, 2), "FMC-MKT-DAY-05-09", "Celebrate mothers; craft gift angle", "sales"],
    ["day-of-the-african-child", "Day of the African Child", "social", fixed(6, 16), "FMC-MKT-DAY-06-16", "Safe spaces for children to learn and play", "celebrate"],
    ["fathers-day", "Father’s Day", "social", nth(6, 0, 3), "FMC-MKT-DAY-06-20", "Celebrate fathers", "celebrate"],
    ["international-youth-day", "International Youth Day", "social", fixed(8, 12), "FMC-MKT-DAY-08-12", "Apprenticeships, young craftsmen and designers", "celebrate"],
    ["16-days-of-activism", "16 Days of Activism against GBV", "social", { type: "range", start: { month: 11, day: 25 }, end: { month: 12, day: 10 } }, "FMC-MKT-DAY-11-25", "Respectful stance; safe workplaces", "awareness"],
    ["human-rights-day", "Human Rights Day", "social", fixed(12, 10), "FMC-MKT-DAY-12-10", "Short respectful message", "awareness"],

    // ── Industry days (strongest brand fit, FMC-MKT-DAY) ──
    ["world-engineering-day", "World Engineering Day", "industry", fixed(3, 4), "FMC-MKT-DAY-03-04", "Showcase structures and concrete work", "celebrate"],
    ["world-wood-day", "International Day of Forests / World Wood Day", "industry", fixed(3, 21), "FMC-MKT-DAY-03-21", "Craft timber pieces, sustainable sourcing", "celebrate"],
    ["world-water-day", "World Water Day", "industry", fixed(3, 22), "FMC-MKT-DAY-03-22", "Water-wise building, harvesting tanks", "celebrate"],
    ["world-creativity-and-innovation-day", "World Creativity and Innovation Day", "industry", fixed(4, 21), "FMC-MKT-DAY-04-21", "Studio concepts, innovative pieces", "celebrate"],
    ["earth-day", "Earth Day", "industry", fixed(4, 22), "FMC-MKT-DAY-04-22", "Sustainable materials", "celebrate"],
    ["world-design-day", "World Design Day", "industry", fixed(4, 27), "FMC-MKT-DAY-04-27", "Studio portfolio feature", "celebrate"],
    ["world-environment-day", "World Environment Day", "industry", fixed(6, 5), "FMC-MKT-DAY-06-05", "Green building, site clean-up", "celebrate"],
    ["world-youth-skills-day", "World Youth Skills Day", "industry", fixed(7, 15), "FMC-MKT-DAY-07-15", "Training, apprentices at the workshop", "celebrate"],
    ["world-architecture-day", "World Architecture Day & World Habitat Day", "industry", nth(10, 1, 1), "FMC-MKT-DAY-10-04", "Flagship studio post: best project of the year", "celebrate"],
    ["world-cities-day", "World Cities Day", "industry", fixed(10, 31), "FMC-MKT-DAY-10-31", "Kampala urban design angle", "celebrate"],
    ["world-toilet-day", "World Toilet Day", "industry", fixed(11, 19), "FMC-MKT-DAY-11-19", "Sanitation in building design", "celebrate"],
];

// Register: awareness posts carry no prices or offers (FMC-MKT-AWR), and cancer, sickle cell, HIV
// and remembrance posts carry no promotions — so every awareness-category occasion gets noPromo.
const careFor = (category, care = []) => {
    const keys = new Set(care);
    if (category === "awareness") keys.add("noPromo");
    return ["safeMessaging", "helpline", "noPromo", "faith", "eidHold"].filter((k) => keys.has(k)).map((k) => CARE[k]);
};

/** Holidays and awareness days for the marketing calendar (Admin → Studio), each with its date rule and post idea. */
export const STARTER_OCCASIONS = RAW.map(([id, name, category, rule, templateCode, postAngle, tone, extra = {}]) => ({
    id,
    name,
    category,
    rule,
    dates: extra.dates ? Object.fromEntries(Object.entries(extra.dates).map(([y, d]) => [String(y), d])) : {},
    ...(typeof extra.easterOffset === "number" ? { easterOffset: extra.easterOffset } : {}),
    confirm: Boolean(extra.confirm),
    templateCode,
    postAngle,
    tone,
    careNotes: careFor(category, extra.care),
    ribbonColour: extra.ribbon ?? null,
    active: extra.active ?? true,
    // Seasonal site theming is decided later (occasion palette needs brand approval): off by default
    siteTheme: { enabled: false, accent: null, intensity: "quiet" },
}));

/** Occasion kinds, as labels. */
export const OCCASION_CATEGORIES = {
    "public-holiday": "Public holiday",
    awareness: "Health awareness",
    social: "Social & family",
    industry: "Industry",
};

/** How a post for an occasion should feel, as labels. */
export const OCCASION_TONES = { celebrate: "Celebrate", remember: "Remember", awareness: "Awareness", sales: "Sales" };

// ── Dates ──
const pad = (n) => String(n).padStart(2, "0");
const ymd = (y, m, d) => `${y}-${pad(m)}-${pad(d)}`;

// Easter Sunday (Gregorian calendar, anonymous algorithm) → { month, day }
export const easterSunday = (year) => {
    const a = year % 19;
    const b = Math.floor(year / 100);
    const c = year % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    return { month: Math.floor((h + l - 7 * m + 114) / 31), day: ((h + l - 7 * m + 114) % 31) + 1 };
};

const nthWeekday = (year, m, weekday, n) => {
    if (n === -1) {
        const last = new Date(Date.UTC(year, m, 0));
        const back = (last.getUTCDay() - weekday + 7) % 7;
        return last.getUTCDate() - back;
    }
    const first = new Date(Date.UTC(year, m - 1, 1)).getUTCDay();
    const day = 1 + ((weekday - first + 7) % 7) + (n - 1) * 7;
    const daysInMonth = new Date(Date.UTC(year, m, 0)).getUTCDate();
    return day <= daysInMonth ? day : null;
};

// The occasion's (first) day in a year as "YYYY-MM-DD", or null when it can't be known yet.
// Returns { date, confirm } — confirm is true when the date must be checked before posting.
export const occasionDate = (occasion, year) => {
    const r = occasion?.rule ?? {};
    const y = Number(year);
    const own = occasion?.dates?.[String(y)];
    if (own) return { date: own, confirm: Boolean(occasion.confirm) };
    switch (r.type) {
        case "fixed":
            return { date: ymd(y, r.month, r.day), confirm: false };
        case "month":
            return { date: ymd(y, r.month, 1), confirm: false };
        case "nth-weekday": {
            const d = nthWeekday(y, Number(r.month), Number(r.weekday), Number(r.n));
            return { date: d ? ymd(y, r.month, d) : null, confirm: false };
        }
        case "range":
            return { date: ymd(y, r.start.month, r.start.day), confirm: false };
        case "movable": {
            if (typeof occasion.easterOffset === "number") {
                const e = easterSunday(y);
                const dt = new Date(Date.UTC(y, e.month - 1, e.day + occasion.easterOffset));
                return { date: ymd(dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate()), confirm: false };
            }
            return { date: null, confirm: true };
        }
        default:
            return { date: null, confirm: true };
    }
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const NTH = { 1: "1st", 2: "2nd", 3: "3rd", 4: "4th", 5: "5th", "-1": "Last" };

// A short description of the rule, e.g. "9 Oct", "October (month)", "2nd Sunday of May"
export const describeRule = (occasion) => {
    const r = occasion?.rule ?? {};
    switch (r.type) {
        case "fixed":
            return `${r.day} ${MONTHS[r.month - 1]}`;
        case "month":
            return `${MONTHS[r.month - 1]} (month)`;
        case "nth-weekday":
            return `${NTH[r.n] ?? r.n} ${DAYS[r.weekday]} of ${MONTHS[r.month - 1]}`;
        case "range":
            return `${r.start.day} ${MONTHS[r.start.month - 1]} – ${r.end.day} ${MONTHS[r.end.month - 1]}`;
        case "movable":
            return typeof occasion.easterOffset === "number" ? "Movable (Easter)" : "Movable (set each year)";
        default:
            return "—";
    }
};
