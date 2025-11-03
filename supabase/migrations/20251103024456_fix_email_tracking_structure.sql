/*
  # Fix Email Tracking Structure
  
  1. Changes
    - Make email_type nullable with default value
    - Make recipient_email NOT NULL (required for tracking)
    - Add default value for channel if not specified
    
  2. Security
    - No RLS changes needed
*/

-- Make email_type nullable with a default value
ALTER TABLE email_tracking 
  ALTER COLUMN email_type DROP NOT NULL,
  ALTER COLUMN email_type SET DEFAULT 'custom';

-- Set recipient_email as required field
ALTER TABLE email_tracking
  ALTER COLUMN recipient_email SET NOT NULL;

-- Ensure channel has proper default
ALTER TABLE email_tracking
  ALTER COLUMN channel SET DEFAULT 'email';

-- Ensure status has proper default
ALTER TABLE email_tracking
  ALTER COLUMN status SET DEFAULT 'pending';