/*
  # Create waitlist_invitations table

  ## Overview
  Tracks invitations sent to waitlist clients when slots become available.

  ## Changes
  1. Create waitlist_invitations table
  2. Add RLS policies
  3. Add indexes for performance
*/

-- Create waitlist_invitations table
CREATE TABLE IF NOT EXISTS public.waitlist_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  waitlist_id uuid,
  waitlist_type text NOT NULL,
  contact_id uuid REFERENCES contacts(id) ON DELETE SET NULL,
  email text NOT NULL,
  phone text,
  slot_date date NOT NULL,
  slot_time time NOT NULL,
  status text DEFAULT 'sent',
  owner_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  response_token uuid DEFAULT gen_random_uuid(),
  expires_at timestamptz NOT NULL,
  sent_at timestamptz DEFAULT now(),
  responded_at timestamptz,
  response_type text,
  appointment_id uuid REFERENCES appointments(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_invitation_status CHECK (
    status IN ('sent', 'accepted', 'declined', 'expired', 'cancelled')
  ),
  CONSTRAINT valid_waitlist_type CHECK (
    waitlist_type IN ('new_client', 'recall')
  ),
  CONSTRAINT valid_response_type CHECK (
    response_type IS NULL OR response_type IN ('accept', 'decline')
  )
);

-- Enable RLS
ALTER TABLE public.waitlist_invitations ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Users can view own invitations" ON public.waitlist_invitations;
CREATE POLICY "Users can view own invitations"
  ON public.waitlist_invitations FOR SELECT
  TO authenticated
  USING (
    owner_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Users can manage own invitations" ON public.waitlist_invitations;
CREATE POLICY "Users can manage own invitations"
  ON public.waitlist_invitations FOR ALL
  TO authenticated
  USING (
    owner_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    owner_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Public can view/update by token (for responding to invitations)
DROP POLICY IF EXISTS "Public can respond to invitations" ON public.waitlist_invitations;
CREATE POLICY "Public can respond to invitations"
  ON public.waitlist_invitations FOR UPDATE
  TO anon, authenticated
  USING (expires_at > now())
  WITH CHECK (expires_at > now());

-- Indexes
CREATE INDEX IF NOT EXISTS idx_waitlist_invitations_owner_id ON waitlist_invitations(owner_id);
CREATE INDEX IF NOT EXISTS idx_waitlist_invitations_waitlist ON waitlist_invitations(waitlist_id, waitlist_type);
CREATE INDEX IF NOT EXISTS idx_waitlist_invitations_contact ON waitlist_invitations(contact_id);
CREATE INDEX IF NOT EXISTS idx_waitlist_invitations_status ON waitlist_invitations(status);
CREATE INDEX IF NOT EXISTS idx_waitlist_invitations_token ON waitlist_invitations(response_token);
CREATE INDEX IF NOT EXISTS idx_waitlist_invitations_slot ON waitlist_invitations(slot_date, slot_time);
CREATE INDEX IF NOT EXISTS idx_waitlist_invitations_expires ON waitlist_invitations(expires_at) WHERE status = 'sent';

-- Grant access
GRANT SELECT, INSERT, UPDATE, DELETE ON public.waitlist_invitations TO anon, authenticated;

COMMENT ON TABLE public.waitlist_invitations IS
  'Tracks invitations sent to waitlist clients when appointment slots become available';
