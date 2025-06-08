
import type { Timestamp } from 'firebase/firestore';

export type UserRole = 'customer' | 'barber';

export interface ServiceItem {
  id: string; // Unique ID for the service item, e.g., generated client-side
  name: string;
  price: number;
  duration?: number; // Duration in minutes
}

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
  portfolioImageURLs?: string[];
  servicesOffered?: ServiceItem[];
  location?: string; // For textual address, e.g., "Kuala Lumpur City Centre"
  latitude?: number; // For future geocoding
  longitude?: number; // For future geocoding
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
  appointmentDateTime: Timestamp;
  time: string;
  style?: string; // If a custom style was booked
  serviceName?: string; // Name of the service booked from barber's list
  servicePrice?: number; // Price of the service at time of booking
  serviceDuration?: number; // Duration of the service at time of booking
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

