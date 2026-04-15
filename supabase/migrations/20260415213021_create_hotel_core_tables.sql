/*
  # Hotel Core Tables

  ## Overview
  Creates the four core tables that power the hotel management system.
  All tables include a `hotel_id` column that equals `auth.uid()` of the
  hotel owner, providing strict per-hotel data isolation.

  ## New Tables

  ### rooms
  Stores physical hotel rooms. Each room belongs to exactly one hotel.
  - `id` (uuid, PK)
  - `hotel_id` (uuid) – the owning hotel (= auth.uid())
  - `number` (text) – room identifier shown to staff
  - `type` (text) – Single / Double / Suite / Deluxe
  - `status` (text) – Available / Occupied / Dirty / Maintenance
  - `price` (numeric) – nightly rate
  - `last_cleaned` (text) – human-readable timestamp
  - `assigned_staff_id` (text) – optional staff assignment
  - `created_at` (timestamptz)

  ### guests
  Stores guest profiles for a hotel.
  - `id` (uuid, PK)
  - `hotel_id` (uuid) – owning hotel
  - `name`, `email`, `phone`, `address`, `nationality`, `id_number`
  - `last_stay` (text)
  - `total_spent` (numeric)
  - `notes` (text)
  - `created_at` (timestamptz)

  ### reservations
  Tracks room bookings from confirmation through checkout.
  - `id` (uuid, PK)
  - `hotel_id` (uuid) – owning hotel
  - `guest_id`, `guest_name`, `room_id`, `room_number`, `room_type`
  - `check_in` / `check_out` (date)
  - `nights` (integer)
  - `num_guests` (integer)
  - `status` (text) – Confirmed / Checked In / Checked Out / Cancelled
  - `total`, `amount_paid`, `balance_due` (numeric)
  - `payment_method`, `special_requests`, `notes`, `created_by`
  - `created_at`, `canceled_at` (timestamptz)

  ### transactions
  Immutable billing ledger – every charge and payment is a row.
  - `id` (uuid, PK)
  - `hotel_id` (uuid) – owning hotel
  - `reservation_id` (text)
  - `guest_name` (text)
  - `type` (text) – Room / Restaurant / Laundry / Spa / Deposit / Refund
  - `description` (text)
  - `amount` (numeric) – negative = payment
  - `date` (timestamptz)
  - `status` (text) – Pending / Paid
  - `created_at` (timestamptz)

  ## Security
  - RLS enabled on all four tables
  - Each table has SELECT / INSERT / UPDATE / DELETE policies
  - All policies enforce `hotel_id = auth.uid()`
*/

-- ─────────────────────────────────────────
-- ROOMS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rooms (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id        uuid NOT NULL,
  number          text NOT NULL DEFAULT '',
  type            text NOT NULL DEFAULT 'Single' CHECK (type IN ('Single','Double','Suite','Deluxe')),
  status          text NOT NULL DEFAULT 'Available' CHECK (status IN ('Available','Occupied','Dirty','Maintenance')),
  price           numeric(10,2) NOT NULL DEFAULT 0,
  last_cleaned    text DEFAULT NULL,
  assigned_staff_id text DEFAULT NULL,
  created_at      timestamptz DEFAULT now()
);

ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Hotel owners can view own rooms"
  ON rooms FOR SELECT TO authenticated
  USING (hotel_id = auth.uid());

CREATE POLICY "Hotel owners can create rooms"
  ON rooms FOR INSERT TO authenticated
  WITH CHECK (hotel_id = auth.uid());

CREATE POLICY "Hotel owners can update own rooms"
  ON rooms FOR UPDATE TO authenticated
  USING (hotel_id = auth.uid())
  WITH CHECK (hotel_id = auth.uid());

