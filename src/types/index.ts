
import type { Timestamp } from 'firebase/firestore';

export type UserRole = 'customer' | 'barber';

export interface BaseUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: UserRole;
  createdAt: Timestamp;
  photoURL?: string | null;
}

export interface Customer extends BaseUser {
  role: 'customer';
}

export interface Barber extends BaseUser {
  role: 'barber';
  bio?: string;
  specialties?: string[];
  experienceYears?: number;
  availability?: string; // JSON string: {"monday": ["09:00-12:00", "14:00-18:00"], ...}
  subscriptionActive?: boolean;
  portfolioImageURLs?: string[]; // Added for portfolio
  // averageRating?: number; // Could be added for optimization later
  // reviewCount?: number; // Could be added for optimization later
}

export type AppUser = Customer | Barber;

export type BookingStatus = 
  | 'pending' 
  | 'confirmed' 
  | 'cancelled_by_customer' 
  | 'cancelled_by_barber' 
  | 'completed' 
  | 'rejected';

export interface Booking {
  id: string;
  customerId: string;
  customerName: string;
  barberId: string;
  barberName: string;
  /** The full date and time of the appointment, stored as a Firestore Timestamp. */
  appointmentDateTime: Timestamp; 
  /** The specific time chosen by user (e.g., "15:00"), primarily for display or simple filtering. */
  time: string; 
  service?: string; 
  style?: string;   
  notes?: string;
  status: BookingStatus;
  createdAt: Timestamp;
  // Deprecating 'dateTime' in favor of 'appointmentDateTime' for clarity
  // dateTime?: Timestamp; // Old field, prefer appointmentDateTime
}

export interface Review {
  id: string;
  bookingId: string;
  customerId: string;
  customerName: string;
  barberId: string;
  rating: number; // 1-5
  comment: string;
  createdAt: Timestamp;
}
