/*
  # API Keys and Advanced RBAC System
  
  1. New Tables
    - `api_keys`
      - Third-party API access tokens
      - Scoped permissions and rate limiting
      - Usage tracking and revocation
      
    - `roles`
      - Granular permission system
      - Custom role definitions per organization
      
    - `permissions`
      - Individual permission definitions
      - Resource-based access control
      
    - `role_permissions`
      - Maps permissions to roles
      
    - `audit_logs`
      - Comprehensive activity tracking
      - Security and compliance logging
      
  2. Features
    - API key generation with prefixes
    - Fine-grained permission system
    - Activity auditing
    - Rate limiting support
    
  3. Security
    - RLS on all tables
    - API key hashing
    - Audit trail for sensitive operations
*/

-- Create roles table
CREATE TABLE IF NOT EXISTS roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL,
  description text,
  is_system_role boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(organization_id, slug)
);

-- Create permissions table
CREATE TABLE IF NOT EXISTS permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  resource text NOT NULL,
  action text NOT NULL,
  description text,
  is_system_permission boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(resource, action)
);

-- Create role_permissions junction table
CREATE TABLE IF NOT EXISTS role_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id uuid NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id uuid NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(role_id, permission_id)
);

-- Create api_keys table
CREATE TABLE IF NOT EXISTS api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  key_prefix text NOT NULL,
  key_hash text NOT NULL UNIQUE,
  last_four text NOT NULL,
  scopes jsonb DEFAULT '[]'::jsonb,
  rate_limit_per_hour integer DEFAULT 1000,
  is_active boolean DEFAULT true,
  last_used_at timestamptz,
  expires_at timestamptz,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  revoked_at timestamptz,
  revoked_by uuid REFERENCES auth.users(id)
);

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id),
  api_key_id uuid REFERENCES api_keys(id),
  action text NOT NULL,
  resource_type text,
  resource_id uuid,
  old_values jsonb,
  new_values jsonb,
  ip_address inet,
  user_agent text,
  status text DEFAULT 'success',
  error_message text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_roles_org ON roles(organization_id);
CREATE INDEX idx_api_keys_org ON api_keys(organization_id);
CREATE INDEX idx_api_keys_hash ON api_keys(key_hash);
CREATE INDEX idx_api_keys_active ON api_keys(is_active) WHERE is_active = true;
CREATE INDEX idx_audit_logs_org ON audit_logs(organization_id);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);

-- Enable RLS
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for roles
CREATE POLICY "Organization members can view roles"
  ON roles FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Organization admins can manage roles"
  ON roles FOR ALL
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND status = 'active' AND role IN ('owner', 'admin')
    )
  );

-- RLS Policies for permissions (everyone can read)
CREATE POLICY "Anyone can view permissions"
  ON permissions FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies for role_permissions
CREATE POLICY "Organization members can view role permissions"
  ON role_permissions FOR SELECT
  TO authenticated
  USING (
    role_id IN (
      SELECT r.id FROM roles r
      INNER JOIN organization_members om ON r.organization_id = om.organization_id
      WHERE om.user_id = auth.uid() AND om.status = 'active'
    )
  );

-- RLS Policies for api_keys
CREATE POLICY "Organization admins can manage API keys"
  ON api_keys FOR ALL
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND status = 'active' AND role IN ('owner', 'admin')
    )
  );

-- RLS Policies for audit_logs
CREATE POLICY "Organization admins can view audit logs"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND status = 'active' AND role IN ('owner', 'admin')
    )
  );

-- Insert system permissions
INSERT INTO permissions (resource, action, description, is_system_permission) VALUES
  ('appointments', 'create', 'Create appointments', true),
  ('appointments', 'read', 'View appointments', true),
  ('appointments', 'update', 'Update appointments', true),
  ('appointments', 'delete', 'Delete appointments', true),
  ('patients', 'create', 'Create patient records', true),
  ('patients', 'read', 'View patient records', true),
  ('patients', 'update', 'Update patient records', true),
  ('patients', 'delete', 'Delete patient records', true),
  ('billing', 'create', 'Create invoices', true),
  ('billing', 'read', 'View billing information', true),
  ('billing', 'update', 'Update invoices', true),
  ('billing', 'delete', 'Delete invoices', true),
  ('reports', 'read', 'View reports and analytics', true),
  ('settings', 'read', 'View organization settings', true),
  ('settings', 'update', 'Update organization settings', true),
  ('users', 'invite', 'Invite new users', true),
  ('users', 'manage', 'Manage user permissions', true)
ON CONFLICT (resource, action) DO NOTHING;

-- Function to check user permission
CREATE OR REPLACE FUNCTION user_has_permission(
  user_id_param uuid,
  org_id_param uuid,
  resource_param text,
  action_param text
)
RETURNS boolean AS $$
DECLARE
  user_role text;
  has_perm boolean;
BEGIN
  -- Get user's role in organization
  SELECT role INTO user_role
  FROM organization_members
  WHERE user_id = user_id_param 
  AND organization_id = org_id_param
  AND status = 'active';
  
  -- Owner and admin have all permissions
  IF user_role IN ('owner', 'admin') THEN
    RETURN true;
  END IF;
  
  -- Check specific permission
  SELECT EXISTS (
    SELECT 1
    FROM organization_members om
    INNER JOIN roles r ON r.slug = om.role AND r.organization_id = om.organization_id
    INNER JOIN role_permissions rp ON rp.role_id = r.id
    INNER JOIN permissions p ON p.id = rp.permission_id
    WHERE om.user_id = user_id_param
    AND om.organization_id = org_id_param
    AND om.status = 'active'
    AND p.resource = resource_param
    AND p.action = action_param
  ) INTO has_perm;
  
  RETURN COALESCE(has_perm, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Function to log audit events
CREATE OR REPLACE FUNCTION log_audit_event(
  org_id uuid,
  action_name text,
  resource_type_param text DEFAULT NULL,
  resource_id_param uuid DEFAULT NULL,
  old_vals jsonb DEFAULT NULL,
  new_vals jsonb DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  INSERT INTO audit_logs (
    organization_id,
    user_id,
    action,
    resource_type,
    resource_id,
    old_values,
    new_values
  ) VALUES (
    org_id,
    auth.uid(),
    action_name,
    resource_type_param,
    resource_id_param,
    old_vals,
    new_vals
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-log appointment changes
CREATE OR REPLACE FUNCTION audit_appointment_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM log_audit_event(
      NEW.organization_id,
      'appointment.created',
      'appointment',
      NEW.id,
      NULL,
      to_jsonb(NEW)
    );
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM log_audit_event(
      NEW.organization_id,
      'appointment.updated',
      'appointment',
      NEW.id,
      to_jsonb(OLD),
      to_jsonb(NEW)
    );
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM log_audit_event(
      OLD.organization_id,
      'appointment.deleted',
      'appointment',
      OLD.id,
      to_jsonb(OLD),
      NULL
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS audit_appointments ON appointments;
CREATE TRIGGER audit_appointments
  AFTER INSERT OR UPDATE OR DELETE ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION audit_appointment_changes();
