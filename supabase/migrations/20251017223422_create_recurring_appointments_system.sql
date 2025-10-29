/*
  # Recurring Appointments System
  
  ## Overview
  Comprehensive system for managing recurring appointments with flexible schedules,
  exception handling, and bulk operations.
  
  ## New Tables
  
  ### `appointment_series`
  Defines recurring appointment patterns
  - `id` (uuid, primary key)
  - `patient_id` (uuid) - Patient for recurring appointments
  - `title` (text) - Series title
  - `description` (text) - Series description
  - `frequency` (text) - daily, weekly, biweekly, monthly, custom
  - `interval_value` (integer) - Every X units (e.g., every 2 weeks)
  - `days_of_week` (integer[]) - For weekly/biweekly (0=Sun, 1=Mon, etc.)
  - `day_of_month` (integer) - For monthly (1-31)
  - `start_time` (time) - Appointment start time
  - `duration_minutes` (integer) - Appointment duration
  - `series_start_date` (date) - When series begins
  - `series_end_date` (date) - When series ends (nullable for indefinite)
  - `max_occurrences` (integer) - Max appointments to generate
  - `practitioner_id` (uuid) - Assigned practitioner
  - `room_id` (uuid) - Assigned room (nullable)
  - `status` (text) - active, paused, completed, cancelled
  - `created_by` (uuid) - Who created the series
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)
  
  ### `appointment_series_exceptions`
  Handles exceptions to recurring patterns
  - `id` (uuid, primary key)
  - `series_id` (uuid) - Parent series
  - `exception_date` (date) - Date to skip or modify
  - `exception_type` (text) - skip, reschedule, custom_time
  - `new_date` (date) - If rescheduled
  - `new_time` (time) - If custom time
  - `reason` (text) - Why exception was made
  - `created_by` (uuid) - Who created exception
  - `created_at` (timestamptz)
  
  ### `appointment_series_occurrences`
  Links individual appointments to their series
  - `id` (uuid, primary key)
  - `series_id` (uuid) - Parent series
  - `appointment_id` (uuid) - Individual appointment
  - `occurrence_number` (integer) - Sequence number in series
  - `scheduled_date` (date) - Original scheduled date
  - `is_exception` (boolean) - Whether this occurrence was modified
  - `created_at` (timestamptz)
  
  ## Features
  - Flexible frequency patterns (daily, weekly, biweekly, monthly, custom)
  - Exception handling for holidays, cancellations, rescheduling
  - Bulk operations (cancel series, update all future, etc.)
  - Automatic appointment generation
  - Series completion tracking
  
  ## Security
  - RLS enabled on all tables
  - Practitioners can manage series
  - Patients can view their own series
*/

-- ============================================================================
-- APPOINTMENT SERIES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS appointment_series (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients_full(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  frequency text NOT NULL CHECK (frequency IN ('daily', 'weekly', 'biweekly', 'monthly', 'custom')),
  interval_value integer NOT NULL DEFAULT 1 CHECK (interval_value > 0),
  days_of_week integer[] DEFAULT ARRAY[1,2,3,4,5],
  day_of_month integer CHECK (day_of_month BETWEEN 1 AND 31),
  start_time time NOT NULL,
  duration_minutes integer NOT NULL DEFAULT 30 CHECK (duration_minutes > 0),
  series_start_date date NOT NULL,
  series_end_date date,
  max_occurrences integer CHECK (max_occurrences > 0),
  practitioner_id uuid REFERENCES auth.users(id),
  room_id uuid,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'cancelled')),
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================================
-- APPOINTMENT SERIES EXCEPTIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS appointment_series_exceptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  series_id uuid NOT NULL REFERENCES appointment_series(id) ON DELETE CASCADE,
  exception_date date NOT NULL,
  exception_type text NOT NULL CHECK (exception_type IN ('skip', 'reschedule', 'custom_time')),
  new_date date,
  new_time time,
  reason text,
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  CONSTRAINT unique_series_exception_date UNIQUE (series_id, exception_date)
);

