import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface ClinicSettings {
  id: string;
  clinic_name: string;
  owner_name: string;
  owner_title: string;
  clinic_tagline: string;
  phone: string;
  email: string;
  website: string;
  street_address: string;
  suite_number: string;
  city: string;
  province: string;
  postal_code: string;
  country: string;
  facebook_url?: string;
  instagram_url?: string;
  linkedin_url?: string;
  timezone: string;
  language: string;
  currency: string;
}

export interface BrandingSettings {
  id: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  text_color: string;
  background_color: string;
  logo_url?: string;
  favicon_url?: string;
  hero_image_url?: string;
  heading_font: string;
  body_font: string;
}

export interface AppointmentSettings {
  id: string;
  default_duration_minutes: number;
  min_duration_minutes: number;
  max_duration_minutes: number;
  min_advance_booking_hours: number;
  max_advance_booking_days: number;
  cancellation_hours_notice: number;
  allow_online_booking: boolean;
  allow_online_cancellation: boolean;
  require_payment_upfront: boolean;
  send_reminder_24h: boolean;
  send_reminder_2h: boolean;
  send_confirmation_email: boolean;
  enable_waitlist: boolean;
  auto_fill_from_waitlist: boolean;
}

export interface ServiceType {
  id: string;
  name: string;
  description?: string;
  duration_minutes: number;
  price: number;
  is_active: boolean;
  allow_online_booking: boolean;
  requires_deposit: boolean;
  deposit_amount?: number;
  category: string;
  color: string;
  display_order: number;
}

export interface BusinessHours {
  id: string;
  day_of_week: number;
  day_name: string;
  is_open: boolean;
  open_time?: string;
  close_time?: string;
  break_start_time?: string;
  break_end_time?: string;
}

export interface BillingSettings {
  id: string;
  tax_rate: number;
  tax_name: string;
  include_tax_in_price: boolean;
  invoice_prefix: string;
  next_invoice_number: number;
  accept_cash: boolean;
  accept_credit_card: boolean;
  accept_debit: boolean;
  accept_insurance: boolean;
  payment_terms_days: number;
  late_fee_percentage: number;
  invoice_notes: string;
  receipt_footer: string;
}

export interface NotificationSettings {
  id: string;
  email_new_appointment: boolean;
  email_cancelled_appointment: boolean;
  email_payment_received: boolean;
  email_daily_summary: boolean;
  sms_enabled: boolean;
  sms_new_appointment: boolean;
  sms_reminder: boolean;
  daily_summary_time: string;
  notification_email?: string;
}

export interface AllSettings {
  clinic: ClinicSettings | null;
  branding: BrandingSettings | null;
  appointments: AppointmentSettings | null;
  services: ServiceType[];
  businessHours: BusinessHours[];
  billing: BillingSettings | null;
  notifications: NotificationSettings | null;
}

const defaultClinicSettings: Partial<ClinicSettings> = {
  clinic_name: 'Clinique Chiropratique Dre Janie Leblanc',
  owner_name: 'Dr. Janie Leblanc',
  owner_title: 'Chiropraticienne',
  clinic_tagline: 'Soins chiropratiques professionnels',
  phone: '(514) 555-0123',
  email: 'info@cliniquejanie.com',
  city: 'Montréal',
  province: 'QC',
  country: 'Canada',
  timezone: 'America/Toronto',
  language: 'fr',
  currency: 'CAD',
};

const defaultBrandingSettings: Partial<BrandingSettings> = {
  primary_color: '#C9A55C',
  secondary_color: '#1a1a1a',
  accent_color: '#d4b36a',
  text_color: '#333333',
  background_color: '#ffffff',
  heading_font: 'Inter',
  body_font: 'Inter',
};

