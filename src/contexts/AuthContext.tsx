'use client';

import type { ReactNode } from 'react';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/config';
import type { AppUser } from '@/types';
import { Skeleton } from '@/components/ui/skeleton'; // For loading state

interface AuthContextType {
  user: AppUser | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  isAdmin: boolean; // Example, can be expanded
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false); // Placeholder for admin logic

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        try {
          const userDocRef = doc(db, 'users', fbUser.uid);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            const appUserData = userDocSnap.data() as AppUser;
            setUser({ ...appUserData, uid: fbUser.uid }); // Ensure uid is from fbUser
             // Example: Check for admin role
            // setIsAdmin(appUserData.role === 'admin'); 
          } else {
            // This case might happen if user exists in Auth but not Firestore
            // Or during signup process before Firestore doc is created
            setUser(null); 
          }
        } catch (error) {
          console.error("Error fetching user data from Firestore:", error);
          setUser(null);
        }
      } else {
        setUser(null);
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    // Basic full-page skeleton loader
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
    <AuthContext.Provider value={{ user, firebaseUser, loading, isAdmin }}>
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
