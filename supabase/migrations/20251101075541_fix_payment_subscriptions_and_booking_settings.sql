/*
  # Fix Payment Subscriptions and Booking Settings

  1. Changes to payment_subscriptions
    - Change foreign key from patients_full to contacts (which exists)
    - Rename contact_id to patient_id if needed
  
  2. Changes to booking_settings
    - Add missing advance_booking_days column
    - Add other potentially missing booking configuration columns
  
  3. Security
    - Maintain existing RLS policies
*/

-- Fix payment_subscriptions: ensure it references contacts properly
-- First, check if there's a constraint to drop
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name LIKE '%payment_subscriptions%patients%'
        AND table_name = 'payment_subscriptions'
    ) THEN
        EXECUTE 'ALTER TABLE payment_subscriptions DROP CONSTRAINT ' || 
                (SELECT constraint_name FROM information_schema.table_constraints 
                 WHERE constraint_name LIKE '%payment_subscriptions%patients%'
                 AND table_name = 'payment_subscriptions' LIMIT 1);
    END IF;
END $$;

-- Add foreign key to contacts table instead
ALTER TABLE payment_subscriptions 
DROP CONSTRAINT IF EXISTS payment_subscriptions_contact_id_fkey;

ALTER TABLE payment_subscriptions 
ADD CONSTRAINT payment_subscriptions_contact_id_fkey 
FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE;

-- Add missing columns to booking_settings
ALTER TABLE booking_settings 
ADD COLUMN IF NOT EXISTS advance_booking_days INTEGER DEFAULT 30;

ALTER TABLE booking_settings 
ADD COLUMN IF NOT EXISTS min_booking_notice_hours INTEGER DEFAULT 24;

ALTER TABLE booking_settings 
ADD COLUMN IF NOT EXISTS allow_cancellation BOOLEAN DEFAULT true;

ALTER TABLE booking_settings 
ADD COLUMN IF NOT EXISTS cancellation_hours_notice INTEGER DEFAULT 24;

ALTER TABLE booking_settings 
ADD COLUMN IF NOT EXISTS allow_rescheduling BOOLEAN DEFAULT true;

ALTER TABLE booking_settings 
ADD COLUMN IF NOT EXISTS buffer_time_minutes INTEGER DEFAULT 15;

ALTER TABLE booking_settings 
ADD COLUMN IF NOT EXISTS default_duration_minutes INTEGER DEFAULT 30;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_payment_subscriptions_contact_id 
ON payment_subscriptions(contact_id);

CREATE INDEX IF NOT EXISTS idx_payment_subscriptions_owner_id 
ON payment_subscriptions(owner_id);

CREATE INDEX IF NOT EXISTS idx_booking_settings_owner_id 
ON booking_settings(owner_id);
