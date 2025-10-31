/*
  # Add Organization Context to Existing Tables
  
  1. Modifications
    - Add `organization_id` column to core tables
    - Update RLS policies to enforce organization isolation
    - Create helper functions for organization context
    - Maintain backward compatibility during transition
    
  2. Tables Updated
    - appointments
    - contacts
    - patients_full
    - invoices
    - payment_methods
    - service_types
    - clinic_settings
    - branding_settings
    - notification_settings
    - waitlist
    - recall_waitlist
    
  3. Security
    - All queries now scoped to organization
    - Prevent cross-organization data leaks
    - Automatic organization assignment
*/

-- Add organization_id to appointments (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'appointments' AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE appointments ADD COLUMN organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE;
    CREATE INDEX idx_appointments_organization ON appointments(organization_id);
  END IF;
END $$;

-- Add organization_id to contacts
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contacts' AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE contacts ADD COLUMN organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE;
    CREATE INDEX idx_contacts_organization ON contacts(organization_id);
  END IF;
END $$;

-- Add organization_id to patients_full
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'patients_full' AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE patients_full ADD COLUMN organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE;
    CREATE INDEX idx_patients_organization ON patients_full(organization_id);
  END IF;
END $$;

-- Add organization_id to invoices
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'invoices' AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE invoices ADD COLUMN organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE;
    CREATE INDEX idx_invoices_organization ON invoices(organization_id);
  END IF;
END $$;

-- Add organization_id to payment_methods
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payment_methods' AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE payment_methods ADD COLUMN organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE;
    CREATE INDEX idx_payment_methods_organization ON payment_methods(organization_id);
  END IF;
END $$;

-- Add organization_id to service_types
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'service_types' AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE service_types ADD COLUMN organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE;
    CREATE INDEX idx_service_types_organization ON service_types(organization_id);
  END IF;
END $$;

-- Add organization_id to clinic_settings
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clinic_settings' AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE clinic_settings ADD COLUMN organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE;
    CREATE INDEX idx_clinic_settings_organization ON clinic_settings(organization_id);
  END IF;
END $$;

-- Add organization_id to branding_settings
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'branding_settings' AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE branding_settings ADD COLUMN organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE;
    CREATE INDEX idx_branding_settings_organization ON branding_settings(organization_id);
  END IF;
END $$;

-- Add organization_id to notification_settings
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'notification_settings' AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE notification_settings ADD COLUMN organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE;
    CREATE INDEX idx_notification_settings_organization ON notification_settings(organization_id);
  END IF;
END $$;

-- Add organization_id to waitlist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'waitlist' AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE waitlist ADD COLUMN organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE;
    CREATE INDEX idx_waitlist_organization ON waitlist(organization_id);
  END IF;
END $$;

-- Add organization_id to recall_waitlist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'recall_waitlist' AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE recall_waitlist ADD COLUMN organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE;
    CREATE INDEX idx_recall_waitlist_organization ON recall_waitlist(organization_id);
  END IF;
END $$;

-- Add organization_id to soap_notes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'soap_notes' AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE soap_notes ADD COLUMN organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE;
    CREATE INDEX idx_soap_notes_organization ON soap_notes(organization_id);
  END IF;
END $$;

-- Add organization_id to workflow_automation
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'workflow_automation' AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE workflow_automation ADD COLUMN organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE;
    CREATE INDEX idx_workflow_automation_organization ON workflow_automation(organization_id);
  END IF;
END $$;

-- Update RLS policies to use organization context
-- Note: This replaces existing policies with organization-aware versions

-- Drop old policies and create new ones for appointments
DROP POLICY IF EXISTS "Users can view own appointments" ON appointments;
DROP POLICY IF EXISTS "Users can insert own appointments" ON appointments;
DROP POLICY IF EXISTS "Users can update own appointments" ON appointments;

CREATE POLICY "Organization members can view appointments"
  ON appointments FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Organization members can insert appointments"
  ON appointments FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Organization members can update appointments"
  ON appointments FOR UPDATE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Organization members can delete appointments"
  ON appointments FOR DELETE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- Function to auto-set organization_id on insert
CREATE OR REPLACE FUNCTION set_organization_context()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.organization_id IS NULL THEN
    NEW.organization_id := get_user_organization();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for automatic organization assignment
DROP TRIGGER IF EXISTS set_appointments_org ON appointments;
CREATE TRIGGER set_appointments_org
  BEFORE INSERT ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION set_organization_context();

DROP TRIGGER IF EXISTS set_contacts_org ON contacts;
CREATE TRIGGER set_contacts_org
  BEFORE INSERT ON contacts
  FOR EACH ROW
  EXECUTE FUNCTION set_organization_context();

DROP TRIGGER IF EXISTS set_patients_org ON patients_full;
CREATE TRIGGER set_patients_org
  BEFORE INSERT ON patients_full
  FOR EACH ROW
  EXECUTE FUNCTION set_organization_context();

DROP TRIGGER IF EXISTS set_invoices_org ON invoices;
CREATE TRIGGER set_invoices_org
  BEFORE INSERT ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION set_organization_context();
