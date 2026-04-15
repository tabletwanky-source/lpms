/*
  # Auto Billing: Daily Room Charge Cron Job

  ## Overview
  Sets up an automated nightly billing system that adds one room-night charge
  transaction for every checked-in reservation, keeping bills accurate without
  manual intervention.

  ## Changes

  ### New Function: `add_daily_room_charges()`
  - Runs with SECURITY DEFINER (bypasses RLS safely for server-side billing)
  - For each reservation with status = 'Checked In' that hasn't expired
  - Looks up the room price from the rooms table
  - Inserts one 'Room' transaction per reservation per day
  - Skips if a room charge was already added today (idempotent)

  ### New Table Column
  - No schema changes needed — uses existing `transactions` table

  ### Scheduled Job
  - Cron expression: `0 0 * * *` = every day at midnight UTC
  - Job name: `daily-room-charges`

  ## Security
  - Function is SECURITY DEFINER so it can write across hotel_id boundaries
    (needed for the cron context which has no authenticated user)
  - pg_cron is a trusted Postgres extension

  ## Notes
  - Idempotent: will not double-charge the same reservation on the same day
  - Falls back to 0 if room price can't be found (safe default)
*/

CREATE EXTENSION IF NOT EXISTS pg_cron;

CREATE OR REPLACE FUNCTION add_daily_room_charges()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO transactions (
    hotel_id,
    reservation_id,
    guest_name,
    type,
    description,
    amount,
    date,
    status
  )
  SELECT
    r.hotel_id,
    r.id,
    r.guest_name,
    'Room',
    'Room Night Charge - ' || r.room_number,
    COALESCE(rm.price, 0),
    NOW(),
    'Pending'
  FROM reservations r
  LEFT JOIN rooms rm
    ON rm.number = r.room_number
    AND rm.hotel_id = r.hotel_id
  WHERE r.status = 'Checked In'
    AND r.check_out > CURRENT_DATE
    AND NOT EXISTS (
      SELECT 1
      FROM transactions t
      WHERE t.reservation_id = r.id
        AND t.type = 'Room'
        AND DATE(t.date) = CURRENT_DATE
        AND t.hotel_id = r.hotel_id
    );
END;
$$;

SELECT cron.schedule(
  'daily-room-charges',
  '0 0 * * *',
  'SELECT add_daily_room_charges()'
);
