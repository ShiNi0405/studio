
// src/lib/firebase/config.ts
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
let analytics: Analytics | undefined = undefined; // Initialize as undefined
let auth: Auth;
let db: Firestore;

// Initialize Firebase
// Check if we are in the browser and if no apps are initialized
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
    // Optionally, throw a more specific error or handle it
  }
} else if (getApps().length > 0) {
  // If already initialized (e.g., on subsequent renders or in HMR), get the existing app
  app = getApps()[0];
  auth = getAuth(app);
  db = getFirestore(app);
  if (firebaseConfig.measurementId && typeof window !== 'undefined') {
    // Ensure analytics is only initialized on client side and if measurementId is present
    try {
        analytics = getAnalytics(app);
    } catch (e) {
        // console.warn("Firebase Analytics could not be initialized:", e);
    }
  }
} else {
  // Fallback for server-side rendering where window is not defined,
  // but we still need auth and db for some server-side operations (e.g. AuthProvider initial check).
  // This might lead to errors if Firebase services are used extensively server-side without proper guards.
  // Consider Firebase Admin SDK for backend operations.
  // For client-side focused apps, the check above is primary.
  // This block is a safeguard but might not be fully robust for all SSR Firebase uses.
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
