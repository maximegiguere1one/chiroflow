/*
  # Advanced Automation Features
  
  1. A/B Testing System
    - email_templates: Multiple template variants
    - ab_test_results: Performance tracking
    - template_performance: Analytics
    
  2. Patient Segmentation
    - patient_segments: Custom segments
    - segment_members: Membership tracking
    - segment_rules: Auto-segmentation
    
  3. Multi-language Support
    - patient_preferences: Language selection
    - template_translations: Multi-lang templates
    
  4. Communication Fallback
    - communication_attempts: Retry tracking
    - contact_preferences: Preferred channels
*/

-- Email Templates for A/B Testing
CREATE TABLE IF NOT EXISTS email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  template_type text NOT NULL CHECK (template_type IN ('reminder_24h', 'reminder_2h', 'confirmation', 'followup', 'rebook')),
  variant_name text NOT NULL,
  subject_line text NOT NULL,
  html_content text NOT NULL,
  language text NOT NULL DEFAULT 'fr' CHECK (language IN ('fr', 'en')),
  is_active boolean DEFAULT true,
  is_control boolean DEFAULT false,
  owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(template_type, variant_name, language, owner_id)
);

CREATE INDEX IF NOT EXISTS idx_email_templates_type ON email_templates(template_type);
CREATE INDEX IF NOT EXISTS idx_email_templates_active ON email_templates(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_email_templates_owner ON email_templates(owner_id);

-- A/B Test Results
CREATE TABLE IF NOT EXISTS ab_test_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid REFERENCES email_templates(id) ON DELETE CASCADE,
  contact_id uuid REFERENCES contacts(id) ON DELETE CASCADE,
  appointment_id uuid REFERENCES appointments(id) ON DELETE CASCADE,
  sent_at timestamptz NOT NULL DEFAULT now(),
  opened_at timestamptz,
  clicked_at timestamptz,
  converted_at timestamptz,
  conversion_type text CHECK (conversion_type IN ('confirmed', 'rebooked', 'feedback_given')),
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ab_test_template ON ab_test_results(template_id);
CREATE INDEX IF NOT EXISTS idx_ab_test_contact ON ab_test_results(contact_id);
CREATE INDEX IF NOT EXISTS idx_ab_test_sent_at ON ab_test_results(sent_at DESC);

-- Template Performance View
CREATE OR REPLACE VIEW template_performance AS
SELECT 
  t.id as template_id,
  t.name,
  t.template_type,
  t.variant_name,
  t.language,
  COUNT(r.id) as total_sent,
  COUNT(r.opened_at) as total_opened,
  COUNT(r.clicked_at) as total_clicked,
  COUNT(r.converted_at) as total_converted,
  ROUND(COUNT(r.opened_at)::numeric / NULLIF(COUNT(r.id), 0) * 100, 2) as open_rate,
  ROUND(COUNT(r.clicked_at)::numeric / NULLIF(COUNT(r.id), 0) * 100, 2) as click_rate,
  ROUND(COUNT(r.converted_at)::numeric / NULLIF(COUNT(r.id), 0) * 100, 2) as conversion_rate
FROM email_templates t
LEFT JOIN ab_test_results r ON t.id = r.template_id
WHERE t.is_active = true
GROUP BY t.id, t.name, t.template_type, t.variant_name, t.language;

-- Patient Segments
CREATE TABLE IF NOT EXISTS patient_segments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  segment_type text NOT NULL CHECK (segment_type IN ('manual', 'automatic', 'smart')),
  rules jsonb DEFAULT '{}'::jsonb,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(name, owner_id)
);

CREATE INDEX IF NOT EXISTS idx_patient_segments_owner ON patient_segments(owner_id);
CREATE INDEX IF NOT EXISTS idx_patient_segments_type ON patient_segments(segment_type);

-- Segment Members
CREATE TABLE IF NOT EXISTS segment_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  segment_id uuid REFERENCES patient_segments(id) ON DELETE CASCADE,
  contact_id uuid REFERENCES contacts(id) ON DELETE CASCADE,
  added_at timestamptz DEFAULT now(),
  added_by text DEFAULT 'system',
  UNIQUE(segment_id, contact_id)
);

CREATE INDEX IF NOT EXISTS idx_segment_members_segment ON segment_members(segment_id);
CREATE INDEX IF NOT EXISTS idx_segment_members_contact ON segment_members(contact_id);

