// Admin → Features: switch site features on and off (src/data/features.js), saved in Firestore
// settings/site.features. A feature that needs another one is greyed out while its parent is off.
// Reuses the switch look of Admin → Pages (.admin-switch in Admin.css).
import { useState } from "react";
import { FEATURES, FEATURE_GROUPS } from "../../data/features";
import { useSite } from "../../hooks/useSite";

/** Admin → Features (team): on/off switches for the site's optional features. */
export const FeaturesPanel = () => {
    const { features, setFeature } = useSite();
    const [pending, setPending] = useState(null);
    const [error, setError] = useState(null);

    const toggle = async (key, on) => {
        setPending(key);
        setError(null);
        try {
            await setFeature(key, on);
        } catch (e) {
            setError(e.code === "permission-denied" ? "Firestore refused the change: this account isn't on the team yet." : e.message);
        } finally {
            setPending(null);
        }
    };

    return (
        <div className="stack" style={{ "--gap": "22px" }}>
            <div className="stack" style={{ "--gap": "6px" }}>
                <h3 className="h3">Features</h3>
                <p className="small">
                    Switch parts of the site on or off for every visitor. Changes reach visitors on their next page load. The cookie notice, accessibility and security can’t be switched off.
                </p>
            </div>
            {error && <p className="alert alert-error" role="alert">{error}</p>}
            {FEATURE_GROUPS.map((group) => (
                <fieldset key={group} className="admin-pages">
                    <legend className="eyebrow">{group}</legend>
                    {FEATURES.filter((f) => f.group === group).map((f) => {
                        const on = features[f.key] !== false;
                        const parentOff = f.needs && features[f.needs] === false;
                        const parent = f.needs ? FEATURES.find((p) => p.key === f.needs) : null;
                        const id = `feature-${f.key}`;
                        return (
                            <div key={f.key} className={`admin-page-row ${parentOff ? "is-dim" : ""}`}>
                                <div className="stack" style={{ "--gap": "2px" }}>
                                    <label htmlFor={id}><strong>{f.label}</strong></label>
                                    <span className="fine" id={`${id}-help`}>
                                        {f.help}
                                        {f.note ? ` ${f.note}` : ""}
                                        {parentOff ? ` Needs “${parent.label}”, which is off.` : ""}
                                    </span>
                                </div>
                                <button
                                    id={id}
                                    type="button"
                                    role="switch"
                                    aria-checked={on}
                                    aria-describedby={`${id}-help`}
                                    className="admin-switch"
                                    disabled={pending === f.key || parentOff}
                                    onClick={() => toggle(f.key, !on)}
                                >
                                    <span className="admin-switch-knob" aria-hidden="true" />
                                    <span className="admin-switch-text">{on ? "On" : "Off"}</span>
                                </button>
                            </div>
                        );
                    })}
                </fieldset>
            ))}
        </div>
    );
};
