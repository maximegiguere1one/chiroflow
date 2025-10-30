import { supabase } from '../../lib/supabase';
import { logger } from './Logger';

export enum MetricType {
  API_LATENCY = 'api_latency',
  DB_QUERY_DURATION = 'db_query_duration',
  ERROR_RATE = 'error_rate',
  CACHE_HIT_RATE = 'cache_hit_rate',
  ACTIVE_SESSIONS = 'active_sessions',
  PAGE_LOAD_TIME = 'page_load_time',
}

export interface Metric {
  type: MetricType;
  value: number;
  timestamp: Date;
  tags?: Record<string, string>;
  userId?: string;
  sessionId?: string;
}

class MetricsService {
  private static instance: MetricsService;
  private metrics: Metric[] = [];
  private flushInterval: NodeJS.Timeout | null = null;
  private readonly MAX_BUFFER_SIZE = 100;
  private readonly FLUSH_INTERVAL_MS = 60000;

  private constructor() {
    this.startAutoFlush();
  }

  static getInstance(): MetricsService {
    if (!MetricsService.instance) {
      MetricsService.instance = new MetricsService();
    }
    return MetricsService.instance;
  }

  recordMetric(type: MetricType, value: number, tags?: Record<string, string>): void {
    const metric: Metric = {
      type,
      value,
      timestamp: new Date(),
      tags,
      userId: this.getCurrentUserId(),
      sessionId: this.getSessionId(),
    };

    this.metrics.push(metric);

    if (import.meta.env.DEV) {
      logger.debug(`Metric: ${type}`, { value, tags });
    }

    if (this.metrics.length >= this.MAX_BUFFER_SIZE) {
      this.flush();
    }
  }

  async recordDbQueryDuration(queryName: string, duration: number): Promise<void> {
    this.recordMetric(MetricType.DB_QUERY_DURATION, duration, {
      query: queryName,
    });

    if (duration > 3000) {
      logger.warn('Slow database query detected', {
        query: queryName,
        duration,
      });
    }
  }

  async recordApiLatency(endpoint: string, duration: number, status: number): Promise<void> {
    this.recordMetric(MetricType.API_LATENCY, duration, {
      endpoint,
      status: status.toString(),
    });
  }

  recordError(errorCode: string, severity: string): void {
    this.recordMetric(MetricType.ERROR_RATE, 1, {
      errorCode,
      severity,
    });
  }

  recordCacheOperation(operation: 'hit' | 'miss' | 'set', cacheType: string): void {
    this.recordMetric(MetricType.CACHE_HIT_RATE, operation === 'hit' ? 1 : 0, {
      operation,
      cacheType,
    });
  }

  recordActiveSession(sessionCount: number): void {
    this.recordMetric(MetricType.ACTIVE_SESSIONS, sessionCount);
  }

  recordPageLoadTime(pageName: string, duration: number): void {
    this.recordMetric(MetricType.PAGE_LOAD_TIME, duration, {
      page: pageName,
    });
  }

  async measureAsync<T>(
    name: string,
    fn: () => Promise<T>,
    metricType: MetricType = MetricType.DB_QUERY_DURATION
  ): Promise<T> {
    const startTime = performance.now();
    try {
      const result = await fn();
      const duration = performance.now() - startTime;
      this.recordMetric(metricType, duration, { operation: name });
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      this.recordMetric(metricType, duration, { operation: name, error: 'true' });
      throw error;
    }
  }

  getAggregatedMetrics(type: MetricType, since: Date): {
    avg: number;
    min: number;
    max: number;
    count: number;
    p95: number;
  } {
    const filtered = this.metrics.filter(
      (m) => m.type === type && m.timestamp >= since
    );

    if (filtered.length === 0) {
      return { avg: 0, min: 0, max: 0, count: 0, p95: 0 };
    }

    const values = filtered.map((m) => m.value).sort((a, b) => a - b);
    const sum = values.reduce((a, b) => a + b, 0);
    const p95Index = Math.floor(values.length * 0.95);

    return {
      avg: sum / values.length,
      min: values[0],
      max: values[values.length - 1],
      count: values.length,
      p95: values[p95Index] || values[values.length - 1],
    };
  }

  private async flush(): Promise<void> {
    if (this.metrics.length === 0) return;

    const metricsToSend = [...this.metrics];
    this.metrics = [];

    try {
      await this.sendToSupabase(metricsToSend);
    } catch (error) {
      logger.error('Failed to flush metrics', error as Error, {
        metricsCount: metricsToSend.length,
      });
      this.metrics.unshift(...metricsToSend);
    }
  }

  private async sendToSupabase(metrics: Metric[]): Promise<void> {
    const aggregated = this.aggregateMetrics(metrics);

    const { error } = await supabase.from('system_metrics').insert(
      aggregated.map((m) => ({
        metric_type: m.type,
        metric_value: m.value,
        tags: m.tags,
        user_id: m.userId,
        session_id: m.sessionId,
        timestamp: m.timestamp.toISOString(),
      }))
    );

    if (error) {
      logger.warn('Failed to insert metrics to Supabase', { error: error.message });
    }
  }

  private aggregateMetrics(metrics: Metric[]): Metric[] {
    const grouped = new Map<string, Metric[]>();

    metrics.forEach((m) => {
      const key = `${m.type}_${JSON.stringify(m.tags || {})}`;
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(m);
    });

    const aggregated: Metric[] = [];
    grouped.forEach((group, key) => {
      if (group.length === 1) {
        aggregated.push(group[0]);
      } else {
        const values = group.map((m) => m.value);
        const avg = values.reduce((a, b) => a + b, 0) / values.length;
        aggregated.push({
          ...group[0],
          value: avg,
          timestamp: group[group.length - 1].timestamp,
        });
      }
    });

    return aggregated;
  }

  private startAutoFlush(): void {
    this.flushInterval = setInterval(() => {
      this.flush();
    }, this.FLUSH_INTERVAL_MS);
  }

  private getCurrentUserId(): string | undefined {
    try {
      const authData = localStorage.getItem('chiroflow-auth');
      if (authData) {
        const parsed = JSON.parse(authData);
        return parsed?.user?.id;
      }
    } catch {
      return undefined;
    }
    return undefined;
  }

  private getSessionId(): string {
    let sessionId = sessionStorage.getItem('session_id');
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      sessionStorage.setItem('session_id', sessionId);
    }
    return sessionId;
  }

  destroy(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }
    this.flush();
  }
}

export const metricsService = MetricsService.getInstance();

export function withMetrics<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  operationName: string,
  metricType: MetricType = MetricType.DB_QUERY_DURATION
): T {
  return (async (...args: any[]) => {
    return metricsService.measureAsync(operationName, () => fn(...args), metricType);
  }) as T;
}
