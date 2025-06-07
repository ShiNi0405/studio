
'use client';

import { useAuth } from '@/contexts/AuthContext';
import { doc, getDoc, serverTimestamp, addDoc, collection, query, where, getDocs, Timestamp } from 'firebase/firestore'; // Removed setDoc as addDoc is used
import { db } from '@/lib/firebase/config';
import type { Booking, Barber, Review } from '@/types'; // Added Review type
import { useEffect, useState, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import Link from 'next/link';
import { ChevronLeft, Loader2, AlertCircle, Star, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils'; 

const reviewSchema = z.object({
  rating: z.coerce.number().min(1, "Rating is required").max(5, "Rating cannot exceed 5"),
  comment: z.string().min(10, "Comment must be at least 10 characters.").max(1000, "Comment cannot exceed 1000 characters."),
});

type ReviewFormValues = z.infer<typeof reviewSchema>;

function SubmitReviewPageContent() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const params = useParams();
  const router = useRouter();
  const bookingId = params.bookingId as string;

  const [booking, setBooking] = useState<Booking | null>(null);
  const [barber, setBarber] = useState<Barber | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [alreadyReviewed, setAlreadyReviewed] = useState(false);

  const form = useForm<ReviewFormValues>({
    resolver: zodResolver(reviewSchema),
    defaultValues: { rating: 0, comment: "" },
  });
  
  const [hoverRating, setHoverRating] = useState(0);
  const currentRating = form.watch('rating');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push(`/login?redirect=/reviews/submit/${bookingId}`);
      return;
    }

    if (user && bookingId) {
      fetchBookingAndReviewStatus();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading, bookingId]);

  const fetchBookingAndReviewStatus = async () => {
    if (!user) return;
    setLoadingData(true);
    setError(null);
    setAlreadyReviewed(false);
    try {
      const reviewQuery = query(collection(db, 'reviews'), where('bookingId', '==', bookingId), where('customerId', '==', user.uid));
      const reviewSnapshot = await getDocs(reviewQuery);
      if (!reviewSnapshot.empty) {
        setAlreadyReviewed(true);
        setError("You have already submitted a review for this appointment.");
        setLoadingData(false);
        return;
      }

      const bookingDocRef = doc(db, 'bookings', bookingId);
      const bookingSnap = await getDoc(bookingDocRef);

      if (!bookingSnap.exists()) {
        setError("Booking not found.");
        setLoadingData(false);
        return;
      }
      
      const bookingData = { id: bookingSnap.id, ...bookingSnap.data() } as Booking;

      if (bookingData.customerId !== user.uid) {
        setError("You are not authorized to review this booking.");
        setLoadingData(false);
        return;
      }
      if (bookingData.status !== 'completed') {
        setError("You can only review completed appointments.");
        setLoadingData(false);
        return;
      }
      setBooking(bookingData);

      const barberDocRef = doc(db, 'users', bookingData.barberId);
      const barberSnap = await getDoc(barberDocRef);
      if (barberSnap.exists()){
        setBarber({ uid: barberSnap.id, ...barberSnap.data()} as Barber);
      } else {
        setError("Barber details not found.");
      }

    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to load data. Please try again.");
    } finally {
      setLoadingData(false);
    }
  };
  
  const onSubmit = async (values: ReviewFormValues) => {
    if (!user || !booking || !barber) {
        toast({ title: "Error", description: "Missing user or booking information.", variant: "destructive" });
        return;
    }
    if (alreadyReviewed) {
        toast({ title: "Already Reviewed", description: "You have already submitted a review for this appointment.", variant: "default" });
        return;
    }

    setIsSubmitting(true);
    try {
      const reviewData: Omit<Review, 'id'> = { // Omit 'id' as Firestore generates it
        bookingId: booking.id,
        customerId: user.uid,
        customerName: user.displayName || "Anonymous",
        barberId: booking.barberId,
        rating: values.rating,
        comment: values.comment,
        createdAt: serverTimestamp() as Timestamp,
      };
      await addDoc(collection(db, 'reviews'), reviewData);
      toast({ title: "Review Submitted!", description: "Thank you for your feedback." });
      router.push(`/barbers/${booking.barberId}`); 
    } catch (err) {
      console.error("Error submitting review:", err);
      toast({ title: "Submission Failed", description: "Could not submit your review.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };


  if (authLoading || loadingData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-15rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading review form...</p>
      </div>
    );
  }
  
   if (error) {
     return (
      <div className="text-center py-10 max-w-md mx-auto">
        <AlertCircle className="mx-auto h-12 w-12 text-destructive mb-4" />
        <p className="text-xl text-destructive mb-6">{error}</p>
        <Button asChild variant="outline" className="w-full">
          <Link href={booking ? `/barbers/${booking.barberId}` : "/dashboard/my-bookings"}>
            <ChevronLeft className="mr-2 h-4 w-4" /> 
            {alreadyReviewed ? "Back to Barber Profile" : "Back to My Bookings"}
          </Link>
        </Button>
      </div>
    );
  }
  
  if (!booking || !barber) {
      return <div className="text-center py-10"><p>Booking or barber details could not be loaded.</p></div>
  }


  return (
    <div className="max-w-xl mx-auto space-y-8">
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl font-headline">Leave a Review</CardTitle>
          <CardDescription>Share your experience with <span className="font-semibold text-primary">{barber.displayName}</span> for your appointment on {booking.appointmentDateTime ? new Date((booking.appointmentDateTime as any).seconds * 1000).toLocaleDateString() : 'N/A'}.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="rating"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Overall Rating</FormLabel>
                    <FormControl>
                      <div className="flex space-x-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={cn(
                              "h-8 w-8 cursor-pointer transition-colors",
                              (hoverRating || currentRating) >= star ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
                            )}
                            onMouseEnter={() => setHoverRating(star)}
                            onMouseLeave={() => setHoverRating(0)}
                            onClick={() => field.onChange(star)}
                          />
                        ))}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="comment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your Review</FormLabel>
                    <FormControl><Textarea placeholder="Describe your experience..." className="min-h-[120px]" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end space-x-3 pt-4">
                <Button variant="outline" asChild type="button">
                    <Link href={`/barbers/${booking.barberId}`}><ChevronLeft className="mr-2 h-4 w-4" />Cancel</Link>
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Send className="mr-2 h-4 w-4" /> Submit Review
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function SubmitReviewPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-15rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
      </div>
    }>
      <SubmitReviewPageContent />
    </Suspense>
  );
}
