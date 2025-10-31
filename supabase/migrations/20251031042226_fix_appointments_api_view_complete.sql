/*
  # Fix appointments_api View - Add Missing Columns
  
  1. Changes
    - Drop and recreate appointments_api view
    - Add all required columns: name, email, phone, reason
    - Join with contacts to get patient information
    - Ensure owner_id is properly set
  
  2. Reason
    - Current view missing critical columns
    - Frontend needs patient name, email, phone
    - owner_id was null, causing RLS issues
*/

-- Drop existing view
DROP VIEW IF EXISTS appointments_api;

-- Recreate with all required columns
CREATE VIEW appointments_api AS
SELECT 
  a.id,
  a.scheduled_at,
  a.scheduled_at::date AS scheduled_date,
  a.scheduled_at::time AS scheduled_time,
  COALESCE(a.owner_id, a.provider_id) AS owner_id,
  a.contact_id,
  a.duration_minutes,
  a.status,
  a.notes,
  a.created_at,
  a.updated_at,
  -- Patient information from appointments or contacts
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