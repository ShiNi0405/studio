
'use server';

import { revalidatePath } from 'next/cache';
import { collection, addDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { BookingStatus } from '@/types';

// This interface defines the structure of data expected by createBookingAction
interface CreateBookingData {
  customerId: string;
  customerName: string;
  barberId: string;
  barberName: string;
  appointmentDateTime: Date; // Expect a JavaScript Date object for the full appointment date and time
  service?: string; // Optional: user might book a style instead
  style?: string;   // Optional: user might book a service instead
  time: string; // Expect the HH:MM time string (required by form)
  notes?: string;   // Optional
  status: BookingStatus;
}

export async function createBookingAction(data: CreateBookingData) {
  try {
    // Convert the JavaScript Date object (data.appointmentDateTime)
    // from the client into a Firestore Timestamp.
    // Using new Date() ensures it handles ISO strings if Next.js serializes it.
    const firestoreTimestamp = Timestamp.fromDate(new Date(data.appointmentDateTime));

    // Construct the object to be saved to Firestore
    // It maps to the Booking type defined in src/types/index.ts
    const bookingToSave = {
      customerId: data.customerId,
      customerName: data.customerName,
      barberId: data.barberId,
      barberName: data.barberName,
      dateTime: firestoreTimestamp, // This is the main appointment Timestamp for querying/sorting
      service: data.service || null, // Convert undefined to null
      style: data.style || null,     // Convert undefined to null
      time: data.time,               // This should always be a string from the form
      notes: data.notes || null,     // Convert undefined to null
      status: data.status,
      createdAt: serverTimestamp(), // Firestore server-side timestamp for creation
    };

    const docRef = await addDoc(collection(db, 'bookings'), bookingToSave);
    
    // Revalidate paths that show bookings
    revalidatePath('/dashboard/my-bookings');
    revalidatePath('/dashboard/booking-requests');
    revalidatePath(`/barbers/${data.barberId}`);
    
    return { success: true, bookingId: docRef.id };
  } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
    console.error('Error creating booking:', error);
    console.error('Data received by createBookingAction:', JSON.stringify(data, null, 2));
    // Log the object that was attempted to be saved for more clarity
    const attemptedSaveObject = {
        customerId: data.customerId,
        customerName: data.customerName,
        barberId: data.barberId,
        barberName: data.barberName,
        dateTime: Timestamp.fromDate(new Date(data.appointmentDateTime)).toString(), // toString for logging
        service: data.service || null,
        style: data.style || null,
        time: data.time,
        notes: data.notes || null,
        status: data.status,
        // createdAt: "serverTimestamp()" // Placeholder for logging
      };
    console.error('Booking object attempted to save (approximate):', JSON.stringify(attemptedSaveObject, null, 2));
    return { success: false, error: error.message || 'Failed to create booking. Please check console for details.' };
  }
}

// Placeholder for updating booking status (e.g., barber accepts/rejects)
// export async function updateBookingStatusAction(data: UpdateBookingStatusData) {
//   // ...
// }
