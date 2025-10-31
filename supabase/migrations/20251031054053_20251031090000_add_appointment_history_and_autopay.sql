/*
  # Appointment History and Automatic Payment System

  ## New Tables
  - payment_authorizations: Patient consent for automatic payments
  - automatic_payment_attempts: Audit log for payment attempts

  ## Schema Updates
  - appointments: auto_payment columns

  ## Security
  - RLS policies for patient and admin access
*/

-- Add auto-payment columns to appointments
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'appointments' AND column_name = 'auto_payment_enabled') THEN
    ALTER TABLE appointments ADD COLUMN auto_payment_enabled boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'appointments' AND column_name = 'auto_payment_status') THEN
    ALTER TABLE appointments ADD COLUMN auto_payment_status text DEFAULT 'not_applicable' CHECK (auto_payment_status IN ('not_applicable', 'pending', 'charged', 'failed'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'appointments' AND column_name = 'completed_at') THEN
    ALTER TABLE appointments ADD COLUMN completed_at timestamptz;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'appointments' AND column_name = 'payment_transaction_id') THEN
    ALTER TABLE appointments ADD COLUMN payment_transaction_id uuid REFERENCES payment_transactions(id);
  END IF;
END $$;

-- Create payment_authorizations table
CREATE TABLE IF NOT EXISTS payment_authorizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL,
  payment_method_id uuid REFERENCES payment_methods(id) ON DELETE SET NULL,
  is_enabled boolean DEFAULT false,
  auto_pay_all_appointments boolean DEFAULT true,
  spending_limit_per_charge numeric(10, 2),
  spending_limit_monthly numeric(10, 2),
  notification_preferences jsonb DEFAULT '{"email_on_charge": true, "email_on_failure": true, "email_receipt": true}'::jsonb,
  consent_given_at timestamptz,
  consent_ip_address text,
  last_modified_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(patient_id)
);

-- Create automatic_payment_attempts table
CREATE TABLE IF NOT EXISTS automatic_payment_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL,
  authorization_id uuid NOT NULL REFERENCES payment_authorizations(id) ON DELETE CASCADE,
  payment_method_id uuid REFERENCES payment_methods(id) ON DELETE SET NULL,
  transaction_id uuid REFERENCES payment_transactions(id) ON DELETE SET NULL,
  amount numeric(10, 2) NOT NULL,
  currency text DEFAULT 'CAD',
  attempt_number integer DEFAULT 1,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('success', 'failed', 'pending', 'cancelled')),
  failure_reason text,
  gateway_response jsonb,
  retry_scheduled_at timestamptz,
  processed_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_appointments_history ON appointments(contact_id, scheduled_at DESC, status) WHERE status IN ('completed', 'cancelled', 'no_show');
