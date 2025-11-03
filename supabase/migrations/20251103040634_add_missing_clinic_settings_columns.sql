/*
  # Add Missing Clinic Settings Columns
  
  1. New Columns
    - `owner_name` - Nom du propriétaire/chiropraticien
    - `owner_title` - Titre professionnel (Dre, Dr, etc.)
    - `clinic_tagline` - Slogan de la clinique
    - `website` - Site web de la clinique
    - `street_address` - Adresse de la rue
    - `suite_number` - Numéro de bureau/suite
    - `city` - Ville
    - `province` - Province
    - `postal_code` - Code postal
    - `facebook_url` - URL Facebook
    - `instagram_url` - URL Instagram
    - `linkedin_url` - URL LinkedIn
*/

-- Add all missing columns to clinic_settings
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clinic_settings' AND column_name = 'owner_name') THEN
    ALTER TABLE clinic_settings ADD COLUMN owner_name text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clinic_settings' AND column_name = 'owner_title') THEN
    ALTER TABLE clinic_settings ADD COLUMN owner_title text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clinic_settings' AND column_name = 'clinic_tagline') THEN
    ALTER TABLE clinic_settings ADD COLUMN clinic_tagline text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clinic_settings' AND column_name = 'website') THEN
    ALTER TABLE clinic_settings ADD COLUMN website text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clinic_settings' AND column_name = 'street_address') THEN
    ALTER TABLE clinic_settings ADD COLUMN street_address text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clinic_settings' AND column_name = 'suite_number') THEN
    ALTER TABLE clinic_settings ADD COLUMN suite_number text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clinic_settings' AND column_name = 'city') THEN
    ALTER TABLE clinic_settings ADD COLUMN city text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clinic_settings' AND column_name = 'province') THEN
    ALTER TABLE clinic_settings ADD COLUMN province text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clinic_settings' AND column_name = 'postal_code') THEN
    ALTER TABLE clinic_settings ADD COLUMN postal_code text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clinic_settings' AND column_name = 'facebook_url') THEN
    ALTER TABLE clinic_settings ADD COLUMN facebook_url text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clinic_settings' AND column_name = 'instagram_url') THEN
    ALTER TABLE clinic_settings ADD COLUMN instagram_url text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clinic_settings' AND column_name = 'linkedin_url') THEN
    ALTER TABLE clinic_settings ADD COLUMN linkedin_url text;
  END IF;
END $$;
