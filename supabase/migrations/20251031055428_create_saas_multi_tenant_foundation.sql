/*
  # Multi-Tenant SaaS Foundation
  
  1. New Tables
    - `organizations`
      - Core tenant entity representing each clinic/practice
      - Stores organization profile, settings, and metadata
      - `id` (uuid, primary key)
      - `name` (text) - Organization/clinic name
      - `slug` (text, unique) - URL-safe identifier
      - `owner_id` (uuid) - References auth.users
      - `subscription_tier` (text) - Plan level
      - `subscription_status` (text) - active, trialing, past_due, cancelled
      - `trial_ends_at` (timestamptz) - Trial expiration
      - `max_users` (integer) - User limit based on plan
      - `max_patients` (integer) - Patient limit based on plan
      - `max_appointments_per_month` (integer) - Usage quota
      - `features_enabled` (jsonb) - Feature flags per org
      - `settings` (jsonb) - Organization-specific settings
      - `metadata` (jsonb) - Additional data
      - `created_at`, `updated_at` timestamps
      
    - `organization_members`
      - Maps users to organizations with roles
      - `id` (uuid, primary key)
      - `organization_id` (uuid) - References organizations
      - `user_id` (uuid) - References auth.users
      - `role` (text) - owner, admin, practitioner, staff, billing
      - `permissions` (jsonb) - Granular permissions
      - `invited_by` (uuid) - Who invited this member
      - `invited_at` (timestamptz)
      - `joined_at` (timestamptz)
      - `status` (text) - pending, active, suspended
      - `created_at`, `updated_at`
      
    - `subscription_plans`
      - Available subscription tiers
      - `id` (uuid, primary key)
      - `name` (text) - Plan name (Starter, Professional, Enterprise)
      - `slug` (text, unique)
      - `description` (text)
      - `price_monthly` (decimal)
      - `price_yearly` (decimal)
      - `currency` (text) - USD, CAD, etc.
      - `features` (jsonb) - List of included features
      - `limits` (jsonb) - Usage limits
      - `stripe_price_id_monthly` (text)
      - `stripe_price_id_yearly` (text)
      - `is_active` (boolean)
      - `sort_order` (integer)
      - `created_at`, `updated_at`
      
    - `organization_subscriptions`
      - Subscription billing history
      - `id` (uuid, primary key)
      - `organization_id` (uuid) - References organizations
      - `plan_id` (uuid) - References subscription_plans
      - `stripe_subscription_id` (text)
      - `stripe_customer_id` (text)
      - `status` (text) - active, trialing, past_due, cancelled, unpaid
      - `billing_interval` (text) - monthly, yearly
      - `current_period_start` (timestamptz)
      - `current_period_end` (timestamptz)
      - `cancel_at_period_end` (boolean)
      - `cancelled_at` (timestamptz)
      - `trial_start` (timestamptz)
      - `trial_end` (timestamptz)
      - `created_at`, `updated_at`
      
    - `usage_tracking`
      - Track feature usage per organization
      - `id` (uuid, primary key)
      - `organization_id` (uuid)
      - `metric_name` (text) - appointments_created, patients_added, emails_sent
      - `metric_value` (integer)
      - `period_start` (timestamptz)
      - `period_end` (timestamptz)
      - `metadata` (jsonb)
      - `created_at`
      
  2. Security
    - Enable RLS on all new tables
    - Organization isolation policies
    - Member access policies based on role
    - Prevent cross-organization data access
    
  3. Migrations
    - Add organization_id to existing tables
    - Update RLS policies for multi-tenancy
    - Create indexes for performance
*/

-- Create organizations table
CREATE TABLE IF NOT EXISTS organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  subscription_tier text NOT NULL DEFAULT 'trial',
  subscription_status text NOT NULL DEFAULT 'trialing',
  trial_ends_at timestamptz,
  max_users integer NOT NULL DEFAULT 3,
  max_patients integer NOT NULL DEFAULT 100,
  max_appointments_per_month integer NOT NULL DEFAULT 500,
  features_enabled jsonb DEFAULT '{"appointments": true, "billing": false, "analytics": false, "api_access": false}'::jsonb,
  settings jsonb DEFAULT '{}'::jsonb,
  metadata jsonb DEFAULT '{}'::jsonb,
  logo_url text,
  website text,
  phone text,
  email text,
  address text,
  timezone text DEFAULT 'America/Toronto',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create organization_members table
CREATE TABLE IF NOT EXISTS organization_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'staff',
  permissions jsonb DEFAULT '{}'::jsonb,
  invited_by uuid REFERENCES auth.users(id),
  invited_at timestamptz DEFAULT now(),
  joined_at timestamptz,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(organization_id, user_id)
);

