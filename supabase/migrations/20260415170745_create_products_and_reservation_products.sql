/*
  # Products & Reservation Products Tables

  ## Summary
  Adds a hotel products/minibar catalog system, allowing hotels to define
  chargeable items (food, drinks, services) and attach them to reservations
  for accurate billing.

  ## New Tables

  ### products
  - `id` (uuid, PK) - unique identifier
  - `hotel_id` (uuid, FK → auth.users.id) - owning hotel (auth user)
  - `name` (text) - product name e.g. "Coca-Cola"
  - `price` (numeric) - unit price, must be >= 0
  - `category` (text) - e.g. "drink", "food", "service", "laundry"
  - `created_at` (timestamptz)

  ### reservation_products
  - `id` (uuid, PK)
  - `reservation_id` (uuid, FK → reservations.id) - linked reservation
  - `hotel_id` (uuid) - denormalized for fast tenant filter
  - `product_id` (uuid, FK → products.id)
  - `product_name` (text) - snapshot at time of adding
  - `unit_price` (numeric) - snapshot at time of adding
  - `quantity` (int) - number of units
  - `created_at` (timestamptz)

  ## Security
  - RLS: hotels see only their own products and reservation products
  - hotel_id = auth.uid() for all policies

  ## Notes
  - hotel_id references auth.users(id) directly (Supabase Auth integration)
  - product_name and unit_price are snapshotted to preserve historical accuracy
*/

CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  price numeric(10,2) NOT NULL DEFAULT 0 CHECK (price >= 0),
  category text NOT NULL DEFAULT 'other',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Hotel can view own products"
  ON products FOR SELECT
  TO authenticated
  USING (hotel_id = auth.uid());

CREATE POLICY "Hotel can insert products"
  ON products FOR INSERT
  TO authenticated
  WITH CHECK (hotel_id = auth.uid());

CREATE POLICY "Hotel can update products"
  ON products FOR UPDATE
  TO authenticated
  USING (hotel_id = auth.uid())
  WITH CHECK (hotel_id = auth.uid());

CREATE POLICY "Hotel can delete products"
  ON products FOR DELETE
  TO authenticated
  USING (hotel_id = auth.uid());

CREATE INDEX idx_products_hotel_id ON products(hotel_id);
CREATE INDEX idx_products_category ON products(hotel_id, category);

CREATE TABLE IF NOT EXISTS reservation_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id uuid NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  hotel_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  product_name text NOT NULL,
  unit_price numeric(10,2) NOT NULL CHECK (unit_price >= 0),
  quantity int NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE reservation_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Hotel can view own reservation products"
  ON reservation_products FOR SELECT
  TO authenticated
  USING (hotel_id = auth.uid());

CREATE POLICY "Hotel can insert reservation products"
  ON reservation_products FOR INSERT
  TO authenticated
  WITH CHECK (hotel_id = auth.uid());

CREATE POLICY "Hotel can update reservation products"
  ON reservation_products FOR UPDATE
  TO authenticated
  USING (hotel_id = auth.uid())
  WITH CHECK (hotel_id = auth.uid());

CREATE POLICY "Hotel can delete reservation products"
  ON reservation_products FOR DELETE
  TO authenticated
  USING (hotel_id = auth.uid());

CREATE INDEX idx_res_products_reservation_id ON reservation_products(reservation_id);
CREATE INDEX idx_res_products_hotel_id ON reservation_products(hotel_id);
