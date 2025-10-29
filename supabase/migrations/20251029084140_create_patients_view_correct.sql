/*
  # Create patients API view

  ## Overview
  Creates a simplified 'patients' view mapping to 'contacts' table for backward compatibility.

  ## Changes
  1. Create patients view from contacts table
  2. Map full_name and other common fields
  3. Add computed first_name/last_name from full_name
  4. Add RLS via security_invoker
*/

-- Create patients view
CREATE OR REPLACE VIEW public.patients AS
SELECT 
  c.id,
  c.full_name,
  split_part(c.full_name, ' ', 1) as first_name,
  split_part(c.full_name, ' ', 2) as last_name,
  c.email,
  c.phone,
  c.date_of_birth,
  c.address,
  c.notes,
  COALESCE(c.status, 'active') as status,
  c.owner_id,
  c.created_at,
  c.updated_at
FROM public.contacts c;

-- Enable RLS
ALTER VIEW public.patients SET (security_invoker = true);

-- Grant access
GRANT SELECT, INSERT, UPDATE, DELETE ON public.patients TO anon, authenticated;

COMMENT ON VIEW public.patients IS
  'API view mapping contacts table to patients format for backward compatibility';
