import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { usePatientManagement } from './usePatientManagement';
import { patientService } from '../../infrastructure/api/PatientService';

vi.mock('../../infrastructure/api/PatientService', () => ({
  patientService: {
    listPatients: vi.fn(),
    createPatient: vi.fn(),
    updatePatient: vi.fn(),
    deletePatient: vi.fn(),
    getPatient: vi.fn(),
  },
}));

describe('usePatientManagement', () => {
  const mockPatients = [
    {
      id: '1',
      first_name: 'John',
      last_name: 'Doe',
      full_name: 'John Doe',
      email: 'john@example.com',
      phone: '555-0100',
      date_of_birth: '1980-01-01',
      age: 44,
      gender: 'male' as const,
      address: '123 Main St',
      medical_history: null,
      medications: null,
      allergies: null,
      status: 'active' as const,
      last_visit: null,
      total_visits: 0,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(patientService.listPatients).mockResolvedValue({
      patients: mockPatients,
      total: 1,
      limit: 50,
      offset: 0,
    });
  });

  it('loads patients on mount', async () => {
    const { result } = renderHook(() => usePatientManagement());

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.patients).toHaveLength(1);
    expect(result.current.patients[0].full_name).toBe('John Doe');
    expect(result.current.total).toBe(1);
  });

  it('creates a patient', async () => {
    const newPatient = {
      ...mockPatients[0],
      id: '2',
      full_name: 'Jane Smith',
    };

    vi.mocked(patientService.createPatient).mockResolvedValue(newPatient);

    const { result } = renderHook(() => usePatientManagement());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const createDto = {
      first_name: 'Jane',
      last_name: 'Smith',
      email: 'jane@example.com',
      phone: '555-0200',
      gender: 'female' as const,
    };

    await result.current.createPatient(createDto);

    expect(patientService.createPatient).toHaveBeenCalledWith(createDto);
  });

  it('updates a patient', async () => {
    const updatedPatient = {
      ...mockPatients[0],
      email: 'newemail@example.com',
    };

    vi.mocked(patientService.updatePatient).mockResolvedValue(updatedPatient);

    const { result } = renderHook(() => usePatientManagement());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await result.current.updatePatient('1', { email: 'newemail@example.com' });

    expect(patientService.updatePatient).toHaveBeenCalledWith('1', {
      email: 'newemail@example.com',
    });
  });

  it('deletes a patient', async () => {
    vi.mocked(patientService.deletePatient).mockResolvedValue();

    const { result } = renderHook(() => usePatientManagement());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await result.current.deletePatient('1');

    expect(patientService.deletePatient).toHaveBeenCalledWith('1');
  });

  it('handles errors gracefully', async () => {
    const error = new Error('Failed to load patients');
    vi.mocked(patientService.listPatients).mockRejectedValue(error);

    const { result } = renderHook(() => usePatientManagement());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toEqual(error);
    expect(result.current.patients).toHaveLength(0);
  });

  it('changes page and reloads', async () => {
    const { result } = renderHook(() => usePatientManagement());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    result.current.setPage(2);

    await waitFor(() => {
      expect(result.current.currentPage).toBe(2);
    });

    expect(patientService.listPatients).toHaveBeenCalledWith(
      expect.objectContaining({
        offset: 50,
      })
    );
  });

  it('applies filters when loading', async () => {
    const { result } = renderHook(() =>
      usePatientManagement({ status: 'active', search: 'John' })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(patientService.listPatients).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'active',
        search: 'John',
      })
    );
  });

  it('refreshes data', async () => {
    const { result } = renderHook(() => usePatientManagement());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    vi.clearAllMocks();

    await result.current.refresh();

    expect(patientService.listPatients).toHaveBeenCalled();
  });
});
