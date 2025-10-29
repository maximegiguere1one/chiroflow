import { logger } from './Logger';

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

interface PerformanceThresholds {
  fcp: number; // First Contentful Paint
  lcp: number; // Largest Contentful Paint
  fid: number; // First Input Delay
  cls: number; // Cumulative Layout Shift
  ttfb: number; // Time to First Byte
}

const DEFAULT_THRESHOLDS: PerformanceThresholds = {
  fcp: 1800,
  lcp: 2500,
  fid: 100,
  cls: 0.1,
  ttfb: 600,
};

export class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private thresholds: PerformanceThresholds;
  private observers: PerformanceObserver[] = [];

  constructor(thresholds: Partial<PerformanceThresholds> = {}) {
    this.thresholds = { ...DEFAULT_THRESHOLDS, ...thresholds };
    this.initialize();
  }

  private initialize(): void {
    if (typeof window === 'undefined') return;

    this.observeWebVitals();
    this.observeResourceTiming();
    this.observeNavigationTiming();
  }

  private observeWebVitals(): void {
    if ('PerformanceObserver' in window) {
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1] as any;
          this.recordMetric('LCP', lastEntry.renderTime || lastEntry.loadTime);
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        this.observers.push(lcpObserver);

        const fidObserver = new PerformanceObserver((list) => {
          const firstInput = list.getEntries()[0] as any;
          this.recordMetric('FID', firstInput.processingStart - firstInput.startTime);
        });
        fidObserver.observe({ entryTypes: ['first-input'] });
        this.observers.push(fidObserver);

        const clsObserver = new PerformanceObserver((list) => {
          let clsScore = 0;
          for (const entry of list.getEntries() as any[]) {
            if (!entry.hadRecentInput) {
              clsScore += entry.value;
            }
          }
          this.recordMetric('CLS', clsScore);
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
        this.observers.push(clsObserver);
      } catch (error) {
        logger.warn('PerformanceObserver not fully supported', { error });
      }
    }
  }

  private observeResourceTiming(): void {
    if ('PerformanceObserver' in window) {
      try {
        const resourceObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            const resource = entry as PerformanceResourceTiming;
            if (resource.duration > 1000) {
              logger.warn('Slow resource detected', {
                name: resource.name,
                duration: resource.duration,
                size: resource.transferSize,
              });
            }
          }
        });
        resourceObserver.observe({ entryTypes: ['resource'] });
        this.observers.push(resourceObserver);
      } catch (error) {
        logger.warn('Resource timing observation failed', { error });
      }
    }
  }

  private observeNavigationTiming(): void {
    if (typeof window !== 'undefined' && window.performance) {
      window.addEventListener('load', () => {
        setTimeout(() => {
          const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
          if (navigation) {
            this.recordMetric('TTFB', navigation.responseStart - navigation.requestStart);
            this.recordMetric('DOMContentLoaded', navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart);
            this.recordMetric('LoadComplete', navigation.loadEventEnd - navigation.loadEventStart);
          }
        }, 0);
      });
    }
  }

  recordMetric(name: string, value: number, metadata?: Record<string, any>): void {
    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: Date.now(),
      metadata,
    };

    this.metrics.push(metric);

    this.checkThreshold(metric);

    logger.info('Performance metric recorded', {
      name,
      value: Math.round(value * 100) / 100,
      ...metadata,
    });
  }

  private checkThreshold(metric: PerformanceMetric): void {
    const thresholdKey = metric.name.toLowerCase() as keyof PerformanceThresholds;
    const threshold = this.thresholds[thresholdKey];

    if (threshold && metric.value > threshold) {
      logger.warn('Performance threshold exceeded', {
        metric: metric.name,
        value: metric.value,
        threshold,
        percentage: Math.round((metric.value / threshold) * 100),
      });
    }
  }

  measureFunction<T>(name: string, fn: () => T): T {
    const start = performance.now();
    try {
      return fn();
    } finally {
      const duration = performance.now() - start;
      this.recordMetric(`Function: ${name}`, duration);
    }
  }

  async measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now();
    try {
      return await fn();
    } finally {
      const duration = performance.now() - start;
      this.recordMetric(`Async: ${name}`, duration);
    }
  }

  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  getMetricsSummary(): Record<string, { avg: number; min: number; max: number; count: number }> {
    const summary: Record<string, { values: number[] }> = {};

    for (const metric of this.metrics) {
      if (!summary[metric.name]) {
        summary[metric.name] = { values: [] };
      }
      summary[metric.name].values.push(metric.value);
    }

    const result: Record<string, { avg: number; min: number; max: number; count: number }> = {};

    for (const [name, data] of Object.entries(summary)) {
      const values = data.values;
      result[name] = {
        avg: values.reduce((a, b) => a + b, 0) / values.length,
        min: Math.min(...values),
        max: Math.max(...values),
        count: values.length,
      };
    }

    return result;
  }

  clearMetrics(): void {
    this.metrics = [];
    logger.info('Performance metrics cleared');
  }

  dispose(): void {
    for (const observer of this.observers) {
      observer.disconnect();
    }
    this.observers = [];
    this.clearMetrics();
  }
}

export const performanceMonitor = new PerformanceMonitor();
