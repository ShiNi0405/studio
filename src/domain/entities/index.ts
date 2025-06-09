
import type { Timestamp } from 'firebase/firestore';

export type UserRole = 'customer' | 'barber';

export interface OfferedHaircut {
  id: string; 
  haircutOptionId: string; 
  haircutName: string; 
  gender: 'men' | 'women';
  price: number;
  duration?: number | null; 
  portfolioImageURLs?: string[]; 
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
  experienceYears?: number | null;
  availability?: string; 
  subscriptionActive?: boolean;
  servicesOffered?: OfferedHaircut[]; 
  location?: string; 
  latitude?: number | null; 
  longitude?: number | null; 
}

export type AppUser = Customer | Barber;

export type BookingStatus =
  | 'pending_customer_request' 
  | 'pending_barber_proposal' 
  | 'pending_customer_approval' 
  | 'confirmed'
  | 'cancelled_by_customer'
  | 'cancelled_by_barber'
  | 'completed'
  | 'rejected_by_barber' 
  | 'rejected_by_customer'; 

export interface Booking {
  id: string;
  customerId: string;
  customerName: string;
  barberId: string;
  barberName: string;
  appointmentDateTime: Timestamp;
  time: string; // HH:MM format
  
  style?: string | null; 
  serviceName?: string | null; 
  servicePrice?: number | null; 
  serviceDuration?: number | null;
  
  proposedPriceByBarber?: number | null; 

  notes?: string | null;
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
