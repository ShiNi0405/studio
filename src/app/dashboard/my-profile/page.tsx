
'use client';

import { useAuth } from '@/contexts/AuthContext';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { Barber } from '@/types';
import { useEffect, useState } from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import Link from 'next/link';
import { ChevronLeft, Loader2, AlertCircle, Save, PlusCircle, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const profileSchema = z.object({
  displayName: z.string().min(2, 'Display name must be at least 2 characters.'),
  bio: z.string().max(500, 'Bio cannot exceed 500 characters.').optional(),
  specialties: z.string().optional().transform(val => val ? val.split(',').map(s => s.trim()).filter(s => s) : []),
  experienceYears: z.coerce.number().min(0, 'Experience cannot be negative.').optional(),
  availability: z.string().optional().refine(val => {
    if (!val) return true;
    try {
      JSON.parse(val);
      return true;
    } catch {
      return false;
    }
  }, { message: "Availability must be a valid JSON string."}),
  subscriptionActive: z.boolean().optional(),
  photoURL: z.string().url("Must be a valid URL for profile picture.").optional().or(z.literal('')),
  portfolioImageURLs: z.array(z.object({ url: z.string().url("Each portfolio image must be a valid URL.") })).optional(),
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
      displayName: '',
      bio: '',
      specialties: [],
      experienceYears: 0,
      availability: '{}',
      subscriptionActive: false,
      photoURL: '',
      portfolioImageURLs: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "portfolioImageURLs"
  });

  useEffect(() => {
    if (!authLoading && user && user.role === 'barber') {
      fetchProfileData();
    } else if (!authLoading && !user) {
      setLoadingData(false);
      setError("Please log in to manage your profile.");
    } else if (!authLoading && user && user.role !== 'barber') {
      setLoadingData(false);
      setError("This page is for barbers only.");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading]);

  const fetchProfileData = async () => {
    if (!user) return;
    setLoadingData(true);
    setError(null);
    try {
      const userDocRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(userDocRef);
      if (docSnap.exists()) {
        const data = docSnap.data() as Barber;
        form.reset({
          displayName: data.displayName || '',
          bio: data.bio || '',
          specialties: data.specialties || [],
          experienceYears: data.experienceYears || 0,
          availability: data.availability || '{}',
          subscriptionActive: data.subscriptionActive || false,
          photoURL: data.photoURL || '',
          portfolioImageURLs: data.portfolioImageURLs ? data.portfolioImageURLs.map(url => ({ url })) : [],
        });
      } else {
        setError("Profile data not found.");
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
      setError("Failed to load profile data. Please try again.");
    } finally {
      setLoadingData(false);
    }
  };
  
  const onSubmit = async (values: ProfileFormValues) => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      const userDocRef = doc(db, 'users', user.uid);
      
      const updateData: Partial<Barber> = {
        displayName: values.displayName,
        bio: values.bio,
        specialties: Array.isArray(values.specialties) ? values.specialties : [],
        experienceYears: values.experienceYears,
        availability: values.availability,
        photoURL: values.photoURL,
        portfolioImageURLs: values.portfolioImageURLs ? values.portfolioImageURLs.map(item => item.url) : [],
      };
      
      await updateDoc(userDocRef, updateData);
      toast({ title: "Profile Updated", description: "Your profile has been successfully updated." });
    } catch (err) {
      console.error("Error updating profile:", err);
      toast({ title: "Update Failed", description: "Could not update your profile.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };


  if (authLoading || loadingData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-15rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading your profile...</p>
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
    <div className="max-w-3xl mx-auto space-y-8">
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl font-headline">Edit Your Barber Profile</CardTitle>
          <CardDescription>Keep your information up-to-date for your clients.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Display Name</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="photoURL"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Profile Picture URL</FormLabel>
                    <FormControl><Input type="url" placeholder="https://example.com/image.png" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bio</FormLabel>
                    <FormControl><Textarea placeholder="Tell clients about yourself..." className="min-h-[100px]" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="specialties"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Specialties</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g., Fades, Beard Trims, Kids Cuts" 
                        // @ts-ignore
                        value={Array.isArray(field.value) ? field.value.join(', ') : field.value}
                        onChange={(e) => field.onChange(e.target.value)}
                      />
                    </FormControl>
                    <FormDescription>Comma-separated list of your specialties.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="experienceYears"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Years of Experience</FormLabel>
                    <FormControl><Input type="number" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="availability"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Availability (JSON Format)</FormLabel>
                    <FormControl><Textarea placeholder='e.g., {"monday": ["09:00-17:00"], "tuesday": ["10:00-18:00"]}' className="min-h-[120px] font-mono text-sm" {...field} /></FormControl>
                     <FormDescription>
                      Use JSON format like: <code className="font-code">{`{"monday": ["09:00-12:00", "13:00-17:00"]}`}</code>. Days are lowercase. Times in HH:MM format.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-4">
                <FormLabel>Portfolio Image URLs</FormLabel>
                {fields.map((item, index) => (
                  <FormField
                    key={item.id}
                    control={form.control}
                    name={`portfolioImageURLs.${index}.url`}
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center gap-2">
                          <FormControl>
                            <Input type="url" placeholder="https://example.com/portfolio_image.png" {...field} />
                          </FormControl>
                          <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="text-destructive hover:text-destructive/80">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => append({ url: "" })}
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Portfolio Image URL
                </Button>
                 <FormDescription>
                  Add direct URLs to your portfolio images. Actual file uploads can be added in a future update.
                </FormDescription>
              </div>
              
              <CardFooter className="flex justify-end space-x-3 pt-6 px-0 border-t">
                <Button variant="outline" asChild type="button">
                    <Link href="/dashboard"><ChevronLeft className="mr-2 h-4 w-4" />Cancel</Link>
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Save className="mr-2 h-4 w-4" /> Save Changes
                </Button>
              </CardFooter>
            </form>
          </Form>
        </CardContent>
      </Card>
       <div className="mt-8">
            <Button variant="outline" asChild>
                <Link href="/dashboard"><ChevronLeft className="mr-2 h-4 w-4" />Back to Dashboard</Link>
            </Button>
        </div>
    </div>
  );
}
