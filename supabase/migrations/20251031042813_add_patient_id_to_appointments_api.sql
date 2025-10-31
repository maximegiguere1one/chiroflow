/*
  # Add patient_id alias to appointments_api view
  
  1. Changes
    - Drop and recreate appointments_api view
    - Add patient_id as alias for contact_id
    - This allows patient portal to query by patient_id
  
  2. Reason
    - PatientAppointments component queries by patient_id
    - View only had contact_id
    - Adding alias maintains compatibility with both naming conventions
*/

-- Drop existing view
DROP VIEW IF EXISTS appointments_api CASCADE;

-- Recreate with patient_id alias
CREATE VIEW appointments_api AS
SELECT 
  a.id,
  a.scheduled_at,
  a.scheduled_at::date AS scheduled_date,
  a.scheduled_at::time AS scheduled_time,
  COALESCE(a.owner_id, a.provider_id) AS owner_id,
  a.contact_id,
  a.contact_id AS patient_id,  -- Alias for patient portal compatibility
  a.duration_minutes,
  a.status,
  a.notes,
  a.created_at,
  a.updated_at,
  -- Patient information
  COALESCE(a.name, c.full_name, 'Sans nom') AS name,
  COALESCE(a.email, c.email, '') AS email,
  COALESCE(a.phone, c.phone, '') AS phone,
  COALESCE(a.reason, 'Consultation') AS reason,
  -- Optional fields
  NULL::text AS service_type,
  NULL::boolean AS reminder_sent,
  NULL::text AS confirmation_status,
  NULL::numeric AS no_show_risk_score
FROM appointments a
LEFT JOIN contacts c ON a.contact_id = c.id;