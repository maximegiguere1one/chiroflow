/*
  # Update appointments_api View with Auto-Payment Columns

  Adds auto_payment_enabled, auto_payment_status, completed_at, and payment_transaction_id
  to the appointments_api view for patient portal integration.
*/

DROP VIEW IF EXISTS appointments_api CASCADE;

CREATE OR REPLACE VIEW appointments_api AS
SELECT
  a.id,
  a.scheduled_at,
  a.scheduled_at::date AS scheduled_date,
  a.scheduled_at::time AS scheduled_time,
  COALESCE(a.owner_id, a.provider_id) AS owner_id,
  a.contact_id,
  a.contact_id AS patient_id,
  a.duration_minutes,
  a.status,
  a.notes,
  a.created_at,
  a.updated_at,
  a.provider_id,
  a.reschedule_count,
  a.last_rescheduled_at,
  a.reschedule_locked_until,
  a.original_scheduled_date,
  a.original_scheduled_time,
  -- Patient information
  COALESCE(a.name, c.full_name, 'Sans nom') AS name,
  COALESCE(a.email, c.email, '') AS email,
  COALESCE(a.phone, c.phone, '') AS phone,
  COALESCE(a.reason, 'Consultation') AS reason,
  -- Auto-payment columns (new)
  COALESCE(a.auto_payment_enabled, false) AS auto_payment_enabled,
  COALESCE(a.auto_payment_status, 'not_applicable') AS auto_payment_status,
  a.completed_at,
  a.payment_transaction_id
FROM appointments a
LEFT JOIN contacts c ON a.contact_id = c.id;

GRANT SELECT ON appointments_api TO authenticated;
GRANT SELECT ON appointments_api TO anon;
