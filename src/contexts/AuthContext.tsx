
'use client';

import type { ReactNode } from 'react';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User as FirebaseUser,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut, // Renamed to avoid conflict
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/config'; // Corrected import path
import { Skeleton } from '@/components/ui/skeleton';

export type UserRole = 'customer' | 'barber';

// Extend FirebaseUser with custom fields
export interface AppUser extends FirebaseUser {
  role?: UserRole;
  // displayName is already part of FirebaseUser, but we ensure it's available
  // photoURL is also part of FirebaseUser
  // We can add other app-specific fields if needed directly here or in specific types
  createdAt?: Timestamp; // Added from existing AppUser type
  // Barber specific fields that might be part of the user object after fetch
  bio?: string;
  specialties?: string[];
  experienceYears?: number;
  availability?: string;
  subscriptionActive?: boolean;
}


interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string, role: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  // firebaseUser: FirebaseUser | null; // Removed as AppUser extends FirebaseUser
  // isAdmin: boolean; // Removed as it was a placeholder
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth || !db) {
      // Firebase services might not be initialized yet, especially on server.
      // This can happen if the firebase/config.ts initialization is guarded by `typeof window !== 'undefined'`
      // and this context is somehow trying to run/initialize server-side before client-side hydration
      // where `auth` or `db` would be undefined.
      // console.warn("AuthContext: Firebase auth or db not initialized. This might be normal during SSR pre-render.");
      setLoading(false); // Avoid infinite loading if Firebase isn't ready server-side
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          const appUserData = userDocSnap.data() as AppUser; // Cast to include custom fields
          setUser({
            ...firebaseUser, // Base Firebase user properties (uid, email, photoURL, etc.)
            ...appUserData,   // Custom fields from Firestore (role, displayName from Firestore, etc.)
          });
        } else {
          // This case might occur if a user exists in Firebase Auth but not in Firestore (e.g., incomplete signup)
          // Or if it's a new user whose Firestore document hasn't been created yet by the signUp function.
          // We set the basic Firebase user and role/displayName might be undefined until Firestore doc is synced.
          setUser(firebaseUser as AppUser); 
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, displayName: string, role: UserRole) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;

    await updateProfile(firebaseUser, {
      displayName: displayName,
    });
    
    const userDocData: any = { // eslint-disable-line @typescript-eslint/no-explicit-any
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      displayName: displayName,
      role: role,
      createdAt: serverTimestamp(),
      photoURL: firebaseUser.photoURL, // Save initial photoURL if any
    };

    if (role === 'barber') {
      userDocData.availability = JSON.stringify({}); // Default empty availability
      userDocData.subscriptionActive = false;
      userDocData.bio = "";
      userDocData.specialties = [];
      userDocData.experienceYears = 0;
    }

    await setDoc(doc(db, 'users', firebaseUser.uid), userDocData);
    
    // Update local user state with the combined info
    setUser({
      ...firebaseUser, // from auth
      ...userDocData,  // from what we just wrote to firestore (excluding serverTimestamp)
      createdAt: new Timestamp(new Date().getTime()/1000, 0) // Approximate client-side timestamp for immediate UI update
    });
  };

  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
    // onAuthStateChanged will handle setting the user state
  };

  const logout = async () => {
    await firebaseSignOut(auth);
    setUser(null);
  };
  
  if (loading && typeof window !== 'undefined') { // Added typeof window check for safety
    return (
      <div className="flex flex-col min-h-screen">
        <header className="bg-card border-b p-4">
          <div className="container mx-auto flex justify-between items-center">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-8 w-24" />
          </div>
        </header>
        <main className="flex-grow container mx-auto p-4">
          <Skeleton className="h-64 w-full" />
        </main>
      </div>
    );
  }


  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
