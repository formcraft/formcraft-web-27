import { useEffect, useRef } from "react";
import { Icon } from "./Icon";
import "./Drawer.css";

// Side sheet (or centred panel with side="center") built on the native <dialog>:
// showModal() keeps focus inside, Escape closes it, and the browser returns focus
// to the button that opened it.
export const Drawer = ({ open, onClose, title, side = "right", children, footer, labelledBy }) => {
    const ref = useRef(null);

    useEffect(() => {
        const dialog = ref.current;
        if (!dialog) return;
        if (open && !dialog.open) dialog.showModal();
        if (!open && dialog.open) dialog.close();
    }, [open]);

    const onCancel = (event) => {
        event.preventDefault();
        onClose();
    };
    const onClick = (event) => {
        if (event.target === ref.current) onClose();
    };
    const titleId = labelledBy || `drawer-${title?.replace(/\W+/g, "-").toLowerCase()}`;

    return (
        <dialog ref={ref} className={`drawer drawer-${side}`} aria-labelledby={titleId} onCancel={onCancel} onClick={onClick}>
            <div className="drawer-panel">
                <div className="drawer-head">
                    <h2 id={titleId} className="h3">
                        {title}
                    </h2>
                    <button type="button" className="icon-btn" aria-label={`Close ${title}`} onClick={onClose}>
                        <Icon name="close" />
                    </button>
                </div>
                <div className="drawer-body">{children}</div>
                {footer && <div className="drawer-foot">{footer}</div>}
            </div>
        </dialog>
    );
};
