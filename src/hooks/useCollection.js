import { useEffect, useState } from "react";
import { getDb, firebaseConfigured } from "../config/firebase";

// Live Firestore query through the SDK (admin lists, signed-in pages). Returns
// { docs, loading, error } and unsubscribes on unmount. `build(fs, ref)` returns the query, so
// callers can add where()/orderBy() that match firestore.rules, e.g.
//   useCollection("orders", (fs, ref) => fs.query(ref, fs.where("uid", "==", uid)), [uid])
// Pass enabled=false to skip (e.g. until the user is known).
export const useCollection = (path, build, deps = [], enabled = true) => {
    const [state, setState] = useState({ docs: [], loading: enabled, error: null });
    useEffect(() => {
        if (!enabled || (!firebaseConfigured && import.meta.env.VITE_USE_EMULATORS !== "true")) {
            setState({ docs: [], loading: false, error: null });
            return undefined;
        }
        let unsubscribe = () => {};
        let cancelled = false;
        setState((s) => ({ ...s, loading: true }));
        Promise.all([getDb(), import("firebase/firestore")])
            .then(([db, fs]) => {
                if (cancelled) return;
                const ref = fs.collection(db, path);
                const q = build ? build(fs, ref) : ref;
                unsubscribe = fs.onSnapshot(
                    q,
                    (snap) => setState({ docs: snap.docs.map((d) => ({ id: d.id, ...d.data() })), loading: false, error: null }),
                    (error) => setState({ docs: [], loading: false, error })
                );
            })
            .catch((error) => setState({ docs: [], loading: false, error }));
        return () => {
            cancelled = true;
            unsubscribe();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [path, enabled, ...deps]);
    return state;
};