-- ============================================================================
-- APPOINTMENT SERIES OCCURRENCES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS appointment_series_occurrences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  series_id uuid NOT NULL REFERENCES appointment_series(id) ON DELETE CASCADE,
  appointment_id uuid NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  occurrence_number integer NOT NULL,
  scheduled_date date NOT NULL,
  is_exception boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT unique_series_appointment UNIQUE (series_id, appointment_id)
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_series_patient ON appointment_series(patient_id);
CREATE INDEX IF NOT EXISTS idx_series_practitioner ON appointment_series(practitioner_id);
CREATE INDEX IF NOT EXISTS idx_series_status ON appointment_series(status);
CREATE INDEX IF NOT EXISTS idx_series_dates ON appointment_series(series_start_date, series_end_date);
CREATE INDEX IF NOT EXISTS idx_series_exceptions_series ON appointment_series_exceptions(series_id);
CREATE INDEX IF NOT EXISTS idx_series_exceptions_date ON appointment_series_exceptions(exception_date);
CREATE INDEX IF NOT EXISTS idx_series_occurrences_series ON appointment_series_occurrences(series_id);
CREATE INDEX IF NOT EXISTS idx_series_occurrences_appointment ON appointment_series_occurrences(appointment_id);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE appointment_series ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_series_exceptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_series_occurrences ENABLE ROW LEVEL SECURITY;

-- Practitioners can manage all series
CREATE POLICY "Practitioners can manage appointment series"
  ON appointment_series FOR ALL
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

-- Patients can view their own series
CREATE POLICY "Patients can view own appointment series"
  ON appointment_series FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM patient_portal_users
      WHERE patient_portal_users.id = auth.uid()
      AND patient_portal_users.patient_id = appointment_series.patient_id
    )
  );

-- Practitioners can manage exceptions
CREATE POLICY "Practitioners can manage series exceptions"
  ON appointment_series_exceptions FOR ALL
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

-- System and practitioners can manage occurrences
CREATE POLICY "Practitioners can manage series occurrences"
  ON appointment_series_occurrences FOR ALL
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

-- ============================================================================
-- TRIGGERS
-- ============================================================================

CREATE TRIGGER update_appointment_series_updated_at
  BEFORE UPDATE ON appointment_series
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- RECURRING APPOINTMENT FUNCTIONS
-- ============================================================================

-- Function to calculate next occurrence date
CREATE OR REPLACE FUNCTION calculate_next_occurrence_date(
  p_current_date date,
  p_frequency text,
  p_interval_value integer,
  p_days_of_week integer[],
  p_day_of_month integer
)
RETURNS date AS $$
DECLARE
  v_next_date date;
  v_current_dow integer;
  v_days_to_add integer;
BEGIN
  CASE p_frequency
    WHEN 'daily' THEN
      v_next_date := p_current_date + (p_interval_value || ' days')::interval;
      
    WHEN 'weekly' THEN
      v_current_dow := EXTRACT(DOW FROM p_current_date);
      v_days_to_add := NULL;
      
      -- Find next matching day of week
      FOR i IN 0..6 LOOP
        IF ((v_current_dow + i) % 7) = ANY(p_days_of_week) AND i > 0 THEN
          v_days_to_add := i;
          EXIT;
        END IF;
      END LOOP;
      
      IF v_days_to_add IS NULL THEN
        v_days_to_add := 7 * p_interval_value;
      END IF;
      
      v_next_date := p_current_date + (v_days_to_add || ' days')::interval;
      
    WHEN 'biweekly' THEN
      v_next_date := p_current_date + (14 * p_interval_value || ' days')::interval;
      
    WHEN 'monthly' THEN
      v_next_date := (p_current_date + (p_interval_value || ' months')::interval);
      -- Adjust to correct day of month
      IF p_day_of_month IS NOT NULL THEN
        v_next_date := date_trunc('month', v_next_date)::date + (p_day_of_month - 1);
      END IF;
      
    ELSE
      v_next_date := p_current_date + (p_interval_value || ' days')::interval;
  END CASE;

  RETURN v_next_date;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to generate appointments for a series
CREATE OR REPLACE FUNCTION generate_series_appointments(
  p_series_id uuid,
  p_generate_until_date date DEFAULT NULL
)
RETURNS integer AS $$
DECLARE
  v_series record;
  v_current_date date;
  v_end_date date;
  v_occurrence_count integer := 0;
  v_appointment_id uuid;
  v_exception record;
  v_is_exception boolean;
