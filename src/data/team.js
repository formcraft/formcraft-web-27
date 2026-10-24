// Starter team for Admin → Team ("Import starter team"). Firestore `team/{emailLower}`; the
// onTeamChange / claimTeamRole Cloud Functions turn each row into custom claims.
// Only rows with an email are written; the others show "add email" until someone fills it in.

export const ROLES = {
    admin: { label: "Admin", help: "Everything, including pages, site details and the team." },
    marketing: { label: "Marketing", help: "Studio (approve, schedule, publish), leads, content and subscriber exports." },
    editor: { label: "Editor", help: "Creates and edits drafts in the studio and sends them for review. Can't approve, publish, delete or see leads." },
};

/** The team members and their roles, until Admin → Team holds the real list. */
export const STARTER_TEAM = [
    { name: "Emlyn Atochon", email: "formcraftinc@gmail.com", role: "admin", title: "Co-founder" },
    { name: "Peter Isingoma", email: null, role: "admin", title: "Co-founder" }, // TODO: sign-in email
    { name: "Esther Ahumuza", email: null, role: "admin", title: "Head of Sales & Marketing" }, // TODO: sign-in email
];
