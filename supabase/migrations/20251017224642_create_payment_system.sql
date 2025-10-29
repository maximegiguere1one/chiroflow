/*
  # Payment Management System

  ## Overview
  Complete payment management system supporting:
  - Multiple payment methods per patient
  - Patient portal access for self-service
  - Admin management capabilities
  - Recurring billing and subscriptions
  - Transaction history and audit trails

  ## New Tables

  ### `payment_methods`
  Stores tokenized payment method information for patients
  - `id` (uuid, primary key)
  - `patient_id` (uuid, foreign key to patients_full)
  - `card_token` (text) - Tokenized card data from payment gateway
  - `card_brand` (text) - Visa, Mastercard, Amex, etc.
  - `last_four_digits` (text) - Last 4 digits for display
  - `expiry_month` (integer) - Card expiry month (1-12)
  - `expiry_year` (integer) - Card expiry year (YYYY)
  - `cardholder_name` (text) - Name on card
  - `billing_address_line1` (text)
  - `billing_address_line2` (text, nullable)
  - `billing_city` (text)
  - `billing_province` (text)
  - `billing_postal_code` (text)
  - `billing_country` (text, default 'CA')
  - `card_nickname` (text, nullable) - User-friendly label
  - `is_primary` (boolean, default false) - Primary payment method flag
  - `is_verified` (boolean, default false) - Verification status
  - `is_active` (boolean, default true) - Active status
  - `gateway_customer_id` (text, nullable) - Payment gateway customer ID
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### `payment_subscriptions`
  Manages recurring billing schedules
  - `id` (uuid, primary key)
  - `patient_id` (uuid, foreign key to patients_full)
  - `payment_method_id` (uuid, foreign key to payment_methods)
  - `subscription_type` (text) - Type of subscription
  - `description` (text) - Subscription description
  - `amount` (numeric) - Recurring charge amount
  - `currency` (text, default 'CAD')
  - `frequency` (text) - weekly, biweekly, monthly, quarterly, yearly
  - `interval_count` (integer, default 1) - Number of intervals between charges
  - `start_date` (date) - Subscription start date
  - `next_billing_date` (date) - Next scheduled charge
  - `end_date` (date, nullable) - Optional end date
  - `status` (text) - active, paused, cancelled, expired
  - `grace_period_days` (integer, default 3) - Days before marking failed
  - `retry_attempts` (integer, default 0) - Failed payment retry count
  - `max_retry_attempts` (integer, default 3)
  - `created_by` (uuid) - User who created subscription
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### `payment_transactions_extended`
  Extended transaction history with gateway details
  - `id` (uuid, primary key)
  - `patient_id` (uuid, foreign key to patients_full)
  - `invoice_id` (uuid, foreign key to billing, nullable)
  - `payment_method_id` (uuid, foreign key to payment_methods, nullable)
  - `subscription_id` (uuid, foreign key to payment_subscriptions, nullable)
  - `transaction_type` (text) - charge, refund, adjustment, verification
  - `amount` (numeric)
  - `currency` (text, default 'CAD')
  - `status` (text) - pending, completed, failed, refunded
  - `gateway_transaction_id` (text, nullable) - Payment gateway transaction ID
  - `gateway_response` (jsonb, nullable) - Full gateway response
  - `failure_reason` (text, nullable) - Reason for failure
  - `failure_code` (text, nullable) - Gateway failure code
  - `processed_by` (uuid, nullable) - User who processed transaction
  - `processed_at` (timestamptz, nullable)
  - `refunded_at` (timestamptz, nullable)
  - `refund_reason` (text, nullable)
  - `notes` (text, nullable)
  - `metadata` (jsonb, default '{}')
  - `created_at` (timestamptz)

  ### `payment_schedule_logs`
  Audit trail for automated billing attempts
  - `id` (uuid, primary key)
  - `subscription_id` (uuid, foreign key to payment_subscriptions)
  - `transaction_id` (uuid, foreign key to payment_transactions_extended, nullable)
  - `scheduled_date` (date) - Originally scheduled date
  - `attempted_at` (timestamptz) - When attempt was made
  - `status` (text) - success, failed, skipped, pending
  - `retry_number` (integer, default 0)
  - `error_message` (text, nullable)
  - `created_at` (timestamptz)

  ### `payment_method_audit_log`
  Audit trail for payment method changes
  - `id` (uuid, primary key)
  - `payment_method_id` (uuid, foreign key to payment_methods)
  - `action` (text) - added, updated, deleted, verified, set_primary
  - `changed_by` (uuid) - User who made the change
  - `user_role` (text) - patient, admin, practitioner
  - `old_values` (jsonb, nullable)
  - `new_values` (jsonb, nullable)
  - `ip_address` (text, nullable)
  - `user_agent` (text, nullable)
  - `created_at` (timestamptz)

  ## Security
  - Row Level Security enabled on all tables
  - Patients can only access their own payment methods and transactions
  - Admins have full access to all payment data
  - Audit logs track all changes for compliance
*/

