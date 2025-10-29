/*
  # Phase 2 Advanced Features - Database Schema

  ## New Tables
  
  ### 1. patient_portal_users
  - Links patients to portal authentication
  - Stores portal-specific settings and preferences
  - Tracks last login and activity
  
  ### 2. patient_portal_sessions
  - Manages secure patient portal sessions
  - Tracks session expiry and activity
  - Ensures secure logout and session management
  
  ### 3. insurance_claims
  - Tracks insurance claim submissions
  - Stores claim status and provider information
  - Links to invoices and patients
  
  ### 4. payment_transactions
  - Detailed payment transaction history
  - Links to invoices with transaction details
  - Tracks payment methods and confirmations
  
  ### 5. workflow_automation
  - Stores automated workflow configurations
  - Defines triggers and actions for communications
  - Enables/disables workflow automation
  
  ### 6. analytics_snapshots
  - Historical analytics data for trending
  - Periodic snapshots of key metrics
  - Enables comparison over time
  
  ### 7. document_templates
  - Stores reusable document templates
  - Supports invoices, reports, and forms
  - Customizable with merge fields
  
  ## Security
  - All tables have RLS enabled
  - Policies restrict access to authenticated users
  - Patient portal tables have separate policies for patients
*/

-- Patient portal users
CREATE TABLE IF NOT EXISTS patient_portal_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients_full(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  password_hash text,
  is_active boolean DEFAULT true,
  email_verified boolean DEFAULT false,
  last_login timestamptz,
  login_count integer DEFAULT 0,
  preferences jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE patient_portal_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patients can view own portal account"
  ON patient_portal_users FOR SELECT
  TO authenticated
  USING (auth.uid()::text = id::text OR auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

CREATE POLICY "Patients can update own portal account"
  ON patient_portal_users FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = id::text)
  WITH CHECK (auth.uid()::text = id::text);

CREATE POLICY "Admins can manage all portal accounts"
  ON patient_portal_users FOR ALL
  TO authenticated
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'))
  WITH CHECK (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

-- Patient portal sessions
CREATE TABLE IF NOT EXISTS patient_portal_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  portal_user_id uuid NOT NULL REFERENCES patient_portal_users(id) ON DELETE CASCADE,
  session_token text UNIQUE NOT NULL,
  ip_address text,
  user_agent text,
  expires_at timestamptz NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE patient_portal_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sessions"
  ON patient_portal_sessions FOR SELECT
  TO authenticated
  USING (auth.uid()::text = portal_user_id::text OR auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

-- Insurance claims
CREATE TABLE IF NOT EXISTS insurance_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients_full(id) ON DELETE CASCADE,
  invoice_id uuid REFERENCES billing(id) ON DELETE SET NULL,
  claim_number text UNIQUE NOT NULL,
  insurance_provider text NOT NULL,
  policy_number text,
  claim_type text DEFAULT 'chiropractic',
  service_date date NOT NULL,
  submission_date date DEFAULT CURRENT_DATE,
  claim_amount decimal(10,2) NOT NULL,
  approved_amount decimal(10,2),
  status text DEFAULT 'pending',
  status_notes text,
  diagnostic_codes text[],
  procedure_codes text[],
  submitted_by uuid REFERENCES auth.users(id),
  processed_date date,
  payment_received_date date,
  attachments jsonb DEFAULT '[]',
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE insurance_claims ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all claims"
  ON insurance_claims FOR ALL
  TO authenticated
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role IN ('admin', 'practitioner')))
  WITH CHECK (auth.uid() IN (SELECT id FROM profiles WHERE role IN ('admin', 'practitioner')));

-- Payment transactions
CREATE TABLE IF NOT EXISTS payment_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES billing(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES patients_full(id) ON DELETE CASCADE,
  transaction_type text NOT NULL,
  amount decimal(10,2) NOT NULL,
  payment_method text NOT NULL,
  transaction_reference text,
  transaction_status text DEFAULT 'completed',
  gateway_response jsonb,
  processed_by uuid REFERENCES auth.users(id),
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all transactions"
  ON payment_transactions FOR ALL
  TO authenticated
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role IN ('admin', 'practitioner')))
  WITH CHECK (auth.uid() IN (SELECT id FROM profiles WHERE role IN ('admin', 'practitioner')));

