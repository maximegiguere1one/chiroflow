/*
  # Update appointments_api View with Auto-Payment Columns

  1. Changes
    - Drop and recreate appointments_api view
    - Add auto_payment_enabled, auto_payment_status columns
    - Add completed_at, payment_transaction_id columns
    - Add patient_id column
    - Maintain all existing columns

  2. Reason
    - Support new auto-payment features
    - Enable appointment history with payment tracking
    - Provide complete appointment data for patient portal
*/

-- Drop existing view
DROP VIEW IF EXISTS appointments_api CASCADE;

-- Recreate with all required columns including auto-payment fields
CREATE OR REPLACE VIEW appointments_api AS
SELECT
  a.id,
  -- Use scheduled_at if exists, otherwise construct from date + time
  COALESCE(
    a.scheduled_at,
    (a.scheduled_date || ' ' || COALESCE(a.scheduled_time::text, '09:00:00'))::timestamptz
  ) AS scheduled_at,
  COALESCE(a.scheduled_date, a.scheduled_at::date) AS scheduled_date,
  COALESCE(a.scheduled_time, a.scheduled_at::time) AS scheduled_time,
  COALESCE(a.owner_id, a.provider_id) AS owner_id,
  a.contact_id,
  a.patient_id,
  a.duration_minutes,
  a.status,
  a.notes,
  a.created_at,
  a.updated_at,
  a.cancelled_at,
  a.cancellation_reason,
  a.service_type_id,
  -- Patient information from appointments or contacts
  COALESCE(a.name, c.full_name, 'Sans nom') AS name,
  COALESCE(a.email, c.email, '') AS email,
  COALESCE(a.phone, c.phone, '') AS phone,
  COALESCE(a.reason, 'Consultation') AS reason,
  -- Auto-payment columns
  COALESCE(a.auto_payment_enabled, false) AS auto_payment_enabled,
  COALESCE(a.auto_payment_status, 'not_applicable') AS auto_payment_status,
  a.completed_at,
  a.payment_transaction_id,
  -- Optional fields for backward compatibility
  NULL::text AS service_type,
  NULL::boolean AS reminder_sent,
  NULL::text AS confirmation_status,
  NULL::numeric AS no_show_risk_score,
  -- Additional useful fields
  COALESCE(a.booking_source, 'admin') AS booking_source,
  COALESCE(a.payment_status, 'pending') AS payment_status,
  a.confirmation_token,
  a.provider_id
FROM appointments a
LEFT JOIN contacts c ON a.contact_id = c.id;

-- Grant appropriate permissions
GRANT SELECT ON appointments_api TO authenticated;
GRANT SELECT ON appointments_api TO anon;
