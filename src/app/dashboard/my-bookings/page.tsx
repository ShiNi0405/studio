
'use client';

import { useAuth } from '@/contexts/AuthContext';
import { collection, query, where, getDocs, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { Booking } from '@/types';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { AlertCircle, CalendarCheck, CalendarX, CheckCircle, ChevronLeft, Clock, DollarSign, Edit3, HelpCircle, Loader2, MessageSquareWarning, RefreshCw, Star, ThumbsDown, ThumbsUp } from 'lucide-react';
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
} from "@/components/ui/alert-dialog";
import { acceptProposedPriceAction, rejectProposedPriceAction, updateBookingStatusAction } from '@/app/actions/bookingActions';


export default function MyBookingsPage() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingBookingId, setUpdatingBookingId] = useState<string | null>(null);

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
      setError("Failed to load bookings. Check Firestore indexes if errors persist in console.");
    } finally {
      setLoading(false);
    }
  };

  const handlePriceResponse = async (bookingId: string, accept: boolean) => {
    setUpdatingBookingId(bookingId);
    const action = accept ? acceptProposedPriceAction : rejectProposedPriceAction;
    const result = await action(bookingId);
    if (result.success) {
      toast({ title: "Response Sent", description: `You have ${accept ? 'accepted' : 'rejected'} the price proposal.` });
      fetchBookings();
    } else {
      toast({ title: "Action Failed", description: result.error, variant: "destructive" });
    }
    setUpdatingBookingId(null);
  };
  
  const handleCancelBookingByCustomer = async (bookingId: string) => {
    setUpdatingBookingId(bookingId);
    // Ask for confirmation before cancelling
    // For simplicity, directly updating. Consider adding an AlertDialog for confirmation.
    const result = await updateBookingStatusAction(bookingId, 'cancelled_by_customer');
    if (result.success) {
      toast({ title: "Booking Cancelled", description: "Your booking has been cancelled." });
      fetchBookings();
    } else {
      toast({ title: "Cancellation Failed", description: result.error, variant: "destructive" });
    }
    setUpdatingBookingId(null);
  }


  const getStatusBadgeVariant = (status: Booking['status']): "default" | "secondary" | "destructive" | "outline" | "warning" => {
    switch (status) {
      case 'confirmed': return 'default'; // Blue
      case 'pending_customer_request':
      case 'pending_barber_proposal': return 'secondary'; // Gray
      case 'pending_customer_approval': return 'warning'; // Yellow-ish
      case 'completed': return 'outline'; // Green-ish (via icon)
      case 'cancelled_by_customer':
      case 'cancelled_by_barber':
      case 'rejected_by_barber':
      case 'rejected_by_customer':
        return 'destructive'; // Red
      default: return 'secondary';
    }
  };

  const getStatusIcon = (status: Booking['status']) => {
     switch (status) {
      case 'confirmed': return <CalendarCheck className="h-4 w-4 text-primary" />;
      case 'pending_customer_request': return <HelpCircle className="h-4 w-4 text-muted-foreground" />;
      case 'pending_barber_proposal': return <RefreshCw className="h-4 w-4 text-muted-foreground animate-spin" />;
      case 'pending_customer_approval': return <DollarSign className="h-4 w-4 text-amber-600" />;
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'cancelled_by_customer':
      case 'cancelled_by_barber':
      case 'rejected_by_barber':
      case 'rejected_by_customer':
        return <CalendarX className="h-4 w-4 text-destructive" />;
      default: return <AlertCircle className="h-4 w-4 text-muted-foreground" />;
    }
  }

  if (authLoading || loading) {
    return <div className="flex flex-col items-center justify-center min-h-[calc(100vh-15rem)]"><Loader2 className="h-12 w-12 animate-spin text-primary mb-4" /><p className="text-muted-foreground">Loading your bookings...</p></div>;
  }
  if (error) {
     return <div className="text-center py-10"><AlertCircle className="mx-auto h-12 w-12 text-destructive mb-4" /><p className="text-xl text-destructive px-4">{error}</p><Button asChild variant="link" className="mt-4"><Link href="/dashboard"><ChevronLeft className="mr-2 h-4 w-4" />Back to Dashboard</Link></Button></div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-headline font-bold">My Bookings</h1>
        <Button variant="outline" onClick={fetchBookings} disabled={loading || updatingBookingId !== null}><RefreshCw className={`mr-2 h-4 w-4 ${loading || updatingBookingId !== null ? 'animate-spin' : ''}`} />Refresh</Button>
      </div>

      {bookings.length === 0 ? (
        <Card className="text-center py-12"><CardContent><CalendarCheck className="mx-auto h-16 w-16 text-muted-foreground mb-4" /><p className="text-xl text-muted-foreground">You have no bookings yet.</p><Button asChild className="mt-6"><Link href="/barbers">Find a Barber</Link></Button></CardContent></Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {bookings.map(booking => (
            <Card key={booking.id} className="flex flex-col justify-between hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="text-xl">{booking.style || booking.serviceName || "Appointment"}</CardTitle>
                        <CardDescription>with {booking.barberName}</CardDescription>
                    </div>
                     <Badge variant={getStatusBadgeVariant(booking.status)} className="capitalize whitespace-nowrap">
                        {getStatusIcon(booking.status)}
                        <span className="ml-1.5">{booking.status.replace(/_/g, ' ')}</span>
                    </Badge>
                </div>
              </CardHeader>
              <CardContent className="flex-grow space-y-1">
                <p className="text-sm text-foreground"><strong>Date & Time:</strong> {booking.appointmentDateTime ? format(new Date((booking.appointmentDateTime as unknown as Timestamp).seconds * 1000), 'PPP p') : 'N/A'}</p>
                {(booking.status === 'pending_customer_approval' && booking.proposedPriceByBarber !== null && booking.proposedPriceByBarber !== undefined) ? (
                  <p className="text-sm text-amber-700 dark:text-amber-500 font-semibold"><strong>Proposed Price:</strong> RM{booking.proposedPriceByBarber.toFixed(2)}</p>
                ) : (booking.servicePrice !== null && booking.servicePrice !== undefined) ? (
                  <p className="text-sm text-foreground"><strong>Price:</strong> RM{booking.servicePrice.toFixed(2)}</p>
                ) : (
                  <p className="text-sm text-muted-foreground"><strong>Price:</strong> TBD</p>
                )}
                {booking.serviceDuration && (<p className="text-sm text-foreground flex items-center"><Clock className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" /><strong>Duration:</strong> {booking.serviceDuration} minutes</p>)}
                {booking.notes && <p className="text-sm text-muted-foreground mt-2 line-clamp-2"><strong>Notes:</strong> {booking.notes}</p>}
              </CardContent>
              <CardFooter className="border-t pt-4 flex flex-col gap-2">
                {booking.status === 'pending_customer_approval' && (
                  <div className="w-full flex gap-2">
                    <Button variant="default" size="sm" onClick={() => handlePriceResponse(booking.id, true)} disabled={updatingBookingId === booking.id} className="flex-1 bg-green-600 hover:bg-green-700">
                      {updatingBookingId === booking.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <ThumbsUp className="mr-2 h-4 w-4"/>} Accept Price
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handlePriceResponse(booking.id, false)} disabled={updatingBookingId === booking.id} className="flex-1">
                      {updatingBookingId === booking.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <ThumbsDown className="mr-2 h-4 w-4"/>} Reject Price
                    </Button>
                  </div>
                )}
                {booking.status === 'completed' && (
                  <Button variant="outline" size="sm" asChild className="w-full">
                    <Link href={`/reviews/submit/${booking.id}`}><Star className="mr-2 h-4 w-4" />Leave a Review</Link>
                  </Button>
                )}
                 {(booking.status === 'pending_barber_proposal' || booking.status === 'pending_customer_request' || booking.status === 'confirmed') && (
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm" className="w-full" disabled={updatingBookingId === booking.id}>
                                {updatingBookingId === booking.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <CalendarX className="mr-2 h-4 w-4"/>}
                                Cancel Booking
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This will cancel your appointment request with {booking.barberName}. This action cannot be undone.
                            </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                            <AlertDialogCancel disabled={updatingBookingId === booking.id}>Keep Booking</AlertDialogCancel>
                            <AlertDialogAction 
                                onClick={() => handleCancelBookingByCustomer(booking.id)} 
                                disabled={updatingBookingId === booking.id}
                                className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                            >
                                {updatingBookingId === booking.id && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                Yes, Cancel
                            </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                 )}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
       <div className="mt-8"><Button variant="outline" asChild><Link href="/dashboard"><ChevronLeft className="mr-2 h-4 w-4" />Back to Dashboard</Link></Button></div>
    </div>
  );
}
    