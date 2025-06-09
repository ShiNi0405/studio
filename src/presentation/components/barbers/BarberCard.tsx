
import Image from 'next/image';
import Link from 'next/link';
import type { Barber } from '@/domain/entities';
import { Button } from '@/presentation/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/presentation/components/ui/card';
import { CheckCircle, MapPin, Scissors, Star } from 'lucide-react';
import { Badge } from '@/presentation/components/ui/badge';

type BarberCardProps = {
  barber: Barber;
  preferredHaircutOptionId?: string | null;
  preferredStyleName?: string | null; // Text description of the style
};

export default function BarberCard({ barber, preferredHaircutOptionId, preferredStyleName }: BarberCardProps) {
  // Mock review data for display
  const averageRating = barber.uid.charCodeAt(0) % 3 + 3 + (barber.uid.charCodeAt(1) % 10) / 10; // e.g. 3.0 to 5.9
  const reviewCount = barber.uid.charCodeAt(2) % 50 + 5; // e.g. 5 to 54

  const offeredService = preferredHaircutOptionId 
    ? barber.servicesOffered?.find(service => service.haircutOptionId === preferredHaircutOptionId)
    : null;

  let profileLinkQuery = "";
  if (preferredStyleName) {
    profileLinkQuery += `style=${encodeURIComponent(preferredStyleName)}`;
  }
  if (preferredHaircutOptionId) {
    if (profileLinkQuery) profileLinkQuery += "&";
    profileLinkQuery += `haircutOptionId=${encodeURIComponent(preferredHaircutOptionId)}`;
  }
  const profileLink = `/barbers/${barber.uid}${profileLinkQuery ? `?${profileLinkQuery}` : ''}`;

  return (
    <Card className="flex flex-col overflow-hidden transition-all-subtle hover:shadow-xl h-full">
      <CardHeader className="p-0 relative">
        <Image
          src={barber.photoURL || `https://placehold.co/400x300.png?text=${encodeURIComponent(barber.displayName || 'B')}`}
          alt={barber.displayName || 'Barber profile picture'}
          data-ai-hint="barber portrait"
          width={400}
          height={300}
          className="object-cover w-full h-48"
        />
         {offeredService && (
          <Badge variant="default" className="absolute top-2 right-2 bg-accent text-accent-foreground shadow-lg">
            <CheckCircle className="w-3.5 h-3.5 mr-1.5" /> Offers selected style!
          </Badge>
        )}
      </CardHeader>
      <CardContent className="p-4 flex-grow">
        <CardTitle className="text-xl font-headline mb-1 truncate">{barber.displayName}</CardTitle>
        <CardDescription className="text-sm text-primary mb-2 flex items-center">
           <Scissors className="h-4 w-4 mr-1.5" /> {barber.specialties && barber.specialties.length > 0 ? barber.specialties.join(', ') : 'Professional Barber'}
        </CardDescription>
        
        <div className="flex items-center text-xs text-muted-foreground mb-1">
          <Star className="h-4 w-4 mr-1 text-yellow-400 fill-yellow-400" />
          <span>{averageRating.toFixed(1)} ({reviewCount} reviews)</span>
        </div>
         {barber.location && <p className="text-xs text-muted-foreground flex items-center mb-3"><MapPin className="w-3 h-3 mr-1"/>{barber.location}</p>}

        {offeredService && (
          <div className="mb-3 p-2 bg-primary/10 rounded-md">
            <p className="text-xs text-primary font-semibold">
              Offers "{offeredService.haircutName}"
            </p>
            <p className="text-sm text-primary font-bold">
              Price: RM{offeredService.price.toFixed(2)}
            </p>
          </div>
        )}
        
        <p className="text-sm text-foreground/80 line-clamp-2 mb-3">
          {barber.bio || `Experienced barber dedicated to providing top-quality haircuts and grooming services.`}
        </p>
        
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Button asChild className="w-full transition-all-subtle">
          <Link href={profileLink}>View Profile & Book</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
