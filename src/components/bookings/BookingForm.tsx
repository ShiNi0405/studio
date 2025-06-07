
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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import type { Barber, Customer } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { createBookingAction } from '@/app/actions/bookingActions';
import { Timestamp } from 'firebase/firestore';
import { useSearchParams } from 'next/navigation';

const bookingFormSchema = z.object({
  style: z.string().optional(), // Style is now optional, could come from query
  service: z.string().optional(), // Service is optional if style is provided
  date: z.date({ required_error: "A date is required." }),
  time: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: "Invalid time format. Use HH:MM (e.g., 14:30)."}),
  notes: z.string().max(500, "Notes cannot exceed 500 characters.").optional(),
}).refine(data => data.style || data.service, {
  message: "Either a style or a service must be selected/provided.",
  path: ["service"], // Show error on service field if neither is present
});


type BookingFormValues = z.infer<typeof bookingFormSchema>;

type BookingFormProps = {
  barber: Barber;
  customer: Customer;
};

const dummyServices = [
  { id: "haircut", name: "Standard Haircut", duration: 60 },
  { id: "beard_trim", name: "Beard Trim", duration: 30 },
  { id: "haircut_beard", name: "Haircut & Beard Trim", duration: 90 },
  { id: "fade", name: "Skin Fade", duration: 75 },
];


export default function BookingForm({ barber, customer }: BookingFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const searchParams = useSearchParams();
  const suggestedStyleFromQuery = searchParams.get('style');

  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      style: suggestedStyleFromQuery || undefined,
      service: suggestedStyleFromQuery ? undefined : "", // If style from query, service can be empty
      time: "",
      notes: "",
    },
  });
  
  useEffect(() => {
    if (suggestedStyleFromQuery) {
      form.setValue('style', suggestedStyleFromQuery);
      form.setValue('service', undefined); // Clear service if style is from query
    }
  }, [suggestedStyleFromQuery, form]);


  async function onSubmit(data: BookingFormValues) {
    setIsSubmitting(true);
    try {
      const selectedDate = new Date(data.date);
      // Time string is like "HH:MM". We'll store date and time separately for now as per plan.
      // Firestore `dateTime` will just be the date part (set to midnight).
      
      const bookingData = {
        customerId: customer.uid,
        customerName: customer.displayName || 'Customer',
        barberId: barber.uid,
        barberName: barber.displayName || 'Barber',
        dateTime: Timestamp.fromDate(selectedDate),
        style: data.style || undefined,
        service: data.style ? undefined : data.service, // Only save service if style is not set
        time: data.time,
        notes: data.notes || '',
        status: 'pending' as const,
      };
      
      const result = await createBookingAction(bookingData);

      if (result.success) {
        toast({ title: "Booking Request Sent!", description: `Your request to ${barber.displayName} for ${data.style || data.service} on ${format(data.date, "PPP")} at ${data.time} has been sent.` });
        form.reset({
            style: suggestedStyleFromQuery || undefined,
            service: suggestedStyleFromQuery ? undefined : "",
            time: "",
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
        {suggestedStyleFromQuery && (
          <FormItem>
            <FormLabel className="text-lg font-semibold">Requested Style</FormLabel>
            <p className="text-md p-3 bg-muted rounded-md">{suggestedStyleFromQuery}</p>
            <FormField
              control={form.control}
              name="style"
              render={({ field }) => <Input type="hidden" {...field} />}
            />
          </FormItem>
        )}

        {!suggestedStyleFromQuery && (
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
        )}


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
          name="time"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Time (HH:MM format)</FormLabel>
              <FormControl>
                <Input type="text" placeholder="e.g., 14:30 for 2:30 PM" {...field} />
              </FormControl>
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
        <Button type="submit" disabled={isSubmitting || !form.watch('date') || !form.watch('time') || (!form.watch('style') && !form.watch('service')) } className="w-full text-lg py-6">
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Request Appointment
        </Button>
      </form>
    </Form>
  );
}