CREATE INDEX IF NOT EXISTS idx_appointments_auto_payment ON appointments(contact_id, auto_payment_status) WHERE auto_payment_enabled = true;
CREATE INDEX IF NOT EXISTS idx_payment_auth_patient ON payment_authorizations(patient_id) WHERE is_enabled = true;
CREATE INDEX IF NOT EXISTS idx_auto_payment_attempts_appointment ON automatic_payment_attempts(appointment_id);
CREATE INDEX IF NOT EXISTS idx_auto_payment_attempts_patient ON automatic_payment_attempts(patient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_auto_payment_attempts_status ON automatic_payment_attempts(status, retry_scheduled_at) WHERE status IN ('pending', 'failed');

-- Enable RLS
ALTER TABLE payment_authorizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE automatic_payment_attempts ENABLE ROW LEVEL SECURITY;

-- Simple RLS policies - patients can access their own data
CREATE POLICY "Patients access own payment auth"
  ON payment_authorizations FOR ALL
  TO authenticated
  USING (
    patient_id IN (
      SELECT id FROM contacts WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

CREATE POLICY "Patients access own payment attempts"
  ON automatic_payment_attempts FOR SELECT
  TO authenticated
  USING (
    patient_id IN (
      SELECT id FROM contacts WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

CREATE POLICY "System can insert payment attempts"
  ON automatic_payment_attempts FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Function to get appointment history
CREATE OR REPLACE FUNCTION get_appointment_history(
  p_patient_id uuid,
  p_limit integer DEFAULT 50,
  p_offset integer DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  scheduled_date date,
  scheduled_time text,
  duration_minutes integer,
  status text,
  reason text,
  notes text,
  completed_at timestamptz,
  cancelled_at timestamptz,
  cancellation_reason text,
  auto_payment_enabled boolean,
  auto_payment_status text,
  payment_amount numeric,
  payment_status text,
  service_type_name text,
  service_type_price numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.id,
    a.scheduled_at::date as scheduled_date,
    a.scheduled_at::time::text as scheduled_time,
    a.duration_minutes,
    a.status,
    a.reason,
    a.notes,
    a.completed_at,
    a.cancelled_at,
    a.cancellation_reason,
    COALESCE(a.auto_payment_enabled, false) as auto_payment_enabled,
    COALESCE(a.auto_payment_status, 'not_applicable') as auto_payment_status,
    pt.amount as payment_amount,
    pt.status as payment_status,
    st.name as service_type_name,
    st.price as service_type_price
  FROM appointments a
  LEFT JOIN payment_transactions pt ON pt.id = a.payment_transaction_id
  LEFT JOIN service_types st ON st.id = a.service_type_id
  WHERE a.contact_id = p_patient_id
    AND a.status IN ('completed', 'cancelled', 'no_show')
  ORDER BY a.scheduled_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check payment eligibility
CREATE OR REPLACE FUNCTION check_automatic_payment_eligibility(p_appointment_id uuid)
RETURNS jsonb AS $$
DECLARE
  v_patient_id uuid;
  v_auth_record record;
  v_payment_method_record record;
  v_auto_enabled boolean;
BEGIN
  -- Get appointment
  SELECT contact_id, auto_payment_enabled INTO v_patient_id, v_auto_enabled
  FROM appointments WHERE id = p_appointment_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('eligible', false, 'reason', 'Appointment not found');
  END IF;

  IF NOT v_auto_enabled THEN
    RETURN jsonb_build_object('eligible', false, 'reason', 'Auto-payment not enabled');
  END IF;

  -- Get authorization
  SELECT * INTO v_auth_record FROM payment_authorizations
  WHERE patient_id = v_patient_id AND is_enabled = true;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('eligible', false, 'reason', 'No authorization');
  END IF;

  -- Get payment method
  SELECT * INTO v_payment_method_record FROM payment_methods
  WHERE id = v_auth_record.payment_method_id AND is_active = true;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('eligible', false, 'reason', 'Payment method inactive');
  END IF;

  -- Check expiry
  IF v_payment_method_record.expiry_year < EXTRACT(YEAR FROM CURRENT_DATE) OR
     (v_payment_method_record.expiry_year = EXTRACT(YEAR FROM CURRENT_DATE) AND
      v_payment_method_record.expiry_month < EXTRACT(MONTH FROM CURRENT_DATE)) THEN
    RETURN jsonb_build_object('eligible', false, 'reason', 'Card expired');
  END IF;

  RETURN jsonb_build_object(
    'eligible', true,
    'patient_id', v_patient_id,
    'authorization_id', v_auth_record.id,
    'payment_method_id', v_payment_method_record.id,
    'spending_limit_per_charge', v_auth_record.spending_limit_per_charge,
    'notification_preferences', v_auth_record.notification_preferences
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_payment_authorizations_updated_at') THEN
    CREATE TRIGGER update_payment_authorizations_updated_at
      BEFORE UPDATE ON payment_authorizations
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

GRANT EXECUTE ON FUNCTION get_appointment_history TO authenticated;
GRANT EXECUTE ON FUNCTION check_automatic_payment_eligibility TO authenticated;
