/*
  # Hotel Logos Storage Setup

  ## Summary
  Creates a Supabase Storage bucket for hotel logo uploads and configures
  storage RLS policies so each hotel can only manage their own logo files.

  ## Storage
  - Bucket: `hotel-logos` (public read, authenticated write)
  - File path convention: `{user_id}/logo.{ext}`

  ## Security
  - Authenticated users can upload files under their own user ID prefix
  - Public read access for logo display
  - Users cannot overwrite other hotels' logos
*/

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'hotel-logos',
  'hotel-logos',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Hotel owners can upload their own logo"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'hotel-logos' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Hotel owners can update their own logo"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'hotel-logos' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Hotel owners can delete their own logo"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'hotel-logos' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Public can view hotel logos"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'hotel-logos');

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'hotel_users' AND column_name = 'logo_url'
  ) THEN
    ALTER TABLE hotel_users ADD COLUMN logo_url text;
  END IF;
END $$;
