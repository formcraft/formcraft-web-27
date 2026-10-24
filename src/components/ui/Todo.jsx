// <Todo> and <Fact>: how missing facts appear on the site (see src/lib/pending.js for the why).
//
// Visitors never see raw "TODO" notes: they see a neutral, true fallback that you pass in, or nothing.
// Signed-in team members (admins, marketing, editors) see the note highlighted as "To fill in: …",
// so walking through the live site shows exactly which facts are still needed.
//
// Examples:
//   <Todo>TODO: planting partner and price per tree.</Todo>          → visitors: nothing
//   <Todo fallback="Details on request.">TODO: delivery areas</Todo>  → visitors: "Details on request."
//   <Fact text={project.summary} fallback={null} />                   → the summary, or the fallback
//   <Fact as="p" className="body" text={product.description} />       → wraps real text in a <p class="body">
import { useAuth } from "../../hooks/useAuth";
import { isPending, pendingNote, splitPending } from "../../lib/pending";
import "./Todo.css";

/**
 * Wraps a "to fill in" note.
 * @param {object} props
 * @param {import("react").ReactNode} props.children  the note, usually starting with "TODO:"
 * @param {import("react").ReactNode} [props.fallback=null]  what visitors see instead (null = nothing)
 * @param {import("react").ElementType} [props.as="span"]   the element for the team's note
 */
export const Todo = ({ children, fallback = null, as: Tag = "span" }) => {
    const { isEditor } = useAuth();
    if (!isEditor) return fallback;
    const note = typeof children === "string" ? pendingNote(children) : children;
    return (
        <Tag className="todo-note" title="Only signed-in team members see this">
            To fill in: {note}
        </Tag>
    );
};

/**
 * Text that's real up to a TODO: visitors see the real part; the team also sees the note after it.
 * @param {{ text: string }} props
 * @example <PartFact text="A better layout means a new version. TODO: whether buyers get updates." />
 */
export const PartFact = ({ text }) => {
    const [real, todo] = splitPending(text);
    return (
        <>
            {real}
            {todo && (
                <>
                    {real ? " " : ""}
                    <Todo>{todo}</Todo>
                </>
            )}
        </>
    );
};

/**
 * Shows a piece of content that may still be a placeholder (from the data files or Firestore).
 * Real text is shown as is (wrapped in `as` when given); a placeholder becomes a <Todo>.
 * @param {object} props
 * @param {string|null|undefined} props.text
 * @param {import("react").ReactNode} [props.fallback=null]  what visitors see when the text is missing
 * @param {import("react").ElementType} [props.as]          optional wrapper element, e.g. "p"
 * @param {string} [props.className]                        class for the wrapper
 */
export const Fact = ({ text, fallback = null, as: Tag, className }) => {
    if (text == null || text === "") return fallback;
    if (isPending(text)) {
        return (
            <Todo fallback={fallback} as={Tag ?? "span"}>
                {text}
            </Todo>
        );
    }
    return Tag ? <Tag className={className}>{text}</Tag> : text;
};
