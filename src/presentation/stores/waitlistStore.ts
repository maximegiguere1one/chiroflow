import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { supabase } from '../../lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface WaitlistEntry {
  id: string;
  contact_id: string | null;
  owner_id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  preferred_date: string | null;
  preferred_time: string | null;
  flexible: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'contacted' | 'scheduled' | 'cancelled' | 'expired';
  notes: string | null;
  waitlist_type: 'regular' | 'cancellation' | 'recall';
  service_type: string | null;
  expires_at: string | null;
  contacted_at: string | null;
  scheduled_at: string | null;
  created_at: string;
  updated_at: string;
}

interface RecallEntry {
  id: string;
  contact_id: string;
  owner_id: string;
  last_visit_date: string;
  recommended_interval_days: number;
  next_recommended_date: string;
  status: 'pending' | 'reminded' | 'scheduled' | 'completed' | 'inactive';
  reminder_count: number;
  last_reminder_sent: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface WaitlistState {
  regularWaitlist: WaitlistEntry[];
  cancellationWaitlist: WaitlistEntry[];
  recallWaitlist: RecallEntry[];
  loading: boolean;
  error: Error | null;
  filters: {
    status?: string;
    priority?: string;
    dateFrom?: string;
    dateTo?: string;
  };
  stats: {
    totalPending: number;
    highPriority: number;
    contacted: number;
    scheduled: number;
  };
  realtimeChannel: RealtimeChannel | null;
  isRealtimeActive: boolean;
}

interface WaitlistActions {
  loadRegularWaitlist: () => Promise<void>;
  loadCancellationWaitlist: () => Promise<void>;
  loadRecallWaitlist: () => Promise<void>;
  loadAllWaitlists: () => Promise<void>;
  addToWaitlist: (entry: Partial<WaitlistEntry>) => Promise<WaitlistEntry>;
  addToRecall: (entry: Partial<RecallEntry>) => Promise<RecallEntry>;
  updateWaitlistEntry: (id: string, updates: Partial<WaitlistEntry>) => Promise<WaitlistEntry>;
  updateRecallEntry: (id: string, updates: Partial<RecallEntry>) => Promise<RecallEntry>;
  removeFromWaitlist: (id: string) => Promise<void>;
  removeFromRecall: (id: string) => Promise<void>;
  markAsContacted: (id: string) => Promise<void>;
  markAsScheduled: (id: string) => Promise<void>;
  notifyNextInLine: (slotDate: string, slotTime: string) => Promise<void>;
  setFilters: (filters: WaitlistState['filters']) => void;
  calculateStats: () => void;
  refresh: () => Promise<void>;
  enableRealtime: () => void;
  disableRealtime: () => void;
  reset: () => void;
}

type WaitlistStore = WaitlistState & WaitlistActions;

const initialState: WaitlistState = {
  regularWaitlist: [],
  cancellationWaitlist: [],
  recallWaitlist: [],
  loading: false,
  error: null,
  filters: {},
  stats: {
    totalPending: 0,
    highPriority: 0,
    contacted: 0,
    scheduled: 0,
  },
  realtimeChannel: null,
  isRealtimeActive: false,
};

export const useWaitlistStore = create<WaitlistStore>()(
  devtools(
    immer((set, get) => ({
      ...initialState,

      loadRegularWaitlist: async () => {
        set((state) => {
          state.loading = true;
          state.error = null;
        });

        try {
          let query = supabase
            .from('waitlist')
            .select('*')
            .eq('waitlist_type', 'regular')
            .order('priority', { ascending: false })
            .order('created_at', { ascending: true });

          const { filters } = get();

          if (filters.status) {
            query = query.eq('status', filters.status);
          } else {
            query = query.in('status', ['pending', 'contacted']);
          }

          if (filters.priority) {
            query = query.eq('priority', filters.priority);
          }

          const { data, error } = await query;

          if (error) throw error;

          set((state) => {
            state.regularWaitlist = data || [];
            state.loading = false;
          });

          get().calculateStats();
        } catch (error) {
          set((state) => {
            state.error = error as Error;
            state.loading = false;
          });
        }
      },

      loadCancellationWaitlist: async () => {
        try {
          let query = supabase
            .from('waitlist')
            .select('*')
            .eq('waitlist_type', 'cancellation')
            .order('priority', { ascending: false })
            .order('created_at', { ascending: true });

          const { filters } = get();

          if (filters.status) {
            query = query.eq('status', filters.status);
          } else {
            query = query.in('status', ['pending', 'contacted']);
          }

          const { data, error } = await query;

          if (error) throw error;

          set((state) => {
            state.cancellationWaitlist = data || [];
          });
        } catch (error) {
          set((state) => {
            state.error = error as Error;
          });
        }
      },

      loadRecallWaitlist: async () => {
        try {
          const { data, error } = await supabase
            .from('recall_waitlist')
            .select('*')
            .in('status', ['pending', 'reminded'])
            .order('next_recommended_date', { ascending: true });

          if (error) throw error;

          set((state) => {
            state.recallWaitlist = data || [];
          });
        } catch (error) {
          set((state) => {
            state.error = error as Error;
          });
        }
      },

      loadAllWaitlists: async () => {
        set((state) => {
          state.loading = true;
        });

        await Promise.all([
          get().loadRegularWaitlist(),
          get().loadCancellationWaitlist(),
          get().loadRecallWaitlist(),
        ]);

        set((state) => {
          state.loading = false;
        });
      },

      addToWaitlist: async (entry: Partial<WaitlistEntry>) => {
        try {
          const entryData = {
            ...entry,
            status: 'pending',
            waitlist_type: entry.waitlist_type || 'regular',
          };

          const { data, error } = await supabase
            .from('waitlist')
            .insert(entryData)
            .select()
            .single();

          if (error) throw error;

          set((state) => {
            if (data.waitlist_type === 'regular') {
              state.regularWaitlist = [...state.regularWaitlist, data];
            } else if (data.waitlist_type === 'cancellation') {
              state.cancellationWaitlist = [...state.cancellationWaitlist, data];
            }
          });

          get().calculateStats();
          return data;
        } catch (error) {
          set((state) => {
            state.error = error as Error;
          });
          throw error;
        }
      },

      addToRecall: async (entry: Partial<RecallEntry>) => {
        try {
          const entryData = {
            ...entry,
            status: 'pending',
            reminder_count: 0,
          };

          const { data, error } = await supabase
            .from('recall_waitlist')
            .insert(entryData)
            .select()
            .single();

          if (error) throw error;

          set((state) => {
            state.recallWaitlist = [...state.recallWaitlist, data];
          });

          return data;
        } catch (error) {
          set((state) => {
            state.error = error as Error;
          });
          throw error;
        }
      },

      updateWaitlistEntry: async (id: string, updates: Partial<WaitlistEntry>) => {
        try {
          const { data, error } = await supabase
            .from('waitlist')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

          if (error) throw error;

          set((state) => {
            const regularIndex = state.regularWaitlist.findIndex((e) => e.id === id);
            if (regularIndex !== -1) {
              state.regularWaitlist[regularIndex] = data;
            }

            const cancellationIndex = state.cancellationWaitlist.findIndex((e) => e.id === id);
            if (cancellationIndex !== -1) {
              state.cancellationWaitlist[cancellationIndex] = data;
            }
          });

          get().calculateStats();
          return data;
        } catch (error) {
          set((state) => {
            state.error = error as Error;
          });
          throw error;
        }
      },

      updateRecallEntry: async (id: string, updates: Partial<RecallEntry>) => {
        try {
          const { data, error } = await supabase
            .from('recall_waitlist')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

          if (error) throw error;

          set((state) => {
            const index = state.recallWaitlist.findIndex((e) => e.id === id);
            if (index !== -1) {
              state.recallWaitlist[index] = data;
            }
          });

          return data;
        } catch (error) {
          set((state) => {
            state.error = error as Error;
          });
          throw error;
        }
      },

      removeFromWaitlist: async (id: string) => {
        try {
          const { error } = await supabase.from('waitlist').delete().eq('id', id);

          if (error) throw error;

          set((state) => {
            state.regularWaitlist = state.regularWaitlist.filter((e) => e.id !== id);
            state.cancellationWaitlist = state.cancellationWaitlist.filter((e) => e.id !== id);
          });

          get().calculateStats();
        } catch (error) {
          set((state) => {
            state.error = error as Error;
          });
          throw error;
        }
      },

      removeFromRecall: async (id: string) => {
        try {
          const { error } = await supabase.from('recall_waitlist').delete().eq('id', id);

          if (error) throw error;

          set((state) => {
            state.recallWaitlist = state.recallWaitlist.filter((e) => e.id !== id);
          });
        } catch (error) {
          set((state) => {
            state.error = error as Error;
          });
          throw error;
        }
      },

      markAsContacted: async (id: string) => {
        await get().updateWaitlistEntry(id, {
          status: 'contacted',
          contacted_at: new Date().toISOString(),
        });
      },

      markAsScheduled: async (id: string) => {
        await get().updateWaitlistEntry(id, {
          status: 'scheduled',
          scheduled_at: new Date().toISOString(),
        });
      },

      notifyNextInLine: async (slotDate: string, slotTime: string) => {
        try {
          const { data, error } = await supabase.rpc('notify_recall_clients', {
            p_date: slotDate,
            p_time: slotTime,
          });

          if (error) throw error;

          await get().loadCancellationWaitlist();
          return data;
        } catch (error) {
          set((state) => {
            state.error = error as Error;
          });
          throw error;
        }
      },

      setFilters: (filters: WaitlistState['filters']) => {
        set((state) => {
          state.filters = { ...state.filters, ...filters };
        });
        get().loadAllWaitlists();
      },

      calculateStats: () => {
        const { regularWaitlist, cancellationWaitlist } = get();
        const allEntries = [...regularWaitlist, ...cancellationWaitlist];

        const totalPending = allEntries.filter((e) => e.status === 'pending').length;
        const highPriority = allEntries.filter(
          (e) => e.priority === 'high' || e.priority === 'urgent'
        ).length;
        const contacted = allEntries.filter((e) => e.status === 'contacted').length;
        const scheduled = allEntries.filter((e) => e.status === 'scheduled').length;

        set((state) => {
          state.stats = {
            totalPending,
            highPriority,
            contacted,
            scheduled,
          };
        });
      },

      refresh: async () => {
        await get().loadAllWaitlists();
      },

      enableRealtime: () => {
        const { realtimeChannel, isRealtimeActive } = get();

        if (isRealtimeActive && realtimeChannel) {
          console.log('Waitlist realtime already active');
          return;
        }

        if (realtimeChannel) {
          realtimeChannel.unsubscribe();
        }

        const channel = supabase
          .channel('waitlist-changes')
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'waitlist',
            },
            (payload) => {
              console.log('Realtime Waitlist INSERT:', payload);
              set((state) => {
                const newEntry = payload.new as WaitlistEntry;
                if (newEntry.waitlist_type === 'regular') {
                  state.regularWaitlist = [...state.regularWaitlist, newEntry];
                } else if (newEntry.waitlist_type === 'cancellation') {
                  state.cancellationWaitlist = [...state.cancellationWaitlist, newEntry];
                }
              });
              get().calculateStats();
            }
          )
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'waitlist',
            },
            (payload) => {
              console.log('Realtime Waitlist UPDATE:', payload);
              set((state) => {
                const updatedEntry = payload.new as WaitlistEntry;
                const regularIndex = state.regularWaitlist.findIndex(
                  (e) => e.id === updatedEntry.id
                );
                if (regularIndex !== -1) {
                  state.regularWaitlist[regularIndex] = updatedEntry;
                }

                const cancellationIndex = state.cancellationWaitlist.findIndex(
                  (e) => e.id === updatedEntry.id
                );
                if (cancellationIndex !== -1) {
                  state.cancellationWaitlist[cancellationIndex] = updatedEntry;
                }
              });
              get().calculateStats();
            }
          )
          .on(
            'postgres_changes',
            {
              event: 'DELETE',
              schema: 'public',
              table: 'waitlist',
            },
            (payload) => {
              console.log('Realtime Waitlist DELETE:', payload);
              set((state) => {
                const deletedId = (payload.old as any).id;
                state.regularWaitlist = state.regularWaitlist.filter((e) => e.id !== deletedId);
                state.cancellationWaitlist = state.cancellationWaitlist.filter(
                  (e) => e.id !== deletedId
                );
              });
              get().calculateStats();
            }
          )
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'recall_waitlist',
            },
            () => {
              get().loadRecallWaitlist();
            }
          )
          .subscribe((status) => {
            console.log('Waitlist realtime subscription status:', status);
            if (status === 'SUBSCRIBED') {
              set((state) => {
                state.isRealtimeActive = true;
              });
            }
          });

        set((state) => {
          state.realtimeChannel = channel;
        });
      },

      disableRealtime: () => {
        const { realtimeChannel } = get();
        if (realtimeChannel) {
          realtimeChannel.unsubscribe();
          set((state) => {
            state.realtimeChannel = null;
            state.isRealtimeActive = false;
          });
        }
      },

      reset: () => {
        const { realtimeChannel } = get();
        if (realtimeChannel) {
          realtimeChannel.unsubscribe();
        }
        set(initialState);
      },
    })),
    { name: 'WaitlistStore' }
  )
);
