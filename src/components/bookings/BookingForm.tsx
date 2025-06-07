
'use client';

import * as z from 'zod'; // Added Zod import
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { useState } from 'react';
import type { Barber, Customer } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { suggestTimeSlots } from '@/ai/flows/suggest-time-slots'; // Assuming this is correctly set up as a server action
import { createBookingAction } from '@/app/actions/bookingActions'; // Server action
import { Timestamp } from 'firebase/firestore';

const bookingFormSchema = z.object({
  service: z.string().min(1, "Service selection is required."),
  date: z.date({ required_error: "A date is required." }),
  preferredTimeOfDay: z.enum(["Morning", "Afternoon", "Evening"], { required_error: "Preferred time of day is required." }),
  suggestedSlot: z.string().optional(), // ISO string of the chosen slot
  notes: z.string().max(500, "Notes cannot exceed 500 characters.").optional(),
});

type BookingFormValues = z.infer<typeof bookingFormSchema>;

type BookingFormProps = {
  barber: Barber;
  customer: Customer;
};

// Dummy services, replace with actual data source if needed
const dummyServices = [
  { id: "haircut", name: "Standard Haircut", duration: 60 },
  { id: "beard_trim", name: "Beard Trim", duration: 30 },
  { id: "haircut_beard", name: "Haircut & Beard Trim", duration: 90 },
  { id: "fade", name: "Skin Fade", duration: 75 },
];


export default function BookingForm({ barber, customer }: BookingFormProps) {
  const { toast } = useToast();
  const [isFetchingSlots, setIsFetchingSlots] = useState(false);
  const [suggestedSlots, setSuggestedSlots] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      service: "",
      preferredTimeOfDay: undefined, // User must select
      notes: "",
    },
  });

  const handleSuggestSlots = async () => {
    const { date, preferredTimeOfDay } = form.getValues();
    if (!date || !preferredTimeOfDay) {
      toast({ title: "Missing Information", description: "Please select a date and preferred time of day.", variant: "destructive" });
      return;
    }

    setIsFetchingSlots(true);
    setSuggestedSlots([]);
    form.setValue('suggestedSlot', undefined); // Clear previous selection

    try {
      const result = await suggestTimeSlots({
        // Barber availability needs to be a string. Use barber.availability or a default.
        barberAvailability: barber.availability || JSON.stringify({ 
            "monday": ["09:00-17:00"], "tuesday": ["09:00-17:00"], "wednesday": ["09:00-17:00"], 
            "thursday": ["09:00-17:00"], "friday": ["09:00-17:00"], "saturday": ["10:00-14:00"] 
        }), 
        preferredTimeOfDay,
      });
      
      if (result.suggestedTimeSlots && result.suggestedTimeSlots.length > 0) {
        // Filter slots to be on the selected date
        const selectedDateString = format(date, "yyyy-MM-dd");
        const filteredSlots = result.suggestedTimeSlots.filter(slot => slot.startsWith(selectedDateString));
        
        if (filteredSlots.length > 0) {
            setSuggestedSlots(filteredSlots);
            toast({ title: "Time Slots Suggested", description: "Please select a slot below." });
        } else {
            toast({ title: "No Slots Available", description: `No slots found for ${preferredTimeOfDay.toLowerCase()} on ${selectedDateString}. Try a different preference or date.`, variant: "default" });
        }
      } else {
        toast({ title: "No Slots Available", description: "The AI couldn't find any suitable slots. Please try different options.", variant: "default" });
      }
    } catch (error) {
      console.error("Error fetching time slots:", error);
      toast({ title: "Error", description: "Could not fetch time slots. Please try again.", variant: "destructive" });
    } finally {
      setIsFetchingSlots(false);
    }
  };

  async function onSubmit(data: BookingFormValues) {
    if (!data.suggestedSlot) {
      toast({ title: "Slot Required", description: "Please select a suggested time slot.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      const bookingData = {
        customerId: customer.uid,
        customerName: customer.displayName || 'Customer',
        barberId: barber.uid,
        barberName: barber.displayName || 'Barber',
        dateTime: Timestamp.fromDate(new Date(data.suggestedSlot)),
        service: data.service,
        notes: data.notes || '',
        preferredTimeOfDay: data.preferredTimeOfDay,
        status: 'pending' as const,
      };
      
      await createBookingAction(bookingData);

      toast({ title: "Booking Request Sent!", description: `Your request to ${barber.displayName} has been sent.` });
      form.reset();
      setSuggestedSlots([]);
      // Potentially redirect or show a success message component
      // router.push('/dashboard/my-bookings');
    } catch (error) {
      console.error("Booking submission error:", error);
      toast({ title: "Booking Failed", description: "There was an error submitting your booking. Please try again.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="service"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Service</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a service" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {dummyServices.map(service => (
                    <SelectItem key={service.id} value={service.name}>
                      {service.name} ({service.duration} min)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Date</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(field.value, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={(date) => {
                      field.onChange(date);
                      setSuggestedSlots([]); // Clear slots if date changes
                      form.setValue('suggestedSlot', undefined);
                    }}
                    disabled={(date) => date < new Date(new Date().setHours(0,0,0,0)) } // Disable past dates
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="preferredTimeOfDay"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Preferred Time of Day</FormLabel>
              <Select 
                onValueChange={(value) => {
                  field.onChange(value);
                  setSuggestedSlots([]); // Clear slots if preference changes
                  form.setValue('suggestedSlot', undefined);
                }} 
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select preferred time" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Morning">Morning (approx. 8 AM - 12 PM)</SelectItem>
                  <SelectItem value="Afternoon">Afternoon (approx. 12 PM - 5 PM)</SelectItem>
                  <SelectItem value="Evening">Evening (approx. 5 PM - 9 PM)</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="button" onClick={handleSuggestSlots} disabled={isFetchingSlots || !form.watch('date') || !form.watch('preferredTimeOfDay')} className="w-full" variant="secondary">
          {isFetchingSlots && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Suggest Available Times
        </Button>

        {suggestedSlots.length > 0 && (
          <FormField
            control={form.control}
            name="suggestedSlot"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel>Select a Time Slot</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="grid grid-cols-2 md:grid-cols-3 gap-4"
                  >
                    {suggestedSlots.map((slot) => (
                      <FormItem key={slot} className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                           <Button 
                            type="button" 
                            variant={field.value === slot ? "default" : "outline"}
                            onClick={() => field.onChange(slot)}
                            className="w-full justify-center py-3 text-center"
                          >
                            {format(new Date(slot), "p")}
                          </Button>
                        </FormControl>
                        {/* Hidden radio for form state, styled button for UI */}
                        <RadioGroupItem value={slot} className="sr-only" />
                      </FormItem>
                    ))}
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        
        {suggestedSlots.length === 0 && form.formState.isSubmitted && !isFetchingSlots && (
             <p className="text-sm text-center text-muted-foreground">No slots available based on AI suggestion. Try different preferences.</p>
        )}


        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Additional Notes (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Any specific requests or information for the barber?"
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Max 500 characters.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isSubmitting || !form.watch('suggestedSlot')} className="w-full text-lg py-6">
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Request Appointment
        </Button>
      </form>
    </Form>
  );
}

