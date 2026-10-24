// Admin writes for site content. Only the team can write (firestore.rules / storage.rules check the
// `admin` claim or the marketing role); these helpers just shape the data. Loaded only on /admin.
import { getDb, getStorageService } from "../config/firebase";
import { CONTENT, slugify } from "../data/content";
import { refreshContent } from "../hooks/useContent";

const MAX_IMAGE = 8 * 1024 * 1024;
const MAX_FILE = 25 * 1024 * 1024;

const fs = () => Promise.all([getDb(), import("firebase/firestore")]);

// Form values → the document stored in Firestore, following the collection's field list
export const toDoc = (name, values) => {
    const out = {};
    CONTENT[name].fields.forEach((f) => {
        const v = values[f.name];
        switch (f.type) {
            case "ugx":
            case "number": {
                const n = v === "" || v == null ? null : Number(String(v).replace(/[^\d.-]/g, ""));
                out[f.name] = Number.isFinite(n) ? (f.type === "ugx" ? Math.round(n) : n) : null;
                break;
            }
            case "bool":
                out[f.name] = Boolean(v);
                break;
            case "tags":
                out[f.name] = Array.isArray(v) ? v : String(v ?? "").split(",").map((s) => s.trim()).filter(Boolean);
                break;
            case "images":
                out[f.name] = Array.isArray(v) ? v : [];
                break;
            case "file":
                out[f.name] = v ? String(v).trim() : null;
                break;
            default:
                out[f.name] = v == null ? "" : String(v).trim();
        }
    });
    out.slug = slugify(out.slug || out.title);
    return out;
};

// A stored item → form values
export const toForm = (name, item = {}) =>
    Object.fromEntries(
        CONTENT[name].fields.map((f) => {
            const v = item[f.name];
            if (f.type === "tags") return [f.name, (v ?? []).join(", ")];
            if (f.type === "bool") return [f.name, v ?? f.default ?? false];
            if (f.type === "images") return [f.name, v ?? []];
            if (f.type === "file") return [f.name, v ?? ""];
            return [f.name, v ?? f.default ?? ""];
        })
    );

export const saveItem = async (name, id, values) => {
    const [db, { doc, collection, setDoc, serverTimestamp }] = await fs();
    const data = toDoc(name, values);
    const ref = id ? doc(db, name, id) : doc(collection(db, name), data.slug || undefined);
    await setDoc(ref, { ...data, updatedAt: serverTimestamp() }, { merge: true });
    refreshContent(name);
    return ref.id;
};

export const deleteItem = async (name, id) => {
    const [db, { doc, deleteDoc }] = await fs();
    await deleteDoc(doc(db, name, id));
    refreshContent(name);
};

// Copy the starter data from src/data/ into Firestore, so the team can edit it in admin
export const importStarter = async (name) => {
    const [db, { doc, writeBatch, serverTimestamp }] = await fs();
    const items = await CONTENT[name].local();
    const batch = writeBatch(db);
    items.forEach((item) => {
        const data = toDoc(name, toForm(name, item));
        const id = item.slug || item.id || data.slug;
        batch.set(doc(db, name, id), { ...data, updatedAt: serverTimestamp() }, { merge: true });
    });
    await batch.commit();
    refreshContent(name);
    return items.length;
};

// Upload a photo to Storage public/content/<collection>/… and return its public URL
export const uploadImage = async (name, file) => {
    if (!file.type.startsWith("image/")) throw new Error("That isn't an image. Use JPG, PNG or WebP.");
    if (file.size > MAX_IMAGE) throw new Error("That image is over 8 MB. Save it smaller (about 1600 px wide) and try again.");
    const [storage, { ref, uploadBytes, getDownloadURL }] = await Promise.all([getStorageService(), import("firebase/storage")]);
    const path = `public/content/${name}/${Date.now()}-${file.name.replace(/[^\w.-]+/g, "_")}`;
    const r = ref(storage, path);
    await uploadBytes(r, file, { contentType: file.type, cacheControl: "public, max-age=31536000, immutable" });
    return getDownloadURL(r);
};

// Upload a download (PDF or image, up to 25 MB) to Storage public/content/<collection>/… → public URL
export const uploadFile = async (name, file) => {
    const ok = file.type === "application/pdf" || file.type.startsWith("image/");
    if (!ok) throw new Error("Upload a PDF or an image (JPG, PNG, WebP).");
    if (file.size > MAX_FILE) throw new Error("That file is over 25 MB. Make it smaller (export the PDF for screen) and try again.");
    const [storage, { ref, uploadBytes, getDownloadURL }] = await Promise.all([getStorageService(), import("firebase/storage")]);
    const path = `public/content/${name}/${Date.now()}-${file.name.replace(/[^\w.-]+/g, "_")}`;
    const r = ref(storage, path);
    await uploadBytes(r, file, { contentType: file.type, contentDisposition: `inline; filename="${file.name.replace(/[^\w.-]+/g, "_")}"`, cacheControl: "public, max-age=86400" });
    return getDownloadURL(r);
};

// Lead and inbox items (messages, quotes, investor leads, subscribers) — status set by admins and
// the marketing team (firestore.rules isMarketing())
export const setStatus = async (collectionName, id, status) => {
    const [db, { doc, updateDoc }] = await fs();
    await updateDoc(doc(db, collectionName, id), { status });
};
