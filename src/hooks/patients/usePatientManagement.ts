import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  date_of_birth: string;
  status: string;
  last_visit?: string;
  total_visits: number;
  created_at: string;
}

interface PatientFormData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  date_of_birth: string;
  gender: string;
  address: string;
  medical_history: string;
  medications: string | string[];
  allergies: string | string[];
  status: string;
}

export function usePatientManagement() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPatients = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error: fetchError } = await supabase
        .from('patients_full')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setPatients(data || []);
    } catch (err) {
      console.error('Error loading patients:', err);
      setError(err instanceof Error ? err.message : 'Failed to load patients');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPatients();
  }, [loadPatients]);

  const addPatient = useCallback(async (formData: PatientFormData) => {
    try {
      const processedData = {
        ...formData,
        medications: typeof formData.medications === 'string'
          ? formData.medications.split(',').map(m => m.trim()).filter(Boolean)
          : formData.medications,
        allergies: typeof formData.allergies === 'string'
          ? formData.allergies.split(',').map(a => a.trim()).filter(Boolean)
          : formData.allergies,
        email: formData.email || null,
        phone: formData.phone || null,
        date_of_birth: formData.date_of_birth || null,
        address: formData.address || null,
        medical_history: formData.medical_history || null,
      };

      const { error: insertError } = await supabase
        .from('patients_full')
        .insert([processedData]);

      if (insertError) throw insertError;
      await loadPatients();
      return { success: true };
    } catch (err) {
      console.error('Error adding patient:', err);
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to add patient',
      };
    }
  }, [loadPatients]);

  const updatePatient = useCallback(async (id: string, formData: PatientFormData) => {
    try {
      const processedData = {
        ...formData,
        medications: typeof formData.medications === 'string'
          ? formData.medications.split(',').map(m => m.trim()).filter(Boolean)
          : formData.medications,
        allergies: typeof formData.allergies === 'string'
          ? formData.allergies.split(',').map(a => a.trim()).filter(Boolean)
          : formData.allergies,
        email: formData.email || null,
        phone: formData.phone || null,
        date_of_birth: formData.date_of_birth || null,
        address: formData.address || null,
        medical_history: formData.medical_history || null,
      };

      const { error: updateError } = await supabase
        .from('patients_full')
        .update(processedData)
        .eq('id', id);

      if (updateError) throw updateError;
      await loadPatients();
      return { success: true };
    } catch (err) {
      console.error('Error updating patient:', err);
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to update patient',
      };
    }
  }, [loadPatients]);

  const deletePatient = useCallback(async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('patients_full')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;
      await loadPatients();
      return { success: true };
    } catch (err) {
      console.error('Error deleting patient:', err);
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to delete patient',
      };
    }
  }, [loadPatients]);

  return {
    patients,
    loading,
    error,
    loadPatients,
    addPatient,
    updatePatient,
    deletePatient,
  };
}
