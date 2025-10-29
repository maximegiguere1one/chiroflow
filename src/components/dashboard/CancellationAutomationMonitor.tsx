import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  AlertCircle, CheckCircle, Clock, Mail, Users, TrendingUp,
  RefreshCw, Activity, XCircle, Calendar, Send, Eye
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToastContext } from '../../contexts/ToastContext';

interface AutomationStats {
  total_cancellations: number;
  slot_offers_created: number;
  invitations_sent: number;
  slots_claimed: number;
  success_rate: number;
  last_24h: {
    cancellations: number;
    emails_sent: number;
    slots_claimed: number;
  };
  recent_logs: Array<{
    id: string;
    event_type: string;
    status: string;
    created_at: string;
    error_message?: string;
  }>;
}

interface MonitorEntry {
  appointment_id: string;
  scheduled_time: string;
  appointment_status: string;
  slot_offer_id: string;
  slot_status: string;
  invitation_count: number;
  claimed_by: string | null;
  claimed_at: string | null;
  invitations_sent: number;
  invitations_accepted: number;
  last_trigger_log: string;
  last_trigger_status: string;
  last_error: string | null;
}

export function CancellationAutomationMonitor() {
  const [stats, setStats] = useState<AutomationStats | null>(null);
  const [monitor, setMonitor] = useState<MonitorEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToastContext();

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  async function loadData() {
    try {
      const { data: statsData, error: statsError } = await supabase
        .rpc('get_cancellation_automation_stats');

      if (statsError) {
        console.error('Stats error:', statsError);
        // Créer des stats par défaut si erreur
        setStats({
          total_cancellations: 0,
          slot_offers_created: 0,
          invitations_sent: 0,
          slots_claimed: 0,
          success_rate: 0,
          last_24h: {
            cancellations: 0,
            emails_sent: 0,
            slots_claimed: 0
          },
          recent_logs: []
        });
      } else {
        setStats(statsData || {
          total_cancellations: 0,
          slot_offers_created: 0,
          invitations_sent: 0,
          slots_claimed: 0,
          success_rate: 0,
          last_24h: {
            cancellations: 0,
            emails_sent: 0,
            slots_claimed: 0
          },
          recent_logs: []
        });
      }

      const { data: monitorData, error: monitorError } = await supabase
        .from('cancellation_automation_monitor')
        .select('*')
        .limit(20);

      if (monitorError) {
        console.error('Monitor error:', monitorError);
        setMonitor([]);
      } else {
        setMonitor(monitorData || []);
      }
    } catch (error) {
      console.error('Error loading automation data:', error);
      showToast('Erreur de chargement des données', 'error');
      // Set default values
      setStats({
        total_cancellations: 0,
        slot_offers_created: 0,
        invitations_sent: 0,
        slots_claimed: 0,
        success_rate: 0,
        last_24h: {
          cancellations: 0,
          emails_sent: 0,
          slots_claimed: 0
        },
        recent_logs: []
      });
      setMonitor([]);
    } finally {
      setLoading(false);
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('fr-FR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  Migration requise
                </h3>
                <p className="text-gray-700 mb-4">
                  Le système d'automatisation des annulations n'est pas encore configuré.
                  Vous devez appliquer la migration SQL.
                </p>
                <div className="bg-white rounded-lg p-4 border border-yellow-200">
                  <p className="text-sm font-semibold text-gray-900 mb-2">Instructions:</p>
                  <ol className="text-sm text-gray-700 space-y-2 list-decimal list-inside">
                    <li>Ouvre le fichier: <code className="bg-gray-100 px-2 py-1 rounded text-xs">supabase/migrations/20251019040000_auto_trigger_cancellation_emails.sql</code></li>
                    <li>Va dans Supabase Dashboard → SQL Editor</li>
                    <li>Colle le contenu de la migration</li>
                    <li>Clique "Run"</li>
                    <li>Rafraîchis cette page</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Système d'Automatisation des Annulations</h2>
          <p className="text-gray-600 mt-1">Emails automatiques envoyés aux patients sur la waitlist</p>
        </div>
        <button
          onClick={loadData}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"
        >
          <RefreshCw className="w-4 h-4" />
          Rafraîchir
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl p-6 border border-gray-200"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{stats.total_cancellations || 0}</div>
          </div>
          <div className="text-sm text-gray-600">Annulations totales</div>
          <div className="text-xs text-gray-500 mt-1">
            {stats.last_24h?.cancellations || 0} dernières 24h
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl p-6 border border-gray-200"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Mail className="w-6 h-6 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{stats.invitations_sent || 0}</div>
          </div>
          <div className="text-sm text-gray-600">Emails envoyés</div>
          <div className="text-xs text-gray-500 mt-1">
            {stats.last_24h?.emails_sent || 0} dernières 24h
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl p-6 border border-gray-200"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{stats.slots_claimed || 0}</div>
          </div>
          <div className="text-sm text-gray-600">Créneaux réclamés</div>
          <div className="text-xs text-gray-500 mt-1">
            {stats.last_24h?.slots_claimed || 0} dernières 24h
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl p-6 border border-gray-200"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{stats.success_rate || 0}%</div>
          </div>
          <div className="text-sm text-gray-600">Taux de succès</div>
          <div className="text-xs text-gray-500 mt-1">
            Créneaux / Annulations
          </div>
        </motion.div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-900">Activité Récente</h3>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Activity className="w-4 h-4" />
              <span>{monitor.length} événements</span>
            </div>
          </div>
        </div>

        {monitor.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">Aucune annulation récente</p>
            <p className="text-sm text-gray-500 mt-1">
              Les annulations apparaîtront automatiquement ici
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase">
                    Rendez-vous
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase">
                    Status Créneau
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase">
                    Invitations
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase">
                    Acceptées
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase">
                    Dernière Action
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {monitor.map((entry) => (
                  <tr key={entry.appointment_id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-900">
                          {formatDate(entry.scheduled_time)}
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          entry.slot_status === 'claimed'
                            ? 'bg-green-100 text-green-700'
                            : entry.slot_status === 'pending'
                            ? 'bg-blue-100 text-blue-700'
                            : entry.slot_status === 'expired'
                            ? 'bg-gray-100 text-gray-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {entry.slot_status}
                      </span>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Send className="w-4 h-4 text-blue-500" />
                        <span className="text-sm font-medium text-gray-900">
                          {entry.invitations_sent}
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-sm font-medium text-gray-900">
                          {entry.invitations_accepted}
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          {formatDate(entry.last_trigger_log)}
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      {entry.last_trigger_status === 'success' ? (
                        <div className="flex items-center gap-2 text-green-600">
                          <CheckCircle className="w-4 h-4" />
                          <span className="text-sm font-medium">Succès</span>
                        </div>
                      ) : entry.last_trigger_status === 'error' ? (
                        <div className="flex items-center gap-2 text-red-600">
                          <XCircle className="w-4 h-4" />
                          <span className="text-sm font-medium">Erreur</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-blue-600">
                          <Clock className="w-4 h-4" />
                          <span className="text-sm font-medium">En cours</span>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {stats.recent_logs && Array.isArray(stats.recent_logs) && stats.recent_logs.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h3 className="text-lg font-bold text-gray-900">Logs Système</h3>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              {stats.recent_logs.map((log) => (
                <div
                  key={log.id}
                  className={`p-4 rounded-lg border ${
                    log.status === 'success'
                      ? 'bg-green-50 border-green-200'
                      : log.status === 'error'
                      ? 'bg-red-50 border-red-200'
                      : 'bg-blue-50 border-blue-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {log.status === 'success' ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : log.status === 'error' ? (
                        <XCircle className="w-5 h-5 text-red-600" />
                      ) : (
                        <Clock className="w-5 h-5 text-blue-600" />
                      )}
                      <div>
                        <div className="font-semibold text-gray-900">{log.event_type}</div>
                        {log.error_message && (
                          <div className="text-sm text-red-600 mt-1">{log.error_message}</div>
                        )}
                      </div>
                    </div>
                    <div className="text-sm text-gray-600">{formatDate(log.created_at)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