-- Create payment_methods table
CREATE TABLE IF NOT EXISTS payment_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients_full(id) ON DELETE CASCADE,
  card_token text NOT NULL,
  card_brand text NOT NULL,
  last_four_digits text NOT NULL,
  expiry_month integer NOT NULL CHECK (expiry_month >= 1 AND expiry_month <= 12),
  expiry_year integer NOT NULL CHECK (expiry_year >= 2024),
  cardholder_name text NOT NULL,
  billing_address_line1 text NOT NULL,
  billing_address_line2 text,
  billing_city text NOT NULL,
  billing_province text NOT NULL,
  billing_postal_code text NOT NULL,
  billing_country text NOT NULL DEFAULT 'CA',
  card_nickname text,
  is_primary boolean DEFAULT false,
  is_verified boolean DEFAULT false,
  is_active boolean DEFAULT true,
  gateway_customer_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create payment_subscriptions table
CREATE TABLE IF NOT EXISTS payment_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients_full(id) ON DELETE CASCADE,
  payment_method_id uuid REFERENCES payment_methods(id) ON DELETE SET NULL,
  subscription_type text NOT NULL,
  description text NOT NULL,
  amount numeric(10, 2) NOT NULL CHECK (amount > 0),
  currency text NOT NULL DEFAULT 'CAD',
  frequency text NOT NULL CHECK (frequency IN ('weekly', 'biweekly', 'monthly', 'quarterly', 'yearly', 'custom')),
  interval_count integer DEFAULT 1 CHECK (interval_count > 0),
  start_date date NOT NULL,
  next_billing_date date NOT NULL,
  end_date date,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'cancelled', 'expired')),
  grace_period_days integer DEFAULT 3,
  retry_attempts integer DEFAULT 0,
  max_retry_attempts integer DEFAULT 3,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create payment_transactions_extended table
CREATE TABLE IF NOT EXISTS payment_transactions_extended (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients_full(id) ON DELETE CASCADE,
  invoice_id uuid REFERENCES billing(id) ON DELETE SET NULL,
  payment_method_id uuid REFERENCES payment_methods(id) ON DELETE SET NULL,
  subscription_id uuid REFERENCES payment_subscriptions(id) ON DELETE SET NULL,
  transaction_type text NOT NULL CHECK (transaction_type IN ('charge', 'refund', 'adjustment', 'verification')),
  amount numeric(10, 2) NOT NULL,
  currency text NOT NULL DEFAULT 'CAD',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  gateway_transaction_id text,
  gateway_response jsonb,
  failure_reason text,
  failure_code text,
  processed_by uuid REFERENCES auth.users(id),
  processed_at timestamptz,
  refunded_at timestamptz,
  refund_reason text,
  notes text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Create payment_schedule_logs table
CREATE TABLE IF NOT EXISTS payment_schedule_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id uuid NOT NULL REFERENCES payment_subscriptions(id) ON DELETE CASCADE,
  transaction_id uuid REFERENCES payment_transactions_extended(id) ON DELETE SET NULL,
  scheduled_date date NOT NULL,
  attempted_at timestamptz NOT NULL,
  status text NOT NULL CHECK (status IN ('success', 'failed', 'skipped', 'pending')),
  retry_number integer DEFAULT 0,
  error_message text,
  created_at timestamptz DEFAULT now()
);

