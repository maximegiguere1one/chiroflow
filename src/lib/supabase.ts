import { createClient } from '@supabase/supabase-js';
import { env } from './env';

export const supabase = createClient(env.supabaseUrl, env.supabaseAnonKey, {
  auth: {
    persistSession: true,
    storageKey: 'chiroflow-auth',
    storage: window.localStorage,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

export interface AppointmentData {
  name: string;
  email: string;
  phone: string;
  reason: string;
  patient_age?: string;
  preferred_time?: string;
}

export interface WaitlistData {
  name: string;
  email: string;
  phone: string;
  reason: string;
  patient_age?: string;
  preferred_time?: string;
}

export interface ContactData {
  name: string;
  email: string;
  phone?: string;
  message: string;
}

export const submitAppointment = async (data: AppointmentData) => {
  const { error } = await supabase
    .from('appointments_api')
    .insert([data]);

  if (error) throw error;
};

export const submitWaitlist = async (data: WaitlistData) => {
  const { error } = await supabase
    .from('waitlist')
    .insert([data]);

  if (error) throw error;
};

export const submitContact = async (data: ContactData) => {
  const { error } = await supabase
    .from('contact_submissions')
    .insert([data]);

  if (error) throw error;
};
