import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { supabase } from '../../lib/supabase';

interface Appointment {
  id: string;
  contact_id: string | null;
  patient_id: string | null;
  name: string;
  email: string;
  phone: string;
  reason: string;
  status: string;
  scheduled_at: string | null;
  scheduled_date: string | null;
  scheduled_time: string | null;
  duration_minutes: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface AppointmentState {
  appointments: Appointment[];
  todayAppointments: Appointment[];
  loading: boolean;
  error: Error | null;
  selectedDate: Date;
}

interface AppointmentActions {
  loadAppointments: (startDate?: string, endDate?: string) => Promise<void>;
  loadTodayAppointments: () => Promise<void>;
  createAppointment: (appointment: Partial<Appointment>) => Promise<Appointment>;
  updateAppointment: (id: string, updates: Partial<Appointment>) => Promise<Appointment>;
  deleteAppointment: (id: string) => Promise<void>;
  setSelectedDate: (date: Date) => void;
  refresh: () => Promise<void>;
}

type AppointmentStore = AppointmentState & AppointmentActions;

const initialState: AppointmentState = {
  appointments: [],
  todayAppointments: [],
  loading: false,
  error: null,
  selectedDate: new Date(),
};

export const useAppointmentStore = create<AppointmentStore>()(
  devtools(
    immer((set, get) => ({
      ...initialState,

      loadAppointments: async (startDate?: string, endDate?: string) => {
        set((state) => {
          state.loading = true;
          state.error = null;
        });

        try {
          let query = supabase
            .from('appointments_api')
            .select('*')
            .order('scheduled_at', { ascending: true });

          if (startDate) {
            query = query.gte('scheduled_at', startDate);
          }
          if (endDate) {
            query = query.lte('scheduled_at', endDate);
          }

          const { data, error } = await query;

          if (error) throw error;

          set((state) => {
            state.appointments = data || [];
            state.loading = false;
          });
        } catch (error) {
          set((state) => {
            state.error = error as Error;
            state.loading = false;
          });
        }
      },

      loadTodayAppointments: async () => {
        set((state) => {
          state.loading = true;
          state.error = null;
        });

        try {
          const today = new Date().toISOString().split('T')[0];
          const { data, error } = await supabase
            .from('appointments_api')
            .select('*')
            .eq('scheduled_date', today)
            .order('scheduled_time', { ascending: true });

          if (error) throw error;

          set((state) => {
            state.todayAppointments = data || [];
            state.loading = false;
          });
        } catch (error) {
          set((state) => {
            state.error = error as Error;
            state.loading = false;
          });
        }
      },

      createAppointment: async (appointment: Partial<Appointment>) => {
        set((state) => {
          state.loading = true;
          state.error = null;
        });

        try {
          const { data, error } = await supabase
            .from('appointments_api')
            .insert(appointment)
            .select()
            .single();

          if (error) throw error;

          set((state) => {
            state.appointments = [...state.appointments, data];
            state.loading = false;
          });

          return data;
        } catch (error) {
          set((state) => {
            state.error = error as Error;
            state.loading = false;
          });
          throw error;
        }
      },

      updateAppointment: async (id: string, updates: Partial<Appointment>) => {
        set((state) => {
          state.loading = true;
          state.error = null;
        });

        try {
          const { data, error } = await supabase
            .from('appointments_api')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

          if (error) throw error;

          set((state) => {
            const index = state.appointments.findIndex((a) => a.id === id);
            if (index !== -1) {
              state.appointments[index] = data;
            }
            state.loading = false;
          });

          return data;
        } catch (error) {
          set((state) => {
            state.error = error as Error;
            state.loading = false;
          });
          throw error;
        }
      },

      deleteAppointment: async (id: string) => {
        set((state) => {
          state.loading = true;
          state.error = null;
        });

        try {
          const { error } = await supabase
            .from('appointments_api')
            .delete()
            .eq('id', id);

          if (error) throw error;

          set((state) => {
            state.appointments = state.appointments.filter((a) => a.id !== id);
            state.todayAppointments = state.todayAppointments.filter((a) => a.id !== id);
            state.loading = false;
          });
        } catch (error) {
          set((state) => {
            state.error = error as Error;
            state.loading = false;
          });
          throw error;
        }
      },

      setSelectedDate: (date: Date) => {
        set((state) => {
          state.selectedDate = date;
        });
      },

      refresh: async () => {
        await Promise.all([
          get().loadAppointments(),
          get().loadTodayAppointments(),
        ]);
      },
    })),
    { name: 'AppointmentStore' }
  )
);