export function useSettings() {
  const [settings, setSettings] = useState<AllSettings>({
    clinic: null,
    branding: null,
    appointments: null,
    services: [],
    businessHours: [],
    billing: null,
    notifications: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setSettings({
          clinic: defaultClinicSettings as ClinicSettings,
          branding: defaultBrandingSettings as BrandingSettings,
          appointments: null,
          services: [],
          businessHours: [],
          billing: null,
          notifications: null,
        });
        setLoading(false);
        return;
      }

      const [
        clinicResult,
        brandingResult,
        appointmentsResult,
        servicesResult,
        hoursResult,
        billingResult,
        notificationsResult,
      ] = await Promise.all([
        supabase.from('clinic_settings').select('*').eq('owner_id', user.id).maybeSingle(),
        supabase.from('branding_settings').select('*').eq('owner_id', user.id).maybeSingle(),
        supabase.from('appointment_settings').select('*').eq('owner_id', user.id).maybeSingle(),
        supabase.from('service_types').select('*').eq('owner_id', user.id).order('display_order'),
        supabase.from('business_hours').select('*').eq('owner_id', user.id).order('day_of_week'),
        supabase.from('billing_settings').select('*').eq('owner_id', user.id).maybeSingle(),
        supabase.from('notification_settings').select('*').eq('owner_id', user.id).maybeSingle(),
      ]);

      setSettings({
        clinic: clinicResult.data || (defaultClinicSettings as ClinicSettings),
        branding: brandingResult.data || (defaultBrandingSettings as BrandingSettings),
        appointments: appointmentsResult.data,
        services: servicesResult.data || [],
        businessHours: hoursResult.data || [],
        billing: billingResult.data,
        notifications: notificationsResult.data,
      });
    } catch (err) {
      console.error('Error loading settings:', err);
      setError(err instanceof Error ? err.message : 'Failed to load settings');

      setSettings({
        clinic: defaultClinicSettings as ClinicSettings,
        branding: defaultBrandingSettings as BrandingSettings,
        appointments: null,
        services: [],
        businessHours: [],
        billing: null,
        notifications: null,
      });
    } finally {
      setLoading(false);
    }
  }

  async function updateClinicSettings(updates: Partial<ClinicSettings>) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('clinic_settings')
      .upsert({ ...updates, owner_id: user.id })
      .select()
      .single();

    if (error) throw error;

    setSettings(prev => ({ ...prev, clinic: data }));
    return data;
  }

  async function updateBrandingSettings(updates: Partial<BrandingSettings>) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('branding_settings')
      .upsert({ ...updates, owner_id: user.id })
      .select()
      .single();

    if (error) throw error;

    setSettings(prev => ({ ...prev, branding: data }));
    return data;
  }

  async function updateAppointmentSettings(updates: Partial<AppointmentSettings>) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('appointment_settings')
      .upsert({ ...updates, owner_id: user.id })
      .select()
      .single();

    if (error) throw error;

    setSettings(prev => ({ ...prev, appointments: data }));
    return data;
  }

  async function updateBillingSettings(updates: Partial<BillingSettings>) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('billing_settings')
      .upsert({ ...updates, owner_id: user.id })
      .select()
      .single();

    if (error) throw error;

    setSettings(prev => ({ ...prev, billing: data }));
    return data;
  }

  async function updateNotificationSettings(updates: Partial<NotificationSettings>) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('notification_settings')
      .upsert({ ...updates, owner_id: user.id })
      .select()
      .single();

    if (error) throw error;

    setSettings(prev => ({ ...prev, notifications: data }));
    return data;
  }

  async function createService(service: Omit<ServiceType, 'id' | 'created_at' | 'updated_at'>) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('service_types')
      .insert({ ...service, owner_id: user.id })
      .select()
      .single();

    if (error) throw error;

    setSettings(prev => ({
      ...prev,
      services: [...prev.services, data].sort((a, b) => a.display_order - b.display_order)
    }));
    return data;
  }

  async function updateService(id: string, updates: Partial<ServiceType>) {
    const { error } = await supabase
      .from('service_types')
      .update(updates)
      .eq('id', id);

    if (error) throw error;

    setSettings(prev => ({
      ...prev,
      services: prev.services.map(s => s.id === id ? { ...s, ...updates } : s)
    }));
  }

  async function deleteService(id: string) {
    const { error } = await supabase
      .from('service_types')
      .delete()
      .eq('id', id);

    if (error) throw error;

    setSettings(prev => ({
      ...prev,
      services: prev.services.filter(s => s.id !== id)
    }));
  }

  async function updateBusinessHours(hours: BusinessHours[]) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('business_hours')
      .upsert(hours.map(h => ({ ...h, owner_id: user.id })));

    if (error) throw error;

    await loadSettings();
  }

  return {
    settings,
    loading,
    error,
    updateClinicSettings,
    updateBrandingSettings,
    updateAppointmentSettings,
    updateBillingSettings,
    updateNotificationSettings,
    createService,
    updateService,
    deleteService,
    updateBusinessHours,
    refresh: loadSettings,
  };
}
