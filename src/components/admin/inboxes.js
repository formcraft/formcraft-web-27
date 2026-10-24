import { formatUGX } from "../../lib/money";

// What the admin Inbox lists: each collection's columns and the statuses the team can set.
// Money collections (orders, donations) and members are read-only here.
export const INBOXES = {
    messages: { label: "Messages", cols: [["name", "From"], ["email", "Email"], ["subject", "Subject"], ["body", "Message"]], statuses: ["new", "replied", "done"] },
    quotes: { label: "Quote requests", cols: [["name", "From"], ["contact", "Contact"], ["type", "Type"], ["budgetUGX", "Budget", (v) => (v ? formatUGX(v) : "—")], ["message", "Message"], ["files", "Files", (v) => (v?.length ? `${v.length} file` : "—")]], statuses: ["new", "replied", "won", "lost"] },
    investorLeads: { label: "Investor leads", cols: [["name", "Name"], ["org", "Organisation"], ["email", "Email"], ["ticketSize", "Ticket"], ["message", "Message"]], statuses: ["new", "pack sent", "meeting", "closed"] },
    orders: { label: "Orders", cols: [["id", "Order"], ["totalUGX", "Total", formatUGX], ["status", "Status"]], readOnly: true },
    donations: { label: "Donations", cols: [["displayName", "Donor"], ["trees", "Trees"], ["amountUGX", "Amount", formatUGX], ["status", "Status"]], readOnly: true },
    members: { label: "Members", cols: [["displayName", "Name"], ["trade", "Trade"], ["location", "Location"], ["approved", "Approved", (v) => (v ? "Yes" : "Waiting")]], readOnly: true },
};
