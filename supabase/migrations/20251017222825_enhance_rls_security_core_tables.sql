/*
  # Enhanced RLS Security for Core Tables
  
  ## Summary
  Strengthens Row Level Security policies on core tables to ensure proper
  authentication, role-based access control, and data isolation.
  
  ## Security Enhancements
  1. Remove overly permissive USING (true) policies
  2. Add role-based access checks with helper functions
  3. Implement patient data isolation via patient portal
  4. Secure sensitive medical and financial data
  
  ## Tables Secured
  - appointments
  - waitlist
  - contact_submissions
  - patients_full
  - soap_notes
  - billing
  - patient_portal_users
  - insurance_claims
*/

-- ============================================================================
-- SECURITY HELPER FUNCTIONS
-- ============================================================================

-- Check if current user is an admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Check if current user is practitioner or admin
CREATE OR REPLACE FUNCTION is_practitioner_or_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'practitioner')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Check if user owns patient record via patient portal
CREATE OR REPLACE FUNCTION owns_patient_record(patient_uuid uuid)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM patient_portal_users
    WHERE patient_portal_users.id = auth.uid()
    AND patient_portal_users.patient_id = patient_uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================================================
-- DROP OVERLY PERMISSIVE POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Admin full access to patients" ON patients_full;
DROP POLICY IF EXISTS "Admin full access to soap notes" ON soap_notes;
DROP POLICY IF EXISTS "Admin full access to billing" ON billing;
DROP POLICY IF EXISTS "Authenticated users can view appointments" ON appointments;
DROP POLICY IF EXISTS "Authenticated users can view waitlist" ON waitlist;
DROP POLICY IF EXISTS "Authenticated users can view contact submissions" ON contact_submissions;

-- ============================================================================
-- APPOINTMENTS - Enhanced Multi-Level Security
-- ============================================================================

CREATE POLICY "Practitioners can view all appointments"
  ON appointments FOR SELECT
  TO authenticated
  USING (is_practitioner_or_admin());

CREATE POLICY "Patients can view own appointments via portal"
  ON appointments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM patient_portal_users ppu
      INNER JOIN patients_full pf ON ppu.patient_id = pf.id
      WHERE ppu.id = auth.uid()
      AND (appointments.email = pf.email OR appointments.patient_id = pf.id)
    )
  );

CREATE POLICY "Practitioners can update appointments"
  ON appointments FOR UPDATE
  TO authenticated
  USING (is_practitioner_or_admin())
  WITH CHECK (is_practitioner_or_admin());

CREATE POLICY "Only admins can delete appointments"
  ON appointments FOR DELETE
  TO authenticated
  USING (is_admin());

-- ============================================================================
-- WAITLIST - Strict Access Control
-- ============================================================================

CREATE POLICY "Practitioners can view all waitlist entries"
  ON waitlist FOR SELECT
  TO authenticated
  USING (is_practitioner_or_admin());

CREATE POLICY "Practitioners can update waitlist"
  ON waitlist FOR UPDATE
  TO authenticated
  USING (is_practitioner_or_admin())
  WITH CHECK (is_practitioner_or_admin());

CREATE POLICY "Only admins can delete waitlist entries"
  ON waitlist FOR DELETE
  TO authenticated
  USING (is_admin());

-- ============================================================================
-- CONTACT SUBMISSIONS - Read-Only for Staff
-- ============================================================================

CREATE POLICY "Practitioners can view contact submissions"
  ON contact_submissions FOR SELECT
  TO authenticated
  USING (is_practitioner_or_admin());

-- ============================================================================
-- PATIENTS_FULL - Strict Role-Based + Patient Portal Access
-- ============================================================================

CREATE POLICY "Practitioners can view all patients"
  ON patients_full FOR SELECT
  TO authenticated
  USING (is_practitioner_or_admin());

CREATE POLICY "Patients can view own record via portal"
  ON patients_full FOR SELECT
  TO authenticated
  USING (owns_patient_record(patients_full.id));

CREATE POLICY "Practitioners can create patients"
  ON patients_full FOR INSERT
  TO authenticated
  WITH CHECK (is_practitioner_or_admin());

CREATE POLICY "Practitioners can update patients"
  ON patients_full FOR UPDATE
  TO authenticated
  USING (is_practitioner_or_admin())
  WITH CHECK (is_practitioner_or_admin());

CREATE POLICY "Only admins can delete patients"
  ON patients_full FOR DELETE
  TO authenticated
  USING (is_admin());

-- ============================================================================
-- SOAP NOTES - Medical Practitioners Only
-- ============================================================================

