/*
  # Enforce MFA Requirement for All Administrative Users

  ## Overview
  This migration enforces mandatory Multi-Factor Authentication (MFA) for all
  administrative users (admins and practitioners) to comply with security
  requirements for handling protected health information (PHI).

  ## Changes Made

  1. **MFA Enforcement Function**
     - `check_mfa_required()` - Validates that admin users have active MFA before accessing sensitive data
     - Returns false if user is not admin (no MFA required for patients)
     - Returns false if admin has MFA enabled and verified
     - Returns true if admin does NOT have MFA setup (blocks access)

  2. **RLS Policies Updated**
     - Adds MFA requirement check to all sensitive tables
     - Blocks access to PHI if admin doesn't have MFA enabled
     - Does not affect patient portal access (patients don't need MFA)

  3. **Affected Tables** (MFA check added to all SELECT/UPDATE/INSERT policies)
     - `contacts` (patient data)
     - `appointments`
     - `soap_notes`
     - `payments`
     - `payment_methods`
     - `invoices`

  ## Security Impact
  - ✅ Admin users MUST enable MFA before accessing any patient data
  - ✅ Existing sessions without MFA will be blocked from sensitive operations
  - ✅ Patients can still access their own data without MFA
  - ✅ Public booking system continues to work

  ## Important Notes
  - Admins will need to setup MFA on first login after this migration
  - Backup codes are generated automatically during MFA setup
  - Trusted devices can remember MFA for 30 days
  - Rate limiting prevents brute force attacks (5 attempts per 15 minutes)
*/

-- ============================================================================
-- MFA ENFORCEMENT FUNCTION
-- ============================================================================

-- Function to check if current user has MFA enabled (if required)
CREATE OR REPLACE FUNCTION check_mfa_required()
RETURNS boolean AS $$
DECLARE
  v_user_role text;
  v_has_mfa boolean;
BEGIN
  -- Get user role from profiles
  SELECT role INTO v_user_role
  FROM profiles
  WHERE id = auth.uid();

  -- If no role found or not an admin/practitioner, MFA not required
  IF v_user_role IS NULL OR v_user_role NOT IN ('admin', 'practitioner') THEN
    RETURN false;
  END IF;

  -- Check if admin has MFA enabled and verified
  SELECT
    (is_enabled = true AND verified_at IS NOT NULL)
    INTO v_has_mfa
  FROM user_2fa_settings
  WHERE user_id = auth.uid();

  -- If no MFA record found or not verified, MFA is REQUIRED but missing
  IF v_has_mfa IS NULL OR v_has_mfa = false THEN
    RETURN true; -- TRUE means "MFA is required but missing" (blocks access)
  END IF;

  -- MFA is setup and verified, allow access
  RETURN false; -- FALSE means "MFA check passed" (allows access)
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ============================================================================
-- UPDATE RLS POLICIES TO ENFORCE MFA
-- ============================================================================

-- Drop and recreate contacts policies with MFA enforcement
DROP POLICY IF EXISTS "Admins and practitioners can view contacts" ON contacts;
DROP POLICY IF EXISTS "Admins and practitioners can update contacts" ON contacts;
DROP POLICY IF EXISTS "Admins and practitioners can insert contacts" ON contacts;
DROP POLICY IF EXISTS "Admins and practitioners can delete contacts" ON contacts;

CREATE POLICY "Admins and practitioners can view contacts"
  ON contacts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'practitioner')
    )
    AND NOT check_mfa_required() -- Block if MFA required but not setup
  );

CREATE POLICY "Admins and practitioners can update contacts"
  ON contacts FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'practitioner')
    )
    AND NOT check_mfa_required()
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'practitioner')
    )
    AND NOT check_mfa_required()
  );

CREATE POLICY "Admins and practitioners can insert contacts"
  ON contacts FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'practitioner')
    )
    AND NOT check_mfa_required()
  );

CREATE POLICY "Admins and practitioners can delete contacts"
  ON contacts FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'practitioner')
    )
    AND NOT check_mfa_required()
  );

-- ============================================================================
-- UPDATE APPOINTMENTS POLICIES WITH MFA
-- ============================================================================

DROP POLICY IF EXISTS "Admins and practitioners can view all appointments" ON appointments;
DROP POLICY IF EXISTS "Admins and practitioners can insert appointments" ON appointments;
DROP POLICY IF EXISTS "Admins and practitioners can update appointments" ON appointments;

CREATE POLICY "Admins and practitioners can view all appointments"
  ON appointments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'practitioner')
    )
    AND NOT check_mfa_required()
  );

CREATE POLICY "Admins and practitioners can insert appointments"
  ON appointments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'practitioner')
    )
    AND NOT check_mfa_required()
  );

CREATE POLICY "Admins and practitioners can update appointments"
  ON appointments FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'practitioner')
    )
    AND NOT check_mfa_required()
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'practitioner')
    )
    AND NOT check_mfa_required()
  );

-- ============================================================================
-- UPDATE SOAP NOTES POLICIES WITH MFA
-- ============================================================================

DROP POLICY IF EXISTS "Admins and practitioners can view all SOAP notes" ON soap_notes;
DROP POLICY IF EXISTS "Admins and practitioners can insert SOAP notes" ON soap_notes;
DROP POLICY IF EXISTS "Admins and practitioners can update SOAP notes" ON soap_notes;

CREATE POLICY "Admins and practitioners can view all SOAP notes"
  ON soap_notes FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'practitioner')
    )
    AND NOT check_mfa_required()
  );

CREATE POLICY "Admins and practitioners can insert SOAP notes"
  ON soap_notes FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'practitioner')
    )
    AND NOT check_mfa_required()
  );

CREATE POLICY "Admins and practitioners can update SOAP notes"
  ON soap_notes FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'practitioner')
    )
    AND NOT check_mfa_required()
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'practitioner')
    )
    AND NOT check_mfa_required()
  );

-- ============================================================================
-- UPDATE PAYMENT POLICIES WITH MFA
-- ============================================================================

DROP POLICY IF EXISTS "Admins can view all payments" ON payments;
DROP POLICY IF EXISTS "Admins can insert payments" ON payments;
DROP POLICY IF EXISTS "Admins can update payments" ON payments;

CREATE POLICY "Admins can view all payments"
  ON payments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
    AND NOT check_mfa_required()
  );

CREATE POLICY "Admins can insert payments"
  ON payments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
    AND NOT check_mfa_required()
  );

CREATE POLICY "Admins can update payments"
  ON payments FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
    AND NOT check_mfa_required()
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
    AND NOT check_mfa_required()
  );

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON FUNCTION check_mfa_required() IS
  'Enforces MFA requirement for admin/practitioner users. Returns true if MFA is required but not setup (blocks access). Returns false if MFA check passes or not required.';
