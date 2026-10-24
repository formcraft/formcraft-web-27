import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db, firebaseConfigured } from "../config/firebase";

// Live Firestore document. Returns { data, loading, error }; unsubscribes on unmount.
// Without a Firebase config (and no emulators) it returns no data instead of failing.
export const useDocument = (path) => {
    const [state, setState] = useState({ data: null, loading: true, error: null });
    useEffect(() => {
        if (!firebaseConfigured && import.meta.env.VITE_USE_EMULATORS !== "true") {
            setState({ data: null, loading: false, error: null });
            return undefined;
        }
        return onSnapshot(
            doc(db, path),
            (snap) => setState({ data: snap.exists() ? snap.data() : null, loading: false, error: null }),
            (error) => setState({ data: null, loading: false, error })
        );
    }, [path]);
    return state;
};
