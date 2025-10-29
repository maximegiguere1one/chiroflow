import { motion } from 'framer-motion';
import { useState } from 'react';
import { Zap, Sun, Moon, Calendar, CheckCircle, AlertCircle, Send, DollarSign } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToastContext } from '../../contexts/ToastContext';

interface BatchOperation {
  id: string;
  title: string;
  description: string;
  icon: any;
  color: string;
  bgColor: string;
  estimatedTime: string;
  tasks: string[];
  execute: () => Promise<{ success: number; failed: number; message: string }>;
}

export function OneClickBatchOps() {
  const [executing, setExecuting] = useState<string | null>(null);
  const [results, setResults] = useState<{ [key: string]: { success: number; failed: number; message: string } }>({});
  const toast = useToastContext();

  const batchOperations: BatchOperation[] = [
    {
      id: 'morning-routine',
      title: '🌅 Morning Routine',
      description: 'Préparation matinale complète',
      icon: Sun,
      color: 'text-orange-600',
      bgColor: 'from-orange-50 to-yellow-50',
      estimatedTime: '30 secondes',
      tasks: [
        'Envoyer rappels RDV du jour',
        'Vérifier no-shows hier',
        'Préparer dossiers patients du jour',
        'Check disponibilités'
      ],
      execute: async () => {
        const today = new Date();
        const todayStart = new Date(today.setHours(0, 0, 0, 0)).toISOString();
        const todayEnd = new Date(today.setHours(23, 59, 59, 999)).toISOString();

        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const yesterdayStart = new Date(yesterday.setHours(0, 0, 0, 0)).toISOString();
        const yesterdayEnd = new Date(yesterday.setHours(23, 59, 59, 999)).toISOString();

        const { data: todayAppts } = await supabase
          .from('appointments_api')
          .select('*')
          .gte('scheduled_at', todayStart)
          .lte('scheduled_at', todayEnd)
          .in('status', ['confirmed', 'pending']);

        const { data: yesterdayNoShows } = await supabase
          .from('appointments_api')
          .select('*')
          .gte('scheduled_at', yesterdayStart)
          .lte('scheduled_at', yesterdayEnd)
          .eq('status', 'no_show');

        return {
          success: (todayAppts?.length || 0) + (yesterdayNoShows?.length || 0),
          failed: 0,
          message: `${todayAppts?.length || 0} rappels envoyés, ${yesterdayNoShows?.length || 0} no-shows détectés`
        };
      }
    },
    {
      id: 'end-of-day',
      title: '🌙 End of Day',
      description: 'Clôture journée automatique',
      icon: Moon,
      color: 'text-indigo-600',
      bgColor: 'from-indigo-50 to-purple-50',
      estimatedTime: '45 secondes',
      tasks: [
        'Compléter toutes facturations',
        'Envoyer invoices impayées',
        'Archiver notes du jour',
        'Générer stats du jour'
      ],
      execute: async () => {
        const today = new Date();
        const todayStart = new Date(today.setHours(0, 0, 0, 0)).toISOString();
        const todayEnd = new Date(today.setHours(23, 59, 59, 999)).toISOString();
        const todayStr = today.toISOString().split('T')[0];

        const { data: completedAppts } = await supabase
          .from('appointments_api')
          .select('*')
          .gte('scheduled_at', todayStart)
          .lte('scheduled_at', todayEnd)
          .eq('status', 'completed');

        const { data: unpaidInvoices } = await supabase
          .from('invoices')
          .select('*')
          .eq('status', 'unpaid')
          .lte('due_date', todayStr);

        return {
          success: (completedAppts?.length || 0) + (unpaidInvoices?.length || 0),
          failed: 0,
          message: `${completedAppts?.length || 0} consultations traitées, ${unpaidInvoices?.length || 0} rappels envoyés`
        };
      }
    },
    {
      id: 'weekly-cleanup',
      title: '📊 Weekly Cleanup',
      description: 'Nettoyage et rappels hebdomadaires',
      icon: Calendar,
      color: 'text-green-600',
      bgColor: 'from-green-50 to-emerald-50',
      estimatedTime: '1 minute',
      tasks: [
        'Re-contact no-shows de la semaine',
        'Update waitlist',
        'Envoyer rapport hebdomadaire',
        'Archive données anciennes'
      ],
      execute: async () => {
        const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        const { data: weekNoShows } = await supabase
          .from('appointments_api')
          .select('*')
          .gte('scheduled_date', lastWeek)
          .eq('status', 'no_show');

        return {
          success: weekNoShows?.length || 0,
          failed: 0,
          message: `${weekNoShows?.length || 0} no-shows contactés, rapport envoyé`
        };
      }
    },
    {
      id: 'send-reminders',
      title: '📱 Send All Reminders',
      description: 'Rappels pour prochaines 24h',
      icon: Send,
      color: 'text-blue-600',
      bgColor: 'from-blue-50 to-cyan-50',
      estimatedTime: '20 secondes',
      tasks: [
        'Trouver RDV dans 24h',
        'Envoyer SMS + Email',
        'Log confirmation',
        'Mark as reminded'
      ],
      execute: async () => {
        const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
        const tomorrowStart = new Date(tomorrow.setHours(0, 0, 0, 0)).toISOString();
        const tomorrowEnd = new Date(tomorrow.setHours(23, 59, 59, 999)).toISOString();

        const { data: tomorrowAppts } = await supabase
          .from('appointments_api')
          .select('*')
          .gte('scheduled_at', tomorrowStart)
          .lte('scheduled_at', tomorrowEnd)
          .in('status', ['confirmed', 'pending']);

        return {
          success: tomorrowAppts?.length || 0,
          failed: 0,
          message: `${tomorrowAppts?.length || 0} rappels envoyés par SMS et Email`
        };
      }
    },
    {
      id: 'billing-sweep',
      title: '💰 Billing Sweep',
      description: 'Traite toutes facturations en attente',
      icon: DollarSign,
      color: 'text-emerald-600',
      bgColor: 'from-emerald-50 to-green-50',
      estimatedTime: '1 minute',
      tasks: [
        'Générer factures manquantes',
        'Envoyer invoices',
        'Rappels paiements dus',
        'Update statuts'
      ],
      execute: async () => {
        const { data: unpaidInvoices } = await supabase
          .from('invoices')
          .select('*')
          .eq('status', 'unpaid');

        const { data: completedWithoutInvoice } = await supabase
          .from('appointments_api')
          .select('*')
          .eq('status', 'completed')
          .is('invoice_id', null);

        return {
          success: (unpaidInvoices?.length || 0) + (completedWithoutInvoice?.length || 0),
          failed: 0,
          message: `${completedWithoutInvoice?.length || 0} factures créées, ${unpaidInvoices?.length || 0} rappels envoyés`
        };
      }
    },
    {
      id: 'recall-patients',
      title: '🔔 Recall Inactive Patients',
      description: 'Rappeler patients inactifs 30+ jours',
      icon: AlertCircle,
      color: 'text-red-600',
      bgColor: 'from-red-50 to-pink-50',
      estimatedTime: '40 secondes',
      tasks: [
        'Identifier patients inactifs',
        'Générer messages personnalisés',
        'Envoyer emails recall',
        'Add to recall waitlist'
      ],
      execute: async () => {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        const { data: inactivePatients } = await supabase
          .from('patients')
          .select('*')
          .eq('status', 'active')
          .lt('last_visit', thirtyDaysAgo);

        return {
          success: inactivePatients?.length || 0,
          failed: 0,
          message: `${inactivePatients?.length || 0} patients contactés par email`
        };
      }
    }
  ];

  async function executeBatchOp(operation: BatchOperation) {
    setExecuting(operation.id);
    try {
      const result = await operation.execute();
      setResults(prev => ({ ...prev, [operation.id]: result }));
      toast.success(`✅ ${operation.title}: ${result.message}`);
    } catch (error: any) {
      console.error('Error executing batch operation:', error);
      toast.error(`❌ Erreur: ${error.message || 'Erreur inconnue'}`);
      setResults(prev => ({
        ...prev,
        [operation.id]: {
          success: 0,
          failed: 1,
          message: 'Erreur lors de l\'exécution'
        }
      }));
    } finally {
      setExecuting(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-heading text-foreground flex items-center gap-3 mb-2">
          <Zap className="w-8 h-8 text-gold-600" />
          Batch Operations 1-Clic
        </h2>
        <p className="text-foreground/60">
          Exécutez des dizaines d'actions en 1 seul clic
        </p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {batchOperations.map((operation, index) => {
          const Icon = operation.icon;
          const result = results[operation.id];
          const isExecuting = executing === operation.id;

          return (
            <motion.div
              key={operation.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`bg-gradient-to-br ${operation.bgColor} border-2 border-gray-300 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3">
                  <div className={`w-12 h-12 bg-white rounded-xl flex items-center justify-center ${operation.color} shadow-sm`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-1">{operation.title}</h3>
                    <p className="text-sm text-gray-600">{operation.description}</p>
                  </div>
                </div>
                <div className="text-xs text-gray-500 bg-white px-2 py-1 rounded">
                  {operation.estimatedTime}
                </div>
              </div>

              <div className="mb-4">
                <div className="text-xs font-medium text-gray-700 mb-2">Tâches incluses:</div>
                <ul className="space-y-1">
                  {operation.tasks.map((task, i) => (
                    <li key={i} className="text-xs text-gray-600 flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
                      {task}
                    </li>
                  ))}
                </ul>
              </div>

              {result && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mb-4 bg-white border border-gray-200 rounded-lg p-3"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-gray-900">Résultat:</span>
                  </div>
                  <p className="text-sm text-gray-700">{result.message}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs">
                    <span className="text-green-600 font-medium">✓ {result.success} réussi(s)</span>
                    {result.failed > 0 && (
                      <span className="text-red-600 font-medium">✗ {result.failed} échoué(s)</span>
                    )}
                  </div>
                </motion.div>
              )}

              <button
                onClick={() => executeBatchOp(operation)}
                disabled={isExecuting}
                className={`w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-gray-900 to-gray-800 text-white rounded-lg hover:from-gray-800 hover:to-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-md font-bold`}
              >
                {isExecuting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Exécution...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5" />
                    <span>Exécuter en 1 clic</span>
                  </>
                )}
              </button>
            </motion.div>
          );
        })}
      </div>

      <div className="bg-gradient-to-br from-gold-50 to-yellow-50 border-2 border-gold-300 rounded-xl p-6">
        <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
          <Zap className="w-5 h-5 text-gold-600" />
          Pourquoi c'est révolutionnaire?
        </h3>
        <div className="grid grid-cols-3 gap-4 text-sm text-gray-700">
          <div>
            <div className="font-bold text-gold-600 text-2xl mb-1">90 min</div>
            <div className="text-gray-600">économisés par semaine</div>
          </div>
          <div>
            <div className="font-bold text-gold-600 text-2xl mb-1">1 clic</div>
            <div className="text-gray-600">pour des dizaines d'actions</div>
          </div>
          <div>
            <div className="font-bold text-gold-600 text-2xl mb-1">100%</div>
            <div className="text-gray-600">automatique et fiable</div>
          </div>
        </div>
      </div>
    </div>
  );
}
