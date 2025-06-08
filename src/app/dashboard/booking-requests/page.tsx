
'use client';

import { useAuth } from '@/contexts/AuthContext';
import { collection, query, where, getDocs, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { Booking, BookingStatus } from '@/types';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { AlertCircle, CalendarCheck, ChevronLeft, Clock, DollarSign, Edit3, Loader2, RefreshCw, XCircle, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
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
import { updateBookingStatusAction, proposePriceAction } from '@/app/actions/bookingActions';


export default function BookingRequestsPage() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingBookingId, setUpdatingBookingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [proposePriceDialogOpen, setProposePriceDialogOpen] = useState(false);
  const [currentBookingForPriceProposal, setCurrentBookingForPriceProposal] = useState<Booking | null>(null);
  const [proposedPrice, setProposedPrice] = useState<string>('');

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
        orderBy('appointmentDateTime', 'asc') // Fetch all relevant, then filter client-side or add more complex query
      );
      const querySnapshot = await getDocs(q);
      const fetchedBookings = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking))
        .filter(b => ['pending_barber_proposal', 'pending_customer_request', 'pending_customer_approval', 'confirmed'].includes(b.status)); // Filter relevant statuses
      setBookings(fetchedBookings);
    } catch (err: any) {
      console.error("Error fetching booking requests:", err);
      setError("Failed to load booking requests. Check Firestore indexes if errors persist in console.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (bookingId: string, newStatus: Extract<BookingStatus, 'confirmed' | 'rejected_by_barber' | 'completed' | 'cancelled_by_barber'>) => {
    setUpdatingBookingId(bookingId);
    const result = await updateBookingStatusAction(bookingId, newStatus);
    if (result.success) {
      toast({ title: "Booking Updated", description: `Booking status changed to ${newStatus.replace(/_/g, ' ')}.`});
      fetchBookingRequests(); // Refresh list
    } else {
      toast({ title: "Update Failed", description: result.error, variant: "destructive" });
    }
    setUpdatingBookingId(null);
  };

  const openProposePriceDialog = (booking: Booking) => {
    setCurrentBookingForPriceProposal(booking);
    setProposedPrice(booking.servicePrice?.toString() || ''); // Pre-fill if there's an initial estimate perhaps
    setProposePriceDialogOpen(true);
  };

  const handleProposePrice = async () => {
    if (!currentBookingForPriceProposal || !proposedPrice) return;
    const price = parseFloat(proposedPrice);
    if (isNaN(price) || price <= 0) {
      toast({ title: "Invalid Price", description: "Please enter a valid positive price.", variant: "destructive" });
      return;
    }
    setUpdatingBookingId(currentBookingForPriceProposal.id);
    const result = await proposePriceAction(currentBookingForPriceProposal.id, price);
    if (result.success) {
      toast({ title: "Price Proposed", description: `Price RM${price.toFixed(2)} proposed to customer.` });
      fetchBookingRequests();
      setProposePriceDialogOpen(false);
    } else {
      toast({ title: "Proposal Failed", description: result.error, variant: "destructive" });
    }
    setUpdatingBookingId(null);
    setCurrentBookingForPriceProposal(null);
  };

  const getStatusBadgeVariant = (status: Booking['status']): "default" | "secondary" | "destructive" | "outline" | "warning" => {
    switch (status) {
      case 'confirmed': return 'default';
      case 'pending_customer_request': return 'warning'; // Yellow-ish
      case 'pending_barber_proposal': return 'secondary';
      case 'pending_customer_approval': return 'warning'; // Yellow-ish
      case 'completed': return 'outline';
      case 'cancelled_by_customer':
      case 'cancelled_by_barber':
      case 'rejected_by_barber':
      case 'rejected_by_customer':
        return 'destructive';
      default: return 'secondary';
    }
  };


  if (authLoading || loading) {
    return <div className="flex flex-col items-center justify-center min-h-[calc(100vh-15rem)]"><Loader2 className="h-12 w-12 animate-spin text-primary mb-4" /><p className="text-muted-foreground">Loading booking requests...</p></div>;
  }
  if (error) {
    return <div className="text-center py-10"><AlertCircle className="mx-auto h-12 w-12 text-destructive mb-4" /><p className="text-xl text-destructive px-4">{error}</p><Button asChild variant="link" className="mt-4"><Link href="/dashboard"><ChevronLeft className="mr-2 h-4 w-4" />Back to Dashboard</Link></Button></div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-headline font-bold">Booking Requests</h1>
         <Button variant="outline" onClick={fetchBookingRequests} disabled={loading || !!updatingBookingId}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading || updatingBookingId ? 'animate-spin' : ''}`} />Refresh
        </Button>
      </div>

      {bookings.length === 0 ? (
        <Card className="text-center py-12"><CardContent><CalendarCheck className="mx-auto h-16 w-16 text-muted-foreground mb-4" /><p className="text-xl text-muted-foreground">No active booking requests.</p></CardContent></Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {bookings.map(booking => (
            <Card key={booking.id} className="flex flex-col justify-between hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-xl">{booking.style || booking.serviceName || "Appointment Request"}</CardTitle>
                <CardDescription>From: {booking.customerName}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow space-y-1">
                <p className="text-sm text-foreground"><strong>Date & Time:</strong> {booking.appointmentDateTime ? format(new Date((booking.appointmentDateTime as unknown as Timestamp).seconds * 1000), 'PPP p') : 'N/A'}</p>
                {(booking.servicePrice !== null && booking.servicePrice !== undefined) ? (
                    <p className="text-sm text-foreground"><strong>Price:</strong> RM{booking.servicePrice.toFixed(2)}</p>
                ) : booking.proposedPriceByBarber ? (
                    <p className="text-sm text-foreground"><strong>Proposed Price:</strong> RM{booking.proposedPriceByBarber.toFixed(2)}</p>
                ) : (
                    <p className="text-sm text-muted-foreground"><strong>Price:</strong> TBD by you</p>
                )}
                {booking.serviceDuration && (<p className="text-sm text-foreground flex items-center"><Clock className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" /><strong>Duration:</strong> {booking.serviceDuration} minutes</p>)}
                {booking.notes && <p className="text-sm text-muted-foreground mt-2 line-clamp-2"><strong>Notes:</strong> {booking.notes}</p>}
                <Badge 
                    variant={getStatusBadgeVariant(booking.status)} 
                    className="mt-3 capitalize"
                >
                    {booking.status.replace(/_/g, ' ')}
                </Badge>
              </CardContent>
              <CardFooter className="border-t pt-4 flex flex-col gap-2">
                {booking.status === 'pending_barber_proposal' && ( // Priced service, barber needs to accept/reject
                  <div className="w-full flex gap-2">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground" disabled={updatingBookingId === booking.id}>
                            {updatingBookingId === booking.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}Accept
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader><AlertDialogTitle>Confirm Acceptance</AlertDialogTitle><AlertDialogDescription>A fee of RM5.00 will be charged to accept this booking (simulated).</AlertDialogDescription></AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleUpdateStatus(booking.id, 'confirmed')} disabled={updatingBookingId === booking.id} className="bg-accent hover:bg-accent/90">
                            {updatingBookingId === booking.id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Pay RM5.00 & Accept
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                    <Button variant="destructive" size="sm" onClick={() => handleUpdateStatus(booking.id, 'rejected_by_barber')} disabled={updatingBookingId === booking.id} className="flex-1">
                        {updatingBookingId === booking.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <XCircle className="mr-2 h-4 w-4" />}Reject
                    </Button>
                  </div>
                )}
                {booking.status === 'pending_customer_request' && ( // Custom style, barber needs to propose price
                  <Button size="sm" onClick={() => openProposePriceDialog(booking)} disabled={updatingBookingId === booking.id} className="w-full">
                    {updatingBookingId === booking.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Edit3 className="mr-2 h-4 w-4" />}Propose Price
                  </Button>
                )}
                {booking.status === 'pending_customer_approval' && (
                  <p className="text-sm text-muted-foreground text-center w-full">Waiting for customer to respond to your price proposal of RM{booking.proposedPriceByBarber?.toFixed(2)}.</p>
                )}
                {booking.status === 'confirmed' && (
                  <div className="w-full flex flex-col gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleUpdateStatus(booking.id, 'completed')} disabled={updatingBookingId === booking.id} className="w-full">
                         {updatingBookingId === booking.id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Mark as Completed
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleUpdateStatus(booking.id, 'cancelled_by_barber')} disabled={updatingBookingId === booking.id} className="w-full">
                         {updatingBookingId === booking.id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Cancel Appointment
                    </Button>
                  </div>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Propose Price Dialog */}
      <AlertDialog open={proposePriceDialogOpen} onOpenChange={setProposePriceDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Propose Price for "{currentBookingForPriceProposal?.style || currentBookingForPriceProposal?.serviceName}"</AlertDialogTitle>
            <AlertDialogDescription>
              Enter the price (RM) you want to propose for this custom request from {currentBookingForPriceProposal?.customerName}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="proposedPrice">Price (RM)</Label>
            <Input 
                id="proposedPrice" 
                type="number" 
                value={proposedPrice} 
                onChange={(e) => setProposedPrice(e.target.value)} 
                placeholder="e.g., 75.00"
                min="0.01"
                step="0.01"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setCurrentBookingForPriceProposal(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleProposePrice} disabled={updatingBookingId === currentBookingForPriceProposal?.id || !proposedPrice || parseFloat(proposedPrice) <=0}>
              {updatingBookingId === currentBookingForPriceProposal?.id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit Proposal
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="mt-8"><Button variant="outline" asChild><Link href="/dashboard"><ChevronLeft className="mr-2 h-4 w-4" />Back to Dashboard</Link></Button></div>
    </div>
  );
}
    