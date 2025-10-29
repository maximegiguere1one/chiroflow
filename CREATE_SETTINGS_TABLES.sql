-- Script pour créer toutes les tables de configuration
-- Exécuter chaque section une par une via execute_sql

-- ==== SERVICE TYPES POLICIES ====
CREATE POLICY "services_select_active" ON service_types FOR SELECT USING (is_active = true);
CREATE POLICY "services_select_own_all" ON service_types FOR SELECT TO authenticated USING (auth.uid() = owner_id);
CREATE POLICY "services_insert_own" ON service_types FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "services_update_own" ON service_types FOR UPDATE TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "services_delete_own" ON service_types FOR DELETE TO authenticated USING (auth.uid() = owner_id);
CREATE TRIGGER update_service_types_updated_at BEFORE UPDATE ON service_types FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==== BUSINESS HOURS TABLE ====
CREATE TABLE IF NOT EXISTS business_hours (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  day_of_week integer NOT NULL,
  day_name text NOT NULL,
  is_open boolean DEFAULT true,
  open_time time,
  close_time time,
  break_start_time time,
  break_end_time time,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_day CHECK (day_of_week BETWEEN 0 AND 6)
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_business_hours_owner_day ON business_hours(owner_id, day_of_week);
ALTER TABLE business_hours ENABLE ROW LEVEL SECURITY;
CREATE POLICY "hours_select_public" ON business_hours FOR SELECT USING (true);
CREATE POLICY "hours_insert_own" ON business_hours FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "hours_update_own" ON business_hours FOR UPDATE TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "hours_delete_own" ON business_hours FOR DELETE TO authenticated USING (auth.uid() = owner_id);
CREATE TRIGGER update_business_hours_updated_at BEFORE UPDATE ON business_hours FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==== BILLING SETTINGS TABLE ====
CREATE TABLE IF NOT EXISTS billing_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  tax_rate numeric(5,2) DEFAULT 14.975,
  tax_name text DEFAULT 'TPS/TVQ',
  include_tax_in_price boolean DEFAULT false,
  invoice_prefix text DEFAULT 'INV-',
  next_invoice_number integer DEFAULT 1001,
  accept_cash boolean DEFAULT true,
  accept_credit_card boolean DEFAULT true,
  accept_debit boolean DEFAULT true,
  accept_insurance boolean DEFAULT true,
  payment_terms_days integer DEFAULT 30,
  late_fee_percentage numeric(5,2) DEFAULT 0,
  invoice_notes text DEFAULT 'Merci de votre confiance. Pour toute question, contactez-nous.',
  receipt_footer text DEFAULT 'Cette facture a été générée électroniquement et est valide sans signature.',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_billing_owner ON billing_settings(owner_id);
ALTER TABLE billing_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "billing_select_own" ON billing_settings FOR SELECT TO authenticated USING (auth.uid() = owner_id);
CREATE POLICY "billing_insert_own" ON billing_settings FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "billing_update_own" ON billing_settings FOR UPDATE TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "billing_delete_own" ON billing_settings FOR DELETE TO authenticated USING (auth.uid() = owner_id);
CREATE TRIGGER update_billing_settings_updated_at BEFORE UPDATE ON billing_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==== EMAIL TEMPLATES TABLE ====
CREATE TABLE IF NOT EXISTS email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  template_key text NOT NULL,
  template_name text NOT NULL,
  subject text NOT NULL,
  html_content text NOT NULL,
  available_variables jsonb DEFAULT '[]'::jsonb,
  description text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_email_templates_owner_key ON email_templates(owner_id, template_key);
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "templates_select_own" ON email_templates FOR SELECT TO authenticated USING (auth.uid() = owner_id);
CREATE POLICY "templates_insert_own" ON email_templates FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "templates_update_own" ON email_templates FOR UPDATE TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "templates_delete_own" ON email_templates FOR DELETE TO authenticated USING (auth.uid() = owner_id);
CREATE TRIGGER update_email_templates_updated_at BEFORE UPDATE ON email_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==== NOTIFICATION SETTINGS TABLE ====
CREATE TABLE IF NOT EXISTS notification_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  email_new_appointment boolean DEFAULT true,
  email_cancelled_appointment boolean DEFAULT true,
  email_payment_received boolean DEFAULT true,
  email_daily_summary boolean DEFAULT true,
  sms_enabled boolean DEFAULT false,
  sms_new_appointment boolean DEFAULT false,
  sms_reminder boolean DEFAULT false,
  daily_summary_time time DEFAULT '08:00:00',
  notification_email text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_notification_owner ON notification_settings(owner_id);
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notifications_select_own" ON notification_settings FOR SELECT TO authenticated USING (auth.uid() = owner_id);
CREATE POLICY "notifications_insert_own" ON notification_settings FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "notifications_update_own" ON notification_settings FOR UPDATE TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "notifications_delete_own" ON notification_settings FOR DELETE TO authenticated USING (auth.uid() = owner_id);
CREATE TRIGGER update_notification_settings_updated_at BEFORE UPDATE ON notification_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();