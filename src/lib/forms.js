// Form submissions. Every lead carries `source` (where the visitor came from, lib/attribution.js)
// and `page` (where they sent it from).
//
// Two ways to save, picked at build time:
// - VITE_FORMS_VIA_FUNCTIONS=true: through the callable Cloud Function `submitLead` (App Check,
//   validation, rate limits; functions/index.js). Quote drawings still go to Storage first.
// - otherwise: straight to Firestore. Field lists match firestore.rules: anyone may create, only the
//   team reads.
//
// Spam: every form has a hidden "website" field (components/forms/Honeypot.jsx). People never see
// it; bots fill it in. If it has a value we pretend it worked and save nothing.
import { getDb, getStorageService, getFunctionsService, firebaseConfigured } from "../config/firebase";
import { CONTACT_DEFAULTS } from "../data/contact";
import { getSource } from "./attribution";
import { track } from "./analytics";

const MAX_FILE = 20 * 1024 * 1024;
const VIA_FUNCTIONS = import.meta.env.VITE_FORMS_VIA_FUNCTIONS === "true";
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const assertReady = () => {
    if (!firebaseConfigured && import.meta.env.VITE_USE_EMULATORS !== "true") {
        throw new Error(`Forms aren't connected yet. Please call ${CONTACT_DEFAULTS.phone} or email ${CONTACT_DEFAULTS.email}.`);
    }
};

const trim = (value, max) => String(value ?? "").trim().slice(0, max);

const isBot = (website) => Boolean(String(website ?? "").trim());

const where = () => {
    const source = getSource();
    return { source, page: source.page };
};

const fs = () => Promise.all([getDb(), import("firebase/firestore")]);

// The callable function; its error messages are written for visitors
const viaFunction = async (type, data, website) => {
    const [functions, { httpsCallable }] = await Promise.all([getFunctionsService(), import("firebase/functions")]);
    const { data: result } = await httpsCallable(functions, "submitLead")({ type, data, website: website || "" });
    return result?.id ?? null;
};

const done = (type, id) => {
    track(type === "subscribe" ? "sign_up" : "generate_lead", type === "subscribe" ? { method: "email" } : { form_type: type });
    return id;
};

// Contact form → messages/{id}. Rules allow exactly these keys.
export const sendMessage = async ({ name, email, subject, body, website }) => {
    if (isBot(website)) return null;
    assertReady();
    const fields = { name: trim(name, 120), email: trim(email, 200), subject: trim(subject, 200), body: trim(body, 5000), ...where() };
    if (VIA_FUNCTIONS) return done("message", await viaFunction("message", fields, website));
    const [db, { addDoc, collection, serverTimestamp }] = await fs();
    const ref = await addDoc(collection(db, "messages"), { ...fields, createdAt: serverTimestamp() });
    return done("message", ref.id);
};

const uploadDrawing = async (folderId, file) => {
    if (file.size > MAX_FILE) throw new Error("That file is over 20 MB. Send a smaller one, or email it to us.");
    const path = `quotes/${folderId}/${file.name.replace(/[^\w.-]+/g, "_")}`;
    const [storage, { ref, uploadBytes }] = await Promise.all([getStorageService(), import("firebase/storage")]);
    await uploadBytes(ref(storage, path), file, { contentType: file.type });
    return path;
};

const randomId = () => (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`).replace(/[^\w]/g, "").slice(0, 20);

// Quote request → quotes/{id}, with an optional drawing uploaded first to quotes/{id}/
export const sendQuote = async ({ type, name, contact, location, budgetUGX, message, file, website }) => {
    if (isBot(website)) return null;
    assertReady();
    const budget = Number(String(budgetUGX ?? "").replace(/\D/g, ""));
    const fields = {
        type: trim(type, 40),
        name: trim(name, 120),
        contact: trim(contact, 200),
        location: trim(location, 200),
        budgetUGX: Number.isSafeInteger(budget) && budget > 0 ? budget : null,
        message: trim(message, 5000),
        ...where(),
    };
    if (VIA_FUNCTIONS) {
        const files = file ? [await uploadDrawing(randomId(), file)] : [];
        return done("quote", await viaFunction("quote", { ...fields, files }, website));
    }
    const [db, { collection, doc, serverTimestamp, setDoc }] = await fs();
    const quoteRef = doc(collection(db, "quotes"));
    const files = file ? [await uploadDrawing(quoteRef.id, file)] : [];
    await setDoc(quoteRef, { ...fields, files, createdAt: serverTimestamp() });
    return done("quote", quoteRef.id);
};

// Investor pack request → investorLeads/{id}. Rules require name, email, createdAt.
export const sendInvestorLead = async ({ name, org, email, ticketSize, message, website }) => {
    if (isBot(website)) return null;
    assertReady();
    const fields = { name: trim(name, 120), org: trim(org, 200), email: trim(email, 200), ticketSize: trim(ticketSize, 80), message: trim(message, 5000), ...where() };
    if (VIA_FUNCTIONS) return done("investorLead", await viaFunction("investorLead", fields, website));
    const [db, { addDoc, collection, serverTimestamp }] = await fs();
    const ref = await addDoc(collection(db, "investorLeads"), { ...fields, createdAt: serverTimestamp() });
    return done("investorLead", ref.id);
};

// Small "count me in" forms (community sign-up interest, course places, event places) go to
// messages/{id} with a subject saying what they're for, so the team sees them in Admin.
export const sendInterest = ({ topic, name, email, body, website }) =>
    sendMessage({ name, email, subject: `[${topic}]`, body: body || `${name} is interested in: ${topic}`, website });

// Email list → subscribers/{id}. Needs the visitor's consent (the rules check consent == true).
// `download`: slug of the free download they asked for (src/data/downloads.js), if any.
export const subscribe = async ({ email, name, interests = [], consent, download, website }) => {
    if (isBot(website)) return null;
    const address = trim(email, 200).toLowerCase();
    if (!EMAIL.test(address)) throw new Error("That email address doesn't look right.");
    if (consent !== true) throw new Error("Please tick the box so we're allowed to email you.");
    assertReady();
    const fields = {
        email: address,
        name: trim(name, 120),
        interests: (Array.isArray(interests) ? interests : []).map((i) => trim(i, 40)).filter(Boolean).slice(0, 10),
        consent: true,
        download: trim(download, 80),
        ...where(),
    };
    if (VIA_FUNCTIONS) return done("subscribe", await viaFunction("subscribe", fields, website));
    const [db, { addDoc, collection, serverTimestamp }] = await fs();
    const ref = await addDoc(collection(db, "subscribers"), { ...fields, createdAt: serverTimestamp() });
    return done("subscribe", ref.id);
};
