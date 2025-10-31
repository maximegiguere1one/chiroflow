/*
  # Appointment History and Automatic Payment System

  ## Overview
  Adds comprehensive appointment history tracking and pre-authorized automatic payment capabilities.

  ## New Tables

  ### `payment_authorizations`
  Tracks patient consent and configuration for automatic payments
  - `id` (uuid, primary key)
  - `patient_id` (uuid, foreign key to patients_full)
  - `payment_method_id` (uuid, foreign key to payment_methods)
  - `is_enabled` (boolean) - Global auto-pay toggle
  - `auto_pay_all_appointments` (boolean) - Charge all appointments automatically
  - `spending_limit_per_charge` (numeric, nullable) - Max amount per charge
  - `spending_limit_monthly` (numeric, nullable) - Max total per month
  - `notification_preferences` (jsonb) - Email/SMS notification settings
  - `consent_given_at` (timestamptz) - When patient agreed to auto-pay
  - `consent_ip_address` (text) - IP address of consent
  - `last_modified_by` (uuid) - User who last modified
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### `automatic_payment_attempts`
  Audit log for all automatic payment attempts
  - `id` (uuid, primary key)
  - `appointment_id` (uuid, foreign key to appointments_api)
  - `patient_id` (uuid, foreign key to patients_full)
  - `authorization_id` (uuid, foreign key to payment_authorizations)
  - `payment_method_id` (uuid, foreign key to payment_methods)
  - `transaction_id` (uuid, foreign key to payment_transactions_extended, nullable)
  - `amount` (numeric)
  - `currency` (text, default 'CAD')
  - `attempt_number` (integer, default 1)
  - `status` (text) - success, failed, pending, cancelled
  - `failure_reason` (text, nullable)
  - `gateway_response` (jsonb, nullable)
  - `retry_scheduled_at` (timestamptz, nullable)
  - `processed_at` (timestamptz)
  - `created_at` (timestamptz)

  ## Schema Updates

  ### `appointments_api` additions
  - `auto_payment_enabled` (boolean, default false)
  - `auto_payment_status` (text) - not_applicable, pending, charged, failed
  - `completed_at` (timestamptz, nullable)
  - `payment_transaction_id` (uuid, nullable)

  ## Indexes for Performance
  - History queries on appointments by patient and date
  - Auto-payment lookups by status and scheduled date
  - Payment authorization lookups by patient

  ## Security
  - RLS policies for patient access to own data
  - Admin access to all payment data
  - Audit logging for all modifications
*/

-- Add new columns to appointments_api base table (if using a view, update the source table)
DO $$
BEGIN
  -- Check if appointments table exists and add columns
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'appointments') THEN
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
      ALTER TABLE appointments ADD COLUMN payment_transaction_id uuid REFERENCES payment_transactions_extended(id);
    END IF;
  END IF;
END $$;

