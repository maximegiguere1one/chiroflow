/*
  # Add billing address columns to payment_methods
  
  1. Changes
    - Add billing address columns to payment_methods table
    - billing_address_line1, line2, city, state, postal_code, country
    - cardholder_name for display purposes
  
  2. Reason
    - Frontend components expect these columns for billing info
    - Required for payment processing and invoicing
*/

-- Add billing address columns
ALTER TABLE payment_methods
ADD COLUMN IF NOT EXISTS cardholder_name TEXT,
ADD COLUMN IF NOT EXISTS billing_address_line1 TEXT,
ADD COLUMN IF NOT EXISTS billing_address_line2 TEXT,
ADD COLUMN IF NOT EXISTS billing_address_city TEXT,
ADD COLUMN IF NOT EXISTS billing_address_state TEXT,
ADD COLUMN IF NOT EXISTS billing_address_postal_code TEXT,
ADD COLUMN IF NOT EXISTS billing_address_country TEXT DEFAULT 'CA';