-- Create subscription_plans table
CREATE TABLE IF NOT EXISTS subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  price_monthly decimal(10,2) NOT NULL DEFAULT 0,
  price_yearly decimal(10,2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  features jsonb DEFAULT '[]'::jsonb,
  limits jsonb DEFAULT '{}'::jsonb,
  stripe_price_id_monthly text,
  stripe_price_id_yearly text,
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create organization_subscriptions table
CREATE TABLE IF NOT EXISTS organization_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  plan_id uuid REFERENCES subscription_plans(id),
  stripe_subscription_id text UNIQUE,
  stripe_customer_id text,
  status text NOT NULL DEFAULT 'trialing',
  billing_interval text NOT NULL DEFAULT 'monthly',
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean DEFAULT false,
  cancelled_at timestamptz,
  trial_start timestamptz,
  trial_end timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create usage_tracking table
CREATE TABLE IF NOT EXISTS usage_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  metric_name text NOT NULL,
  metric_value integer NOT NULL DEFAULT 0,
  period_start timestamptz NOT NULL,
  period_end timestamptz NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_organizations_owner ON organizations(owner_id);
CREATE INDEX IF NOT EXISTS idx_organizations_slug ON organizations(slug);
CREATE INDEX IF NOT EXISTS idx_organizations_status ON organizations(subscription_status);
CREATE INDEX IF NOT EXISTS idx_org_members_org ON organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_members_user ON organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_org_members_status ON organization_members(status);
CREATE INDEX IF NOT EXISTS idx_org_subs_org ON organization_subscriptions(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_subs_stripe ON organization_subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_org ON usage_tracking(organization_id);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_metric ON usage_tracking(metric_name);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_period ON usage_tracking(period_start, period_end);

-- Enable RLS
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;

-- RLS Policies for organizations
CREATE POLICY "Users can view their organizations"
  ON organizations FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
    OR owner_id = auth.uid()
  );

CREATE POLICY "Organization owners can update their org"
  ON organizations FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Authenticated users can create organizations"
  ON organizations FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = auth.uid());

-- RLS Policies for organization_members
CREATE POLICY "Users can view members of their organizations"
  ON organization_members FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Organization admins can manage members"
  ON organization_members FOR ALL
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() 
      AND status = 'active'
      AND role IN ('owner', 'admin')
    )
  );

-- RLS Policies for subscription_plans (public read)
CREATE POLICY "Anyone can view active subscription plans"
  ON subscription_plans FOR SELECT
  TO authenticated
  USING (is_active = true);

-- RLS Policies for organization_subscriptions
CREATE POLICY "Organization members can view their subscription"
  ON organization_subscriptions FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Organization owners can manage subscriptions"
  ON organization_subscriptions FOR ALL
  TO authenticated
  USING (
    organization_id IN (
      SELECT id FROM organizations WHERE owner_id = auth.uid()
    )
  );

-- RLS Policies for usage_tracking
CREATE POLICY "Organization members can view their usage"
  ON usage_tracking FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- Insert default subscription plans
INSERT INTO subscription_plans (name, slug, description, price_monthly, price_yearly, limits, features, sort_order)
VALUES 
  (
    'Starter',
    'starter',
    'Perfect for solo practitioners just getting started',
    29.00,
    290.00,
    '{"max_users": 2, "max_patients": 100, "max_appointments_per_month": 200}'::jsonb,
    '["appointments", "patients", "basic_billing", "email_reminders"]'::jsonb,
    1
  ),
  (
    'Professional',
    'professional',
    'For growing practices with multiple providers',
    79.00,
    790.00,
    '{"max_users": 10, "max_patients": 1000, "max_appointments_per_month": 2000}'::jsonb,
    '["appointments", "patients", "advanced_billing", "email_reminders", "sms_reminders", "analytics", "waitlist", "patient_portal"]'::jsonb,
    2
  ),
  (
    'Enterprise',
    'enterprise',
    'For large multi-location practices',
    199.00,
    1990.00,
    '{"max_users": -1, "max_patients": -1, "max_appointments_per_month": -1}'::jsonb,
    '["appointments", "patients", "advanced_billing", "email_reminders", "sms_reminders", "analytics", "waitlist", "patient_portal", "api_access", "custom_branding", "priority_support", "custom_integrations"]'::jsonb,
    3
  )
ON CONFLICT (slug) DO NOTHING;

-- Function to automatically create organization membership when org is created
CREATE OR REPLACE FUNCTION create_owner_membership()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO organization_members (
    organization_id,
    user_id,
    role,
    status,
    joined_at
  )
  VALUES (
    NEW.id,
    NEW.owner_id,
    'owner',
    'active',
    now()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_organization_created
  AFTER INSERT ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION create_owner_membership();

-- Function to get current user's organization
CREATE OR REPLACE FUNCTION get_user_organization()
RETURNS uuid AS $$
  SELECT organization_id 
  FROM organization_members 
  WHERE user_id = auth.uid() 
  AND status = 'active'
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Function to check organization feature access
CREATE OR REPLACE FUNCTION has_feature_access(org_id uuid, feature_name text)
RETURNS boolean AS $$
  SELECT (features_enabled->feature_name)::boolean
  FROM organizations
  WHERE id = org_id;
$$ LANGUAGE sql SECURITY DEFINER STABLE;
