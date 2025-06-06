'use client';

import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { db } from '@/lib/firebase/config';
import type { Barber, Review as ReviewType } from '@/types'; // Assuming Review type is also in types
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { CalendarCheck, ChevronLeft, MapPin, Scissors, Star, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
// Placeholder components - these would be actual implementations
// import ReviewList from '@/components/reviews/ReviewList'; 
// import AvailabilityCalendar from '@/components/barbers/AvailabilityCalendar';

// Placeholder ReviewList
const ReviewList = ({ barberId }: { barberId: string }) => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center"><Star className="w-5 h-5 mr-2 text-yellow-500 fill-yellow-500"/>Customer Reviews</CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-muted-foreground">Reviews for this barber will appear here.</p>
      {/* Example review item structure */}
      <div className="mt-4 border-t pt-4">
        <div className="flex items-center mb-1">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className={`w-4 h-4 ${i < 4 ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`} />
          ))}
          <p className="ml-2 text-sm font-medium">John D.</p>
        </div>
        <p className="text-sm text-foreground/80">"Great haircut, very professional!"</p>
        <p className="text-xs text-muted-foreground mt-1">2 days ago</p>
      </div>
    </CardContent>
  </Card>
);

// Placeholder AvailabilityCalendar
const AvailabilityCalendar = ({ barberId, availabilityString }: { barberId: string, availabilityString?: string }) => {
  let availability = {};
  try {
    if (availabilityString) availability = JSON.parse(availabilityString);
  } catch (e) { console.error("Failed to parse availability", e); }

  return (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center"><CalendarCheck className="w-5 h-5 mr-2 text-primary"/>Availability</CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-muted-foreground">Barber&apos;s schedule will be displayed here.</p>
      {/* Example: Displaying raw availability if present */}
      {Object.keys(availability).length > 0 && (
        <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-x-auto">
          {JSON.stringify(availability, null, 2)}
        </pre>
      )}
    </CardContent>
  </Card>
  );
};


export default function BarberProfilePage() {
  const params = useParams();
  const barberId = params.barberId as string;
  const [barber, setBarber] = useState<Barber | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
          setError("Failed to load barber profile.");
        } finally {
          setLoading(false);
        }
      };
      fetchBarber();
    }
  }, [barberId]);

  if (loading) {
    return <ProfileSkeleton />;
  }

  if (error) {
    return (
      <div className="text-center py-10">
        <p className="text-xl text-destructive">{error}</p>
        <Button asChild variant="link" className="mt-4">
          <Link href="/barbers">
            <ChevronLeft className="mr-2 h-4 w-4" /> Back to Barbers
          </Link>
        </Button>
      </div>
    );
  }

  if (!barber) {
    return null; // Should be covered by error state
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <Button asChild variant="outline" className="mb-6">
        <Link href="/barbers">
          <ChevronLeft className="mr-2 h-4 w-4" /> Back to Barbers
        </Link>
      </Button>

      <Card className="overflow-hidden shadow-xl">
        <div className="md:flex">
          <div className="md:w-1/3 relative">
            <Image
              src={barber.photoURL || `https://placehold.co/400x400.png?text=${encodeURIComponent(barber.displayName || 'B')}`}
              alt={barber.displayName || 'Barber'}
              data-ai-hint="barber professional"
              width={400}
              height={400}
              className="object-cover w-full h-64 md:h-full"
            />
             {/* Placeholder for online status indicator */}
            {/* <Badge className="absolute top-4 right-4 bg-green-500 text-white">Online</Badge> */}
          </div>
          <div className="md:w-2/3 p-6 md:p-8">
            <h1 className="text-4xl font-headline font-bold text-primary mb-2">{barber.displayName}</h1>
            <div className="flex items-center text-yellow-500 mb-4">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className={`w-5 h-5 ${i < 4 ? 'fill-current' : ''}`} /> /* Assuming 4.x stars */
              ))}
              <span className="ml-2 text-sm text-muted-foreground">(4.7 from 120 reviews)</span> {/* Placeholder */}
            </div>
            
            {/* <p className="text-muted-foreground flex items-center mb-1"><MapPin className="w-4 h-4 mr-2"/> {barber.location || "City, State"}</p> */}
            <p className="text-muted-foreground flex items-center mb-4"><Users className="w-4 h-4 mr-2"/> Member since {barber.createdAt ? new Date(barber.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}</p>

            <p className="text-foreground/80 mb-6">{barber.bio || "Dedicated to crafting the perfect look for every client. With years of experience and a passion for precision, I offer a range of services to meet your grooming needs."}</p>
            
            {barber.specialties && barber.specialties.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2 flex items-center"><Scissors className="w-5 h-5 mr-2 text-primary"/>Specialties</h3>
                <div className="flex flex-wrap gap-2">
                  {barber.specialties.map(specialty => (
                    <Badge key={specialty} variant="secondary" className="px-3 py-1 text-sm">{specialty}</Badge>
                  ))}
                </div>
              </div>
            )}
            
            {barber.experienceYears !== undefined && (
                <p className="text-sm text-muted-foreground mb-1"><strong>Experience:</strong> {barber.experienceYears} years</p>
            )}
            
            <Button size="lg" asChild className="w-full md:w-auto mt-4 transition-all-subtle hover:scale-105">
              <Link href={`/barbers/${barber.uid}/book`}>Book Appointment</Link>
            </Button>
          </div>
        </div>
      </Card>
      
      <div className="grid md:grid-cols-2 gap-8">
        <AvailabilityCalendar barberId={barber.uid} availabilityString={barber.availability} />
        <ReviewList barberId={barber.uid} />
      </div>

    </div>
  );
}

const ProfileSkeleton = () => (
  <div className="max-w-5xl mx-auto space-y-8">
     <Skeleton className="h-10 w-40 mb-6" />
    <Card className="overflow-hidden shadow-xl">
      <div className="md:flex">
        <div className="md:w-1/3">
          <Skeleton className="w-full h-64 md:h-full" />
        </div>
        <div className="md:w-2/3 p-6 md:p-8 space-y-4">
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-5 w-1/3" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-12 w-full md:w-1/2" />
        </div>
      </div>
    </Card>
    <div className="grid md:grid-cols-2 gap-8">
      <Card><CardContent className="p-6 space-y-3"><Skeleton className="h-8 w-1/2"/><Skeleton className="h-40 w-full"/></CardContent></Card>
      <Card><CardContent className="p-6 space-y-3"><Skeleton className="h-8 w-1/2"/><Skeleton className="h-40 w-full"/></CardContent></Card>
    </div>
  </div>
);
