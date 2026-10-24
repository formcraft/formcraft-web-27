import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { readJSON, writeJSON } from "../../lib/storage";
import { getConsent } from "../../lib/analytics";
import { SubscribeForm } from "./SubscribeForm";
import { Icon } from "../ui/Icon";
import "./SubscribePrompt.css";

// A small paper slip that slides up in the bottom-right corner, just above the plant-a-tree button, once a visitor has read more than half of
// a long page (≥ 2.5 screens tall, scrolled 55 %). At most once every 14 days, never for people who
// already subscribed, never while the cookie banner is up, and never on team, account, checkout,
// sign-in or link-in-bio pages. It doesn't take focus; × or Escape closes it. It tucks itself away
// while the footer (which has its own sign-up form) or any form on the page is on screen, so it never
// covers a form someone is filling in.
const KEY = "fc-subscribe-prompt";
const EVERY = 14 * 24 * 60 * 60 * 1000;
const SKIP = [/^\/admin/, /^\/account/, /^\/checkout/, /^\/sign-in/, /^\/links/, /^\/privacy/];

const allowed = () => {
    if (readJSON("fc-subscribed", null)) return false;
    const last = Date.parse(readJSON(KEY, null)?.at ?? "");
    return !(Number.isFinite(last) && Date.now() - last < EVERY);
};

/** The small email sign-up slip that slides up on long pages (rules in the comment above). Rendered once by Layout.jsx. */
export const SubscribePrompt = () => {
    const { pathname } = useLocation();
    const [open, setOpen] = useState(false);
    const [inTheWay, setInTheWay] = useState(false);

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

    // step aside while the footer (it has its own sign-up) or a form on the page is on screen
    useEffect(() => {
        const watched = document.querySelectorAll(".footer, main form");
        if (!open || !watched.length || typeof IntersectionObserver === "undefined") return undefined;
        const showing = new Set();
        const io = new IntersectionObserver((entries) => {
            for (const e of entries) {
                if (e.isIntersecting) showing.add(e.target);
                else showing.delete(e.target);
            }
            setInTheWay(showing.size > 0);
        });
        watched.forEach((el) => io.observe(el));
        return () => io.disconnect();
    }, [open, pathname]);

    if (!open) return null;
    return (
        <aside className={`subscribe-prompt ${inTheWay ? "is-tucked" : ""}`} aria-labelledby="subscribe-prompt-title" inert={inTheWay}>
            <button type="button" className="icon-btn subscribe-prompt-close" onClick={() => setOpen(false)} aria-label="Close the email sign-up">
                <Icon name="close" size={18} />
            </button>
            <p className="h4" id="subscribe-prompt-title">Keep up with Formcraft</p>
            <p className="small subscribe-prompt-text">New template homes, Journal stories and workshop dates, now and then by email.</p>
            <SubscribeForm variant="inline" />
        </aside>
    );
};
