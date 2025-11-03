/*
  # Ajout de la colonne channel aux conversations
  
  Ajoute la colonne channel pour supporter le filtrage par type de communication
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'conversations' AND column_name = 'channel'
  ) THEN
    ALTER TABLE conversations ADD COLUMN channel text DEFAULT 'email';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'conversations' AND column_name = 'last_message_preview'
  ) THEN
    ALTER TABLE conversations ADD COLUMN last_message_preview text;
  END IF;
END $$;
