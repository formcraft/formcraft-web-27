// Starter social channels for the marketing studio (Admin → Studio → Channels → "Import the
// starter channels"). Handles from the brand material; unknown ones stay TODO and the channel is
// left inactive until the team fills it in. Add any other channel in Admin — no code change needed.
//
// publish: "manual" (the Today/This week queue) or "buffer" (sent by the publishApprovedPosts
// Cloud Function once a Buffer account is connected and bufferChannelId is set).

export const STARTER_CHANNELS = [
    { id: "instagram", platform: "instagram", name: "Instagram", handle: "formcraft.ug", url: "https://www.instagram.com/formcraft.ug/", active: true, publish: "manual", bufferChannelId: "", notes: "" },
    { id: "x", platform: "x", name: "X", handle: "formcraft_ug", url: "https://x.com/formcraft_ug", active: true, publish: "manual", bufferChannelId: "", notes: "" },
    { id: "linkedin", platform: "linkedin", name: "LinkedIn", handle: "formcraftinc", url: "https://www.linkedin.com/company/formcraftinc/", active: true, publish: "manual", bufferChannelId: "", notes: "TODO: confirm it's a company page (linkedin.com/company/formcraftinc)." },
    { id: "facebook", platform: "facebook", name: "Facebook", handle: "", url: "", active: false, publish: "manual", bufferChannelId: "", notes: "TODO: Facebook page name or link. Switch on once it's filled in." },
    { id: "tiktok", platform: "tiktok", name: "TikTok", handle: "", url: "", active: false, publish: "manual", bufferChannelId: "", notes: "TODO: TikTok handle. Switch on once it's filled in." },
    { id: "pinterest", platform: "pinterest", name: "Pinterest", handle: "", url: "", active: false, publish: "manual", bufferChannelId: "", notes: "TODO: Pinterest handle. Switch on once it's filled in." },
];

// settings/studio defaults (used until the team saves its own)
export const STUDIO_DEFAULTS = {
    targets: {}, // { [channelId]: postsPerWeek } — TODO: the team sets real targets in Channels
    defaultTime: "07:30", // register: schedule for 7–8 am on the day
    timezone: "Africa/Kampala",
    postingDays: [1, 3, 5], // 1 = Monday … 7 = Sunday; TODO: the team picks its posting days
    channelDays: {}, // { [channelId]: [1..7] } overrides postingDays for one channel
    campaignPrefix: "",
    bufferConnected: false,
};
