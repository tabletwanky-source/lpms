import { supabase } from './supabase';
import type { Room, Guest, Reservation, Transaction } from '../types';

// ─── TYPE MAPPERS ────────────────────────────────────────────────────────────

function dbToRoom(row: Record<string, unknown>): Room {
  return {
    id: row.id as string,
    number: row.number as string,
    type: row.type as Room['type'],
    status: row.status as Room['status'],
    price: Number(row.price),
    lastCleaned: (row.last_cleaned as string) ?? undefined,
    assignedStaffId: (row.assigned_staff_id as string) ?? undefined,
  };
}

function dbToGuest(row: Record<string, unknown>): Guest {
  return {
    id: row.id as string,
    name: row.name as string,
    email: row.email as string,
    phone: row.phone as string,
    address: (row.address as string) || undefined,
    nationality: (row.nationality as string) || undefined,
    idNumber: (row.id_number as string) || undefined,
    lastStay: (row.last_stay as string) || 'Never',
    totalSpent: Number(row.total_spent) || 0,
    notes: (row.notes as string) || undefined,
  };
}

function dbToReservation(row: Record<string, unknown>): Reservation {
  return {
    id: row.id as string,
    guestId: (row.guest_id as string) || '',
    guestName: row.guest_name as string,
    roomId: (row.room_id as string) || '',
    roomNumber: row.room_number as string,
    roomType: (row.room_type as string) || '',
    checkIn: row.check_in as string,
    checkOut: row.check_out as string,
    nights: Number(row.nights),
    numGuests: Number(row.num_guests),
    status: row.status as Reservation['status'],
    total: Number(row.total),
    paymentMethod: row.payment_method as Reservation['paymentMethod'],
    amountPaid: Number(row.amount_paid) || 0,
    balanceDue: Number(row.balance_due) || 0,
    specialRequests: (row.special_requests as string) || undefined,
    notes: (row.notes as string) || undefined,
    createdAt: row.created_at as string,
    createdBy: (row.created_by as string) || '',
    canceled_at: (row.canceled_at as string) || undefined,
  };
}

function dbToTransaction(row: Record<string, unknown>): Transaction {
  return {
    id: row.id as string,
    reservationId: (row.reservation_id as string) || '',
    guestName: row.guest_name as string,
    type: row.type as Transaction['type'],
    description: row.description as string,
    amount: Number(row.amount),
    date: row.date as string,
    status: row.status as Transaction['status'],
  };
}

// ─── ROOMS ───────────────────────────────────────────────────────────────────

export async function getRooms(hotelId: string): Promise<Room[]> {
  const { data } = await supabase
    .from('rooms')
    .select('*')
    .eq('hotel_id', hotelId)
    .order('number');
  return (data ?? []).map(dbToRoom);
}

export async function createRoom(
  hotelId: string,
  room: Omit<Room, 'id' | 'status'>
): Promise<Room | null> {
  const { data } = await supabase
    .from('rooms')
    .insert({
      hotel_id: hotelId,
      number: room.number,
      type: room.type,
      price: room.price,
      status: 'Available',
      last_cleaned: room.lastCleaned ?? null,
    })
    .select()
    .single();
  return data ? dbToRoom(data) : null;
}

export async function updateRoom(hotelId: string, room: Room): Promise<void> {
  await supabase
    .from('rooms')
    .update({
      number: room.number,
      type: room.type,
      status: room.status,
      price: room.price,
      last_cleaned: room.lastCleaned ?? null,
      assigned_staff_id: room.assignedStaffId ?? null,
    })
    .eq('id', room.id)
    .eq('hotel_id', hotelId);
}

export async function deleteRoom(hotelId: string, id: string): Promise<void> {
  await supabase
    .from('rooms')
    .delete()
    .eq('id', id)
    .eq('hotel_id', hotelId);
}

// ─── GUESTS ──────────────────────────────────────────────────────────────────

export async function getGuests(hotelId: string): Promise<Guest[]> {
  const { data } = await supabase
    .from('guests')
    .select('*')
    .eq('hotel_id', hotelId)
    .order('created_at', { ascending: false });
  return (data ?? []).map(dbToGuest);
}

