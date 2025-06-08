
'use server';

import { revalidatePath } from 'next/cache';
import { collection, addDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { BookingStatus } from '@/types';

interface CreateBookingData {
  customerId: string;
  customerName: string;
  barberId: string;
  barberName: string;
  appointmentDateTime: Date; // Expect a JavaScript Date object for the full appointment date and time
  time: string; // Expect the HH:MM time string
  style?: string | null;
  serviceName?: string | null;
  servicePrice?: number | null;
  serviceDuration?: number | null;
  notes?: string | null;
  status: BookingStatus;
}

export async function createBookingAction(data: CreateBookingData) {
  try {
    const firestoreTimestamp = Timestamp.fromDate(new Date(data.appointmentDateTime));

    const bookingToSave = {
      customerId: data.customerId,
      customerName: data.customerName,
      barberId: data.barberId,
      barberName: data.barberName,
      appointmentDateTime: firestoreTimestamp,
      time: data.time,
      style: data.style || null,
      serviceName: data.serviceName || null,
      servicePrice: data.servicePrice === undefined ? null : data.servicePrice, // Ensure undefined becomes null
      serviceDuration: data.serviceDuration === undefined ? null : data.serviceDuration, // Ensure undefined becomes null
      notes: data.notes || null,
      status: data.status,
      createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, 'bookings'), bookingToSave);

    revalidatePath('/dashboard/my-bookings');
    revalidatePath('/dashboard/booking-requests');
    revalidatePath(`/barbers/${data.barberId}`);

    return { success: true, bookingId: docRef.id };
  } catch (error: any) {
    console.error('Error creating booking:', error);
    // Log the actual data received by the action
    console.error('Data received by createBookingAction:', JSON.stringify(data, (key, value) =>
      value instanceof Date ? value.toISOString() : value, 2)
    );
    const attemptedSaveObject = {
        customerId: data.customerId,
        customerName: data.customerName,
        barberId: data.barberId,
        barberName: data.barberName,
        appointmentDateTime: new Date(data.appointmentDateTime).toISOString(),
        time: data.time,
        style: data.style || null,
        serviceName: data.serviceName || null,
        servicePrice: data.servicePrice === undefined ? null : data.servicePrice,
        serviceDuration: data.serviceDuration === undefined ? null : data.serviceDuration,
        notes: data.notes || null,
        status: data.status,
      };
    console.error('Booking object attempted to save (approximate for logging):', JSON.stringify(attemptedSaveObject, null, 2));

    let userFriendlyMessage = 'Failed to create booking. Please try again.';
    if (error.message && error.message.includes("Unsupported field value")) {
        userFriendlyMessage = "Failed to create booking due to invalid data. Please check your input and try again. Firestore does not support 'undefined' values.";
    } else if (error.message) {
        userFriendlyMessage = `Failed to create booking: ${error.message}`;
    }
    return { success: false, error: userFriendlyMessage };
  }
}
