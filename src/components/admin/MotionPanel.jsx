// Admin → Motion: sliders for how fast the site's animations run (the opening, the tear, the home model's
// build, the page reveals). 1 = normal; saved in Firestore settings/site.motion and applied site-wide.
import { useState } from "react";
import { useSite } from "../../hooks/useSite";
import { useAuth } from "../../hooks/useAuth";
import { MOTION_FIELDS, MOTION_MAX, MOTION_MIN, applyMotion } from "../../data/motion";
import "./MotionPanel.css";

const seconds = (base, scale) => {
    const s = base * scale;
    return s < 10 ? `${s.toFixed(1)} s` : `${Math.round(s)} s`;
};

// Admin → Motion: how long the site's animations take (Firestore settings/site.motion).
// Dragging a slider previews the page animations straight away in this browser; Save keeps it for
// every visitor. The opening animation uses the saved value from a visitor's second visit on (it
// runs before the site has loaded anything, so a first visit uses the default).
export const MotionPanel = () => {
    const { motion, setMotion } = useSite();
    const { isAdmin } = useAuth();
    const [values, setValues] = useState(motion);
    const [busy, setBusy] = useState(false);
    const [note, setNote] = useState(null);

    const change = (key, value) => {
        const next = { ...values, [key]: Number(value) };
        setValues(next);
        if (key === "reveal") applyMotion({ ...motion, reveal: next.reveal }); // live preview of the page animations
    };

    const onSubmit = async (event) => {
        event.preventDefault();
        setBusy(true);
        setNote(null);
        try {
            await setMotion(values);
            setNote({ ok: true, text: "Saved. Visitors get the new timing on their next visit; the opening animation from their following visit." });
        } catch (e) {
            setNote({ ok: false, text: e.code === "permission-denied" ? "Firestore refused the change: this account isn't on the team yet." : e.message });
        } finally {
            setBusy(false);
        }
    };

    const replayIntro = () => {
        try {
            sessionStorage.removeItem("fc-intro");
            localStorage.setItem("fc-site-motion", JSON.stringify(values));
        } catch {
            /* storage blocked: the replay still works with the saved timing */
        }
        window.location.assign("/");
    };

    return (
        <form className="card card-pad form admin-editor motion-panel" onSubmit={onSubmit} aria-labelledby="motion-title">
            <div className="stack" style={{ "--gap": "6px" }}>
                <h3 className="h3" id="motion-title">Animation timing</h3>
                <p className="small">How long the site's animations take. 1× is the default; slide right to slow an animation down, left to speed it up. Visitors who ask their device for reduced motion never see these animations.</p>
            </div>
            {!isAdmin && <p className="alert">Only the team can change these.</p>}
            <div className="motion-panel-list">
                {MOTION_FIELDS.map((f) => (
                    <div className="field motion-panel-row" key={f.key}>
                        <label htmlFor={`mo-${f.key}`}>{f.label}</label>
                        <div className="motion-panel-control">
                            <input
                                id={`mo-${f.key}`}
                                type="range"
                                min={MOTION_MIN}
                                max={MOTION_MAX}
                                step={0.05}
                                value={values[f.key]}
                                onChange={(e) => change(f.key, e.target.value)}
                                aria-describedby={`mo-${f.key}-hint`}
                                aria-valuetext={`${values[f.key]} times, about ${seconds(f.base, values[f.key])}`}
                                disabled={!isAdmin}
                            />
                            <output htmlFor={`mo-${f.key}`} className="motion-panel-value">
                                <strong>{values[f.key].toFixed(2)}×</strong> <span>≈ {seconds(f.base, values[f.key])}</span>
                            </output>
                        </div>
                        <span className="hint" id={`mo-${f.key}-hint`}>{f.help}</span>
                    </div>
                ))}
            </div>
            {note && <p className={`alert ${note.ok ? "" : "alert-error"}`} role={note.ok ? "status" : "alert"}>{note.text}</p>}
            <div className="row">
                <button type="submit" className="btn btn-primary" disabled={busy || !isAdmin}>{busy ? "Saving…" : "Save timing"}</button>
                <button type="button" className="btn btn-line" onClick={() => setValues(Object.fromEntries(MOTION_FIELDS.map((f) => [f.key, 1])))} disabled={!isAdmin}>Back to defaults</button>
                <button type="button" className="btn btn-line" onClick={replayIntro}>Watch the opening on Home</button>
            </div>
        </form>
    );
};
