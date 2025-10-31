/*
  # Create Rebooking Request Function
  
  1. New Functions
    - create_rebooking_request: Creates a rebooking request for an appointment
    - Accepts appointment_id and various parameters
    - Returns the created rebooking request
  
  2. Parameters
    - p_appointment_id: UUID of the appointment to rebook
    - p_reason: Reason for rebooking
    - p_reason_category: Category of reason
    - p_notes: Additional notes
    - p_priority: Priority level (default 0)
    - p_expires_hours: Hours until request expires (default 48)
    - p_time_slots: Preferred time slots (JSONB array)
*/

CREATE OR REPLACE FUNCTION create_rebooking_request(
  p_appointment_id UUID,
  p_reason TEXT DEFAULT NULL,
  p_reason_category TEXT DEFAULT 'other',
  p_notes TEXT DEFAULT NULL,
  p_priority INTEGER DEFAULT 0,
  p_expires_hours INTEGER DEFAULT 48,
  p_time_slots JSONB DEFAULT '[]'::jsonb
)
RETURNS TABLE (
  id UUID,
  appointment_id UUID,
  status TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_appointment_record RECORD;
  v_rebooking_id UUID;
  v_expires_at TIMESTAMPTZ;
BEGIN
  -- Get appointment details
  SELECT * INTO v_appointment_record
  FROM appointments
  WHERE appointments.id = p_appointment_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Appointment not found';
  END IF;

  -- Calculate expiration
  v_expires_at := NOW() + (p_expires_hours || ' hours')::INTERVAL;

  -- Insert rebooking request (adjust table name if different)
  INSERT INTO rebooking_requests (
    appointment_id,
    contact_id,
    reason,
    reason_category,
    notes,
    priority,
    status,
    expires_at,
    preferred_time_slots,
    created_at,
    updated_at
  )
  VALUES (
    p_appointment_id,
    v_appointment_record.contact_id,
    p_reason,
    p_reason_category,
    p_notes,
    p_priority,
    'pending',
    v_expires_at,
    p_time_slots,
    NOW(),
    NOW()
  )
  RETURNING 
    rebooking_requests.id,
    rebooking_requests.appointment_id,
    rebooking_requests.status,
    rebooking_requests.created_at
  INTO v_rebooking_id, p_appointment_id, p_reason_category, v_expires_at;

  -- Return the result
  RETURN QUERY
  SELECT 
    v_rebooking_id,
    p_appointment_id,
    'pending'::TEXT,
    NOW();
END;
$$;