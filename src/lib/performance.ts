interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: Date;
  metadata?: Record<string, any>;
}

class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: PerformanceMetric[] = [];
  private marks = new Map<string, number>();

  private constructor() {}

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  startMark(name: string): void {
    this.marks.set(name, performance.now());
  }

  endMark(name: string, metadata?: Record<string, any>): number | null {
    const startTime = this.marks.get(name);
    if (!startTime) {
      console.warn(`No start mark found for: ${name}`);
      return null;
    }

    const duration = performance.now() - startTime;
    this.marks.delete(name);

    this.metrics.push({
      name,
      duration,
      timestamp: new Date(),
      metadata,
    });

    if (import.meta.env.DEV) {
      console.log(`⏱️ ${name}: ${duration.toFixed(2)}ms`, metadata || '');
    }

    if (duration > 3000) {
      console.warn(`⚠️ Slow operation detected: ${name} took ${duration.toFixed(2)}ms`);
    }

    return duration;
  }

  async measure<T>(
    name: string,
    fn: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> {
    this.startMark(name);
    try {
      return await fn();
    } finally {
      this.endMark(name, metadata);
    }
  }

  getMetrics(filterName?: string): PerformanceMetric[] {
    if (filterName) {
      return this.metrics.filter(m => m.name.includes(filterName));
    }
    return [...this.metrics];
  }

  getAverageTime(name: string): number | null {
    const filtered = this.metrics.filter(m => m.name === name);
    if (filtered.length === 0) return null;

    const sum = filtered.reduce((acc, m) => acc + m.duration, 0);
    return sum / filtered.length;
  }

  clearMetrics(): void {
    this.metrics = [];
  }

  exportMetrics(): string {
    return JSON.stringify(this.metrics, null, 2);
  }
}

export const performanceMonitor = PerformanceMonitor.getInstance();

export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delayMs: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delayMs);
  };
}

export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  limitMs: number
): (...args: Parameters<T>) => void {
  let lastRun = 0;
  let timeoutId: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    const now = Date.now();

    if (now - lastRun >= limitMs) {
      fn(...args);
      lastRun = now;
    } else {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        fn(...args);
        lastRun = Date.now();
      }, limitMs - (now - lastRun));
    }
  };
}

export function memoize<T extends (...args: any[]) => any>(
  fn: T,
  options: {
    maxSize?: number;
    ttlMs?: number;
    keyFn?: (...args: Parameters<T>) => string;
  } = {}
): T {
  const { maxSize = 100, ttlMs, keyFn = (...args) => JSON.stringify(args) } = options;

  const cache = new Map<string, { value: ReturnType<T>; timestamp: number }>();

  return ((...args: Parameters<T>) => {
    const key = keyFn(...args);
    const cached = cache.get(key);

    if (cached) {
      if (!ttlMs || Date.now() - cached.timestamp < ttlMs) {
        return cached.value;
      }
      cache.delete(key);
    }

    const value = fn(...args);
    cache.set(key, { value, timestamp: Date.now() });

    if (cache.size > maxSize) {
      const firstKey = cache.keys().next().value;
      if (firstKey !== undefined) {
        cache.delete(firstKey);
      }
    }

    return value;
  }) as T;
}

export class LazyLoader<T> {
  private promise: Promise<T> | null = null;
  private value: T | null = null;
  private loaded = false;

  constructor(private loader: () => Promise<T>) {}

  async load(): Promise<T> {
    if (this.loaded && this.value !== null) {
      return this.value;
    }

    if (this.promise) {
      return this.promise;
    }

    this.promise = this.loader();
    this.value = await this.promise;
    this.loaded = true;
    this.promise = null;

    return this.value;
  }

  isLoaded(): boolean {
    return this.loaded;
  }

  reset(): void {
    this.promise = null;
    this.value = null;
    this.loaded = false;
  }
}

export function createIntersectionObserver(
  callback: (entry: IntersectionObserverEntry) => void,
  options?: IntersectionObserverInit
): IntersectionObserver {
  return new IntersectionObserver((entries) => {
    entries.forEach(callback);
  }, options);
}