export async function createGuest(
  hotelId: string,
  guest: Omit<Guest, 'id' | 'lastStay' | 'totalSpent'>
): Promise<Guest | null> {
  const { data } = await supabase
    .from('guests')
    .insert({
      hotel_id: hotelId,
      name: guest.name,
      email: guest.email,
      phone: guest.phone,
      address: guest.address ?? '',
      nationality: guest.nationality ?? '',
      id_number: guest.idNumber ?? '',
      last_stay: 'Never',
      total_spent: 0,
      notes: guest.notes ?? '',
    })
    .select()
    .single();
  return data ? dbToGuest(data) : null;
}

export async function updateGuest(hotelId: string, guest: Guest): Promise<void> {
  await supabase
    .from('guests')
    .update({
      name: guest.name,
      email: guest.email,
      phone: guest.phone,
      address: guest.address ?? '',
      nationality: guest.nationality ?? '',
      id_number: guest.idNumber ?? '',
      last_stay: guest.lastStay,
      total_spent: guest.totalSpent,
      notes: guest.notes ?? '',
    })
    .eq('id', guest.id)
    .eq('hotel_id', hotelId);
}

export async function deleteGuest(hotelId: string, id: string): Promise<void> {
  await supabase
    .from('guests')
    .delete()
    .eq('id', id)
    .eq('hotel_id', hotelId);
}

// ─── RESERVATIONS ─────────────────────────────────────────────────────────────

export async function getReservations(hotelId: string): Promise<Reservation[]> {
  const { data } = await supabase
    .from('reservations')
    .select('*')
    .eq('hotel_id', hotelId)
    .order('created_at', { ascending: false });
  return (data ?? []).map(dbToReservation);
}

export async function createReservation(
  hotelId: string,
  res: Omit<Reservation, 'id' | 'status'>
): Promise<Reservation | null> {
  const { data } = await supabase
    .from('reservations')
    .insert({
      hotel_id: hotelId,
      guest_id: res.guestId,
      guest_name: res.guestName,
      room_id: res.roomId,
      room_number: res.roomNumber,
      room_type: res.roomType,
      check_in: res.checkIn,
      check_out: res.checkOut,
      nights: res.nights,
      num_guests: res.numGuests,
      status: 'Confirmed',
      total: res.total,
      payment_method: res.paymentMethod,
      amount_paid: res.amountPaid,
      balance_due: res.balanceDue,
      special_requests: res.specialRequests ?? '',
      notes: res.notes ?? '',
      created_by: res.createdBy,
    })
    .select()
    .single();
  return data ? dbToReservation(data) : null;
}

export async function updateReservationStatus(
  hotelId: string,
  id: string,
  status: Reservation['status'],
  extra: Record<string, unknown> = {}
): Promise<void> {
  await supabase
    .from('reservations')
    .update({ status, ...extra })
    .eq('id', id)
    .eq('hotel_id', hotelId);
}

// ─── TRANSACTIONS ─────────────────────────────────────────────────────────────

export async function getTransactions(hotelId: string): Promise<Transaction[]> {
  const { data } = await supabase
    .from('transactions')
    .select('*')
    .eq('hotel_id', hotelId)
    .order('created_at', { ascending: false });
  return (data ?? []).map(dbToTransaction);
}

export async function createTransaction(
  hotelId: string,
  t: Omit<Transaction, 'id' | 'date' | 'status'>
): Promise<Transaction | null> {
  const { data } = await supabase
    .from('transactions')
    .insert({
      hotel_id: hotelId,
      reservation_id: t.reservationId,
      guest_name: t.guestName,
      type: t.type,
      description: t.description,
      amount: t.amount,
      date: new Date().toISOString(),
      status: t.amount < 0 ? 'Paid' : 'Pending',
    })
    .select()
    .single();
  return data ? dbToTransaction(data) : null;
}

export async function createTransactions(
  hotelId: string,
  items: Omit<Transaction, 'id' | 'date' | 'status'>[]
): Promise<Transaction[]> {
  if (items.length === 0) return [];
  const rows = items.map(t => ({
    hotel_id: hotelId,
    reservation_id: t.reservationId,
    guest_name: t.guestName,
    type: t.type,
    description: t.description,
    amount: t.amount,
    date: new Date().toISOString(),
    status: t.amount < 0 ? 'Paid' : ('Pending' as const),
  }));
  const { data } = await supabase
    .from('transactions')
    .insert(rows)
    .select();
  return (data ?? []).map(dbToTransaction);
}
