
import {
  collection,
  addDoc,
  doc,
  updateDoc,
  getDoc,
  Timestamp,
  serverTimestamp,
  DocumentReference,
  DocumentSnapshot,
  Firestore,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config'; // Assuming db is your Firestore instance
import type { Booking, BookingStatus } from '@/types';

// Type for data passed to create a booking, Firestore handles ID and createdAt
export interface CreateBookingDataInternal {
  customerId: string;
  customerName: string;
  barberId: string;
  barberName: string;
  appointmentDateTime: Timestamp;
  time: string;
  style?: string | null;
  serviceName?: string | null;
  servicePrice?: number | null;
  serviceDuration?: number | null;
  notes?: string | null;
  status: BookingStatus;
  proposedPriceByBarber?: number | null;
}

export class BookingRepository {
  private bookingsCollection = collection(db as Firestore, 'bookings');

  async create(bookingData: CreateBookingDataInternal): Promise<string> {
    const bookingToSave = {
      ...bookingData,
      createdAt: serverTimestamp() as Timestamp,
    };
    const docRef: DocumentReference = await addDoc(this.bookingsCollection, bookingToSave);
    return docRef.id;
  }

  async findById(bookingId: string): Promise<Booking | null> {
    const docRef = doc(this.bookingsCollection, bookingId);
    const docSnap: DocumentSnapshot = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Booking;
    }
    return null;
  }

  async updateStatus(bookingId: string, newStatus: BookingStatus): Promise<void> {
    const bookingRef = doc(this.bookingsCollection, bookingId);
    await updateDoc(bookingRef, { status: newStatus });
  }

  async updateProposedPrice(bookingId: string, proposedPrice: number, newStatus: BookingStatus): Promise<void> {
    const bookingRef = doc(this.bookingsCollection, bookingId);
    await updateDoc(bookingRef, {
      proposedPriceByBarber: proposedPrice,
      servicePrice: proposedPrice, // As per existing logic, update servicePrice too
      status: newStatus,
    });
  }

  async updateBooking(bookingId: string, data: Partial<Booking>): Promise<void> {
    const bookingRef = doc(this.bookingsCollection, bookingId);
    await updateDoc(bookingRef, data);
  }
}

export const bookingRepository = new BookingRepository();
