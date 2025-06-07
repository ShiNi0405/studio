
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
  availability?: string; // JSON string
  subscriptionActive?: boolean;
}


interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string, role: UserRole) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth || !db) {
      setLoading(false); 
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          const appUserData = userDocSnap.data() as AppUser; 
          setUser({
            ...firebaseUser, 
            ...appUserData,   
          });
        } else {
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
    
    const userDocData: Partial<AppUser> = {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      displayName: displayName,
      role: role,
      createdAt: serverTimestamp() as Timestamp, // Cast for immediate use, Firestore handles conversion
      photoURL: firebaseUser.photoURL, 
    };

    if (role === 'barber') {
      userDocData.availability = JSON.stringify({}); // Default empty availability
      userDocData.subscriptionActive = false;
      userDocData.bio = "";
      userDocData.specialties = [];
      userDocData.experienceYears = 0;
    }

    await setDoc(doc(db, 'users', firebaseUser.uid), userDocData);
    
    setUser({
      ...firebaseUser,
      ...userDocData,  
      createdAt: new Timestamp(Math.floor(Date.now()/1000),0) // client-side approximation for immediate UI
    } as AppUser);
  };

  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const logout = async () => {
    await firebaseSignOut(auth);
    setUser(null);
  };
  
  if (loading) { // Changed condition here
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
