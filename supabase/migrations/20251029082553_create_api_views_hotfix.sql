/*
  # Create API Views for Frontend Compatibility - Hotfix

  ## Overview
  Creates API views that maintain backward compatibility with existing frontend code.
  Maps actual database columns to expected API column names.

  ## New Views
  1. appointments_api - Adds scheduled_date/scheduled_time from scheduled_at
  2. new_client_waitlist - Maps waitlist table to expected API format
  3. rebooking_requests table - Creates missing table

  ## No Frontend Changes Required
  Frontend can continue using scheduled_date, scheduled_time, and expected table names.
*/

-- ============================================================================
-- 1. APPOINTMENTS API VIEW
-- ============================================================================

CREATE OR REPLACE VIEW public.appointments_api AS
SELECT
  a.id,
  a.name,
  a.email,
  a.phone,
  a.reason,
  a.patient_age,
  a.preferred_time,
  a.status,
  a.contact_id,
  a.provider_id,
  a.duration_minutes,
  a.notes,
  a.created_at,
  a.updated_at,
  a.scheduled_at,
  (a.scheduled_at AT TIME ZONE 'America/Toronto')::date as scheduled_date,
  (a.scheduled_at AT TIME ZONE 'America/Toronto')::time as scheduled_time
FROM public.appointments a;

GRANT SELECT ON public.appointments_api TO anon, authenticated;

COMMENT ON VIEW public.appointments_api IS
  'API view exposing appointments with backward-compatible scheduled_date and scheduled_time columns';

-- ============================================================================
-- 2. NEW CLIENT WAITLIST VIEW
-- ============================================================================

CREATE OR REPLACE VIEW public.new_client_waitlist AS
SELECT
  w.id,
  w.name as full_name,
  w.email,
  w.phone,
  w.reason,
  COALESCE(w.priority, 0) as priority,
  COALESCE(w.status, 'active') as status,
  w.patient_age,
  w.preferred_time,
  w.preferred_days_of_week,
  w.preferred_time_ranges,
  w.max_wait_days,
  w.notification_preferences,
  w.auto_accept_enabled,
  w.consent_automated_notifications,
  w.notified,
  w.invitation_count,
  w.last_invitation_sent_at,
  w.unsubscribed_at,
  w.created_at as added_at,
  w.updated_at
FROM public.waitlist w;

GRANT SELECT ON public.new_client_waitlist TO anon, authenticated;

COMMENT ON VIEW public.new_client_waitlist IS
  'API view mapping waitlist table to expected new_client_waitlist format';

-- ============================================================================
-- 3. REBOOKING REQUESTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.rebooking_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid REFERENCES appointments(id) ON DELETE CASCADE,
  contact_id uuid REFERENCES contacts(id) ON DELETE SET NULL,
  reason text,
  preferred_dates jsonb DEFAULT '[]'::jsonb,
  status text DEFAULT 'pending',
  notes text,
  email_sent_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_rebook_status CHECK (
    status IN ('pending', 'contacted', 'scheduled', 'cancelled')
  )
);

-- Enable RLS
ALTER TABLE public.rebooking_requests ENABLE ROW LEVEL SECURITY;

-- Policies for rebooking_requests
DROP POLICY IF EXISTS "Admins can view rebooking requests" ON public.rebooking_requests;
CREATE POLICY "Admins can view rebooking requests"
  ON public.rebooking_requests FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'practitioner')
    )
  );

DROP POLICY IF EXISTS "Admins can manage rebooking requests" ON public.rebooking_requests;
CREATE POLICY "Admins can manage rebooking requests"
  ON public.rebooking_requests FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'practitioner')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'practitioner')
    )
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON public.rebooking_requests TO anon, authenticated;

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_rebooking_appointment ON public.rebooking_requests(appointment_id);
CREATE INDEX IF NOT EXISTS idx_rebooking_contact ON public.rebooking_requests(contact_id);
CREATE INDEX IF NOT EXISTS idx_rebooking_status ON public.rebooking_requests(status);
CREATE INDEX IF NOT EXISTS idx_rebooking_created ON public.rebooking_requests(created_at DESC);

COMMENT ON TABLE public.rebooking_requests IS
  'Stores rebooking requests from patients wanting to reschedule appointments';
