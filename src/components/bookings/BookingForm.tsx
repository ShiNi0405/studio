
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import type { Barber, Customer, OfferedHaircut } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { createBookingAction } from '@/app/actions/bookingActions';
import { useSearchParams } from 'next/navigation';

const bookingFormSchema = z.object({
  style: z.string().optional(), 
  serviceId: z.string().optional(), 
  date: z.date({ required_error: "A date is required." }),
  time: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: "Invalid time format. Use HH:MM (e.g., 14:30)."}),
  notes: z.string().max(500, "Notes cannot exceed 500 characters.").optional(),
}).refine(data => data.style || data.serviceId, {
  message: "Either a style description or a specific service must be provided/selected.",
  path: ["serviceId"], // Points error to serviceId if both are missing
});


type BookingFormValues = z.infer<typeof bookingFormSchema>;

type BookingFormProps = {
  barber: Barber;
  customer: Customer;
};


export default function BookingForm({ barber, customer }: BookingFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogControlledOpen, setIsDialogControlledOpen] = useState(false);
  const searchParams = useSearchParams();
  const suggestedStyleFromQuery = searchParams.get('style');
  
  const [selectedOfferedHaircut, setSelectedOfferedHaircut] = useState<OfferedHaircut | null>(null);

  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      style: suggestedStyleFromQuery || undefined,
      serviceId: suggestedStyleFromQuery ? undefined : "",
      time: "",
      notes: "",
    },
  });

  const formData = form.watch(); 

  useEffect(() => {
    if (suggestedStyleFromQuery) {
      form.setValue('style', suggestedStyleFromQuery);
      form.setValue('serviceId', undefined); 
      setSelectedOfferedHaircut(null); 
    }
  }, [suggestedStyleFromQuery, form]);

  const handleServiceChange = (serviceIdValue: string) => {
    const service = barber.servicesOffered?.find(s => s.id === serviceIdValue);
    if (service) {
        setSelectedOfferedHaircut(service);
        form.setValue('serviceId', serviceIdValue);
        form.setValue('style', undefined); 
    } else {
        setSelectedOfferedHaircut(null);
        form.setValue('serviceId', undefined); // Clear if service not found
    }
  };

  const handleFormSubmit = async () => { // Removed data param as we use form.getValues()
    setIsDialogControlledOpen(true); 
  }

  async function processBooking() {
    const data = form.getValues(); // Get latest values from form
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
        serviceName: selectedOfferedHaircut?.haircutName,
        servicePrice: selectedOfferedHaircut?.price,
        serviceDuration: selectedOfferedHaircut?.duration,
        notes: data.notes || '',
        // Status determined in createBookingAction
      };

      const result = await createBookingAction(bookingPayload);

      if (result.success) {
        toast({ 
            title: "Booking Request Sent!", 
            description: `Your request for ${data.style || selectedOfferedHaircut?.haircutName || 'an appointment'} on ${format(data.date, "PPP")} at ${data.time} has been sent. Status: ${result.status?.replace(/_/g, ' ')}.` 
        });
        form.reset({
            style: suggestedStyleFromQuery || undefined,
            serviceId: suggestedStyleFromQuery ? undefined : "",
            time: "",
            notes: "",
            date: undefined,
        });
        setSelectedOfferedHaircut(null);
      } else {
        throw new Error(result.error || "Failed to create booking.");
      }

    } catch (error: any) {
      console.error("Booking submission error:", error);
      toast({ title: "Booking Failed", description: error.message || "There was an error submitting your booking. Please try again.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
      setIsDialogControlledOpen(false); 
    }
  }
  
  const servicesAvailable = barber.servicesOffered && barber.servicesOffered.length > 0;
  // Use formData for dialog display, selectedOfferedHaircut for form display logic
  const dialogServiceDisplay = formData.style || barber.servicesOffered?.find(s => s.id === formData.serviceId)?.haircutName || "Appointment";
  const dialogPriceDisplay = (formData.serviceId && barber.servicesOffered?.find(s => s.id === formData.serviceId)?.price !== undefined) 
    ? `RM${barber.servicesOffered.find(s => s.id === formData.serviceId)!.price.toFixed(2)}` 
    : "Price to be confirmed by barber";


  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-8">
        {suggestedStyleFromQuery && (
          <FormItem>
            <FormLabel className="text-lg font-semibold">Requested Custom Style</FormLabel>
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
            name="serviceId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Select a Haircut/Service</FormLabel>
                <Select 
                    onValueChange={(value) => {
                        field.onChange(value); 
                        handleServiceChange(value);
                    }} 
                    value={field.value || ""} 
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a haircut/service" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {barber.servicesOffered?.map(service => (
                      <SelectItem key={service.id} value={service.id}>
                        {service.haircutName} ({service.gender}) - RM{service.price.toFixed(2)}
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
             <FormField
                control={form.control}
                name="style"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Describe Desired Style/Service</FormLabel>
                    <FormControl>
                    <Input placeholder="e.g., Men's classic cut, beard trim" {...field} />
                    </FormControl>
                    <FormDescription>
                    This barber hasn't listed specific services. Describe what you're looking for.
                    </FormDescription>
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
                      className={cn("w-full pl-3 text-left font-normal",!field.value && "text-muted-foreground")}
                    >
                      {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => date < new Date(new Date().setHours(0,0,0,0)) } initialFocus />
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
                <Textarea placeholder="Any specific requests or information?" className="resize-none" {...field} />
              </FormControl>
              <FormDescription>Max 500 characters.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {selectedOfferedHaircut?.price !== undefined && selectedOfferedHaircut.price !== null && (
            <div className="p-3 bg-accent/10 rounded-md text-center">
                <p className="text-sm text-accent-foreground/80">Selected Service Price:</p>
                <p className="text-xl font-bold text-accent">RM{selectedOfferedHaircut.price.toFixed(2)}</p>
            </div>
        )}

        <AlertDialog open={isDialogControlledOpen} onOpenChange={setIsDialogControlledOpen}>
            <AlertDialogTrigger asChild>
                <Button 
                    type="submit" 
                    disabled={isSubmitting || !form.watch('date') || !form.watch('time') || (!form.watch('style') && !form.watch('serviceId')) } 
                    className="w-full text-lg py-6"
                >
                    Request Appointment
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                <AlertDialogTitle>Confirm Your Appointment Details</AlertDialogTitle>
                <AlertDialogDescription>
                    Review your request for <span className="font-semibold">{barber.displayName}</span>:
                    <ul className="mt-3 space-y-1 text-sm text-foreground/90 list-disc list-inside">
                        <li><strong>Service:</strong> {dialogServiceDisplay}</li>
                        <li><strong>Date:</strong> {formData.date ? format(formData.date, "PPP") : 'Not set'}</li>
                        <li><strong>Time:</strong> {formData.time || 'Not set'}</li>
                        <li><strong>Price:</strong> <span className="font-semibold">{dialogPriceDisplay}</span></li>
                        {formData.notes && (<li><strong>Notes:</strong> {formData.notes}</li>)}
                    </ul>
                     {(!formData.serviceId || barber.servicesOffered?.find(s => s.id === formData.serviceId)?.price === undefined) && (
                        <p className="mt-2 text-xs text-muted-foreground">The final price for custom styles or unpriced services will be proposed by the barber for your approval.</p>
                     )}
                </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setIsDialogControlledOpen(false)} disabled={isSubmitting}>Cancel</AlertDialogCancel>
                <AlertDialogAction 
                    onClick={processBooking} 
                    disabled={isSubmitting}
                    className="bg-primary hover:bg-primary/90"
                >
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Confirm & Send Request
                </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
      </form>
    </Form>
  );
}
    