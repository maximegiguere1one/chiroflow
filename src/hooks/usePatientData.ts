import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { env } from '../lib/env';

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  date_of_birth: string | null;
  [key: string]: any;
}

interface UsePatientDataReturn {
  patient: Patient | null;
  user: any | null;
  loading: boolean;
  error: string | null;
  reload: () => void;
  syncPatientPortalUser: () => Promise<boolean>;
}

export function usePatientData(): UsePatientDataReturn {
  const [patient, setPatient] = useState<Patient | null>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const syncPatientPortalUser = useCallback(async (): Promise<boolean> => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.access_token) {
        return false;
      }

      const syncResponse = await fetch(
        `${env.supabaseUrl}/functions/v1/sync-patient-portal-user`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const syncResult = await syncResponse.json();
      return syncResult.success || false;
    } catch (err) {
      console.warn('Sync error:', err);
      return false;
    }
  }, []);

  const loadPatientData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const {
        data: { user: authUser },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !authUser) {
        throw new Error('Non authentifié');
      }

      setUser(authUser);

      // Tenter la sync
      await syncPatientPortalUser();

      // Charger les données patient
      const { data: patientData, error: patientError } = await supabase
        .from('patients_full')
        .select('*')
        .eq('email', authUser.email)
        .maybeSingle();

      if (patientError) {
        throw patientError;
      }

      if (!patientData) {
        throw new Error(`Aucun dossier patient trouvé pour ${authUser.email}`);
      }

      setPatient(patientData);
    } catch (err: any) {
      console.error('Error loading patient data:', err);
      setError(err.message || 'Erreur de chargement');
      setPatient(null);
    } finally {
      setLoading(false);
    }
  }, [syncPatientPortalUser]);

  useEffect(() => {
    loadPatientData();
  }, [loadPatientData]);

  const reload = useCallback(() => {
    loadPatientData();
  }, [loadPatientData]);

  return {
    patient,
    user,
    loading,
    error,
    reload,
    syncPatientPortalUser,
  };
}
