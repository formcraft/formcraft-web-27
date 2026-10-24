// Starter team for Admin → Team ("Import starter team"). Firestore `team/{emailLower}`; the
// onTeamChange / claimTeamRole Cloud Functions turn each row into custom claims.
// Only rows with an email are written; the others show "add email" until someone fills it in.
// Owner's decision (2026-10-24): everyone on the team gets the same full access ("team"); only the owner
// (claim owner: true, scripts/set-admin.js --owner) manages the team. The limited roles stay for later
// (e.g. blog writers), so the owner can give someone less than full access.

/** The access the owner can give someone in Admin → Team. "admin" is the old name of "team". */
export const ROLES = {
    team: { label: "Team (full access)", help: "Everything on the admin page: content, copy, studio, leads, inbox, pages and settings. Only the owner manages the team." },
    marketing: { label: "Marketing", help: "Studio (approve, schedule, publish), leads, content and subscriber exports." },
    editor: { label: "Editor", help: "Creates and edits drafts in the studio and sends them for review. Can't approve, publish, delete or see leads." },
};

/** The team members and their roles, until Admin → Team holds the real list. */
export const STARTER_TEAM = [
    { name: "Emlyn Atochon", email: "formcraftinc@gmail.com", role: "team", title: "Co-founder" },
    { name: "Peter Isingoma", email: null, role: "team", title: "Co-founder" }, // TODO: sign-in email
    { name: "Esther Ahumuza", email: null, role: "team", title: "Head of Sales & Marketing" }, // TODO: sign-in email
];
