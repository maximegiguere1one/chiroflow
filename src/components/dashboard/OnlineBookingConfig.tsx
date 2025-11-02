import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, DollarSign, Globe, Save, ToggleLeft, ToggleRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToastContext } from '../../contexts/ToastContext';
import { buttonHover, buttonTap } from '../../lib/animations';

interface BookingSettings {
  id?: string;
  owner_id?: string;
  monday_start: string;
  monday_end: string;
  monday_enabled: boolean;
  tuesday_start: string;
  tuesday_end: string;
  tuesday_enabled: boolean;
  wednesday_start: string;
  wednesday_end: string;
  wednesday_enabled: boolean;
  thursday_start: string;
  thursday_end: string;
  thursday_enabled: boolean;
  friday_start: string;
  friday_end: string;
  friday_enabled: boolean;
  saturday_start: string;
  saturday_end: string;
  saturday_enabled: boolean;
  sunday_start: string;
  sunday_end: string;
  sunday_enabled: boolean;
  slot_duration_minutes: number;
  buffer_time_minutes: number;
  advance_booking_days: number;
  minimum_notice_hours: number;
  max_bookings_per_slot: number;
  require_payment: boolean;
  require_deposit: boolean;
  deposit_percentage: number;
  cancellation_hours: number;
  booking_confirmation_message: string;
  booking_instructions: string;
  cancellation_policy: string;
  enabled: boolean;
}

const DAYS = [
  { key: 'monday', label: 'Lundi' },
  { key: 'tuesday', label: 'Mardi' },
  { key: 'wednesday', label: 'Mercredi' },
  { key: 'thursday', label: 'Jeudi' },
  { key: 'friday', label: 'Vendredi' },
  { key: 'saturday', label: 'Samedi' },
  { key: 'sunday', label: 'Dimanche' },
];

