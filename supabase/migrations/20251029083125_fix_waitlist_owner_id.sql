/*
  # Fix waitlist with owner_id support

  ## Changes
  1. Add owner_id column to waitlist table
  2. Drop and recreate new_client_waitlist view with owner_id
  3. Add index for performance

  ## Purpose
  Allows filtering waitlist by clinic owner for multi-tenant support
*/

-- Add owner_id column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'waitlist' AND column_name = 'owner_id'
  ) THEN
    ALTER TABLE waitlist ADD COLUMN owner_id uuid REFERENCES profiles(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create index for owner_id filtering
CREATE INDEX IF NOT EXISTS idx_waitlist_owner_id ON waitlist(owner_id);

-- Drop the existing view
DROP VIEW IF EXISTS public.new_client_waitlist;

-- Recreate the view with owner_id included
CREATE VIEW public.new_client_waitlist AS
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
  w.owner_id,
  w.created_at as added_at,
  w.updated_at
FROM public.waitlist w;

-- Grant access
GRANT SELECT ON public.new_client_waitlist TO anon, authenticated;

-- Add RLS
ALTER VIEW public.new_client_waitlist SET (security_invoker = true);

COMMENT ON VIEW public.new_client_waitlist IS
  'API view mapping waitlist table to expected new_client_waitlist format with owner_id for multi-tenant filtering';
