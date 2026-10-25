import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { getConsent, initAnalytics, onConsentOpen, setConsent } from "../../lib/analytics";
import { useDeviceState } from "../../hooks/useHydration";
import "./ConsentBanner.css";

// Cookie consent: a small paper banner bottom-left on the first visit. Analytics (lib/analytics.js)
// loads only after "Accept". The answer is remembered; "Cookie settings" in the footer reopens it.
export const ConsentBanner = () => {
    const [open, setOpen] = useDeviceState(() => getConsent() === null, false); // after hydration (useHydration.js)
    const [reopened, setReopened] = useState(false);
    const acceptRef = useRef(null);

    useEffect(() => {
        initAnalytics(); // starts Analytics when they said yes on an earlier visit
        return onConsentOpen(() => {
            setReopened(true);
            setOpen(true);
        });
    }, [setOpen]);

    // when reopened from the footer, move focus into the banner so keyboard users land on it
    useEffect(() => {
        if (open && reopened) acceptRef.current?.focus();
    }, [open, reopened]);

    if (!open) return null;
    const answer = (yes) => {
        setConsent(yes);
        setOpen(false);
    };
    const current = getConsent();

    return (
        <section className="consent" aria-labelledby="consent-text">
            <p id="consent-text" className="small consent-text">
                We use cookies to see which pages help people find us. No ads.
                {current !== null && <span className="fine consent-now"> Right now: {current ? "accepted" : "declined"}.</span>}
            </p>
            <div className="consent-actions">
                <button ref={acceptRef} type="button" className="btn btn-ink btn-sm" onClick={() => answer(true)}>Accept</button>
                <button type="button" className="btn btn-line btn-sm" onClick={() => answer(false)}>No thanks</button>
                <Link to="/privacy" className="link consent-more">Privacy</Link>
            </div>
        </section>
    );
};