-- Patient Preferences
CREATE TABLE IF NOT EXISTS patient_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid REFERENCES contacts(id) ON DELETE CASCADE UNIQUE,
  preferred_language text DEFAULT 'fr' CHECK (preferred_language IN ('fr', 'en')),
  preferred_contact_method text DEFAULT 'email' CHECK (preferred_contact_method IN ('email', 'sms', 'voice', 'any')),
  email_notifications boolean DEFAULT true,
  sms_notifications boolean DEFAULT true,
  voice_notifications boolean DEFAULT false,
  reminder_24h boolean DEFAULT true,
  reminder_2h boolean DEFAULT true,
  followup_emails boolean DEFAULT true,
  rebook_reminders boolean DEFAULT true,
  timezone text DEFAULT 'America/Toronto',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_patient_preferences_contact ON patient_preferences(contact_id);
CREATE INDEX IF NOT EXISTS idx_patient_preferences_language ON patient_preferences(preferred_language);

-- Communication Attempts (for fallback)
CREATE TABLE IF NOT EXISTS communication_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid REFERENCES contacts(id) ON DELETE CASCADE,
  appointment_id uuid REFERENCES appointments(id) ON DELETE CASCADE,
  communication_type text NOT NULL CHECK (communication_type IN ('email', 'sms', 'voice')),
  attempt_number integer NOT NULL DEFAULT 1,
  status text NOT NULL CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'bounced')),
  error_message text,
  sent_at timestamptz,
  delivered_at timestamptz,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_comm_attempts_contact ON communication_attempts(contact_id);
CREATE INDEX IF NOT EXISTS idx_comm_attempts_appointment ON communication_attempts(appointment_id);
CREATE INDEX IF NOT EXISTS idx_comm_attempts_status ON communication_attempts(status);

-- Insert default segments
INSERT INTO patient_segments (name, description, segment_type, rules) VALUES
  ('High Value Patients', 'Patients with 5+ visits in last 6 months', 'automatic', 
   '{"min_visits": 5, "timeframe_months": 6}'::jsonb),
  ('At Risk', 'Patients who haven''t booked in 60+ days', 'automatic',
   '{"days_since_last_visit": 60, "has_future_appointment": false}'::jsonb),
  ('New Patients', 'Patients with less than 3 visits', 'automatic',
   '{"max_visits": 3}'::jsonb),
  ('VIP Patients', 'Manually curated VIP list', 'manual', '{}'::jsonb)
ON CONFLICT (name, owner_id) DO NOTHING;

-- Function to auto-assign segments
CREATE OR REPLACE FUNCTION auto_assign_segments()
RETURNS trigger AS $$
BEGIN
  -- High Value Patients
  IF (
    SELECT COUNT(*) 
    FROM appointments 
    WHERE contact_id = NEW.contact_id 
      AND scheduled_at >= NOW() - INTERVAL '6 months'
      AND status = 'completed'
  ) >= 5 THEN
    INSERT INTO segment_members (segment_id, contact_id, added_by)
    SELECT id, NEW.contact_id, 'auto'
    FROM patient_segments
    WHERE name = 'High Value Patients'
    ON CONFLICT (segment_id, contact_id) DO NOTHING;
  END IF;

  -- New Patients
  IF (
    SELECT COUNT(*) 
    FROM appointments 
    WHERE contact_id = NEW.contact_id 
      AND status = 'completed'
  ) <= 3 THEN
    INSERT INTO segment_members (segment_id, contact_id, added_by)
    SELECT id, NEW.contact_id, 'auto'
    FROM patient_segments
    WHERE name = 'New Patients'
    ON CONFLICT (segment_id, contact_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for auto-segmentation
DROP TRIGGER IF EXISTS auto_segment_after_appointment ON appointments;
CREATE TRIGGER auto_segment_after_appointment
  AFTER INSERT OR UPDATE ON appointments
  FOR EACH ROW
  WHEN (NEW.status = 'completed')
  EXECUTE FUNCTION auto_assign_segments();

-- Enable RLS
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE ab_test_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE segment_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE communication_attempts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage own templates"
  ON email_templates FOR ALL
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can view ab test results"
  ON ab_test_results FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM email_templates
      WHERE email_templates.id = ab_test_results.template_id
        AND email_templates.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage own segments"
  ON patient_segments FOR ALL
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can view segment members"
  ON segment_members FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM patient_segments
      WHERE patient_segments.id = segment_members.segment_id
        AND patient_segments.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can view patient preferences"
  ON patient_preferences FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM contacts
      WHERE contacts.id = patient_preferences.contact_id
        AND contacts.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can view communication attempts"
  ON communication_attempts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM contacts
      WHERE contacts.id = communication_attempts.contact_id
        AND contacts.owner_id = auth.uid()
    )
  );

-- Analyze tables
ANALYZE email_templates;
ANALYZE ab_test_results;
ANALYZE patient_segments;
ANALYZE segment_members;
ANALYZE patient_preferences;
ANALYZE communication_attempts;
