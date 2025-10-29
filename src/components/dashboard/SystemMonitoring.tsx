import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Clock,
  Zap,
  Database,
  Mail,
  Server,
  RefreshCw,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAsync } from '../../hooks/useAsync';
import { performanceMonitor } from '../../lib/performance';
import { errorHandler } from '../../lib/errorHandler';

interface ErrorAnalytic {
  error_code: string;
  severity: string;
  occurrence_count: number;
  last_occurred: string;
  first_occurred: string;
  affected_users: number;
  avg_resolution_time_minutes: number | null;
}

interface PerformanceAnalytic {
  metric_name: string;
  measurement_count: number;
  avg_duration_ms: number;
  min_duration_ms: number;
  max_duration_ms: number;
  median_duration_ms: number;
  p95_duration_ms: number;
  p99_duration_ms: number;
}

interface HealthCheck {
  check_name: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  details: Record<string, any>;
  checked_at: string;
}

export default function SystemMonitoring() {
  const [errorAnalytics, setErrorAnalytics] = useState<ErrorAnalytic[]>([]);
  const [perfAnalytics, setPerfAnalytics] = useState<PerformanceAnalytic[]>([]);
  const [healthChecks, setHealthChecks] = useState<HealthCheck[]>([]);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const { execute: loadData, loading } = useAsync(
    async () => {
      const [errorsRes, perfRes, healthRes] = await Promise.all([
        supabase.from('error_analytics').select('*').limit(10),
        supabase.from('performance_analytics').select('*').limit(10),
        supabase
          .from('system_health_checks')
          .select('*')
          .order('checked_at', { ascending: false })
          .limit(5),
      ]);

      if (errorsRes.data) setErrorAnalytics(errorsRes.data);
      if (perfRes.data) setPerfAnalytics(perfRes.data);
      if (healthRes.data) setHealthChecks(healthRes.data);
    },
    { immediate: true }
  );

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      loadData();
    }, 30000);

    return () => clearInterval(interval);
  }, [autoRefresh, loadData]);

  const recentClientErrors = errorHandler.getRecentErrors(5);
  const recentClientPerf = performanceMonitor.getMetrics().slice(-5);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-600 bg-green-100';
      case 'degraded':
        return 'text-yellow-600 bg-yellow-100';
      case 'unhealthy':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'text-red-700 bg-red-100';
      case 'high':
        return 'text-orange-700 bg-orange-100';
      case 'medium':
        return 'text-yellow-700 bg-yellow-100';
      case 'low':
        return 'text-blue-700 bg-blue-100';
      default:
        return 'text-gray-700 bg-gray-100';
    }
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-heading text-foreground">Monitoring Système</h2>
          <p className="text-sm text-foreground/60 mt-1">
            Surveillance en temps réel de la santé et des performances
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors ${
              autoRefresh
                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Activity className={`w-4 h-4 ${autoRefresh ? 'animate-pulse' : ''}`} />
            {autoRefresh ? 'Auto-rafraîchissement ON' : 'Auto-rafraîchissement OFF'}
          </button>
          <button
            onClick={() => loadData()}
            disabled={loading}
            className="px-4 py-2 bg-gold-500 text-white rounded-lg hover:bg-gold-600 transition-colors text-sm flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Rafraîchir
          </button>
        </div>
      </div>

      {/* System Health Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <HealthCard
          icon={Database}
          title="Base de données"
          status={healthChecks.find((h) => h.check_name === 'database')?.status || 'healthy'}
          lastCheck={healthChecks.find((h) => h.check_name === 'database')?.checked_at}
        />
        <HealthCard
          icon={Mail}
          title="Système d'emails"
          status={healthChecks.find((h) => h.check_name === 'email')?.status || 'healthy'}
          lastCheck={healthChecks.find((h) => h.check_name === 'email')?.checked_at}
        />
        <HealthCard
          icon={Server}
          title="API Backend"
          status={healthChecks.find((h) => h.check_name === 'api')?.status || 'healthy'}
          lastCheck={healthChecks.find((h) => h.check_name === 'api')?.checked_at}
        />
        <HealthCard
          icon={Zap}
          title="Performance globale"
          status={
            perfAnalytics.some((p) => p.avg_duration_ms > 3000)
              ? 'degraded'
              : 'healthy'
          }
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Error Analytics */}
        <div className="bg-white border border-neutral-200 shadow-soft-lg rounded-lg">
          <div className="p-6 border-b border-neutral-200">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              Erreurs récentes (30 jours)
            </h3>
          </div>
          <div className="divide-y divide-neutral-200 max-h-[400px] overflow-y-auto">
            {errorAnalytics.length === 0 ? (
              <div className="p-8 text-center">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                <p className="text-foreground/60">Aucune erreur détectée</p>
              </div>
            ) : (
              errorAnalytics.map((error, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-4 hover:bg-neutral-50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <code className="text-sm font-mono text-foreground">{error.error_code}</code>
                      <span
                        className={`ml-2 text-xs px-2 py-1 rounded-full ${getSeverityColor(
                          error.severity
                        )}`}
                      >
                        {error.severity}
                      </span>
                    </div>
                    <span className="text-sm font-semibold text-foreground">
                      {error.occurrence_count}x
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-foreground/60">
                    <span>{error.affected_users} utilisateurs affectés</span>
                    <span>
                      Dernière: {new Date(error.last_occurred).toLocaleDateString('fr-CA')}
                    </span>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>

        {/* Performance Analytics */}
        <div className="bg-white border border-neutral-200 shadow-soft-lg rounded-lg">
          <div className="p-6 border-b border-neutral-200">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-500" />
              Performances (24h)
            </h3>
          </div>
          <div className="divide-y divide-neutral-200 max-h-[400px] overflow-y-auto">
            {perfAnalytics.length === 0 ? (
              <div className="p-8 text-center">
                <Clock className="w-12 h-12 text-foreground/20 mx-auto mb-3" />
                <p className="text-foreground/60">Aucune métrique disponible</p>
              </div>
            ) : (
              perfAnalytics.map((perf, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-4 hover:bg-neutral-50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-foreground">{perf.metric_name}</span>
                    <span className="text-sm font-semibold text-foreground">
                      {formatDuration(perf.avg_duration_ms)}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs text-foreground/60">
                    <div>
                      <span className="block">Min</span>
                      <span className="font-medium">{formatDuration(perf.min_duration_ms)}</span>
                    </div>
                    <div>
                      <span className="block">P95</span>
                      <span className="font-medium">{formatDuration(perf.p95_duration_ms)}</span>
                    </div>
                    <div>
                      <span className="block">Max</span>
                      <span className="font-medium">{formatDuration(perf.max_duration_ms)}</span>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Client-side metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-neutral-200 shadow-soft-lg rounded-lg">
          <div className="p-6 border-b border-neutral-200">
            <h3 className="text-lg font-semibold text-foreground">
              Erreurs Client (session actuelle)
            </h3>
          </div>
          <div className="p-6">
            {recentClientErrors.length === 0 ? (
              <p className="text-center text-foreground/60 py-4">
                Aucune erreur dans cette session
              </p>
            ) : (
              <div className="space-y-3">
                {recentClientErrors.map((error) => (
                  <div key={error.id} className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <div className="flex items-start justify-between">
                      <code className="text-xs font-mono text-red-800">{error.errorCode}</code>
                      <span className={`text-xs px-2 py-1 rounded-full ${getSeverityColor(error.severity)}`}>
                        {error.severity}
                      </span>
                    </div>
                    <p className="text-sm text-red-700 mt-1">{error.message}</p>
                    <p className="text-xs text-red-600 mt-1">
                      {new Date(error.timestamp).toLocaleTimeString('fr-CA')}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white border border-neutral-200 shadow-soft-lg rounded-lg">
          <div className="p-6 border-b border-neutral-200">
            <h3 className="text-lg font-semibold text-foreground">
              Métriques Client (session actuelle)
            </h3>
          </div>
          <div className="p-6">
            {recentClientPerf.length === 0 ? (
              <p className="text-center text-foreground/60 py-4">
                Aucune métrique dans cette session
              </p>
            ) : (
              <div className="space-y-2">
                {recentClientPerf.map((metric) => (
                  <div
                    key={metric.timestamp.toString()}
                    className="flex items-center justify-between py-2 border-b border-neutral-100 last:border-0"
                  >
                    <span className="text-sm text-foreground">{metric.name}</span>
                    <span
                      className={`text-sm font-medium ${
                        metric.duration > 3000 ? 'text-red-600' : 'text-green-600'
                      }`}
                    >
                      {formatDuration(metric.duration)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface HealthCardProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  lastCheck?: string;
}

function HealthCard({ icon: Icon, title, status, lastCheck }: HealthCardProps) {
  const statusConfig = {
    healthy: {
      color: 'from-green-500 to-green-600',
      bgColor: 'from-green-50 to-green-100',
      text: 'Opérationnel',
      icon: CheckCircle,
    },
    degraded: {
      color: 'from-yellow-500 to-yellow-600',
      bgColor: 'from-yellow-50 to-yellow-100',
      text: 'Dégradé',
      icon: AlertTriangle,
    },
    unhealthy: {
      color: 'from-red-500 to-red-600',
      bgColor: 'from-red-50 to-red-100',
      text: 'Hors service',
      icon: AlertTriangle,
    },
  };

  const config = statusConfig[status];
  const StatusIcon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative group"
    >
      <div
        className={`bg-gradient-to-br ${config.bgColor} border border-white/40 p-6 shadow-soft hover:shadow-soft-lg transition-all duration-300`}
      >
        <div className="flex items-start justify-between mb-4">
          <div
            className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${config.color} flex items-center justify-center shadow-soft`}
          >
            <Icon className="w-6 h-6 text-white" />
          </div>
          <StatusIcon className={`w-5 h-5 ${config.color.replace('from-', 'text-').split(' ')[0]}`} />
        </div>
        <div>
          <div className="text-xl font-light text-foreground tracking-tight mb-1">{config.text}</div>
          <div className="text-sm text-foreground/60 font-light">{title}</div>
          {lastCheck && (
            <div className="text-xs text-foreground/40 mt-2">
              Vérifié: {new Date(lastCheck).toLocaleTimeString('fr-CA')}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
