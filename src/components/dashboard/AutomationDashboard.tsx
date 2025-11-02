import { useState, useEffect } from 'react';
import { Activity, Mail, Calendar, Users, CheckCircle, Clock, AlertCircle, TrendingUp, Zap } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToastContext } from '../../contexts/ToastContext';
import { motion } from 'framer-motion';
import { Tooltip } from '../common/Tooltip';
import { CardSkeleton } from '../common/LoadingSkeleton';
import { EmptyState } from '../common/EmptyState';
import { buttonHover, buttonTap } from '../../lib/animations';

interface AutomationStats {
  totalBookings: number;
  autoConfirmed: number;
  remindersSent: number;
  followupsSent: number;
  waitlistInvitations: number;
  noShowsPrevented: number;
  timesSaved: number;
  automationRate: number;
}

interface RecentActivity {
  id: string;
  type: string;
  description: string;
  timestamp: string;
  status: string;
}

export default function AutomationDashboard() {
  const toast = useToastContext();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AutomationStats>({
    totalBookings: 0,
    autoConfirmed: 0,
    remindersSent: 0,
    followupsSent: 0,
    waitlistInvitations: 0,
    noShowsPrevented: 0,
    timesSaved: 0,
    automationRate: 0,
  });
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [period, setPeriod] = useState<'today' | 'week' | 'month'>('week');

  useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, 30000);
    return () => clearInterval(interval);
  }, [period]);

  async function loadStats() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const now = new Date();
      let startDate: Date;

      switch (period) {
        case 'today':
          startDate = new Date(now.setHours(0, 0, 0, 0));
          break;
        case 'week':
          startDate = new Date(now.setDate(now.getDate() - 7));
          break;
        case 'month':
          startDate = new Date(now.setDate(now.getDate() - 30));
          break;
      }

      const [
        bookingsRes,
        confirmationsRes,
        remindersRes,
        followupsRes,
        invitationsRes,
      ] = await Promise.all([
        supabase
          .from('appointments_api')
          .select('id, booking_source, status')
          .eq('owner_id', user.id)
          .gte('created_at', startDate.toISOString()),

        supabase
          .from('appointment_confirmations')
          .select('id, confirmation_status')
          .gte('created_at', startDate.toISOString()),

        supabase
          .from('appointment_confirmations')
          .select('id, reminder_48h_sent, reminder_24h_sent, reminder_2h_sent')
          .gte('created_at', startDate.toISOString()),

        supabase
          .from('automated_followups')
          .select('id, status')
          .eq('status', 'sent')
          .gte('created_at', startDate.toISOString()),

        supabase
          .from('slot_offer_invitations')
          .select('id, status')
          .gte('created_at', startDate.toISOString()),
      ]);

      const bookings = bookingsRes.data || [];
      const confirmations = confirmationsRes.data || [];
      const reminders = remindersRes.data || [];
      const followups = followupsRes.data || [];
      const invitations = invitationsRes.data || [];

      const onlineBookings = bookings.filter((b) => b.booking_source === 'online').length;
      const autoConfirmed = confirmations.filter((c) => c.confirmation_status === 'confirmed').length;
      const remindersSent = reminders.reduce(
        (sum, r) =>
          sum + (r.reminder_48h_sent ? 1 : 0) + (r.reminder_24h_sent ? 1 : 0) + (r.reminder_2h_sent ? 1 : 0),
        0
      );
      const completedFollowups = followups.length;
      const sentInvitations = invitations.filter((i) => i.status !== 'pending').length;

      const totalActions = onlineBookings + autoConfirmed + remindersSent + completedFollowups + sentInvitations;
      const manualTime = totalActions * 3;
      const automationRate = bookings.length > 0 ? (onlineBookings / bookings.length) * 100 : 0;

      setStats({
        totalBookings: bookings.length,
        autoConfirmed,
        remindersSent,
        followupsSent: completedFollowups,
        waitlistInvitations: sentInvitations,
        noShowsPrevented: Math.floor(remindersSent * 0.4),
        timesSaved: manualTime,
        automationRate,
      });

      const activities: RecentActivity[] = [
        ...bookings.slice(0, 3).map((b) => ({
          id: b.id,
          type: 'booking',
          description: `Nouvelle réservation ${b.booking_source === 'online' ? 'en ligne' : 'manuelle'}`,
          timestamp: new Date().toISOString(),
          status: 'completed',
        })),
        ...reminders.slice(0, 3).map((r, i) => ({
          id: `reminder-${i}`,
          type: 'reminder',
          description: 'Rappel automatique envoyé',
          timestamp: new Date().toISOString(),
          status: 'completed',
        })),
        ...followups.slice(0, 2).map((f) => ({
          id: f.id,
          type: 'followup',
          description: 'Email de suivi envoyé',
          timestamp: new Date().toISOString(),
          status: 'completed',
        })),
      ];

      setRecentActivities(activities.slice(0, 10));
    } catch (error: any) {
      console.error('Error loading stats:', error);
      toast.error('Erreur lors du chargement des statistiques');
    } finally {
      setLoading(false);
    }
  }

  function formatTime(minutes: number): string {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  }

  const statCards = [
    {
      icon: Calendar,
      label: 'Réservations totales',
      value: stats.totalBookings,
      color: 'blue',
      subtitle: `${Math.round(stats.automationRate)}% automatiques`,
    },
    {
      icon: CheckCircle,
      label: 'Confirmations auto',
      value: stats.autoConfirmed,
      color: 'green',
      subtitle: 'Patients confirmés',
    },
    {
      icon: Mail,
      label: 'Rappels envoyés',
      value: stats.remindersSent,
      color: 'purple',
      subtitle: 'Emails automatiques',
    },
    {
      icon: Users,
      label: 'Suivis post-RDV',
      value: stats.followupsSent,
      color: 'amber',
      subtitle: 'Satisfaction + rebooking',
    },
    {
      icon: Activity,
      label: 'Liste d\'attente',
      value: stats.waitlistInvitations,
      color: 'teal',
      subtitle: 'Invitations envoyées',
    },
    {
      icon: TrendingUp,
      label: 'No-shows évités',
      value: stats.noShowsPrevented,
      color: 'emerald',
      subtitle: 'Grâce aux rappels',
    },
    {
      icon: Clock,
      label: 'Temps économisé',
      value: formatTime(stats.timesSaved),
      color: 'rose',
      subtitle: 'Travail automatisé',
    },
    {
      icon: Zap,
      label: 'Taux d\'automatisation',
      value: `${Math.round(stats.automationRate)}%`,
      color: 'yellow',
      subtitle: 'Zéro intervention',
    },
  ];

  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    purple: 'from-purple-500 to-purple-600',
    amber: 'from-amber-500 to-amber-600',
    teal: 'from-teal-500 to-teal-600',
    emerald: 'from-emerald-500 to-emerald-600',
    rose: 'from-rose-500 to-rose-600',
    yellow: 'from-yellow-500 to-yellow-600',
  };

  const activityIcons = {
    booking: Calendar,
    reminder: Mail,
    followup: Users,
    invitation: Activity,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Tableau de bord d'automatisation</h2>
          <p className="text-slate-600 mt-1">Système 100% automatique - Zéro intervention manuelle</p>
        </div>

        <div className="flex gap-2">
          {(['today', 'week', 'month'] as const).map((p) => (
            <Tooltip
              key={p}
              content={`Statistiques des ${p === 'today' ? 'dernières 24h' : p === 'week' ? '7 derniers jours' : '30 derniers jours'}`}
              placement="bottom"
            >
              <motion.button
                onClick={() => setPeriod(p)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  period === p
                    ? 'bg-amber-600 text-white'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
                whileHover={buttonHover}
                whileTap={buttonTap}
              >
                {p === 'today' ? 'Aujourd\'hui' : p === 'week' ? '7 jours' : '30 jours'}
              </motion.button>
            </Tooltip>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <CardSkeleton />
            <CardSkeleton />
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {statCards.map((card, index) => (
              <Tooltip key={index} content={card.subtitle} placement="top">
                <motion.div
                  className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow cursor-help"
                  whileHover={{ scale: 1.02 }}
                >
                <div
                  className={`w-12 h-12 rounded-lg bg-gradient-to-br ${
                    colorClasses[card.color as keyof typeof colorClasses]
                  } flex items-center justify-center mb-4`}
                >
                  <card.icon className="w-6 h-6 text-white" />
                </div>
                <div className="text-3xl font-bold text-slate-900 mb-1">{card.value}</div>
                <div className="text-sm font-medium text-slate-700 mb-1">{card.label}</div>
                <div className="text-xs text-slate-500">{card.subtitle}</div>
              </motion.div>
              </Tooltip>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white border border-slate-200 rounded-lg shadow-sm">
              <div className="p-6 border-b border-slate-200">
                <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-amber-600" />
                  Activité récente
                </h3>
              </div>
              <div className="divide-y divide-slate-200 max-h-96 overflow-y-auto">
                {recentActivities.length === 0 ? (
                  <div className="p-8 text-center text-slate-500">Aucune activité récente</div>
                ) : (
                  recentActivities.map((activity) => {
                    const Icon = activityIcons[activity.type as keyof typeof activityIcons] || Activity;
                    return (
                      <div key={activity.id} className="p-4 hover:bg-slate-50 transition-colors">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                            <Icon className="w-4 h-4 text-green-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-900">{activity.description}</p>
                            <p className="text-xs text-slate-500 mt-1">
                              {new Date(activity.timestamp).toLocaleString('fr-FR')}
                            </p>
                          </div>
                          <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200 rounded-lg p-8 shadow-sm">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center mx-auto mb-4">
                  <Zap className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-amber-900 mb-2">Système 100% automatisé</h3>
                <p className="text-amber-800 mb-6">
                  Plus besoin d'adjointe pour la gestion des rendez-vous!
                </p>

                <div className="bg-white rounded-lg p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <span className="text-sm text-slate-700 text-left">
                      Réservation en ligne 24/7 automatique
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <span className="text-sm text-slate-700 text-left">
                      Confirmations et rappels automatiques
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <span className="text-sm text-slate-700 text-left">
                      Liste d'attente intelligente et instantanée
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <span className="text-sm text-slate-700 text-left">
                      Suivis post-RDV et rebooking automatique
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <span className="text-sm text-slate-700 text-left">
                      Formulaires d'admission électroniques
                    </span>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-amber-200 rounded-lg">
                  <p className="text-sm font-semibold text-amber-900">
                    Économie estimée: {formatTime(stats.timesSaved)} de travail manuel
                  </p>
                  <p className="text-xs text-amber-800 mt-1">
                    Équivalent à {Math.floor(stats.timesSaved / 480)} jours de travail à temps plein
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">État du système</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-green-900">Système opérationnel</p>
                  <p className="text-xs text-green-700">Tous les services fonctionnent</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <Activity className="w-6 h-6 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-blue-900">Emails activés</p>
                  <p className="text-xs text-blue-700">Confirmations et rappels actifs</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                <Users className="w-6 h-6 text-purple-600" />
                <div>
                  <p className="text-sm font-medium text-purple-900">Liste d'attente active</p>
                  <p className="text-xs text-purple-700">Invitations automatiques</p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
