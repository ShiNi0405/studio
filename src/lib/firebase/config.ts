// src/lib/firebase/config.ts
import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";

const configValues = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const placeholderValues = {
  apiKey: "YOUR_FIREBASE_API_KEY_HERE",
  authDomain: "YOUR_FIREBASE_AUTH_DOMAIN_HERE",
  projectId: "YOUR_FIREBASE_PROJECT_ID_HERE",
  storageBucket: "YOUR_FIREBASE_STORAGE_BUCKET_HERE",
  messagingSenderId: "YOUR_FIREBASE_MESSAGING_SENDER_ID_HERE",
  appId: "YOUR_FIREBASE_APP_ID_HERE",
};

const envVarNames: Record<keyof typeof placeholderValues, string> = {
  apiKey: "NEXT_PUBLIC_FIREBASE_API_KEY",
  authDomain: "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  projectId: "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  storageBucket: "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
  messagingSenderId: "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
  appId: "NEXT_PUBLIC_FIREBASE_APP_ID",
};

let configIssue = "";

for (const key in configValues) {
  const K = key as keyof typeof configValues;
  const envVarName = envVarNames[K];
  if (!configValues[K]) {
    configIssue = `Firebase config error: Environment variable '${envVarName}' for '${K}' is missing. Please ensure it's set in your /workspace/.env file.`;
    break;
  }
  if (configValues[K] === placeholderValues[K]) {
    configIssue = `Firebase config error: Environment variable '${envVarName}' for '${K}' is using a placeholder value ('${placeholderValues[K]}'). Please replace it with your actual Firebase project credential in the /workspace/.env file.`;
    break;
  }
}

if (configIssue) {
  console.error("Detailed Firebase Config Error:", configIssue);
  throw new Error(configIssue + " The application cannot start without valid Firebase credentials. You can find these credentials in your Firebase project settings.");
}

const firebaseConfig = {
  apiKey: configValues.apiKey!,
  authDomain: configValues.authDomain!,
  projectId: configValues.projectId!,
  storageBucket: configValues.storageBucket!,
  messagingSenderId: configValues.messagingSenderId!,
  appId: configValues.appId!,
};

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

// Initialize Firebase
if (getApps().length === 0) {
  try {
    app = initializeApp(firebaseConfig);
  } catch (error) {
    console.error("Firebase initialization failed with provided config:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Firebase initialization failed. Original error: ${errorMessage}. This usually indicates an issue with the Firebase config values, even if they are not placeholders (e.g., a typo in a real key, or the key is for a different project). Please double-check your credentials in /workspace/.env and in your Firebase project settings.`);
  }
} else {
  app = getApps()[0];
}

auth = getAuth(app);
db = getFirestore(app);

export { app, auth, db };
