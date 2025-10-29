import { useState, useEffect, useCallback } from 'react';
import { cacheManager } from '../infrastructure/cache/CacheManager';

interface UseCacheOptions<T> {
  key: string;
  fetchFn: () => Promise<T>;
  ttl?: number;
  enabled?: boolean;
}

interface UseCacheReturn<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  invalidate: () => void;
}

export function useCache<T>({
  key,
  fetchFn,
  ttl,
  enabled = true,
}: UseCacheOptions<T>): UseCacheReturn<T> {
  const [data, setData] = useState<T | null>(() => cacheManager.get<T>(key));
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await fetchFn();
      setData(result);
      cacheManager.set(key, result, ttl);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [key, fetchFn, ttl]);

  const invalidate = useCallback(() => {
    cacheManager.delete(key);
    setData(null);
  }, [key]);

  useEffect(() => {
    if (!enabled) return;

    const cachedData = cacheManager.get<T>(key);
    if (cachedData !== null) {
      setData(cachedData);
    } else {
      fetchData();
    }
  }, [key, enabled, fetchData]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchData,
    invalidate,
  };
}
