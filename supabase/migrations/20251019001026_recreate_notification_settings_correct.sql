/*
  # Recréation de la table notification_settings avec la bonne structure
  
  1. Nouvelle Table
    - `notification_settings` (paramètres de notifications)
      - Tous les champs utilisés par le code frontend
  
  2. Sécurité
    - RLS activé
    - Policies pour que chaque admin gère ses propres paramètres
*/

CREATE TABLE IF NOT EXISTS notification_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Événements à notifier
  notify_new_appointment boolean DEFAULT true,
  notify_appointment_cancelled boolean DEFAULT true,
  notify_appointment_confirmed boolean DEFAULT false,
  notify_patient_no_show boolean DEFAULT true,
  notify_payment_received boolean DEFAULT true,
  notify_payment_failed boolean DEFAULT true,
  notify_waitlist_match boolean DEFAULT true,
  notify_new_patient boolean DEFAULT true,
  
  -- Configuration email
  notification_email text NOT NULL,
  
  -- Rapports automatiques
  send_daily_summary boolean DEFAULT false,
  daily_summary_time time DEFAULT '18:00',
  send_weekly_report boolean DEFAULT false,
  weekly_report_day integer DEFAULT 1 CHECK (weekly_report_day >= 0 AND weekly_report_day <= 6),
  
  -- Rappels automatiques
  enable_appointment_reminders boolean DEFAULT true,
  reminder_hours_before integer DEFAULT 24,
  enable_followup_reminders boolean DEFAULT false,
  followup_days_after integer DEFAULT 7,
  enable_birthday_wishes boolean DEFAULT false,
  
  -- Notifications SMS
  enable_sms_notifications boolean DEFAULT false,
  sms_provider text DEFAULT 'none',
  
  -- Interface
  notification_sound boolean DEFAULT true,
  desktop_notifications boolean DEFAULT false,
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Un seul paramétrage par utilisateur
  UNIQUE(owner_id)
);

-- Enable RLS
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Users can view own notification settings" ON notification_settings;
CREATE POLICY "Users can view own notification settings"
  ON notification_settings
  FOR SELECT
  TO authenticated
  USING (owner_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own notification settings" ON notification_settings;
CREATE POLICY "Users can insert own notification settings"
  ON notification_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own notification settings" ON notification_settings;
CREATE POLICY "Users can update own notification settings"
  ON notification_settings
  FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own notification settings" ON notification_settings;
CREATE POLICY "Users can delete own notification settings"
  ON notification_settings
  FOR DELETE
  TO authenticated
  USING (owner_id = auth.uid());

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_notification_settings_owner ON notification_settings(owner_id);

-- Fonction pour mettre à jour le timestamp
CREATE OR REPLACE FUNCTION update_notification_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour updated_at
DROP TRIGGER IF EXISTS trigger_update_notification_settings_updated_at ON notification_settings;
CREATE TRIGGER trigger_update_notification_settings_updated_at
  BEFORE UPDATE ON notification_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_notification_settings_updated_at();