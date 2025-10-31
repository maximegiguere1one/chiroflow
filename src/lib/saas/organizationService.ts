import { supabase } from '../supabase';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  owner_id: string;
  subscription_tier: string;
  subscription_status: string;
  trial_ends_at: string | null;
  max_users: number;
  max_patients: number;
  max_appointments_per_month: number;
  features_enabled: Record<string, boolean>;
  settings: Record<string, any>;
  metadata: Record<string, any>;
  logo_url: string | null;
  website: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  timezone: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface OrganizationMember {
  id: string;
  organization_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'practitioner' | 'staff' | 'billing';
  permissions: Record<string, any>;
  invited_by: string | null;
  invited_at: string;
  joined_at: string | null;
  status: 'pending' | 'active' | 'suspended';
  created_at: string;
  updated_at: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  slug: string;
  description: string;
  price_monthly: number;
  price_yearly: number;
  currency: string;
  features: string[];
  limits: Record<string, number>;
  stripe_price_id_monthly: string | null;
  stripe_price_id_yearly: string | null;
  is_active: boolean;
  sort_order: number;
}

export class OrganizationService {
  static async getCurrentOrganization(): Promise<Organization | null> {
    const { data, error } = await supabase
      .from('organization_members')
      .select(`
        organization_id,
        organizations (*)
      `)
      .eq('status', 'active')
      .single();

    if (error || !data) return null;
    return (data as any).organizations as Organization;
  }

  static async getUserOrganizations(): Promise<Organization[]> {
    const { data, error } = await supabase
      .from('organization_members')
      .select(`
        organizations (*)
      `)
      .eq('status', 'active');

    if (error || !data) return [];
    return data.map((item: any) => item.organizations);
  }

  static async createOrganization(org: {
    name: string;
    slug: string;
    email?: string;
    phone?: string;
    timezone?: string;
  }): Promise<Organization | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('organizations')
      .insert({
        name: org.name,
        slug: org.slug,
        owner_id: user.id,
        email: org.email,
        phone: org.phone,
        timezone: org.timezone || 'America/Toronto',
        subscription_tier: 'trial',
        subscription_status: 'trialing',
        trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async updateOrganization(
    orgId: string,
    updates: Partial<Organization>
  ): Promise<Organization | null> {
    const { data, error } = await supabase
      .from('organizations')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orgId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async getOrganizationMembers(orgId: string): Promise<OrganizationMember[]> {
    const { data, error } = await supabase
      .from('organization_members')
      .select('*')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async inviteMember(
    orgId: string,
    email: string,
    role: OrganizationMember['role']
  ): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase.from('organization_members').insert({
      organization_id: orgId,
      user_id: email,
      role,
      status: 'pending',
      invited_by: user.id,
    });

    if (error) throw error;
  }

  static async updateMemberRole(
    memberId: string,
    role: OrganizationMember['role']
  ): Promise<void> {
    const { error } = await supabase
      .from('organization_members')
      .update({ role, updated_at: new Date().toISOString() })
      .eq('id', memberId);

    if (error) throw error;
  }

  static async removeMember(memberId: string): Promise<void> {
    const { error } = await supabase
      .from('organization_members')
      .delete()
      .eq('id', memberId);

    if (error) throw error;
  }

  static async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    const { data, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  static async getCurrentSubscription(orgId: string) {
    const { data, error } = await supabase
      .from('organization_subscriptions')
      .select(`
        *,
        subscription_plans (*)
      `)
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) return null;
    return data;
  }

  static async getUsageMetrics(orgId: string, periodStart: Date, periodEnd: Date) {
    const { data, error } = await supabase
      .from('usage_tracking')
      .select('*')
      .eq('organization_id', orgId)
      .gte('period_start', periodStart.toISOString())
      .lte('period_end', periodEnd.toISOString());

    if (error) throw error;
    return data || [];
  }

  static async trackUsage(
    orgId: string,
    metricName: string,
    value: number = 1
  ): Promise<void> {
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const { error } = await supabase.from('usage_tracking').upsert({
      organization_id: orgId,
      metric_name: metricName,
      metric_value: value,
      period_start: periodStart.toISOString(),
      period_end: periodEnd.toISOString(),
    });

    if (error && error.code !== '23505') {
      console.error('Failed to track usage:', error);
    }
  }

  static async checkFeatureAccess(
    orgId: string,
    featureName: string
  ): Promise<boolean> {
    const { data } = await supabase.rpc('has_feature_access', {
      org_id: orgId,
      feature_name: featureName,
    });

    return data || false;
  }
}
