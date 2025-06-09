
// src/infrastructure/firebase/config.ts
import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getAnalytics, Analytics } from "firebase/analytics";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

let app: FirebaseApp;
let analytics: Analytics | undefined = undefined; 
let auth: Auth;
let db: Firestore;

if (typeof window !== 'undefined' && !getApps().length) {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    if (firebaseConfig.measurementId) {
      analytics = getAnalytics(app);
    }
  } catch (error) {
    console.error("Firebase initialization failed:", error);
  }
} else if (getApps().length > 0) {
  app = getApps()[0];
  auth = getAuth(app);
  db = getFirestore(app);
  if (firebaseConfig.measurementId && typeof window !== 'undefined') {
    try {
        analytics = getAnalytics(app);
    } catch (e) {
        // console.warn("Firebase Analytics could not be initialized:", e);
    }
  }
} else {
  if (!getApps().length) {
     try {
      app = initializeApp(firebaseConfig);
     } catch (e) {
        // console.error("SSR Firebase app init fallback failed", e)
     }
  } else {
      app = getApps()[0];
  }
  // @ts-ignore
  auth = getAuth(app);
  // @ts-ignore
  db = getFirestore(app);
}


export { app, auth, db, analytics };
