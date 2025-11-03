import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Phone, Mail, CheckCircle, Loader } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useOptimisticUI } from '../../hooks/useOptimisticUI';
import { useToastContext } from '../../contexts/ToastContext';
import { celebrate } from '../../lib/celebration';
import { ProgressiveContent, TableSkeleton } from '../common/ProgressiveLoader';
import { InlineErrorRecovery, useErrorRecovery } from '../common/InlineErrorRecovery';

interface Patient {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  status: string;
  created_at: string;
  synced?: boolean;
  error?: string;
}

export default function OptimisticPatientList() {
  const {
    items: patients,
    addOptimistic,
    updateOptimistic,
    deleteOptimistic,
    reset
  } = useOptimisticUI<Patient>([]);

  const { error, executeWithRecovery, clearError } = useErrorRecovery();
  const toast = useToastContext();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPatients();
  }, []);

  async function loadPatients() {
    await executeWithRecovery(
      async () => {
        const { data, error } = await supabase
          .from('contacts')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50);

        if (error) throw error;
        reset(data || []);
        setLoading(false);
      },
      {
        onError: () => {
          toast.error('Erreur lors du chargement des patients');
        }
      }
    );
  }

  async function handleAddPatient(name: string, contact: string) {
    const nameParts = name.trim().split(/\s+/);
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ') || nameParts[0];
    const isEmail = contact.includes('@');

    const newPatient = {
      full_name: name,
      email: isEmail ? contact : '',
      phone: isEmail ? '' : contact,
      status: 'active',
      created_at: new Date().toISOString()
    };

    const actions = addOptimistic(newPatient);

    try {
      const { data, error } = await supabase
        .from('contacts')
        .insert({
          first_name: firstName,
          last_name: lastName,
          email: newPatient.email || null,
          phone: newPatient.phone || null,
          status: 'active'
        })
        .select()
        .single();

      if (error) throw error;

      actions.confirm(data.id, {
        ...data,
        full_name: `${data.first_name} ${data.last_name}`
      });

      celebrate('patient');
      toast.success('Patient créé avec succès! 🎉');

    } catch (error: any) {
      actions.rollback();

      if (error.message?.includes('duplicate')) {
        toast.error('Patient existe déjà', 'Ce contact est déjà dans votre base de données');
      } else {
        toast.error('Erreur lors de la création', error.message);
      }
    }
  }

  async function handleUpdatePatient(id: string, updates: Partial<Patient>) {
    const actions = updateOptimistic(id, updates);

    try {
      const { error } = await supabase
        .from('contacts')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      actions.confirm(id, updates);
      toast.success('Patient mis à jour');

    } catch (error: any) {
      actions.rollback();
      toast.error('Erreur lors de la mise à jour', error.message);
    }
  }

  async function handleDeletePatient(id: string, patientName: string) {
    if (!confirm(`Supprimer ${patientName}?`)) return;

    const actions = deleteOptimistic(id);

    try {
      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', id);

      if (error) throw error;
      actions.confirm();
      toast.success('Patient supprimé');

    } catch (error: any) {
      actions.rollback();
      toast.error('Erreur lors de la suppression', error.message);
    }
  }

  if (error) {
    return (
      <InlineErrorRecovery
        error={error}
        onRetry={loadPatients}
        onDismiss={clearError}
        suggestions={[
          'Vérifiez votre connexion internet',
          'Actualisez la page',
          'Contactez le support si le problème persiste'
        ]}
      />
    );
  }

  return (
    <div className="space-y-4">
      <QuickAddPatientOptimistic onAdd={handleAddPatient} />

      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Patients
            <span className="ml-3 text-sm text-gray-500 font-normal">
              {patients.length} total
            </span>
          </h2>
        </div>

        <ProgressiveContent
          items={patients}
          isLoading={loading}
          skeleton={<TableSkeleton rows={5} />}
          renderItem={(patient, index) => (
            <PatientRowOptimistic
              key={patient.id}
              patient={patient}
              onUpdate={(updates) => handleUpdatePatient(patient.id, updates)}
              onDelete={() => handleDeletePatient(patient.id, patient.full_name)}
            />
          )}
        />
      </div>
    </div>
  );
}

function QuickAddPatientOptimistic({
  onAdd
}: {
  onAdd: (name: string, contact: string) => Promise<void>;
}) {
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!name || !contact) return;
    setLoading(true);
    await onAdd(name, contact);
    setName('');
    setContact('');
    setLoading(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border-2 border-blue-200"
    >
      <div className="flex gap-3">
        <input
          type="text"
          placeholder="Nom complet"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
          className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
          disabled={loading}
        />
        <input
          type="text"
          placeholder="Téléphone ou courriel"
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
          className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
          disabled={loading}
        />
        <button
          onClick={handleSubmit}
          disabled={!name || !contact || loading}
          className="px-6 py-3 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? <Loader className="w-5 h-5 animate-spin" /> : 'Créer'}
        </button>
      </div>
    </motion.div>
  );
}

function PatientRowOptimistic({
  patient,
  onUpdate,
  onDelete
}: {
  patient: Patient;
  onUpdate: (updates: Partial<Patient>) => void;
  onDelete: () => void;
}) {
  const isOptimistic = !patient.synced && patient.id.startsWith('temp_');
  const hasError = !!patient.error;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{
        opacity: hasError ? 0.5 : 1,
        y: 0
      }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={`
        flex items-center gap-4 p-4 rounded-lg border-2 transition-all
        ${isOptimistic ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'}
        ${hasError ? 'border-red-300 bg-red-50' : ''}
        hover:shadow-md
      `}
    >
      <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg relative">
        {patient.full_name.charAt(0).toUpperCase()}
        {isOptimistic && (
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center">
            <Loader className="w-3 h-3 text-white animate-spin" />
          </div>
        )}
        {patient.synced && !isOptimistic && (
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
            <CheckCircle className="w-3 h-3 text-white" />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-gray-900">
            {patient.full_name}
          </h3>
          {isOptimistic && (
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
              En cours...
            </span>
          )}
          {hasError && (
            <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
              Erreur
            </span>
          )}
        </div>
        <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
          {patient.email && (
            <div className="flex items-center gap-1">
              <Mail className="w-3 h-3" />
              <span>{patient.email}</span>
            </div>
          )}
          {patient.phone && (
            <div className="flex items-center gap-1">
              <Phone className="w-3 h-3" />
              <span>{patient.phone}</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className={`
          text-xs px-2 py-1 rounded-full font-medium
          ${patient.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}
        `}>
          {patient.status}
        </span>
      </div>
    </motion.div>
  );
}
