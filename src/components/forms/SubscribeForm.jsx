import { useId, useState } from "react";
import { Link } from "react-router-dom";
import { subscribe } from "../../lib/forms";
import { writeJSON } from "../../lib/storage";
import { useContentItem } from "../../hooks/useContent";
import { Honeypot } from "./Honeypot";
import { Icon } from "../ui/Icon";
import "./SubscribeForm.css";

// Join the email list → Firestore `subscribers` (with consent). Variants:
// - "inline": email + button (link-in-bio page, after a quote request)
// - "card":   heading, name, email, interest chips, consent (Journal, Templates)
// - "footer": compact, on the dark footer
// `download`: slug of a free download (Admin → Free downloads). After subscribing we show its
// link if a file has been uploaded, and otherwise say plainly that it isn't ready yet.
const INTERESTS = ["Template homes", "Journal", "Academy", "Investing", "Shop"];

const CONSENT = "Send me Formcraft updates. You can unsubscribe any time.";

const DownloadResult = ({ slug }) => {
    const { item, loading } = useContentItem("downloads", slug);
    if (loading) return <p className="small">Finding your download…</p>;
    if (item?.file) {
        return (
            <a className="btn btn-primary btn-sm subscribe-download" href={item.file} target="_blank" rel="noreferrer">
                <Icon name="file" size={18} /> Download the {item.title ? item.title.toLowerCase() : "file"}
            </a>
        );
    }
    return (
        <p className="small">
            The {item?.title ? item.title.toLowerCase() : "download"} isn't ready yet. We've noted that you asked for it and we'll email it to you as soon as it is.
        </p>
    );
};

export const SubscribeForm = ({
    variant = "inline",
    heading,
    intro,
    download,
    defaultInterests = [],
    button = "Subscribe",
    className = "",
}) => {
    const uid = useId();
    const id = (name) => `sub-${uid}-${name}`;
    const [status, setStatus] = useState("idle"); // idle | sending | sent | error
    const [error, setError] = useState(null);
    const card = variant === "card";

    const onSubmit = async (event) => {
        event.preventDefault();
        const f = new FormData(event.currentTarget);
        setStatus("sending");
        setError(null);
        try {
            await subscribe({
                email: f.get("email"),
                name: f.get("name") ?? "",
                interests: f.getAll("interests"),
                consent: f.get("consent") === "yes",
                download: download ?? "",
                website: f.get("website"),
            });
            writeJSON("fc-subscribed", { at: new Date().toISOString() }); // the scroll prompt stops asking
            setStatus("sent");
        } catch (e) {
            setError(e.message || "Something went wrong. Please try again.");
            setStatus("error");
        }
    };

    if (status === "sent") {
        return (
            <div className={`subscribe subscribe-${variant} subscribe-done ${card ? "card card-pad" : ""} ${className}`.trim()} role="status">
                <p className={card ? "h3" : "h4"}>
                    <Icon name="check" size={card ? 22 : 18} /> You're on the list.
                </p>
                <p className="small">Thank you. We'll write when there's something worth your time — new designs, stories and dates. No spam.</p>
                {download && <DownloadResult slug={download} />}
            </div>
        );
    }

    return (
        <form className={`subscribe subscribe-${variant} ${card ? "card card-pad form" : ""} ${className}`.trim()} onSubmit={onSubmit} aria-label={heading ? undefined : "Join the email list"} aria-labelledby={heading ? id("h") : undefined}>
            {heading && (
                <p id={id("h")} className={card ? "h3" : "h4 subscribe-heading"}>
                    {heading}
                </p>
            )}
            {intro && <p className="small">{intro}</p>}
            <Honeypot />

            {card && (
                <div className="form-row">
                    <div className="field">
                        <label htmlFor={id("name")}>Name (optional)</label>
                        <input id={id("name")} name="name" autoComplete="name" maxLength={120} />
                    </div>
                    <div className="field">
                        <label htmlFor={id("email")}>Email address</label>
                        <input id={id("email")} name="email" type="email" autoComplete="email" required maxLength={200} placeholder="you@example.com" />
                    </div>
                </div>
            )}

            {!card && (
                <div className="subscribe-line">
                    <label className="sr-only" htmlFor={id("email")}>Email address</label>
                    <input id={id("email")} className="subscribe-input" name="email" type="email" autoComplete="email" required maxLength={200} placeholder="Your email" />
                    <button type="submit" className={`btn ${variant === "footer" ? "btn-primary" : "btn-ink"} btn-sm`} disabled={status === "sending"}>
                        {status === "sending" ? "Sending…" : button}
                    </button>
                </div>
            )}

            {card && (
                <fieldset className="subscribe-interests">
                    <legend>I'm interested in</legend>
                    <div className="row" style={{ "--gap": "8px" }}>
                        {INTERESTS.map((t) => (
                            <label key={t} className="chip">
                                <input type="checkbox" name="interests" value={t} defaultChecked={defaultInterests.includes(t)} />
                                {t}
                            </label>
                        ))}
                    </div>
                </fieldset>
            )}

            <label className="subscribe-consent" htmlFor={id("consent")}>
                <input id={id("consent")} type="checkbox" name="consent" value="yes" required />
                <span>
                    {CONSENT} <Link to="/privacy" className="link">Privacy</Link>
                </span>
            </label>

            {error && <p className="alert alert-error subscribe-error" role="alert">{error}</p>}

            {card && (
                <div className="row">
                    <button type="submit" className="btn btn-primary" disabled={status === "sending"}>
                        {status === "sending" ? "Sending…" : button}
                    </button>
                    <span className="fine">We use your email only to send Formcraft updates.</span>
                </div>
            )}
        </form>
    );
};
