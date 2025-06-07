
'use client';

import { AuthForm } from '@/components/auth/AuthForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button'; // Added for Link consistency
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';
import { useAuth, UserRole } from '@/contexts/AuthContext'; // UserRole imported from new context


function SignupPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [formLoading, setFormLoading] = useState(false); // Renamed to avoid conflict
  const { user, loading: authLoading, signUp } = useAuth();

  const initialRole = searchParams.get('role') as UserRole | undefined;

  useEffect(() => {
    if (!authLoading && user) {
      router.push('/dashboard');
    }
  }, [user, authLoading, router]);


  const handleSignup = async (values: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
    setFormLoading(true);
    try {
      await signUp(values.email, values.password, values.displayName, values.role as UserRole);
      
      toast({
        title: 'Account created successfully!',
        description: 'Welcome to Barbermatch!',
      });
      router.push('/dashboard');
    } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      console.error('Signup failed:', error);
      const errorMessage = error.code === 'auth/email-already-in-use'
        ? 'This email address is already in use.'
        : error.message || 'An unknown error occurred. Please try again.';
      toast({
        title: 'Signup Failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setFormLoading(false);
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
          <AuthForm mode="signup" onSubmit={handleSignup} loading={formLoading} initialRole={initialRole} />
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
    <Suspense fallback={
        <div className="flex justify-center items-center min-h-[calc(100vh-10rem)]">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
        </div>
    }>
      <SignupPageContent />
    </Suspense>
  );
}
