/*
  # Méga Migration Part 3 - Communication & Forms
  
  ## Tables créées
  12. custom_email_templates
  13. email_logs
  14. intake_forms
  15. invoices
  16. patient_progress_tracking
*/

-- 12. custom_email_templates
CREATE TABLE IF NOT EXISTS custom_email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  template_name text NOT NULL,
  template_type text NOT NULL,
  subject text NOT NULL,
  body_html text NOT NULL,
  body_text text,
  variables jsonb,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_template_type CHECK (
    template_type IN ('appointment_confirmation', 'appointment_reminder', 
                      'appointment_cancellation', 'payment_receipt', 
                      'waitlist_invitation', 'rebooking_invitation', 
                      'followup', 'custom')
  ),
  UNIQUE(owner_id, template_name)
);

ALTER TABLE custom_email_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own email templates" ON custom_email_templates;
CREATE POLICY "Users manage own email templates"
  ON custom_email_templates FOR ALL
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_email_templates_owner ON custom_email_templates(owner_id);
CREATE INDEX IF NOT EXISTS idx_email_templates_type ON custom_email_templates(template_type);

-- 13. email_logs
CREATE TABLE IF NOT EXISTS email_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  recipient_email text NOT NULL,
  recipient_name text,
  subject text NOT NULL,
  template_type text,
  status text DEFAULT 'pending',
  sent_at timestamptz,
  delivered_at timestamptz,
  opened_at timestamptz,
  clicked_at timestamptz,
  bounced_at timestamptz,
  error_message text,
  metadata jsonb,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_email_status CHECK (
    status IN ('pending', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'failed')
  )
);

ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own email logs" ON email_logs;
CREATE POLICY "Users view own email logs"
  ON email_logs FOR SELECT
  TO authenticated
  USING (owner_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_email_logs_owner ON email_logs(owner_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_recipient ON email_logs(recipient_email);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_logs_created ON email_logs(created_at DESC);

-- 14. intake_forms
CREATE TABLE IF NOT EXISTS intake_forms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  contact_id uuid REFERENCES contacts(id) ON DELETE CASCADE,
  form_data jsonb NOT NULL,
  status text DEFAULT 'draft',
  submitted_at timestamptz,
  reviewed_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_form_status CHECK (
    status IN ('draft', 'submitted', 'reviewed', 'archived')
  )
);

ALTER TABLE intake_forms ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own intake forms" ON intake_forms;
CREATE POLICY "Users manage own intake forms"
  ON intake_forms FOR ALL
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_intake_forms_owner ON intake_forms(owner_id);
CREATE INDEX IF NOT EXISTS idx_intake_forms_contact ON intake_forms(contact_id);
CREATE INDEX IF NOT EXISTS idx_intake_forms_status ON intake_forms(status);

-- 15. invoices
CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  contact_id uuid REFERENCES contacts(id) ON DELETE SET NULL NOT NULL,
  invoice_number text NOT NULL,
  invoice_date date DEFAULT CURRENT_DATE,
  due_date date,
  subtotal decimal(10,2) DEFAULT 0,
  tax_amount decimal(10,2) DEFAULT 0,
  total_amount decimal(10,2) NOT NULL,
  amount_paid decimal(10,2) DEFAULT 0,
  balance_due decimal(10,2) GENERATED ALWAYS AS (total_amount - amount_paid) STORED,
  status text DEFAULT 'draft',
  line_items jsonb,
  notes text,
  payment_terms text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_invoice_status CHECK (
    status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')
  ),
  UNIQUE(owner_id, invoice_number)
);

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own invoices" ON invoices;
CREATE POLICY "Users manage own invoices"
  ON invoices FOR ALL
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_invoices_owner ON invoices(owner_id);
CREATE INDEX IF NOT EXISTS idx_invoices_contact ON invoices(contact_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_invoices_number ON invoices(invoice_number);

-- 16. patient_progress_tracking
CREATE TABLE IF NOT EXISTS patient_progress_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  contact_id uuid REFERENCES contacts(id) ON DELETE CASCADE NOT NULL,
  measurement_date date DEFAULT CURRENT_DATE,
  pain_level int CHECK (pain_level >= 0 AND pain_level <= 10),
  mobility_score int CHECK (mobility_score >= 0 AND mobility_score <= 100),
  function_score int CHECK (function_score >= 0 AND function_score <= 100),
  quality_of_life_score int CHECK (quality_of_life_score >= 0 AND quality_of_life_score <= 100),
  notes text,
  measured_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE patient_progress_tracking ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own progress tracking" ON patient_progress_tracking;
CREATE POLICY "Users manage own progress tracking"
  ON patient_progress_tracking FOR ALL
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_progress_owner ON patient_progress_tracking(owner_id);
CREATE INDEX IF NOT EXISTS idx_progress_contact ON patient_progress_tracking(contact_id);
CREATE INDEX IF NOT EXISTS idx_progress_date ON patient_progress_tracking(measurement_date DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON custom_email_templates TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON email_logs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON intake_forms TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON invoices TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON patient_progress_tracking TO authenticated;

COMMENT ON TABLE custom_email_templates IS 'Templates d''emails personnalisés';
COMMENT ON TABLE email_logs IS 'Historique complet des emails envoyés';
COMMENT ON TABLE intake_forms IS 'Formulaires d''admission patients';
COMMENT ON TABLE invoices IS 'Factures pour les patients';
COMMENT ON TABLE patient_progress_tracking IS 'Suivi de l''évolution des patients';
