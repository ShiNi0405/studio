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
  dateTime: Timestamp; // Expect Firestore Timestamp directly
  service?: string;
  notes?: string;
  status: BookingStatus; // Should be 'pending' initially
  preferredTimeOfDay?: string;
}

export async function createBookingAction(data: CreateBookingData) {
  try {
    const bookingWithTimestamp = {
      ...data,
      createdAt: serverTimestamp(), // Add server-side timestamp
    };

    const docRef = await addDoc(collection(db, 'bookings'), bookingWithTimestamp);
    
    // Revalidate paths that show bookings
    revalidatePath('/dashboard/my-bookings'); // For customer
    revalidatePath(`/dashboard/booking-requests`); // For barber, if they have such a page
    revalidatePath(`/barbers/${data.barberId}`); // Barber's profile might show bookings or availability changes
    
    return { success: true, bookingId: docRef.id };
  } catch (error: any) {
    console.error('Error creating booking:', error);
    return { success: false, error: error.message || 'Failed to create booking.' };
  }
}

interface UpdateBookingStatusData {
  bookingId: string;
  newStatus: BookingStatus;
}

// Placeholder for updating booking status (e.g., barber accepts/rejects)
// export async function updateBookingStatusAction(data: UpdateBookingStatusData) {
//   try {
//     const bookingRef = doc(db, 'bookings', data.bookingId);
//     await updateDoc(bookingRef, { status: data.newStatus });

//     // Revalidate relevant paths
//     // ...

//     return { success: true };
//   } catch (error: any) {
//     console.error('Error updating booking status:', error);
//     return { success: false, error: error.message || 'Failed to update booking status.' };
//   }
// }
