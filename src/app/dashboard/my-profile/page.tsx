
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
  id: z.string(), // Unique ID for this offered service instance (for useFieldArray key)
  haircutOptionId: z.string(), // From the bank, e.g., 'men-crew-cut'
  haircutName: z.string(), // Denormalized name, e.g., "Crew Cut"
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
      experienceYears: 0, availability: '{}', servicesOffered: [],
    },
  });

  const { fields: serviceFields, append: appendService, remove: removeService, update: updateService } = useFieldArray({
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
          experienceYears: data.experienceYears || 0,
          availability: data.availability || '{}',
          servicesOffered: (data.servicesOffered || []).map(s => ({
            ...s,
            portfolioImageURLs: (s.portfolioImageURLs || []).map(url => ({ url }))
          })),
        });
      } else { setError("Profile data not found."); }
    } catch (err) { console.error("Error fetching profile:", err); setError("Failed to load profile data.");
    } finally { setLoadingData(false); }
  };

  const handleAddService = (haircutOption: HaircutOption) => {
    const alreadyAdded = serviceFields.some(field => field.haircutOptionId === haircutOption.id);
    if (alreadyAdded) {
      toast({ title: "Already Added", description: `${haircutOption.name} is already in your offered services.`, variant: "default" });
      return;
    }
    appendService({
      id: `offered-${Date.now()}-${Math.random().toString(36).substring(2,7)}`,
      haircutOptionId: haircutOption.id,
      haircutName: haircutOption.name,
      gender: haircutOption.gender,
      price: 0,
      duration: undefined,
      portfolioImageURLs: [],
    });
    toast({ title: "Service Added", description: `${haircutOption.name} added to your services. Please set price and other details.`});
  };

  const onSubmit = async (values: ProfileFormValues) => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      const userDocRef = doc(db, 'users', user.uid);
      const currentDocSnap = await getDoc(userDocRef);
      const currentData = currentDocSnap.exists() ? currentDocSnap.data() as Barber : {};

      const updateData: Partial<Barber> = {
        displayName: values.displayName,
        photoURL: values.photoURL,
        location: values.location,
        bio: values.bio,
        specialties: Array.isArray(values.specialties) ? values.specialties : [],
        experienceYears: values.experienceYears,
        availability: values.availability,
        servicesOffered: (values.servicesOffered || []).map(service => ({
          ...service,
          portfolioImageURLs: (service.portfolioImageURLs || []).map(p => p.url),
          price: Number(service.price),
          duration: service.duration ? Number(service.duration) : undefined,
        })),
        latitude: currentData.latitude, longitude: currentData.longitude,
      };
      await updateDoc(userDocRef, updateData);
      toast({ title: "Profile Updated", description: "Your profile has been successfully updated." });
    } catch (err) { console.error("Error updating profile:", err); toast({ title: "Update Failed", description: "Could not update your profile.", variant: "destructive" });
    } finally { setIsSubmitting(false); }
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
              <FormField control={form.control} name="availability" render={({ field }) => (<FormItem><FormLabel>Availability (JSON)</FormLabel><FormControl><Textarea placeholder='{"monday": ["09:00-17:00"]}' {...field} /></FormControl><FormDescription>General weekly availability.</FormDescription><FormMessage /></FormItem>)} />

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
                            <Image src={opt.exampleImageUrl || `https://placehold.co/80x80.png?text=${encodeURIComponent(opt.name.substring(0,10))}`} alt={opt.name} width={80} height={80} className="rounded-md mb-2 object-cover aspect-square" data-ai-hint={opt.defaultImageHint} />
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
                            <Image src={opt.exampleImageUrl || `https://placehold.co/80x80.png?text=${encodeURIComponent(opt.name.substring(0,10))}`} alt={opt.name} width={80} height={80} className="rounded-md mb-2 object-cover aspect-square" data-ai-hint={opt.defaultImageHint} />
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
                        <TabsTrigger value="my-men-services"><User className="mr-2"/>My Men's Haircuts</TabsTrigger>
                        <TabsTrigger value="my-women-services"><Users className="mr-2"/>My Women's Haircuts</TabsTrigger>
                      </TabsList>
                      <TabsContent value="my-men-services" className="mt-4 space-y-4">
                        {serviceFields.filter(sf => sf.gender === 'men').map((item, index) => {
                           const originalIndex = serviceFields.findIndex(sf => sf.id === item.id); // Get original index for RHF
                           return (
                            <OfferedHaircutFormSection key={item.id} form={form} index={originalIndex} removeService={removeService} />
                           );
                        })}
                        {serviceFields.filter(sf => sf.gender === 'men').length === 0 && <p className="text-muted-foreground text-sm">No men's haircuts added yet.</p>}
                      </TabsContent>
                      <TabsContent value="my-women-services" className="mt-4 space-y-4">
                         {serviceFields.filter(sf => sf.gender === 'women').map((item, index) => {
                            const originalIndex = serviceFields.findIndex(sf => sf.id === item.id);
                            return (
                              <OfferedHaircutFormSection key={item.id} form={form} index={originalIndex} removeService={removeService} />
                            );
                         })}
                         {serviceFields.filter(sf => sf.gender === 'women').length === 0 && <p className="text-muted-foreground text-sm">No women's haircuts added yet.</p>}
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
  form: any; // UseFormReturn<ProfileFormValues>; // Consider using proper type
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
    <div className="p-4 border rounded-md space-y-3 bg-muted/30 relative">
      <Button type="button" variant="ghost" size="icon" onClick={() => removeService(index)} className="absolute top-2 right-2 text-destructive hover:text-destructive/80 h-7 w-7">
        <Trash2 className="h-4 w-4" />
      </Button>
      <h4 className="font-semibold text-lg">{service.haircutName} <span className="text-xs capitalize text-muted-foreground">({service.gender})</span></h4>
      
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
        <FormLabel className="flex items-center"><ImageUp className="w-4 h-4 mr-2"/>Portfolio Images for this Haircut</FormLabel>
        {portfolioFields.map((item, pIndex) => (
          <FormField key={item.id} control={form.control} name={`servicesOffered.${index}.portfolioImageURLs.${pIndex}.url`} render={({ field }) => (
            <FormItem>
              <div className="flex items-center gap-2">
                <FormControl><Input type="url" placeholder="https://image-url.com/photo.png" {...field} /></FormControl>
                <Button type="button" variant="ghost" size="icon" onClick={() => removePortfolioItem(pIndex)} className="text-destructive hover:text-destructive/80 h-8 w-8 shrink-0">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <FormMessage />
            </FormItem>
          )} />
        ))}
        <Button type="button" variant="outline" size="sm" onClick={() => appendPortfolio({ url: "" })}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add Image URL
        </Button>
      </div>
    </div>
  );
}
