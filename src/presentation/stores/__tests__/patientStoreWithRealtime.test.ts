import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createMockPatient, flushPromises } from '../../../test/testUtils';

const mockSupabase = {
  from: vi.fn(),
  channel: vi.fn().mockReturnValue({
    on: vi.fn().mockReturnThis(),
    subscribe: vi.fn((cb) => { if (cb) cb('SUBSCRIBED'); return { unsubscribe: vi.fn() }; }),
    unsubscribe: vi.fn(),
  }),
  storage: { from: vi.fn() },
  auth: { getUser: vi.fn(), getSession: vi.fn() },
  rpc: vi.fn(),
};

vi.mock('../../../lib/supabase', () => ({
  supabase: mockSupabase,
}));

const { usePatientStoreWithRealtime } = await import('../patientStoreWithRealtime');

describe('PatientStoreWithRealtime', () => {
  beforeEach(() => {
    usePatientStoreWithRealtime.getState().reset();
    vi.clearAllMocks();
  });

  describe('Realtime Functionality', () => {
    it('should enable realtime successfully', () => {
      const store = usePatientStoreWithRealtime.getState();

      expect(store.isRealtimeActive).toBe(false);
      expect(store.realtimeChannel).toBeNull();

      store.enableRealtime();

      const updatedState = usePatientStoreWithRealtime.getState();
      expect(updatedState.isRealtimeActive).toBe(true);
      expect(updatedState.realtimeChannel).toBeTruthy();
    });

    it('should disable realtime successfully', () => {
      const store = usePatientStoreWithRealtime.getState();
      store.enableRealtime();

      expect(store.isRealtimeActive).toBe(true);

      store.disableRealtime();

      const updatedState = usePatientStoreWithRealtime.getState();
      expect(updatedState.isRealtimeActive).toBe(false);
      expect(updatedState.realtimeChannel).toBeNull();
    });

    it('should not enable realtime twice', () => {
      const store = usePatientStoreWithRealtime.getState();

      store.enableRealtime();
      const firstChannel = store.realtimeChannel;

      store.enableRealtime();
      const secondChannel = usePatientStoreWithRealtime.getState().realtimeChannel;

      expect(firstChannel).toBe(secondChannel);
    });

    it('should handle INSERT events', () => {
      const store = usePatientStoreWithRealtime.getState();
      store.enableRealtime();

      const newPatient = createMockPatient({ id: 'new-1', full_name: 'New Patient' });

      const mockPayload = {
        eventType: 'INSERT',
        new: newPatient,
        old: {},
        errors: null,
      };

      const state = usePatientStoreWithRealtime.getState();
      expect(state.patients).toHaveLength(0);
    });

    it('should handle UPDATE events', () => {
      const existingPatient = createMockPatient({ id: '1', full_name: 'Original' });
      usePatientStoreWithRealtime.setState({ patients: [existingPatient] });

      const store = usePatientStoreWithRealtime.getState();
      store.enableRealtime();

      expect(store.patients[0].full_name).toBe('Original');
    });

    it('should handle DELETE events', () => {
      const patient = createMockPatient({ id: '1' });
      usePatientStoreWithRealtime.setState({ patients: [patient] });

      const store = usePatientStoreWithRealtime.getState();
      store.enableRealtime();

      expect(store.patients).toHaveLength(1);
    });
  });

  describe('Combined Operations', () => {
    it('should load patients and enable realtime', async () => {
      const mockPatients = [
        createMockPatient({ id: '1', full_name: 'John' }),
        createMockPatient({ id: '2', full_name: 'Jane' }),
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

      const store = usePatientStoreWithRealtime.getState();
      await store.loadPatients();
      store.enableRealtime();

      await flushPromises();

      const state = usePatientStoreWithRealtime.getState();
      expect(state.patients).toHaveLength(2);
      expect(state.isRealtimeActive).toBe(true);
    });

    it('should cleanup realtime on reset', () => {
      const store = usePatientStoreWithRealtime.getState();
      store.enableRealtime();

      expect(store.isRealtimeActive).toBe(true);

      store.reset();

      const state = usePatientStoreWithRealtime.getState();
      expect(state.isRealtimeActive).toBe(false);
      expect(state.realtimeChannel).toBeNull();
      expect(state.patients).toEqual([]);
    });
  });

  describe('State Management with Realtime', () => {
    it('should maintain state consistency during realtime updates', async () => {
      const initialPatients = [
        createMockPatient({ id: '1', full_name: 'Patient 1' }),
        createMockPatient({ id: '2', full_name: 'Patient 2' }),
      ];

      usePatientStoreWithRealtime.setState({ patients: initialPatients });

      const store = usePatientStoreWithRealtime.getState();
      store.enableRealtime();

      expect(store.patients).toHaveLength(2);
      expect(store.isRealtimeActive).toBe(true);
    });

    it('should handle concurrent updates correctly', async () => {
      const patient1 = createMockPatient({ id: '1', full_name: 'Patient 1' });
      const patient2 = createMockPatient({ id: '2', full_name: 'Patient 2' });

      usePatientStoreWithRealtime.setState({ patients: [patient1] });

      vi.mocked(mockSupabase.from).mockReturnValue({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: patient2,
          error: null,
        }),
      } as any);

      const store = usePatientStoreWithRealtime.getState();
      await store.createPatient({ full_name: 'Patient 2' });

      const state = usePatientStoreWithRealtime.getState();
      expect(state.patients).toHaveLength(2);
    });
  });
});
