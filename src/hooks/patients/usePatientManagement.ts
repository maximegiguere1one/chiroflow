import { useState, useEffect, useCallback } from 'react';
import { patientService } from '../../infrastructure/api/PatientService';
import { PatientResponseDTO, CreatePatientDTO, UpdatePatientDTO } from '../../application/dto/PatientDTO';
import { PatientFilters } from '../../domain/repositories/IPatientRepository';

export interface UsePatientManagementResult {
  patients: PatientResponseDTO[];
  loading: boolean;
  error: Error | null;
  total: number;
  currentPage: number;
  pageSize: number;
  loadPatients: (filters?: PatientFilters) => Promise<void>;
  createPatient: (dto: CreatePatientDTO) => Promise<PatientResponseDTO>;
  updatePatient: (id: string, dto: UpdatePatientDTO) => Promise<PatientResponseDTO>;
  deletePatient: (id: string) => Promise<void>;
  getPatient: (id: string) => Promise<PatientResponseDTO | null>;
  setPage: (page: number) => void;
  refresh: () => Promise<void>;
}

export function usePatientManagement(initialFilters?: PatientFilters): UsePatientManagementResult {
  const [patients, setPatients] = useState<PatientResponseDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<PatientFilters>(initialFilters || {});

  const pageSize = filters.limit || 50;

  const loadPatients = useCallback(async (newFilters?: PatientFilters) => {
    setLoading(true);
    setError(null);

    try {
      const appliedFilters = newFilters || filters;
      const offset = (currentPage - 1) * pageSize;
      
      const result = await patientService.listPatients({
        ...appliedFilters,
        limit: pageSize,
        offset,
      });

      setPatients(result.patients);
      setTotal(result.total);
      
      if (newFilters) {
        setFilters(newFilters);
      }
    } catch (err) {
      setError(err as Error);
      console.error('Error loading patients:', err);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, filters]);

  const createPatient = useCallback(async (dto: CreatePatientDTO): Promise<PatientResponseDTO> => {
    try {
      const newPatient = await patientService.createPatient(dto);
      await loadPatients();
      return newPatient;
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, [loadPatients]);

  const updatePatient = useCallback(async (id: string, dto: UpdatePatientDTO): Promise<PatientResponseDTO> => {
    try {
      const updatedPatient = await patientService.updatePatient(id, dto);
      await loadPatients();
      return updatedPatient;
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, [loadPatients]);

  const deletePatient = useCallback(async (id: string): Promise<void> => {
    try {
      await patientService.deletePatient(id);
      await loadPatients();
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, [loadPatients]);

  const getPatient = useCallback(async (id: string): Promise<PatientResponseDTO | null> => {
    try {
      return await patientService.getPatient(id);
    } catch (err) {
      setError(err as Error);
      return null;
    }
  }, []);

  const setPage = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const refresh = useCallback(async () => {
    await loadPatients();
  }, [loadPatients]);

  useEffect(() => {
    loadPatients();
  }, [currentPage]);

  return {
    patients,
    loading,
    error,
    total,
    currentPage,
    pageSize,
    loadPatients,
    createPatient,
    updatePatient,
    deletePatient,
    getPatient,
    setPage,
    refresh,
  };
}
