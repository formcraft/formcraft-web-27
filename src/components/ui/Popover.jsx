import { useEffect, useId, useRef } from "react";
import { Icon } from "./Icon";
import "./Popover.css";

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

// A small card that opens from the button that owns it (anchorRef), without dimming the page.
// Focus moves into the card when it opens and Tab stays inside while it's open; Escape, the ×
// and a click outside close it. Focus goes back to the button after Escape or ×, and after an
// outside click that landed on nothing focusable (otherwise it stays where the visitor clicked).
// Placement comes from the class: "popover-corner" (default) sits bottom-right above a 50 px
// floating button; pass another class to place it elsewhere.
export const Popover = ({ open, onClose, anchorRef, title, children, footer, placement = "corner", className = "" }) => {
    const ref = useRef(null);
    const reason = useRef(null);
    const wasOpen = useRef(false);
    const titleId = `popover-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
    const onCloseRef = useRef(onClose);
    useEffect(() => {
        onCloseRef.current = onClose;
    });

    // move focus in on open; give it back to the button on close
    useEffect(() => {
        if (open) {
            wasOpen.current = true;
            ref.current?.focus({ preventScroll: true });
            return;
        }
        if (!wasOpen.current) return;
        wasOpen.current = false;
        const why = reason.current;
        reason.current = null;
        const active = document.activeElement;
        if (why === "escape" || why === "button" || (why === "outside" && (!active || active === document.body))) anchorRef?.current?.focus();
    }, [open, anchorRef]);

    // Escape and clicks outside (the owning button toggles by itself, so it's ignored here)
    useEffect(() => {
        if (!open) return undefined;
        const close = (why) => {
            reason.current = why;
            onCloseRef.current();
        };
        const onKey = (e) => {
            if (e.key === "Escape") {
                e.stopPropagation();
                close("escape");
            }
        };
        const onClick = (e) => {
            const t = e.target;
            if (ref.current?.contains(t) || anchorRef?.current?.contains(t)) return;
            close("outside");
        };
        document.addEventListener("keydown", onKey);
        document.addEventListener("click", onClick);
        return () => {
            document.removeEventListener("keydown", onKey);
            document.removeEventListener("click", onClick);
        };
    }, [open, anchorRef]);

    // keep Tab inside the card
    const onKeyDown = (e) => {
        if (e.key !== "Tab" || !ref.current) return;
        const items = [...ref.current.querySelectorAll(FOCUSABLE)].filter((el) => el.offsetParent !== null || el === document.activeElement);
        if (!items.length) {
            e.preventDefault();
            return;
        }
        const first = items[0];
        const last = items[items.length - 1];
        const active = document.activeElement;
        if (e.shiftKey && (active === first || active === ref.current)) {
            e.preventDefault();
            last.focus();
        } else if (!e.shiftKey && active === last) {
            e.preventDefault();
            first.focus();
        }
    };

    if (!open) return null;
    return (
        <div ref={ref} role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1} className={`popover popover-${placement} ${className}`.trim()} onKeyDown={onKeyDown}>
            <div className="popover-head">
                <h2 id={titleId} className="popover-title">
                    {title}
                </h2>
                <button
                    type="button"
                    className="icon-btn popover-close"
                    aria-label={`Close ${title}`}
                    onClick={() => {
                        reason.current = "button";
                        onClose();
                    }}
                >
                    <Icon name="close" size={18} />
                </button>
            </div>
            <div className="popover-body">{children}</div>
            {footer && <div className="popover-foot">{footer}</div>}
        </div>
    );
};
