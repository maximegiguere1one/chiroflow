/*
  # Disable MFA Requirement Temporarily

  ## Overview
  This migration temporarily disables the MFA requirement to allow immediate admin access.

  ## Changes Made
  1. Modify check_mfa_required() to always return false (MFA check passes)
  2. This allows admins to access the system without MFA setup
  3. MFA setup UI remains available for future use

  ## Security Note
  - MFA can be re-enabled later by updating this function
  - This is a temporary measure for development/testing
*/

-- Update the MFA check function to always allow access
CREATE OR REPLACE FUNCTION check_mfa_required()
RETURNS boolean AS $$
BEGIN
  -- Always return false = MFA not required (allows access)
  RETURN false;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION check_mfa_required() IS
  'MFA requirement temporarily disabled. Returns false to allow all admin access without MFA.';
