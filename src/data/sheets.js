// Sheet number and name for the title-block footer, by path
export const SHEETS = {
    "/": ["A000", "Home — the pitch"],
    "/studio": ["A101", "Studio · design & BIM"],
    "/construction": ["A102", "Construction"],
    "/concrete": ["A103", "Concrete"],
    "/templates": ["A104", "Template builds"],
    "/projects": ["A201", "Projects"],
    "/about": ["A301", "About"],
    "/journal": ["A302", "Journal"],
    "/contact": ["A304", "Contact"],
    "/privacy": ["A305", "Privacy"],
    "/links": ["X001", "Links"],
    "/stores": ["S101", "Stores"],
    "/checkout": ["S201", "Checkout"],
    "/checkout/confirmed": ["S202", "Order confirmed"],
    "/community": ["C101", "Community"],
    "/academy": ["C102", "Academy"],
    "/invest": ["I101", "Invest"],
    "/real-estate": ["I102", "Real estate"],
    "/donate": ["I104", "Plant a tree"],
    "/donate/thank-you": ["I105", "Thank you"],
    "/account": ["U101", "Your account"],
    "/sign-in": ["U102", "Sign in"],
    "/admin": ["U103", "Admin"],
};

const DETAIL = [
    ["/stores/", "S102", "Stores · product"],
    ["/projects/", "A202", "Projects · case study"],
    ["/templates/", "A105", "Template builds · design"],
    ["/journal/", "A303", "Journal · story"],
    ["/real-estate/", "I103", "Real estate · development"],
];

export const sheetFor = (pathname) => {
    const clean = pathname.length > 1 ? pathname.replace(/\/$/, "") : pathname;
    if (SHEETS[clean]) return SHEETS[clean];
    const d = DETAIL.find(([prefix]) => clean.startsWith(prefix));
    return d ? [d[1], d[2]] : ["X404", "Page not found"];
};
