// All Firebase setup lives here; nothing else calls initializeApp.
// Auth is needed on every page (header), so it loads with the app. Firestore, Storage and
// Functions load only when a page first asks for them: await getDb(), getStorageService(),
// getFunctionsService(). That keeps them out of the main bundle.
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, initializeAuth, indexedDBLocalPersistence, browserLocalPersistence, browserSessionPersistence, connectAuthEmulator } from "firebase/auth";

const env = import.meta.env;

// True when .env.local holds a real web-app config. Without it the site still renders:
// Firebase starts against a "demo-" project, which only works with the emulators.
export const firebaseConfigured = Boolean(env.VITE_FIREBASE_API_KEY);

if (!firebaseConfigured) {
  console.warn(
    "Firebase isn't configured: copy .env.example to .env.local and fill it in. " +
      "Running against the demo project (emulators only)."
  );
}

const config = firebaseConfigured
  ? {
      apiKey: env.VITE_FIREBASE_API_KEY,
      authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: env.VITE_FIREBASE_APP_ID,
      measurementId: env.VITE_FIREBASE_MEASUREMENT_ID,
    }
  : { apiKey: "demo-key", projectId: "demo-formcraft", appId: "demo-app", authDomain: "demo-formcraft.firebaseapp.com" };

const firstLoad = getApps().length === 0; // guards against hot reload initialising twice

/** The Firebase app (the connection to the formcraft2027 project, or the "demo-" project for the emulators). */
export const app = firstLoad ? initializeApp(config) : getApp();
// Auth without the Google pop-up helper: getAuth() would load Google's sign-in script (gapi) on every
// page at start-up. AuthContext passes the helper only when someone actually signs in. The same
// storage as getAuth(), so signed-in sessions are kept as before.
export const auth = firstLoad
  ? initializeAuth(app, { persistence: [indexedDBLocalPersistence, browserLocalPersistence, browserSessionPersistence] })
  : getAuth(app);
const useEmulators = env.DEV && env.VITE_USE_EMULATORS === "true";

if (firstLoad && useEmulators) {
  connectAuthEmulator(auth, "http://localhost:9099", { disableWarnings: true });
}

const once = (load) => {
  let promise = null;
  return () => (promise ??= load());
};

/** The Firestore database, loaded only the first time something needs it (it's a big download). @returns {Promise<import("firebase/firestore").Firestore>} */
export const getDb = once(async () => {
  const { getFirestore, connectFirestoreEmulator } = await import("firebase/firestore");
  const db = getFirestore(app);
  if (useEmulators) connectFirestoreEmulator(db, "localhost", 8081); // 8080 is taken by the Revit MCP plugin
  return db;
});

/** File storage, loaded on first use. @returns {Promise<import("firebase/storage").FirebaseStorage>} */
export const getStorageService = once(async () => {
  const { getStorage, connectStorageEmulator } = await import("firebase/storage");
  const storage = getStorage(app);
  if (useEmulators) connectStorageEmulator(storage, "localhost", 9199);
  return storage;
});

/** Cloud Functions, loaded on first use. @returns {Promise<import("firebase/functions").Functions>} */
export const getFunctionsService = once(async () => {
  const { getFunctions, connectFunctionsEmulator } = await import("firebase/functions");
  const functions = getFunctions(app, env.VITE_FUNCTIONS_REGION || undefined);
  if (useEmulators) connectFunctionsEmulator(functions, "localhost", 5001);
  return functions;
});

// Analytics starts only after cookie consent: see src/lib/analytics.js.
