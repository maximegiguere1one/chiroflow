/*
  # Fix Branding Function to Prioritize clinic_settings
  
  1. Changes
    - Prioritize clinic_settings over organizations table
    - Ensure clinic_name is never empty
    - Simplify the logic to avoid NULL confusion
*/

-- Drop and recreate the function with correct logic
CREATE OR REPLACE FUNCTION get_organization_branding(p_owner_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_branding jsonb;
BEGIN
  -- First, try to get from clinic_settings (most common case)
  SELECT jsonb_build_object(
    'clinic_name', COALESCE(NULLIF(clinic_name, ''), 'Votre Clinique'),
    'email', email,
    'phone', COALESCE(phone, ''),
    'address', address,
    'logo_url', NULL,
    'website', NULL
  )
  INTO v_branding
  FROM clinic_settings
  WHERE owner_id = p_owner_id
  LIMIT 1;
  
  -- If found in clinic_settings, return it
  IF v_branding IS NOT NULL THEN
    RETURN v_branding;
  END IF;
  
  -- Otherwise, try organizations table
  SELECT jsonb_build_object(
    'clinic_name', COALESCE(NULLIF(o.name, ''), 'Votre Clinique'),
    'email', o.email,
    'phone', COALESCE(o.phone, ''),
    'address', o.address,
    'logo_url', o.logo_url,
    'website', o.website
  )
  INTO v_branding
  FROM organizations o
  WHERE o.owner_id = p_owner_id
  LIMIT 1;
  
  -- If found in organizations, return it
  IF v_branding IS NOT NULL THEN
    RETURN v_branding;
  END IF;
  
  -- Default fallback
  RETURN jsonb_build_object(
    'clinic_name', 'Votre Clinique',
    'email', NULL,
    'phone', '',
    'address', NULL,
    'logo_url', NULL,
    'website', NULL
  );
END;
$$;

-- Ensure permissions are correct
GRANT EXECUTE ON FUNCTION get_organization_branding(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_organization_branding(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION get_organization_branding(uuid) TO anon;
