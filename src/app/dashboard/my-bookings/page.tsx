
'use client';

import { useAuth } from '@/contexts/AuthContext';
import { collection, query, where, getDocs, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { Booking } from '@/types';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { AlertCircle, CalendarCheck, CalendarX, CheckCircle, ChevronLeft, Loader2, RefreshCw, Star } from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';

export default function MyBookingsPage() {
  const { user, loading: authLoading } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && user && user.role === 'customer') {
      fetchBookings();
    } else if (!authLoading && !user) {
      setLoading(false);
      setError("Please log in to view your bookings.");
    } else if (!authLoading && user && user.role !== 'customer') {
      setLoading(false);
      setError("This page is for customers only.");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading]);

  const fetchBookings = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const q = query(
        collection(db, 'bookings'),
        where('customerId', '==', user.uid),
        orderBy('appointmentDateTime', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const fetchedBookings = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking));
      setBookings(fetchedBookings);
    } catch (err: any) {
      console.error("Error fetching customer bookings:", err);
      setError("Failed to load your bookings. Please check the browser's developer console for more specific error messages (e.g., regarding missing Firestore indexes).");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeVariant = (status: Booking['status']): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'confirmed': return 'default';
      case 'pending': return 'secondary';
      case 'completed': return 'outline';
      case 'cancelled_by_customer':
      case 'cancelled_by_barber':
      case 'rejected':
        return 'destructive';
      default: return 'secondary';
    }
  };
  
  const getStatusIcon = (status: Booking['status']) => {
     switch (status) {
      case 'confirmed': return <CalendarCheck className="h-4 w-4 text-primary" />;
      case 'pending': return <RefreshCw className="h-4 w-4 text-muted-foreground animate-spin" />;
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'cancelled_by_customer':
      case 'cancelled_by_barber':
      case 'rejected':
        return <CalendarX className="h-4 w-4 text-destructive" />;
      default: return <AlertCircle className="h-4 w-4 text-muted-foreground" />;
    }
  }


  if (authLoading || loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-15rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading your bookings...</p>
      </div>
    );
  }
  
  if (error) {
     return (
      <div className="text-center py-10">
        <AlertCircle className="mx-auto h-12 w-12 text-destructive mb-4" />
        <p className="text-xl text-destructive px-4">{error}</p>
        <Button asChild variant="link" className="mt-4">
          <Link href="/dashboard">
            <ChevronLeft className="mr-2 h-4 w-4" /> Back to Dashboard
          </Link>
        </Button>
      </div>
    );
  }


  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-headline font-bold">My Bookings</h1>
        <Button variant="outline" onClick={fetchBookings} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {bookings.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <CalendarCheck className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-xl text-muted-foreground">You have no bookings yet.</p>
            <Button asChild className="mt-6">
              <Link href="/barbers">Find a Barber</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {bookings.map(booking => (
            <Card key={booking.id} className="flex flex-col justify-between hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="text-xl">{booking.style || booking.service || "Appointment"}</CardTitle>
                        <CardDescription>with {booking.barberName}</CardDescription>
                    </div>
                     <Badge variant={getStatusBadgeVariant(booking.status)} className="capitalize whitespace-nowrap">
                        {getStatusIcon(booking.status)}
                        <span className="ml-1.5">{booking.status.replace(/_/g, ' ')}</span>
                    </Badge>
                </div>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-sm text-foreground">
                  <strong>Date & Time:</strong> {booking.appointmentDateTime ? format(new Date((booking.appointmentDateTime as unknown as Timestamp).seconds * 1000), 'PPP p') : 'N/A'}
                </p>
                {booking.notes && <p className="text-sm text-muted-foreground mt-2 line-clamp-2"><strong>Notes:</strong> {booking.notes}</p>}
              </CardContent>
              <CardFooter className="border-t pt-4">
                {booking.status === 'completed' && (
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/reviews/submit/${booking.id}`}>
                      <Star className="mr-2 h-4 w-4" />
                      Leave a Review
                    </Link>
                  </Button>
                )}
                 {(booking.status === 'pending' || booking.status === 'confirmed') && (
                   <Button variant="destructive" size="sm" className="ml-auto" disabled> {/* onClick={() => handleCancelBooking(booking.id)} */}
                     Cancel (Not Implemented)
                   </Button>
                 )}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
       <div className="mt-8">
            <Button variant="outline" asChild>
                <Link href="/dashboard"><ChevronLeft className="mr-2 h-4 w-4" />Back to Dashboard</Link>
            </Button>
        </div>
    </div>
  );
}
