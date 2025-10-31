/*
  # Fix Billing Foreign Key Constraint
  
  1. Changes
    - Drop old foreign key constraint pointing to patients_full
    - Add new foreign key constraint pointing to contacts
    - This allows billing to work with the contacts table
  
  2. Reason
    - billing.patient_id was referencing patients_full.id
    - The app uses contacts table, not patients_full
    - Need to align foreign key with actual data flow
*/

-- Drop old constraint
ALTER TABLE billing 
DROP CONSTRAINT IF EXISTS billing_patient_id_fkey;

-- Add new constraint pointing to contacts
ALTER TABLE billing
ADD CONSTRAINT billing_contact_id_fkey 
FOREIGN KEY (patient_id) 
REFERENCES contacts(id)
ON DELETE SET NULL;