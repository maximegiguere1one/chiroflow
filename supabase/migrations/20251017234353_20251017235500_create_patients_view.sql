/*
  # Create Patients View Alias

  ## Purpose
  Creates a simple view alias 'patients' that points to 'patients_full'
  to simplify queries and maintain backward compatibility.

  ## Changes
  - Creates 'patients' view as alias to 'patients_full'
  - Enables RLS on the view
  - Inherits all columns from patients_full

  ## Security
  - RLS enabled with same policies as patients_full
  - Admin and practitioner access only
*/

-- Create patients view as alias to patients_full
CREATE OR REPLACE VIEW patients AS
SELECT * FROM patients_full;

-- Enable RLS on view
ALTER VIEW patients SET (security_invoker = true);

COMMENT ON VIEW patients IS
  'View alias for patients_full table for simplified querying';
