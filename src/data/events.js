// Events and workshops until the team adds real ones in Admin (Firestore `events`).
// Fields match CONTENT.events in src/data/content.js. These are sample slots from the design:
// no real dates, venues, places or prices yet, so they stay as placeholders.
export const events = [
    {
        id: "sample-workshop",
        slug: "sample-workshop",
        title: "[Workshop title]",
        date: null,
        venue: "[venue]",
        summary: "TODO: what the workshop covers and who it's for.",
        capacity: null,
        priceUGX: null,
        featured: false,
        active: true,
    },
    {
        id: "sample-event",
        slug: "sample-event",
        title: "[Event title]",
        date: null,
        venue: "[venue]",
        summary: "TODO: what happens at the event.",
        capacity: null,
        priceUGX: null,
        featured: false,
        active: true,
    },
    {
        id: "sample-training",
        slug: "sample-training",
        title: "[Training session]",
        date: null,
        venue: "[venue]",
        summary: "TODO: the skill taught and what to bring.",
        capacity: null,
        priceUGX: null,
        featured: false,
        active: true,
    },
];
