
'use server';

import { bookingService, type CreateBookingServiceData } from '@/application/services/bookingService';
import type { BookingStatus } from '@/domain/entities';
import { revalidatePath } from 'next/cache'; 

interface CreateBookingActionData {
  customerId: string;
  customerName: string;
  barberId: string;
  barberName: string;
  appointmentDateTime: Date;
  time: string;
  style?: string | null;
  serviceName?: string | null;
  servicePrice?: number | null;
  serviceDuration?: number | null;
  notes?: string | null;
}

export async function createBookingAction(data: CreateBookingActionData) {
  try {
    const serviceData: CreateBookingServiceData = {
        customerId: data.customerId,
        customerName: data.customerName,
        barberId: data.barberId,
        barberName: data.barberName,
        appointmentDateTime: data.appointmentDateTime,
        time: data.time,
        style: data.style,
        serviceName: data.serviceName,
        servicePrice: data.servicePrice,
        serviceDuration: data.serviceDuration,
        notes: data.notes,
    };

    const { bookingId, status } = await bookingService.createBooking(serviceData);
    
    revalidatePath('/dashboard/my-bookings');
    revalidatePath('/dashboard/booking-requests');
    revalidatePath(`/barbers/${data.barberId}`); 

    return { success: true, bookingId, status };
  } catch (error: any) {
    console.error('Error creating booking via action:', error);
    let userFriendlyMessage = 'Failed to create booking. Please try again.';
    if (error.message && error.message.includes("Unsupported field value")) {
      userFriendlyMessage = "Failed to create booking due to invalid data. Please check your input and try again.";
    } else if (error.message) {
      userFriendlyMessage = `Failed to create booking: ${error.message}`;
    }
    return { success: false, error: userFriendlyMessage };
  }
}

export async function updateBookingStatusAction(
  bookingId: string,
  newStatus: Extract<BookingStatus, 'confirmed' | 'rejected_by_barber' | 'completed' | 'cancelled_by_barber' | 'cancelled_by_customer'>
) {
  try {
    const result = await bookingService.updateBookingStatus(bookingId, newStatus);
    
    revalidatePath('/dashboard/my-bookings');
    revalidatePath('/dashboard/booking-requests');
    // const booking = await bookingService.getBookingById(bookingId);
    // if (booking) revalidatePath(`/barbers/${booking.barberId}`);

    return { success: true, newStatus: result.newStatus };
  } catch (error: any) {
    console.error('Error updating booking status via action:', error);
    return { success: false, error: error.message || "Could not update booking status." };
  }
}

export async function proposePriceAction(bookingId: string, proposedPrice: number) {
  try {
    await bookingService.proposePrice(bookingId, proposedPrice);

    revalidatePath('/dashboard/my-bookings');
    revalidatePath('/dashboard/booking-requests');

    return { success: true };
  } catch (error: any) {
    console.error('Error proposing price via action:', error);
    return { success: false, error: error.message || "Could not propose price." };
  }
}

export async function acceptProposedPriceAction(bookingId: string) {
  try {
    await bookingService.acceptProposedPrice(bookingId);

    revalidatePath('/dashboard/my-bookings');
    revalidatePath('/dashboard/booking-requests');

    return { success: true };
  } catch (error: any) {
    console.error('Error accepting proposed price via action:', error);
    return { success: false, error: error.message || "Could not accept price." };
  }
}

export async function rejectProposedPriceAction(bookingId: string) {
  try {
    await bookingService.rejectProposedPrice(bookingId);

    revalidatePath('/dashboard/my-bookings');
    revalidatePath('/dashboard/booking-requests');

    return { success: true };
  } catch (error: any) {
    console.error('Error rejecting proposed price via action:', error);
    return { success: false, error: error.message || "Could not reject price." };
  }
}
