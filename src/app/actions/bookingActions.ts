
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
  service?: string | null; // Optional: user might book a style instead
  style?: string | null;   // Optional: user might book a service instead
  time: string; // Expect the HH:MM time string (required by form)
  notes?: string | null;   // Optional
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
      appointmentDateTime: firestoreTimestamp, // Renamed from dateTime
      service: data.service || null,
      style: data.style || null,
      time: data.time, 
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
    // Log the object that was attempted to be saved, converting Date to ISO string for logging
    const attemptedSaveObject = {
        customerId: data.customerId,
        customerName: data.customerName,
        barberId: data.barberId,
        barberName: data.barberName,
        appointmentDateTime: new Date(data.appointmentDateTime).toISOString(), // For logging
        service: data.service || null,
        style: data.style || null,
        time: data.time,
        notes: data.notes || null,
        status: data.status,
      };
    console.error('Booking object attempted to save (approximate for logging):', JSON.stringify(attemptedSaveObject, null, 2));
    return { success: false, error: error.message || 'Failed to create booking. Please check console for details.' };
  }
}

// Placeholder for updating booking status (e.g., barber accepts/rejects)
// export async function updateBookingStatusAction(data: UpdateBookingStatusData) {
//   // ...
// }
