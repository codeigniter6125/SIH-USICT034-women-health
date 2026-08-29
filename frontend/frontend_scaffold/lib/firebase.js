// lib/firebase.js
// Initializes the Firebase client SDK for the browser (login, phone auth).
// Uses the same "your apps" web config keys you already copied from the
// Firebase Console when setting up backend/.env — but here they need the
// NEXT_PUBLIC_ prefix so Next.js exposes them to client-side code.

import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Avoid re-initializing on hot reload
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
