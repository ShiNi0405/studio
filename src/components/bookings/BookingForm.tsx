
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import type { Barber, Customer, ServiceItem } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { createBookingAction } from '@/app/actions/bookingActions';
import { useSearchParams } from 'next/navigation';

const bookingFormSchema = z.object({
  style: z.string().optional(),
  serviceName: z.string().optional(), // Name of the service from barber's list
  date: z.date({ required_error: "A date is required." }),
  time: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: "Invalid time format. Use HH:MM (e.g., 14:30)."}),
  notes: z.string().max(500, "Notes cannot exceed 500 characters.").optional(),
}).refine(data => data.style || data.serviceName, {
  message: "Either a style or a service must be selected/provided.",
  path: ["serviceName"],
});


type BookingFormValues = z.infer<typeof bookingFormSchema>;

type BookingFormProps = {
  barber: Barber;
  customer: Customer;
};


export default function BookingForm({ barber, customer }: BookingFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const searchParams = useSearchParams();
  const suggestedStyleFromQuery = searchParams.get('style');
  const [selectedServiceDetails, setSelectedServiceDetails] = useState<ServiceItem | null>(null);


  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      style: suggestedStyleFromQuery || undefined,
      serviceName: suggestedStyleFromQuery ? undefined : "",
      time: "",
      notes: "",
    },
  });

  useEffect(() => {
    if (suggestedStyleFromQuery) {
      form.setValue('style', suggestedStyleFromQuery);
      form.setValue('serviceName', undefined);
      setSelectedServiceDetails(null);
    }
  }, [suggestedStyleFromQuery, form]);

  const handleServiceChange = (serviceName: string) => {
    const service = barber.servicesOffered?.find(s => s.name === serviceName);
    if (service) {
        setSelectedServiceDetails(service);
        form.setValue('serviceName', serviceName);
        form.setValue('style', undefined); // Clear style if service is chosen
    } else {
        setSelectedServiceDetails(null);
    }
  };


  async function onSubmit(data: BookingFormValues) {
    setIsSubmitting(true);
    try {
      const [hours, minutes] = data.time.split(':').map(Number);
      const appointmentDateTime = new Date(data.date);
      appointmentDateTime.setHours(hours, minutes, 0, 0);

      const bookingPayload = {
        customerId: customer.uid,
        customerName: customer.displayName || 'Customer',
        barberId: barber.uid,
        barberName: barber.displayName || 'Barber',
        appointmentDateTime: appointmentDateTime,
        time: data.time,
        style: data.style || undefined,
        serviceName: data.style ? undefined : data.serviceName,
        servicePrice: data.style ? undefined : selectedServiceDetails?.price,
        serviceDuration: data.style ? undefined : selectedServiceDetails?.duration,
        notes: data.notes || '',
        status: 'pending' as const,
      };

      const result = await createBookingAction(bookingPayload);

      if (result.success) {
        toast({ title: "Booking Request Sent!", description: `Your request to ${barber.displayName} for ${data.style || data.serviceName} on ${format(data.date, "PPP")} at ${data.time} has been sent.` });
        form.reset({
            style: suggestedStyleFromQuery || undefined,
            serviceName: suggestedStyleFromQuery ? undefined : "",
            time: "",
            notes: "",
            date: undefined,
        });
        setSelectedServiceDetails(null);
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
  
  const servicesAvailable = barber.servicesOffered && barber.servicesOffered.length > 0;

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
              render={({ field }) => <Input type="hidden" {...field} value={suggestedStyleFromQuery} />}
            />
          </FormItem>
        )}

        {!suggestedStyleFromQuery && servicesAvailable && (
           <FormField
            control={form.control}
            name="serviceName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Service</FormLabel>
                <Select onValueChange={(value) => {
                    field.onChange(value);
                    handleServiceChange(value);
                }} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a service" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {barber.servicesOffered?.map(service => (
                      <SelectItem key={service.id} value={service.name}>
                        {service.name} - RM{service.price.toFixed(2)}
                        {service.duration ? ` (${service.duration} min)` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        {!suggestedStyleFromQuery && !servicesAvailable && (
            <p className="text-sm text-muted-foreground">This barber has not listed any specific services yet. You can describe what you need in the notes, or book a general consultation style if available via AI suggestions.</p>
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
                    disabled={(date) => date < new Date(new Date().setHours(0,0,0,0)) }
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
        <Button type="submit" disabled={isSubmitting || !form.watch('date') || !form.watch('time') || (!form.watch('style') && !form.watch('serviceName')) } className="w-full text-lg py-6">
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Request Appointment
        </Button>
      </form>
    </Form>
  );
}
