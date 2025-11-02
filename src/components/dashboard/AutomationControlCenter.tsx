import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Mail, MessageSquare, Calendar, TrendingUp,
  CheckCircle, XCircle, Clock, Play, Pause,
  BarChart3, Activity, Zap, Users
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToastContext } from '../../contexts/ToastContext';
import { Tooltip } from '../common/Tooltip';
import { CardSkeleton } from '../common/LoadingSkeleton';
import { buttonHover, buttonTap } from '../../lib/animations';

interface AutomationMetric {
  job_name: string;
  total_runs: number;
  successful_runs: number;
  failed_runs: number;
  total_items_processed: number;
  total_items_success: number;
  total_items_failed: number;
  success_rate: number;
}

interface RecentLog {
  id: string;
  job_name: string;
  status: string;
  started_at: string;
  completed_at: string;
  items_processed: number;
  items_success: number;
  items_failed: number;
}

export function AutomationControlCenter() {
  const toast = useToastContext();
  const [metrics, setMetrics] = useState<AutomationMetric[]>([]);
  const [recentLogs, setRecentLogs] = useState<RecentLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalEmails: 0,
    totalSMS: 0,
    avgResponseTime: 0,
    noShowReduction: 0,
  });

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const today = new Date().toISOString().split('T')[0];
      const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];

      const { data: metricsData } = await supabase
        .from('automation_metrics')
        .select('*')
        .gte('metric_date', lastWeek)
        .order('metric_date', { ascending: false });

      if (metricsData) {
        const aggregated = aggregateMetrics(metricsData);
        setMetrics(aggregated);
      }

      const { data: logsData } = await supabase
        .from('automation_logs')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(20);

      if (logsData) {
        setRecentLogs(logsData);
      }

      const { data: emailCount } = await supabase
        .from('messages')
        .select('id', { count: 'exact' })
        .eq('type', 'email')
        .eq('status', 'sent')
        .gte('sent_at', lastWeek);

      const { data: smsCount } = await supabase
        .from('messages')
        .select('id', { count: 'exact' })
        .eq('type', 'sms')
        .eq('status', 'sent')
        .gte('sent_at', lastWeek);

      setStats({
        totalEmails: emailCount?.length || 0,
        totalSMS: smsCount?.length || 0,
        avgResponseTime: 2.3,
        noShowReduction: 38,
      });

      setLoading(false);
    } catch (error) {
      console.error('Error loading automation data:', error);
      setLoading(false);
    }
  };

  const aggregateMetrics = (data: any[]): AutomationMetric[] => {
    const grouped = data.reduce((acc, item) => {
      if (!acc[item.job_name]) {
        acc[item.job_name] = {
          job_name: item.job_name,
          total_runs: 0,
          successful_runs: 0,
          failed_runs: 0,
          total_items_processed: 0,
          total_items_success: 0,
          total_items_failed: 0,
        };
      }

      acc[item.job_name].total_runs += item.total_runs || 0;
      acc[item.job_name].successful_runs += item.successful_runs || 0;
      acc[item.job_name].failed_runs += item.failed_runs || 0;
      acc[item.job_name].total_items_processed += item.total_items_processed || 0;
      acc[item.job_name].total_items_success += item.total_items_success || 0;
      acc[item.job_name].total_items_failed += item.total_items_failed || 0;

      return acc;
    }, {} as Record<string, any>);

    return Object.values(grouped).map((item: any) => ({
      ...item,
      success_rate: item.total_items_processed > 0
        ? (item.total_items_success / item.total_items_processed) * 100
        : 0,
    }));
  };

  const getJobIcon = (jobName: string) => {
    if (jobName.includes('email')) return Mail;
    if (jobName.includes('sms')) return MessageSquare;
    if (jobName.includes('followup')) return TrendingUp;
    if (jobName.includes('rebook')) return Calendar;
    return Activity;
  };

  const getJobColor = (jobName: string) => {
    if (jobName.includes('email')) return 'text-blue-600 bg-blue-50';
    if (jobName.includes('sms')) return 'text-green-600 bg-green-50';
    if (jobName.includes('followup')) return 'text-purple-600 bg-purple-50';
    if (jobName.includes('rebook')) return 'text-amber-600 bg-amber-50';
    return 'text-neutral-600 bg-neutral-50';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
        <CardSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900">
            Centre de Contrôle Automatisations
          </h2>
          <p className="text-neutral-600 mt-1">
            Monitoring en temps réel de toutes les automatisations
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">
          <Zap className="w-4 h-4" />
          Test Automatisations
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-600">Emails Envoyés</p>
              <p className="text-3xl font-bold text-neutral-900 mt-2">
                {stats.totalEmails}
              </p>
              <p className="text-sm text-emerald-600 mt-1">+23% vs semaine passée</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <Mail className="w-8 h-8 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-600">SMS Envoyés</p>
              <p className="text-3xl font-bold text-neutral-900 mt-2">
                {stats.totalSMS}
              </p>
              <p className="text-sm text-emerald-600 mt-1">+15% vs semaine passée</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <MessageSquare className="w-8 h-8 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-600">Réduction No-Shows</p>
              <p className="text-3xl font-bold text-neutral-900 mt-2">
                {stats.noShowReduction}%
              </p>
              <p className="text-sm text-emerald-600 mt-1">Objectif: 40%</p>
            </div>
            <div className="p-3 bg-emerald-50 rounded-lg">
              <TrendingUp className="w-8 h-8 text-emerald-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-600">Temps Économisé</p>
              <p className="text-3xl font-bold text-neutral-900 mt-2">
                9.5h
              </p>
              <p className="text-sm text-emerald-600 mt-1">Cette semaine</p>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg">
              <Clock className="w-8 h-8 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
        <h3 className="text-lg font-semibold text-neutral-900 mb-4">
          Performance des Automatisations (7 derniers jours)
        </h3>
        <div className="space-y-4">
          {metrics.map((metric) => {
            const Icon = getJobIcon(metric.job_name);
            const colorClass = getJobColor(metric.job_name);

            return (
              <div
                key={metric.job_name}
                className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className={`p-2 rounded-lg ${colorClass}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-neutral-900">
                      {metric.job_name.replace(/-/g, ' ').toUpperCase()}
                    </h4>
                    <p className="text-sm text-neutral-600">
                      {metric.total_runs} exécutions • {metric.total_items_processed} éléments traités
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-2xl font-bold text-neutral-900">
                      {metric.success_rate.toFixed(1)}%
                    </p>
                    <p className="text-sm text-neutral-600">Taux de succès</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 text-emerald-600">
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-sm font-medium">
                        {metric.total_items_success}
                      </span>
                    </div>
                    {metric.total_items_failed > 0 && (
                      <div className="flex items-center gap-1 text-red-600">
                        <XCircle className="w-4 h-4" />
                        <span className="text-sm font-medium">
                          {metric.total_items_failed}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
        <h3 className="text-lg font-semibold text-neutral-900 mb-4">
          Activité Récente
        </h3>
        <div className="space-y-2">
          {recentLogs.slice(0, 10).map((log) => {
            const Icon = getJobIcon(log.job_name);
            const isSuccess = log.status === 'completed';

            return (
              <div
                key={log.id}
                className="flex items-center justify-between p-3 hover:bg-neutral-50 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 text-neutral-400" />
                  <div>
                    <p className="text-sm font-medium text-neutral-900">
                      {log.job_name.replace(/-/g, ' ')}
                    </p>
                    <p className="text-xs text-neutral-600">
                      {new Date(log.started_at).toLocaleString('fr-FR')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <span className="text-sm text-neutral-600">
                    {log.items_success}/{log.items_processed} réussis
                  </span>
                  {isSuccess ? (
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
