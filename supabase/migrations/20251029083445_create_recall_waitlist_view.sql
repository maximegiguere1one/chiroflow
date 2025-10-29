/*
  # Create recall_waitlist view

  ## Overview
  Creates a view for recall waitlist (existing patients to recall for appointments).
  This is separate from new_client_waitlist which is for new patients.

  ## Changes
  1. Create recall_waitlist table for existing patients
  2. Add RLS policies
  3. Add indexes
*/

-- Create recall_waitlist table
CREATE TABLE IF NOT EXISTS public.recall_waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid REFERENCES contacts(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  reason text,
  last_visit_date date,
  priority integer DEFAULT 0,
  status text DEFAULT 'active',
  owner_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  notes text,
  preferred_days_of_week text[],
  preferred_time_ranges jsonb,
  auto_accept_enabled boolean DEFAULT false,
  notified boolean DEFAULT false,
  invitation_count integer DEFAULT 0,
  last_invitation_sent_at timestamptz,
  unsubscribed_at timestamptz,
  added_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_recall_status CHECK (
    status IN ('active', 'contacted', 'scheduled', 'cancelled', 'completed')
  )
);

-- Enable RLS
ALTER TABLE public.recall_waitlist ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Users can view own recall waitlist" ON public.recall_waitlist;
CREATE POLICY "Users can view own recall waitlist"
  ON public.recall_waitlist FOR SELECT
  TO authenticated
  USING (
    owner_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Users can manage own recall waitlist" ON public.recall_waitlist;
CREATE POLICY "Users can manage own recall waitlist"
  ON public.recall_waitlist FOR ALL
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

-- Public can insert (for online booking)
DROP POLICY IF EXISTS "Public can insert recall requests" ON public.recall_waitlist;
CREATE POLICY "Public can insert recall requests"
  ON public.recall_waitlist FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_recall_waitlist_owner_id ON recall_waitlist(owner_id);
CREATE INDEX IF NOT EXISTS idx_recall_waitlist_contact_id ON recall_waitlist(contact_id);
CREATE INDEX IF NOT EXISTS idx_recall_waitlist_status ON recall_waitlist(status);
CREATE INDEX IF NOT EXISTS idx_recall_waitlist_priority ON recall_waitlist(priority DESC);
CREATE INDEX IF NOT EXISTS idx_recall_waitlist_added_at ON recall_waitlist(added_at);

-- Grant access
GRANT SELECT, INSERT, UPDATE, DELETE ON public.recall_waitlist TO anon, authenticated;

COMMENT ON TABLE public.recall_waitlist IS
  'Waitlist for recalling existing patients for follow-up appointments';
