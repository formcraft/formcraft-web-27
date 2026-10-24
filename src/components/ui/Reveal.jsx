import { useReveal } from "../../hooks/useReveal";

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

// Splits a line into words that rise one after another (hero headlines)
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
