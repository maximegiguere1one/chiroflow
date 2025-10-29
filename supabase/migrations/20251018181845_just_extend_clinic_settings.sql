/*
  # Extension simple de clinic_settings
*/

ALTER TABLE clinic_settings ADD COLUMN IF NOT EXISTS owner_name text DEFAULT 'Dr. Janie Leblanc';
ALTER TABLE clinic_settings ADD COLUMN IF NOT EXISTS owner_title text DEFAULT 'Chiropraticienne';
ALTER TABLE clinic_settings ADD COLUMN IF NOT EXISTS clinic_tagline text DEFAULT 'Soins chiropratiques';
ALTER TABLE clinic_settings ADD COLUMN IF NOT EXISTS website text;
ALTER TABLE clinic_settings ADD COLUMN IF NOT EXISTS street_address text;
ALTER TABLE clinic_settings ADD COLUMN IF NOT EXISTS suite_number text;
ALTER TABLE clinic_settings ADD COLUMN IF NOT EXISTS city text DEFAULT 'Montréal';
ALTER TABLE clinic_settings ADD COLUMN IF NOT EXISTS province text DEFAULT 'QC';
ALTER TABLE clinic_settings ADD COLUMN IF NOT EXISTS postal_code text;
ALTER TABLE clinic_settings ADD COLUMN IF NOT EXISTS country text DEFAULT 'Canada';
ALTER TABLE clinic_settings ADD COLUMN IF NOT EXISTS facebook_url text;
ALTER TABLE clinic_settings ADD COLUMN IF NOT EXISTS instagram_url text;
ALTER TABLE clinic_settings ADD COLUMN IF NOT EXISTS linkedin_url text;
ALTER TABLE clinic_settings ADD COLUMN IF NOT EXISTS language text DEFAULT 'fr';
ALTER TABLE clinic_settings ADD COLUMN IF NOT EXISTS currency text DEFAULT 'CAD';