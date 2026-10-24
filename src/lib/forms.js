// Form submissions. Field lists match firestore.rules: anyone may create, only admins read.
import { getDb, getStorageService, firebaseConfigured } from "../config/firebase";

const MAX_FILE = 20 * 1024 * 1024;

const assertReady = () => {
    if (!firebaseConfigured && import.meta.env.VITE_USE_EMULATORS !== "true") {
        throw new Error("Forms aren't connected yet. Please call +256 753 929 921 or email formcraftdesign@gmail.com.");
    }
};

const trim = (value, max) => String(value ?? "").trim().slice(0, max);

// Contact form → messages/{id}. Rules allow exactly these keys.
export const sendMessage = async ({ name, email, subject, body }) => {
    assertReady();
    const [db, { addDoc, collection, serverTimestamp }] = await Promise.all([getDb(), import("firebase/firestore")]);
    return addDoc(collection(db, "messages"), {
        name: trim(name, 120),
        email: trim(email, 200),
        subject: trim(subject, 200),
        body: trim(body, 5000),
        createdAt: serverTimestamp(),
    });
};

// Quote request → quotes/{id}, with an optional drawing uploaded first to quotes/{id}/
export const sendQuote = async ({ type, name, contact, location, budgetUGX, message, file }) => {
    assertReady();
    const [db, { collection, doc, serverTimestamp, setDoc }] = await Promise.all([getDb(), import("firebase/firestore")]);
    const quoteRef = doc(collection(db, "quotes"));
    const files = [];
    if (file) {
        if (file.size > MAX_FILE) throw new Error("That file is over 20 MB. Send a smaller one, or email it to us.");
        const path = `quotes/${quoteRef.id}/${file.name.replace(/[^\w.-]+/g, "_")}`;
        const [storage, { ref, uploadBytes }] = await Promise.all([getStorageService(), import("firebase/storage")]);
        await uploadBytes(ref(storage, path), file, { contentType: file.type });
        files.push(path);
    }
    const budget = Number(String(budgetUGX ?? "").replace(/\D/g, ""));
    await setDoc(quoteRef, {
        type: trim(type, 40),
        name: trim(name, 120),
        contact: trim(contact, 200),
        location: trim(location, 200),
        budgetUGX: Number.isSafeInteger(budget) && budget > 0 ? budget : null,
        message: trim(message, 5000),
        files,
        createdAt: serverTimestamp(),
    });
    return quoteRef.id;
};