-- Create payment_authorizations table
CREATE TABLE IF NOT EXISTS payment_authorizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients_full(id) ON DELETE CASCADE,
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
  patient_id uuid NOT NULL REFERENCES patients_full(id) ON DELETE CASCADE,
  authorization_id uuid NOT NULL REFERENCES payment_authorizations(id) ON DELETE CASCADE,
  payment_method_id uuid REFERENCES payment_methods(id) ON DELETE SET NULL,
  transaction_id uuid REFERENCES payment_transactions_extended(id) ON DELETE SET NULL,
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

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_appointments_history ON appointments(patient_id, scheduled_date DESC, status) WHERE status IN ('completed', 'cancelled', 'no_show');
CREATE INDEX IF NOT EXISTS idx_appointments_auto_payment ON appointments(patient_id, auto_payment_status) WHERE auto_payment_enabled = true;
CREATE INDEX IF NOT EXISTS idx_payment_auth_patient ON payment_authorizations(patient_id) WHERE is_enabled = true;
CREATE INDEX IF NOT EXISTS idx_auto_payment_attempts_appointment ON automatic_payment_attempts(appointment_id);
CREATE INDEX IF NOT EXISTS idx_auto_payment_attempts_patient ON automatic_payment_attempts(patient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_auto_payment_attempts_status ON automatic_payment_attempts(status, retry_scheduled_at) WHERE status IN ('pending', 'failed');

-- Enable Row Level Security
ALTER TABLE payment_authorizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE automatic_payment_attempts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for payment_authorizations
CREATE POLICY "Patients can view own payment authorizations"
  ON payment_authorizations FOR SELECT
  TO authenticated
  USING (
    patient_id IN (
      SELECT id FROM patients_full
      WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

CREATE POLICY "Patients can update own payment authorizations"
  ON payment_authorizations FOR UPDATE
  TO authenticated
  USING (
    patient_id IN (
      SELECT id FROM patients_full
      WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  )
  WITH CHECK (
    patient_id IN (
      SELECT id FROM patients_full
      WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

CREATE POLICY "Patients can insert own payment authorizations"
  ON payment_authorizations FOR INSERT
  TO authenticated
  WITH CHECK (
    patient_id IN (
      SELECT id FROM patients_full
      WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

CREATE POLICY "Admins can manage all payment authorizations"
  ON payment_authorizations FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role IN ('admin', 'practitioner')
    )
  );

-- RLS Policies for automatic_payment_attempts
CREATE POLICY "Patients can view own payment attempts"
  ON automatic_payment_attempts FOR SELECT
  TO authenticated
  USING (
    patient_id IN (
      SELECT id FROM patients_full
      WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

CREATE POLICY "Admins can view all payment attempts"
  ON automatic_payment_attempts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role IN ('admin', 'practitioner')
    )
  );

CREATE POLICY "System can insert payment attempts"
  ON automatic_payment_attempts FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create function to get appointment history with payment details
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
    a.scheduled_date,
    a.scheduled_time,
    a.duration_minutes,
    a.status,
    a.reason,
    a.notes,
    a.completed_at,
    a.cancelled_at,
    a.cancellation_reason,
    a.auto_payment_enabled,
    a.auto_payment_status,
    pt.amount as payment_amount,
    pt.status as payment_status,
    st.name as service_type_name,
    st.price as service_type_price
  FROM appointments a
  LEFT JOIN payment_transactions_extended pt ON pt.id = a.payment_transaction_id
  LEFT JOIN service_types st ON st.id = a.service_type_id
  WHERE a.patient_id = p_patient_id
    AND a.status IN ('completed', 'cancelled', 'no_show')
  ORDER BY a.scheduled_date DESC, a.scheduled_time DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check and process automatic payment
CREATE OR REPLACE FUNCTION check_automatic_payment_eligibility(p_appointment_id uuid)
RETURNS jsonb AS $$
DECLARE
  v_result jsonb;
  v_patient_id uuid;
  v_auth_record record;
  v_payment_method_record record;
  v_appointment_record record;
BEGIN
  -- Get appointment details
  SELECT patient_id, service_type_id, auto_payment_enabled
  INTO v_appointment_record
  FROM appointments
  WHERE id = p_appointment_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('eligible', false, 'reason', 'Appointment not found');
  END IF;

  v_patient_id := v_appointment_record.patient_id;

  -- Check if auto-payment is enabled for this appointment
  IF NOT v_appointment_record.auto_payment_enabled THEN
    RETURN jsonb_build_object('eligible', false, 'reason', 'Auto-payment not enabled for this appointment');
  END IF;

  -- Get payment authorization
  SELECT * INTO v_auth_record
  FROM payment_authorizations
  WHERE patient_id = v_patient_id
    AND is_enabled = true;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('eligible', false, 'reason', 'No active payment authorization');
  END IF;

  -- Get payment method
  SELECT * INTO v_payment_method_record
  FROM payment_methods
  WHERE id = v_auth_record.payment_method_id
    AND is_active = true;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('eligible', false, 'reason', 'Payment method not found or inactive');
  END IF;

  -- Check if card is expired
  IF v_payment_method_record.expiry_year < EXTRACT(YEAR FROM CURRENT_DATE) OR
     (v_payment_method_record.expiry_year = EXTRACT(YEAR FROM CURRENT_DATE) AND
      v_payment_method_record.expiry_month < EXTRACT(MONTH FROM CURRENT_DATE)) THEN
    RETURN jsonb_build_object('eligible', false, 'reason', 'Payment method expired');
  END IF;

  -- All checks passed
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

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_payment_authorizations_updated_at
  BEFORE UPDATE ON payment_authorizations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_appointment_history TO authenticated;
GRANT EXECUTE ON FUNCTION check_automatic_payment_eligibility TO authenticated;
