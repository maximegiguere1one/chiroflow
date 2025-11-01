import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { patientService } from '../../infrastructure/api/PatientService';
import { PatientResponseDTO, CreatePatientDTO, UpdatePatientDTO } from '../../application/dto/PatientDTO';
import { PatientFilters } from '../../domain/repositories/IPatientRepository';

interface PatientState {
  patients: PatientResponseDTO[];
  selectedPatient: PatientResponseDTO | null;
  loading: boolean;
  error: Error | null;
  filters: PatientFilters;
  pagination: {
    currentPage: number;
    pageSize: number;
    total: number;
  };
  searchTerm: string;
}

interface PatientActions {
  loadPatients: (filters?: PatientFilters) => Promise<void>;
  createPatient: (dto: CreatePatientDTO) => Promise<PatientResponseDTO>;
  updatePatient: (id: string, dto: UpdatePatientDTO) => Promise<PatientResponseDTO>;
  deletePatient: (id: string) => Promise<void>;
  selectPatient: (patient: PatientResponseDTO | null) => void;
  setFilters: (filters: PatientFilters) => void;
  setSearchTerm: (term: string) => void;
  setPage: (page: number) => void;
  refresh: () => Promise<void>;
  reset: () => void;
}

type PatientStore = PatientState & PatientActions;

const initialState: PatientState = {
  patients: [],
  selectedPatient: null,
  loading: false,
  error: null,
  filters: {},
  pagination: {
    currentPage: 1,
    pageSize: 50,
    total: 0,
  },
  searchTerm: '',
};

export const usePatientStore = create<PatientStore>()(
  devtools(
    persist(
      immer((set, get) => ({
        ...initialState,

        loadPatients: async (filters?: PatientFilters) => {
          set((state) => {
            state.loading = true;
            state.error = null;
          });

          try {
            const { pagination, searchTerm } = get();
            const appliedFilters = filters || get().filters;

            const result = await patientService.listPatients({
              ...appliedFilters,
              search: searchTerm || appliedFilters.search,
              limit: pagination.pageSize,
              offset: (pagination.currentPage - 1) * pagination.pageSize,
            });

            set((state) => {
              state.patients = result.patients;
              state.pagination.total = result.total;
              state.loading = false;
              if (filters) {
                state.filters = filters;
              }
            });
          } catch (error) {
            set((state) => {
              state.error = error as Error;
              state.loading = false;
            });
            throw error;
          }
        },

        createPatient: async (dto: CreatePatientDTO) => {
          set((state) => {
            state.loading = true;
            state.error = null;
          });

          try {
            const newPatient = await patientService.createPatient(dto);

            set((state) => {
              state.patients = [newPatient, ...state.patients];
              state.pagination.total += 1;
              state.loading = false;
            });

            return newPatient;
          } catch (error) {
            set((state) => {
              state.error = error as Error;
              state.loading = false;
            });
            throw error;
          }
        },

        updatePatient: async (id: string, dto: UpdatePatientDTO) => {
          set((state) => {
            state.loading = true;
            state.error = null;
          });

          try {
            const updatedPatient = await patientService.updatePatient(id, dto);

            set((state) => {
              const index = state.patients.findIndex((p) => p.id === id);
              if (index !== -1) {
                state.patients[index] = updatedPatient;
              }
              if (state.selectedPatient?.id === id) {
                state.selectedPatient = updatedPatient;
              }
              state.loading = false;
            });

            return updatedPatient;
          } catch (error) {
            set((state) => {
              state.error = error as Error;
              state.loading = false;
            });
            throw error;
          }
        },

        deletePatient: async (id: string) => {
          set((state) => {
            state.loading = true;
            state.error = null;
          });

          try {
            await patientService.deletePatient(id);

            set((state) => {
              state.patients = state.patients.filter((p) => p.id !== id);
              state.pagination.total -= 1;
              if (state.selectedPatient?.id === id) {
                state.selectedPatient = null;
              }
              state.loading = false;
            });
          } catch (error) {
            set((state) => {
              state.error = error as Error;
              state.loading = false;
            });
            throw error;
          }
        },

        selectPatient: (patient: PatientResponseDTO | null) => {
          set((state) => {
            state.selectedPatient = patient;
          });
        },

        setFilters: (filters: PatientFilters) => {
          set((state) => {
            state.filters = filters;
            state.pagination.currentPage = 1;
          });
          get().loadPatients(filters);
        },

        setSearchTerm: (term: string) => {
          set((state) => {
            state.searchTerm = term;
            state.pagination.currentPage = 1;
          });
        },

        setPage: (page: number) => {
          set((state) => {
            state.pagination.currentPage = page;
          });
          get().loadPatients();
        },

        refresh: async () => {
          await get().loadPatients();
        },

        reset: () => {
          set(initialState);
        },
      })),
      {
        name: 'patient-store',
        partialize: (state) => ({
          filters: state.filters,
          pagination: state.pagination,
          searchTerm: state.searchTerm,
        }),
      }
    ),
    { name: 'PatientStore' }
  )
);
