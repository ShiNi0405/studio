
'use server';

import { bookingService, type CreateBookingServiceData } from '@/services/bookingService';
import type { BookingStatus } from '@/types';

// Kept original interface for compatibility with BookingForm, but service layer uses its own.
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
    // Map data to the structure expected by BookingService
    // Note: CreateBookingServiceData is very similar, this mapping is minor here but good practice.
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
    return { success: true, newStatus: result.newStatus };
  } catch (error: any) {
    console.error('Error updating booking status via action:', error);
    return { success: false, error: error.message || "Could not update booking status." };
  }
}

export async function proposePriceAction(bookingId: string, proposedPrice: number) {
  try {
    await bookingService.proposePrice(bookingId, proposedPrice);
    return { success: true };
  } catch (error: any) {
    console.error('Error proposing price via action:', error);
    // The service layer might throw specific errors, like "Proposed price must be greater than zero."
    return { success: false, error: error.message || "Could not propose price." };
  }
}

export async function acceptProposedPriceAction(bookingId: string) {
  try {
    await bookingService.acceptProposedPrice(bookingId);
    return { success: true };
  } catch (error: any) {
    console.error('Error accepting proposed price via action:', error);
    return { success: false, error: error.message || "Could not accept price." };
  }
}

export async function rejectProposedPriceAction(bookingId: string) {
  try {
    await bookingService.rejectProposedPrice(bookingId);
    return { success: true };
  } catch (error: any) {
    console.error('Error rejecting proposed price via action:', error);
    return { success: false, error: error.message || "Could not reject price." };
  }
}
