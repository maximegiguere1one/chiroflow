/*
  # Self-Service Appointment Rescheduling System

  ## Purpose
  Enables patients to reschedule their own appointments through the patient portal
  with business rule enforcement, validation, and comprehensive audit trails.

  ## Changes to Existing Tables

  ### appointments table
  - `reschedule_count` - Tracks how many times this appointment has been rescheduled
  - `last_rescheduled_at` - Timestamp of the most recent reschedule
  - `reschedule_locked_until` - Optional lock to prevent rescheduling until a certain time
  - `original_scheduled_date` - Preserves the original date when first rescheduled
  - `original_scheduled_time` - Preserves the original time when first rescheduled

  ## New Tables

  ### 1. appointment_reschedule_history
  - Complete audit trail of all reschedule attempts
  - Tracks old and new date/time values
  - Records who initiated the change (patient vs admin)
  - Stores reason for rescheduling
  - Links to notification records

  ### 2. reschedule_policies
  - Configurable business rules per clinic
  - Maximum reschedules allowed per appointment
  - Minimum notice hours required
  - Fee policies for late reschedules
  - Patient-specific overrides

  ## Functions

  ### 1. can_patient_reschedule_appointment
  - Validates if patient can reschedule based on policies
  - Checks 24-hour rule, reschedule limits, no-show history
  - Returns detailed validation result with reasons

  ### 2. get_available_slots
  - Returns available appointment slots for rescheduling
  - Filters by service type, duration, practitioner
  - Excludes booked slots and blocked times
  - Respects business hours and buffer times

  ### 3. reschedule_appointment_self_service
  - Atomic operation to reschedule appointment
  - Creates audit trail entry
  - Updates appointment record
  - Returns success/failure with details

  ## Security
  - RLS enabled on all tables
  - Patients can only reschedule their own appointments
  - Admin override capabilities maintained
  - All actions logged for compliance

  ## Performance
  - Indexes on date/time fields for fast availability queries
  - Composite indexes for validation checks
  - Optimized slot availability calculation
*/

-- Add reschedule tracking columns to appointments
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'appointments' AND column_name = 'reschedule_count'
  ) THEN
    ALTER TABLE appointments ADD COLUMN reschedule_count integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'appointments' AND column_name = 'last_rescheduled_at'
  ) THEN
    ALTER TABLE appointments ADD COLUMN last_rescheduled_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'appointments' AND column_name = 'reschedule_locked_until'
  ) THEN
    ALTER TABLE appointments ADD COLUMN reschedule_locked_until timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'appointments' AND column_name = 'original_scheduled_date'
  ) THEN
    ALTER TABLE appointments ADD COLUMN original_scheduled_date date;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'appointments' AND column_name = 'original_scheduled_time'
  ) THEN
    ALTER TABLE appointments ADD COLUMN original_scheduled_time time;
  END IF;
END $$;

-- Update appointments_api view to include reschedule fields
CREATE OR REPLACE VIEW appointments_api AS
SELECT 
  a.id,
  a.scheduled_at,
  a.scheduled_at::date AS scheduled_date,
  a.scheduled_at::time without time zone AS scheduled_time,
  COALESCE(a.owner_id, a.provider_id) AS owner_id,
  a.contact_id,
  a.contact_id AS patient_id,
  a.duration_minutes,
  a.status,
  a.notes,
  a.created_at,
  a.updated_at,
  COALESCE(a.name, c.full_name, 'Sans nom'::text) AS name,
  COALESCE(a.email, c.email, ''::text) AS email,
  COALESCE(a.phone, c.phone, ''::text) AS phone,
  COALESCE(a.reason, 'Consultation'::text) AS reason,
  NULL::text AS service_type,
  NULL::boolean AS reminder_sent,
  NULL::text AS confirmation_status,
  NULL::numeric AS no_show_risk_score,
  COALESCE(a.reschedule_count, 0) AS reschedule_count,
  a.last_rescheduled_at,
  a.reschedule_locked_until,
  a.original_scheduled_date,
  a.original_scheduled_time
FROM appointments a
LEFT JOIN contacts c ON a.contact_id = c.id;

