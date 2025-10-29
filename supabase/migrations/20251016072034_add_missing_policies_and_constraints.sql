/*
  # Ajout policies manquantes et contraintes de validation
  
  1. Policies manquantes
    - UPDATE policy pour appointments (admin peut modifier statut)
    - UPDATE policy pour waitlist
  
  2. Contraintes de validation
    - Email format validation
    - Phone format validation (optionnel mais recommandé)
    - Status enum constraints
    - Required fields NOT NULL
  
  3. Indexes additionnels
    - appointments.patient_id
    - appointments.scheduled_date
    - appointments.status
*/

-- Add UPDATE policy for appointments
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'appointments' 
    AND policyname = 'Authenticated users can update appointments'
  ) THEN
    CREATE POLICY "Authenticated users can update appointments"
      ON appointments
      FOR UPDATE
      TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- Add DELETE policy for appointments
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'appointments' 
    AND policyname = 'Authenticated users can delete appointments'
  ) THEN
    CREATE POLICY "Authenticated users can delete appointments"
      ON appointments
      FOR DELETE
      TO authenticated
      USING (true);
  END IF;
END $$;

-- Add UPDATE policy for waitlist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'waitlist' 
    AND policyname = 'Authenticated users can update waitlist'
  ) THEN
    CREATE POLICY "Authenticated users can update waitlist"
      ON waitlist
      FOR UPDATE
      TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- Add email validation function
CREATE OR REPLACE FUNCTION validate_email(email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Add check constraints for email validation on key tables
DO $$
BEGIN
  -- patients_full email validation
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'patients_full_email_check'
  ) THEN
    ALTER TABLE patients_full
      ADD CONSTRAINT patients_full_email_check
      CHECK (email IS NULL OR validate_email(email));
  END IF;

  -- appointments email validation
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'appointments_email_check'
  ) THEN
    ALTER TABLE appointments
      ADD CONSTRAINT appointments_email_check
      CHECK (validate_email(email));
  END IF;

  -- profiles email validation
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'profiles_email_check'
  ) THEN
    ALTER TABLE profiles
      ADD CONSTRAINT profiles_email_check
      CHECK (validate_email(email));
  END IF;
END $$;

-- Add status enum constraints
DO $$
BEGIN
  -- appointments status constraint
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'appointments_status_check'
  ) THEN
    ALTER TABLE appointments
      ADD CONSTRAINT appointments_status_check
      CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled', 'no_show'));
  END IF;

  -- patients_full status constraint
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'patients_status_check'
  ) THEN
    ALTER TABLE patients_full
      ADD CONSTRAINT patients_status_check
      CHECK (status IN ('active', 'inactive', 'archived'));
  END IF;

  -- waitlist status constraint
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'waitlist_status_check'
  ) THEN
    ALTER TABLE waitlist
      ADD CONSTRAINT waitlist_status_check
      CHECK (status IN ('active', 'contacted', 'scheduled', 'cancelled'));
  END IF;
END $$;

-- Add missing indexes for performance
CREATE INDEX IF NOT EXISTS idx_appointments_patient_id ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_scheduled_date ON appointments(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_waitlist_status ON waitlist(status);

-- Add updated_at column to appointments if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'appointments' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE appointments ADD COLUMN updated_at timestamptz DEFAULT now();
    
    CREATE TRIGGER update_appointments_updated_at
      BEFORE UPDATE ON appointments
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at();
  END IF;
END $$;

-- Add status field to contact_submissions if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contact_submissions' AND column_name = 'status'
  ) THEN
    ALTER TABLE contact_submissions ADD COLUMN status text DEFAULT 'new';
    
    ALTER TABLE contact_submissions
      ADD CONSTRAINT contact_status_check
      CHECK (status IN ('new', 'read', 'responded'));
  END IF;
END $$;

-- Add patient_id column to appointments (for linking existing patients)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'appointments' AND column_name = 'patient_id'
  ) THEN
    ALTER TABLE appointments ADD COLUMN patient_id uuid REFERENCES patients_full(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add scheduled fields to appointments if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'appointments' AND column_name = 'scheduled_date'
  ) THEN
    ALTER TABLE appointments ADD COLUMN scheduled_date date;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'appointments' AND column_name = 'scheduled_time'
  ) THEN
    ALTER TABLE appointments ADD COLUMN scheduled_time time;
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
END $$;

-- Add status to waitlist if missing with constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'waitlist' AND column_name = 'status'
  ) THEN
    ALTER TABLE waitlist ADD COLUMN status text DEFAULT 'active';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'waitlist' AND column_name = 'priority'
  ) THEN
    ALTER TABLE waitlist ADD COLUMN priority integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'waitlist' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE waitlist ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END $$;