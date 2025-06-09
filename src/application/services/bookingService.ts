
import { Timestamp } from 'firebase/firestore';
import { bookingRepository, type CreateBookingDataInternal } from '@/infrastructure/repositories/bookingRepository';
import type { BookingStatus, Booking } from '@/domain/entities';

export interface CreateBookingServiceData {
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

export class BookingService {
  constructor(private repo: typeof bookingRepository) {}

  async createBooking(data: CreateBookingServiceData): Promise<{ bookingId: string; status: BookingStatus }> {
    const firestoreTimestamp = Timestamp.fromDate(new Date(data.appointmentDateTime));

    const initialStatus: BookingStatus =
      data.servicePrice !== undefined && data.servicePrice !== null
        ? 'pending_barber_proposal'
        : 'pending_customer_request';

    const bookingDataInternal: CreateBookingDataInternal = {
      ...data,
      appointmentDateTime: firestoreTimestamp,
      status: initialStatus,
      proposedPriceByBarber: null, 
    };

    const bookingId = await this.repo.create(bookingDataInternal);
    return { bookingId, status: initialStatus };
  }

  async updateBookingStatus(
    bookingId: string,
    newStatus: Extract<BookingStatus, 'confirmed' | 'rejected_by_barber' | 'completed' | 'cancelled_by_barber' | 'cancelled_by_customer'>
  ): Promise<{ newStatus: BookingStatus }> {
    await this.repo.updateStatus(bookingId, newStatus);
    return { newStatus };
  }

  async proposePrice(bookingId: string, proposedPrice: number): Promise<void> {
    if (proposedPrice <= 0) {
      throw new Error("Proposed price must be greater than zero.");
    }
    await this.repo.updateProposedPrice(bookingId, proposedPrice, 'pending_customer_approval');
  }

  async acceptProposedPrice(bookingId: string): Promise<void> {
    await this.repo.updateStatus(bookingId, 'confirmed');
  }

  async rejectProposedPrice(bookingId: string): Promise<void> {
    await this.repo.updateStatus(bookingId, 'rejected_by_customer');
  }

  async getBookingById(bookingId: string): Promise<Booking | null> {
    return this.repo.findById(bookingId);
  }
}

export const bookingService = new BookingService(bookingRepository);
