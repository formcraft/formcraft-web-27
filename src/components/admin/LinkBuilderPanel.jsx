import { useId, useMemo, useState } from "react";
import { PAGES } from "../../data/pages";
import { SITE_URL } from "../../data/seo";
import { slugify } from "../../data/content";

// Tagged links for social posts and bios: utm_source / utm_medium / utm_campaign, so the Leads
// screen can show which platform and which post brought each lead.
const PLATFORMS = [
    ["instagram-bio", "Instagram bio", "instagram", "social-bio"],
    ["instagram-story", "Instagram story", "instagram", "social-story"],
    ["tiktok", "TikTok", "tiktok", "social"],
    ["linkedin", "LinkedIn", "linkedin", "social"],
    ["x", "X", "x", "social"],
    ["facebook", "Facebook", "facebook", "social"],
    ["pinterest", "Pinterest", "pinterest", "social"],
    ["whatsapp", "WhatsApp status", "whatsapp", "status"],
    ["email", "Email", "email", "email"],
    ["other", "Other", "", ""],
];

const STATIC_PAGES = PAGES.filter((p) => !p.paths[0].includes(":") && !["admin", "account", "signIn", "checkout"].includes(p.key));
const CUSTOM = "__custom";

const baseUrl = () => String(SITE_URL || (typeof window !== "undefined" ? window.location.origin : "")).replace(/\/+$/, "");

const copyText = async (text) => {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch {
        // older browsers / no permission: select-and-copy fallback
        const area = document.createElement("textarea");
        area.value = text;
        area.setAttribute("readonly", "");
        area.style.position = "fixed";
        area.style.opacity = "0";
        document.body.appendChild(area);
        area.select();
        let ok = false;
        try {
            ok = document.execCommand("copy");
        } catch {
            ok = false;
        }
        area.remove();
        return ok;
    }
};

export const LinkBuilderPanel = () => {
    const uid = useId();
    const id = (n) => `lb-${uid}-${n}`;
    const [platform, setPlatform] = useState("instagram-bio");
    const [otherSource, setOtherSource] = useState("");
    const [page, setPage] = useState("/links");
    const [custom, setCustom] = useState("/");
    const [campaign, setCampaign] = useState("");
    const [base, setBase] = useState(baseUrl);
    const [copied, setCopied] = useState(null);

    const url = useMemo(() => {
        const p = PLATFORMS.find(([k]) => k === platform);
        const source = p[0] === "other" ? slugify(otherSource) : p[2];
        const path = page === CUSTOM ? `/${custom.trim().replace(/^\/+/, "")}` : page;
        const params = new URLSearchParams();
        if (source) params.set("utm_source", source);
        if (p[3]) params.set("utm_medium", p[3]);
        if (campaign.trim()) params.set("utm_campaign", slugify(campaign));
        const qs = params.toString();
        return `${base.replace(/\/+$/, "")}${path}${qs ? `?${qs}` : ""}`;
    }, [platform, otherSource, page, custom, campaign, base]);

    const onCopy = async () => setCopied((await copyText(url)) ? "Copied." : "Couldn't copy — select the link and copy it by hand.");

    return (
        <div className="stack" style={{ "--gap": "20px" }}>
            <div className="stack" style={{ "--gap": "6px" }}>
                <h3 className="h3">Link builder</h3>
                <p className="small">Make a tagged link for a post, story or bio. When someone arrives through it and later sends a form or subscribes, the Leads screen shows the platform and campaign.</p>
            </div>
            <form className="card card-pad form" onSubmit={(e) => e.preventDefault()}>
                <div className="form-row">
                    <div className="field">
                        <label htmlFor={id("platform")}>Where the link goes</label>
                        <select id={id("platform")} value={platform} onChange={(e) => { setPlatform(e.target.value); setCopied(null); }}>
                            {PLATFORMS.map(([k, label]) => <option key={k} value={k}>{label}</option>)}
                        </select>
                    </div>
                    {platform === "other" && (
                        <div className="field">
                            <label htmlFor={id("other")}>Source name</label>
                            <input id={id("other")} value={otherSource} onChange={(e) => setOtherSource(e.target.value)} placeholder="e.g. youtube, flyer, expo-2026" maxLength={60} />
                        </div>
                    )}
                    <div className="field">
                        <label htmlFor={id("page")}>Page</label>
                        <select id={id("page")} value={page} onChange={(e) => { setPage(e.target.value); setCopied(null); }}>
                            {STATIC_PAGES.map((p) => <option key={p.key} value={p.paths[0]}>{p.label} ({p.paths[0]})</option>)}
                            <option value={CUSTOM}>Another address…</option>
                        </select>
                    </div>
                    {page === CUSTOM && (
                        <div className="field">
                            <label htmlFor={id("custom")}>Address on the site</label>
                            <input id={id("custom")} value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="/templates/your-design" maxLength={200} />
                        </div>
                    )}
                </div>
                <div className="form-row">
                    <div className="field">
                        <label htmlFor={id("campaign")}>Campaign or post (optional)</label>
                        <input id={id("campaign")} value={campaign} onChange={(e) => setCampaign(e.target.value)} placeholder="e.g. template-launch-nov" maxLength={80} aria-describedby={id("campaign-hint")} />
                        <span className="hint" id={id("campaign-hint")}>Short words joined by dashes. Use the same name on every platform for one campaign.</span>
                    </div>
                    <div className="field">
                        <label htmlFor={id("base")}>Website address</label>
                        <input id={id("base")} value={base} onChange={(e) => setBase(e.target.value)} aria-describedby={id("base-hint")} />
                        <span className="hint" id={id("base-hint")}>From the site settings (SITE_URL). TODO: the domain isn't confirmed yet — check before posting.</span>
                    </div>
                </div>
                <div className="field">
                    <label htmlFor={id("out")}>Your link</label>
                    <input id={id("out")} value={url} readOnly onFocus={(e) => e.target.select()} />
                </div>
                <div className="row">
                    <button type="button" className="btn btn-primary btn-sm" onClick={onCopy}>Copy link</button>
                    <span className="fine" role="status" aria-live="polite">{copied}</span>
                </div>
            </form>
            <div className="card card-pad stack" style={{ "--gap": "8px" }}>
                <h4 className="h4">How to use it</h4>
                <ol className="small" style={{ margin: 0, paddingLeft: 20 }}>
                    <li>Bio links: point Instagram, TikTok and X bios at the Links page (/links), one tagged link per platform.</li>
                    <li>Posts and stories: link straight to the page the post is about, with a campaign name.</li>
                    <li>WhatsApp status and email: pick that platform so those leads aren't counted as “direct”.</li>
                    <li>Check Admin → Leads after a few days: “Leads by source” and “Leads by campaign” show what worked.</li>
                </ol>
            </div>
        </div>
    );
};
