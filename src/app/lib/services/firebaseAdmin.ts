import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import type { ServiceAccount } from "firebase-admin";


let serviceAccount: ServiceAccount | undefined;

const saEnv = process.env.FIREBASE_SERVICE_ACCOUNT || process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

if (saEnv) {
  try {
    serviceAccount = JSON.parse(saEnv) as ServiceAccount;
  } catch (error) {
    console.warn("FIREBASE_SERVICE_ACCOUNT inválido:", error);
  }
} else if (process.env.FB_PRIVATE_KEY && process.env.FB_CLIENT_EMAIL) {
  serviceAccount = {
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    clientEmail: process.env.FB_CLIENT_EMAIL,
    privateKey: process.env.FB_PRIVATE_KEY.replace(/\\n/g, '\n'),
  };
}

const adminApp = getApps().length
  ? getApps()[0]
  : serviceAccount
    ? initializeApp({ credential: cert(serviceAccount) })
    : initializeApp();

export const adminDb = getFirestore(adminApp);
