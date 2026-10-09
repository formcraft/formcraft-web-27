// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth }from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDjWl0bRG3S6u8goA3szqWlRTZxPdWwqJ8",
  authDomain: "fromcraft-2026.firebaseapp.com",
  projectId: "fromcraft-2026",
  storageBucket: "fromcraft-2026.firebasestorage.app",
  messagingSenderId: "777450246635",
  appId: "1:777450246635:web:d82ee3e4efa511187749ae",
  measurementId: "G-67CEG3LGDJ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
const analytics = getAnalytics(app);