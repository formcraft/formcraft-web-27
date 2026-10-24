// The one status list for every lead (messages, sign-ups, quote requests, investor leads, subscribers),
// set in Admin → Leads. Before 2026-10-24, Leads and the old Inbox wrote the same `status` field from
// different lists ("replied", "done", "pack sent", "meeting"…); those old values still show as they are
// until someone changes them.

/** Lead statuses, in pipeline order. "closed" = handled, no sale expected (e.g. a general question answered). */
export const LEAD_STATUSES = ["new", "contacted", "qualified", "won", "lost", "closed"];
