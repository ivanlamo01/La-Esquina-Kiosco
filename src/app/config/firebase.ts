import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const cleanEnv = (value?: string) => value?.trim().replace(/^['\"]|['\"]$/g, "");

const firebaseConfig = {
  apiKey: cleanEnv(process.env.NEXT_PUBLIC_FIREBASE_API_KEY),
  authDomain: cleanEnv(process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN),
  databaseURL: cleanEnv(process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL),
  projectId: cleanEnv(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID),
  storageBucket: cleanEnv(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET),
  messagingSenderId: cleanEnv(process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID),
  appId: cleanEnv(process.env.NEXT_PUBLIC_FIREBASE_APP_ID),
  measurementId: cleanEnv(process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID)
};

if (!firebaseConfig.apiKey) {
  throw new Error("Missing NEXT_PUBLIC_FIREBASE_API_KEY in environment variables");
}

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

try {
  if (typeof window !== 'undefined' && !getApps().length) {
     console.log('Firebase config:', JSON.stringify(firebaseConfig, (k, v) => k === 'apiKey' ? '***' : v));
  }
} catch (e) {
  console.error('Error logging firebase config', e);
}

const auth = getAuth(app);
const db = getFirestore(app);


export { app, auth, db };
