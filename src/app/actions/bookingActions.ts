
'use server';

import { revalidatePath } from 'next/cache';
import { collection, addDoc, serverTimestamp, Timestamp, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { BookingStatus, Booking } from '@/types';

interface CreateBookingData {
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
  // status is determined by logic below
}

export async function createBookingAction(data: CreateBookingData) {
  try {
    const firestoreTimestamp = Timestamp.fromDate(new Date(data.appointmentDateTime));

    // Determine initial status based on whether a price is set
    const initialStatus: BookingStatus = data.servicePrice !== undefined && data.servicePrice !== null 
      ? 'pending_barber_proposal' // Priced service, barber needs to accept/reject
      : 'pending_customer_request'; // Custom style/unpriced, barber needs to propose price

    const bookingToSave: Omit<Booking, 'id'> = { // Use Omit to ensure all Booking fields are considered
      customerId: data.customerId,
      customerName: data.customerName,
      barberId: data.barberId,
      barberName: data.barberName,
      appointmentDateTime: firestoreTimestamp,
      time: data.time,
      style: data.style || null,
      serviceName: data.serviceName || null,
      servicePrice: data.servicePrice === undefined ? null : data.servicePrice,
      serviceDuration: data.serviceDuration === undefined ? null : data.serviceDuration,
      notes: data.notes || null,
      status: initialStatus,
      proposedPriceByBarber: null, // Initialize proposedPriceByBarber
      createdAt: serverTimestamp() as Timestamp, // Firestore handles serverTimestamp
    };

    const docRef = await addDoc(collection(db, 'bookings'), bookingToSave);

    revalidatePath('/dashboard/my-bookings');
    revalidatePath('/dashboard/booking-requests');
    revalidatePath(`/barbers/${data.barberId}`);

    return { success: true, bookingId: docRef.id, status: initialStatus };
  } catch (error: any) {
    console.error('Error creating booking:', error);
    let userFriendlyMessage = 'Failed to create booking. Please try again.';
    if (error.message && error.message.includes("Unsupported field value")) {
        userFriendlyMessage = "Failed to create booking due to invalid data. Please check your input and try again.";
    } else if (error.message) {
        userFriendlyMessage = `Failed to create booking: ${error.message}`;
    }
    return { success: false, error: userFriendlyMessage };
  }
}

// Action for Barber to update booking status (accept pre-priced, reject, complete, cancel)
export async function updateBookingStatusAction(bookingId: string, newStatus: Extract<BookingStatus, 'confirmed' | 'rejected_by_barber' | 'completed' | 'cancelled_by_barber'>) {
  try {
    const bookingRef = doc(db, 'bookings', bookingId);
    await updateDoc(bookingRef, { status: newStatus });
    revalidatePath('/dashboard/my-bookings');
    revalidatePath('/dashboard/booking-requests');
    return { success: true, newStatus };
  } catch (error: any) {
    console.error('Error updating booking status:', error);
    return { success: false, error: error.message || "Could not update booking status." };
  }
}

// Action for Barber to propose a price for a custom request
export async function proposePriceAction(bookingId: string, proposedPrice: number) {
  try {
    if (proposedPrice <= 0) {
      return { success: false, error: "Proposed price must be greater than zero." };
    }
    const bookingRef = doc(db, 'bookings', bookingId);
    await updateDoc(bookingRef, { 
      proposedPriceByBarber: proposedPrice,
      servicePrice: proposedPrice, // Also update servicePrice to reflect the proposal
      status: 'pending_customer_approval' 
    });
    revalidatePath('/dashboard/my-bookings');
    revalidatePath('/dashboard/booking-requests');
    return { success: true };
  } catch (error: any) {
    console.error('Error proposing price:', error);
    return { success: false, error: error.message || "Could not propose price." };
  }
}

// Action for Customer to accept a proposed price
export async function acceptProposedPriceAction(bookingId: string) {
  try {
    const bookingRef = doc(db, 'bookings', bookingId);
    await updateDoc(bookingRef, { status: 'confirmed' });
    revalidatePath('/dashboard/my-bookings');
    revalidatePath('/dashboard/booking-requests');
    // Potentially trigger notification to barber here
    return { success: true };
  } catch (error: any) {
    console.error('Error accepting proposed price:', error);
    return { success: false, error: error.message || "Could not accept price." };
  }
}

// Action for Customer to reject a proposed price
export async function rejectProposedPriceAction(bookingId: string) {
  try {
    const bookingRef = doc(db, 'bookings', bookingId);
    await updateDoc(bookingRef, { status: 'rejected_by_customer' });
    revalidatePath('/dashboard/my-bookings');
    revalidatePath('/dashboard/booking-requests');
    return { success: true };
  } catch (error: any) {
    console.error('Error rejecting proposed price:', error);
    return { success: false, error: error.message || "Could not reject price." };
  }
}
    