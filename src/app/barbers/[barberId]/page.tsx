
'use client';

import { useEffect, useState, Suspense } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { db } from '@/lib/firebase/config';
import type { Barber } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { CalendarCheck, ChevronLeft, MapPin, Scissors, Star, Users, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const ReviewList = ({ barberId }: { barberId: string }) => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center"><Star className="w-5 h-5 mr-2 text-yellow-500 fill-yellow-500"/>Customer Reviews</CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-muted-foreground">Reviews for this barber will appear here.</p>
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

const AvailabilityDisplay = ({ availabilityString }: { availabilityString?: string }) => {
  let availability: Record<string, string[]> = {};
  const daysOrder = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

  try {
    if (availabilityString) {
      availability = JSON.parse(availabilityString);
    }
  } catch (e) {
    console.error("Failed to parse availability JSON:", e);
    return <p className="text-destructive">Error displaying availability.</p>;
  }

  const availableDays = daysOrder.filter(day => availability[day] && availability[day].length > 0);

  if (availableDays.length === 0) {
    return <p className="text-muted-foreground">Availability not set or currently unavailable.</p>;
  }

  return (
    <div className="space-y-3">
      {availableDays.map(day => (
        <div key={day} className="p-3 bg-muted/50 rounded-md">
          <h4 className="font-semibold capitalize text-primary">{day}</h4>
          <ul className="list-disc list-inside pl-1 space-y-1 mt-1">
            {availability[day].map((slot, index) => (
              <li key={index} className="text-sm text-foreground/90 flex items-center">
                <Clock className="w-3.5 h-3.5 mr-2 text-muted-foreground" /> {slot}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
};


const AvailabilityCard = ({ barberId, availabilityString }: { barberId: string, availabilityString?: string }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center"><CalendarCheck className="w-5 h-5 mr-2 text-primary"/>Availability</CardTitle>
        <CardDescription>General weekly availability. Specific dates/times can be confirmed during booking.</CardDescription>
      </CardHeader>
      <CardContent>
        <AvailabilityDisplay availabilityString={availabilityString} />
      </CardContent>
    </Card>
  );
};

function BarberProfilePageContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const barberId = params.barberId as string;
  const suggestedStyle = searchParams.get('style');

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
    return null; 
  }

  const bookLink = suggestedStyle 
    ? `/barbers/${barber.uid}/book?style=${encodeURIComponent(suggestedStyle)}`
    : `/barbers/${barber.uid}/book`;

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
              src={barber.photoURL || `https://placehold.co/400x400.png?text=${encodeURIComponent(barber.displayName?.[0] || 'B')}`}
              alt={barber.displayName || 'Barber'}
              data-ai-hint="barber professional"
              width={400}
              height={400}
              className="object-cover w-full h-64 md:h-full"
              priority
            />
          </div>
          <div className="md:w-2/3 p-6 md:p-8">
            <h1 className="text-4xl font-headline font-bold text-primary mb-2">{barber.displayName}</h1>
            <div className="flex items-center text-yellow-500 mb-4">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className={`w-5 h-5 ${i < 4 ? 'fill-current' : ''}`} /> 
              ))}
              <span className="ml-2 text-sm text-muted-foreground">(4.7 from 120 reviews)</span> {/* Placeholder */}
            </div>
            
            <p className="text-muted-foreground flex items-center mb-1"><Users className="w-4 h-4 mr-2"/> Member since {barber.createdAt ? new Date(barber.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}</p>
            {barber.experienceYears !== undefined && (
                <p className="text-muted-foreground flex items-center mb-4"><CalendarCheck className="w-4 h-4 mr-2"/> {barber.experienceYears} years of experience</p>
            )}
            

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
                        
            <Button size="lg" asChild className="w-full md:w-auto mt-4 transition-all-subtle hover:scale-105">
              <Link href={bookLink}>Book Appointment {suggestedStyle && `for ${suggestedStyle}`}</Link>
            </Button>
          </div>
        </div>
      </Card>
      
      <div className="grid md:grid-cols-2 gap-8">
        <AvailabilityCard barberId={barber.uid} availabilityString={barber.availability} />
        <ReviewList barberId={barber.uid} />
      </div>

    </div>
  );
}


export default function BarberProfilePage() {
  return (
    <Suspense fallback={<ProfileSkeleton/>}>
      <BarberProfilePageContent />
    </Suspense>
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
          <Skeleton className="h-5 w-1/4" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-12 w-full md:w-1/2" />
        </div>
      </div>
    </Card>
    <div className="grid md:grid-cols-2 gap-8">
      <Card><CardHeader><Skeleton className="h-8 w-1/2 mb-2"/><Skeleton className="h-4 w-3/4"/></CardHeader><CardContent className="p-6 space-y-3"><Skeleton className="h-24 w-full"/></CardContent></Card>
      <Card><CardHeader><Skeleton className="h-8 w-1/2 mb-2"/></CardHeader><CardContent className="p-6 space-y-3"><Skeleton className="h-24 w-full"/></CardContent></Card>
    </div>
  </div>
);
