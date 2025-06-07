
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
  // Additional profile fields
  // location?: string;
  // portfolioImages?: string[];
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
  dateTime: Timestamp; // Chosen date (time part will be set by barber or be start of day)
  service?: string; // Original service selected, might be overridden by style
  style?: string; // Suggested style from AI or manually entered
  time?: string; // Specific time chosen by user, e.g., "15:00"
  notes?: string;
  status: BookingStatus;
  createdAt: Timestamp;
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
