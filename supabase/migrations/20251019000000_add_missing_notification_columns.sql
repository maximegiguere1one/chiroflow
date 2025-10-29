/*
  # Ajout des colonnes manquantes à notification_settings
  
  1. Modifications
    - Ajoute les colonnes notification_sound et desktop_notifications si elles n'existent pas
  
  2. Sécurité
    - Utilise IF NOT EXISTS pour éviter les erreurs
*/

-- Ajouter notification_sound si elle n'existe pas
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notification_settings' 
    AND column_name = 'notification_sound'
  ) THEN
    ALTER TABLE notification_settings 
    ADD COLUMN notification_sound boolean DEFAULT true;
  END IF;
END $$;

-- Ajouter desktop_notifications si elle n'existe pas
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notification_settings' 
    AND column_name = 'desktop_notifications'
  ) THEN
    ALTER TABLE notification_settings 
    ADD COLUMN desktop_notifications boolean DEFAULT false;
  END IF;
END $$;
