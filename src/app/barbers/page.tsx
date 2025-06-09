
'use client';

import { useEffect, useState, Suspense } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/infrastructure/firebase/config';
import type { Barber } from '@/domain/entities';
import BarberCard from '@/presentation/components/barbers/BarberCard';
import { Skeleton } from '@/presentation/components/ui/skeleton';
import { Input } from '@/presentation/components/ui/input';
import { Search, Scissors } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { getHaircutOptionById } from '@/shared/config/hairstyleOptions';


function BarbersPageContent() {
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  const searchParams = useSearchParams();
  const suggestedStyleName = searchParams.get('style'); 
  const haircutOptionId = searchParams.get('haircutOptionId'); 

  useEffect(() => {
    const fetchBarbers = async () => {
      setLoading(true);
      setError(null);
      try {
        const q = query(
          collection(db, 'users'), 
          where('role', '==', 'barber'),
        );
        const querySnapshot = await getDocs(q);
        const fetchedBarbers: Barber[] = [];
        querySnapshot.forEach((doc) => {
          fetchedBarbers.push({ uid: doc.id, ...doc.data(), subscriptionActive: true } as Barber); 
        });
        setBarbers(fetchedBarbers);
      } catch (err) {
        console.error("Error fetching barbers:", err);
        setError("Failed to load barbers. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchBarbers();
  }, []);

  const filteredBarbers = barbers.filter(barber =>
    (barber.displayName && barber.displayName.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (barber.specialties && barber.specialties.join(', ').toLowerCase().includes(searchTerm.toLowerCase())) ||
    (barber.bio && barber.bio.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const pageTitle = haircutOptionId 
    ? `Barbers who might offer ${getHaircutOptionById(haircutOptionId)?.name || suggestedStyleName || 'your selected style'}`
    : suggestedStyleName 
    ? `Barbers who might suit a "${suggestedStyleName}" style`
    : "Find Your Next Barber";
  
  const pageDescription = haircutOptionId || suggestedStyleName
    ? `Browse barbers below. Those explicitly offering this style will be highlighted.`
    : "Browse our curated list of talented barbers.";


  return (
    <div className="space-y-8">
      <header className="text-center">
        <h1 className="text-4xl font-headline font-bold text-primary">{pageTitle}</h1>
        <p className="mt-2 text-lg text-foreground/80">{pageDescription}</p>
      </header>

      <div className="relative max-w-xl mx-auto">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search by name, specialty (e.g., fades, beards)..."
          className="pl-10 w-full"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      
      {error && (
        <div className="text-center text-destructive bg-destructive/10 p-4 rounded-md">
          <p>{error}</p>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : filteredBarbers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredBarbers.map((barber) => (
            <BarberCard 
              key={barber.uid} 
              barber={barber} 
              preferredHaircutOptionId={haircutOptionId}
              preferredStyleName={suggestedStyleName}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
           <Scissors className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
          <p className="text-xl text-muted-foreground">No barbers found matching your criteria.</p>
          {searchTerm && <p className="text-sm text-muted-foreground mt-2">Try adjusting your search terms.</p>}
        </div>
      )}
    </div>
  );
}

export default function BarbersPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-[calc(100vh-10rem)]"><div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div></div>}>
      <BarbersPageContent />
    </Suspense>
  )
}


const CardSkeleton = () => (
  <div className="bg-card p-4 rounded-lg shadow-md space-y-3">
    <Skeleton className="h-40 w-full rounded-md" />
    <Skeleton className="h-6 w-3/4" />
    <Skeleton className="h-4 w-1/2" />
    <Skeleton className="h-4 w-full" />
    <Skeleton className="h-10 w-full mt-2 rounded-md" />
  </div>
);
