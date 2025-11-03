/*
  # Add Dynamic Branding Helper Function
  
  1. Helper Functions
    - `get_organization_branding(owner_id)` - Returns branding info for an organization
    - Returns clinic name, email, phone from organizations or clinic_settings
    
  2. Security
    - Function is SECURITY DEFINER to allow reading branding info
*/

-- Create function to get organization branding information
CREATE OR REPLACE FUNCTION get_organization_branding(p_owner_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_branding jsonb;
BEGIN
  -- Try to get from organizations table first
  SELECT jsonb_build_object(
    'clinic_name', COALESCE(o.name, cs.clinic_name, 'Votre Clinique'),
    'email', COALESCE(o.email, cs.email),
    'phone', COALESCE(o.phone, cs.phone),
    'address', COALESCE(o.address, cs.address),
    'logo_url', o.logo_url,
    'website', o.website
  )
  INTO v_branding
  FROM organizations o
  LEFT JOIN clinic_settings cs ON cs.owner_id = p_owner_id
  WHERE o.owner_id = p_owner_id OR o.id IN (
    SELECT organization_id FROM clinic_settings WHERE owner_id = p_owner_id
  )
  LIMIT 1;
  
  -- If not found in organizations, try clinic_settings only
  IF v_branding IS NULL THEN
    SELECT jsonb_build_object(
      'clinic_name', COALESCE(clinic_name, 'Votre Clinique'),
      'email', email,
      'phone', phone,
      'address', address,
      'logo_url', NULL,
      'website', NULL
    )
    INTO v_branding
    FROM clinic_settings
    WHERE owner_id = p_owner_id
    LIMIT 1;
  END IF;
  
  -- Default fallback
  IF v_branding IS NULL THEN
    v_branding := jsonb_build_object(
      'clinic_name', 'Votre Clinique',
      'email', NULL,
      'phone', NULL,
      'address', NULL,
      'logo_url', NULL,
      'website', NULL
    );
  END IF;
  
  RETURN v_branding;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_organization_branding(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_organization_branding(uuid) TO service_role;