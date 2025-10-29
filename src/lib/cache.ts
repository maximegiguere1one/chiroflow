interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

interface CacheOptions {
  ttl?: number;
  maxSize?: number;
  strategy?: 'lru' | 'fifo';
}

class Cache<T = any> {
  private cache = new Map<string, CacheEntry<T>>();
  private accessOrder: string[] = [];
  private options: Required<CacheOptions>;

  constructor(options: CacheOptions = {}) {
    this.options = {
      ttl: options.ttl || 5 * 60 * 1000,
      maxSize: options.maxSize || 100,
      strategy: options.strategy || 'lru',
    };
  }

  set(key: string, data: T, customTtl?: number): void {
    const ttl = customTtl || this.options.ttl;
    const timestamp = Date.now();

    this.cache.set(key, {
      data,
      timestamp,
      expiresAt: timestamp + ttl,
    });

    this.updateAccessOrder(key);
    this.enforceMaxSize();
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.delete(key);
      return null;
    }

    if (this.options.strategy === 'lru') {
      this.updateAccessOrder(key);
    }

    return entry.data;
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);

    if (!entry) {
      return false;
    }

    if (Date.now() > entry.expiresAt) {
      this.delete(key);
      return false;
    }

    return true;
  }

  delete(key: string): boolean {
    this.accessOrder = this.accessOrder.filter(k => k !== key);
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
    this.accessOrder = [];
  }

  size(): number {
    return this.cache.size;
  }

  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  private updateAccessOrder(key: string): void {
    this.accessOrder = this.accessOrder.filter(k => k !== key);
    this.accessOrder.push(key);
  }

  private enforceMaxSize(): void {
    while (this.cache.size > this.options.maxSize) {
      const keyToRemove = this.accessOrder.shift();
      if (keyToRemove) {
        this.cache.delete(keyToRemove);
      }
    }
  }

  cleanupExpired(): number {
    const now = Date.now();
    let removed = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.delete(key);
        removed++;
      }
    }

    return removed;
  }

  getStats() {
    const now = Date.now();
    let expired = 0;
    let valid = 0;

    for (const entry of this.cache.values()) {
      if (now > entry.expiresAt) {
        expired++;
      } else {
        valid++;
      }
    }

    return {
      size: this.cache.size,
      valid,
      expired,
      maxSize: this.options.maxSize,
      ttl: this.options.ttl,
      strategy: this.options.strategy,
    };
  }
}

class QueryCache {
  private cache: Cache;
  private pendingRequests = new Map<string, Promise<any>>();

  constructor(options: CacheOptions = {}) {
    this.cache = new Cache({
      ttl: 5 * 60 * 1000,
      maxSize: 50,
      ...options,
    });

    setInterval(() => {
      this.cache.cleanupExpired();
    }, 60 * 1000);
  }

  async fetch<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: { ttl?: number; forceRefresh?: boolean } = {}
  ): Promise<T> {
    if (!options.forceRefresh) {
      const cached = this.cache.get(key);
      if (cached !== null) {
        return cached as T;
      }
    }

    const pending = this.pendingRequests.get(key);
    if (pending) {
      return pending as Promise<T>;
    }

    const promise = fetcher()
      .then(data => {
        this.cache.set(key, data, options.ttl);
        this.pendingRequests.delete(key);
        return data;
      })
      .catch(error => {
        this.pendingRequests.delete(key);
        throw error;
      });

    this.pendingRequests.set(key, promise);
    return promise;
  }

  invalidate(keyOrPattern: string | RegExp): number {
    let invalidated = 0;

    if (typeof keyOrPattern === 'string') {
      if (this.cache.delete(keyOrPattern)) {
        invalidated = 1;
      }
    } else {
      const keys = this.cache.keys();
      for (const key of keys) {
        if (keyOrPattern.test(key)) {
          this.cache.delete(key);
          invalidated++;
        }
      }
    }

    return invalidated;
  }

  clear(): void {
    this.cache.clear();
    this.pendingRequests.clear();
  }

  getStats() {
    return {
      ...this.cache.getStats(),
      pendingRequests: this.pendingRequests.size,
    };
  }
}

export const patientsCache = new QueryCache({
  ttl: 2 * 60 * 1000,
  maxSize: 30,
});

export const appointmentsCache = new QueryCache({
  ttl: 1 * 60 * 1000,
  maxSize: 50,
});

export const settingsCache = new QueryCache({
  ttl: 10 * 60 * 1000,
  maxSize: 10,
});

export const analyticsCache = new QueryCache({
  ttl: 5 * 60 * 1000,
  maxSize: 20,
});

export function createCachedFetch<T>(
  cache: QueryCache,
  keyPrefix: string
) {
  return async (
    key: string,
    fetcher: () => Promise<T>,
    options?: { ttl?: number; forceRefresh?: boolean }
  ): Promise<T> => {
    return cache.fetch(`${keyPrefix}:${key}`, fetcher, options);
  };
}

export function invalidatePattern(pattern: RegExp): void {
  patientsCache.invalidate(pattern);
  appointmentsCache.invalidate(pattern);
  settingsCache.invalidate(pattern);
  analyticsCache.invalidate(pattern);
}

export function clearAllCaches(): void {
  patientsCache.clear();
  appointmentsCache.clear();
  settingsCache.clear();
  analyticsCache.clear();
}

export function getAllCacheStats() {
  return {
    patients: patientsCache.getStats(),
    appointments: appointmentsCache.getStats(),
    settings: settingsCache.getStats(),
    analytics: analyticsCache.getStats(),
  };
}
