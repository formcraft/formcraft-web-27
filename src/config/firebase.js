// All Firebase setup lives here. Components import { auth, db, storage, functions }
// and never call initializeApp themselves.
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getStorage, connectStorageEmulator } from "firebase/storage";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";

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

export const app = firstLoad ? initializeApp(config) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app, env.VITE_FUNCTIONS_REGION || undefined);

if (firstLoad && env.DEV && env.VITE_USE_EMULATORS === "true") {
  connectAuthEmulator(auth, "http://localhost:9099", { disableWarnings: true });
  connectFirestoreEmulator(db, "localhost", 8080);
  connectStorageEmulator(storage, "localhost", 9199);
  connectFunctionsEmulator(functions, "localhost", 5001);
}

// Analytics only in production, loaded lazily so it never slows the first paint
if (env.PROD && firebaseConfigured && env.VITE_FIREBASE_MEASUREMENT_ID) {
  import("firebase/analytics")
    .then(({ getAnalytics, isSupported }) => isSupported().then((ok) => ok && getAnalytics(app)))
    .catch(() => {});
}
