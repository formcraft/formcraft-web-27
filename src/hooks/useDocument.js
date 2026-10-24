import { useEffect, useState } from "react";
import { getDb, firebaseConfigured } from "../config/firebase";

// Live Firestore document. Returns { data, loading, error }; unsubscribes on unmount.
// Firestore loads on first use. Without a Firebase config (and no emulators) it returns no data.
export const useDocument = (path) => {
    const [state, setState] = useState({ data: null, loading: true, error: null });
    useEffect(() => {
        if (!firebaseConfigured && import.meta.env.VITE_USE_EMULATORS !== "true") {
            setState({ data: null, loading: false, error: null });
            return undefined;
        }
        let unsubscribe = () => {};
        let cancelled = false;
        Promise.all([getDb(), import("firebase/firestore")])
            .then(([db, { doc, onSnapshot }]) => {
                if (cancelled) return;
                unsubscribe = onSnapshot(
                    doc(db, path),
                    (snap) => setState({ data: snap.exists() ? snap.data() : null, loading: false, error: null }),
                    (error) => setState({ data: null, loading: false, error })
                );
            })
            .catch((error) => setState({ data: null, loading: false, error }));
        return () => {
            cancelled = true;
            unsubscribe();
        };
    }, [path]);
    return state;
};
