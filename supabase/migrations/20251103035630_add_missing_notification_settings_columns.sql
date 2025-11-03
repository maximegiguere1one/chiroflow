/*
  # Add Missing Notification Settings Columns
  
  1. New Columns
    - `notify_new_appointment` - Notifier nouveau RDV
    - `notify_appointment_cancelled` - Notifier annulation
    - `notify_appointment_confirmed` - Notifier confirmation
    - `notify_patient_no_show` - Notifier no-show
    - `notify_payment_received` - Notifier paiement reçu
    - `notify_payment_failed` - Notifier paiement échoué
    - `notify_waitlist_match` - Notifier match liste d'attente
    - `notify_new_patient` - Notifier nouveau patient
    - `notification_email` - Email pour recevoir les notifications
    - `send_daily_summary` - Activer résumé quotidien
    - `daily_summary_time` - Heure du résumé quotidien
    - `send_weekly_report` - Activer rapport hebdomadaire
    - `weekly_report_day` - Jour du rapport hebdomadaire (0-6)
    - `enable_appointment_reminders` - Activer rappels RDV
    - `reminder_hours_before` - Heures avant RDV pour rappel
    - `enable_followup_reminders` - Activer rappels de suivi
    - `followup_days_after` - Jours après pour rappel de suivi
    - `enable_birthday_wishes` - Activer souhaits d'anniversaire
    - `sms_provider` - Fournisseur SMS
    - `notification_sound` - Son des notifications
    - `desktop_notifications` - Notifications desktop
*/

-- Add all missing columns to notification_settings
DO $$
BEGIN
  -- Boolean notification flags
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notification_settings' AND column_name = 'notify_new_appointment') THEN
    ALTER TABLE notification_settings ADD COLUMN notify_new_appointment boolean DEFAULT true;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notification_settings' AND column_name = 'notify_appointment_cancelled') THEN
    ALTER TABLE notification_settings ADD COLUMN notify_appointment_cancelled boolean DEFAULT true;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notification_settings' AND column_name = 'notify_appointment_confirmed') THEN
    ALTER TABLE notification_settings ADD COLUMN notify_appointment_confirmed boolean DEFAULT true;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notification_settings' AND column_name = 'notify_patient_no_show') THEN
    ALTER TABLE notification_settings ADD COLUMN notify_patient_no_show boolean DEFAULT true;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notification_settings' AND column_name = 'notify_payment_received') THEN
    ALTER TABLE notification_settings ADD COLUMN notify_payment_received boolean DEFAULT true;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notification_settings' AND column_name = 'notify_payment_failed') THEN
    ALTER TABLE notification_settings ADD COLUMN notify_payment_failed boolean DEFAULT true;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notification_settings' AND column_name = 'notify_waitlist_match') THEN
    ALTER TABLE notification_settings ADD COLUMN notify_waitlist_match boolean DEFAULT true;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notification_settings' AND column_name = 'notify_new_patient') THEN
    ALTER TABLE notification_settings ADD COLUMN notify_new_patient boolean DEFAULT true;
  END IF;

  -- Email for notifications
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notification_settings' AND column_name = 'notification_email') THEN
    ALTER TABLE notification_settings ADD COLUMN notification_email text;
  END IF;

  -- Daily summary settings
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notification_settings' AND column_name = 'send_daily_summary') THEN
    ALTER TABLE notification_settings ADD COLUMN send_daily_summary boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notification_settings' AND column_name = 'daily_summary_time') THEN
    ALTER TABLE notification_settings ADD COLUMN daily_summary_time text DEFAULT '18:00';
  END IF;

  -- Weekly report settings
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notification_settings' AND column_name = 'send_weekly_report') THEN
    ALTER TABLE notification_settings ADD COLUMN send_weekly_report boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notification_settings' AND column_name = 'weekly_report_day') THEN
    ALTER TABLE notification_settings ADD COLUMN weekly_report_day integer DEFAULT 1;
  END IF;

  -- Reminder settings
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notification_settings' AND column_name = 'enable_appointment_reminders') THEN
    ALTER TABLE notification_settings ADD COLUMN enable_appointment_reminders boolean DEFAULT true;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notification_settings' AND column_name = 'reminder_hours_before') THEN
    ALTER TABLE notification_settings ADD COLUMN reminder_hours_before integer DEFAULT 24;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notification_settings' AND column_name = 'enable_followup_reminders') THEN
    ALTER TABLE notification_settings ADD COLUMN enable_followup_reminders boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notification_settings' AND column_name = 'followup_days_after') THEN
    ALTER TABLE notification_settings ADD COLUMN followup_days_after integer DEFAULT 7;
  END IF;

  -- Birthday wishes
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notification_settings' AND column_name = 'enable_birthday_wishes') THEN
    ALTER TABLE notification_settings ADD COLUMN enable_birthday_wishes boolean DEFAULT false;
  END IF;

  -- SMS settings
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notification_settings' AND column_name = 'sms_provider') THEN
    ALTER TABLE notification_settings ADD COLUMN sms_provider text DEFAULT 'twilio';
  END IF;

  -- UI settings
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notification_settings' AND column_name = 'notification_sound') THEN
    ALTER TABLE notification_settings ADD COLUMN notification_sound boolean DEFAULT true;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notification_settings' AND column_name = 'desktop_notifications') THEN
    ALTER TABLE notification_settings ADD COLUMN desktop_notifications boolean DEFAULT true;
  END IF;
END $$;
