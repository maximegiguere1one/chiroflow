import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { createMockPatient } from '../../test/testUtils';

const mockSupabase = {
  from: vi.fn(),
  channel: vi.fn(),
  storage: { from: vi.fn() },
  auth: { getUser: vi.fn(), getSession: vi.fn() },
  rpc: vi.fn(),
};

vi.mock('../../lib/supabase', () => ({ supabase: mockSupabase }));

const { usePatients } = await import('../usePatients');

describe('usePatients Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should load patients on mount', async () => {
    const mockPatients = [
      createMockPatient({ id: '1', full_name: 'John Doe' }),
      createMockPatient({ id: '2', full_name: 'Jane Smith' }),
    ];

    vi.mocked(mockSupabase.from).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockResolvedValue({
        data: mockPatients,
        error: null,
        count: 2,
      }),
    } as any);

    const { result } = renderHook(() => usePatients({ limit: 10 }, true));

    await waitFor(() => {
      expect(result.current.patients).toHaveLength(2);
    });

    expect(result.current.loading).toBe(false);
  });

  it('should not auto-load when autoLoad is false', () => {
    const { result } = renderHook(() => usePatients({ limit: 10 }, false));

    expect(result.current.patients).toHaveLength(0);
    expect(result.current.loading).toBe(false);
  });

  it('should expose create, update, delete functions', () => {
    const { result } = renderHook(() => usePatients());

    expect(typeof result.current.createPatient).toBe('function');
    expect(typeof result.current.updatePatient).toBe('function');
    expect(typeof result.current.deletePatient).toBe('function');
    expect(typeof result.current.refresh).toBe('function');
  });

  it('should expose pagination controls', () => {
    const { result } = renderHook(() => usePatients());

    expect(result.current.pagination).toBeDefined();
    expect(typeof result.current.setPage).toBe('function');
    expect(typeof result.current.setFilters).toBe('function');
  });
});
