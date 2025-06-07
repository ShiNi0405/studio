
'use client';

import * as z from 'zod';
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
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { useState } from 'react';
import type { Barber, Customer } from '@/types';
import { useToast } from '@/hooks/use-toast';
// import { suggestTimeSlots } from '@/ai/flows/suggest-time-slots'; // AI flow no longer used
import { createBookingAction } from '@/app/actions/bookingActions';
import { Timestamp } from 'firebase/firestore';

const bookingFormSchema = z.object({
  service: z.string().min(1, "Service selection is required."),
  date: z.date({ required_error: "A date is required." }),
  preferredTimeOfDay: z.enum(["Morning", "Afternoon", "Evening"], { required_error: "Preferred time of day is required." }),
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
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      service: "",
      preferredTimeOfDay: undefined, // User must select
      notes: "",
    },
  });

  async function onSubmit(data: BookingFormValues) {
    setIsSubmitting(true);
    try {
      // Set the time to the beginning of the selected date
      const selectedDate = new Date(data.date);
      selectedDate.setHours(0, 0, 0, 0);

      const bookingData = {
        customerId: customer.uid,
        customerName: customer.displayName || 'Customer',
        barberId: barber.uid,
        barberName: barber.displayName || 'Barber',
        dateTime: Timestamp.fromDate(selectedDate), // Store selected date (time at midnight)
        service: data.service,
        notes: data.notes || '',
        preferredTimeOfDay: data.preferredTimeOfDay,
        status: 'pending' as const,
      };
      
      const result = await createBookingAction(bookingData);

      if (result.success) {
        toast({ title: "Booking Request Sent!", description: `Your request to ${barber.displayName} for ${format(data.date, "PPP")} (${data.preferredTimeOfDay}) has been sent.` });
        form.reset({
            service: "",
            preferredTimeOfDay: undefined,
            notes: "",
            date: undefined,
        });
      } else {
        throw new Error(result.error || "Failed to create booking.");
      }
      
    } catch (error: any) {
      console.error("Booking submission error:", error);
      toast({ title: "Booking Failed", description: error.message || "There was an error submitting your booking. Please try again.", variant: "destructive" });
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
                    onSelect={field.onChange}
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
                onValueChange={field.onChange} 
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
        <Button type="submit" disabled={isSubmitting || !form.watch('date') || !form.watch('preferredTimeOfDay') || !form.watch('service') } className="w-full text-lg py-6">
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Request Appointment
        </Button>
      </form>
    </Form>
  );
}
