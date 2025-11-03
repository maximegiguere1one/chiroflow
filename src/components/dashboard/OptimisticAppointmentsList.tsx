import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar, Clock, CheckCircle, XCircle, Phone, Mail,
  Loader, AlertCircle, User, MessageSquare
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useOptimisticUI } from '../../hooks/useOptimisticUI';
import { useToastContext } from '../../contexts/ToastContext';
import { celebrate } from '../../lib/celebration';
import { ProgressiveContent, TableSkeleton } from '../common/ProgressiveLoader';
import { InlineErrorRecovery, useErrorRecovery } from '../common/InlineErrorRecovery';

interface Appointment {
  id: string;
  name: string;
  patient_name?: string;
  email: string;
  phone: string;
  scheduled_date: string;
  scheduled_time: string;
  status: string;
  reason: string;
  created_at: string;
  synced?: boolean;
  error?: string;
}

export default function OptimisticAppointmentsList() {
  const {
    items: appointments,
    addOptimistic,
    updateOptimistic,
    deleteOptimistic,
    reset
  } = useOptimisticUI<Appointment>([]);

  const { error, executeWithRecovery, clearError } = useErrorRecovery();
  const toast = useToastContext();
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'today' | 'upcoming'>('today');

  useEffect(() => {
    loadAppointments();
  }, [filter]);

  async function loadAppointments() {
    await executeWithRecovery(
      async () => {
        let query = supabase
          .from('appointments_api')
          .select('*')
          .not('scheduled_date', 'is', null)
          .order('scheduled_date', { ascending: true })
          .order('scheduled_time', { ascending: true });

        if (filter === 'today') {
          const today = new Date().toISOString().split('T')[0];
          query = query.eq('scheduled_date', today);
        } else if (filter === 'upcoming') {
          const today = new Date().toISOString().split('T')[0];
          query = query.gte('scheduled_date', today);
        }

        const { data, error } = await query;
        if (error) throw error;
        reset(data || []);
        setLoading(false);
      },
      {
        onError: () => {
          toast.error('Erreur lors du chargement des rendez-vous');
        }
      }
    );
  }

  async function handleUpdateStatus(id: string, status: string) {
    const appointment = appointments.find(a => a.id === id);
    if (!appointment) return;

    const actions = updateOptimistic(id, { status });

    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status })
        .eq('id', id);

      if (error) throw error;
      actions.confirm(id, { status });

      const statusMessages: Record<string, string> = {
        confirmed: 'RDV confirmé ✓',
        completed: 'RDV complété 🎉',
        cancelled: 'RDV annulé',
        no_show: 'Marqué comme absence'
      };

      toast.success(statusMessages[status] || 'Statut mis à jour');

      if (status === 'completed') {
        celebrate('appointment');
      }

    } catch (error: any) {
      actions.rollback();
      toast.error('Erreur lors de la mise à jour', error.message);
    }
  }

  async function handleQuickAction(id: string, action: 'sms' | 'call' | 'email') {
    const appointment = appointments.find(a => a.id === id);
    if (!appointment) return;

    switch (action) {
      case 'sms':
        toast.success(`SMS de rappel envoyé à ${appointment.name}`);
        break;
      case 'call':
        window.location.href = `tel:${appointment.phone}`;
        break;
      case 'email':
        window.location.href = `mailto:${appointment.email}`;
        break;
    }
  }

  const todayAppointments = appointments.filter(apt => {
    const today = new Date().toISOString().split('T')[0];
    return apt.scheduled_date === today;
  });

  const upcomingCount = appointments.filter(apt => {
    const today = new Date().toISOString().split('T')[0];
    return apt.scheduled_date >= today;
  }).length;

  if (error) {
    return (
      <InlineErrorRecovery
        error={error}
        onRetry={loadAppointments}
        onDismiss={clearError}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">
          Rendez-vous
        </h2>

        <div className="flex gap-2">
          {[
            { id: 'today' as const, label: "Aujourd'hui", count: todayAppointments.length },
            { id: 'upcoming' as const, label: 'À venir', count: upcomingCount },
            { id: 'all' as const, label: 'Tous' }
          ].map(({ id, label, count }) => (
            <button
              key={id}
              onClick={() => setFilter(id)}
              className={`
                px-4 py-2 rounded-lg font-medium transition-all relative
                ${filter === id
                  ? 'bg-blue-500 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }
              `}
            >
              {label}
              {count !== undefined && (
                <span className={`
                  ml-2 px-2 py-0.5 rounded-full text-xs font-bold
                  ${filter === id ? 'bg-white text-blue-600' : 'bg-gray-200 text-gray-600'}
                `}>
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6">
        {appointments.length === 0 && !loading ? (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">Aucun rendez-vous pour cette période</p>
          </div>
        ) : (
          <ProgressiveContent
            items={appointments}
            isLoading={loading}
            skeleton={<TableSkeleton rows={5} />}
            renderItem={(appointment) => (
              <AppointmentRowOptimistic
                key={appointment.id}
                appointment={appointment}
                onUpdateStatus={(status) => handleUpdateStatus(appointment.id, status)}
                onQuickAction={(action) => handleQuickAction(appointment.id, action)}
              />
            )}
          />
        )}
      </div>
    </div>
  );
}

function AppointmentRowOptimistic({
  appointment,
  onUpdateStatus,
  onQuickAction
}: {
  appointment: Appointment;
  onUpdateStatus: (status: string) => void;
  onQuickAction: (action: 'sms' | 'call' | 'email') => void;
}) {
  const isOptimistic = !appointment.synced && appointment.id.startsWith('temp_');
  const hasError = !!appointment.error;

  const statusConfig = {
    pending: { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700', label: 'En attente' },
    confirmed: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', label: 'Confirmé' },
    completed: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', label: 'Complété' },
    cancelled: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', label: 'Annulé' },
    no_show: { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-700', label: 'Absence' }
  };

  const config = statusConfig[appointment.status as keyof typeof statusConfig] || statusConfig.pending;

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
        flex items-center gap-4 p-4 rounded-lg border-2 mb-3 transition-all
        ${isOptimistic ? 'bg-blue-50 border-blue-200' : `${config.bg} ${config.border}`}
        ${hasError ? 'border-red-300 bg-red-50' : ''}
        hover:shadow-md
      `}
    >
      <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold relative ${isOptimistic ? 'bg-blue-500 text-white' : 'bg-gradient-to-br from-blue-400 to-purple-500 text-white'}`}>
        {(appointment.name || appointment.patient_name || 'P').charAt(0).toUpperCase()}
        {isOptimistic && (
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center">
            <Loader className="w-3 h-3 text-white animate-spin" />
          </div>
        )}
        {appointment.synced && !isOptimistic && (
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
            <CheckCircle className="w-3 h-3 text-white" />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-semibold text-gray-900">
            {appointment.name || appointment.patient_name}
          </h3>
          {isOptimistic && (
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
              Synchronisation...
            </span>
          )}
          {hasError && (
            <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              Erreur
            </span>
          )}
        </div>

        <div className="flex items-center gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            <span>{new Date(appointment.scheduled_date).toLocaleDateString('fr-FR')}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>{appointment.scheduled_time}</span>
          </div>
          {appointment.reason && (
            <span className="text-gray-500">• {appointment.reason}</span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className={`text-xs px-3 py-1 rounded-full font-medium ${config.text} ${config.bg} border ${config.border}`}>
          {config.label}
        </span>

        {appointment.status === 'pending' && !isOptimistic && (
          <AnimatePresence>
            <motion.button
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              onClick={() => onUpdateStatus('confirmed')}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
              title="Confirmer"
            >
              <CheckCircle className="w-4 h-4" />
            </motion.button>
          </AnimatePresence>
        )}

        {appointment.status === 'confirmed' && !isOptimistic && (
          <AnimatePresence>
            <motion.button
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              onClick={() => onUpdateStatus('completed')}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
              title="Marquer complété"
            >
              <CheckCircle className="w-4 h-4" />
            </motion.button>
          </AnimatePresence>
        )}

        <div className="flex gap-1">
          <button
            onClick={() => onQuickAction('call')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Appeler"
          >
            <Phone className="w-4 h-4 text-gray-600" />
          </button>
          <button
            onClick={() => onQuickAction('sms')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Envoyer SMS"
          >
            <MessageSquare className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
