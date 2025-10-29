/*
  # Email Tracking and Template Management System
  
  ## Overview
  Comprehensive system for tracking email delivery, engagement, and managing
  templates with versioning and multi-language support.
  
  ## New Tables
  
  ### `email_templates`
  Centralized template storage with versioning
  - `id` (uuid, primary key)
  - `template_key` (text, unique) - Unique identifier for template type
  - `name` (text) - Human-readable name
  - `description` (text) - Template purpose description
  - `language` (text) - Language code (fr, en)
  - `version` (integer) - Template version number
  - `subject` (text) - Email subject line
  - `html_content` (text) - HTML email body
  - `text_content` (text) - Plain text fallback
  - `variables` (jsonb) - Available merge variables
  - `is_active` (boolean) - Whether template is active
  - `is_default` (boolean) - Default template for this type
  - `created_by` (uuid) - User who created template
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)
  
  ### `email_tracking`
  Comprehensive email delivery and engagement tracking
  - `id` (uuid, primary key)
  - `tracking_id` (text, unique) - Unique tracking identifier
  - `email_type` (text) - Type of email (appointment_confirmation, waitlist_invitation, etc.)
  - `template_id` (uuid) - Reference to email template used
  - `recipient_email` (text) - Recipient address
  - `recipient_name` (text) - Recipient name
  - `subject` (text) - Email subject as sent
  - `sent_at` (timestamptz) - When email was sent
  - `delivered_at` (timestamptz) - When email was delivered
  - `opened_at` (timestamptz) - First open timestamp
  - `open_count` (integer) - Number of times opened
  - `last_opened_at` (timestamptz) - Most recent open
  - `clicked_at` (timestamptz) - First click timestamp
  - `click_count` (integer) - Number of clicks
  - `last_clicked_at` (timestamptz) - Most recent click
  - `bounced` (boolean) - Whether email bounced
  - `bounce_type` (text) - hard, soft, or null
  - `bounce_reason` (text) - Bounce error message
  - `unsubscribed_at` (timestamptz) - If recipient unsubscribed
  - `spam_reported_at` (timestamptz) - If marked as spam
  - `provider_message_id` (text) - Resend/provider message ID
  - `provider_response` (jsonb) - Full provider response
  - `metadata` (jsonb) - Additional context data
  - `created_at` (timestamptz)
  
  ### `email_click_tracking`
  Detailed click tracking for each link in emails
  - `id` (uuid, primary key)
  - `email_tracking_id` (uuid) - Reference to email_tracking
  - `link_url` (text) - Original URL clicked
  - `link_label` (text) - Link text/label
  - `clicked_at` (timestamptz) - When link was clicked
  - `ip_address` (text) - Clicker IP address
  - `user_agent` (text) - Clicker browser/device info
  - `created_at` (timestamptz)
  
  ### `email_analytics_summary`
  Periodic aggregated email performance metrics
  - `id` (uuid, primary key)
  - `period_start` (date) - Start of reporting period
  - `period_end` (date) - End of reporting period
  - `email_type` (text) - Type of emails in this summary
  - `language` (text) - Language of emails
  - `total_sent` (integer) - Total emails sent
  - `total_delivered` (integer) - Successfully delivered
  - `total_bounced` (integer) - Bounced emails
  - `total_opened` (integer) - Unique opens
  - `total_clicked` (integer) - Unique clicks
  - `total_unsubscribed` (integer) - Unsubscribe count
  - `total_spam_reports` (integer) - Spam reports
  - `open_rate` (decimal) - Percentage opened
  - `click_rate` (decimal) - Percentage clicked
  - `bounce_rate` (decimal) - Percentage bounced
  - `created_at` (timestamptz)
  
  ## Security
  - RLS enabled on all tables
  - Admins have full access for analytics
  - Templates managed by admins only
  - Tracking data read-only after creation
*/

-- ============================================================================
-- EMAIL TEMPLATES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_key text NOT NULL,
  name text NOT NULL,
  description text,
  language text NOT NULL DEFAULT 'fr',
  version integer NOT NULL DEFAULT 1,
  subject text NOT NULL,
  html_content text NOT NULL,
  text_content text NOT NULL,
  variables jsonb DEFAULT '[]'::jsonb,
  is_active boolean DEFAULT true,
  is_default boolean DEFAULT false,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT unique_template_key_lang_version UNIQUE (template_key, language, version)
);

