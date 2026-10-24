import { useCallback, useEffect, useMemo, useState } from "react";
import { AuthContext } from "./contexts";
import { onAuthStateChanged, signInWithPopup, signOut as firebaseSignOut, GoogleAuthProvider } from "firebase/auth";
import { auth, getFunctionsService } from "../config/firebase";
import { SignInDialog } from "../components/auth/SignInDialog";


// Firebase error codes that mean "the visitor changed their mind", not a failure
const CANCELLED = ["auth/popup-closed-by-user", "auth/cancelled-popup-request"];

const friendlyError = (error) => {
    switch (error?.code) {
        case "auth/popup-blocked":
            return "Your browser blocked the sign-in window. Allow pop-ups for this site and try again.";
        case "auth/network-request-failed":
            return "We couldn't reach the sign-in service. Check your connection and try again.";
        default:
            return "Sign-in didn't work. Please try again.";
    }
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [role, setRole] = useState(null); // "admin" | "marketing" | "editor" | null (team roles, custom claims)
    const [loading, setLoading] = useState(true);
    const [signInOpen, setSignInOpen] = useState(false);

    useEffect(() => {
        return onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                setSignInOpen(false);
                let token = await currentUser.getIdTokenResult();
                // Team members added in Admin → Team pick up their role on sign-in (Cloud Function
                // claimTeamRole); only when functions are deployed (VITE_FUNCTIONS_ENABLED=true).
                if (import.meta.env.VITE_FUNCTIONS_ENABLED === "true" && !token.claims.role && !token.claims.admin) {
                    try {
                        const [functions, { httpsCallable }] = await Promise.all([getFunctionsService(), import("firebase/functions")]);
                        const { data } = await httpsCallable(functions, "claimTeamRole")();
                        if (data?.role) token = await currentUser.getIdTokenResult(true);
                    } catch (error) {
                        console.warn("Couldn't check team role.", error);
                    }
                }
                const admin = token.claims.admin === true;
                setIsAdmin(admin);
                setRole(admin ? "admin" : token.claims.role ?? null);
            } else {
                setIsAdmin(false);
                setRole(null);
            }
            setLoading(false);
        });
    }, []);

    // Returns null on success or when the visitor closes the popup; a message they can read otherwise
    const signIn = useCallback(async () => {
        try {
            await signInWithPopup(auth, new GoogleAuthProvider());
            return null;
        } catch (error) {
            if (CANCELLED.includes(error.code)) return null;
            console.error("Error signing in with Google:", error);
            return friendlyError(error);
        }
    }, []);

    const signOut = useCallback(() => firebaseSignOut(auth), []);
    const openSignIn = useCallback(() => setSignInOpen(true), []);
    const closeSignIn = useCallback(() => setSignInOpen(false), []);

    const value = useMemo(
        () => ({
            user,
            isAdmin,
            role,
            // marketing team (studio, leads, content) and editors (drafts) — admins can do both
            isMarketing: isAdmin || role === "marketing",
            isEditor: isAdmin || role === "marketing" || role === "editor",
            loading,
            signIn,
            signOut,
            openSignIn,
        }),
        [user, isAdmin, role, loading, signIn, signOut, openSignIn]
    );

    return (
        <AuthContext.Provider value={value}>
            {children}
            {signInOpen && <SignInDialog onSignIn={signIn} onClose={closeSignIn} />}
        </AuthContext.Provider>
    );
};

