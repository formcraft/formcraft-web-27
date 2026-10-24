import { useState } from "react";

// Copies text to the clipboard and says so for a moment (falls back to a prompt if blocked)
export const CopyButton = ({ text, label = "Copy", className = "btn btn-line btn-sm", disabled }) => {
    const [done, setDone] = useState(false);
    const copy = async () => {
        try {
            await navigator.clipboard.writeText(text);
        } catch {
            window.prompt("Copy this:", text);
        }
        setDone(true);
        setTimeout(() => setDone(false), 1800);
    };
    return (
        <button type="button" className={className} onClick={copy} disabled={disabled || !text}>
            <span aria-live="polite">{done ? "Copied" : label}</span>
        </button>
    );
};
