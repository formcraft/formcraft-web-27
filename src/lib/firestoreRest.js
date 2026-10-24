// Public Firestore reads over the REST API: a plain JSON request, so public pages don't have to
// download the Firestore SDK (~165 kB gzipped). Only collections the rules make public can be read
// this way. Admin writes and live listeners use the SDK through getDb().
import { app, firebaseConfigured } from "../config/firebase";
import { setServerOffset } from "./skyClock";

const env = import.meta.env;
const emulated = env.DEV && env.VITE_USE_EMULATORS === "true";

export const restReady = () => firebaseConfigured || emulated;

const root = () => {
    const path = `projects/${app.options.projectId}/databases/(default)/documents`;
    return emulated ? `http://localhost:8081/v1/${path}` : `https://firestore.googleapis.com/v1/${path}`;
};

const withKey = (url) => (emulated ? url : `${url}${url.includes("?") ? "&" : "?"}key=${app.options.apiKey}`);

// Firestore's typed JSON → plain values
export const decodeValue = (v) => {
    if (!v || typeof v !== "object") return null;
    if ("stringValue" in v) return v.stringValue;
    if ("integerValue" in v) return Number(v.integerValue);
    if ("doubleValue" in v) return v.doubleValue;
    if ("booleanValue" in v) return v.booleanValue;
    if ("nullValue" in v) return null;
    if ("timestampValue" in v) return v.timestampValue;
    if ("referenceValue" in v) return v.referenceValue;
    if ("geoPointValue" in v) return v.geoPointValue;
    if ("arrayValue" in v) return (v.arrayValue.values ?? []).map(decodeValue);
    if ("mapValue" in v) return decodeFields(v.mapValue.fields);
    return null;
};

export const decodeFields = (fields = {}) => Object.fromEntries(Object.entries(fields).map(([k, val]) => [k, decodeValue(val)]));

const decodeDoc = (d) => ({ id: d.name.split("/").pop(), ...decodeFields(d.fields) });

// One document, or null when it doesn't exist
export const getDocRest = async (path, signal) => {
    const res = await fetch(withKey(`${root()}/${path}`), { signal });
    if (res.headers.get("date")) setServerOffset(res.headers.get("date")); // Kampala sky clock
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`Firestore ${res.status}`);
    return decodeDoc(await res.json());
};

// A whole collection (up to `max` documents, following pages)
export const listRest = async (collection, signal, max = 500) => {
    const out = [];
    let token = "";
    do {
        const url = `${root()}/${collection}?pageSize=300${token ? `&pageToken=${encodeURIComponent(token)}` : ""}`;
        const res = await fetch(withKey(url), { signal });
        if (!res.ok) throw new Error(`Firestore ${res.status}`);
        const json = await res.json();
        (json.documents ?? []).forEach((d) => out.push(decodeDoc(d)));
        token = json.nextPageToken ?? "";
    } while (token && out.length < max);
    return out;
};

// Plain values → Firestore's typed JSON
export const encodeValue = (v) => {
    if (v == null) return { nullValue: null };
    if (typeof v === "boolean") return { booleanValue: v };
    if (typeof v === "number") return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
    if (typeof v === "string") return { stringValue: v };
    if (Array.isArray(v)) return { arrayValue: { values: v.map(encodeValue) } };
    if (typeof v === "object") return { mapValue: { fields: Object.fromEntries(Object.entries(v).filter(([, x]) => x !== undefined).map(([k, x]) => [k, encodeValue(x)])) } };
    return { stringValue: String(v) };
};

// Create a document with a random id and `createdAt` set by the server (like serverTimestamp()),
// over REST so public pages don't load the Firestore SDK just to log a click. Signed-out request:
// firestore.rules decide. `keepalive` lets it finish while the browser follows a link.
export const createDocRest = async (collection, data) => {
    const id = (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}${Math.random()}`).replace(/[^\w]/g, "").slice(0, 20);
    const base = root();
    const name = `${base.replace(/^https?:\/\/[^/]+\/v1\//, "")}/${collection}/${id}`;
    const body = {
        writes: [
            {
                update: { name, fields: encodeValue(data).mapValue.fields },
                updateTransforms: [{ fieldPath: "createdAt", setToServerValue: "REQUEST_TIME" }],
                currentDocument: { exists: false },
            },
        ],
    };
    const res = await fetch(withKey(`${base}:commit`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        keepalive: true,
    });
    if (!res.ok) throw new Error(`Firestore ${res.status}`);
    return id;
};