CREATE POLICY "Practitioners can view all soap notes"
  ON soap_notes FOR SELECT
  TO authenticated
  USING (is_practitioner_or_admin());

CREATE POLICY "Practitioners can create soap notes"
  ON soap_notes FOR INSERT
  TO authenticated
  WITH CHECK (is_practitioner_or_admin());

CREATE POLICY "Creator or admin can update soap notes"
  ON soap_notes FOR UPDATE
  TO authenticated
  USING (soap_notes.created_by = auth.uid() OR is_admin())
  WITH CHECK (soap_notes.created_by = auth.uid() OR is_admin());

CREATE POLICY "Only admins can delete soap notes"
  ON soap_notes FOR DELETE
  TO authenticated
  USING (is_admin());

-- ============================================================================
-- BILLING - Staff Manage, Patients View Own
-- ============================================================================

CREATE POLICY "Practitioners can view all billing"
  ON billing FOR SELECT
  TO authenticated
  USING (is_practitioner_or_admin());

CREATE POLICY "Patients can view own billing via portal"
  ON billing FOR SELECT
  TO authenticated
  USING (owns_patient_record(billing.patient_id));

CREATE POLICY "Practitioners can create billing"
  ON billing FOR INSERT
  TO authenticated
  WITH CHECK (is_practitioner_or_admin());

CREATE POLICY "Practitioners can update billing"
  ON billing FOR UPDATE
  TO authenticated
  USING (is_practitioner_or_admin())
  WITH CHECK (is_practitioner_or_admin());

CREATE POLICY "Only admins can delete billing"
  ON billing FOR DELETE
  TO authenticated
  USING (is_admin());

-- ============================================================================
-- INSURANCE CLAIMS - Enhanced Policies
-- ============================================================================

DROP POLICY IF EXISTS "Admins can manage all claims" ON insurance_claims;

CREATE POLICY "Practitioners can manage all claims"
  ON insurance_claims FOR ALL
  TO authenticated
  USING (is_practitioner_or_admin())
  WITH CHECK (is_practitioner_or_admin());

CREATE POLICY "Patients can view own claims"
  ON insurance_claims FOR SELECT
  TO authenticated
  USING (owns_patient_record(insurance_claims.patient_id));

-- ============================================================================
-- PATIENT PORTAL USERS - Self-Service + Admin Management
-- ============================================================================

DROP POLICY IF EXISTS "Patients can update own portal account" ON patient_portal_users;

CREATE POLICY "Patients can update own portal preferences"
  ON patient_portal_users FOR UPDATE
  TO authenticated
  USING (patient_portal_users.id = auth.uid())
  WITH CHECK (patient_portal_users.id = auth.uid());

-- ============================================================================
-- PERFORMANCE INDEXES FOR RLS
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_profiles_role_lookup 
  ON profiles(id, role) 
  WHERE role IN ('admin', 'practitioner');

CREATE INDEX IF NOT EXISTS idx_portal_users_patient_lookup 
  ON patient_portal_users(id, patient_id);

CREATE INDEX IF NOT EXISTS idx_appointments_patient_email 
  ON appointments(patient_id, email);

CREATE INDEX IF NOT EXISTS idx_billing_patient 
  ON billing(patient_id);

CREATE INDEX IF NOT EXISTS idx_soap_notes_creator 
  ON soap_notes(created_by);

-- ============================================================================
-- SECURITY DOCUMENTATION
-- ============================================================================

COMMENT ON FUNCTION is_admin() IS 
  'Security helper: Returns true if current user has admin role. Used in RLS policies.';

COMMENT ON FUNCTION is_practitioner_or_admin() IS 
  'Security helper: Returns true if current user is practitioner or admin. Primary access control function.';

COMMENT ON FUNCTION owns_patient_record(uuid) IS 
  'Security helper: Returns true if current portal user owns the specified patient record. Ensures patient data isolation.';

COMMENT ON POLICY "Practitioners can view all appointments" ON appointments IS 
  'Medical staff need full appointment visibility for clinic operations and scheduling.';

COMMENT ON POLICY "Patients can view own appointments via portal" ON appointments IS 
  'Patients access their appointments through secure portal with email or patient_id matching.';

COMMENT ON POLICY "Practitioners can view all soap notes" ON soap_notes IS 
  'SOAP notes contain medical information accessible only to licensed practitioners.';

COMMENT ON POLICY "Patients can view own billing via portal" ON billing IS 
  'Patients can view their billing for transparency while staff manages all billing operations.';
