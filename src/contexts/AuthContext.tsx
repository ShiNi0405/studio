import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { 
  User as FirebaseUser,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase/config';

export type UserRole = 'customer' | 'barber';

export interface AppUser extends FirebaseUser {
  role?: UserRole;
  createdAt?: Timestamp;
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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
      createdAt: new Timestamp(Math.floor(Date.now()/1000), 0)
    } as AppUser);
  };

  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const logout = async () => {
    await firebaseSignOut(auth);
    setUser(null);
  };

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