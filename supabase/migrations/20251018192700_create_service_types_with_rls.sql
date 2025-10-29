/*
  # Create service_types table with RLS

  1. New Tables
    - `service_types`
      - `id` (uuid, primary key)
      - `owner_id` (uuid, references auth.users)
      - `name` (text, required)
      - `description` (text, optional)
      - `duration_minutes` (integer, optional)
      - `price` (numeric, required)
      - `is_active` (boolean, default true)
      - `allow_online_booking` (boolean, default true)
      - `requires_deposit` (boolean, default false)
      - `deposit_amount` (numeric, default 0)
      - `category` (text, optional)
      - `color` (text, optional)
      - `display_order` (integer, optional)
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())

  2. Security
    - Enable RLS on `service_types` table
    - Add policy for authenticated users to read their own service types
    - Add policy for authenticated users to insert their own service types
    - Add policy for authenticated users to update their own service types
    - Add policy for authenticated users to delete their own service types
*/

-- Create service_types table if not exists
CREATE TABLE IF NOT EXISTS service_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  duration_minutes integer DEFAULT 30,
  price numeric NOT NULL DEFAULT 0,
  is_active boolean DEFAULT true,
  allow_online_booking boolean DEFAULT true,
  requires_deposit boolean DEFAULT false,
  deposit_amount numeric DEFAULT 0,
  category text,
  color text DEFAULT '#C9A55C',
  display_order integer,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE service_types ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can read own service types" ON service_types;
DROP POLICY IF EXISTS "Users can insert own service types" ON service_types;
DROP POLICY IF EXISTS "Users can update own service types" ON service_types;
DROP POLICY IF EXISTS "Users can delete own service types" ON service_types;

-- Create policies for authenticated users
CREATE POLICY "Users can read own service types"
  ON service_types
  FOR SELECT
  TO authenticated
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert own service types"
  ON service_types
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update own service types"
  ON service_types
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can delete own service types"
  ON service_types
  FOR DELETE
  TO authenticated
  USING (auth.uid() = owner_id);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_service_types_owner_id ON service_types(owner_id);
CREATE INDEX IF NOT EXISTS idx_service_types_is_active ON service_types(is_active);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_service_types_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS service_types_updated_at ON service_types;
CREATE TRIGGER service_types_updated_at
  BEFORE UPDATE ON service_types
  FOR EACH ROW
  EXECUTE FUNCTION update_service_types_updated_at();