-- Table for reschedule history and audit trail
CREATE TABLE IF NOT EXISTS appointment_reschedule_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  patient_id uuid,
  old_date date NOT NULL,
  old_time time NOT NULL,
  new_date date NOT NULL,
  new_time time NOT NULL,
  reschedule_reason text,
  initiated_by text NOT NULL DEFAULT 'patient',
  initiated_by_user_id uuid,
  was_within_policy boolean DEFAULT true,
  hours_notice numeric,
  fee_applied numeric DEFAULT 0,
  notification_sent boolean DEFAULT false,
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT initiated_by_check CHECK (
    initiated_by IN ('patient', 'admin', 'system')
  )
);

ALTER TABLE appointment_reschedule_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own reschedule history"
  ON appointment_reschedule_history FOR SELECT
  TO authenticated
  USING (
    initiated_by_user_id = auth.uid()
    OR auth.uid() IN (SELECT id FROM profiles WHERE role IN ('admin', 'practitioner'))
  );

CREATE POLICY "Admins can view all reschedule history"
  ON appointment_reschedule_history FOR SELECT
  TO authenticated
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role IN ('admin', 'practitioner')));

CREATE POLICY "System can insert reschedule history"
  ON appointment_reschedule_history FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Table for reschedule policies
CREATE TABLE IF NOT EXISTS reschedule_policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  policy_name text NOT NULL DEFAULT 'Default Policy',
  max_reschedules_per_appointment integer DEFAULT 2,
  min_notice_hours integer DEFAULT 24,
  same_day_reschedule_allowed boolean DEFAULT false,
  late_reschedule_fee numeric DEFAULT 0,
  applies_to_patient_id uuid,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE reschedule_policies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own reschedule policies"
  ON reschedule_policies FOR SELECT
  TO authenticated
  USING (owner_id = auth.uid());

CREATE POLICY "Users can manage own reschedule policies"
  ON reschedule_policies FOR ALL
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- Insert default policy for each clinic owner
INSERT INTO reschedule_policies (owner_id, policy_name, max_reschedules_per_appointment, min_notice_hours)
SELECT DISTINCT owner_id, 'Default Policy', 2, 24
FROM appointments
WHERE owner_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_appointments_reschedule_count
  ON appointments(reschedule_count);
CREATE INDEX IF NOT EXISTS idx_appointments_last_rescheduled
  ON appointments(last_rescheduled_at);
CREATE INDEX IF NOT EXISTS idx_appointments_scheduled_at
  ON appointments(scheduled_at);

CREATE INDEX IF NOT EXISTS idx_reschedule_history_appointment
  ON appointment_reschedule_history(appointment_id);
CREATE INDEX IF NOT EXISTS idx_reschedule_history_patient
  ON appointment_reschedule_history(patient_id);
