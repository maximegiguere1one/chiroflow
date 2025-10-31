import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  DollarSign,
  Download,
  Filter,
  ChevronDown,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { formatCurrency } from '../../lib/paymentUtils';

interface AppointmentHistoryProps {
  patientId: string;
}

interface HistoricalAppointment {
  id: string;
  scheduled_date: string;
  scheduled_time: string;
  duration_minutes: number;
  status: string;
  reason: string;
  notes?: string;
  completed_at?: string;
  cancelled_at?: string;
  cancellation_reason?: string;
  auto_payment_enabled: boolean;
  auto_payment_status?: string;
  payment_amount?: number;
  payment_status?: string;
  service_type_name?: string;
  service_type_price?: number;
}

type StatusFilter = 'all' | 'completed' | 'cancelled' | 'no_show';

export default function AppointmentHistory({ patientId }: AppointmentHistoryProps) {
  const [appointments, setAppointments] = useState<HistoricalAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [dateRange, setDateRange] = useState<'all' | '30days' | '90days' | '1year'>('all');

  useEffect(() => {
    loadHistory();
  }, [patientId, statusFilter, dateRange]);

  async function loadHistory() {
    try {
      setLoading(true);

      const { data, error } = await supabase.rpc('get_appointment_history', {
        p_patient_id: patientId,
        p_limit: 100,
        p_offset: 0,
      });

      if (error) throw error;

      let filtered = data || [];

      if (statusFilter !== 'all') {
        filtered = filtered.filter((apt: HistoricalAppointment) => apt.status === statusFilter);
      }

      if (dateRange !== 'all') {
        const now = new Date();
        const cutoffDate = new Date();

        switch (dateRange) {
          case '30days':
            cutoffDate.setDate(now.getDate() - 30);
            break;
          case '90days':
            cutoffDate.setDate(now.getDate() - 90);
            break;
          case '1year':
            cutoffDate.setFullYear(now.getFullYear() - 1);
            break;
        }

        filtered = filtered.filter(
          (apt: HistoricalAppointment) => new Date(apt.scheduled_date) >= cutoffDate
        );
      }

      setAppointments(filtered);
    } catch (error) {
      console.error('Error loading appointment history:', error);
    } finally {
      setLoading(false);
    }
  }

  function getStatusIcon(status: string) {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'cancelled':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'no_show':
        return <AlertCircle className="w-5 h-5 text-orange-600" />;
      default:
        return <Calendar className="w-5 h-5 text-gray-400" />;
    }
  }

  function getStatusLabel(status: string) {
    switch (status) {
      case 'completed':
        return 'Complété';
      case 'cancelled':
        return 'Annulé';
      case 'no_show':
        return 'Absence';
      default:
        return status;
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'no_show':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  }

  const stats = {
    total: appointments.length,
    completed: appointments.filter((a) => a.status === 'completed').length,
    cancelled: appointments.filter((a) => a.status === 'cancelled').length,
    noShow: appointments.filter((a) => a.status === 'no_show').length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-gold-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-neutral-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-foreground">{stats.total}</div>
          <div className="text-sm text-foreground/60">Total</div>
        </div>
        <div className="bg-white border border-neutral-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
          <div className="text-sm text-foreground/60">Complétés</div>
        </div>
        <div className="bg-white border border-neutral-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-red-600">{stats.cancelled}</div>
          <div className="text-sm text-foreground/60">Annulés</div>
        </div>
        <div className="bg-white border border-neutral-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-orange-600">{stats.noShow}</div>
          <div className="text-sm text-foreground/60">Absences</div>
        </div>
      </div>

      <div className="bg-white border border-neutral-200 rounded-lg p-4">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center justify-between w-full text-left"
        >
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gold-600" />
            <span className="font-medium text-foreground">Filtres</span>
          </div>
          <ChevronDown
            className={`w-5 h-5 text-foreground/60 transition-transform ${
              showFilters ? 'rotate-180' : ''
            }`}
          />
        </button>

        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 pt-4 border-t border-neutral-200 space-y-4"
          >
            <div>
              <label className="block text-sm font-medium text-foreground/70 mb-2">
                Statut
              </label>
              <div className="flex flex-wrap gap-2">
                {(['all', 'completed', 'cancelled', 'no_show'] as StatusFilter[]).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setStatusFilter(filter)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      statusFilter === filter
                        ? 'bg-gold-500 text-white shadow-gold'
                        : 'bg-neutral-100 text-foreground/70 hover:bg-neutral-200'
                    }`}
                  >
                    {filter === 'all' && 'Tous'}
                    {filter === 'completed' && 'Complétés'}
                    {filter === 'cancelled' && 'Annulés'}
                    {filter === 'no_show' && 'Absences'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground/70 mb-2">
                Période
              </label>
              <div className="flex flex-wrap gap-2">
                {(['all', '30days', '90days', '1year'] as const).map((range) => (
                  <button
                    key={range}
                    onClick={() => setDateRange(range)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      dateRange === range
                        ? 'bg-gold-500 text-white shadow-gold'
                        : 'bg-neutral-100 text-foreground/70 hover:bg-neutral-200'
                    }`}
                  >
                    {range === 'all' && 'Toutes'}
                    {range === '30days' && '30 derniers jours'}
                    {range === '90days' && '3 derniers mois'}
                    {range === '1year' && 'Dernière année'}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {appointments.length === 0 ? (
        <div className="text-center py-12 bg-neutral-50 border border-neutral-200 rounded-lg">
          <Calendar className="w-12 h-12 text-foreground/20 mx-auto mb-3" />
          <p className="text-foreground/70">Aucun rendez-vous dans l'historique</p>
          <p className="text-sm text-foreground/50 mt-1">
            Les rendez-vous complétés ou annulés apparaîtront ici
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {appointments.map((appointment) => (
            <motion.div
              key={appointment.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-neutral-200 rounded-lg p-4 hover:shadow-soft transition-all"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  {getStatusIcon(appointment.status)}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-foreground">
                        {new Date(appointment.scheduled_date).toLocaleDateString('fr-CA', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </span>
                      <span
                        className={`px-2 py-0.5 text-xs font-medium rounded-full border ${getStatusColor(
                          appointment.status
                        )}`}
                      >
                        {getStatusLabel(appointment.status)}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-foreground/70 mb-2">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{appointment.scheduled_time}</span>
                      </div>
                      {appointment.service_type_name && (
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded">
                          {appointment.service_type_name}
                        </span>
                      )}
                    </div>

                    <p className="text-foreground/80 text-sm mb-2">{appointment.reason}</p>

                    {appointment.notes && (
                      <div className="text-xs text-foreground/60 bg-neutral-50 p-2 rounded border border-neutral-200 mb-2">
                        <span className="font-medium">Notes: </span>
                        {appointment.notes}
                      </div>
                    )}

                    {appointment.cancellation_reason && (
                      <div className="text-xs text-red-600 bg-red-50 p-2 rounded border border-red-200 mb-2">
                        <span className="font-medium">Raison d'annulation: </span>
                        {appointment.cancellation_reason}
                      </div>
                    )}

                    {appointment.payment_amount && (
                      <div className="flex items-center gap-2 text-sm">
                        <DollarSign className="w-4 h-4 text-green-600" />
                        <span className="font-medium text-green-700">
                          {formatCurrency(appointment.payment_amount)}
                        </span>
                        {appointment.auto_payment_enabled && (
                          <span className="px-2 py-0.5 bg-purple-50 text-purple-700 text-xs rounded">
                            Paiement automatique
                          </span>
                        )}
                        {appointment.payment_status === 'completed' && (
                          <span className="text-green-600 text-xs">Payé</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {appointment.completed_at && (
                  <div className="text-xs text-foreground/50">
                    {new Date(appointment.completed_at).toLocaleDateString('fr-CA')}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
