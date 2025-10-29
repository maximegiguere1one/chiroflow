/*
  # Add Scheduling Columns to Appointments

  ## Overview
  Adds proper scheduling columns to the appointments table to support
  calendar and appointment management features.

  ## Changes Made
  1. Add scheduled_at column (timestamptz) - the actual appointment date/time
  2. Add contact_id column to link appointments to contacts table
  3. Add provider_id column for multi-practitioner support
  4. Add duration_minutes column for appointment duration
  5. Add notes column for internal notes
  6. Add indexes for performance

  ## Migration Notes
  - Uses IF NOT EXISTS to prevent errors if columns already exist
  - Sets default values where appropriate
  - Adds foreign key constraints for data integrity
*/

-- Add scheduling columns if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'appointments' AND column_name = 'scheduled_at'
  ) THEN
    ALTER TABLE appointments ADD COLUMN scheduled_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'appointments' AND column_name = 'contact_id'
  ) THEN
    ALTER TABLE appointments ADD COLUMN contact_id uuid REFERENCES contacts(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'appointments' AND column_name = 'provider_id'
  ) THEN
    ALTER TABLE appointments ADD COLUMN provider_id uuid REFERENCES profiles(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'appointments' AND column_name = 'duration_minutes'
  ) THEN
    ALTER TABLE appointments ADD COLUMN duration_minutes integer DEFAULT 30;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'appointments' AND column_name = 'notes'
  ) THEN
    ALTER TABLE appointments ADD COLUMN notes text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'appointments' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE appointments ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_appointments_scheduled_at ON appointments(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_appointments_contact_id ON appointments(contact_id);
CREATE INDEX IF NOT EXISTS idx_appointments_provider_id ON appointments(provider_id);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);

-- Create a view that provides scheduled_date and scheduled_time for backward compatibility
CREATE OR REPLACE VIEW appointments_with_date_time AS
SELECT
  a.*,
  (a.scheduled_at AT TIME ZONE 'America/Toronto')::date as scheduled_date,
  (a.scheduled_at AT TIME ZONE 'America/Toronto')::time as scheduled_time
FROM appointments a;

-- Grant access to the view
GRANT SELECT ON appointments_with_date_time TO anon, authenticated;

COMMENT ON VIEW appointments_with_date_time IS
  'Provides backward compatibility by splitting scheduled_at into scheduled_date and scheduled_time';