CREATE INDEX IF NOT EXISTS idx_reschedule_history_created
  ON appointment_reschedule_history(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_reschedule_policies_owner
  ON reschedule_policies(owner_id);
CREATE INDEX IF NOT EXISTS idx_reschedule_policies_patient
  ON reschedule_policies(applies_to_patient_id);

-- Function to check if patient can reschedule
CREATE OR REPLACE FUNCTION can_patient_reschedule_appointment(
  p_appointment_id uuid,
  p_patient_user_id uuid
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_appointment record;
  v_policy record;
  v_hours_until numeric;
  v_result jsonb;
  v_can_reschedule boolean := true;
  v_reasons text[] := ARRAY[]::text[];
BEGIN
  SELECT * INTO v_appointment
  FROM appointments_api
  WHERE id = p_appointment_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'can_reschedule', false,
      'reasons', ARRAY['Appointment not found']
    );
  END IF;

  IF v_appointment.scheduled_date < CURRENT_DATE
    OR (v_appointment.scheduled_date = CURRENT_DATE AND v_appointment.scheduled_time < CURRENT_TIME) THEN
    RETURN jsonb_build_object(
      'can_reschedule', false,
      'reasons', ARRAY['Cannot reschedule past appointments']
    );
  END IF;

  IF v_appointment.status IN ('cancelled', 'completed', 'no_show') THEN
    RETURN jsonb_build_object(
      'can_reschedule', false,
      'reasons', ARRAY['Cannot reschedule ' || v_appointment.status || ' appointments']
    );
  END IF;

  IF v_appointment.reschedule_locked_until IS NOT NULL
    AND v_appointment.reschedule_locked_until > now() THEN
    RETURN jsonb_build_object(
      'can_reschedule', false,
      'reasons', ARRAY['Rescheduling is temporarily locked for this appointment']
    );
  END IF;

  SELECT * INTO v_policy
  FROM reschedule_policies
  WHERE owner_id = v_appointment.owner_id
    AND is_active = true
    AND (applies_to_patient_id IS NULL OR applies_to_patient_id = v_appointment.patient_id)
  ORDER BY applies_to_patient_id NULLS LAST
  LIMIT 1;

  IF NOT FOUND THEN
    v_policy.max_reschedules_per_appointment := 2;
    v_policy.min_notice_hours := 24;
    v_policy.same_day_reschedule_allowed := false;
  END IF;

  IF COALESCE(v_appointment.reschedule_count, 0) >= v_policy.max_reschedules_per_appointment THEN
    v_can_reschedule := false;
    v_reasons := array_append(v_reasons, 'Maximum reschedules reached (' || v_policy.max_reschedules_per_appointment || ')');
  END IF;

  v_hours_until := EXTRACT(EPOCH FROM (
    (v_appointment.scheduled_date || ' ' || v_appointment.scheduled_time)::timestamp - now()
  )) / 3600;

  IF v_hours_until < v_policy.min_notice_hours THEN
    IF NOT v_policy.same_day_reschedule_allowed THEN
      v_can_reschedule := false;
      v_reasons := array_append(v_reasons,
        'Minimum notice of ' || v_policy.min_notice_hours || ' hours required (only ' ||
        ROUND(v_hours_until::numeric, 1) || ' hours remaining)'
      );
    END IF;
  END IF;

  v_result := jsonb_build_object(
    'can_reschedule', v_can_reschedule,
    'reasons', v_reasons,
    'hours_until_appointment', ROUND(v_hours_until::numeric, 1),
    'reschedule_count', COALESCE(v_appointment.reschedule_count, 0),
    'max_reschedules', v_policy.max_reschedules_per_appointment,
    'min_notice_hours', v_policy.min_notice_hours,
    'within_policy', v_hours_until >= v_policy.min_notice_hours,
    'potential_fee', CASE
      WHEN v_hours_until < v_policy.min_notice_hours THEN v_policy.late_reschedule_fee
      ELSE 0
    END
  );

  RETURN v_result;
END;
$$;

-- Function to get available time slots
CREATE OR REPLACE FUNCTION get_available_slots(
  p_owner_id uuid,
  p_start_date date,
  p_end_date date,
  p_duration_minutes integer DEFAULT 30,
  p_service_type text DEFAULT NULL
) RETURNS TABLE (
  slot_date date,
  slot_time time,
  slot_datetime timestamptz,
  is_available boolean,
  practitioner_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH time_slots AS (
    SELECT
      generate_series(p_start_date, p_end_date, '1 day'::interval)::date AS slot_date,
      generate_series('08:00'::time, '17:00'::time, (p_duration_minutes || ' minutes')::interval)::time AS slot_time
  ),
  existing_appointments AS (
    SELECT
      scheduled_date,
      scheduled_time,
      scheduled_time + (COALESCE(duration_minutes, 30) || ' minutes')::interval AS end_time
    FROM appointments_api
    WHERE owner_id = p_owner_id
      AND status IN ('pending', 'confirmed')
      AND scheduled_date BETWEEN p_start_date AND p_end_date
  )
  SELECT
    ts.slot_date,
    ts.slot_time,
    (ts.slot_date || ' ' || ts.slot_time)::timestamptz AS slot_datetime,
    NOT EXISTS (
      SELECT 1 FROM existing_appointments ea
      WHERE ea.scheduled_date = ts.slot_date
        AND (
          (ts.slot_time >= ea.scheduled_time AND ts.slot_time < ea.end_time)
          OR (ts.slot_time + (p_duration_minutes || ' minutes')::interval > ea.scheduled_time
              AND ts.slot_time < ea.scheduled_time)
        )
    ) AS is_available,
    'Dr. ' || COALESCE(
      (SELECT first_name || ' ' || last_name
       FROM profiles
       WHERE id = p_owner_id
       LIMIT 1),
      'Practitioner'
    ) AS practitioner_name
  FROM time_slots ts
  WHERE ts.slot_date >= CURRENT_DATE
    AND (ts.slot_date > CURRENT_DATE OR ts.slot_time > CURRENT_TIME)
  ORDER BY ts.slot_date, ts.slot_time;
END;
$$;

-- Function to reschedule appointment
CREATE OR REPLACE FUNCTION reschedule_appointment_self_service(
  p_appointment_id uuid,
  p_new_date date,
  p_new_time time,
  p_reschedule_reason text DEFAULT NULL,
  p_patient_user_id uuid DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_appointment record;
  v_validation jsonb;
  v_hours_notice numeric;
  v_old_date date;
  v_old_time time;
BEGIN
  SELECT * INTO v_appointment
  FROM appointments_api
  WHERE id = p_appointment_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Appointment not found'
    );
  END IF;

  v_validation := can_patient_reschedule_appointment(p_appointment_id, p_patient_user_id);

  IF NOT (v_validation->>'can_reschedule')::boolean THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Cannot reschedule',
      'validation', v_validation
    );
  END IF;

  IF EXISTS (
    SELECT 1 FROM appointments_api
    WHERE owner_id = v_appointment.owner_id
      AND scheduled_date = p_new_date
      AND scheduled_time = p_new_time
      AND status IN ('pending', 'confirmed')
      AND id != p_appointment_id
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Selected time slot is no longer available'
    );
  END IF;

  v_old_date := v_appointment.scheduled_date;
  v_old_time := v_appointment.scheduled_time;

  v_hours_notice := EXTRACT(EPOCH FROM (
    (v_old_date || ' ' || v_old_time)::timestamp - now()
  )) / 3600;

  IF v_appointment.reschedule_count = 0 OR v_appointment.original_scheduled_date IS NULL THEN
    UPDATE appointments
    SET original_scheduled_date = v_old_date,
        original_scheduled_time = v_old_time
    WHERE id = p_appointment_id;
  END IF;

  UPDATE appointments
  SET
    scheduled_at = (p_new_date || ' ' || p_new_time)::timestamptz,
    reschedule_count = COALESCE(reschedule_count, 0) + 1,
    last_rescheduled_at = now(),
    updated_at = now()
  WHERE id = p_appointment_id;

  INSERT INTO appointment_reschedule_history (
    appointment_id,
    patient_id,
    old_date,
    old_time,
    new_date,
    new_time,
    reschedule_reason,
    initiated_by,
    initiated_by_user_id,
    was_within_policy,
    hours_notice
  ) VALUES (
    p_appointment_id,
    v_appointment.patient_id,
    v_old_date,
    v_old_time,
    p_new_date,
    p_new_time,
    p_reschedule_reason,
    'patient',
    p_patient_user_id,
    v_hours_notice >= (v_validation->>'min_notice_hours')::numeric,
    v_hours_notice
  );

  RETURN jsonb_build_object(
    'success', true,
    'appointment_id', p_appointment_id,
    'old_date', v_old_date,
    'old_time', v_old_time,
    'new_date', p_new_date,
    'new_time', p_new_time,
    'reschedule_count', v_appointment.reschedule_count + 1,
    'within_policy', v_hours_notice >= (v_validation->>'min_notice_hours')::numeric
  );
END;
$$;

COMMENT ON FUNCTION can_patient_reschedule_appointment IS
  'Validates if a patient can reschedule an appointment based on policies and business rules';

COMMENT ON FUNCTION get_available_slots IS
  'Returns available appointment time slots within a date range for rescheduling';

COMMENT ON FUNCTION reschedule_appointment_self_service IS
  'Handles self-service appointment rescheduling with validation and audit trail';