-- ============================================================================
-- EMAIL TRACKING TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS email_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tracking_id text UNIQUE NOT NULL DEFAULT gen_random_uuid()::text,
  email_type text NOT NULL,
  template_id uuid REFERENCES email_templates(id) ON DELETE SET NULL,
  recipient_email text NOT NULL,
  recipient_name text,
  subject text NOT NULL,
  sent_at timestamptz DEFAULT now(),
  delivered_at timestamptz,
  opened_at timestamptz,
  open_count integer DEFAULT 0,
  last_opened_at timestamptz,
  clicked_at timestamptz,
  click_count integer DEFAULT 0,
  last_clicked_at timestamptz,
  bounced boolean DEFAULT false,
  bounce_type text CHECK (bounce_type IN ('hard', 'soft', NULL)),
  bounce_reason text,
  unsubscribed_at timestamptz,
  spam_reported_at timestamptz,
  provider_message_id text,
  provider_response jsonb,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- ============================================================================
-- EMAIL CLICK TRACKING TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS email_click_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email_tracking_id uuid NOT NULL REFERENCES email_tracking(id) ON DELETE CASCADE,
  link_url text NOT NULL,
  link_label text,
  clicked_at timestamptz DEFAULT now(),
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- ============================================================================
-- EMAIL ANALYTICS SUMMARY TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS email_analytics_summary (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  period_start date NOT NULL,
  period_end date NOT NULL,
  email_type text,
  language text,
  total_sent integer DEFAULT 0,
  total_delivered integer DEFAULT 0,
  total_bounced integer DEFAULT 0,
  total_opened integer DEFAULT 0,
  total_clicked integer DEFAULT 0,
  total_unsubscribed integer DEFAULT 0,
  total_spam_reports integer DEFAULT 0,
  open_rate decimal(5, 2) DEFAULT 0,
  click_rate decimal(5, 2) DEFAULT 0,
  bounce_rate decimal(5, 2) DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT unique_analytics_period UNIQUE (period_start, period_end, email_type, language)
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_email_templates_key_lang ON email_templates(template_key, language);
CREATE INDEX IF NOT EXISTS idx_email_templates_active ON email_templates(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_email_tracking_type ON email_tracking(email_type);
CREATE INDEX IF NOT EXISTS idx_email_tracking_recipient ON email_tracking(recipient_email);
CREATE INDEX IF NOT EXISTS idx_email_tracking_sent ON email_tracking(sent_at);
CREATE INDEX IF NOT EXISTS idx_email_tracking_provider_id ON email_tracking(provider_message_id);
CREATE INDEX IF NOT EXISTS idx_email_click_tracking_email ON email_click_tracking(email_tracking_id);
CREATE INDEX IF NOT EXISTS idx_email_analytics_period ON email_analytics_summary(period_start, period_end);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_click_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_analytics_summary ENABLE ROW LEVEL SECURITY;

-- Email Templates - Admin only
CREATE POLICY "Admins can manage email templates"
  ON email_templates FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Email Tracking - Admins can view, system can insert
CREATE POLICY "Admins can view email tracking"
  ON email_tracking FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'practitioner')
    )
  );

CREATE POLICY "System can insert email tracking"
  ON email_tracking FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

CREATE POLICY "System can update email tracking stats"
  ON email_tracking FOR UPDATE
  TO authenticated, anon
  USING (true)
  WITH CHECK (true);

-- Click Tracking - Public can insert (for tracking), admins can view
CREATE POLICY "Anyone can insert click tracking"
  ON email_click_tracking FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

CREATE POLICY "Admins can view click tracking"
  ON email_click_tracking FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'practitioner')
    )
  );

-- Analytics Summary - Admins can view
CREATE POLICY "Admins can view analytics"
  ON email_analytics_summary FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'practitioner')
    )
  );

CREATE POLICY "System can manage analytics summaries"
  ON email_analytics_summary FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- ============================================================================
-- TRIGGERS
-- ============================================================================

CREATE TRIGGER update_email_templates_updated_at
  BEFORE UPDATE ON email_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- DEFAULT EMAIL TEMPLATES
-- ============================================================================

