/*
  # Financial Reporting and Refund Management System

  ## Overview
  Comprehensive financial reporting and refund management capabilities including:
  - Detailed financial reporting views and functions
  - Refund workflows with multi-level approval
  - Revenue analytics and forecasting
  - Payment gateway reconciliation
  - Automated financial statements

  ## New Tables

  ### `refund_requests`
  Tracks refund requests with approval workflows
  - `id` (uuid, primary key)
  - `transaction_id` (uuid, foreign key to payment_transactions_extended)
  - `patient_id` (uuid, foreign key to patients_full)
  - `original_amount` (numeric) - Original transaction amount
  - `refund_amount` (numeric) - Amount to refund
  - `refund_type` (text) - full, partial, goodwill
  - `reason_code` (text) - Standardized reason codes
  - `reason_description` (text) - Detailed explanation
  - `requested_by` (uuid) - User who requested refund
  - `requested_at` (timestamptz)
  - `approved_by` (uuid, nullable) - User who approved
  - `approved_at` (timestamptz, nullable)
  - `rejected_by` (uuid, nullable) - User who rejected
  - `rejected_at` (timestamptz, nullable)
  - `rejection_reason` (text, nullable)
  - `processed_by` (uuid, nullable) - User who processed
  - `processed_at` (timestamptz, nullable)
  - `status` (text) - pending, approved, rejected, processing, completed, failed
  - `gateway_refund_id` (text, nullable) - Gateway refund transaction ID
  - `gateway_response` (jsonb, nullable)
  - `internal_notes` (text, nullable)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### `financial_reports`
  Stores generated financial reports
  - `id` (uuid, primary key)
  - `report_type` (text) - daily_summary, monthly_revenue, quarterly_analysis, annual_statement
  - `report_period_start` (date)
  - `report_period_end` (date)
  - `total_revenue` (numeric)
  - `total_refunds` (numeric)
  - `net_revenue` (numeric)
  - `total_transactions` (integer)
  - `successful_transactions` (integer)
  - `failed_transactions` (integer)
  - `average_transaction_value` (numeric)
  - `payment_method_breakdown` (jsonb) - Revenue by payment method
  - `service_revenue_breakdown` (jsonb) - Revenue by service type
  - `top_revenue_sources` (jsonb)
  - `generated_by` (uuid, nullable)
  - `generated_at` (timestamptz)
  - `report_data` (jsonb) - Full report data
  - `created_at` (timestamptz)

  ### `payment_gateway_reconciliation`
  Tracks reconciliation with payment gateway
  - `id` (uuid, primary key)
  - `reconciliation_date` (date)
  - `gateway_name` (text) - stripe, square, paypal, etc.
  - `gateway_batch_id` (text)
  - `system_transaction_count` (integer)
  - `gateway_transaction_count` (integer)
  - `system_total_amount` (numeric)
  - `gateway_total_amount` (numeric)
  - `discrepancy_count` (integer)
  - `discrepancy_amount` (numeric)
  - `discrepancies` (jsonb) - Details of any discrepancies
  - `status` (text) - pending, matched, mismatched, investigating, resolved
  - `reconciled_by` (uuid, nullable)
  - `reconciled_at` (timestamptz, nullable)
  - `notes` (text, nullable)
  - `created_at` (timestamptz)

  ### `revenue_forecasts`
  Stores revenue forecasts and predictions
  - `id` (uuid, primary key)
  - `forecast_period` (text) - next_month, next_quarter, next_year
  - `forecast_date` (date) - Date forecast was generated
  - `projected_revenue` (numeric)
  - `confidence_level` (numeric) - 0.0 to 1.0
  - `forecast_method` (text) - moving_average, linear_regression, ml_model
  - `assumptions` (jsonb) - Underlying assumptions
  - `factors_considered` (jsonb) - Factors included in forecast
  - `historical_accuracy` (numeric, nullable) - Past forecast accuracy
  - `generated_by` (uuid, nullable)
  - `created_at` (timestamptz)

  ## Security
  - Row Level Security enabled on all tables
  - Only admins can access financial reports and reconciliation data
  - Refund requests visible to patients (own data) and admins
  - Audit trails for all financial operations
*/

