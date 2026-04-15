/*
  # Super Admin Tables

  ## New Tables

  ### 1. `promo_codes`
  - `id` (uuid, primary key)
  - `code` (text, unique) — the promo string e.g. "HOTEL50"
  - `discount` (numeric) — amount of discount
  - `type` (text) — 'percentage' | 'fixed'
  - `expires_at` (timestamptz, nullable) — optional expiry
  - `max_uses` (integer, nullable) — 0 = unlimited
  - `used_count` (integer) — how many times applied
  - `is_active` (boolean)
  - `created_at` (timestamptz)

  ### 2. `system_settings`
  - `key` (text, primary key)
  - `value` (text)
  - `updated_at` (timestamptz)

  ### 3. `global_notifications`
  - `id` (uuid, primary key)
  - `title` (text)
  - `message` (text)
  - `sent_at` (timestamptz)

  ## Security
  - promo_codes: super admin only (managed via edge function with service role)
  - system_settings: super admin only
  - global_notifications: super admin only (insert), authenticated can read
*/

-- ==============================
-- PROMO CODES
-- ==============================
CREATE TABLE IF NOT EXISTS promo_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  discount numeric(10,2) NOT NULL DEFAULT 0,
  type text NOT NULL DEFAULT 'percentage' CHECK (type IN ('percentage', 'fixed')),
  expires_at timestamptz,
  max_uses integer DEFAULT 0,
  used_count integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read active promo codes"
  ON promo_codes FOR SELECT
  TO authenticated
  USING (is_active = true);

-- ==============================
-- SYSTEM SETTINGS
-- ==============================
CREATE TABLE IF NOT EXISTS system_settings (
  key text PRIMARY KEY,
  value text NOT NULL DEFAULT '',
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read system settings"
  ON system_settings FOR SELECT
  TO authenticated
  USING (true);

INSERT INTO system_settings (key, value) VALUES
  ('registration_open', 'true'),
  ('maintenance_mode', 'false'),
  ('app_name', 'LUMINA')
ON CONFLICT (key) DO NOTHING;

-- ==============================
-- GLOBAL NOTIFICATIONS
-- ==============================
CREATE TABLE IF NOT EXISTS global_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT '',
  message text NOT NULL DEFAULT '',
  sent_at timestamptz DEFAULT now()
);

ALTER TABLE global_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read notifications"
  ON global_notifications FOR SELECT
  TO authenticated
  USING (true);

-- ==============================
-- PROMO CODE REDEMPTIONS (track who used what)
-- ==============================
CREATE TABLE IF NOT EXISTS promo_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  promo_id uuid NOT NULL REFERENCES promo_codes(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  redeemed_at timestamptz DEFAULT now(),
  UNIQUE(promo_id, user_id)
);

ALTER TABLE promo_redemptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own redemptions"
  ON promo_redemptions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own redemptions"
  ON promo_redemptions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS promo_codes_code_idx ON promo_codes(code);
CREATE INDEX IF NOT EXISTS global_notifications_sent_at_idx ON global_notifications(sent_at DESC);
