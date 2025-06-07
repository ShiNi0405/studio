
'use client';

import { useEffect, useState, Suspense } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { useParams, useRouter } from 'next/navigation';
import { db } from '@/lib/firebase/config';
import type { Barber } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import BookingForm from '@/components/bookings/BookingForm';

function BookAppointmentPageContent() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  
  const barberId = params.barberId as string;
  const [barber, setBarber] = useState<Barber | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push(`/login?redirect=/barbers/${barberId}/book`);
    }
  }, [user, authLoading, router, barberId]);

  useEffect(() => {
    if (barberId) {
      const fetchBarber = async () => {
        setLoading(true);
        setError(null);
        try {
          const docRef = doc(db, 'users', barberId);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists() && docSnap.data()?.role === 'barber') {
            setBarber({ uid: docSnap.id, ...docSnap.data() } as Barber);
          } else {
            setError("Barber not found or user is not a barber.");
          }
        } catch (err) {
          console.error("Error fetching barber:", err);
          setError("Failed to load barber information.");
        } finally {
          setLoading(false);
        }
      };
      fetchBarber();
    }
  }, [barberId]);

  if (authLoading || loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading booking details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-10">
        <p className="text-xl text-destructive">{error}</p>
        <Button asChild variant="link" className="mt-4">
          <Link href={`/barbers/${barberId}`}>
            <ChevronLeft className="mr-2 h-4 w-4" /> Back to Profile
          </Link>
        </Button>
      </div>
    );
  }

  if (!user) {
    return (
        <div className="text-center py-10">
            <p className="text-xl text-muted-foreground">Please log in to book an appointment.</p>
            <Button asChild className="mt-4">
                <Link href={`/login?redirect=/barbers/${barberId}/book`}>Log In</Link>
            </Button>
        </div>
    );
  }
  
  if (!barber) {
    return <div className="text-center py-10"><p className="text-xl text-muted-foreground">Barber information not available.</p></div>;
  }
  
  if (user.role === 'barber') {
    return (
      <div className="text-center py-10">
        <p className="text-xl text-muted-foreground">Barbers cannot book appointments with themselves or other barbers through this interface.</p>
        <Button asChild variant="link" className="mt-4">
          <Link href="/dashboard">
            <ChevronLeft className="mr-2 h-4 w-4" /> Go to Dashboard
          </Link>
        </Button>
      </div>
    );
  }


  return (
    <div className="max-w-2xl mx-auto">
      <Button asChild variant="outline" className="mb-6">
        <Link href={`/barbers/${barberId}`}>
          <ChevronLeft className="mr-2 h-4 w-4" /> Back to Profile
        </Link>
      </Button>
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl font-headline">Book an Appointment</CardTitle>
          <CardDescription>
            You are booking with <span className="font-semibold text-primary">{barber.displayName}</span>. 
            Please fill out the details below.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BookingForm barber={barber} customer={user} />
        </CardContent>
      </Card>
    </div>
  );
}


export default function BookAppointmentPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
      </div>
    }>
      <BookAppointmentPageContent />
    </Suspense>
  );
}
