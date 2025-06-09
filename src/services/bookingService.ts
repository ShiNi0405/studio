
import { Timestamp } from 'firebase/firestore';
import { bookingRepository, type CreateBookingDataInternal } from '@/lib/firebase/repositories/bookingRepository';
import type { BookingStatus, Booking } from '@/types';
// Removed: import { revalidatePath } from 'next/cache';

// Interface for data coming from the action/UI layer
export interface CreateBookingServiceData {
  customerId: string;
  customerName: string;
  barberId: string;
  barberName: string;
  appointmentDateTime: Date; // Use Date here, service will convert to Timestamp
  time: string;
  style?: string | null;
  serviceName?: string | null;
  servicePrice?: number | null;
  serviceDuration?: number | null;
  notes?: string | null;
}

export class BookingService {
  constructor(private repo: typeof bookingRepository) {}

  async createBooking(data: CreateBookingServiceData): Promise<{ bookingId: string; status: BookingStatus }> {
    const firestoreTimestamp = Timestamp.fromDate(new Date(data.appointmentDateTime));

    // Business logic: Determine initial status
    const initialStatus: BookingStatus =
      data.servicePrice !== undefined && data.servicePrice !== null
        ? 'pending_barber_proposal'
        : 'pending_customer_request';

    const bookingDataInternal: CreateBookingDataInternal = {
      ...data,
      appointmentDateTime: firestoreTimestamp,
      status: initialStatus,
      proposedPriceByBarber: null, // Initialize
    };

    const bookingId = await this.repo.create(bookingDataInternal);

    // Removed revalidatePath calls from here
    // revalidatePath('/dashboard/my-bookings');
    // revalidatePath('/dashboard/booking-requests');
    // revalidatePath(`/barbers/${data.barberId}`);

    return { bookingId, status: initialStatus };
  }

  async updateBookingStatus(
    bookingId: string,
    newStatus: Extract<BookingStatus, 'confirmed' | 'rejected_by_barber' | 'completed' | 'cancelled_by_barber' | 'cancelled_by_customer'>
  ): Promise<{ newStatus: BookingStatus }> {
    // Future: Add business rule validation here (e.g., can only transition from X to Y)
    // For now, directly updating as per original logic
    await this.repo.updateStatus(bookingId, newStatus);
    // Removed revalidatePath calls from here
    // revalidatePath('/dashboard/my-bookings');
    // revalidatePath('/dashboard/booking-requests');
    return { newStatus };
  }

  async proposePrice(bookingId: string, proposedPrice: number): Promise<void> {
    if (proposedPrice <= 0) {
      throw new Error("Proposed price must be greater than zero.");
    }
    // Business Logic: When barber proposes price, status changes to pending_customer_approval
    await this.repo.updateProposedPrice(bookingId, proposedPrice, 'pending_customer_approval');
    // Removed revalidatePath calls from here
    // revalidatePath('/dashboard/my-bookings');
    // revalidatePath('/dashboard/booking-requests');
  }

  async acceptProposedPrice(bookingId: string): Promise<void> {
    // Business Logic: Customer accepts, status becomes confirmed
    await this.repo.updateStatus(bookingId, 'confirmed');
    // Removed revalidatePath calls from here
    // revalidatePath('/dashboard/my-bookings');
    // revalidatePath('/dashboard/booking-requests');
    // Potentially trigger notification to barber here
  }

  async rejectProposedPrice(bookingId: string): Promise<void> {
    // Business Logic: Customer rejects, status becomes rejected_by_customer
    await this.repo.updateStatus(bookingId, 'rejected_by_customer');
    // Removed revalidatePath calls from here
    // revalidatePath('/dashboard/my-bookings');
    // revalidatePath('/dashboard/booking-requests');
  }

  async getBookingById(bookingId: string): Promise<Booking | null> {
    return this.repo.findById(bookingId);
  }
}

export const bookingService = new BookingService(bookingRepository);
