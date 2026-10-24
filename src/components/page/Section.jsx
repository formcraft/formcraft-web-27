import { TornEdge } from "../ui/TornEdge";

// A sheet of paper laid over the one before it: torn top edge, its own surface.
// tone: "ground" (page paper), "sheet" (lighter card paper), "dark" (navy/black), "orange"
export const Section = ({ tone = "ground", seed = 1, id, className = "", torn = true, small = false, children, ...rest }) => (
    <section id={id} className={`${small ? "section-s" : "section"} paper-${tone} ${className}`.trim()} {...rest}>
        {torn && <TornEdge seed={seed} />}
        <div className="wrap">{children}</div>
    </section>
);

/**
 * A section's heading block: small label, big heading, and an optional sentence or link.
 * @param {{ eyebrow?: string, title: string, children?: import("react").ReactNode, align?: "between"|"center" }} props  align "center" stacks and centres it
 */
export const SectionHead = ({ eyebrow, title, children, align = "between" }) => (
    <div className={align === "between" ? "between" : "stack center"} style={{ marginBottom: "clamp(32px, 4vw, 56px)" }}>
        <div className="stack mw" style={{ "--gap": "16px", "--mw": "720px" }}>
            {eyebrow && <p className="eyebrow">{eyebrow}</p>}
            <h2 className="h2">{title}</h2>
        </div>
        {children && <div className="mw body" style={{ "--mw": "400px" }}>{children}</div>}
    </div>
);
