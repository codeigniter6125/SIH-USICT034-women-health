/**
 * firebase.ts — Client SDK initialization for Firebase Phone/OTP Authentication.
 */
import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  type ConfirmationResult,
} from "firebase/auth";

const firebaseConfig = {
  apiKey:
    (typeof import.meta !== "undefined" && import.meta.env?.VITE_FIREBASE_API_KEY) ||
    "AIzaSyBZHjjTTXPcL4B2J89WTi1uogHL3OB0laQ",
  authDomain:
    (typeof import.meta !== "undefined" && import.meta.env?.VITE_FIREBASE_AUTH_DOMAIN) ||
    "women-health-sih.firebaseapp.com",
  projectId:
    (typeof import.meta !== "undefined" && import.meta.env?.VITE_FIREBASE_PROJECT_ID) ||
    "women-health-sih",
  storageBucket:
    (typeof import.meta !== "undefined" && import.meta.env?.VITE_FIREBASE_STORAGE_BUCKET) ||
    "women-health-sih.firebasestorage.app",
  messagingSenderId:
    (typeof import.meta !== "undefined" && import.meta.env?.VITE_FIREBASE_MESSAGING_SENDER_ID) ||
    "776939385288",
  appId:
    (typeof import.meta !== "undefined" && import.meta.env?.VITE_FIREBASE_APP_ID) ||
    "1:776939385288:web:4a8c45a568ff67ce4810fd",
};

// Reuse existing app instance across hot module reloads
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export { RecaptchaVerifier, signInWithPhoneNumber, type ConfirmationResult };
export default app;