BEGIN
  -- Get series details
  SELECT * INTO v_series
  FROM appointment_series
  WHERE id = p_series_id;

  IF v_series IS NULL THEN
    RAISE EXCEPTION 'Series not found';
  END IF;

  -- Determine end date
  v_end_date := COALESCE(
    p_generate_until_date,
    v_series.series_end_date,
    v_series.series_start_date + interval '1 year'
  );

  -- Find last generated occurrence
  SELECT COALESCE(MAX(scheduled_date), v_series.series_start_date - interval '1 day')
  INTO v_current_date
  FROM appointment_series_occurrences
  WHERE series_id = p_series_id;

  -- Generate appointments
  WHILE v_current_date < v_end_date LOOP
    -- Calculate next occurrence
    v_current_date := calculate_next_occurrence_date(
      v_current_date,
      v_series.frequency,
      v_series.interval_value,
      v_series.days_of_week,
      v_series.day_of_month
    );

    EXIT WHEN v_current_date > v_end_date;
    EXIT WHEN v_series.max_occurrences IS NOT NULL AND v_occurrence_count >= v_series.max_occurrences;

    -- Check for exceptions
    SELECT * INTO v_exception
    FROM appointment_series_exceptions
    WHERE series_id = p_series_id
      AND exception_date = v_current_date;

    v_is_exception := v_exception IS NOT NULL;

    -- Skip if exception type is 'skip'
    CONTINUE WHEN v_exception.exception_type = 'skip';

    -- Use exception date/time if rescheduled
    IF v_exception.exception_type IN ('reschedule', 'custom_time') THEN
      v_current_date := COALESCE(v_exception.new_date, v_current_date);
    END IF;

    -- Create appointment
    INSERT INTO appointments (
      patient_id,
      scheduled_date,
      scheduled_time,
      duration_minutes,
      reason,
      status,
      name,
      email,
      phone
    )
    SELECT
      pf.id,
      v_current_date,
      COALESCE(v_exception.new_time, v_series.start_time),
      v_series.duration_minutes,
      v_series.description,
      'confirmed',
      pf.first_name || ' ' || pf.last_name,
      pf.email,
      pf.phone
    FROM patients_full pf
    WHERE pf.id = v_series.patient_id
    RETURNING id INTO v_appointment_id;

    -- Link to series
    INSERT INTO appointment_series_occurrences (
      series_id,
      appointment_id,
      occurrence_number,
      scheduled_date,
      is_exception
    ) VALUES (
      p_series_id,
      v_appointment_id,
      v_occurrence_count + 1,
      v_current_date,
      v_is_exception
    );

    v_occurrence_count := v_occurrence_count + 1;
  END LOOP;

  RETURN v_occurrence_count;
END;
$$ LANGUAGE plpgsql;

-- Function to cancel series (and future appointments)
CREATE OR REPLACE FUNCTION cancel_appointment_series(
  p_series_id uuid,
  p_cancel_from_date date DEFAULT NULL
)
RETURNS integer AS $$
DECLARE
  v_cancelled_count integer;
BEGIN
  -- Update series status
  UPDATE appointment_series
  SET status = 'cancelled',
      updated_at = now()
  WHERE id = p_series_id;

  -- Cancel future appointments
  UPDATE appointments a
  SET status = 'cancelled',
      updated_at = now()
  FROM appointment_series_occurrences aso
  WHERE aso.appointment_id = a.id
    AND aso.series_id = p_series_id
    AND a.scheduled_date >= COALESCE(p_cancel_from_date, CURRENT_DATE)
    AND a.status NOT IN ('cancelled', 'completed');

  GET DIAGNOSTICS v_cancelled_count = ROW_COUNT;
  RETURN v_cancelled_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE appointment_series IS 
  'Defines recurring appointment patterns with flexible frequency and scheduling options';

COMMENT ON TABLE appointment_series_exceptions IS 
  'Handles exceptions to recurring patterns like skips, rescheduling, and custom times';

COMMENT ON TABLE appointment_series_occurrences IS 
  'Links individual appointments to their parent series for tracking and management';

COMMENT ON FUNCTION calculate_next_occurrence_date(date, text, integer, integer[], integer) IS 
  'Calculates the next occurrence date based on frequency pattern';

COMMENT ON FUNCTION generate_series_appointments(uuid, date) IS 
  'Generates individual appointments from a series pattern up to specified date';

COMMENT ON FUNCTION cancel_appointment_series(uuid, date) IS 
  'Cancels a series and all future appointments, optionally from a specific date';
