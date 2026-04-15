/*
  # Align Hotel Core Tables to Application Schema

  ## Overview
  The pre-existing hotel tables were created with a different schema (enums,
  different column names, missing columns) than what the application code
  expects. All four tables are empty, so this migration safely reshapes them
  without any data loss.

  ## Changes

  ### rooms
  - Rename `room_number` → `number`
  - Convert `status` from `room_status` enum to plain text
  - Add correct CHECK constraint for status values
  - Add `type` column (Single / Double / Suite / Deluxe)
  - Add `last_cleaned` column
  - Add `assigned_staff_id` column

  ### guests
  - Add `address`, `nationality`, `last_stay`, `total_spent`, `notes`

  ### reservations
  - Convert `status` from `reservation_status` enum to plain text with CHECK
  - Drop UUID foreign keys on `guest_id` / `room_id`; convert both to text
  - Add all missing columns: guest_name, room_number, room_type, num_guests,
    payment_method, amount_paid, balance_due, special_requests, notes,
    created_by, canceled_at

  ### transactions
  - Drop UUID foreign key on `reservation_id`; convert to text

  ## Security
  No RLS changes — existing policies are kept intact.
*/

-- ─── ROOMS ────────────────────────────────────────────────────────────────────

ALTER TABLE rooms RENAME COLUMN room_number TO number;

ALTER TABLE rooms
  ALTER COLUMN status TYPE text USING status::text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'rooms' AND constraint_name = 'rooms_status_check'
  ) THEN
    ALTER TABLE rooms
      ADD CONSTRAINT rooms_status_check
      CHECK (status IN ('Available','Occupied','Dirty','Maintenance'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rooms' AND column_name = 'type'
  ) THEN
    ALTER TABLE rooms ADD COLUMN type text NOT NULL DEFAULT 'Single';
    ALTER TABLE rooms
      ADD CONSTRAINT rooms_type_check
      CHECK (type IN ('Single','Double','Suite','Deluxe'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rooms' AND column_name = 'last_cleaned'
  ) THEN
    ALTER TABLE rooms ADD COLUMN last_cleaned text DEFAULT NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rooms' AND column_name = 'assigned_staff_id'
  ) THEN
    ALTER TABLE rooms ADD COLUMN assigned_staff_id text DEFAULT NULL;
  END IF;
END $$;

-- ─── GUESTS ───────────────────────────────────────────────────────────────────

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'guests' AND column_name = 'address'
  ) THEN
    ALTER TABLE guests ADD COLUMN address text DEFAULT '';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'guests' AND column_name = 'nationality'
  ) THEN
    ALTER TABLE guests ADD COLUMN nationality text DEFAULT '';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'guests' AND column_name = 'last_stay'
  ) THEN
    ALTER TABLE guests ADD COLUMN last_stay text DEFAULT 'Never';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'guests' AND column_name = 'total_spent'
  ) THEN
    ALTER TABLE guests ADD COLUMN total_spent numeric(10,2) DEFAULT 0;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'guests' AND column_name = 'notes'
  ) THEN
    ALTER TABLE guests ADD COLUMN notes text DEFAULT '';
  END IF;
END $$;

-- ─── RESERVATIONS ─────────────────────────────────────────────────────────────

ALTER TABLE reservations
  DROP CONSTRAINT IF EXISTS reservations_guest_id_fkey;

ALTER TABLE reservations
  DROP CONSTRAINT IF EXISTS reservations_room_id_fkey;

ALTER TABLE reservations
  ALTER COLUMN guest_id TYPE text USING guest_id::text;

ALTER TABLE reservations
  ALTER COLUMN room_id TYPE text USING room_id::text;

ALTER TABLE reservations
  ALTER COLUMN status TYPE text USING status::text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'reservations' AND constraint_name = 'reservations_status_check'
  ) THEN
    ALTER TABLE reservations
      ADD CONSTRAINT reservations_status_check
      CHECK (status IN ('Confirmed','Checked In','Checked Out','Cancelled'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'reservations' AND column_name = 'guest_name'
  ) THEN
    ALTER TABLE reservations ADD COLUMN guest_name text NOT NULL DEFAULT '';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'reservations' AND column_name = 'room_number'
  ) THEN
    ALTER TABLE reservations ADD COLUMN room_number text NOT NULL DEFAULT '';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'reservations' AND column_name = 'room_type'
  ) THEN
    ALTER TABLE reservations ADD COLUMN room_type text DEFAULT '';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'reservations' AND column_name = 'num_guests'
  ) THEN
    ALTER TABLE reservations ADD COLUMN num_guests integer NOT NULL DEFAULT 1;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'reservations' AND column_name = 'payment_method'
  ) THEN
    ALTER TABLE reservations ADD COLUMN payment_method text NOT NULL DEFAULT 'Cash';
    ALTER TABLE reservations
      ADD CONSTRAINT reservations_payment_method_check
      CHECK (payment_method IN ('Cash','Card','Online'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'reservations' AND column_name = 'amount_paid'
  ) THEN
    ALTER TABLE reservations ADD COLUMN amount_paid numeric(10,2) DEFAULT 0;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'reservations' AND column_name = 'balance_due'
  ) THEN
    ALTER TABLE reservations ADD COLUMN balance_due numeric(10,2) DEFAULT 0;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'reservations' AND column_name = 'special_requests'
  ) THEN
    ALTER TABLE reservations ADD COLUMN special_requests text DEFAULT '';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'reservations' AND column_name = 'notes'
  ) THEN
    ALTER TABLE reservations ADD COLUMN notes text DEFAULT '';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'reservations' AND column_name = 'created_by'
  ) THEN
    ALTER TABLE reservations ADD COLUMN created_by text DEFAULT '';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'reservations' AND column_name = 'canceled_at'
  ) THEN
    ALTER TABLE reservations ADD COLUMN canceled_at timestamptz DEFAULT NULL;
  END IF;
END $$;

-- ─── TRANSACTIONS ─────────────────────────────────────────────────────────────

ALTER TABLE transactions
  DROP CONSTRAINT IF EXISTS transactions_reservation_id_fkey;

ALTER TABLE transactions
  ALTER COLUMN reservation_id TYPE text USING reservation_id::text;
