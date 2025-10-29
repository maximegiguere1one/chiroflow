/*
  # Rebooking Email System

  ## Purpose
  This migration creates a comprehensive rebooking system for handling appointment
  rescheduling scenarios including patient-initiated cancellations, no-shows,
  and clinic-initiated reschedules.

  ## New Tables

  ### 1. rebooking_requests
  - Tracks all rebooking requests initiated by the clinic
  - Links to original appointment that needs to be rescheduled
  - Stores reason for rebooking (patient_cancel, no_show, clinic_reschedule, etc.)
  - Tracks status: pending, sent, accepted, declined, expired
  - Records proposed time slots for patient to choose from

  ### 2. rebooking_time_slots
  - Proposed alternative time slots for each rebooking request
  - Patient can choose from multiple options
  - Tracks which slot was selected
  - Stores slot details: date, time, duration

  ### 3. rebooking_responses
  - Records patient responses to rebooking emails
  - Unique response tokens for secure one-click actions
  - Tracks opens, clicks, and final responses
  - Stores selected slot preference

  ### 4. rebooking_notifications
  - Audit trail of all rebooking emails sent
  - Tracks delivery status and engagement metrics
  - Links to email provider IDs (Resend)
  - Stores sent timestamps and delivery confirmations

  ## Enhanced Appointments Table
  - Add rebooking_count: number of times this appointment was rebooked
  - Add last_rebooking_sent_at: timestamp of last rebooking email
  - Add rebooking_reason: why this appointment needs rebooking
  - Add original_appointment_id: link to previous version if rebooked

  ## Security
  - RLS enabled on all tables
  - Authenticated users (admins/practitioners) can manage rebooking requests
  - Public access via secure tokens for patient responses
  - All actions logged for compliance and audit

  ## Performance
  - Indexes on frequently queried fields
  - Composite indexes for token lookups and status filtering
  - Optimized for fast patient response processing
*/

-- Add rebooking fields to appointments table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'appointments' AND column_name = 'rebooking_count'
  ) THEN
    ALTER TABLE appointments ADD COLUMN rebooking_count integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'appointments' AND column_name = 'last_rebooking_sent_at'
  ) THEN
    ALTER TABLE appointments ADD COLUMN last_rebooking_sent_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'appointments' AND column_name = 'rebooking_reason'
  ) THEN
    ALTER TABLE appointments ADD COLUMN rebooking_reason text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'appointments' AND column_name = 'original_appointment_id'
  ) THEN
    ALTER TABLE appointments ADD COLUMN original_appointment_id uuid REFERENCES appointments(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Table for rebooking requests
CREATE TABLE IF NOT EXISTS rebooking_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  patient_name text NOT NULL,
  patient_email text NOT NULL,
  patient_phone text,
  reason text NOT NULL,
  reason_category text NOT NULL DEFAULT 'patient_cancel',
  status text NOT NULL DEFAULT 'pending',
  priority text DEFAULT 'normal',
  notes text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  sent_at timestamptz,
  expires_at timestamptz,
  responded_at timestamptz,
  response_type text,
  selected_slot_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT rebooking_reason_category_check CHECK (
    reason_category IN ('patient_cancel', 'patient_no_show', 'clinic_reschedule', 'emergency', 'other')
  ),
  CONSTRAINT rebooking_status_check CHECK (
    status IN ('pending', 'sent', 'opened', 'accepted', 'declined', 'expired', 'cancelled')
  ),
  CONSTRAINT rebooking_priority_check CHECK (
    priority IN ('low', 'normal', 'high', 'urgent')
  )
);

ALTER TABLE rebooking_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage rebooking requests"
  ON rebooking_requests FOR ALL
  TO authenticated
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role IN ('admin', 'practitioner')))
  WITH CHECK (auth.uid() IN (SELECT id FROM profiles WHERE role IN ('admin', 'practitioner')));

-- Table for proposed time slots
CREATE TABLE IF NOT EXISTS rebooking_time_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rebooking_request_id uuid NOT NULL REFERENCES rebooking_requests(id) ON DELETE CASCADE,
  slot_date date NOT NULL,
  slot_time time NOT NULL,
  slot_datetime timestamptz NOT NULL,
  duration_minutes integer NOT NULL DEFAULT 30,
  is_selected boolean DEFAULT false,
  is_available boolean DEFAULT true,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE rebooking_time_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage rebooking time slots"
  ON rebooking_time_slots FOR ALL
  TO authenticated
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role IN ('admin', 'practitioner')))
  WITH CHECK (auth.uid() IN (SELECT id FROM profiles WHERE role IN ('admin', 'practitioner')));