-- Workflow automation
CREATE TABLE IF NOT EXISTS workflow_automation (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  workflow_type text NOT NULL,
  trigger_type text NOT NULL,
  trigger_config jsonb NOT NULL,
  action_type text NOT NULL,
  action_config jsonb NOT NULL,
  is_active boolean DEFAULT true,
  execution_count integer DEFAULT 0,
  last_executed_at timestamptz,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE workflow_automation ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage workflows"
  ON workflow_automation FOR ALL
  TO authenticated
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'))
  WITH CHECK (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

-- Analytics snapshots
CREATE TABLE IF NOT EXISTS analytics_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_date date NOT NULL,
  snapshot_period text NOT NULL,
  metrics jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE analytics_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view analytics snapshots"
  ON analytics_snapshots FOR SELECT
  TO authenticated
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role IN ('admin', 'practitioner')));

CREATE POLICY "System can insert analytics snapshots"
  ON analytics_snapshots FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

-- Document templates
CREATE TABLE IF NOT EXISTS document_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  template_type text NOT NULL,
  description text,
  content text NOT NULL,
  merge_fields jsonb DEFAULT '[]',
  styles jsonb DEFAULT '{}',
  is_active boolean DEFAULT true,
  is_default boolean DEFAULT false,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE document_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage templates"
  ON document_templates FOR ALL
  TO authenticated
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role IN ('admin', 'practitioner')))
  WITH CHECK (auth.uid() IN (SELECT id FROM profiles WHERE role IN ('admin', 'practitioner')));

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_portal_users_patient ON patient_portal_users(patient_id);
CREATE INDEX IF NOT EXISTS idx_portal_users_email ON patient_portal_users(email);
CREATE INDEX IF NOT EXISTS idx_portal_sessions_user ON patient_portal_sessions(portal_user_id);
CREATE INDEX IF NOT EXISTS idx_portal_sessions_token ON patient_portal_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_insurance_claims_patient ON insurance_claims(patient_id);
CREATE INDEX IF NOT EXISTS idx_insurance_claims_status ON insurance_claims(status);
CREATE INDEX IF NOT EXISTS idx_insurance_claims_provider ON insurance_claims(insurance_provider);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_invoice ON payment_transactions(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_patient ON payment_transactions(patient_id);
CREATE INDEX IF NOT EXISTS idx_workflow_automation_type ON workflow_automation(workflow_type);
CREATE INDEX IF NOT EXISTS idx_workflow_automation_active ON workflow_automation(is_active);
CREATE INDEX IF NOT EXISTS idx_analytics_snapshots_date ON analytics_snapshots(snapshot_date);
CREATE INDEX IF NOT EXISTS idx_document_templates_type ON document_templates(template_type);

-- Triggers for updated_at
CREATE TRIGGER update_patient_portal_users_updated_at
  BEFORE UPDATE ON patient_portal_users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_insurance_claims_updated_at
  BEFORE UPDATE ON insurance_claims
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_workflow_automation_updated_at
  BEFORE UPDATE ON workflow_automation
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_document_templates_updated_at
  BEFORE UPDATE ON document_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Default document templates
INSERT INTO document_templates (name, template_type, description, content, merge_fields, is_default)
VALUES 
  (
    'Invoice Standard',
    'invoice',
    'Template de facture standard',
    '<html><body><h1>Facture {{invoice_number}}</h1><p>Patient: {{patient_name}}</p><p>Date: {{service_date}}</p><p>Montant: {{total_amount}}</p></body></html>',
    '["invoice_number", "patient_name", "service_date", "total_amount"]'::jsonb,
    true
  ),
  (
    'Progress Report',
    'progress_report',
    'Rapport de progrès patient',
    '<html><body><h1>Rapport de Progrès</h1><p>Patient: {{patient_name}}</p><p>Période: {{date_range}}</p><p>Amélioration: {{improvement_percentage}}%</p></body></html>',
    '["patient_name", "date_range", "improvement_percentage"]'::jsonb,
    true
  )
ON CONFLICT DO NOTHING;