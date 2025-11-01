import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useBilling, useBillingStats } from '../useBilling';
import { createMockSupabaseClient, createMockInvoice, createMockPayment } from '../../test/testUtils';

vi.mock('../../lib/supabase', () => ({
  supabase: createMockSupabaseClient(),
}));

describe('useBilling Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should load billing data for specific contact', async () => {
    const mockInvoices = [createMockInvoice()];
    const mockPayments = [createMockPayment()];

    const { supabase } = await import('../../lib/supabase');
    const mockFrom = vi.fn().mockImplementation((table: string) => {
      if (table === 'invoices') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({ data: mockInvoices, error: null }),
        };
      }
      if (table === 'payments') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({ data: mockPayments, error: null }),
        };
      }
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      };
    });

    vi.mocked(supabase.from).mockImplementation(mockFrom as any);

    const { result } = renderHook(() => useBilling('patient-1', true));

    await waitFor(() => {
      expect(result.current.invoices.length).toBeGreaterThan(0);
    });
  });

  it('should expose billing CRUD operations', () => {
    const { result } = renderHook(() => useBilling());

    expect(typeof result.current.createInvoice).toBe('function');
    expect(typeof result.current.updateInvoice).toBe('function');
    expect(typeof result.current.deleteInvoice).toBe('function');
    expect(typeof result.current.createPayment).toBe('function');
    expect(typeof result.current.addPaymentMethod).toBe('function');
  });
});

describe('useBillingStats Hook', () => {
  it('should provide billing statistics', () => {
    const { result } = renderHook(() => useBillingStats());

    expect(result.current.stats).toBeDefined();
    expect(result.current.stats.totalRevenue).toBeDefined();
    expect(result.current.stats.pendingAmount).toBeDefined();
    expect(result.current.stats.overdueAmount).toBeDefined();
    expect(result.current.stats.activeSubscriptions).toBeDefined();
  });
});
