'use client';

import { AuthForm } from '@/components/auth/AuthForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { auth, db } from '@/lib/firebase/config';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import type { UserRole } from '@/types';

function SignupPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const { user, loading: authLoading } = useAuth();

  const initialRole = searchParams.get('role') as UserRole | undefined;

  useEffect(() => {
    if (!authLoading && user) {
      router.push('/dashboard');
    }
  }, [user, authLoading, router]);


  const handleSignup = async (values: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      const firebaseUser = userCredential.user;

      await updateProfile(firebaseUser, {
        displayName: values.displayName,
      });
      
      const userDocData = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: values.displayName,
        role: values.role,
        createdAt: serverTimestamp(),
        photoURL: firebaseUser.photoURL, // Initially null, can be updated later
      };

      if (values.role === 'barber') {
        // @ts-ignore // Add barber specific fields
        userDocData.availability = JSON.stringify({}); // Default empty availability
        // @ts-ignore
        userDocData.subscriptionActive = false; // Default to false, barber needs to subscribe
        // @ts-ignore
        userDocData.bio = "";
        // @ts-ignore
        userDocData.specialties = [];
        // @ts-ignore
        userDocData.experienceYears = 0;
      }

      await setDoc(doc(db, 'users', firebaseUser.uid), userDocData);

      toast({
        title: 'Account created successfully!',
        description: 'Welcome to Barbermatch!',
      });
      router.push('/dashboard');
    } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      console.error('Signup failed:', error);
      toast({
        title: 'Signup Failed',
        description: error.message || 'An unknown error occurred. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || (!authLoading && user)) {
     return (
      <div className="flex justify-center items-center min-h-[calc(100vh-10rem)]">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-start py-12 min-h-[calc(100vh-10rem)]">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-headline">Create an Account</CardTitle>
          <CardDescription>Join Barbermatch today. It&apos;s quick and easy!</CardDescription>
        </CardHeader>
        <CardContent>
          <AuthForm mode="signup" onSubmit={handleSignup} loading={loading} initialRole={initialRole} />
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Button variant="link" asChild className="p-0 h-auto">
              <Link href="/auth/login">
                Log in
              </Link>
            </Button>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SignupPageContent />
    </Suspense>
  );
}
