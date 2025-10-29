/*
  # Fix Appointments Insert Policy

  1. Changes
    - Add INSERT policy for authenticated users on appointments table
    - Allow authenticated users to create appointments
  
  2. Security
    - Authenticated users can insert appointments
    - Maintains existing policies for SELECT, UPDATE, DELETE
*/

-- Drop existing anon insert policy and create a better one for authenticated users
DROP POLICY IF EXISTS "Anyone can submit appointment requests" ON appointments;

-- Allow authenticated users to insert appointments
CREATE POLICY "Authenticated users can insert appointments"
  ON appointments
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Also allow anonymous users to submit appointment requests (for public form)
CREATE POLICY "Anonymous users can submit appointment requests"
  ON appointments
  FOR INSERT
  TO anon
  WITH CHECK (true);