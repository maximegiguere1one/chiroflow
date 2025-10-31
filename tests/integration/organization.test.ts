import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { OrganizationService } from '../../src/lib/saas/organizationService';
import { supabase } from '../../src/lib/supabase';

describe('Organization Service', () => {
  let testOrgId: string;
  let testUserId: string;

  beforeEach(async () => {
    const { data: user } = await supabase.auth.signUp({
      email: `test-${Date.now()}@example.com`,
      password: 'Test123456!',
    });

    testUserId = user.user?.id || '';

    const org = await OrganizationService.createOrganization({
      name: 'Test Clinic',
      slug: `test-clinic-${Date.now()}`,
      email: 'test@clinic.com',
      phone: '+1234567890',
    });

    testOrgId = org!.id;
  });

  afterEach(async () => {
    if (testOrgId) {
      await supabase.from('organizations').delete().eq('id', testOrgId);
    }

    if (testUserId) {
      await supabase.auth.admin.deleteUser(testUserId);
    }
  });

  it('should create an organization', async () => {
    const org = await OrganizationService.getCurrentOrganization();
    expect(org).not.toBeNull();
    expect(org?.name).toBe('Test Clinic');
    expect(org?.subscription_tier).toBe('trial');
  });

  it('should update organization details', async () => {
    const updated = await OrganizationService.updateOrganization(testOrgId, {
      name: 'Updated Clinic Name',
      phone: '+9876543210',
    });

    expect(updated?.name).toBe('Updated Clinic Name');
    expect(updated?.phone).toBe('+9876543210');
  });

  it('should list organization members', async () => {
    const members = await OrganizationService.getOrganizationMembers(testOrgId);
    expect(members).toHaveLength(1);
    expect(members[0].role).toBe('owner');
  });

  it('should check feature access', async () => {
    const hasAppointments = await OrganizationService.checkFeatureAccess(
      testOrgId,
      'appointments'
    );
    expect(hasAppointments).toBe(true);

    const hasAPI = await OrganizationService.checkFeatureAccess(testOrgId, 'api_access');
    expect(hasAPI).toBe(false);
  });

  it('should track usage metrics', async () => {
    await OrganizationService.trackUsage(testOrgId, 'appointments_created', 5);

    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const metrics = await OrganizationService.getUsageMetrics(
      testOrgId,
      periodStart,
      periodEnd
    );

    expect(metrics).toHaveLength(1);
    expect(metrics[0].metric_name).toBe('appointments_created');
    expect(metrics[0].metric_value).toBe(5);
  });
});

describe('Subscription Plans', () => {
  it('should fetch available subscription plans', async () => {
    const plans = await OrganizationService.getSubscriptionPlans();

    expect(plans.length).toBeGreaterThan(0);
    expect(plans).toContainEqual(
      expect.objectContaining({
        slug: 'starter',
        name: 'Starter',
      })
    );
  });
});
