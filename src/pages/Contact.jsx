// Contact page (/contact). Contact: the message form, and the phone, WhatsApp, email, social links and office hours
// from Admin → Site details (each row shows once it's set). The map is an illustration, not a real map.
import { useState } from "react";
import { Link } from "react-router-dom";
import { usePageMeta } from "../hooks/usePageMeta";
import { PageHero } from "../components/page/PageHero";
import { Section } from "../components/page/Section";
import { Icon } from "../components/ui/Icon";
import { sendMessage } from "../lib/forms";
import { useSite } from "../hooks/useSite";
import { socialLinks, telHref, waHref } from "../data/contact";
import { Honeypot } from "../components/forms/Honeypot";
import { Todo } from "../components/ui/Todo";
import "./Contact.css";

const SUBJECTS = [
    "A design or building project",
    "A template build",
    "Furniture or joinery",
    "Concrete supply",
    "Joining the community",
    "Academy courses",
    "Investing or partnering",
    "Something else",
];

/** The Contact page. Rendered by src/routes.jsx for /contact. */
export const Contact = () => {
    const { details } = useSite();
    usePageMeta("Contact", `Talk to Formcraft in Kampala: phone ${details.phone ?? ""}, email ${details.email ?? ""}, or send a message.`);
    const [status, setStatus] = useState("idle");
    const tel = telHref(details.phone);
    const wa = waHref(details.whatsapp);
    const socials = socialLinks(details);
    const [error, setError] = useState(null);

    const onSubmit = async (event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        setStatus("sending");
        setError(null);
        try {
            await sendMessage({ name: form.get("name"), email: form.get("email"), subject: form.get("subject"), body: form.get("body"), website: form.get("website") });
            setStatus("sent");
        } catch (e) {
            setError(e.message || "Something went wrong. Please try again, or call us.");
            setStatus("error");
        }
    };

    return (
        <div className="contact">
            <PageHero eyebrow="Contact" title="Talk to us." sheet="A304" seed={81} crumbs={[["/", "Home"], [null, "Contact"]]}
                lead="Tell us what you're planning — a home, a building, a piece of furniture or a partnership. We'll get back to you.">
                {tel && <a href={tel} className="btn btn-primary"><Icon name="phone" size={18} /> Call {details.phone}</a>}
                {wa && <a href={wa} className="btn btn-line" target="_blank" rel="noreferrer"><Icon name="chat" size={18} /> WhatsApp us</a>}
                {details.email && <a href={`mailto:${details.email}`} className="btn btn-line"><Icon name="mail" size={18} /> Email us</a>}
            </PageHero>
            <div className="wrap"><Todo as="p">TODO: confirm the reply time{details.whatsapp ? "" : " and the WhatsApp number"} (Admin → Site details).</Todo></div>

            <Section tone="sheet" seed={2}>
                <div className="grid-2">
                    {status === "sent" ? (
                        <div className="card card-pad stack" role="status" style={{ "--gap": "14px" }}>
                            <h2 className="h3">Message sent.</h2>
                            <p className="body">Thanks for getting in touch. We'll reply by email or phone.{details.phone ? ` Need us sooner? Call ${details.phone}.` : ""}</p>
                            <div className="row">
                                <Link to="/projects" className="btn btn-line btn-sm">See our work</Link>
                                <button type="button" className="btn btn-ink btn-sm" onClick={() => setStatus("idle")}>Send another</button>
                            </div>
                        </div>
                    ) : (
                        <form className="card card-pad form" onSubmit={onSubmit}>
                            <h2 className="h3">Send a message</h2>
                            <Honeypot />
                            <div className="form-row">
                                <div className="field">
                                    <label htmlFor="c-name">Name</label>
                                    <input id="c-name" name="name" autoComplete="name" required maxLength={120} />
                                </div>
                                <div className="field">
                                    <label htmlFor="c-email">Email</label>
                                    <input id="c-email" name="email" type="email" autoComplete="email" required maxLength={200} />
                                </div>
                            </div>
                            <div className="field">
                                <label htmlFor="c-subject">What's it about?</label>
                                <select id="c-subject" name="subject">
                                    {SUBJECTS.map((s) => <option key={s}>{s}</option>)}
                                </select>
                            </div>
                            <div className="field">
                                <label htmlFor="c-body">Message</label>
                                <textarea id="c-body" name="body" required maxLength={5000} />
                            </div>
                            {error && <p className="alert alert-error" role="alert">{error}</p>}
                            <div className="row">
                                <button type="submit" className="btn btn-primary" disabled={status === "sending"}>{status === "sending" ? "Sending…" : "Send"}</button>
                                <span className="fine">We use your details only to reply to you.</span>
                            </div>
                        </form>
                    )}

                    <div className="stack" style={{ "--gap": "18px" }}>
                        <div className="card contact-map" role="img" aria-label="Illustration: Formcraft is in Kampala">
                            <svg viewBox="0 0 400 240" aria-hidden="true">
                                <path className="contact-map-land" d="M0 150 C60 120 110 160 170 130 S280 90 400 120 V240 H0Z" />
                                <path className="contact-map-land2" d="M0 190 C80 170 150 200 220 175 S330 160 400 180 V240 H0Z" />
                                <path className="contact-map-road" d="M20 230 C120 170 220 160 380 40" />
                                <path className="contact-map-road" d="M0 110 C120 120 260 140 400 200" />
                            </svg>
                            <span className="contact-map-pin"><Icon name="pin" size={28} /></span>
                            <span className="tag contact-map-label">{details.address || "Kampala, Uganda"}</span>
                        </div>
                        <dl className="contact-list">
                            {/* Each row shows once its detail is set in Admin → Site details; until then only the team sees it */}
                            {tel ? <div><dt>Phone</dt><dd><a href={tel}>{details.phone}</a></dd></div> : <Todo as="div">TODO: phone number</Todo>}
                            {wa ? <div><dt>WhatsApp</dt><dd><a href={wa} target="_blank" rel="noreferrer">{details.whatsapp}</a></dd></div> : <Todo as="div">TODO: WhatsApp number</Todo>}
                            {details.email ? <div><dt>Email</dt><dd><a href={`mailto:${details.email}`}>{details.email}</a></dd></div> : <Todo as="div">TODO: public email address</Todo>}
                            {socials.map((s) => (
                                <div key={s.key}><dt>{s.label}</dt><dd><a href={s.href} target="_blank" rel="noreferrer">{s.text}</a></dd></div>
                            ))}
                            {details.hours ? <div><dt>Office hours</dt><dd>{details.hours}</dd></div> : <Todo as="div">TODO: office hours</Todo>}
                        </dl>
                    </div>
                </div>
            </Section>
        </div>
    );
};
