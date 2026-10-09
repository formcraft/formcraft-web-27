import {auth} from "../config/firebase";
import {signInWithPopup, GoogleAuthProvider} from "firebase/auth";
import "./auth.css";

export const Auth =() => {
    const handleGoogleSignIn = async () => {
        try {
            const provider = new GoogleAuthProvider();
            await signInWithPopup(auth, provider);
        } catch (error) {
            console.error("Error signing in with Google:", error);
        }
    };

    return (
        <div className="auth-overlay">
            <div className="auth-box">
                <div className="auth-message">Welcome to FormCraft</div>
                <p className="auth-description">Please sign in to continue</p>
                <button 
                    onClick={handleGoogleSignIn}
                    className="auth-button"
                >
                    Sign in with Google
                </button>
            </div>
        </div>
    );

};