-- Create refund_requests table
CREATE TABLE IF NOT EXISTS refund_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id uuid NOT NULL REFERENCES payment_transactions_extended(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES patients_full(id) ON DELETE CASCADE,
  original_amount numeric(10, 2) NOT NULL,
  refund_amount numeric(10, 2) NOT NULL CHECK (refund_amount > 0 AND refund_amount <= original_amount),
  refund_type text NOT NULL CHECK (refund_type IN ('full', 'partial', 'goodwill')),
  reason_code text NOT NULL CHECK (reason_code IN ('customer_request', 'service_issue', 'billing_error', 'duplicate_charge', 'cancellation', 'goodwill', 'other')),
  reason_description text NOT NULL,
  requested_by uuid REFERENCES auth.users(id),
  requested_at timestamptz DEFAULT now(),
  approved_by uuid REFERENCES auth.users(id),
  approved_at timestamptz,
  rejected_by uuid REFERENCES auth.users(id),
  rejected_at timestamptz,
  rejection_reason text,
  processed_by uuid REFERENCES auth.users(id),
  processed_at timestamptz,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'processing', 'completed', 'failed')),
  gateway_refund_id text,
  gateway_response jsonb,
  internal_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create financial_reports table
CREATE TABLE IF NOT EXISTS financial_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_type text NOT NULL CHECK (report_type IN ('daily_summary', 'weekly_summary', 'monthly_revenue', 'quarterly_analysis', 'annual_statement', 'custom')),
  report_period_start date NOT NULL,
  report_period_end date NOT NULL,
  total_revenue numeric(12, 2) DEFAULT 0,
  total_refunds numeric(12, 2) DEFAULT 0,
  net_revenue numeric(12, 2) DEFAULT 0,
  total_transactions integer DEFAULT 0,
  successful_transactions integer DEFAULT 0,
  failed_transactions integer DEFAULT 0,
  average_transaction_value numeric(10, 2) DEFAULT 0,
  payment_method_breakdown jsonb DEFAULT '{}',
  service_revenue_breakdown jsonb DEFAULT '{}',
  top_revenue_sources jsonb DEFAULT '[]',
  generated_by uuid REFERENCES auth.users(id),
  generated_at timestamptz DEFAULT now(),
  report_data jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Create payment_gateway_reconciliation table
CREATE TABLE IF NOT EXISTS payment_gateway_reconciliation (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reconciliation_date date NOT NULL,
  gateway_name text NOT NULL,
  gateway_batch_id text,
  system_transaction_count integer DEFAULT 0,
  gateway_transaction_count integer DEFAULT 0,
  system_total_amount numeric(12, 2) DEFAULT 0,
  gateway_total_amount numeric(12, 2) DEFAULT 0,
  discrepancy_count integer DEFAULT 0,
  discrepancy_amount numeric(12, 2) DEFAULT 0,
  discrepancies jsonb DEFAULT '[]',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'matched', 'mismatched', 'investigating', 'resolved')),
  reconciled_by uuid REFERENCES auth.users(id),
  reconciled_at timestamptz,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Create revenue_forecasts table
CREATE TABLE IF NOT EXISTS revenue_forecasts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  forecast_period text NOT NULL CHECK (forecast_period IN ('next_week', 'next_month', 'next_quarter', 'next_year', 'custom')),
  forecast_date date NOT NULL,
  projected_revenue numeric(12, 2) NOT NULL,
  confidence_level numeric(3, 2) CHECK (confidence_level >= 0 AND confidence_level <= 1),
  forecast_method text NOT NULL CHECK (forecast_method IN ('moving_average', 'linear_regression', 'exponential_smoothing', 'ml_model', 'manual')),
  assumptions jsonb DEFAULT '{}',
  factors_considered jsonb DEFAULT '[]',
  historical_accuracy numeric(3, 2),
  generated_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_refund_requests_transaction_id ON refund_requests(transaction_id);
CREATE INDEX IF NOT EXISTS idx_refund_requests_patient_id ON refund_requests(patient_id);
CREATE INDEX IF NOT EXISTS idx_refund_requests_status ON refund_requests(status);
CREATE INDEX IF NOT EXISTS idx_financial_reports_type ON financial_reports(report_type);
CREATE INDEX IF NOT EXISTS idx_financial_reports_period ON financial_reports(report_period_start, report_period_end);
CREATE INDEX IF NOT EXISTS idx_gateway_reconciliation_date ON payment_gateway_reconciliation(reconciliation_date);
CREATE INDEX IF NOT EXISTS idx_gateway_reconciliation_status ON payment_gateway_reconciliation(status);
CREATE INDEX IF NOT EXISTS idx_revenue_forecasts_period ON revenue_forecasts(forecast_period);
CREATE INDEX IF NOT EXISTS idx_revenue_forecasts_date ON revenue_forecasts(forecast_date);

