
'use client';

import { useAuth } from '@/contexts/AuthContext';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { Barber, OfferedHaircut } from '@/types';
import { useEffect, useState } from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import Link from 'next/link';
import { ChevronLeft, Loader2, AlertCircle, Save, PlusCircle, Trash2, DollarSign, MapPin, Scissors, ImageUp, User, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Image from 'next/image';

// Define HaircutOption type locally for the bank
interface HaircutOption {
  id: string;
  name: string;
  gender: 'men' | 'women';
  isCustom?: boolean;
  defaultImageHint?: string;
  exampleImageUrl?: string; // For display in the bank
}

const MENS_HAIRCUT_OPTIONS: HaircutOption[] = [
  { id: 'men-crew-cut', name: 'Crew Cut', gender: 'men', defaultImageHint: 'men crew cut hairstyle', exampleImageUrl: 'https://placehold.co/100x100.png?text=Crew+Cut' },
  { id: 'men-fade', name: 'Fade', gender: 'men', defaultImageHint: 'men fade haircut', exampleImageUrl: 'https://placehold.co/100x100.png?text=Fade' },
  { id: 'men-quiff', name: 'Quiff', gender: 'men', defaultImageHint: 'men quiff hairstyle', exampleImageUrl: 'https://placehold.co/100x100.png?text=Quiff' },
  { id: 'men-undercut', name: 'Undercut', gender: 'men', defaultImageHint: 'men undercut hairstyle', exampleImageUrl: 'https://placehold.co/100x100.png?text=Undercut' },
  { id: 'men-buzz-cut', name: 'Buzz Cut', gender: 'men', defaultImageHint: 'men buzz cut', exampleImageUrl: 'https://placehold.co/100x100.png?text=Buzz' },
  { id: 'men-side-part', name: 'Side Part', gender: 'men', defaultImageHint: 'men side part', exampleImageUrl: 'https://placehold.co/100x100.png?text=Side+Part' },
  { id: 'men-custom', name: 'Custom Men\'s Haircut', gender: 'men', isCustom: true, defaultImageHint: 'men custom haircut', exampleImageUrl: 'https://placehold.co/100x100.png?text=Custom+Men' },
];

const WOMENS_HAIRCUT_OPTIONS: HaircutOption[] = [
  { id: 'women-bob', name: 'Bob Cut', gender: 'women', defaultImageHint: 'women bob cut hairstyle', exampleImageUrl: 'https://placehold.co/100x100.png?text=Bob' },
  { id: 'women-pixie', name: 'Pixie Cut', gender: 'women', defaultImageHint: 'women pixie cut hairstyle', exampleImageUrl: 'https://placehold.co/100x100.png?text=Pixie' },
  { id: 'women-layers', name: 'Long Layers', gender: 'women', defaultImageHint: 'women long layers hairstyle', exampleImageUrl: 'https://placehold.co/100x100.png?text=Layers' },
  { id: 'women-bangs', name: 'Bangs (Fringe)', gender: 'women', defaultImageHint: 'women bangs hairstyle', exampleImageUrl: 'https://placehold.co/100x100.png?text=Bangs' },
  { id: 'women-lob', name: 'Lob (Long Bob)', gender: 'women', defaultImageHint: 'women lob hairstyle', exampleImageUrl: 'https://placehold.co/100x100.png?text=Lob' },
  { id: 'women-shag', name: 'Shag Haircut', gender: 'women', defaultImageHint: 'women shag haircut', exampleImageUrl: 'https://placehold.co/100x100.png?text=Shag' },
  { id: 'women-custom', name: 'Custom Women\'s Haircut', gender: 'women', isCustom: true, defaultImageHint: 'women custom haircut', exampleImageUrl: 'https://placehold.co/100x100.png?text=Custom+Women' },
];


const offeredHaircutSchema = z.object({
  id: z.string(), 
  haircutOptionId: z.string(), 
  haircutName: z.string(), 
  gender: z.enum(['men', 'women']),
  price: z.coerce.number().min(0, "Price must be a positive number."),
  duration: z.coerce.number().min(0, "Duration must be a positive number in minutes.").optional(),
  portfolioImageURLs: z.array(z.object({ url: z.string().url("Must be a valid URL.") })).optional(),
});

const profileSchema = z.object({
  displayName: z.string().min(2, 'Display name must be at least 2 characters.'),
  photoURL: z.string().url("Must be a valid URL for profile picture.").optional().or(z.literal('')),
  location: z.string().optional(),
  bio: z.string().max(500, 'Bio cannot exceed 500 characters.').optional(),
  specialties: z.string().optional().transform(val => val ? val.split(',').map(s => s.trim()).filter(s => s) : []),
  experienceYears: z.coerce.number().min(0, 'Experience cannot be negative.').optional(),
  availability: z.string().optional().refine(val => {
    if (!val) return true; try { JSON.parse(val); return true; } catch { return false; }
  }, { message: "Availability must be valid JSON." }),
  servicesOffered: z.array(offeredHaircutSchema).optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function MyProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [loadingData, setLoadingData] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: '', photoURL: '', location: '', bio: '', specialties: [],
      experienceYears: undefined, // Use undefined for optional numbers not yet set
      availability: '{}', servicesOffered: [],
    },
  });

  const { fields: serviceFields, append: appendService, remove: removeService } = useFieldArray({
    control: form.control,
    name: "servicesOffered"
  });

  useEffect(() => {
    if (!authLoading && user && user.role === 'barber') {
      fetchProfileData();
    } else if (!authLoading && !user) {
      setLoadingData(false); setError("Please log in to manage your profile.");
    } else if (!authLoading && user && user.role !== 'barber') {
      setLoadingData(false); setError("This page is for barbers only.");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading]);

  const fetchProfileData = async () => {
    if (!user) return;
    setLoadingData(true); setError(null);
    try {
      const userDocRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(userDocRef);
      if (docSnap.exists()) {
        const data = docSnap.data() as Barber;
        form.reset({
          displayName: data.displayName || '',
          photoURL: data.photoURL || '',
          location: data.location || '',
          bio: data.bio || '',
          specialties: data.specialties || [],
          experienceYears: data.experienceYears === undefined || data.experienceYears === null ? undefined : Number(data.experienceYears),
          availability: data.availability || '{}',
          servicesOffered: (data.servicesOffered || []).map(s => ({
            ...s,
            price: s.price === undefined || s.price === null ? 0 : Number(s.price),
            duration: s.duration === undefined || s.duration === null ? undefined : Number(s.duration),
            portfolioImageURLs: (s.portfolioImageURLs || []).map(url => ({ url }))
          })),
        });
      } else { setError("Profile data not found."); }
    } catch (err) { console.error("Error fetching profile:", err); setError("Failed to load profile data.");
    } finally { setLoadingData(false); }
  };

  const handleAddService = (haircutOption: HaircutOption) => {
    const alreadyAdded = serviceFields.some(field => field.haircutOptionId === haircutOption.id && !field.haircutName.toLowerCase().includes("custom"));
    if (alreadyAdded && !haircutOption.isCustom) {
      toast({ title: "Already Added", description: `${haircutOption.name} is already in your offered services.`, variant: "default" });
      return;
    }
    appendService({
      id: `offered-${Date.now()}-${Math.random().toString(36).substring(2,7)}`,
      haircutOptionId: haircutOption.id,
      haircutName: haircutOption.isCustom ? `Custom ${haircutOption.gender === 'men' ? "Men's" : "Women's"} Haircut ${serviceFields.filter(sf => sf.haircutOptionId === haircutOption.id).length + 1}` : haircutOption.name,
      gender: haircutOption.gender,
      price: 0,
      duration: undefined,
      portfolioImageURLs: [],
    });
    toast({ title: "Service Added", description: `${haircutOption.name} added. Please set price & details.`});
  };

  const onSubmit = async (values: ProfileFormValues) => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      const userDocRef = doc(db, 'users', user.uid);
      
      // Construct the data to be updated, ensuring no 'undefined' values are sent.
      const updateData: Partial<Barber> = {
        displayName: values.displayName,
      };

      if (values.photoURL !== undefined) updateData.photoURL = values.photoURL; else updateData.photoURL = null;
      if (values.location !== undefined) updateData.location = values.location; else updateData.location = null;
      if (values.bio !== undefined) updateData.bio = values.bio; else updateData.bio = null;
      
      // Specialties is an array, Zod transform handles empty state to []
      updateData.specialties = values.specialties; 
      
      if (values.experienceYears !== undefined) updateData.experienceYears = Number(values.experienceYears); else updateData.experienceYears = null;
      if (values.availability !== undefined) updateData.availability = values.availability; else updateData.availability = null;
      
      updateData.servicesOffered = (values.servicesOffered || []).map(service => {
        const mappedService: OfferedHaircut = {
          id: service.id,
          haircutOptionId: service.haircutOptionId,
          haircutName: service.haircutName,
          gender: service.gender,
          price: Number(service.price), // Zod already coerced
          portfolioImageURLs: (service.portfolioImageURLs || []).map(p => p.url),
        };
        // Handle optional duration: if undefined from form (after Zod), set to null for Firestore
        if (service.duration !== undefined) {
          mappedService.duration = Number(service.duration); // Zod already coerced
        } else {
          mappedService.duration = null; 
        }
        return mappedService;
      });

      await updateDoc(userDocRef, updateData);
      toast({ title: "Profile Updated", description: "Your profile has been successfully updated." });
    } catch (err: any) { 
        console.error("Error updating profile:", err);
        let errorMessage = "Could not update your profile.";
        if (err.message) {
            errorMessage += ` Error: ${err.message}`;
        }
        toast({ title: "Update Failed", description: errorMessage, variant: "destructive" });
    } finally { 
        setIsSubmitting(false); 
    }
  };

  if (authLoading || loadingData) return <div className="flex flex-col items-center justify-center min-h-[calc(100vh-15rem)]"><Loader2 className="h-12 w-12 animate-spin text-primary mb-4" /><p className="text-muted-foreground">Loading profile...</p></div>;
  if (error) return <div className="text-center py-10"><AlertCircle className="mx-auto h-12 w-12 text-destructive mb-4" /><p className="text-xl text-destructive">{error}</p><Button asChild variant="link" className="mt-4"><Link href="/dashboard"><ChevronLeft className="mr-2 h-4 w-4" />Back to Dashboard</Link></Button></div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl font-headline">Edit Your Barber Profile</CardTitle>
          <CardDescription>Manage your details, offered haircuts, and portfolio.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Basic Info Fields */}
              <FormField control={form.control} name="displayName" render={({ field }) => (<FormItem><FormLabel>Display Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="photoURL" render={({ field }) => (<FormItem><FormLabel>Profile Picture URL</FormLabel><FormControl><Input type="url" placeholder="https://..." {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="location" render={({ field }) => (<FormItem><FormLabel className="flex items-center"><MapPin className="w-4 h-4 mr-2"/>Location</FormLabel><FormControl><Input placeholder="e.g., Kuala Lumpur" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="bio" render={({ field }) => (<FormItem><FormLabel>Bio</FormLabel><FormControl><Textarea placeholder="About yourself..." {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="specialties" render={({ field }) => (<FormItem><FormLabel>General Specialties</FormLabel><FormControl><Input placeholder="e.g., Fades, Beard Trims" value={Array.isArray(field.value) ? field.value.join(', ') : field.value} onChange={(e) => field.onChange(e.target.value)} /></FormControl><FormDescription>Comma-separated.</FormDescription><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="experienceYears" render={({ field }) => (<FormItem><FormLabel>Years of Experience</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="availability" render={({ field }) => (<FormItem><FormLabel>Availability (JSON)</FormLabel><FormControl><Textarea placeholder='{"monday": ["09:00-17:00"]}' {...field} /></FormControl><FormDescription>General weekly availability. Example: {"{\"monday\": [\"09:00-12:00\", \"13:00-17:00\"], \"tuesday\": [\"09:00-17:00\"]}"}</FormDescription><FormMessage /></FormItem>)} />

              {/* Haircut Option Bank */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center"><Scissors className="w-5 h-5 mr-2 text-primary"/>Haircut Option Bank</CardTitle>
                  <CardDescription>Add haircut styles you offer from the bank below. Then configure price and portfolio for each.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="men-options">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="men-options"><User className="mr-2"/>Men's Options</TabsTrigger>
                      <TabsTrigger value="women-options"><Users className="mr-2"/>Women's Options</TabsTrigger>
                    </TabsList>
                    <TabsContent value="men-options" className="mt-4">
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {MENS_HAIRCUT_OPTIONS.map(opt => (
                          <Card key={opt.id} className="flex flex-col items-center p-3 text-center">
                            <Image src={opt.exampleImageUrl || `https://placehold.co/80x80.png?text=${encodeURIComponent(opt.name.substring(0,10))}`} alt={opt.name} width={80} height={80} className="rounded-md mb-2 object-cover aspect-square" data-ai-hint={opt.defaultImageHint || 'hairstyle men'} />
                            <p className="text-sm font-medium mb-2 leading-tight">{opt.name}</p>
                            <Button type="button" size="sm" variant="outline" onClick={() => handleAddService(opt)} className="w-full text-xs">
                              <PlusCircle className="mr-1.5 h-3.5 w-3.5"/> Add
                            </Button>
                          </Card>
                        ))}
                      </div>
                    </TabsContent>
                    <TabsContent value="women-options" className="mt-4">
                       <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {WOMENS_HAIRCUT_OPTIONS.map(opt => (
                           <Card key={opt.id} className="flex flex-col items-center p-3 text-center">
                            <Image src={opt.exampleImageUrl || `https://placehold.co/80x80.png?text=${encodeURIComponent(opt.name.substring(0,10))}`} alt={opt.name} width={80} height={80} className="rounded-md mb-2 object-cover aspect-square" data-ai-hint={opt.defaultImageHint || 'hairstyle women'} />
                            <p className="text-sm font-medium mb-2 leading-tight">{opt.name}</p>
                            <Button type="button" size="sm" variant="outline" onClick={() => handleAddService(opt)} className="w-full text-xs">
                              <PlusCircle className="mr-1.5 h-3.5 w-3.5"/> Add
                            </Button>
                          </Card>
                        ))}
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>

              {/* My Offered Haircuts */}
              {serviceFields.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>My Offered Haircuts</CardTitle>
                    <CardDescription>Manage price, duration, and portfolio for each haircut you offer.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <Tabs defaultValue="my-men-services">
                       <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="my-men-services"><User className="mr-2"/>My Men's Haircuts ({serviceFields.filter(sf => sf.gender === 'men').length})</TabsTrigger>
                        <TabsTrigger value="my-women-services"><Users className="mr-2"/>My Women's Haircuts ({serviceFields.filter(sf => sf.gender === 'women').length})</TabsTrigger>
                      </TabsList>
                      <TabsContent value="my-men-services" className="mt-4 space-y-4">
                        {serviceFields.filter(sf => sf.gender === 'men').map((item) => {
                           const originalIndex = serviceFields.findIndex(sf => sf.id === item.id); 
                           return (
                            <OfferedHaircutFormSection key={item.id} form={form} index={originalIndex} removeService={removeService} />
                           );
                        })}
                        {serviceFields.filter(sf => sf.gender === 'men').length === 0 && <p className="text-muted-foreground text-sm text-center py-4">No men's haircuts added yet. Add some from the bank above!</p>}
                      </TabsContent>
                      <TabsContent value="my-women-services" className="mt-4 space-y-4">
                         {serviceFields.filter(sf => sf.gender === 'women').map((item) => {
                            const originalIndex = serviceFields.findIndex(sf => sf.id === item.id);
                            return (
                              <OfferedHaircutFormSection key={item.id} form={form} index={originalIndex} removeService={removeService} />
                            );
                         })}
                         {serviceFields.filter(sf => sf.gender === 'women').length === 0 && <p className="text-muted-foreground text-sm text-center py-4">No women's haircuts added yet. Add some from the bank above!</p>}
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              )}
              
              <CardFooter className="flex justify-end space-x-3 pt-6 px-0 border-t mt-8">
                <Button variant="outline" asChild type="button"><Link href="/dashboard"><ChevronLeft className="mr-2 h-4 w-4" />Cancel</Link></Button>
                <Button type="submit" disabled={isSubmitting}><Save className="mr-2 h-4 w-4" />{isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save Changes</Button>
              </CardFooter>
            </form>
          </Form>
        </CardContent>
      </Card>
      <div className="mt-8"><Button variant="outline" asChild><Link href="/dashboard"><ChevronLeft className="mr-2 h-4 w-4" />Back to Dashboard</Link></Button></div>
    </div>
  );
}

// Helper component for OfferedHaircut form section
interface OfferedHaircutFormSectionProps {
  form: ReturnType<typeof useForm<ProfileFormValues>>;
  index: number;
  removeService: (index: number) => void;
}

function OfferedHaircutFormSection({ form, index, removeService }: OfferedHaircutFormSectionProps) {
  const { fields: portfolioFields, append: appendPortfolio, remove: removePortfolioItem } = useFieldArray({
    control: form.control,
    name: `servicesOffered.${index}.portfolioImageURLs`
  });

  const service = form.watch(`servicesOffered.${index}`);

  return (
    <div className="p-4 border rounded-md space-y-3 bg-muted/30 relative shadow-sm">
      <Button type="button" variant="ghost" size="icon" onClick={() => removeService(index)} className="absolute top-2 right-2 text-destructive hover:text-destructive/80 h-7 w-7 z-10">
        <Trash2 className="h-4 w-4" />
        <span className="sr-only">Remove service</span>
      </Button>
      <h4 className="font-semibold text-lg text-primary">{service.haircutName} <span className="text-xs capitalize text-muted-foreground">({service.gender})</span></h4>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField control={form.control} name={`servicesOffered.${index}.price`} render={({ field }) => (
          <FormItem>
            <FormLabel>Price (RM)</FormLabel>
            <div className="relative"><DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><FormControl><Input type="number" placeholder="e.g., 50" className="pl-8" {...field} /></FormControl></div>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name={`servicesOffered.${index}.duration`} render={({ field }) => (
          <FormItem>
            <FormLabel>Duration (minutes)</FormLabel>
            <FormControl><Input type="number" placeholder="e.g., 60" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
      </div>

      <div className="space-y-2">
        <FormLabel className="flex items-center"><ImageUp className="w-4 h-4 mr-2 text-primary"/>Portfolio Images for {service.haircutName}</FormLabel>
        {portfolioFields.map((item, pIndex) => (
          <FormField key={item.id} control={form.control} name={`servicesOffered.${index}.portfolioImageURLs.${pIndex}.url`} render={({ field }) => (
            <FormItem>
              <div className="flex items-center gap-2">
                <FormControl><Input type="url" placeholder="https://image-url.com/photo.png" {...field} /></FormControl>
                <Button type="button" variant="ghost" size="icon" onClick={() => removePortfolioItem(pIndex)} className="text-destructive hover:text-destructive/80 h-8 w-8 shrink-0">
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only">Remove image URL</span>
                </Button>
              </div>
              <FormMessage />
            </FormItem>
          )} />
        ))}
        {portfolioFields.length < 5 && ( // Limit to 5 portfolio images per service for example
             <Button type="button" variant="outline" size="sm" onClick={() => appendPortfolio({ url: "" })}>
                <PlusCircle className="mr-2 h-4 w-4" /> Add Image URL
            </Button>
        )}
         {portfolioFields.length >= 5 && (
            <FormDescription>Maximum 5 portfolio images per service.</FormDescription>
        )}
      </div>
    </div>
  );
}

    