/*
  # Synchronize contacts to patients_full
  
  1. Changes
    - Create trigger function to sync contacts → patients_full
    - Trigger on INSERT and UPDATE of contacts table
    - Ensures patient portal has access to all contacts as patients
  
  2. Reason
    - App uses contacts table as primary
    - Patient portal uses patients_full
    - Need automatic synchronization between them
*/

-- Create or replace sync function
CREATE OR REPLACE FUNCTION sync_contact_to_patient_full()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert or update patient_full record
  INSERT INTO patients_full (
    id, 
    first_name, 
    last_name, 
    email, 
    phone,
    date_of_birth, 
    address, 
    notes, 
    status,
    created_at, 
    updated_at
  ) VALUES (
    NEW.id,
    SPLIT_PART(NEW.full_name, ' ', 1),
    CASE 
      WHEN array_length(string_to_array(NEW.full_name, ' '), 1) > 1 
      THEN array_to_string((string_to_array(NEW.full_name, ' '))[2:], ' ')
      ELSE ''
    END,
    NEW.email,
    NEW.phone,
    NEW.date_of_birth::date,
    NEW.address,
    NEW.notes,
    NEW.status,
    NEW.created_at,
    NEW.updated_at
  )
  ON CONFLICT (id) DO UPDATE SET
    first_name = SPLIT_PART(NEW.full_name, ' ', 1),
    last_name = CASE 
      WHEN array_length(string_to_array(NEW.full_name, ' '), 1) > 1 
      THEN array_to_string((string_to_array(NEW.full_name, ' '))[2:], ' ')
      ELSE ''
    END,
    email = NEW.email,
    phone = NEW.phone,
    date_of_birth = NEW.date_of_birth::date,
    address = NEW.address,
    notes = NEW.notes,
    status = NEW.status,
    updated_at = NEW.updated_at;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS sync_contact_to_patient_trigger ON contacts;

-- Create trigger
CREATE TRIGGER sync_contact_to_patient_trigger
AFTER INSERT OR UPDATE ON contacts
FOR EACH ROW
EXECUTE FUNCTION sync_contact_to_patient_full();

-- Sync existing contacts to patients_full
INSERT INTO patients_full (
  id, first_name, last_name, email, phone,
  date_of_birth, address, notes, status,
  created_at, updated_at
)
SELECT 
  c.id,
  SPLIT_PART(c.full_name, ' ', 1) as first_name,
  CASE 
    WHEN array_length(string_to_array(c.full_name, ' '), 1) > 1 
    THEN array_to_string((string_to_array(c.full_name, ' '))[2:], ' ')
    ELSE ''
  END as last_name,
  c.email,
  c.phone,
  c.date_of_birth::date,
  c.address,
  c.notes,
  c.status,
  c.created_at,
  c.updated_at
FROM contacts c
WHERE c.id NOT IN (SELECT id FROM patients_full);