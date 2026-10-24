import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { readJSON, writeJSON } from "../../lib/storage";
import { getConsent } from "../../lib/analytics";
import { SubscribeForm } from "./SubscribeForm";
import { Icon } from "../ui/Icon";
import "./SubscribePrompt.css";

// A small paper slip that slides up from the bottom-left once a visitor has read more than half of
// a long page (≥ 2.5 screens tall, scrolled 55 %). At most once every 14 days, never for people who
// already subscribed, never while the cookie banner is up, and never on team, account, checkout,
// sign-in or link-in-bio pages. It doesn't take focus; × or Escape closes it.
const KEY = "fc-subscribe-prompt";
const EVERY = 14 * 24 * 60 * 60 * 1000;
const SKIP = [/^\/admin/, /^\/account/, /^\/checkout/, /^\/sign-in/, /^\/links/, /^\/privacy/];

const allowed = () => {
    if (readJSON("fc-subscribed", null)) return false;
    const last = Date.parse(readJSON(KEY, null)?.at ?? "");
    return !(Number.isFinite(last) && Date.now() - last < EVERY);
};

export const SubscribePrompt = () => {
    const { pathname } = useLocation();
    const [open, setOpen] = useState(false);

    useEffect(() => {
        if (open || SKIP.some((re) => re.test(pathname)) || !allowed()) return undefined;
        let frame = 0;
        const check = () => {
            frame = 0;
            const doc = document.documentElement;
            const long = doc.scrollHeight >= window.innerHeight * 2.5;
            const room = doc.scrollHeight - window.innerHeight;
            if (!long || room <= 0 || window.scrollY / room < 0.55) return;
            if (getConsent() === null || !allowed()) return; // the cookie banner is still up
            writeJSON(KEY, { at: new Date().toISOString() });
            setOpen(true);
        };
        const onScroll = () => {
            if (!frame) frame = requestAnimationFrame(check);
        };
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => {
            window.removeEventListener("scroll", onScroll);
            if (frame) cancelAnimationFrame(frame);
        };
    }, [pathname, open]);

    // close when leaving for a page where it shouldn't show
    useEffect(() => {
        if (SKIP.some((re) => re.test(pathname))) setOpen(false);
    }, [pathname]);

    useEffect(() => {
        if (!open) return undefined;
        const onKey = (event) => {
            // leave Escape to an open dialog (cart, menu) first
            if (event.key === "Escape" && !document.querySelector("dialog[open]")) setOpen(false);
        };
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [open]);

    if (!open) return null;
    return (
        <aside className="subscribe-prompt" aria-labelledby="subscribe-prompt-title">
            <button type="button" className="icon-btn subscribe-prompt-close" onClick={() => setOpen(false)} aria-label="Close the email sign-up">
                <Icon name="close" size={18} />
            </button>
            <p className="h4" id="subscribe-prompt-title">Keep up with Formcraft</p>
            <p className="small subscribe-prompt-text">New template homes, Journal stories and workshop dates, now and then by email.</p>
            <SubscribeForm variant="inline" />
        </aside>
    );
};
