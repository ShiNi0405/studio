
'use client';
import { useAuth } from '@/presentation/contexts/AuthContext';
import { collection, query, where, getDocs, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '@/infrastructure/firebase/config';
import type { Review } from '@/domain/entities';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/presentation/components/ui/card';
import { Button } from '@/presentation/components/ui/button';
import Link from 'next/link';
import { AlertCircle, ChevronLeft, Loader2, RefreshCw, Star } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function MyReviewsPage() {
  const { user, loading: authLoading } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && user && user.role === 'barber') {
      fetchReviews();
    } else if (!authLoading && !user) {
      setLoading(false);
      setError("Please log in to view your reviews.");
    } else if (!authLoading && user && user.role !== 'barber') {
      setLoading(false);
      setError("This page is for barbers only.");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading]);

  const fetchReviews = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const q = query(
        collection(db, 'reviews'),
        where('barberId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const fetchedReviews = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Review));
      setReviews(fetchedReviews);
    } catch (err) {
      console.error("Error fetching reviews:", err);
      setError("Failed to load your reviews. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-15rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading your reviews...</p>
      </div>
    );
  }
  
  if (error) {
     return (
      <div className="text-center py-10">
        <AlertCircle className="mx-auto h-12 w-12 text-destructive mb-4" />
        <p className="text-xl text-destructive">{error}</p>
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
        <h1 className="text-3xl font-headline font-bold">My Customer Reviews</h1>
        <Button variant="outline" onClick={fetchReviews} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {reviews.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Star className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-xl text-muted-foreground">You have no reviews yet.</p>
            <CardDescription className="mt-2">Keep up the great work! Reviews will appear here as customers submit them.</CardDescription>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {reviews.map(review => (
            <Card key={review.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{review.customerName || "Anonymous Customer"}</CardTitle>
                    <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`w-5 h-5 ${i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
                        ))}
                    </div>
                </div>
                <CardDescription>
                    {formatDistanceToNow(new Date((review.createdAt as unknown as Timestamp).seconds * 1000), { addSuffix: true })}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-foreground/90">{review.comment}</p>
              </CardContent>
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
