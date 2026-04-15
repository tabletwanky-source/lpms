/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type View = 'Dashboard' | 'Reservations' | 'Guests' | 'Billing' | 'Housekeeping' | 'Reports' | 'Admin' | 'Products' | 'Settings';

export interface Product {
  id: string;
  hotel_id: string;
  name: string;
  price: number;
  category: string;
  created_at: string;
}

export interface ReservationProduct {
  id: string;
  reservation_id: string;
  hotel_id: string;
  product_id: string | null;
  product_name: string;
  unit_price: number;
  quantity: number;
  created_at: string;
}

export type UserRole = 'Admin' | 'Reception';
export type SubscriptionPlan = 'Free' | 'Basic' | 'Pro';

export interface User {
  id: string;
  hotelName: string;
  managerName: string;
  email: string;
  password?: string;
  role: UserRole;
  plan: SubscriptionPlan;
  createdAt: string;
}

export interface Room {
  id: string;
  number: string;
  type: 'Single' | 'Double' | 'Suite' | 'Deluxe';
  status: 'Available' | 'Occupied' | 'Dirty' | 'Maintenance';
  price: number;
  assignedStaffId?: string;
  lastCleaned?: string;
}

export interface Staff {
  id: string;
  name: string;
  role: 'Housekeeper' | 'Maintenance' | 'Supervisor';
  status: 'Active' | 'On Break' | 'Off Duty';
}

export interface Reservation {
  id: string;
  guestId: string;
  guestName: string;
  roomId: string;
  roomNumber: string;
  roomType: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  numGuests: number;
  status: 'Confirmed' | 'Checked In' | 'Checked Out' | 'Cancelled';
  total: number;
  paymentMethod: 'Cash' | 'Card' | 'Online';
  amountPaid: number;
  balanceDue: number;
  specialRequests?: string;
  notes?: string;
  createdAt: string;
  createdBy: string;
}

export interface Guest {
  id: string;
  name: string;
  email: string;
  phone: string;
  address?: string;
  nationality?: string;
  idNumber?: string;
  lastStay: string;
  totalSpent: number;
  avatar?: string;
  notes?: string;
}

export type TransactionType = 'Room' | 'Restaurant' | 'Laundry' | 'Spa' | 'Deposit' | 'Refund';

export interface Transaction {
  id: string;
  reservationId: string;
  guestName: string;
  type: TransactionType;
  description: string;
  amount: number;
  date: string;
  status: 'Paid' | 'Pending';
}
