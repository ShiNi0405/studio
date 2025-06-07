
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
  service?: string;
  style?: string;
  time?: string; // Expect the HH:MM time string
  notes?: string;
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
      service: data.service,
      style: data.style,
      time: data.time, // Store the HH:MM string as well, as per Booking type
      notes: data.notes,
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
    return { success: false, error: error.message || 'Failed to create booking. Please check console for details.' };
  }
}

// Placeholder for updating booking status (e.g., barber accepts/rejects)
// export async function updateBookingStatusAction(data: UpdateBookingStatusData) {
//   // ...
// }
