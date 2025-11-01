import { describe, it, expect, beforeEach, vi } from 'vitest';
import { usePatientStore } from '../patientStore';
import { createMockSupabaseClient, createMockPatient, flushPromises } from '../../../test/testUtils';

vi.mock('../../../lib/supabase', () => ({
  supabase: createMockSupabaseClient(),
}));

describe('PatientStore', () => {
  beforeEach(() => {
    usePatientStore.getState().reset();
    vi.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const state = usePatientStore.getState();

      expect(state.patients).toEqual([]);
      expect(state.selectedPatient).toBeNull();
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
      expect(state.filters).toEqual({});
    });
  });

  describe('loadPatients', () => {
    it('should load patients successfully', async () => {
      const mockPatients = [
        createMockPatient({ id: '1', full_name: 'John Doe' }),
        createMockPatient({ id: '2', full_name: 'Jane Smith' }),
      ];

      const { supabase } = await import('../../../lib/supabase');
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({
          data: mockPatients,
          error: null,
          count: 2,
        }),
      } as any);

      const store = usePatientStore.getState();

      expect(store.loading).toBe(false);

      await store.loadPatients();
      await flushPromises();

      const updatedState = usePatientStore.getState();
      expect(updatedState.patients).toHaveLength(2);
      expect(updatedState.patients[0].full_name).toBe('John Doe');
      expect(updatedState.loading).toBe(false);
    });

    it('should handle errors when loading patients', async () => {
      const mockError = new Error('Database error');

      const { supabase } = await import('../../../lib/supabase');
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({
          data: null,
          error: mockError,
        }),
      } as any);

      const store = usePatientStore.getState();

      await expect(store.loadPatients()).rejects.toThrow('Database error');

      const updatedState = usePatientStore.getState();
      expect(updatedState.error).toBeTruthy();
      expect(updatedState.loading).toBe(false);
    });
  });

  describe('createPatient', () => {
    it('should create a patient successfully', async () => {
      const newPatient = createMockPatient({ id: '3', full_name: 'New Patient' });

      const { supabase } = await import('../../../lib/supabase');
      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: newPatient,
          error: null,
        }),
      } as any);

      const store = usePatientStore.getState();
      const result = await store.createPatient({
        full_name: 'New Patient',
        email: 'new@example.com',
        phone: '555-9999',
      });

      expect(result.full_name).toBe('New Patient');

      const updatedState = usePatientStore.getState();
      expect(updatedState.patients).toHaveLength(1);
      expect(updatedState.patients[0].id).toBe('3');
    });
  });

  describe('updatePatient', () => {
    it('should update a patient successfully', async () => {
      const existingPatient = createMockPatient({ id: '1', full_name: 'John Doe' });
      const updatedPatient = { ...existingPatient, full_name: 'John Updated' };

      usePatientStore.setState({ patients: [existingPatient] });

      const { supabase } = await import('../../../lib/supabase');
      vi.mocked(supabase.from).mockReturnValue({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: updatedPatient,
          error: null,
        }),
      } as any);

      const store = usePatientStore.getState();
      await store.updatePatient('1', { full_name: 'John Updated' });

      const updatedState = usePatientStore.getState();
      expect(updatedState.patients[0].full_name).toBe('John Updated');
    });
  });

  describe('deletePatient', () => {
    it('should delete a patient successfully', async () => {
      const patient = createMockPatient({ id: '1' });
      usePatientStore.setState({ patients: [patient] });

      const { supabase } = await import('../../../lib/supabase');
      vi.mocked(supabase.from).mockReturnValue({
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          error: null,
        }),
      } as any);

      const store = usePatientStore.getState();
      await store.deletePatient('1');

      const updatedState = usePatientStore.getState();
      expect(updatedState.patients).toHaveLength(0);
    });
  });

  describe('selectPatient', () => {
    it('should select a patient', () => {
      const patient = createMockPatient();

      const store = usePatientStore.getState();
      store.selectPatient(patient);

      const updatedState = usePatientStore.getState();
      expect(updatedState.selectedPatient?.id).toBe(patient.id);
    });

    it('should clear selected patient', () => {
      const patient = createMockPatient();
      usePatientStore.setState({ selectedPatient: patient });

      const store = usePatientStore.getState();
      store.selectPatient(null);

      const updatedState = usePatientStore.getState();
      expect(updatedState.selectedPatient).toBeNull();
    });
  });

  describe('setFilters', () => {
    it('should set filters and reload patients', async () => {
      const { supabase } = await import('../../../lib/supabase');
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({
          data: [],
          error: null,
          count: 0,
        }),
      } as any);

      const store = usePatientStore.getState();
      store.setFilters({ status: 'active' });

      await flushPromises();

      const updatedState = usePatientStore.getState();
      expect(updatedState.filters.status).toBe('active');
    });
  });

  describe('pagination', () => {
    it('should handle pagination correctly', async () => {
      const store = usePatientStore.getState();

      expect(store.pagination.currentPage).toBe(1);

      store.setPage(2);

      const updatedState = usePatientStore.getState();
      expect(updatedState.pagination.currentPage).toBe(2);
    });
  });

  describe('reset', () => {
    it('should reset store to initial state', () => {
      usePatientStore.setState({
        patients: [createMockPatient()],
        selectedPatient: createMockPatient(),
        loading: true,
        filters: { status: 'active' },
      });

      const store = usePatientStore.getState();
      store.reset();

      const updatedState = usePatientStore.getState();
      expect(updatedState.patients).toEqual([]);
      expect(updatedState.selectedPatient).toBeNull();
      expect(updatedState.loading).toBe(false);
      expect(updatedState.filters).toEqual({});
    });
  });
});
