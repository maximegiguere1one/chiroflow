/*
  # Add direction column to email_tracking

  1. Changes
    - Add direction column to track inbound vs outbound messages
    - Set default to 'outbound' for existing records

  2. Notes
    - This enables bidirectional communication tracking
    - Inbound messages come from patients
    - Outbound messages are sent by the clinic
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'email_tracking' AND column_name = 'direction'
  ) THEN
    ALTER TABLE email_tracking ADD COLUMN direction text DEFAULT 'outbound';
  END IF;
END $$;
