// Admin → Records: read-only lists of orders, donations and members, with their columns. Leads (messages,
// quotes, investor leads, subscribers) live in Admin → Leads, the one place for people who contacted us.
// Money collections are changed only by Cloud Functions; member approvals arrive in Phase 4.
import { formatUGX } from "../../lib/money";

/** Each record list: its menu label (also the panel heading) and its columns [field, heading, format?]. */
export const RECORDS = {
    orders: { label: "Orders", cols: [["id", "Order"], ["totalUGX", "Total", formatUGX], ["status", "Status"]] },
    donations: { label: "Donations", cols: [["displayName", "Donor"], ["trees", "Trees"], ["amountUGX", "Amount", formatUGX], ["status", "Status"]] },
    members: { label: "Members", cols: [["displayName", "Name"], ["trade", "Trade"], ["location", "Location"], ["approved", "Approved", (v) => (v ? "Yes" : "Waiting")]] },
};
