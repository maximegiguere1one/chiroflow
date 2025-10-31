export class PerformanceMonitor {
  private static metrics: Map<string, number[]> = new Map();

  static startMeasure(label: string): () => void {
    const startTime = performance.now();

    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;

      if (!this.metrics.has(label)) {
        this.metrics.set(label, []);
      }

      this.metrics.get(label)!.push(duration);

      if (duration > 1000) {
        console.warn(`Slow operation detected: ${label} took ${duration.toFixed(2)}ms`);
      }
    };
  }

  static async measureAsync<T>(
    label: string,
    fn: () => Promise<T>
  ): Promise<T> {
    const end = this.startMeasure(label);
    try {
      return await fn();
    } finally {
      end();
    }
  }

  static getMetrics(label?: string) {
    if (label) {
      const measurements = this.metrics.get(label) || [];
      if (measurements.length === 0) return null;

      return {
        count: measurements.length,
        avg: measurements.reduce((a, b) => a + b, 0) / measurements.length,
        min: Math.min(...measurements),
        max: Math.max(...measurements),
        p95: this.percentile(measurements, 95),
        p99: this.percentile(measurements, 99),
      };
    }

    const allMetrics: Record<string, any> = {};
    for (const [key, values] of this.metrics.entries()) {
      allMetrics[key] = this.getMetrics(key);
    }
    return allMetrics;
  }

  private static percentile(arr: number[], p: number): number {
    const sorted = [...arr].sort((a, b) => a - b);
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[index];
  }

  static reportWebVitals() {
    if ('web-vital' in window) {
      return;
    }

    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            console.log(`[Web Vital] ${entry.name}:`, entry);
          }
        });

        observer.observe({ entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift'] });
      } catch (e) {
        console.error('Failed to observe web vitals:', e);
      }
    }
  }

  static trackNavigation() {
    if (typeof window !== 'undefined' && 'PerformanceNavigationTiming' in window) {
      window.addEventListener('load', () => {
        const [navigation] = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
        if (navigation) {
          console.log('[Performance] Navigation Timing:', {
            dns: navigation.domainLookupEnd - navigation.domainLookupStart,
            tcp: navigation.connectEnd - navigation.connectStart,
            request: navigation.responseStart - navigation.requestStart,
            response: navigation.responseEnd - navigation.responseStart,
            dom: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
            load: navigation.loadEventEnd - navigation.loadEventStart,
          });
        }
      });
    }
  }
}
