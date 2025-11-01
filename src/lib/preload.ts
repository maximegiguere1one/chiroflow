import { supabase } from './supabase';

const CACHE_TTL = 5 * 60 * 1000;
const cache = new Map<string, { data: any; timestamp: number }>();

export async function preloadPatients(ownerId: string) {
  const cacheKey = `patients_${ownerId}`;
  const cached = cache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  const { data, error } = await supabase
    .from('contacts')
    .select('id, full_name, email, phone, status, created_at')
    .eq('owner_id', ownerId)
    .order('full_name', { ascending: true })
    .limit(100);

  if (!error && data) {
    cache.set(cacheKey, { data, timestamp: Date.now() });
  }

  return data;
}

export async function preloadAppointments(ownerId: string, date: string) {
  const cacheKey = `appointments_${ownerId}_${date}`;
  const cached = cache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  const { data, error } = await supabase
    .from('appointments')
    .select('id, contact_id, scheduled_at, status, reason')
    .eq('owner_id', ownerId)
    .eq('scheduled_date', date)
    .order('scheduled_at', { ascending: true });

  if (!error && data) {
    cache.set(cacheKey, { data, timestamp: Date.now() });
  }

  return data;
}

export async function preloadDashboardData(ownerId: string) {
  const today = new Date().toISOString().split('T')[0];

  return Promise.all([
    preloadPatients(ownerId),
    preloadAppointments(ownerId, today),
  ]);
}

export function invalidateCache(pattern?: string) {
  if (!pattern) {
    cache.clear();
    return;
  }

  const keys = Array.from(cache.keys());
  keys.forEach(key => {
    if (key.includes(pattern)) {
      cache.delete(key);
    }
  });
}

export function getCachedData<T>(key: string): T | null {
  const cached = cache.get(key);

  if (!cached) return null;

  if (Date.now() - cached.timestamp > CACHE_TTL) {
    cache.delete(key);
    return null;
  }

  return cached.data as T;
}

export function setCachedData<T>(key: string, data: T): void {
  cache.set(key, {
    data,
    timestamp: Date.now(),
  });
}

export const prefetchStrategies = {
  onHover: (callback: () => Promise<any>) => {
    let timeout: NodeJS.Timeout;
    return {
      onMouseEnter: () => {
        timeout = setTimeout(callback, 100);
      },
      onMouseLeave: () => {
        clearTimeout(timeout);
      },
    };
  },

  onVisible: (callback: () => Promise<any>) => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            callback();
            observer.disconnect();
          }
        });
      },
      { threshold: 0.1 }
    );

    return observer;
  },
};
