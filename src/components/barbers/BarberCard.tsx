import Image from 'next/image';
import Link from 'next/link';
import type { Barber } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Scissors, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

type BarberCardProps = {
  barber: Barber;
};

export default function BarberCard({ barber }: BarberCardProps) {
  // Placeholder for average rating - this would typically come from aggregated reviews
  const averageRating = 4.5; 
  const reviewCount = 23; // Placeholder

  return (
    <Card className="flex flex-col overflow-hidden transition-all-subtle hover:shadow-xl h-full">
      <CardHeader className="p-0 relative">
        <Image
          src={barber.photoURL || `https://placehold.co/400x300.png?text=${encodeURIComponent(barber.displayName || 'Barber')}`}
          alt={barber.displayName || 'Barber profile picture'}
          data-ai-hint="barber portrait"
          width={400}
          height={300}
          className="object-cover w-full h-48"
        />
      </CardHeader>
      <CardContent className="p-4 flex-grow">
        <CardTitle className="text-xl font-headline mb-1 truncate">{barber.displayName}</CardTitle>
        {/* Example: Displaying first specialty or a general title */}
        <CardDescription className="text-sm text-primary mb-2 flex items-center">
           <Scissors className="h-4 w-4 mr-1.5" /> {barber.specialties && barber.specialties.length > 0 ? barber.specialties[0] : 'Professional Barber'}
        </CardDescription>
        
        {/* Placeholder for location */}
        {/* <div className="flex items-center text-xs text-muted-foreground mb-2">
          <MapPin className="h-3 w-3 mr-1" />
          {barber.location || "City, State"}
        </div> */}

        <div className="flex items-center text-xs text-muted-foreground mb-3">
          <Star className="h-4 w-4 mr-1 text-yellow-400 fill-yellow-400" />
          <span>{averageRating.toFixed(1)} ({reviewCount} reviews)</span>
        </div>
        
        <p className="text-sm text-foreground/80 line-clamp-3 mb-3">
          {barber.bio || `Experienced barber dedicated to providing top-quality haircuts and grooming services. Book an appointment with ${barber.displayName} today!`}
        </p>

        {barber.specialties && barber.specialties.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
                {barber.specialties.slice(0,3).map(specialty => (
                    <Badge variant="secondary" key={specialty} className="text-xs">{specialty}</Badge>
                ))}
            </div>
        )}
        
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Button asChild className="w-full transition-all-subtle">
          <Link href={`/barbers/${barber.uid}`}>View Profile & Book</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
