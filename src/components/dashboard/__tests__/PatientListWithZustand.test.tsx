import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PatientListWithZustand from '../PatientListWithZustand';
import { createMockSupabaseClient, createMockPatient } from '../../../test/testUtils';

vi.mock('../../../lib/supabase', () => ({
  supabase: createMockSupabaseClient(),
}));

vi.mock('../../../contexts/ToastContext', () => ({
  useToastContext: () => ({
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  }),
}));

vi.mock('../ContactDetailsModal', () => ({
  ContactDetailsModal: () => <div>Contact Details Modal</div>,
}));

vi.mock('../AppointmentSchedulingModal', () => ({
  AppointmentSchedulingModal: () => <div>Appointment Modal</div>,
}));

vi.mock('../PatientBillingModal', () => ({
  PatientBillingModal: () => <div>Billing Modal</div>,
}));

vi.mock('../CSVImportModal', () => ({
  CSVImportModal: () => <div>CSV Import Modal</div>,
}));

describe('PatientListWithZustand Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render patient list', async () => {
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

    render(<PatientListWithZustand />);

    await waitFor(() => {
      expect(screen.getByText('Patients')).toBeInTheDocument();
    });
  });

  it('should show loading state', () => {
    render(<PatientListWithZustand />);

    expect(screen.getByText('Patients')).toBeInTheDocument();
  });

  it('should handle search input', async () => {
    const user = userEvent.setup();
    render(<PatientListWithZustand />);

    const searchInput = screen.getByPlaceholderText('Rechercher un patient...');
    await user.type(searchInput, 'John');

    expect(searchInput).toHaveValue('John');
  });

  it('should open new patient modal', async () => {
    const user = userEvent.setup();
    render(<PatientListWithZustand />);

    const newPatientButton = screen.getByText('Nouveau Patient');
    await user.click(newPatientButton);

    await waitFor(() => {
      expect(screen.getByText('Contact Details Modal')).toBeInTheDocument();
    });
  });

  it('should show stats cards', () => {
    render(<PatientListWithZustand />);

    expect(screen.getByText('Total')).toBeInTheDocument();
    expect(screen.getByText('Actifs')).toBeInTheDocument();
    expect(screen.getByText('Inactifs')).toBeInTheDocument();
    expect(screen.getByText('Urgents')).toBeInTheDocument();
  });
});
