/*
  # Create Invoices and Public Bookings Tables

  ## New Tables

  ### 1. `invoices`
  Stores finalized invoices generated from reservations.
  - `id` (uuid, primary key)
  - `hotel_id` (uuid) — links to auth.users (hotel owner)
  - `reservation_id` (text) — optional reference to local reservation
  - `guest_name` (text)
  - `room_number` (text)
  - `nights` (integer)
  - `room_total` (numeric) — room charges
  - `products_total` (numeric) — extras/products charges
  - `total` (numeric) — grand total
  - `paid` (numeric) — amount paid
  - `balance` (numeric) — remaining balance
  - `status` (text) — issued | paid | cancelled
  - `created_at` (timestamptz)

  ### 2. `public_bookings`
  Stores booking requests from the public booking page. 
  Guests submit without authentication; managers approve/reject.
  - `id` (uuid, primary key)
  - `hotel_id` (uuid) — which hotel this booking is for
  - `guest_name` (text)
  - `email` (text)
  - `phone` (text)
  - `room_type` (text) — Single | Double | Suite | Deluxe
  - `check_in` (date)
  - `check_out` (date)
  - `num_guests` (integer)
  - `special_requests` (text)
  - `status` (text) — pending | approved | rejected
  - `created_at` (timestamptz)

  ## Security

  ### invoices
  - RLS enabled
  - Hotel owners can CRUD their own invoices

  ### public_bookings
  - RLS enabled
  - Anonymous users can INSERT (public booking form)
  - Authenticated hotel owners can SELECT/UPDATE/DELETE their own bookings
*/

-- ==============================
-- INVOICES
-- ==============================
CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id uuid NOT NULL,
  reservation_id text,
  guest_name text NOT NULL DEFAULT '',
  room_number text DEFAULT '',
  nights integer DEFAULT 1,
  room_total numeric(10,2) DEFAULT 0,
  products_total numeric(10,2) DEFAULT 0,
  total numeric(10,2) NOT NULL DEFAULT 0,
  paid numeric(10,2) DEFAULT 0,
  balance numeric(10,2) DEFAULT 0,
  status text NOT NULL DEFAULT 'issued' CHECK (status IN ('issued', 'paid', 'cancelled')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Hotel owners can view own invoices"
  ON invoices FOR SELECT
  TO authenticated
  USING (hotel_id = auth.uid());

CREATE POLICY "Hotel owners can create invoices"
  ON invoices FOR INSERT
  TO authenticated
  WITH CHECK (hotel_id = auth.uid());

CREATE POLICY "Hotel owners can update own invoices"
  ON invoices FOR UPDATE
  TO authenticated
  USING (hotel_id = auth.uid())
  WITH CHECK (hotel_id = auth.uid());

CREATE POLICY "Hotel owners can delete own invoices"
  ON invoices FOR DELETE
  TO authenticated
  USING (hotel_id = auth.uid());

CREATE INDEX IF NOT EXISTS invoices_hotel_id_idx ON invoices(hotel_id);
CREATE INDEX IF NOT EXISTS invoices_created_at_idx ON invoices(created_at DESC);

-- ==============================
-- PUBLIC BOOKINGS
-- ==============================
CREATE TABLE IF NOT EXISTS public_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id uuid NOT NULL,
  guest_name text NOT NULL DEFAULT '',
  email text DEFAULT '',
  phone text DEFAULT '',
  room_type text DEFAULT 'Single' CHECK (room_type IN ('Single', 'Double', 'Suite', 'Deluxe')),
  check_in date NOT NULL,
  check_out date NOT NULL,
  num_guests integer DEFAULT 1,
  special_requests text DEFAULT '',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public_bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit a booking request"
  ON public_bookings FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Authenticated guests can submit bookings"
  ON public_bookings FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Hotel owners can view own booking requests"
  ON public_bookings FOR SELECT
  TO authenticated
  USING (hotel_id = auth.uid());

CREATE POLICY "Hotel owners can update own booking requests"
  ON public_bookings FOR UPDATE
  TO authenticated
  USING (hotel_id = auth.uid())
  WITH CHECK (hotel_id = auth.uid());

CREATE POLICY "Hotel owners can delete own booking requests"
  ON public_bookings FOR DELETE
  TO authenticated
  USING (hotel_id = auth.uid());

CREATE INDEX IF NOT EXISTS public_bookings_hotel_id_idx ON public_bookings(hotel_id);
CREATE INDEX IF NOT EXISTS public_bookings_status_idx ON public_bookings(status);
CREATE INDEX IF NOT EXISTS public_bookings_created_at_idx ON public_bookings(created_at DESC);