-- Create payment_method_audit_log table
CREATE TABLE IF NOT EXISTS payment_method_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_method_id uuid REFERENCES payment_methods(id) ON DELETE CASCADE,
  action text NOT NULL CHECK (action IN ('added', 'updated', 'deleted', 'verified', 'set_primary')),
  changed_by uuid REFERENCES auth.users(id),
  user_role text NOT NULL CHECK (user_role IN ('patient', 'admin', 'practitioner')),
  old_values jsonb,
  new_values jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_payment_methods_patient_id ON payment_methods(patient_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_is_primary ON payment_methods(is_primary) WHERE is_primary = true;
CREATE INDEX IF NOT EXISTS idx_payment_methods_is_active ON payment_methods(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_payment_subscriptions_patient_id ON payment_subscriptions(patient_id);
CREATE INDEX IF NOT EXISTS idx_payment_subscriptions_status ON payment_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_payment_subscriptions_next_billing ON payment_subscriptions(next_billing_date) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_payment_transactions_patient_id ON payment_transactions_extended(patient_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_invoice_id ON payment_transactions_extended(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_subscription_id ON payment_transactions_extended(subscription_id);
CREATE INDEX IF NOT EXISTS idx_payment_schedule_logs_subscription_id ON payment_schedule_logs(subscription_id);

-- Enable Row Level Security
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions_extended ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_schedule_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_method_audit_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for payment_methods
CREATE POLICY "Patients can view own payment methods"
  ON payment_methods FOR SELECT
  TO authenticated
  USING (
    patient_id IN (
      SELECT id FROM patients_full
      WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

CREATE POLICY "Admins can view all payment methods"
  ON payment_methods FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'practitioner')
    )
  );

CREATE POLICY "Patients can insert own payment methods"
  ON payment_methods FOR INSERT
  TO authenticated
  WITH CHECK (
    patient_id IN (
      SELECT id FROM patients_full
      WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

CREATE POLICY "Admins can insert any payment methods"
  ON payment_methods FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'practitioner')
    )
  );

CREATE POLICY "Patients can update own payment methods"
  ON payment_methods FOR UPDATE
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

CREATE POLICY "Admins can update any payment methods"
  ON payment_methods FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'practitioner')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'practitioner')
    )
  );

CREATE POLICY "Patients can delete own payment methods"
  ON payment_methods FOR DELETE
  TO authenticated
  USING (
    patient_id IN (
      SELECT id FROM patients_full
      WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

CREATE POLICY "Admins can delete any payment methods"
  ON payment_methods FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'practitioner')
    )
  );

-- RLS Policies for payment_subscriptions
CREATE POLICY "Patients can view own subscriptions"
  ON payment_subscriptions FOR SELECT
  TO authenticated
  USING (
    patient_id IN (
      SELECT id FROM patients_full
      WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

CREATE POLICY "Admins can view all subscriptions"
  ON payment_subscriptions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'practitioner')
    )
  );

CREATE POLICY "Admins can manage subscriptions"
  ON payment_subscriptions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'practitioner')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'practitioner')
    )
  );

-- RLS Policies for payment_transactions_extended
CREATE POLICY "Patients can view own transactions"
  ON payment_transactions_extended FOR SELECT
  TO authenticated
  USING (
    patient_id IN (
      SELECT id FROM patients_full
      WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

CREATE POLICY "Admins can view all transactions"
  ON payment_transactions_extended FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'practitioner')
    )
  );

CREATE POLICY "Admins can manage transactions"
  ON payment_transactions_extended FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'practitioner')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'practitioner')
    )
  );

-- RLS Policies for payment_schedule_logs
CREATE POLICY "Admins can view all schedule logs"
  ON payment_schedule_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'practitioner')
    )
  );

CREATE POLICY "Admins can manage schedule logs"
  ON payment_schedule_logs FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'practitioner')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'practitioner')
    )
  );

-- RLS Policies for payment_method_audit_log
CREATE POLICY "Admins can view all audit logs"
  ON payment_method_audit_log FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'practitioner')
    )
  );

CREATE POLICY "System can insert audit logs"
  ON payment_method_audit_log FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_payment_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_payment_methods_updated_at
  BEFORE UPDATE ON payment_methods
  FOR EACH ROW
  EXECUTE FUNCTION update_payment_updated_at();

CREATE TRIGGER update_payment_subscriptions_updated_at
  BEFORE UPDATE ON payment_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_payment_updated_at();

-- Create function to ensure only one primary payment method per patient
CREATE OR REPLACE FUNCTION ensure_single_primary_payment_method()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_primary = true THEN
    UPDATE payment_methods
    SET is_primary = false
    WHERE patient_id = NEW.patient_id
    AND id != NEW.id
    AND is_primary = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for primary payment method
CREATE TRIGGER ensure_single_primary_payment
  BEFORE INSERT OR UPDATE ON payment_methods
  FOR EACH ROW
  WHEN (NEW.is_primary = true)
  EXECUTE FUNCTION ensure_single_primary_payment_method();
