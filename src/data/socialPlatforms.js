// Social platforms the marketing studio knows about (Admin → Studio). A channel in Firestore
// (`socialChannels/{id}`) names one of these keys; "other" covers anything new, with the name and
// caption limit set on the channel itself, so the channel list keeps growing without code changes.
//
// captionLimit: characters allowed in a post (null = no practical limit we check).
// sizes: recommended image sizes per post format, [width, height] in pixels.
// Sizes and limits from the owner's studio brief and the social post kit (FMC-MKT-SOC /
// FMC-MKT-HOL: 1080 × 1080, 1080 × 1350, 1080 × 1920 story and WhatsApp status).

export const FORMATS = {
    feed: "Feed post",
    story: "Story",
    reel: "Reel / short video",
    carousel: "Carousel",
    pin: "Pin",
    text: "Text only",
};

const KIT = [
    [1080, 1080],
    [1080, 1350],
];
const STORY = [[1080, 1920]];

/** Social platforms the marketing studio posts to: label, post formats, sizes and text limits. */
export const PLATFORMS = {
    instagram: {
        label: "Instagram",
        captionLimit: 2200,
        hashtags: "A few specific tags work better than many (Instagram allows up to 30).",
        formats: ["feed", "carousel", "story", "reel"],
        sizes: { feed: [[1080, 1350], [1080, 1080]], carousel: [[1080, 1350], [1080, 1080]], story: STORY, reel: STORY },
        profileUrl: (h) => `https://www.instagram.com/${h}/`,
        openUrl: "https://www.instagram.com/",
    },
    facebook: {
        label: "Facebook",
        captionLimit: 63206,
        hashtags: "Optional; one or two at most.",
        formats: ["feed", "carousel", "story", "reel", "text"],
        sizes: { feed: [[1200, 630], [1080, 1350]], carousel: KIT, story: STORY, reel: STORY },
        profileUrl: (h) => `https://www.facebook.com/${h}`,
        openUrl: "https://www.facebook.com/",
    },
    x: {
        label: "X",
        captionLimit: 280,
        hashtags: "One or two at most — they count toward the 280 characters.",
        formats: ["feed", "text"],
        sizes: { feed: [[1600, 900]] },
        profileUrl: (h) => `https://x.com/${h}`,
        openUrl: "https://x.com/compose/post",
    },
    linkedin: {
        label: "LinkedIn",
        captionLimit: 3000,
        hashtags: "Three to five professional tags at the end.",
        formats: ["feed", "carousel", "text"],
        sizes: { feed: [[1200, 627], [1080, 1350]], carousel: [[1080, 1350]] },
        profileUrl: (h) => `https://www.linkedin.com/company/${h}/`,
        openUrl: "https://www.linkedin.com/feed/",
    },
    tiktok: {
        label: "TikTok",
        captionLimit: 2200,
        hashtags: "A few tags specific to the video; they count toward the caption.",
        formats: ["reel", "carousel"],
        sizes: { reel: STORY, carousel: STORY },
        profileUrl: (h) => `https://www.tiktok.com/@${h}`,
        openUrl: "https://www.tiktok.com/upload",
    },
    pinterest: {
        label: "Pinterest",
        captionLimit: 500,
        hashtags: "Use plain keywords in the description; hashtags are optional.",
        formats: ["pin"],
        sizes: { pin: [[1000, 1500]] },
        profileUrl: (h) => `https://www.pinterest.com/${h}/`,
        openUrl: "https://www.pinterest.com/pin-creation-tool/",
    },
    threads: {
        label: "Threads",
        captionLimit: 500,
        hashtags: "One topic tag per post.",
        formats: ["feed", "carousel", "text"],
        sizes: { feed: KIT, carousel: KIT }, // TODO: confirm Threads sizes; the post kit sizes are used for now
        profileUrl: (h) => `https://www.threads.net/@${h}`,
        openUrl: "https://www.threads.net/",
    },
    youtube: {
        label: "YouTube",
        captionLimit: null, // TODO: set if the team wants a check on titles/descriptions
        hashtags: "A few tags in the description.",
        formats: ["reel", "feed"],
        sizes: { reel: STORY },
        profileUrl: (h) => `https://www.youtube.com/@${h}`,
        openUrl: "https://studio.youtube.com/",
    },
    behance: {
        label: "Behance",
        captionLimit: null,
        hashtags: "Use Behance's own project tags instead of hashtags.",
        formats: ["feed", "carousel"],
        sizes: { feed: KIT, carousel: KIT },
        profileUrl: (h) => `https://www.behance.net/${h}`,
        openUrl: "https://www.behance.net/",
    },
    whatsapp: {
        label: "WhatsApp",
        captionLimit: null,
        hashtags: "No hashtags.",
        formats: ["story", "text"],
        sizes: { story: STORY },
        profileUrl: null,
        openUrl: "https://web.whatsapp.com/",
    },
    other: {
        label: "Other",
        captionLimit: null, // set per channel
        hashtags: "",
        formats: Object.keys(FORMATS),
        sizes: { feed: KIT, carousel: KIT, story: STORY, reel: STORY },
        profileUrl: null,
        openUrl: null,
    },
};

/** The platform ids, in order. */
export const PLATFORM_KEYS = Object.keys(PLATFORMS);

/** The platform settings for a channel ("other" when unknown). */
export const platformOf = (channel) => PLATFORMS[channel?.platform] ?? PLATFORMS.other;

// Channel name shown in lists: the channel's own name, else the platform label
export const channelLabel = (channel) => channel?.name || platformOf(channel).label;

// Caption limit for a channel: its own (for "other" or a custom limit), else the platform's
export const captionLimitOf = (channel) => {
    const own = Number(channel?.captionLimit);
    return Number.isFinite(own) && own > 0 ? own : platformOf(channel).captionLimit;
};

/** A channel's usual post format (e.g. "feed"). */
export const defaultFormatOf = (channel) => platformOf(channel).formats[0] ?? "feed";

// Recommended sizes for a channel and format ([] when we don't know)
export const sizesFor = (channel, format) => {
    const p = platformOf(channel);
    return p.sizes[format] ?? p.sizes[p.formats[0]] ?? [];
};

// Where "Open <platform>" goes: the channel's own link, else the platform's composer/home page
export const openUrlOf = (channel) => channel?.url || platformOf(channel).openUrl || null;

// The channel's public profile link from its handle
export const profileUrlOf = (channel) => {
    if (channel?.url) return channel.url;
    const handle = String(channel?.handle ?? "").replace(/^@/, "").trim();
    const p = platformOf(channel);
    return handle && p.profileUrl ? p.profileUrl(handle) : null;
};
