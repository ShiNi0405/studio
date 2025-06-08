
'use client';

import { useAuth } from '@/contexts/AuthContext';
import { collection, query, where, getDocs, orderBy, doc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { Booking } from '@/types';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { AlertCircle, CalendarCheck, ChevronLeft, Loader2, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function BookingRequestsPage() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingBookingId, setUpdatingBookingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedBookingForAction, setSelectedBookingForAction] = useState<Booking | null>(null);

  useEffect(() => {
    if (!authLoading && user && user.role === 'barber') {
      fetchBookingRequests();
    } else if (!authLoading && !user) {
      setLoading(false);
      setError("Please log in to view booking requests.");
    } else if (!authLoading && user && user.role !== 'barber') {
      setLoading(false);
      setError("This page is for barbers only.");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading]);

  const fetchBookingRequests = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const q = query(
        collection(db, 'bookings'),
        where('barberId', '==', user.uid),
        where('status', 'in', ['pending', 'confirmed']),
        orderBy('appointmentDateTime', 'asc')
      );
      const querySnapshot = await getDocs(q);
      const fetchedBookings = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking));
      setBookings(fetchedBookings);
    } catch (err: any) {
      console.error("Error fetching booking requests:", err);
      setError("Failed to load booking requests. Please check the browser's developer console for more specific error messages (e.g., regarding missing Firestore indexes).");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (bookingId: string, newStatus: 'confirmed' | 'rejected' | 'completed' | 'cancelled_by_barber') => {
    setUpdatingBookingId(bookingId);
    try {
      const bookingRef = doc(db, 'bookings', bookingId);
      await updateDoc(bookingRef, { status: newStatus });
      toast({ title: "Booking Updated", description: `Booking status changed to ${newStatus}.`});
      fetchBookingRequests();
    } catch (err) {
      console.error("Error updating booking status:", err);
      toast({ title: "Update Failed", description: "Could not update booking status.", variant: "destructive" });
    } finally {
      setUpdatingBookingId(null);
      setSelectedBookingForAction(null);
    }
  };


  if (authLoading || loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-15rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading booking requests...</p>
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
        <h1 className="text-3xl font-headline font-bold">Booking Requests</h1>
         <Button variant="outline" onClick={fetchBookingRequests} disabled={loading || !!updatingBookingId}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading || updatingBookingId ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {bookings.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <CalendarCheck className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-xl text-muted-foreground">You have no pending or confirmed booking requests.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {bookings.map(booking => (
            <Card key={booking.id} className="flex flex-col justify-between hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-xl">{booking.style || booking.serviceName || "Appointment Request"}</CardTitle>
                <CardDescription>From: {booking.customerName}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-sm text-foreground">
                  <strong>Date & Time:</strong> {booking.appointmentDateTime ? format(new Date((booking.appointmentDateTime as unknown as Timestamp).seconds * 1000), 'PPP p') : 'N/A'}
                </p>
                {booking.serviceName && booking.servicePrice !== undefined && booking.servicePrice !== null && (
                    <p className="text-sm text-foreground"><strong>Service Price:</strong> RM{booking.servicePrice.toFixed(2)}</p>
                )}
                {booking.notes && <p className="text-sm text-muted-foreground mt-2 line-clamp-2"><strong>Notes:</strong> {booking.notes}</p>}
                <Badge variant={booking.status === 'confirmed' ? 'default' : 'secondary'} className="mt-3 capitalize">{booking.status}</Badge>
              </CardContent>
              <CardFooter className="border-t pt-4 space-x-2">
                {booking.status === 'pending' && (
                  <>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                            size="sm"
                            className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground"
                            disabled={updatingBookingId === booking.id}
                            onClick={() => setSelectedBookingForAction(booking)}
                        >
                            {updatingBookingId === booking.id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Accept
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Confirm Acceptance</AlertDialogTitle>
                          <AlertDialogDescription>
                            A fee of RM5.00 will be charged to accept this booking. This is a simulated payment.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel onClick={() => setSelectedBookingForAction(null)}>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => selectedBookingForAction && handleUpdateStatus(selectedBookingForAction.id, 'confirmed')}
                            disabled={!selectedBookingForAction || updatingBookingId === selectedBookingForAction.id}
                            className="bg-accent hover:bg-accent/90"
                          >
                            {updatingBookingId === selectedBookingForAction?.id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Pay RM5.00 & Accept
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>

                    <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleUpdateStatus(booking.id, 'rejected')}
                        disabled={updatingBookingId === booking.id}
                        className="flex-1"
                    >
                        {updatingBookingId === booking.id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Reject
                    </Button>
                  </>
                )}
                {booking.status === 'confirmed' && (
                    <>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUpdateStatus(booking.id, 'completed')}
                        disabled={updatingBookingId === booking.id}
                        className="flex-1"
                    >
                         {updatingBookingId === booking.id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Mark as Completed
                    </Button>
                    <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleUpdateStatus(booking.id, 'cancelled_by_barber')}
                        disabled={updatingBookingId === booking.id}
                        className="flex-1"
                    >
                         {updatingBookingId === booking.id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Cancel Appointment
                    </Button>
                    </>
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
