import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const rawSenderId = process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "123456789012";
const messagingSenderId = rawSenderId.includes(":") ? (rawSenderId.split(":")[1] || rawSenderId) : rawSenderId;
const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID || (rawSenderId.includes(":") ? rawSenderId : "1:123456789012:web:abcdef1234567890");

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyFakeKeyForLocalDevelopmentAndTesting",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "keeva-relationship-ai.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "keeva-relationship-ai",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "keeva-relationship-ai.appspot.com",
  messagingSenderId,
  appId,
};

// Initialize Firebase App safely (singleton)
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export default app;
