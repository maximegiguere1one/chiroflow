/*
  # Fix organizations RLS Policies

  1. Changes
    - Update SELECT policy to use helper function (avoid potential recursion)
    - Simplify policies for better performance
    
  2. Security
    - Users can only see organizations they are members of
    - Only owners can update organizations
*/

-- Drop existing policy
DROP POLICY IF EXISTS "Users can view their organizations" ON organizations;

-- Recreate using helper function
CREATE POLICY "Users can view their organizations"
ON organizations
FOR SELECT
TO authenticated
USING (
  owner_id = auth.uid()
  OR public.user_is_member_of_org(id)
);
