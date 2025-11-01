import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { supabase } from '../../lib/supabase';

interface ClinicSettings {
  id?: string;
  clinic_name: string;
  clinic_address: string;
  clinic_phone: string;
  clinic_email: string;
  timezone: string;
  working_hours: Record<string, { start: string; end: string; enabled: boolean }>;
  appointment_duration: number;
  buffer_time: number;
  max_appointments_per_day: number;
}

interface BookingSettings {
  id?: string;
  enabled: boolean;
  require_phone: boolean;
  require_reason: boolean;
  show_availability_calendar: boolean;
  max_slots_per_day: number;
  booking_page_title: string;
  booking_page_description: string;
  success_message: string;
  advance_booking_days: number;
  min_booking_notice_hours: number;
  allow_cancellation: boolean;
  cancellation_hours_notice: number;
  allow_rescheduling: boolean;
  buffer_time_minutes: number;
  default_duration_minutes: number;
}

interface NotificationSettings {
  id?: string;
  email_enabled: boolean;
  sms_enabled: boolean;
  reminder_hours_before: number;
  confirmation_enabled: boolean;
  cancellation_notifications: boolean;
  admin_notifications: boolean;
}

interface BrandingSettings {
  id?: string;
  primary_color: string;
  logo_url: string;
  custom_css: string;
}

interface SettingsState {
  clinicSettings: ClinicSettings | null;
  bookingSettings: BookingSettings | null;
  notificationSettings: NotificationSettings | null;
  brandingSettings: BrandingSettings | null;
  loading: boolean;
  error: Error | null;
  initialized: boolean;
}

interface SettingsActions {
  loadAllSettings: () => Promise<void>;
  updateClinicSettings: (settings: Partial<ClinicSettings>) => Promise<void>;
  updateBookingSettings: (settings: Partial<BookingSettings>) => Promise<void>;
  updateNotificationSettings: (settings: Partial<NotificationSettings>) => Promise<void>;
  updateBrandingSettings: (settings: Partial<BrandingSettings>) => Promise<void>;
  reset: () => void;
}

type SettingsStore = SettingsState & SettingsActions;

const initialState: SettingsState = {
  clinicSettings: null,
  bookingSettings: null,
  notificationSettings: null,
  brandingSettings: null,
  loading: false,
  error: null,
  initialized: false,
};

export const useSettingsStore = create<SettingsStore>()(
  devtools(
    persist(
      immer((set, get) => ({
        ...initialState,

        loadAllSettings: async () => {
          set((state) => {
            state.loading = true;
            state.error = null;
          });

          try {
            const [clinicRes, bookingRes, notifRes, brandingRes] = await Promise.all([
              supabase.from('clinic_settings').select('*').maybeSingle(),
              supabase.from('booking_settings').select('*').maybeSingle(),
              supabase.from('notification_settings').select('*').maybeSingle(),
              supabase.from('branding_settings').select('*').maybeSingle(),
            ]);

            set((state) => {
              state.clinicSettings = clinicRes.data;
              state.bookingSettings = bookingRes.data;
              state.notificationSettings = notifRes.data;
              state.brandingSettings = brandingRes.data;
              state.loading = false;
              state.initialized = true;
            });
          } catch (error) {
            set((state) => {
              state.error = error as Error;
              state.loading = false;
            });
            throw error;
          }
        },

        updateClinicSettings: async (settings: Partial<ClinicSettings>) => {
          set((state) => {
            state.loading = true;
            state.error = null;
          });

          try {
            const currentSettings = get().clinicSettings;
            
            if (currentSettings?.id) {
              const { data, error } = await supabase
                .from('clinic_settings')
                .update(settings)
                .eq('id', currentSettings.id)
                .select()
                .single();

              if (error) throw error;

              set((state) => {
                state.clinicSettings = data;
                state.loading = false;
              });
            } else {
              const { data, error } = await supabase
                .from('clinic_settings')
                .insert(settings)
                .select()
                .single();

              if (error) throw error;

              set((state) => {
                state.clinicSettings = data;
                state.loading = false;
              });
            }
          } catch (error) {
            set((state) => {
              state.error = error as Error;
              state.loading = false;
            });
            throw error;
          }
        },

        updateBookingSettings: async (settings: Partial<BookingSettings>) => {
          set((state) => {
            state.loading = true;
            state.error = null;
          });

          try {
            const currentSettings = get().bookingSettings;
            
            if (currentSettings?.id) {
              const { data, error } = await supabase
                .from('booking_settings')
                .update(settings)
                .eq('id', currentSettings.id)
                .select()
                .single();

              if (error) throw error;

              set((state) => {
                state.bookingSettings = data;
                state.loading = false;
              });
            } else {
              const { data, error } = await supabase
                .from('booking_settings')
                .insert(settings)
                .select()
                .single();

              if (error) throw error;

              set((state) => {
                state.bookingSettings = data;
                state.loading = false;
              });
            }
          } catch (error) {
            set((state) => {
              state.error = error as Error;
              state.loading = false;
            });
            throw error;
          }
        },

        updateNotificationSettings: async (settings: Partial<NotificationSettings>) => {
          set((state) => {
            state.loading = true;
            state.error = null;
          });

          try {
            const currentSettings = get().notificationSettings;
            
            if (currentSettings?.id) {
              const { data, error } = await supabase
                .from('notification_settings')
                .update(settings)
                .eq('id', currentSettings.id)
                .select()
                .single();

              if (error) throw error;

              set((state) => {
                state.notificationSettings = data;
                state.loading = false;
              });
            } else {
              const { data, error } = await supabase
                .from('notification_settings')
                .insert(settings)
                .select()
                .single();

              if (error) throw error;

              set((state) => {
                state.notificationSettings = data;
                state.loading = false;
              });
            }
          } catch (error) {
            set((state) => {
              state.error = error as Error;
              state.loading = false;
            });
            throw error;
          }
        },

        updateBrandingSettings: async (settings: Partial<BrandingSettings>) => {
          set((state) => {
            state.loading = true;
            state.error = null;
          });

          try {
            const currentSettings = get().brandingSettings;
            
            if (currentSettings?.id) {
              const { data, error } = await supabase
                .from('branding_settings')
                .update(settings)
                .eq('id', currentSettings.id)
                .select()
                .single();

              if (error) throw error;

              set((state) => {
                state.brandingSettings = data;
                state.loading = false;
              });
            } else {
              const { data, error } = await supabase
                .from('branding_settings')
                .insert(settings)
                .select()
                .single();

              if (error) throw error;

              set((state) => {
                state.brandingSettings = data;
                state.loading = false;
              });
            }
          } catch (error) {
            set((state) => {
              state.error = error as Error;
              state.loading = false;
            });
            throw error;
          }
        },

        reset: () => {
          set(initialState);
        },
      })),
      {
        name: 'settings-store',
        partialize: (state) => ({
          clinicSettings: state.clinicSettings,
          bookingSettings: state.bookingSettings,
          notificationSettings: state.notificationSettings,
          brandingSettings: state.brandingSettings,
          initialized: state.initialized,
        }),
      }
    ),
    { name: 'SettingsStore' }
  )
);
