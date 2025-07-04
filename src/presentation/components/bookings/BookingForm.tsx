
'use client';

import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '@/presentation/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/presentation/components/ui/form';
import { Input } from '@/presentation/components/ui/input';
import { Textarea } from '@/presentation/components/ui/textarea';
import { Calendar } from '@/presentation/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/presentation/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/presentation/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/presentation/components/ui/alert-dialog";
import { cn } from '@/shared/utils';
import { format } from 'date-fns';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import type { Barber, Customer, OfferedHaircut } from '@/domain/entities';
import { useToast } from '@/presentation/hooks/use-toast';
import { createBookingAction } from '@/app/actions/bookingActions';
import { useSearchParams } from 'next/navigation';

const CUSTOM_STYLE_VALUE = "__request_custom_style__";

const bookingFormSchema = z.object({
  style: z.string().optional(),
  serviceId: z.string().optional(),
  date: z.date({ required_error: "A date is required." }),
  time: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: "Invalid time format. Use HH:MM (e.g., 14:30)."}),
  notes: z.string().max(500, "Notes cannot exceed 500 characters.").optional(),
}).refine(data => data.style || data.serviceId, {
  message: "Either a style description or a specific service must be provided/selected.",
  path: ["style"], 
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
  const preferredStyleNameFromQuery = searchParams.get('style'); 
  const preferredHaircutOptionIdFromQuery = searchParams.get('haircutOptionId'); 

  const [selectedOfferedHaircut, setSelectedOfferedHaircut] = useState<OfferedHaircut | null>(null);

  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      style: preferredStyleNameFromQuery || undefined,
      serviceId: undefined, 
      time: "",
      notes: "",
    },
  });

  const formData = form.watch();

  useEffect(() => {
    let servicePreSelected = false;
    if (preferredHaircutOptionIdFromQuery && barber.servicesOffered) {
      const matchingService = barber.servicesOffered.find(
        s => s.haircutOptionId === preferredHaircutOptionIdFromQuery
      );
      if (matchingService) {
        form.setValue('serviceId', matchingService.id, { shouldValidate: true });
        form.setValue('style', undefined, { shouldValidate: true }); 
        setSelectedOfferedHaircut(matchingService);
        servicePreSelected = true;
      }
    }

    if (!servicePreSelected && preferredStyleNameFromQuery) {
      form.setValue('style', preferredStyleNameFromQuery, { shouldValidate: true });
      form.setValue('serviceId', undefined, { shouldValidate: true }); 
      setSelectedOfferedHaircut(null);
    }
  }, [preferredHaircutOptionIdFromQuery, preferredStyleNameFromQuery, barber.servicesOffered, form]);


  const handleServiceChange = (serviceIdValue: string | undefined) => {
    if (serviceIdValue === CUSTOM_STYLE_VALUE) {
        setSelectedOfferedHaircut(null);
        form.setValue('serviceId', undefined, { shouldValidate: true }); 
        form.setValue('style', form.getValues('style') || '', { shouldValidate: true });
    } else if (serviceIdValue) { 
        const service = barber.servicesOffered?.find(s => s.id === serviceIdValue);
        if (service) {
            setSelectedOfferedHaircut(service);
            form.setValue('serviceId', serviceIdValue, { shouldValidate: true });
            form.setValue('style', undefined, { shouldValidate: true }); 
        }
    } else { 
        setSelectedOfferedHaircut(null);
        form.setValue('serviceId', undefined, { shouldValidate: true });
    }
  };

  const handleFormSubmit = async () => {
    const isValid = await form.trigger();
    if (isValid) {
      setIsDialogControlledOpen(true);
    } else {
      toast({title: "Incomplete Form", description: "Please fill all required fields.", variant: "destructive"})
    }
  }

  async function processBooking() {
    const data = form.getValues();
    setIsSubmitting(true);
    try {
      const [hours, minutes] = data.time.split(':').map(Number);
      const appointmentDateTime = new Date(data.date);
      appointmentDateTime.setHours(hours, minutes, 0, 0);

      const styleValue = selectedOfferedHaircut ? null : (data.style || preferredStyleNameFromQuery || null);
      
      let serviceNameValue: string | null = null;
      let servicePriceValue: number | null = null;
      let serviceDurationValue: number | null = null;

      if (selectedOfferedHaircut) {
        serviceNameValue = selectedOfferedHaircut.haircutName;
        servicePriceValue = selectedOfferedHaircut.price;
        serviceDurationValue = selectedOfferedHaircut.duration === undefined || selectedOfferedHaircut.duration === null ? null : selectedOfferedHaircut.duration;
      }

      const bookingPayload = {
        customerId: customer.uid,
        customerName: customer.displayName || 'Customer',
        barberId: barber.uid,
        barberName: barber.displayName || 'Barber',
        appointmentDateTime: appointmentDateTime,
        time: data.time,
        style: styleValue,
        serviceName: serviceNameValue,
        servicePrice: servicePriceValue, 
        serviceDuration: serviceDurationValue, 
        notes: data.notes || null,
      };

      const result = await createBookingAction(bookingPayload);

      if (result.success) {
        const bookedItemName = selectedOfferedHaircut?.haircutName || data.style || preferredStyleNameFromQuery || 'an appointment';
        toast({
            title: "Booking Request Sent!",
            description: `Your request for ${bookedItemName} on ${format(data.date, "PPP")} at ${data.time} has been sent. Status: ${result.status?.replace(/_/g, ' ')}.`
        });
        form.reset({
            style: preferredStyleNameFromQuery || undefined,
            serviceId: undefined,
            time: "",
            notes: "",
            date: undefined,
        });
        setSelectedOfferedHaircut(null);
        if (preferredHaircutOptionIdFromQuery && barber.servicesOffered) {
            const matchingService = barber.servicesOffered.find(s => s.haircutOptionId === preferredHaircutOptionIdFromQuery);
            if (matchingService) {
                form.setValue('serviceId', matchingService.id, { shouldValidate: true });
                form.setValue('style', undefined, { shouldValidate: true });
                setSelectedOfferedHaircut(matchingService);
            } else if (preferredStyleNameFromQuery) {
                 form.setValue('style', preferredStyleNameFromQuery, { shouldValidate: true });
            }
        } else if (preferredStyleNameFromQuery) {
            form.setValue('style', preferredStyleNameFromQuery, { shouldValidate: true });
        }

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

  const currentServiceForDisplay = selectedOfferedHaircut ||
                                   (preferredHaircutOptionIdFromQuery && barber.servicesOffered?.find(s => s.haircutOptionId === preferredHaircutOptionIdFromQuery && form.getValues('serviceId') === s.id));

  const dialogServiceDescription = currentServiceForDisplay?.haircutName || formData.style || preferredStyleNameFromQuery || "Appointment";
  const dialogPriceDisplay = (currentServiceForDisplay?.price !== undefined && currentServiceForDisplay.price !== null)
    ? `RM${currentServiceForDisplay.price.toFixed(2)}`
    : "Price to be confirmed by barber";


  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-8">

        {servicesAvailable ? (
           <FormField
            control={form.control}
            name="serviceId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Select a Haircut/Service</FormLabel>
                <Select
                    onValueChange={(value) => { 
                        field.onChange(value === CUSTOM_STYLE_VALUE ? undefined : value); 
                        handleServiceChange(value);
                    }}
                    value={field.value || (form.getValues('style') && !field.value ? CUSTOM_STYLE_VALUE : "")} 
                    disabled={!!(preferredHaircutOptionIdFromQuery && currentServiceForDisplay && field.value && field.value !== CUSTOM_STYLE_VALUE)}
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
                     <SelectItem value={CUSTOM_STYLE_VALUE}><em>Request custom style/service (describe below)</em></SelectItem>
                  </SelectContent>
                </Select>
                {preferredHaircutOptionIdFromQuery && currentServiceForDisplay && form.getValues('serviceId') && form.getValues('serviceId') !== CUSTOM_STYLE_VALUE && (
                    <FormDescription>This service was pre-selected based on your choice.</FormDescription>
                )}
                <FormMessage />
              </FormItem>
            )}
          />
        ) : null}

        {(!servicesAvailable || form.watch('serviceId') === undefined || selectedOfferedHaircut === null) && (
             <FormField
                control={form.control}
                name="style"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Describe Desired Style/Service</FormLabel>
                    <FormControl>
                    <Input
                        placeholder="e.g., Men's classic cut, AI suggested style"
                        {...field}
                        value={field.value || ""} 
                        readOnly={!!(preferredStyleNameFromQuery && (!preferredHaircutOptionIdFromQuery || !currentServiceForDisplay) && !servicesAvailable)}
                    />
                    </FormControl>
                    {!servicesAvailable && (
                        <FormDescription>This barber hasn't listed specific services. Describe what you're looking for.</FormDescription>
                    )}
                    {preferredStyleNameFromQuery && (!preferredHaircutOptionIdFromQuery || !currentServiceForDisplay) && (
                         <FormDescription>Booking based on the style: "{preferredStyleNameFromQuery}". Price will be proposed by the barber.</FormDescription>
                    )}
                     {(servicesAvailable && (!form.watch('serviceId') && !selectedOfferedHaircut)) && (
                        <FormDescription>Describe your custom request, or select a service above.</FormDescription>
                    )}
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

        {currentServiceForDisplay?.price !== undefined && currentServiceForDisplay.price !== null && (
            <div className="p-3 bg-accent/10 rounded-md text-center">
                <p className="text-sm text-accent-foreground/80">Selected Service Price:</p>
                <p className="text-xl font-bold text-accent">RM{currentServiceForDisplay.price.toFixed(2)}</p>
            </div>
        )}

        <Button
            type="submit" 
            disabled={isSubmitting || !form.formState.isValid }
            className="w-full text-lg py-6"
        >
            Request Appointment
        </Button>

        <AlertDialog open={isDialogControlledOpen} onOpenChange={setIsDialogControlledOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirm Your Appointment Details</AlertDialogTitle>
                  <AlertDialogDescription>
                    <div>Review your request for <span className="font-semibold">{barber.displayName}</span>:</div>
                  </AlertDialogDescription>
                  <ul className="mt-1 space-y-1 text-sm text-foreground/90 list-disc list-inside">
                      <li><strong>Service:</strong> {dialogServiceDescription}</li>
                      <li><strong>Date:</strong> {formData.date ? format(formData.date, "PPP") : 'Not set'}</li>
                      <li><strong>Time:</strong> {formData.time || 'Not set'}</li>
                      <li><strong>Price:</strong> <span className="font-semibold">{dialogPriceDisplay}</span></li>
                      {formData.notes && (<li><strong>Notes:</strong> {formData.notes}</li>)}
                  </ul>
                  {dialogPriceDisplay.includes("to be confirmed") && (
                    <p className="mt-2 text-xs text-muted-foreground">The final price for custom styles or unpriced services will be proposed by the barber for your approval.</p>
                  )}
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