export function OnlineBookingConfig() {
  const toast = useToastContext();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<BookingSettings>({
    monday_start: '09:00',
    monday_end: '17:00',
    monday_enabled: true,
    tuesday_start: '09:00',
    tuesday_end: '17:00',
    tuesday_enabled: true,
    wednesday_start: '09:00',
    wednesday_end: '17:00',
    wednesday_enabled: true,
    thursday_start: '09:00',
    thursday_end: '17:00',
    thursday_enabled: true,
    friday_start: '09:00',
    friday_end: '17:00',
    friday_enabled: true,
    saturday_start: '09:00',
    saturday_end: '13:00',
    saturday_enabled: false,
    sunday_start: '09:00',
    sunday_end: '13:00',
    sunday_enabled: false,
    slot_duration_minutes: 30,
    buffer_time_minutes: 0,
    advance_booking_days: 30,
    minimum_notice_hours: 24,
    max_bookings_per_slot: 1,
    require_payment: false,
    require_deposit: false,
    deposit_percentage: 50,
    cancellation_hours: 24,
    booking_confirmation_message: 'Votre rendez-vous a été confirmé!',
    booking_instructions: 'Veuillez arriver 10 minutes avant votre rendez-vous.',
    cancellation_policy: 'Les annulations doivent être effectuées au moins 24 heures à l\'avance.',
    enabled: true,
  });

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('booking_settings')
        .select('*')
        .eq('owner_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setSettings(data);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      toast.error('Erreur lors du chargement des paramètres');
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const settingsData = {
        ...settings,
        owner_id: user.id,
      };

      if (settings.id) {
        const { error } = await supabase
          .from('booking_settings')
          .update(settingsData)
          .eq('id', settings.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('booking_settings')
          .insert([settingsData]);

        if (error) throw error;
      }

      toast.success('Paramètres sauvegardés!');
      await loadSettings();
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  }

  function updateDayField(day: string, field: string, value: any) {
    setSettings({
      ...settings,
      [`${day}_${field}`]: value,
    } as BookingSettings);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-amber-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Réservation en ligne</h2>
          <p className="text-slate-600">Configurez votre système de réservation automatique</p>
        </div>
        <button
          onClick={() => setSettings({ ...settings, enabled: !settings.enabled })}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium ${
            settings.enabled
              ? 'bg-green-100 text-green-700'
              : 'bg-slate-100 text-slate-700'
          }`}
        >
          {settings.online_booking_enabled ? (
            <ToggleRight className="w-5 h-5" />
          ) : (
            <ToggleLeft className="w-5 h-5" />
          )}
          <span>{settings.online_booking_enabled ? 'Activé' : 'Désactivé'}</span>
        </button>
      </div>

      {settings.online_booking_enabled && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <Globe className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900">Page de réservation publique</h3>
              <p className="text-sm text-blue-800 mt-1">
                Votre page de réservation est accessible à: <br />
                <code className="bg-blue-100 px-2 py-1 rounded mt-1 inline-block">
                  {window.location.origin}/booking
                </code>
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
          <Clock className="w-5 h-5 mr-2 text-amber-600" />
          Horaires d'ouverture
        </h3>

        <div className="space-y-4">
          {DAYS.map((day) => {
            const enabled = settings[`${day.key}_enabled` as keyof BookingSettings];
            const start = settings[`${day.key}_start` as keyof BookingSettings];
            const end = settings[`${day.key}_end` as keyof BookingSettings];

            return (
              <div key={day.key} className="flex items-center space-x-4">
                <button
                  onClick={() => updateDayField(day.key, 'enabled', !enabled)}
                  className="w-28 text-left"
                >
                  <span className={`font-medium ${enabled ? 'text-slate-900' : 'text-slate-400'}`}>
                    {day.label}
                  </span>
                </button>

                {enabled ? (
                  <>
                    <input
                      type="time"
                      value={start as string}
                      onChange={(e) => updateDayField(day.key, 'start', e.target.value)}
                      className="px-3 py-2 border border-slate-300 rounded-lg"
                    />
                    <span className="text-slate-500">à</span>
                    <input
                      type="time"
                      value={end as string}
                      onChange={(e) => updateDayField(day.key, 'end', e.target.value)}
                      className="px-3 py-2 border border-slate-300 rounded-lg"
                    />
                  </>
                ) : (
                  <span className="text-slate-400">Fermé</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
          <Calendar className="w-5 h-5 mr-2 text-amber-600" />
          Paramètres de réservation
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Durée des créneaux (minutes)
            </label>
            <input
              type="number"
              value={settings.slot_duration_minutes}
              onChange={(e) => setSettings({ ...settings, slot_duration_minutes: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              min="15"
              step="15"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Temps tampon entre RDV (minutes)
            </label>
            <input
              type="number"
              value={settings.buffer_time_minutes}
              onChange={(e) => setSettings({ ...settings, buffer_time_minutes: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              min="0"
              step="5"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Jours de réservation à l'avance
            </label>
            <input
              type="number"
              value={settings.advance_booking_days}
              onChange={(e) => setSettings({ ...settings, advance_booking_days: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              min="1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Préavis minimum (heures)
            </label>
            <input
              type="number"
              value={settings.minimum_notice_hours}
              onChange={(e) => setSettings({ ...settings, minimum_notice_hours: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              min="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Délai d'annulation (heures)
            </label>
            <input
              type="number"
              value={settings.cancellation_hours}
              onChange={(e) => setSettings({ ...settings, cancellation_hours: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              min="0"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
          <DollarSign className="w-5 h-5 mr-2 text-amber-600" />
          Paiement
        </h3>

        <div className="space-y-4">
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={settings.require_payment}
              onChange={(e) => setSettings({ ...settings, require_payment: e.target.checked })}
              className="w-5 h-5 text-amber-600 rounded"
            />
            <span className="text-slate-700">Exiger le paiement lors de la réservation</span>
          </label>

          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={settings.require_deposit}
              onChange={(e) => setSettings({ ...settings, require_deposit: e.target.checked })}
              className="w-5 h-5 text-amber-600 rounded"
            />
            <span className="text-slate-700">Exiger un acompte</span>
          </label>

          {settings.require_deposit && (
            <div className="ml-8">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Pourcentage de l'acompte (%)
              </label>
              <input
                type="number"
                value={settings.deposit_percentage}
                onChange={(e) => setSettings({ ...settings, deposit_percentage: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                min="0"
                max="100"
              />
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Messages personnalisés</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Message de confirmation
            </label>
            <textarea
              value={settings.booking_confirmation_message}
              onChange={(e) => setSettings({ ...settings, booking_confirmation_message: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Instructions pour le rendez-vous
            </label>
            <textarea
              value={settings.booking_instructions}
              onChange={(e) => setSettings({ ...settings, booking_instructions: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Politique d'annulation
            </label>
            <textarea
              value={settings.cancellation_policy}
              onChange={(e) => setSettings({ ...settings, cancellation_policy: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-amber-600 text-white px-6 py-3 rounded-lg hover:bg-amber-700 font-semibold flex items-center disabled:opacity-50"
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
              Sauvegarde...
            </>
          ) : (
            <>
              <Save className="w-5 h-5 mr-2" />
              Sauvegarder
            </>
          )}
        </button>
      </div>
    </div>
  );
}
