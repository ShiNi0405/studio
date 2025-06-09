
'use client';

import type { ReactNode } from 'react';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User as FirebaseUser,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut, 
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { auth, db } from '@/infrastructure/firebase/config'; 
import { Skeleton } from '@/presentation/components/ui/skeleton';
import type { UserRole, AppUser as DomainAppUser } from '@/domain/entities'; // Use renamed AppUser

// Extend FirebaseUser with custom fields, but use the domain entity for the final user object shape
export interface AppUser extends FirebaseUser, Omit<DomainAppUser, 'uid' | 'email' | 'displayName' | 'photoURL' | 'createdAt'> {
  // Ensure FirebaseUser properties are primary, and then add role and other specific fields from DomainAppUser
  role: UserRole; // Explicitly ensure role is here
  createdAt?: Timestamp; // From domain entity
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
          const appUserData = userDocSnap.data() as DomainAppUser; 
          setUser({
            ...firebaseUser, 
            ...appUserData,   
          } as AppUser); // Cast to merged AppUser type
        } else {
          // This case might happen if Firestore doc creation failed or for a new user not yet in Firestore
          // For now, setting with basic FirebaseUser info and potentially a default role if needed
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
    
    const userDocData: Partial<DomainAppUser> = { // Use DomainAppUser for Firestore data shape
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      displayName: displayName,
      role: role,
      createdAt: serverTimestamp() as Timestamp, 
      photoURL: firebaseUser.photoURL, 
    };

    if (role === 'barber') {
      userDocData.availability = JSON.stringify({}); 
      userDocData.subscriptionActive = false;
      userDocData.bio = "";
      userDocData.specialties = [];
      userDocData.experienceYears = 0;
    }

    await setDoc(doc(db, 'users', firebaseUser.uid), userDocData);
    
    setUser({
      ...firebaseUser,
      ...userDocData,  
      createdAt: new Timestamp(Math.floor(Date.now()/1000),0) 
    } as AppUser); // Cast to merged AppUser
  };

  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
    // onAuthStateChanged will handle fetching Firestore data and setting user state
  };

  const logout = async () => {
    await firebaseSignOut(auth);
    setUser(null);
  };
  
  if (loading) { 
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
