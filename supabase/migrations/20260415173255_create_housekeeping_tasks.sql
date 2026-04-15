/*
  # Create housekeeping_tasks table

  1. New Tables
    - `housekeeping_tasks`
      - `id` (uuid, primary key)
      - `hotel_id` (uuid, references auth.users — the hotel that owns this task)
      - `room_number` (text — room identifier)
      - `employee_name` (text — staff member assigned)
      - `task` (text — 'cleaning' | 'maintenance' | 'inspection' | 'turndown')
      - `status` (text — 'pending' | 'in_progress' | 'completed', default 'pending')
      - `notes` (text — optional notes)
      - `assigned_at` (timestamptz, default now())
      - `completed_at` (timestamptz — set when status becomes completed)

  2. Security
    - Enable RLS
    - Hotel can SELECT their own tasks
    - Hotel can INSERT tasks
    - Hotel can UPDATE their own tasks
    - Hotel can DELETE their own tasks
*/

CREATE TABLE IF NOT EXISTS housekeeping_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id uuid REFERENCES auth.users(id) NOT NULL,
  room_number text NOT NULL,
  employee_name text NOT NULL DEFAULT '',
  task text NOT NULL DEFAULT 'cleaning' CHECK (task IN ('cleaning', 'maintenance', 'inspection', 'turndown')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  notes text NOT NULL DEFAULT '',
  assigned_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

ALTER TABLE housekeeping_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Hotel can view own housekeeping tasks"
  ON housekeeping_tasks FOR SELECT
  TO authenticated
  USING (hotel_id = auth.uid());

CREATE POLICY "Hotel can insert housekeeping tasks"
  ON housekeeping_tasks FOR INSERT
  TO authenticated
  WITH CHECK (hotel_id = auth.uid());

CREATE POLICY "Hotel can update own housekeeping tasks"
  ON housekeeping_tasks FOR UPDATE
  TO authenticated
  USING (hotel_id = auth.uid())
  WITH CHECK (hotel_id = auth.uid());

CREATE POLICY "Hotel can delete own housekeeping tasks"
  ON housekeeping_tasks FOR DELETE
  TO authenticated
  USING (hotel_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_housekeeping_tasks_hotel ON housekeeping_tasks(hotel_id);
CREATE INDEX IF NOT EXISTS idx_housekeeping_tasks_status ON housekeeping_tasks(hotel_id, status);
