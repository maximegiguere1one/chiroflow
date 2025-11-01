import { useEffect } from 'react';
import { usePatientStore } from '../presentation/stores/patientStore';
import { PatientFilters } from '../domain/repositories/IPatientRepository';

export function usePatients(filters?: PatientFilters, autoLoad = true) {
  const {
    patients,
    loading,
    error,
    pagination,
    searchTerm,
    loadPatients,
    createPatient,
    updatePatient,
    deletePatient,
    selectPatient,
    setFilters,
    setSearchTerm,
    setPage,
    refresh,
  } = usePatientStore();

  useEffect(() => {
    if (autoLoad) {
      loadPatients(filters);
    }
  }, []);

  return {
    patients,
    loading,
    error,
    pagination,
    searchTerm,
    loadPatients,
    createPatient,
    updatePatient,
    deletePatient,
    selectPatient,
    setFilters,
    setSearchTerm,
    setPage,
    refresh,
  };
}

export function useSelectedPatient() {
  const selectedPatient = usePatientStore((state) => state.selectedPatient);
  const selectPatient = usePatientStore((state) => state.selectPatient);

  return {
    selectedPatient,
    selectPatient,
  };
}

export function usePatientActions() {
  const createPatient = usePatientStore((state) => state.createPatient);
  const updatePatient = usePatientStore((state) => state.updatePatient);
  const deletePatient = usePatientStore((state) => state.deletePatient);
  const refresh = usePatientStore((state) => state.refresh);

  return {
    createPatient,
    updatePatient,
    deletePatient,
    refresh,
  };
}