CREATE POLICY "Hotel owners can delete own rooms"
  ON rooms FOR DELETE TO authenticated
  USING (hotel_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_rooms_hotel_id ON rooms(hotel_id);

-- ─────────────────────────────────────────
-- GUESTS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS guests (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id        uuid NOT NULL,
  name            text NOT NULL DEFAULT '',
  email           text NOT NULL DEFAULT '',
  phone           text NOT NULL DEFAULT '',
  address         text DEFAULT '',
  nationality     text DEFAULT '',
  id_number       text DEFAULT '',
  last_stay       text DEFAULT 'Never',
  total_spent     numeric(10,2) DEFAULT 0,
  notes           text DEFAULT '',
  created_at      timestamptz DEFAULT now()
);

ALTER TABLE guests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Hotel owners can view own guests"
  ON guests FOR SELECT TO authenticated
  USING (hotel_id = auth.uid());

CREATE POLICY "Hotel owners can create guests"
  ON guests FOR INSERT TO authenticated
  WITH CHECK (hotel_id = auth.uid());

CREATE POLICY "Hotel owners can update own guests"
  ON guests FOR UPDATE TO authenticated
  USING (hotel_id = auth.uid())
  WITH CHECK (hotel_id = auth.uid());

CREATE POLICY "Hotel owners can delete own guests"
  ON guests FOR DELETE TO authenticated
  USING (hotel_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_guests_hotel_id ON guests(hotel_id);

-- ─────────────────────────────────────────
-- RESERVATIONS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reservations (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id        uuid NOT NULL,
  guest_id        text DEFAULT '',
  guest_name      text NOT NULL DEFAULT '',
  room_id         text DEFAULT '',
  room_number     text NOT NULL DEFAULT '',
  room_type       text DEFAULT '',
  check_in        date NOT NULL,
  check_out       date NOT NULL,
  nights          integer NOT NULL DEFAULT 1,
  num_guests      integer NOT NULL DEFAULT 1,
  status          text NOT NULL DEFAULT 'Confirmed' CHECK (status IN ('Confirmed','Checked In','Checked Out','Cancelled')),
  total           numeric(10,2) NOT NULL DEFAULT 0,
  payment_method  text NOT NULL DEFAULT 'Cash' CHECK (payment_method IN ('Cash','Card','Online')),
  amount_paid     numeric(10,2) DEFAULT 0,
  balance_due     numeric(10,2) DEFAULT 0,
  special_requests text DEFAULT '',
  notes           text DEFAULT '',
  created_by      text DEFAULT '',
  created_at      timestamptz DEFAULT now(),
  canceled_at     timestamptz DEFAULT NULL
);

ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Hotel owners can view own reservations"
  ON reservations FOR SELECT TO authenticated
  USING (hotel_id = auth.uid());

CREATE POLICY "Hotel owners can create reservations"
  ON reservations FOR INSERT TO authenticated
  WITH CHECK (hotel_id = auth.uid());

CREATE POLICY "Hotel owners can update own reservations"
  ON reservations FOR UPDATE TO authenticated
  USING (hotel_id = auth.uid())
  WITH CHECK (hotel_id = auth.uid());

CREATE POLICY "Hotel owners can delete own reservations"
  ON reservations FOR DELETE TO authenticated
  USING (hotel_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_reservations_hotel_id ON reservations(hotel_id);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status);
CREATE INDEX IF NOT EXISTS idx_reservations_check_in ON reservations(check_in);

-- ─────────────────────────────────────────
-- TRANSACTIONS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS transactions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id        uuid NOT NULL,
  reservation_id  text DEFAULT '',
  guest_name      text NOT NULL DEFAULT '',
  type            text NOT NULL DEFAULT 'Room' CHECK (type IN ('Room','Restaurant','Laundry','Spa','Deposit','Refund')),
  description     text NOT NULL DEFAULT '',
  amount          numeric(10,2) NOT NULL DEFAULT 0,
  date            timestamptz DEFAULT now(),
  status          text NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending','Paid')),
  created_at      timestamptz DEFAULT now()
);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Hotel owners can view own transactions"
  ON transactions FOR SELECT TO authenticated
  USING (hotel_id = auth.uid());

CREATE POLICY "Hotel owners can create transactions"
  ON transactions FOR INSERT TO authenticated
  WITH CHECK (hotel_id = auth.uid());

CREATE POLICY "Hotel owners can update own transactions"
  ON transactions FOR UPDATE TO authenticated
  USING (hotel_id = auth.uid())
  WITH CHECK (hotel_id = auth.uid());

CREATE POLICY "Hotel owners can delete own transactions"
  ON transactions FOR DELETE TO authenticated
  USING (hotel_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_transactions_hotel_id ON transactions(hotel_id);
CREATE INDEX IF NOT EXISTS idx_transactions_reservation_id ON transactions(reservation_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);