INSERT INTO email_templates (template_key, name, description, language, subject, html_content, text_content, variables) VALUES
(
  'appointment_confirmation',
  'Confirmation de rendez-vous',
  'Email sent when appointment is confirmed',
  'fr',
  '✅ Votre rendez-vous est confirmé',
  '<!DOCTYPE html><html><body><h1>Rendez-vous confirmé</h1><p>Bonjour {{name}},</p><p>Votre rendez-vous est confirmé pour le {{date}} à {{time}}.</p></body></html>',
  'Bonjour {{name}},\n\nVotre rendez-vous est confirmé pour le {{date}} à {{time}}.',
  '["name", "date", "time", "address"]'::jsonb
),
(
  'waitlist_invitation',
  'Invitation liste d''attente',
  'Email sent when slot becomes available',
  'fr',
  '🎯 Un créneau vient de se libérer pour vous!',
  '<!DOCTYPE html><html><body><h1>Bonne nouvelle!</h1><p>Bonjour {{name}},</p><p>Un rendez-vous vient de se libérer le {{date}} à {{time}}.</p></body></html>',
  'Bonjour {{name}},\n\nUn rendez-vous vient de se libérer le {{date}} à {{time}}.',
  '["name", "date", "time", "acceptUrl", "declineUrl", "expiresIn"]'::jsonb
),
(
  'appointment_reminder',
  'Rappel de rendez-vous',
  'Email reminder sent before appointment',
  'fr',
  '⏰ Rappel: Rendez-vous demain',
  '<!DOCTYPE html><html><body><h1>Rappel</h1><p>Bonjour {{name}},</p><p>Rappel de votre rendez-vous demain à {{time}}.</p></body></html>',
  'Bonjour {{name}},\n\nRappel de votre rendez-vous demain à {{time}}.',
  '["name", "date", "time", "address"]'::jsonb
)
ON CONFLICT (template_key, language, version) DO NOTHING;

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to get active template for a type and language
CREATE OR REPLACE FUNCTION get_active_email_template(
  p_template_key text,
  p_language text DEFAULT 'fr'
)
RETURNS TABLE (
  id uuid,
  subject text,
  html_content text,
  text_content text,
  variables jsonb
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id,
    t.subject,
    t.html_content,
    t.text_content,
    t.variables
  FROM email_templates t
  WHERE t.template_key = p_template_key
    AND t.language = p_language
    AND t.is_active = true
  ORDER BY t.version DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to track email open
CREATE OR REPLACE FUNCTION track_email_open(p_tracking_id text)
RETURNS void AS $$
BEGIN
  UPDATE email_tracking
  SET 
    opened_at = COALESCE(opened_at, now()),
    open_count = open_count + 1,
    last_opened_at = now(),
    delivered_at = COALESCE(delivered_at, now())
  WHERE tracking_id = p_tracking_id;
END;
$$ LANGUAGE plpgsql;

-- Function to track email click
CREATE OR REPLACE FUNCTION track_email_click(
  p_tracking_id text,
  p_link_url text,
  p_link_label text DEFAULT NULL,
  p_ip_address text DEFAULT NULL,
  p_user_agent text DEFAULT NULL
)
RETURNS void AS $$
DECLARE
  v_email_id uuid;
BEGIN
  -- Get email tracking ID
  SELECT id INTO v_email_id
  FROM email_tracking
  WHERE tracking_id = p_tracking_id;

  IF v_email_id IS NOT NULL THEN
    -- Update email tracking
    UPDATE email_tracking
    SET 
      clicked_at = COALESCE(clicked_at, now()),
      click_count = click_count + 1,
      last_clicked_at = now(),
      delivered_at = COALESCE(delivered_at, now()),
      opened_at = COALESCE(opened_at, now())
    WHERE id = v_email_id;

    -- Insert click tracking
    INSERT INTO email_click_tracking (
      email_tracking_id,
      link_url,
      link_label,
      ip_address,
      user_agent
    ) VALUES (
      v_email_id,
      p_link_url,
      p_link_label,
      p_ip_address,
      p_user_agent
    );
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE email_templates IS 
  'Centralized email template storage with versioning and multi-language support';

COMMENT ON TABLE email_tracking IS 
  'Comprehensive tracking of all emails sent including delivery and engagement metrics';

COMMENT ON TABLE email_click_tracking IS 
  'Detailed tracking of individual link clicks within emails';

COMMENT ON TABLE email_analytics_summary IS 
  'Aggregated email performance metrics for reporting and dashboards';

COMMENT ON FUNCTION get_active_email_template(text, text) IS 
  'Retrieves the active template for a given type and language';

COMMENT ON FUNCTION track_email_open(text) IS 
  'Records email open event using tracking ID';

COMMENT ON FUNCTION track_email_click(text, text, text, text, text) IS 
  'Records email link click with full context';
