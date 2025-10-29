/*
  # Create Missing Automation Tables and Functions

  ## Overview
  Creates the missing tables and functions that the UI expects for automation features.

  ## New Tables
  1. appointment_confirmations - Track confirmation status and reminders
  2. automated_followups - Track automated follow-up communications
  3. no_show_predictions - ML predictions for no-show risk

  ## New Functions
  1. check_automation_health - Health check for automation system
*/

-- ============================================================================
-- APPOINTMENT CONFIRMATIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS appointment_confirmations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  confirmation_status text NOT NULL DEFAULT 'pending',
  reminder_48h_sent boolean NOT NULL DEFAULT false,
  reminder_24h_sent boolean NOT NULL DEFAULT false,
  reminder_2h_sent boolean NOT NULL DEFAULT false,
  confirmed_at timestamptz,
  declined_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT valid_confirmation_status CHECK (
    confirmation_status IN ('pending', 'confirmed', 'declined', 'cancelled')
  )
);

-- Enable RLS
ALTER TABLE appointment_confirmations ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Admins can view all confirmations"
  ON appointment_confirmations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'practitioner')
    )
  );

CREATE POLICY "Admins can manage confirmations"
  ON appointment_confirmations FOR ALL
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

-- Indexes
CREATE INDEX IF NOT EXISTS idx_appointment_confirmations_appointment_id
  ON appointment_confirmations(appointment_id);
CREATE INDEX IF NOT EXISTS idx_appointment_confirmations_status
  ON appointment_confirmations(confirmation_status);

-- ============================================================================
-- AUTOMATED FOLLOWUPS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS automated_followups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid REFERENCES appointments(id) ON DELETE SET NULL,
  contact_id uuid REFERENCES contacts(id) ON DELETE SET NULL,
  followup_type text NOT NULL DEFAULT 'post_visit',
  status text NOT NULL DEFAULT 'queued',
  scheduled_for timestamptz NOT NULL,
  sent_at timestamptz,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT valid_followup_type CHECK (
    followup_type IN ('post_visit', 'recall', 'birthday', 'satisfaction', 'custom')
  ),
  CONSTRAINT valid_followup_status CHECK (
    status IN ('queued', 'sent', 'failed', 'cancelled')
  )
);

-- Enable RLS
ALTER TABLE automated_followups ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Admins can view all followups"
  ON automated_followups FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'practitioner')
    )
  );

CREATE POLICY "Admins can manage followups"
  ON automated_followups FOR ALL
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

-- Indexes
CREATE INDEX IF NOT EXISTS idx_automated_followups_scheduled
  ON automated_followups(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_automated_followups_status
  ON automated_followups(status);

-- ============================================================================
-- NO SHOW PREDICTIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS no_show_predictions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  prediction_score numeric(5,4) NOT NULL DEFAULT 0.0000,
  risk_level text NOT NULL DEFAULT 'low',
  factors jsonb DEFAULT '[]'::jsonb,
  actual_outcome text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT valid_score CHECK (prediction_score >= 0 AND prediction_score <= 1),
  CONSTRAINT valid_risk_level CHECK (
    risk_level IN ('low', 'medium', 'high', 'very_high')
  ),
  CONSTRAINT valid_outcome CHECK (
    actual_outcome IS NULL OR actual_outcome IN ('show', 'no_show', 'cancelled')
  )
);

-- Enable RLS
ALTER TABLE no_show_predictions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Admins can view all predictions"
  ON no_show_predictions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'practitioner')
    )
  );

CREATE POLICY "Admins can manage predictions"
  ON no_show_predictions FOR ALL
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

-- Indexes
CREATE INDEX IF NOT EXISTS idx_no_show_predictions_appointment
  ON no_show_predictions(appointment_id);
CREATE INDEX IF NOT EXISTS idx_no_show_predictions_risk
  ON no_show_predictions(risk_level);

-- ============================================================================
-- AUTOMATION HEALTH CHECK FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION check_automation_health()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result jsonb;
  v_pending_confirmations integer;
  v_pending_followups integer;
  v_failed_followups integer;
BEGIN
  -- Count pending confirmations
  SELECT COUNT(*) INTO v_pending_confirmations
  FROM appointment_confirmations
  WHERE confirmation_status = 'pending'
    AND created_at > now() - interval '7 days';

  -- Count pending followups
  SELECT COUNT(*) INTO v_pending_followups
  FROM automated_followups
  WHERE status = 'queued'
    AND scheduled_for <= now() + interval '24 hours';

  -- Count failed followups
  SELECT COUNT(*) INTO v_failed_followups
  FROM automated_followups
  WHERE status = 'failed'
    AND created_at > now() - interval '24 hours';

  v_result := jsonb_build_object(
    'status', 'healthy',
    'timestamp', now(),
    'metrics', jsonb_build_object(
      'pending_confirmations', v_pending_confirmations,
      'pending_followups', v_pending_followups,
      'failed_followups', v_failed_followups
    )
  );

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION check_automation_health() TO anon, authenticated;

COMMENT ON FUNCTION check_automation_health() IS
  'Returns health status and metrics for the automation system';