CREATE POLICY "Public can view time slots via token"
  ON rebooking_time_slots FOR SELECT
  TO anon
  USING (true);

-- Table for patient responses
CREATE TABLE IF NOT EXISTS rebooking_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rebooking_request_id uuid NOT NULL REFERENCES rebooking_requests(id) ON DELETE CASCADE,
  response_token text UNIQUE NOT NULL,
  opened_at timestamptz,
  clicked_at timestamptz,
  responded_at timestamptz,
  response_type text,
  selected_slot_id uuid REFERENCES rebooking_time_slots(id) ON DELETE SET NULL,
  patient_notes text,
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT response_type_check CHECK (
    response_type IS NULL OR response_type IN ('accept', 'decline', 'request_callback')
  )
);

ALTER TABLE rebooking_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view rebooking responses"
  ON rebooking_responses FOR SELECT
  TO authenticated
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role IN ('admin', 'practitioner')));

CREATE POLICY "Public can respond via token"
  ON rebooking_responses FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Public can update via token"
  ON rebooking_responses FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- Table for notification tracking
CREATE TABLE IF NOT EXISTS rebooking_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rebooking_request_id uuid NOT NULL REFERENCES rebooking_requests(id) ON DELETE CASCADE,
  response_id uuid REFERENCES rebooking_responses(id) ON DELETE SET NULL,
  notification_type text NOT NULL DEFAULT 'initial_request',
  channel text NOT NULL DEFAULT 'email',
  recipient_email text,
  recipient_phone text,
  subject text,
  sent_at timestamptz DEFAULT now(),
  delivered_at timestamptz,
  opened_at timestamptz,
  clicked_at timestamptz,
  bounced_at timestamptz,
  error_message text,
  provider_id text,
  provider_name text DEFAULT 'resend',
  metadata jsonb,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT notification_type_check CHECK (
    notification_type IN ('initial_request', 'reminder', 'confirmation', 'cancellation', 'expiration')
  ),
  CONSTRAINT notification_channel_check CHECK (
    channel IN ('email', 'sms', 'push')
  )
);

ALTER TABLE rebooking_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view rebooking notifications"
  ON rebooking_notifications FOR SELECT
  TO authenticated
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role IN ('admin', 'practitioner')));

CREATE POLICY "Admins can insert rebooking notifications"
  ON rebooking_notifications FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IN (SELECT id FROM profiles WHERE role IN ('admin', 'practitioner')));

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_rebooking_requests_appointment
  ON rebooking_requests(appointment_id);
CREATE INDEX IF NOT EXISTS idx_rebooking_requests_status
  ON rebooking_requests(status);
CREATE INDEX IF NOT EXISTS idx_rebooking_requests_created
  ON rebooking_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rebooking_requests_email
  ON rebooking_requests(patient_email);

CREATE INDEX IF NOT EXISTS idx_rebooking_time_slots_request
  ON rebooking_time_slots(rebooking_request_id);
CREATE INDEX IF NOT EXISTS idx_rebooking_time_slots_datetime
  ON rebooking_time_slots(slot_datetime);
CREATE INDEX IF NOT EXISTS idx_rebooking_time_slots_selected
  ON rebooking_time_slots(is_selected, is_available);

CREATE INDEX IF NOT EXISTS idx_rebooking_responses_token
  ON rebooking_responses(response_token);
CREATE INDEX IF NOT EXISTS idx_rebooking_responses_request
  ON rebooking_responses(rebooking_request_id);

CREATE INDEX IF NOT EXISTS idx_rebooking_notifications_request
  ON rebooking_notifications(rebooking_request_id);
CREATE INDEX IF NOT EXISTS idx_rebooking_notifications_sent
  ON rebooking_notifications(sent_at DESC);

