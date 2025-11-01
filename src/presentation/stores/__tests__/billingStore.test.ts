import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useBillingStore } from '../billingStore';
import { createMockSupabaseClient, createMockInvoice, createMockPayment } from '../../../test/testUtils';

vi.mock('../../../lib/supabase', () => ({
  supabase: createMockSupabaseClient(),
}));

describe('BillingStore', () => {
  beforeEach(() => {
    useBillingStore.getState().reset();
    vi.clearAllMocks();
  });

  it('should have correct initial state', () => {
    const state = useBillingStore.getState();
    expect(state.invoices).toEqual([]);
    expect(state.payments).toEqual([]);
    expect(state.paymentMethods).toEqual([]);
    expect(state.subscriptions).toEqual([]);
    expect(state.stats.totalRevenue).toBe(0);
  });

  it('should create invoice successfully', async () => {
    const mockInvoice = createMockInvoice({ amount: 150 });

    const { supabase } = await import('../../../lib/supabase');
    vi.mocked(supabase.from).mockReturnValue({
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockInvoice, error: null }),
    } as any);

    const result = await useBillingStore.getState().createInvoice({
      contact_id: 'patient-1',
      amount: 150,
      currency: 'CAD',
      status: 'sent',
    });

    expect(result.amount).toBe(150);
    expect(useBillingStore.getState().invoices).toHaveLength(1);
  });

  it('should calculate stats correctly', () => {
    const invoices = [
      createMockInvoice({ id: '1', amount: 100, status: 'sent' }),
      createMockInvoice({ id: '2', amount: 200, status: 'overdue' }),
    ];

    const payments = [
      createMockPayment({ id: '1', amount: 150, status: 'completed' }),
      createMockPayment({ id: '2', amount: 50, status: 'completed' }),
    ];

    useBillingStore.setState({ invoices, payments });
    useBillingStore.getState().calculateStats();

    const state = useBillingStore.getState();
    expect(state.stats.totalRevenue).toBe(200);
    expect(state.stats.pendingAmount).toBe(100);
    expect(state.stats.overdueAmount).toBe(200);
  });

  it('should set default payment method', async () => {
    const methods = [
      { id: '1', contact_id: 'patient-1', is_default: true, type: 'card' as const, last4: '1234', brand: 'Visa', created_at: new Date().toISOString() },
      { id: '2', contact_id: 'patient-1', is_default: false, type: 'card' as const, last4: '5678', brand: 'Mastercard', created_at: new Date().toISOString() },
    ];

    useBillingStore.setState({ paymentMethods: methods });

    const { supabase } = await import('../../../lib/supabase');
    vi.mocked(supabase.from).mockReturnValue({
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: null }),
    } as any);

    await useBillingStore.getState().setDefaultPaymentMethod('2');

    const state = useBillingStore.getState();
    expect(state.paymentMethods[0].is_default).toBe(false);
    expect(state.paymentMethods[1].is_default).toBe(true);
  });

  it('should delete invoice', async () => {
    const invoice = createMockInvoice({ id: '1' });
    useBillingStore.setState({ invoices: [invoice] });

    const { supabase } = await import('../../../lib/supabase');
    vi.mocked(supabase.from).mockReturnValue({
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: null }),
    } as any);

    await useBillingStore.getState().deleteInvoice('1');

    expect(useBillingStore.getState().invoices).toHaveLength(0);
  });

  it('should refresh all billing data', async () => {
    const { supabase } = await import('../../../lib/supabase');
    const mockFrom = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [], error: null }),
    });
    vi.mocked(supabase.from).mockImplementation(mockFrom as any);

    await useBillingStore.getState().refresh();

    expect(mockFrom).toHaveBeenCalledWith('invoices');
    expect(mockFrom).toHaveBeenCalledWith('payments');
    expect(mockFrom).toHaveBeenCalledWith('payment_subscriptions');
  });
});
