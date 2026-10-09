import { useEffect, useRef, useState } from "react";
import "./SignInDialog.css";

// Native <dialog> opened with showModal(): the browser keeps focus inside it
// and fires "cancel" on Escape, which we treat as a close.
export const SignInDialog = ({ onSignIn, onClose }) => {
    const dialogRef = useRef(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const dialog = dialogRef.current;
        dialog.showModal();
        return () => dialog.close();
    }, []);

    const handleCancel = (event) => {
        event.preventDefault();
        onClose();
    };

    // A click on the backdrop lands on the <dialog> element itself
    const handleBackdropClick = (event) => {
        if (event.target === dialogRef.current) onClose();
    };

    const handleGoogleSignIn = async () => {
        setBusy(true);
        setError(null);
        const message = await onSignIn();
        setBusy(false);
        if (message) setError(message);
    };

    return (
        <dialog
            ref={dialogRef}
            className="auth-dialog"
            aria-labelledby="auth-dialog-title"
            onCancel={handleCancel}
            onClick={handleBackdropClick}
        >
            <div className="auth-box">
                <button type="button" className="auth-close" aria-label="Close sign-in" onClick={onClose}>
                    ×
                </button>
                <h2 id="auth-dialog-title" className="auth-message">Sign in to Formcraft</h2>
                <p className="auth-description">
                    Sign in to see your orders, join the community and manage your account.
                </p>
                <button type="button" className="auth-button" onClick={handleGoogleSignIn} disabled={busy}>
                    {busy ? "Signing in…" : "Sign in with Google"}
                </button>
                {error && (
                    <p className="auth-error" role="alert">
                        {error}
                    </p>
                )}
            </div>
        </dialog>
    );
};
