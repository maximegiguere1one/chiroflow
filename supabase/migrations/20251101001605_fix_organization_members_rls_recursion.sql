/*
  # Fix Infinite Recursion in organization_members RLS

  1. Problem
    - Current policies cause infinite recursion by querying organization_members within organization_members policies
    
  2. Solution
    - Create helper function to check membership (breaks recursion)
    - Recreate policies using simpler logic
    - Use materialized approach to avoid recursion
    
  3. Security
    - Function is SECURITY DEFINER but only returns user's own data
    - Policies remain restrictive
*/

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view members of their organizations" ON organization_members;
DROP POLICY IF EXISTS "Organization admins can manage members" ON organization_members;
DROP POLICY IF EXISTS "Users can update their own membership" ON organization_members;

-- Create helper function to check if user is member of an organization
CREATE OR REPLACE FUNCTION public.user_is_member_of_org(org_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM organization_members
    WHERE organization_id = org_id
      AND user_id = auth.uid()
      AND status = 'active'
    LIMIT 1
  );
$$;

-- Create helper function to check if user is admin/owner
CREATE OR REPLACE FUNCTION public.user_is_admin_of_org(org_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM organization_members
    WHERE organization_id = org_id
      AND user_id = auth.uid()
      AND status = 'active'
      AND role IN ('owner', 'admin')
    LIMIT 1
  );
$$;

-- Simple policy: Users can view members of organizations they belong to
CREATE POLICY "Users can view members of their organizations"
ON organization_members
FOR SELECT
TO authenticated
USING (
  public.user_is_member_of_org(organization_id)
);

-- Simple policy: Admins can manage members
CREATE POLICY "Organization admins can manage members"
ON organization_members
FOR ALL
TO authenticated
USING (
  public.user_is_admin_of_org(organization_id)
)
WITH CHECK (
  public.user_is_admin_of_org(organization_id)
);

-- Allow users to update their own pending membership (accept invitations)
CREATE POLICY "Users can accept their own invitations"
ON organization_members
FOR UPDATE
TO authenticated
USING (
  user_id = auth.uid() 
  AND status = 'pending'
)
WITH CHECK (
  user_id = auth.uid()
);

-- Allow inserting first member (owner) when creating organization
CREATE POLICY "Allow creating owner membership"
ON organization_members
FOR INSERT
TO authenticated
WITH CHECK (
  role = 'owner'
  AND user_id = auth.uid()
  AND NOT EXISTS (
    SELECT 1 FROM organization_members om2
    WHERE om2.organization_id = organization_members.organization_id
  )
);
