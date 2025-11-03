/*
  # Ajout du Twilio App SID
  
  1. Changes
    - Ajoute la colonne `twilio_app_sid` à clinic_settings
    - Cette colonne stocke l'Application SID de Twilio pour les webhooks
  
  2. Notes
    - L'App SID est utilisé pour identifier votre application Twilio
    - Nécessaire pour certaines fonctionnalités avancées de Twilio
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'clinic_settings' AND column_name = 'twilio_app_sid'
  ) THEN
    ALTER TABLE clinic_settings ADD COLUMN twilio_app_sid text;
  END IF;
END $$;

COMMENT ON COLUMN clinic_settings.twilio_app_sid IS 'Twilio Application SID pour la configuration des webhooks';
