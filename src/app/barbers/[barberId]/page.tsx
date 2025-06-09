
'use client';

import { useEffect, useState, Suspense, useMemo } from 'react';
import { collection, query, where, getDocs, doc, getDoc, orderBy, Timestamp } from 'firebase/firestore';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { db } from '@/infrastructure/firebase/config';
import type { Barber, Review, OfferedHaircut } from '@/domain/entities';
import { Button } from '@/presentation/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/presentation/components/ui/card';
import { Skeleton } from '@/presentation/components/ui/skeleton';
import { CalendarCheck, ChevronLeft, MapPin, Scissors, Star, Users, Clock, Image as ImageIcon, Briefcase, Tag, Sparkles } from 'lucide-react';
import { Badge } from '@/presentation/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/presentation/components/ui/tabs";


const PortfolioSection = ({ offeredHaircuts }: { offeredHaircuts?: OfferedHaircut[] }) => {
  const allPortfolioImages = useMemo(() => {
    if (!offeredHaircuts) return [];
    return offeredHaircuts.flatMap(service =>
      (service.portfolioImageURLs || []).map(url => ({
        url,
        serviceName: service.haircutName,
        serviceGender: service.gender,
      }))
    );
  }, [offeredHaircuts]);

  if (allPortfolioImages.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><ImageIcon className="w-5 h-5 mr-2 text-primary"/>Portfolio</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">This barber hasn't added any portfolio images for their offered haircuts yet.</p>
        </CardContent>
      </Card>
    );
  }

  const mensImages = allPortfolioImages.filter(img => img.serviceGender === 'men');
  const womensImages = allPortfolioImages.filter(img => img.serviceGender === 'women');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center"><ImageIcon className="w-5 h-5 mr-2 text-primary"/>Portfolio</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="men-portfolio" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="men-portfolio">Men's Styles ({mensImages.length})</TabsTrigger>
            <TabsTrigger value="women-portfolio">Women's Styles ({womensImages.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="men-portfolio" className="mt-4">
            {mensImages.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {mensImages.map((image, index) => (
                  <div key={`men-${index}-${image.url}`} className="aspect-square relative rounded-md overflow-hidden shadow-md group">
                    <Image
                      src={image.url}
                      alt={`Portfolio for ${image.serviceName}`}
                      data-ai-hint={`barber portfolio ${image.serviceName}`}
                      fill
                      sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      className="object-cover transition-transform group-hover:scale-105"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white p-1.5 text-xs truncate opacity-0 group-hover:opacity-100 transition-opacity">
                      {image.serviceName}
                    </div>
                  </div>
                ))}
              </div>
            ) : <p className="text-muted-foreground text-sm text-center py-4">No men's hairstyle portfolio images yet.</p>}
          </TabsContent>
          <TabsContent value="women-portfolio" className="mt-4">
            {womensImages.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {womensImages.map((image, index) => (
                  <div key={`women-${index}-${image.url}`} className="aspect-square relative rounded-md overflow-hidden shadow-md group">
                    <Image
                      src={image.url}
                      alt={`Portfolio for ${image.serviceName}`}
                      data-ai-hint={`barber portfolio ${image.serviceName}`}
                      fill
                      sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      className="object-cover transition-transform group-hover:scale-105"
                    />
                     <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white p-1.5 text-xs truncate opacity-0 group-hover:opacity-100 transition-opacity">
                      {image.serviceName}
                    </div>
                  </div>
                ))}
              </div>
            ) : <p className="text-muted-foreground text-sm text-center py-4">No women's hairstyle portfolio images yet.</p>}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};


