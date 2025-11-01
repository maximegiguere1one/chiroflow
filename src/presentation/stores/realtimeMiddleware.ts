import { StateCreator, StoreApi } from 'zustand';
import { supabase } from '../../lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface RealtimeConfig {
  table: string;
  schema?: string;
  onInsert?: (payload: any) => void;
  onUpdate?: (payload: any) => void;
  onDelete?: (payload: any) => void;
}

export const realtimeMiddleware = <T extends object>(
  config: StateCreator<T>,
  realtimeConfig: RealtimeConfig
) => {
  return (set: StoreApi<T>['setState'], get: StoreApi<T>['getState'], api: StoreApi<T>) => {
    let channel: RealtimeChannel | null = null;

    const setupRealtime = () => {
      channel = supabase
        .channel(`${realtimeConfig.table}-changes`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: realtimeConfig.schema || 'public',
            table: realtimeConfig.table,
          },
          (payload) => {
            if (realtimeConfig.onInsert) {
              realtimeConfig.onInsert(payload.new);
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: realtimeConfig.schema || 'public',
            table: realtimeConfig.table,
          },
          (payload) => {
            if (realtimeConfig.onUpdate) {
              realtimeConfig.onUpdate(payload.new);
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'DELETE',
            schema: realtimeConfig.schema || 'public',
            table: realtimeConfig.table,
          },
          (payload) => {
            if (realtimeConfig.onDelete) {
              realtimeConfig.onDelete(payload.old);
            }
          }
        )
        .subscribe();
    };

    setupRealtime();

    const originalDestroy = api.destroy;
    api.destroy = () => {
      if (channel) {
        channel.unsubscribe();
      }
      originalDestroy();
    };

    return config(set, get, api);
  };
};
