/*
  # Méga Migration Part 1 - Settings & Configuration
  
  ## Tables créées
  1. appointment_settings
  2. billing_settings
  3. booking_settings
  4. branding_settings (structure complète)
  5. business_hours
  6. notification_settings
*/

-- 1. appointment_settings
CREATE TABLE IF NOT EXISTS appointment_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  default_duration_minutes int DEFAULT 30,
  buffer_time_minutes int DEFAULT 0,
  max_advance_booking_days int DEFAULT 90,
  min_advance_booking_hours int DEFAULT 24,
  allow_same_day_booking boolean DEFAULT false,
  auto_confirm_bookings boolean DEFAULT true,
  send_confirmation_email boolean DEFAULT true,
  send_reminder_email boolean DEFAULT true,
  reminder_hours_before int DEFAULT 24,
  cancellation_notice_hours int DEFAULT 24,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(owner_id)
);

ALTER TABLE appointment_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own appointment settings" ON appointment_settings;
CREATE POLICY "Users manage own appointment settings"
  ON appointment_settings FOR ALL
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- 2. billing_settings
CREATE TABLE IF NOT EXISTS billing_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  currency text DEFAULT 'CAD',
  tax_rate decimal(5,2) DEFAULT 0,
  tax_number text,
  payment_terms_days int DEFAULT 30,
  late_fee_percentage decimal(5,2) DEFAULT 0,
  invoice_prefix text DEFAULT 'INV',
  invoice_number_start int DEFAULT 1000,
  invoice_notes text,
  payment_instructions text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(owner_id)
);

ALTER TABLE billing_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own billing settings" ON billing_settings;
CREATE POLICY "Users manage own billing settings"
  ON billing_settings FOR ALL
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- 3. booking_settings
CREATE TABLE IF NOT EXISTS booking_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  enabled boolean DEFAULT true,
  require_phone boolean DEFAULT true,
  require_reason boolean DEFAULT false,
  show_availability_calendar boolean DEFAULT true,
  max_slots_per_day int,
  booking_page_title text DEFAULT 'Réserver un rendez-vous',
  booking_page_description text,
  success_message text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(owner_id)
);

ALTER TABLE booking_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own booking settings" ON booking_settings;
CREATE POLICY "Users manage own booking settings"
  ON booking_settings FOR ALL
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "Public can view booking settings" ON booking_settings;
CREATE POLICY "Public can view booking settings"
  ON booking_settings FOR SELECT
  TO anon, authenticated
  USING (enabled = true);

-- 4. branding_settings
CREATE TABLE IF NOT EXISTS branding_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  logo_url text,
  primary_color text DEFAULT '#3B82F6',
  secondary_color text DEFAULT '#1E40AF',
  accent_color text DEFAULT '#10B981',
  font_family text DEFAULT 'Inter',
  custom_css text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(owner_id)
);

ALTER TABLE branding_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own branding" ON branding_settings;
CREATE POLICY "Users manage own branding"
  ON branding_settings FOR ALL
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- 5. business_hours
CREATE TABLE IF NOT EXISTS business_hours (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  day_of_week int NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  day_name text NOT NULL,
  is_open boolean DEFAULT true,
  open_time time,
  close_time time,
  break_start_time time,
  break_end_time time,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(owner_id, day_of_week)
);

ALTER TABLE business_hours ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own business hours" ON business_hours;
CREATE POLICY "Users manage own business hours"
  ON business_hours FOR ALL
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "Public can view business hours" ON business_hours;
CREATE POLICY "Public can view business hours"
  ON business_hours FOR SELECT
  TO anon, authenticated
  USING (is_open = true);

-- 6. notification_settings
CREATE TABLE IF NOT EXISTS notification_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  email_notifications_enabled boolean DEFAULT true,
  sms_notifications_enabled boolean DEFAULT false,
  new_appointment_email boolean DEFAULT true,
  cancellation_email boolean DEFAULT true,
  reminder_email boolean DEFAULT true,
  payment_received_email boolean DEFAULT true,
  daily_summary_email boolean DEFAULT false,
  weekly_report_email boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(owner_id)
);

ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own notification settings" ON notification_settings;
CREATE POLICY "Users manage own notification settings"
  ON notification_settings FOR ALL
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

GRANT SELECT, INSERT, UPDATE, DELETE ON appointment_settings TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON billing_settings TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON booking_settings TO authenticated;
GRANT SELECT ON booking_settings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON branding_settings TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON business_hours TO authenticated;
GRANT SELECT ON business_hours TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON notification_settings TO authenticated;