const ReviewList = ({ barberId }: { barberId: string }) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReviews = async () => {
      setLoading(true); setError(null);
      try {
        const q = query(collection(db, 'reviews'), where('barberId', '==', barberId), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        const fetchedReviews = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Review));
        setReviews(fetchedReviews);
      } catch (err) { console.error("Error fetching reviews:", err); setError("Failed to load reviews.");
      } finally { setLoading(false); }
    };
    fetchReviews();
  }, [barberId]);

  const { averageRating, totalReviews } = useMemo(() => {
    if (reviews.length === 0) return { averageRating: 0, totalReviews: 0 };
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    return { averageRating: parseFloat((totalRating / reviews.length).toFixed(1)), totalReviews: reviews.length };
  }, [reviews]);

  if (loading) return <Card><CardHeader><Skeleton className="h-6 w-36" /></CardHeader><CardContent className="space-y-4">{[...Array(2)].map((_, i) => (<div key={i} className="border-t pt-4"><Skeleton className="h-5 w-1/4 mb-1" /><Skeleton className="h-4 w-3/4" /><Skeleton className="h-3 w-1/3 mt-1" /></div>))}</CardContent></Card>;
  if (error) return <Card><CardHeader><CardTitle className="flex items-center"><Star className="w-5 h-5 mr-2 text-yellow-500 fill-yellow-500"/>Customer Reviews</CardTitle></CardHeader><CardContent><p className="text-destructive">{error}</p></CardContent></Card>;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
            <Star className="w-5 h-5 mr-2 text-yellow-500 fill-yellow-500"/>Customer Reviews
            {totalReviews > 0 && <span className="ml-2 text-base font-normal text-muted-foreground">({averageRating.toFixed(1)} average from {totalReviews} reviews)</span>}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {totalReviews === 0 ? <p className="text-muted-foreground">No reviews yet for this barber.</p> : (
          <div className="space-y-4">
            {reviews.map(review => (
              <div key={review.id} className="border-t pt-4 first:border-t-0 first:pt-0">
                <div className="flex items-center mb-1">
                  {[...Array(5)].map((_, i) => (<Star key={i} className={`w-4 h-4 ${i < review.rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`} />))}
                  <p className="ml-2 text-sm font-medium">{review.customerName || "Anonymous"}</p>
                </div>
                <p className="text-sm text-foreground/80">{review.comment}</p>
                <p className="text-xs text-muted-foreground mt-1">{review.createdAt ? formatDistanceToNow(new Date((review.createdAt as unknown as Timestamp).seconds * 1000), { addSuffix: true }) : 'N/A'}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const AvailabilityDisplay = ({ availabilityString }: { availabilityString?: string }) => {
  let availability: Record<string, string[]> = {};
  const daysOrder = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
  try { if (availabilityString) availability = JSON.parse(availabilityString); } catch (e) { console.error("Failed to parse availability JSON:", e); return <p className="text-destructive">Error displaying availability.</p>; }
  const availableDays = daysOrder.filter(day => availability[day] && availability[day].length > 0);
  if (availableDays.length === 0) return <p className="text-muted-foreground">Availability not set or currently unavailable.</p>;
  return <div className="space-y-3">{availableDays.map(day => (<div key={day} className="p-3 bg-muted/50 rounded-md"><h4 className="font-semibold capitalize text-primary">{day}</h4><ul className="list-disc list-inside pl-1 space-y-1 mt-1">{availability[day].map((slot, index) => (<li key={index} className="text-sm text-foreground/90 flex items-center"><Clock className="w-3.5 h-3.5 mr-2 text-muted-foreground" /> {slot}</li>))}</ul></div>))}</div>;
};

const ServicesDisplay = ({ services }: { services?: OfferedHaircut[] }) => {
  if (!services || services.length === 0) {
    return (
      <Card>
        <CardHeader><CardTitle className="flex items-center"><Tag className="w-5 h-5 mr-2 text-primary"/>Services Offered</CardTitle></CardHeader>
        <CardContent><p className="text-muted-foreground">This barber hasn't listed any specific haircuts yet.</p></CardContent>
      </Card>
    );
  }
  const mensServices = services.filter(s => s.gender === 'men');
  const womensServices = services.filter(s => s.gender === 'women');

  return (
    <Card>
      <CardHeader><CardTitle className="flex items-center"><Tag className="w-5 h-5 mr-2 text-primary"/>Haircuts Offered</CardTitle></CardHeader>
      <CardContent>
        <Tabs defaultValue="men-services" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="men-services">Men's Haircuts ({mensServices.length})</TabsTrigger>
            <TabsTrigger value="women-services">Women's Haircuts ({womensServices.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="men-services" className="mt-4 space-y-3">
            {mensServices.length > 0 ? mensServices.map(service => (
              <div key={service.id} className="p-3 bg-muted/50 rounded-md flex justify-between items-center">
                <div>
                  <h4 className="font-semibold text-foreground/90">{service.haircutName}</h4>
                  {service.duration && <p className="text-xs text-muted-foreground flex items-center"><Clock className="w-3 h-3 mr-1"/>{service.duration} minutes</p>}
                </div>
                <p className="font-semibold text-primary text-lg">RM{service.price.toFixed(2)}</p>
              </div>
            )) : <p className="text-muted-foreground text-sm text-center py-4">No men's haircuts listed.</p>}
          </TabsContent>
          <TabsContent value="women-services" className="mt-4 space-y-3">
            {womensServices.length > 0 ? womensServices.map(service => (
              <div key={service.id} className="p-3 bg-muted/50 rounded-md flex justify-between items-center">
                <div>
                  <h4 className="font-semibold text-foreground/90">{service.haircutName}</h4>
                  {service.duration && <p className="text-xs text-muted-foreground flex items-center"><Clock className="w-3 h-3 mr-1"/>{service.duration} minutes</p>}
                </div>
                <p className="font-semibold text-primary text-lg">RM{service.price.toFixed(2)}</p>
              </div>
            )) : <p className="text-muted-foreground text-sm text-center py-4">No women's haircuts listed.</p>}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

const AvailabilityCard = ({ availabilityString }: { availabilityString?: string }) => (
  <Card>
    <CardHeader><CardTitle className="flex items-center"><CalendarCheck className="w-5 h-5 mr-2 text-primary"/>Availability</CardTitle><CardDescription>General weekly availability. Specific times confirmed during booking.</CardDescription></CardHeader>
    <CardContent><AvailabilityDisplay availabilityString={availabilityString} /></CardContent>
  </Card>
);

function BarberProfilePageContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const barberId = params.barberId as string;
  
  const preferredStyleName = searchParams.get('style'); 
  const preferredHaircutOptionId = searchParams.get('haircutOptionId'); 

  const [barber, setBarber] = useState<Barber | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (barberId) {
      const fetchBarber = async () => {
        setLoading(true); setError(null);
        try {
          const docRef = doc(db, 'users', barberId);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists() && docSnap.data()?.role === 'barber') {
            setBarber({ uid: docSnap.id, ...docSnap.data() } as Barber);
          } else { setError("Barber not found or user is not a barber."); }
        } catch (err) { console.error("Error fetching barber:", err); setError("Failed to load barber profile.");
        } finally { setLoading(false); }
      };
      fetchBarber();
    }
  }, [barberId]);

  if (loading) return <ProfileSkeleton />;
  if (error) return <div className="text-center py-10"><p className="text-xl text-destructive">{error}</p><Button asChild variant="link" className="mt-4"><Link href="/barbers"><ChevronLeft className="mr-2 h-4 w-4" /> Back to Barbers</Link></Button></div>;
  if (!barber) return null;

  let bookLink = `/barbers/${barber.uid}/book`;
  const queryParams = new URLSearchParams();
  if (preferredStyleName) queryParams.append('style', preferredStyleName);
  if (preferredHaircutOptionId) queryParams.append('haircutOptionId', preferredHaircutOptionId);
  const queryString = queryParams.toString();
  if (queryString) bookLink += `?${queryString}`;


  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <Button asChild variant="outline" className="mb-6"><Link href="/barbers"><ChevronLeft className="mr-2 h-4 w-4" /> Back to Barbers</Link></Button>
      <Card className="overflow-hidden shadow-xl">
        <div className="md:flex">
          <div className="md:w-1/3 relative"><Image src={barber.photoURL || `https://placehold.co/400x400.png?text=${encodeURIComponent(barber.displayName?.[0] || 'B')}`} alt={barber.displayName || 'Barber'} data-ai-hint="barber professional" width={400} height={400} className="object-cover w-full h-64 md:h-full" priority /></div>
          <div className="md:w-2/3 p-6 md:p-8">
            <h1 className="text-4xl font-headline font-bold text-primary mb-2">{barber.displayName}</h1>
            {barber.location && <p className="text-muted-foreground flex items-center mb-1"><MapPin className="w-4 h-4 mr-2"/> {barber.location}</p>}
            <p className="text-muted-foreground flex items-center mb-1"><Users className="w-4 h-4 mr-2"/> Member since {barber.createdAt ? new Date(barber.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}</p>
            {barber.experienceYears !== undefined && barber.experienceYears !== null && <p className="text-muted-foreground flex items-center mb-1"><Briefcase className="w-4 h-4 mr-2"/> {barber.experienceYears} years of experience</p>}
            <p className="text-foreground/80 my-4">{barber.bio || "Dedicated to crafting the perfect look."}</p>
            {barber.specialties && barber.specialties.length > 0 && (
              <div className="mb-4">
                <h3 className="text-lg font-semibold mb-2 flex items-center"><Sparkles className="w-5 h-5 mr-2 text-primary"/>Specialties</h3>
                <div className="flex flex-wrap gap-2">{barber.specialties.map(specialty => (<Badge key={specialty} variant="secondary" className="px-3 py-1 text-sm">{specialty}</Badge>))}</div>
              </div>
            )}
            <Button size="lg" asChild className="w-full md:w-auto mt-4 transition-all-subtle hover:scale-105"><Link href={bookLink}>Book Appointment {preferredStyleName && `for "${preferredStyleName}"`}</Link></Button>
          </div>
        </div>
      </Card>
      <div className="grid md:grid-cols-1 lg:grid-cols-2 gap-8">
        <ServicesDisplay services={barber.servicesOffered} />
        <AvailabilityCard availabilityString={barber.availability} />
      </div>
      <PortfolioSection offeredHaircuts={barber.servicesOffered} />
      <ReviewList barberId={barber.uid} />
    </div>
  );
}

export default function BarberProfilePage() { return <Suspense fallback={<ProfileSkeleton/>}><BarberProfilePageContent /></Suspense>; }

const ProfileSkeleton = () => (
  <div className="max-w-5xl mx-auto space-y-8">
     <Skeleton className="h-10 w-40 mb-6" />
    <Card className="overflow-hidden shadow-xl"><div className="md:flex"><div className="md:w-1/3"><Skeleton className="w-full h-64 md:h-full" /></div><div className="md:w-2/3 p-6 md:p-8 space-y-4"><Skeleton className="h-10 w-3/4" /><Skeleton className="h-6 w-1/2" /><Skeleton className="h-5 w-1/3" /><Skeleton className="h-5 w-1/4" /><Skeleton className="h-20 w-full" /><Skeleton className="h-12 w-full md:w-1/2" /></div></div></Card>
    <div className="grid md:grid-cols-1 lg:grid-cols-2 gap-8">
      <Card><CardHeader><Skeleton className="h-8 w-1/2 mb-2"/><Skeleton className="h-4 w-3/4"/></CardHeader><CardContent className="p-6 space-y-3"><Skeleton className="h-24 w-full"/></CardContent></Card>
      <Card><CardHeader><Skeleton className="h-8 w-1/2 mb-2"/></CardHeader><CardContent className="p-6 space-y-3"><Skeleton className="h-24 w-full"/></CardContent></Card>
    </div>
     <Card><CardHeader><Skeleton className="h-8 w-1/2 mb-2"/></CardHeader><CardContent className="p-6 space-y-3"><Skeleton className="h-40 w-full"/></CardContent></Card>
  </div>
);
