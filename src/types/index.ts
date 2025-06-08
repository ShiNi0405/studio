
import type { Timestamp } from 'firebase/firestore';

export type UserRole = 'customer' | 'barber';

// This is the old ServiceItem, which will be replaced by OfferedHaircut for barbers.
// It might still be useful if we have a generic concept of service elsewhere,
// but for barber's profile, OfferedHaircut is more specific.
// export interface ServiceItem {
//   id: string; 
//   name: string;
//   price: number;
//   duration?: number; 
// }

// New structure for haircuts offered by barbers
export interface OfferedHaircut {
  id: string; // Unique ID for this specific offering by the barber (e.g., for React keys)
  haircutOptionId: string; // Reference to a general haircut definition (e.g., 'men-crew-cut')
  haircutName: string; // Denormalized name like "Crew Cut" for display
  gender: 'men' | 'women'; // Category
  price: number;
  duration?: number; // Duration in minutes
  portfolioImageURLs?: string[]; // URLs specific to this barber's version of this haircut
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
  specialties?: string[]; // General specialties, can remain
  experienceYears?: number;
  availability?: string; // JSON string for general availability
  subscriptionActive?: boolean;
  // portfolioImageURLs?: string[]; // This will be removed, portfolio is now part of OfferedHaircut
  servicesOffered?: OfferedHaircut[]; // Replaces the old ServiceItem[]
  location?: string; 
  latitude?: number; 
  longitude?: number; 
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
  time: string; // HH:MM format
  
  // These fields relate to the specific service/haircut booked
  style?: string; // Could be a custom request or AI suggested style name
  serviceName?: string; // Name of the haircut/service from barber's offered list
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
