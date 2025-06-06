'use client';

import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ChevronLeft, Construction, Loader2 } from 'lucide-react';

export default function AccountSettingsPage() {
  const { user, loading: authLoading } = useAuth();

  if (authLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-15rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading account settings...</p>
      </div>
    );
  }

  if (!user) {
    // Should be redirected by AuthProvider or page-level useEffect, but as a fallback
    return (
      <div className="text-center py-10">
        <p className="text-xl">Please log in to view account settings.</p>
        <Button asChild className="mt-4">
          <Link href="/auth/login?redirect=/dashboard/account-settings">Log In</Link>
        </Button>
      </div>
    );
  }
  
  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-3xl font-headline">Account Settings</CardTitle>
          <CardDescription>Manage your personal information and preferences.</CardDescription>
        </CardHeader>
        <CardContent className="text-center py-12">
            <Construction className="h-20 w-20 text-primary mx-auto mb-6" />
          <h3 className="text-xl font-semibold mb-2">Under Construction</h3>
          <p className="text-muted-foreground">
            This page is currently under development. You&apos;ll soon be able to manage your account details here.
          </p>
          <p className="text-sm text-muted-foreground mt-4">
            Currently, you can update your display name via your Barber Profile page if you are a barber.
          </p>
        </CardContent>
      </Card>
       <div className="mt-8">
            <Button variant="outline" asChild>
                <Link href="/dashboard"><ChevronLeft className="mr-2 h-4 w-4" />Back to Dashboard</Link>
            </Button>
        </div>
    </div>
  );
}
