'use client';

import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Briefcase, CalendarDays, Scissors, Star, User } from 'lucide-react';

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-10rem)]">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return null; // Or a message telling to login, though useEffect should redirect
  }

  return (
    <div className="space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-3xl font-headline">Welcome to your Dashboard, {user.displayName || 'User'}!</CardTitle>
          <CardDescription>Here&apos;s an overview of your Barbermatch activity.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Your role: <span className="font-semibold capitalize">{user.role}</span></p>
        </CardContent>
      </Card>

      {user.role === 'customer' && (
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-medium">My Bookings</CardTitle>
              <CalendarDays className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">View and manage your upcoming and past appointments.</p>
              <Button asChild>
                <Link href="/dashboard/my-bookings">View Bookings</Link>
              </Button>
            </CardContent>
          </Card>
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-medium">Find Barbers</CardTitle>
              <Scissors className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">Discover talented barbers and book your next appointment.</p>
              <Button asChild>
                <Link href="/barbers">Browse Barbers</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {user.role === 'barber' && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-medium">Booking Requests</CardTitle>
              <CalendarDays className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">View and manage incoming booking requests from customers.</p>
              <Button asChild>
                <Link href="/dashboard/booking-requests">Manage Requests</Link>
              </Button>
            </CardContent>
          </Card>
           <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-medium">My Profile</CardTitle>
              <Briefcase className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">Update your barber profile, availability, and services.</p>
              <Button asChild>
                <Link href="/dashboard/my-profile">Edit Profile</Link>
              </Button>
            </CardContent>
          </Card>
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-medium">My Reviews</CardTitle>
              <Star className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">See what customers are saying about your services.</p>
              <Button asChild>
                <Link href="/dashboard/my-reviews">View Reviews</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
      
      <Card className="mt-8 hover:shadow-lg transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-medium">Account Settings</CardTitle>
            <User className="h-5 w-5 text-primary" />
        </CardHeader>
        <CardContent>
            <p className="text-sm text-muted-foreground mb-4">Manage your personal information and account preferences.</p>
            <Button asChild variant="outline">
                <Link href="/dashboard/account-settings">Go to Settings</Link>
            </Button>
        </CardContent>
      </Card>
    </div>
  );
}
