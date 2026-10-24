// Scroll animations for page content.
// <Reveal> fades and lifts its content into place the first time it scrolls into view.
// <Kinetic> makes a headline's words rise one after another (used in page heroes).
// Both respect "reduce motion" (base.css switches the animations off) and Admin → Motion speed.
import { useReveal } from "../../hooks/useReveal";

/**
 * Wraps content that should animate in when it scrolls into view.
 * @param {object} props
 * @param {string|import("react").ElementType} [props.as="div"]  which element to render (e.g. "li", "section")
 * @param {number} [props.delay=0]  extra delay in seconds, to stagger items in a row
 * @param {string} [props.className]
 * @param {object} [props.style]
 * Any other props (id, aria-*, …) are passed to the element.
 */
export const Reveal = ({ as: Tag = "div", delay = 0, className = "", style, children, ...rest }) => {
    const [ref, inView] = useReveal();
    return (
        <Tag
            ref={ref}
            className={`reveal ${inView ? "is-in" : ""} ${className}`.trim()}
            style={delay ? { ...style, "--delay": `${delay}s` } : style}
            {...rest}
        >
            {children}
        </Tag>
    );
};

/**
 * Splits a line into words that rise one after another (hero headlines).
 * @param {object} props
 * @param {string} props.text      the headline text
 * @param {number} [props.start=0] how many word-steps to wait first (to follow another Kinetic line)
 * @param {string} [props.className]
 */
export const Kinetic = ({ text, start = 0, className = "" }) => (
    <span className={`kinetic ${className}`.trim()}>
        {text.split(" ").map((word, i) => (
            <span key={`${word}-${i}`}>
                <span className="word" style={{ "--i": start + i }}>
                    {word}
                </span>{" "}
            </span>
        ))}
    </span>
);