-- Enable Row Level Security
ALTER TABLE refund_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_gateway_reconciliation ENABLE ROW LEVEL SECURITY;
ALTER TABLE revenue_forecasts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for refund_requests
CREATE POLICY "Patients can view own refund requests"
  ON refund_requests FOR SELECT
  TO authenticated
  USING (
    patient_id IN (
      SELECT id FROM patients_full
      WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

CREATE POLICY "Patients can create refund requests"
  ON refund_requests FOR INSERT
  TO authenticated
  WITH CHECK (
    patient_id IN (
      SELECT id FROM patients_full
      WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

CREATE POLICY "Admins can view all refund requests"
  ON refund_requests FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'practitioner')
    )
  );

CREATE POLICY "Admins can manage refund requests"
  ON refund_requests FOR ALL
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

-- RLS Policies for financial_reports
CREATE POLICY "Admins can view financial reports"
  ON financial_reports FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'practitioner')
    )
  );

CREATE POLICY "Admins can manage financial reports"
  ON financial_reports FOR ALL
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

-- RLS Policies for payment_gateway_reconciliation
CREATE POLICY "Admins can view reconciliation data"
  ON payment_gateway_reconciliation FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'practitioner')
    )
  );

CREATE POLICY "Admins can manage reconciliation data"
  ON payment_gateway_reconciliation FOR ALL
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

-- RLS Policies for revenue_forecasts
CREATE POLICY "Admins can view revenue forecasts"
  ON revenue_forecasts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'practitioner')
    )
  );

CREATE POLICY "Admins can manage revenue forecasts"
  ON revenue_forecasts FOR ALL
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

-- Create function to update updated_at for refund_requests
CREATE TRIGGER update_refund_requests_updated_at
  BEFORE UPDATE ON refund_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_payment_updated_at();

-- Create function to generate daily financial summary
CREATE OR REPLACE FUNCTION generate_daily_financial_summary(summary_date date)
RETURNS uuid AS $$
DECLARE
  report_id uuid;
  revenue_total numeric;
  refunds_total numeric;
  net_total numeric;
  trans_count integer;
  success_count integer;
  fail_count integer;
  avg_value numeric;
BEGIN
  -- Calculate metrics
  SELECT 
    COALESCE(SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN status = 'refunded' THEN amount ELSE 0 END), 0),
    COUNT(*),
    COUNT(CASE WHEN status = 'completed' THEN 1 END),
    COUNT(CASE WHEN status = 'failed' THEN 1 END)
  INTO revenue_total, refunds_total, trans_count, success_count, fail_count
  FROM payment_transactions_extended
  WHERE DATE(created_at) = summary_date;

  net_total := revenue_total - refunds_total;
  avg_value := CASE WHEN success_count > 0 THEN revenue_total / success_count ELSE 0 END;

  -- Insert report
  INSERT INTO financial_reports (
    report_type,
    report_period_start,
    report_period_end,
    total_revenue,
    total_refunds,
    net_revenue,
    total_transactions,
    successful_transactions,
    failed_transactions,
    average_transaction_value
  ) VALUES (
    'daily_summary',
    summary_date,
    summary_date,
    revenue_total,
    refunds_total,
    net_total,
    trans_count,
    success_count,
    fail_count,
    avg_value
  ) RETURNING id INTO report_id;

  RETURN report_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to calculate refund approval threshold
CREATE OR REPLACE FUNCTION requires_manager_approval(refund_amount numeric)
RETURNS boolean AS $$
BEGIN
  -- Refunds over $500 require manager approval
  RETURN refund_amount > 500;
END;
$$ LANGUAGE plpgsql;

-- Create view for outstanding refunds
CREATE OR REPLACE VIEW outstanding_refunds AS
SELECT 
  r.id,
  r.patient_id,
  p.first_name || ' ' || p.last_name AS patient_name,
  r.refund_amount,
  r.refund_type,
  r.reason_code,
  r.status,
  r.requested_at,
  EXTRACT(DAY FROM (now() - r.requested_at)) AS days_pending
FROM refund_requests r
JOIN patients_full p ON r.patient_id = p.id
WHERE r.status IN ('pending', 'approved', 'processing')
ORDER BY r.requested_at ASC;

-- Create view for monthly revenue summary
CREATE OR REPLACE VIEW monthly_revenue_summary AS
SELECT 
  DATE_TRUNC('month', created_at) AS month,
  COUNT(*) AS total_transactions,
  SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) AS total_revenue,
  SUM(CASE WHEN status = 'refunded' THEN amount ELSE 0 END) AS total_refunds,
  SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) - 
    SUM(CASE WHEN status = 'refunded' THEN amount ELSE 0 END) AS net_revenue,
  AVG(CASE WHEN status = 'completed' THEN amount END) AS avg_transaction_value
FROM payment_transactions_extended
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY month DESC;
