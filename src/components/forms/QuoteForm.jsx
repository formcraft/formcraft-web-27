import { useState } from "react";
import { Link } from "react-router-dom";
import { sendQuote } from "../../lib/forms";
import { Icon } from "../ui/Icon";
import { Honeypot } from "./Honeypot";
import { SubscribeForm } from "./SubscribeForm";
import { Todo } from "../ui/Todo";
import "./Forms.css";

// Request a proposal. Saves to Firestore `quotes` (plus an optional drawing in Storage).
export const QuoteForm = ({ types, defaultType, heading = "Tell us about the plot.", intro, idPrefix = "quote" }) => {
    const [status, setStatus] = useState("idle"); // idle | sending | sent | error
    const [error, setError] = useState(null);

    const onSubmit = async (event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        setStatus("sending");
        setError(null);
        try {
            await sendQuote({
                type: form.get("type"),
                name: form.get("name"),
                contact: form.get("contact"),
                location: form.get("location"),
                budgetUGX: form.get("budget"),
                message: form.get("message"),
                file: form.get("file")?.size ? form.get("file") : null,
                website: form.get("website"),
            });
            setStatus("sent");
        } catch (e) {
            setError(e.message || "Something went wrong. Please try again, or call us.");
            setStatus("error");
        }
    };

    if (status === "sent") {
        return (
            <div className="card card-pad forms-sent" role="status">
                <span className="checklist">
                    <span className="tick"><Icon name="check" size={16} /></span>
                </span>
                <h3 className="h3">Request sent.</h3>
                <p className="body">Thanks — we'll call you to book a site visit and talk through your plot. <Todo>TODO: confirm reply time</Todo></p>
                <div className="row">
                    <Link to="/projects" className="btn btn-line btn-sm">See our work</Link>
                    <button type="button" className="btn btn-ink btn-sm" onClick={() => setStatus("idle")}>Send another</button>
                </div>
                <hr className="rule" />
                <SubscribeForm variant="inline" heading="Want our template home catalogue?" intro="We'll email it to you, along with new designs as they're released." download="template-catalogue" button="Send it to me" />
            </div>
        );
    }

    const id = (name) => `${idPrefix}-${name}`;
    return (
        <form className="card card-pad form" onSubmit={onSubmit} noValidate={false}>
            <Honeypot />
            <div className="stack" style={{ "--gap": "8px" }}>
                <h3 className="h3">{heading}</h3>
                {intro && <p className="small">{intro}</p>}
            </div>
            <div className="form-row">
                <div className="field">
                    <label htmlFor={id("name")}>Your name</label>
                    <input id={id("name")} name="name" autoComplete="name" required maxLength={120} />
                </div>
                <div className="field">
                    <label htmlFor={id("contact")}>Phone or email</label>
                    <input id={id("contact")} name="contact" autoComplete="tel" required maxLength={200} />
                </div>
            </div>
            <div className="field">
                <label htmlFor={id("type")}>Project type</label>
                <select id={id("type")} name="type" defaultValue={defaultType}>
                    {types.map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                    ))}
                </select>
            </div>
            <div className="form-row">
                <div className="field">
                    <label htmlFor={id("location")}>Plot location</label>
                    <input id={id("location")} name="location" maxLength={200} />
                </div>
                <div className="field">
                    <label htmlFor={id("budget")}>Construction budget (UGX, optional)</label>
                    <input id={id("budget")} name="budget" inputMode="numeric" placeholder="e.g. 250,000,000" />
                </div>
            </div>
            <div className="field">
                <label htmlFor={id("message")}>What are you planning?</label>
                <textarea id={id("message")} name="message" maxLength={5000} />
            </div>
            <div className="field">
                <label htmlFor={id("file")}>Land title, sketches or photos (optional)</label>
                <input id={id("file")} name="file" type="file" accept="application/pdf,image/*" />
                <span className="hint">PDF or image, up to 20 MB.</span>
            </div>
            {error && <p className="alert alert-error" role="alert">{error}</p>}
            <div className="row">
                <button type="submit" className="btn btn-primary" disabled={status === "sending"}>
                    {status === "sending" ? "Sending…" : "Send request"}
                </button>
                <span className="fine">We use your details only to reply to you.</span>
            </div>
        </form>
    );
};
