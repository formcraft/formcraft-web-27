import { useEffect } from "react";
import { useDeviceState } from "./useHydration";
import { getDocRest, restReady } from "../lib/firestoreRest";
import { readJSON, writeJSON } from "../lib/storage";

// A public Firestore document read once over REST (no Firestore SDK download), cached in
// localStorage so it shows instantly next visit. Use useDocument for live updates instead.
export const usePublicDoc = (path) => {
    const key = `fc-doc-${path}`;
    const [data, setData] = useDeviceState(() => readJSON(key, null), null); // after hydration (useHydration.js)
    useEffect(() => {
        if (!restReady()) return undefined;
        const controller = new AbortController();
        getDocRest(path, controller.signal)
            .then((doc) => {
                setData(doc);
                writeJSON(key, doc);
            })
            .catch(() => {});
        return () => controller.abort();
    }, [path, key, setData]);
    return { data };
};
