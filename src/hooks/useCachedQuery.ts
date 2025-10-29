import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { QueryCache } from '../lib/cache';
import { handleError } from '../lib/errorHandler';
import { performanceMonitor } from '../lib/performance';

interface UseCachedQueryOptions {
  cache: QueryCache;
  cacheKey: string;
  cacheTtl?: number;
  enabled?: boolean;
  refetchInterval?: number;
  onSuccess?: (data: any) => void;
  onError?: (error: string) => void;
}

interface UseCachedQueryResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: (forceRefresh?: boolean) => Promise<void>;
  invalidate: () => void;
}

export function useCachedQuery<T>(
  queryFn: () => Promise<{ data: T | null; error: any }>,
  options: UseCachedQueryOptions
): UseCachedQueryResult<T> {
  const {
    cache,
    cacheKey,
    cacheTtl,
    enabled = true,
    refetchInterval,
    onSuccess,
    onError,
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(
    async (forceRefresh = false) => {
      if (!enabled) return;

      setLoading(true);
      setError(null);

      try {
        const result = await performanceMonitor.measure(
          `query:${cacheKey}`,
          async () => {
            return cache.fetch(
              cacheKey,
              async () => {
                const { data: queryData, error: queryError } = await queryFn();

                if (queryError) {
                  throw queryError;
                }

                return queryData;
              },
              { ttl: cacheTtl, forceRefresh }
            );
          }
        );

        setData(result);
        onSuccess?.(result);
      } catch (err) {
        const { message } = handleError(err, { cacheKey });
        setError(message);
        onError?.(message);
      } finally {
        setLoading(false);
      }
    },
    [enabled, cache, cacheKey, cacheTtl, queryFn, onSuccess, onError]
  );

  const invalidate = useCallback(() => {
    cache.invalidate(cacheKey);
  }, [cache, cacheKey]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!refetchInterval || !enabled) return;

    const interval = setInterval(() => {
      fetchData(false);
    }, refetchInterval);

    return () => clearInterval(interval);
  }, [refetchInterval, enabled, fetchData]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    invalidate,
  };
}

export function useSupabaseQuery<T>(
  tableName: string,
  selectQuery: string,
  options: Omit<UseCachedQueryOptions, 'cacheKey'> & {
    cacheKey?: string;
    filters?: Array<{ column: string; operator: string; value: any }>;
    orderBy?: { column: string; ascending: boolean };
    limit?: number;
  }
) {
  const {
    cacheKey = `${tableName}:${selectQuery}`,
    filters,
    orderBy,
    limit,
    ...queryOptions
  } = options;

  const queryFn = useCallback(async () => {
    let query = supabase.from(tableName).select(selectQuery);

    if (filters) {
      filters.forEach(({ column, operator, value }) => {
        query = (query as any)[operator](column, value);
      });
    }

    if (orderBy) {
      query = query.order(orderBy.column, { ascending: orderBy.ascending });
    }

    if (limit) {
      query = query.limit(limit);
    }

    return query;
  }, [tableName, selectQuery, filters, orderBy, limit]);

  return useCachedQuery<T>(queryFn, {
    ...queryOptions,
    cacheKey,
  });
}

export function useSupabaseSingleQuery<T>(
  tableName: string,
  selectQuery: string,
  id: string,
  options: Omit<UseCachedQueryOptions, 'cacheKey'> & {
    cacheKey?: string;
  }
) {
  const { cacheKey = `${tableName}:${id}`, ...queryOptions } = options;

  const queryFn = useCallback(async () => {
    return supabase
      .from(tableName)
      .select(selectQuery)
      .eq('id', id)
      .maybeSingle();
  }, [tableName, selectQuery, id]);

  return useCachedQuery<T>(queryFn, {
    ...queryOptions,
    cacheKey,
  });
}
