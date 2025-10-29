import { supabase } from './supabase';

export async function getCurrentUserId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id || null;
}

export async function getCurrentUserProfile() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  return profile;
}

export async function getCurrentClinicSettings() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: settings } = await supabase
    .from('clinic_settings')
    .select('*')
    .eq('owner_id', user.id)
    .maybeSingle();

  return settings;
}

export async function isAdmin(): Promise<boolean> {
  const profile = await getCurrentUserProfile();
  return profile?.role === 'admin' || profile?.role === 'practitioner';
}
