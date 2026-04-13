import { Room, Reservation, Guest, Transaction, Staff } from './types';

export const MOCK_ROOMS: Room[] = [
  { id: '1', number: '101', type: 'Single', status: 'Available', price: 120, lastCleaned: '2024-05-13 09:00' },
  { id: '2', number: '102', type: 'Double', status: 'Occupied', price: 180, lastCleaned: '2024-05-13 10:30', assignedStaffId: 's-1' },
  { id: '3', number: '103', type: 'Single', status: 'Dirty', price: 120, lastCleaned: '2024-05-12 16:00' },
  { id: '4', number: '201', type: 'Suite', status: 'Available', price: 350, lastCleaned: '2024-05-13 11:00', assignedStaffId: 's-2' },
  { id: '5', number: '202', type: 'Deluxe', status: 'Maintenance', price: 250, lastCleaned: '2024-05-11 14:00' },
  { id: '6', number: '203', type: 'Double', status: 'Occupied', price: 180, lastCleaned: '2024-05-13 08:45', assignedStaffId: 's-1' },
  { id: '7', number: '301', type: 'Suite', status: 'Available', price: 400, lastCleaned: '2024-05-13 12:00' },
  { id: '8', number: '302', type: 'Single', status: 'Available', price: 130, lastCleaned: '2024-05-13 13:15' },
];

export const MOCK_STAFF: Staff[] = [
  { id: 's-1', name: 'Maria Garcia', role: 'Housekeeper', status: 'Active' },
  { id: 's-2', name: 'James Wilson', role: 'Housekeeper', status: 'Active' },
  { id: 's-3', name: 'Elena Rodriguez', role: 'Supervisor', status: 'Active' },
  { id: 's-4', name: 'Robert Chen', role: 'Maintenance', status: 'On Break' },
];

export const MOCK_RESERVATIONS: Reservation[] = [
  { 
    id: 'res-1', 
    guestId: 'g-1', 
    guestName: 'John Doe', 
    roomId: '2',
    roomNumber: '102', 
    roomType: 'Double',
    checkIn: '2024-05-10', 
    checkOut: '2024-05-15', 
    nights: 5,
    numGuests: 2,
    status: 'Checked In', 
    total: 900,
    paymentMethod: 'Card',
    amountPaid: 200,
    balanceDue: 700,
    createdAt: '2024-05-01T10:00:00Z',
    createdBy: 'Admin'
  },
  { 
    id: 'res-2', 
    guestId: 'g-2', 
    guestName: 'Jane Smith', 
    roomId: '6',
    roomNumber: '203', 
    roomType: 'Double',
    checkIn: '2024-05-12', 
    checkOut: '2024-05-14', 
    nights: 2,
    numGuests: 2,
    status: 'Checked In', 
    total: 360,
    paymentMethod: 'Cash',
    amountPaid: 360,
    balanceDue: 0,
    createdAt: '2024-05-05T14:30:00Z',
    createdBy: 'Admin'
  },
  { 
    id: 'res-3', 
    guestId: 'g-3', 
    guestName: 'Alice Johnson', 
    roomId: '4',
    roomNumber: '201', 
    roomType: 'Suite',
    checkIn: '2024-05-20', 
    checkOut: '2024-05-25', 
    nights: 5,
    numGuests: 1,
    status: 'Confirmed', 
    total: 1750,
    paymentMethod: 'Online',
    amountPaid: 500,
    balanceDue: 1250,
    createdAt: '2024-05-10T09:15:00Z',
    createdBy: 'Admin'
  },
  { 
    id: 'res-4', 
    guestId: 'g-4', 
    guestName: 'Bob Brown', 
    roomId: '1',
    roomNumber: '101', 
    roomType: 'Single',
    checkIn: '2024-05-05', 
    checkOut: '2024-05-08', 
    nights: 3,
    numGuests: 1,
    status: 'Checked Out', 
    total: 360,
    paymentMethod: 'Card',
    amountPaid: 360,
    balanceDue: 0,
    createdAt: '2024-05-01T11:00:00Z',
    createdBy: 'Admin'
  },
];

export const MOCK_GUESTS: Guest[] = [
  { id: 'g-1', name: 'John Doe', email: 'john@example.com', phone: '+1 234 567 890', lastStay: '2024-05-10', totalSpent: 2450, address: '123 Main St, NY', nationality: 'American', idNumber: 'A1234567' },
  { id: 'g-2', name: 'Jane Smith', email: 'jane@example.com', phone: '+1 987 654 321', lastStay: '2024-05-12', totalSpent: 1200, address: '456 Oak Ave, CA', nationality: 'British', idNumber: 'B9876543' },
  { id: 'g-3', name: 'Alice Johnson', email: 'alice@example.com', phone: '+1 555 012 345', lastStay: '2023-12-15', totalSpent: 5600, address: '789 Pine Rd, TX', nationality: 'Canadian', idNumber: 'C5550123' },
];

export const MOCK_TRANSACTIONS: Transaction[] = [
  { id: 't-1', reservationId: 'res-1', guestName: 'John Doe', type: 'Room', description: 'Room Charge - 102', amount: 900, date: '2024-05-10', status: 'Pending' },
  { id: 't-2', reservationId: 'res-1', guestName: 'John Doe', type: 'Restaurant', description: 'Dinner - Blue Grill', amount: 85, date: '2024-05-11', status: 'Pending' },
  { id: 't-3', reservationId: 'res-1', guestName: 'John Doe', type: 'Deposit', description: 'Initial Deposit', amount: -200, date: '2024-05-10', status: 'Paid' },
  { id: 't-4', reservationId: 'res-2', guestName: 'Jane Smith', type: 'Room', description: 'Room Charge - 203', amount: 360, date: '2024-05-12', status: 'Paid' },
  { id: 't-5', reservationId: 'res-2', guestName: 'Jane Smith', type: 'Laundry', description: 'Express Service', amount: 25, date: '2024-05-13', status: 'Paid' },
];
