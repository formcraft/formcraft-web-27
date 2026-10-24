// useAuth(): who is signed in. A "hook" is a function components call to read shared information.
// See src/context/AuthContext.jsx for where this information comes from.
import { useContext } from "react";
import { AuthContext } from "../context/contexts";

/**
 * @returns {{ user: object|null, isAdmin: boolean, role: "admin"|"marketing"|"editor"|null,
 *   isMarketing: boolean, isEditor: boolean, loading: boolean,
 *   signIn: () => Promise<string|null>, signOut: () => Promise<void>, openSignIn: () => void }}
 *   user is null when nobody is signed in; loading is true until Firebase has answered once.
 *   signIn returns null on success, or a message to show the visitor.
 */
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth must be used inside <AuthProvider>");
    return context;
};
