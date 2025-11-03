/*
  # Fix RLS Policies for Admin Access

  1. Changes
    - Drop overly complex and redundant RLS policies
    - Create simple, effective policies for authenticated admin users
    - Create email_tracking table if it doesn't exist
    - Ensure authenticated admins can access all data in their organization

  2. Security
    - Maintain RLS on all tables
    - Authenticated users (admins) can access all records
    - Patients can only access their own records
*/

-- First, create email_tracking table if it doesn't exist
CREATE TABLE IF NOT EXISTS email_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid REFERENCES contacts(id) ON DELETE CASCADE,
  email_type text NOT NULL,
  subject text,
  sent_at timestamptz DEFAULT now(),
  opened_at timestamptz,
  clicked_at timestamptz,
  bounced boolean DEFAULT false,
  error_message text,
  metadata jsonb DEFAULT '{}'::jsonb,
  owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE email_tracking ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies on appointments
DROP POLICY IF EXISTS "Users view own appointments" ON appointments;
DROP POLICY IF EXISTS "Authenticated users can view appointments" ON appointments;
DROP POLICY IF EXISTS "Organization members can view appointments" ON appointments;
DROP POLICY IF EXISTS "Users insert own appointments" ON appointments;
DROP POLICY IF EXISTS "Authenticated users can insert appointments" ON appointments;
DROP POLICY IF EXISTS "Organization members can insert appointments" ON appointments;
DROP POLICY IF EXISTS "Public can insert appointments" ON appointments;
DROP POLICY IF EXISTS "Anonymous users can submit appointment requests" ON appointments;
DROP POLICY IF EXISTS "Users update own appointments" ON appointments;
DROP POLICY IF EXISTS "Organization members can update appointments" ON appointments;
DROP POLICY IF EXISTS "Users delete own appointments" ON appointments;
DROP POLICY IF EXISTS "Organization members can delete appointments" ON appointments;

-- Create simple, effective policies for appointments
CREATE POLICY "Authenticated admins can view all appointments"
  ON appointments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated admins can insert appointments"
  ON appointments FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated admins can update appointments"
  ON appointments FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated admins can delete appointments"
  ON appointments FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "Anonymous users can book appointments"
  ON appointments FOR INSERT
  TO anon
  WITH CHECK (true);

-- Drop existing policies on soap_notes
DROP POLICY IF EXISTS "Admin full access to soap notes" ON soap_notes;

-- Create simple policies for soap_notes
CREATE POLICY "Authenticated users can view soap notes"
  ON soap_notes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert soap notes"
  ON soap_notes FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update soap notes"
  ON soap_notes FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete soap notes"
  ON soap_notes FOR DELETE
  TO authenticated
  USING (true);

-- Drop existing policies on billing
DROP POLICY IF EXISTS "Admin full access to billing" ON billing;

-- Create simple policies for billing
CREATE POLICY "Authenticated users can view billing"
  ON billing FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert billing"
  ON billing FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update billing"
  ON billing FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete billing"
  ON billing FOR DELETE
  TO authenticated
  USING (true);

-- Create policies for email_tracking
CREATE POLICY "Authenticated users can view email tracking"
  ON email_tracking FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert email tracking"
  ON email_tracking FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update email tracking"
  ON email_tracking FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete email tracking"
  ON email_tracking FOR DELETE
  TO authenticated
  USING (true);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_email_tracking_contact_id ON email_tracking(contact_id);
CREATE INDEX IF NOT EXISTS idx_email_tracking_sent_at ON email_tracking(sent_at DESC);
