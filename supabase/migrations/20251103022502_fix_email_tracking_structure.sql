/*
  # Fix email_tracking table structure

  1. Changes
    - Add missing columns to email_tracking table
    - Ensure all columns needed by SendMessageModal exist
    - Add proper indexes

  2. Columns Added
    - recipient_email
    - recipient_phone
    - body
    - template_name
    - channel
    - status
    - delivered_at
*/

-- Add missing columns if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'email_tracking' AND column_name = 'recipient_email'
  ) THEN
    ALTER TABLE email_tracking ADD COLUMN recipient_email text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'email_tracking' AND column_name = 'recipient_phone'
  ) THEN
    ALTER TABLE email_tracking ADD COLUMN recipient_phone text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'email_tracking' AND column_name = 'body'
  ) THEN
    ALTER TABLE email_tracking ADD COLUMN body text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'email_tracking' AND column_name = 'template_name'
  ) THEN
    ALTER TABLE email_tracking ADD COLUMN template_name text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'email_tracking' AND column_name = 'channel'
  ) THEN
    ALTER TABLE email_tracking ADD COLUMN channel text DEFAULT 'email';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'email_tracking' AND column_name = 'status'
  ) THEN
    ALTER TABLE email_tracking ADD COLUMN status text DEFAULT 'pending';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'email_tracking' AND column_name = 'delivered_at'
  ) THEN
    ALTER TABLE email_tracking ADD COLUMN delivered_at timestamptz;
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_email_tracking_status ON email_tracking(status);
CREATE INDEX IF NOT EXISTS idx_email_tracking_channel ON email_tracking(channel);
CREATE INDEX IF NOT EXISTS idx_email_tracking_owner_id ON email_tracking(owner_id);