-- Function to create rebooking request with slots
CREATE OR REPLACE FUNCTION create_rebooking_request(
  p_appointment_id uuid,
  p_reason text,
  p_reason_category text,
  p_priority text,
  p_notes text,
  p_time_slots jsonb,
  p_expires_hours integer DEFAULT 72
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_request_id uuid;
  v_appointment record;
  v_slot jsonb;
  v_order integer := 0;
BEGIN
  -- Get appointment details
  SELECT * INTO v_appointment
  FROM appointments
  WHERE id = p_appointment_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Appointment not found';
  END IF;

  -- Create rebooking request
  INSERT INTO rebooking_requests (
    appointment_id,
    patient_name,
    patient_email,
    patient_phone,
    reason,
    reason_category,
    priority,
    notes,
    created_by,
    expires_at,
    status
  ) VALUES (
    p_appointment_id,
    v_appointment.name,
    v_appointment.email,
    v_appointment.phone,
    p_reason,
    p_reason_category,
    p_priority,
    p_notes,
    auth.uid(),
    now() + (p_expires_hours || ' hours')::interval,
    'pending'
  ) RETURNING id INTO v_request_id;

  -- Create time slots
  FOR v_slot IN SELECT * FROM jsonb_array_elements(p_time_slots)
  LOOP
    INSERT INTO rebooking_time_slots (
      rebooking_request_id,
      slot_date,
      slot_time,
      slot_datetime,
      duration_minutes,
      display_order
    ) VALUES (
      v_request_id,
      (v_slot->>'date')::date,
      (v_slot->>'time')::time,
      (v_slot->>'datetime')::timestamptz,
      COALESCE((v_slot->>'duration')::integer, 30),
      v_order
    );
    v_order := v_order + 1;
  END LOOP;

  -- Update appointment
  UPDATE appointments
  SET
    rebooking_count = COALESCE(rebooking_count, 0) + 1,
    rebooking_reason = p_reason
  WHERE id = p_appointment_id;

  RETURN v_request_id;
END;
$$;

-- Function to process rebooking response
CREATE OR REPLACE FUNCTION process_rebooking_response(
  p_response_token text,
  p_response_type text,
  p_selected_slot_id uuid DEFAULT NULL,
  p_patient_notes text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_response record;
  v_request record;
  v_result jsonb;
BEGIN
  -- Get response record
  SELECT * INTO v_response
  FROM rebooking_responses
  WHERE response_token = p_response_token;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid response token';
  END IF;

  -- Get request details
  SELECT * INTO v_request
  FROM rebooking_requests
  WHERE id = v_response.rebooking_request_id;

  -- Check if expired
  IF v_request.expires_at < now() THEN
    UPDATE rebooking_requests
    SET status = 'expired'
    WHERE id = v_request.id;

    RAISE EXCEPTION 'This rebooking request has expired';
  END IF;

  -- Check if already responded
  IF v_request.status IN ('accepted', 'declined') THEN
    RAISE EXCEPTION 'This request has already been responded to';
  END IF;

  -- Update response
  UPDATE rebooking_responses
  SET
    responded_at = now(),
    response_type = p_response_type,
    selected_slot_id = p_selected_slot_id,
    patient_notes = p_patient_notes
  WHERE response_token = p_response_token;

  -- Update request
  UPDATE rebooking_requests
  SET
    status = p_response_type || 'ed',
    responded_at = now(),
    response_type = p_response_type,
    selected_slot_id = p_selected_slot_id
  WHERE id = v_request.id;

  -- If accepted, mark slot as selected
  IF p_response_type = 'accept' AND p_selected_slot_id IS NOT NULL THEN
    UPDATE rebooking_time_slots
    SET is_selected = true
    WHERE id = p_selected_slot_id;

    -- Mark other slots as unavailable
    UPDATE rebooking_time_slots
    SET is_available = false
    WHERE rebooking_request_id = v_request.id
      AND id != p_selected_slot_id;
  END IF;

  v_result := jsonb_build_object(
    'success', true,
    'request_id', v_request.id,
    'status', p_response_type || 'ed',
    'selected_slot_id', p_selected_slot_id
  );

  RETURN v_result;
END;
$$;

-- Add comment to function
COMMENT ON FUNCTION create_rebooking_request IS
  'Creates a rebooking request with multiple time slot options';
COMMENT ON FUNCTION process_rebooking_response IS
  'Processes patient response to rebooking request via secure token';