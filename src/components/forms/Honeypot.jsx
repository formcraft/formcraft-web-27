import "./Honeypot.css";

// A field people never see or reach. Bots that fill in every input fill this one too, and
// lib/forms.js then pretends the form was sent without saving anything. Read it with
// new FormData(form).get("website").
export const Honeypot = () => (
    <div className="honeypot" aria-hidden="true">
        <label>
            Leave this empty
            <input type="text" name="website" tabIndex={-1} autoComplete="off" defaultValue="" />
        </label>
    </div>
);
