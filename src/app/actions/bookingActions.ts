
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
  dateTime: Timestamp; // Expect Firestore Timestamp for the selected date
  service?: string; // Optional, as style might be primary
  style?: string; // The requested hairstyle
  time?: string; // The requested time slot string e.g., "14:00"
  notes?: string;
  status: BookingStatus; // Should be 'pending' initially
}

export async function createBookingAction(data: CreateBookingData) {
  try {
    // Ensure dateTime has a sensible default time if only date was passed
    // For example, set to midnight UTC of the selected day
    const date = data.dateTime.toDate();
    date.setUTCHours(0,0,0,0);
    const bookingDateTime = Timestamp.fromDate(date);

    const bookingWithTimestamp = {
      ...data,
      dateTime: bookingDateTime, // Use the adjusted timestamp
      createdAt: serverTimestamp(), // Add server-side timestamp
    };

    const docRef = await addDoc(collection(db, 'bookings'), bookingWithTimestamp);
    
    // Revalidate paths that show bookings
    revalidatePath('/dashboard/my-bookings'); // For customer
    revalidatePath(`/dashboard/booking-requests`); // For barber
    revalidatePath(`/barbers/${data.barberId}`); // Barber's profile
    
    return { success: true, bookingId: docRef.id };
  } catch (error: any) {
    console.error('Error creating booking:', error);
    return { success: false, error: error.message || 'Failed to create booking.' };
  }
}

// Placeholder for updating booking status (e.g., barber accepts/rejects)
// export async function updateBookingStatusAction(data: UpdateBookingStatusData) {
//   // ...
// }
