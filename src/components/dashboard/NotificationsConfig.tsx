import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { useToastContext } from '../../contexts/ToastContext';
import { buttonHover, buttonTap } from '../../lib/animations';
import {
  Bell,
  Save,
  Mail,
  MessageSquare,
  Calendar,
  DollarSign,
  UserPlus,
  Clock,
  AlertCircle,
  CheckCircle,
  Volume2,
} from 'lucide-react';

interface NotificationSettings {
  id?: string;
  notify_new_appointment: boolean;
  notify_appointment_cancelled: boolean;
  notify_appointment_confirmed: boolean;
  notify_patient_no_show: boolean;
  notify_payment_received: boolean;
  notify_payment_failed: boolean;
  notify_waitlist_match: boolean;
  notify_new_patient: boolean;
  notification_email: string;
  send_daily_summary: boolean;
  daily_summary_time: string;
  send_weekly_report: boolean;
  weekly_report_day: number;
  enable_appointment_reminders: boolean;
  reminder_hours_before: number;
  enable_followup_reminders: boolean;
  followup_days_after: number;
  enable_birthday_wishes: boolean;
  enable_sms_notifications: boolean;
  sms_provider: string;
  notification_sound: boolean;
  desktop_notifications: boolean;
}

const NOTIFICATION_EVENTS = [
  {
    key: 'notify_new_appointment',
    label: 'Nouveau rendez-vous',
    description: 'Quand un patient prend un rendez-vous',
    icon: Calendar,
    color: 'blue',
  },
  {
    key: 'notify_appointment_cancelled',
    label: 'Annulation de rendez-vous',
    description: 'Quand un rendez-vous est annulé',
    icon: AlertCircle,
    color: 'red',
  },
  {
    key: 'notify_appointment_confirmed',
    label: 'Confirmation de rendez-vous',
    description: 'Quand un rendez-vous est confirmé',
    icon: CheckCircle,
    color: 'green',
  },
  {
    key: 'notify_patient_no_show',
    label: 'Patient absent',
    description: 'Quand un patient ne se présente pas',
    icon: AlertCircle,
    color: 'orange',
  },
  {
    key: 'notify_payment_received',
    label: 'Paiement reçu',
    description: 'Quand un paiement est effectué',
    icon: DollarSign,
    color: 'green',
  },
  {
    key: 'notify_payment_failed',
    label: 'Échec de paiement',
    description: 'Quand un paiement échoue',
    icon: AlertCircle,
    color: 'red',
  },
  {
    key: 'notify_waitlist_match',
    label: 'Match liste d\'attente',
    description: 'Quand un créneau correspond à la liste d\'attente',
    icon: Bell,
    color: 'purple',
  },
  {
    key: 'notify_new_patient',
    label: 'Nouveau patient',
    description: 'Quand un nouveau patient s\'inscrit',
    icon: UserPlus,
    color: 'blue',
  },
];

const DAYS_OF_WEEK = [
  { value: 0, label: 'Dimanche' },
  { value: 1, label: 'Lundi' },
  { value: 2, label: 'Mardi' },
  { value: 3, label: 'Mercredi' },
  { value: 4, label: 'Jeudi' },
  { value: 5, label: 'Vendredi' },
  { value: 6, label: 'Samedi' },
];

export function NotificationsConfig() {
  const toast = useToastContext();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<NotificationSettings>({
    notify_new_appointment: true,
    notify_appointment_cancelled: true,
    notify_appointment_confirmed: false,
    notify_patient_no_show: true,
    notify_payment_received: true,
    notify_payment_failed: true,
    notify_waitlist_match: true,
    notify_new_patient: true,
    notification_email: '',
    send_daily_summary: false,
    daily_summary_time: '18:00',
    send_weekly_report: false,
    weekly_report_day: 1,
    enable_appointment_reminders: true,
    reminder_hours_before: 24,
    enable_followup_reminders: false,
    followup_days_after: 7,
    enable_birthday_wishes: false,
    enable_sms_notifications: false,
    sms_provider: 'none',
    notification_sound: true,
    desktop_notifications: false,
  });

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Non authentifié');
        return;
      }

      // Vérifier si le profil existe
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError) {
        console.error('Profile error:', profileError);
        toast.error('Erreur lors du chargement du profil');
        return;
      }

      if (!profile) {
        // Créer le profil s'il n'existe pas
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            email: user.email || '',
            full_name: user.email?.split('@')[0] || 'Admin',
            role: 'admin',
          });

        if (insertError) {
          console.error('Error creating profile:', insertError);
          toast.error('Erreur lors de la création du profil');
          return;
        }
      }

      // Charger les paramètres de notification
      const { data, error } = await supabase
        .from('notification_settings')
        .select('*')
        .eq('owner_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Settings error:', error);
        throw error;
      }

      if (data) {
        setSettings(data);
      } else {
        setSettings(prev => ({
          ...prev,
          notification_email: profile?.email || user.email || '',
        }));
      }
    } catch (error: any) {
      console.error('Error loading notification settings:', error);
      toast.error(`Erreur: ${error?.message || 'Erreur inconnue'}`);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();

    if (!settings.notification_email) {
      toast.error('L\'email de notification est requis');
      return;
    }

    try {
      setSaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const settingsData = {
        owner_id: user.id,
        notify_new_appointment: settings.notify_new_appointment,
        notify_appointment_cancelled: settings.notify_appointment_cancelled,
        notify_appointment_confirmed: settings.notify_appointment_confirmed,
        notify_patient_no_show: settings.notify_patient_no_show,
        notify_payment_received: settings.notify_payment_received,
        notify_payment_failed: settings.notify_payment_failed,
        notify_waitlist_match: settings.notify_waitlist_match,
        notify_new_patient: settings.notify_new_patient,
        notification_email: settings.notification_email,
        send_daily_summary: settings.send_daily_summary,
        daily_summary_time: settings.daily_summary_time,
        send_weekly_report: settings.send_weekly_report,
        weekly_report_day: settings.weekly_report_day,
        enable_appointment_reminders: settings.enable_appointment_reminders,
        reminder_hours_before: settings.reminder_hours_before,
        enable_followup_reminders: settings.enable_followup_reminders,
        followup_days_after: settings.followup_days_after,
        enable_birthday_wishes: settings.enable_birthday_wishes,
        enable_sms_notifications: settings.enable_sms_notifications,
        sms_provider: settings.sms_provider,
        notification_sound: settings.notification_sound,
        desktop_notifications: settings.desktop_notifications,
      };

      const { error } = await supabase
        .from('notification_settings')
        .upsert(settingsData, {
          onConflict: 'owner_id',
        });

      if (error) throw error;

      toast.success('Préférences de notifications sauvegardées!');
    } catch (error: any) {
      console.error('Error saving notification settings:', error);
      toast.error(`Erreur lors de la sauvegarde: ${error?.message || 'Erreur inconnue'}`);
    } finally {
      setSaving(false);
    }
  }

  function updateSetting(key: keyof NotificationSettings, value: any) {
    setSettings(prev => ({ ...prev, [key]: value }));
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-500"></div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-heading text-foreground flex items-center gap-2">
            <Bell className="w-5 h-5 text-gold-500" />
            Préférences de Notifications
          </h3>
          <p className="text-sm text-neutral-600 mt-1">
            Configurez comment et quand vous souhaitez être notifié
          </p>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2 bg-gold-500 text-white rounded-lg hover:bg-gold-600 transition-colors disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Sauvegarde...' : 'Sauvegarder'}
        </button>
      </div>

      {/* Email Configuration */}
      <div className="bg-white rounded-lg border border-neutral-200 p-6">
        <h4 className="font-medium text-foreground mb-4 flex items-center gap-2">
          <Mail className="w-5 h-5 text-gold-500" />
          Configuration Email
        </h4>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Email de notification *
            </label>
            <input
              type="email"
              value={settings.notification_email}
              onChange={(e) => updateSetting('notification_email', e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-gold-500"
              placeholder="votre@email.com"
              required
            />
            <p className="text-xs text-neutral-600 mt-1">
              Toutes les notifications seront envoyées à cette adresse
            </p>
          </div>
        </div>
      </div>

      {/* Event Notifications */}
      <div className="bg-white rounded-lg border border-neutral-200 p-6">
        <h4 className="font-medium text-foreground mb-4">Événements à notifier</h4>
        <div className="space-y-3">
          {NOTIFICATION_EVENTS.map((event) => {
            const Icon = event.icon;
            const colorClasses = {
              blue: 'text-blue-500',
              red: 'text-red-500',
              green: 'text-green-500',
              orange: 'text-orange-500',
              purple: 'text-purple-500',
            };

            return (
              <label
                key={event.key}
                className="flex items-start gap-3 p-3 rounded-lg hover:bg-neutral-50 transition-colors cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={settings[event.key as keyof NotificationSettings] as boolean}
                  onChange={(e) => updateSetting(event.key as keyof NotificationSettings, e.target.checked)}
                  className="w-5 h-5 mt-0.5 rounded border-neutral-300 text-gold-500 focus:ring-gold-500"
                />
                <Icon className={`w-5 h-5 mt-0.5 ${colorClasses[event.color as keyof typeof colorClasses]}`} />
                <div className="flex-1">
                  <div className="font-medium text-sm text-foreground">{event.label}</div>
                  <div className="text-xs text-neutral-600">{event.description}</div>
                </div>
              </label>
            );
          })}
        </div>
      </div>

      {/* Daily/Weekly Reports */}
      <div className="bg-white rounded-lg border border-neutral-200 p-6">
        <h4 className="font-medium text-foreground mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-gold-500" />
          Rapports automatiques
        </h4>
        <div className="space-y-4">
          <div>
            <label className="flex items-center gap-2 mb-3">
              <input
                type="checkbox"
                checked={settings.send_daily_summary}
                onChange={(e) => updateSetting('send_daily_summary', e.target.checked)}
                className="w-4 h-4 rounded border-neutral-300 text-gold-500 focus:ring-gold-500"
              />
              <span className="text-sm font-medium text-neutral-700">
                Résumé quotidien par email
              </span>
            </label>
            {settings.send_daily_summary && (
              <div className="ml-6">
                <label className="block text-sm text-neutral-600 mb-2">
                  Heure d'envoi
                </label>
                <input
                  type="time"
                  value={settings.daily_summary_time}
                  onChange={(e) => updateSetting('daily_summary_time', e.target.value)}
                  className="px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-gold-500"
                />
              </div>
            )}
          </div>

          <div>
            <label className="flex items-center gap-2 mb-3">
              <input
                type="checkbox"
                checked={settings.send_weekly_report}
                onChange={(e) => updateSetting('send_weekly_report', e.target.checked)}
                className="w-4 h-4 rounded border-neutral-300 text-gold-500 focus:ring-gold-500"
              />
              <span className="text-sm font-medium text-neutral-700">
                Rapport hebdomadaire
              </span>
            </label>
            {settings.send_weekly_report && (
              <div className="ml-6">
                <label className="block text-sm text-neutral-600 mb-2">
                  Jour d'envoi
                </label>
                <select
                  value={settings.weekly_report_day}
                  onChange={(e) => updateSetting('weekly_report_day', parseInt(e.target.value))}
                  className="px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-gold-500"
                >
                  {DAYS_OF_WEEK.map((day) => (
                    <option key={day.value} value={day.value}>
                      {day.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Automatic Reminders */}
      <div className="bg-white rounded-lg border border-neutral-200 p-6">
        <h4 className="font-medium text-foreground mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-gold-500" />
          Rappels automatiques
        </h4>
        <div className="space-y-4">
          <div>
            <label className="flex items-center gap-2 mb-3">
              <input
                type="checkbox"
                checked={settings.enable_appointment_reminders}
                onChange={(e) => updateSetting('enable_appointment_reminders', e.target.checked)}
                className="w-4 h-4 rounded border-neutral-300 text-gold-500 focus:ring-gold-500"
              />
              <span className="text-sm font-medium text-neutral-700">
                Rappels de rendez-vous aux patients
              </span>
            </label>
            {settings.enable_appointment_reminders && (
              <div className="ml-6">
                <label className="block text-sm text-neutral-600 mb-2">
                  Envoyer le rappel (heures avant)
                </label>
                <select
                  value={settings.reminder_hours_before}
                  onChange={(e) => updateSetting('reminder_hours_before', parseInt(e.target.value))}
                  className="px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-gold-500"
                >
                  <option value="2">2 heures avant</option>
                  <option value="4">4 heures avant</option>
                  <option value="12">12 heures avant</option>
                  <option value="24">24 heures avant</option>
                  <option value="48">48 heures avant</option>
                </select>
              </div>
            )}
          </div>

          <div>
            <label className="flex items-center gap-2 mb-3">
              <input
                type="checkbox"
                checked={settings.enable_followup_reminders}
                onChange={(e) => updateSetting('enable_followup_reminders', e.target.checked)}
                className="w-4 h-4 rounded border-neutral-300 text-gold-500 focus:ring-gold-500"
              />
              <span className="text-sm font-medium text-neutral-700">
                Rappels de suivi automatiques
              </span>
            </label>
            {settings.enable_followup_reminders && (
              <div className="ml-6">
                <label className="block text-sm text-neutral-600 mb-2">
                  Envoyer après (jours)
                </label>
                <input
                  type="number"
                  value={settings.followup_days_after}
                  onChange={(e) => updateSetting('followup_days_after', parseInt(e.target.value))}
                  className="w-32 px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-gold-500"
                  min="1"
                  max="90"
                />
              </div>
            )}
          </div>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={settings.enable_birthday_wishes}
              onChange={(e) => updateSetting('enable_birthday_wishes', e.target.checked)}
              className="w-4 h-4 rounded border-neutral-300 text-gold-500 focus:ring-gold-500"
            />
            <span className="text-sm font-medium text-neutral-700">
              Souhaits d'anniversaire automatiques
            </span>
          </label>
        </div>
      </div>

      {/* SMS Notifications */}
      <div className="bg-white rounded-lg border border-neutral-200 p-6">
        <h4 className="font-medium text-foreground mb-4 flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-gold-500" />
          Notifications SMS
        </h4>
        <div className="space-y-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={settings.enable_sms_notifications}
              onChange={(e) => updateSetting('enable_sms_notifications', e.target.checked)}
              className="w-4 h-4 rounded border-neutral-300 text-gold-500 focus:ring-gold-500"
            />
            <span className="text-sm font-medium text-neutral-700">
              Activer les notifications SMS
            </span>
          </label>

          {settings.enable_sms_notifications && (
            <div className="ml-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800 mb-2">
                📱 Configuration SMS requise
              </p>
              <p className="text-xs text-blue-700">
                Pour activer les SMS, vous devez configurer un fournisseur SMS (Twilio, etc.) dans les paramètres avancés.
              </p>
              <select
                value={settings.sms_provider}
                onChange={(e) => updateSetting('sms_provider', e.target.value)}
                className="mt-3 w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="none">Aucun fournisseur configuré</option>
                <option value="twilio">Twilio</option>
                <option value="aws_sns">AWS SNS</option>
                <option value="messagebird">MessageBird</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Desktop & Sound */}
      <div className="bg-white rounded-lg border border-neutral-200 p-6">
        <h4 className="font-medium text-foreground mb-4 flex items-center gap-2">
          <Volume2 className="w-5 h-5 text-gold-500" />
          Interface & Son
        </h4>
        <div className="space-y-3">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={settings.notification_sound}
              onChange={(e) => updateSetting('notification_sound', e.target.checked)}
              className="w-4 h-4 rounded border-neutral-300 text-gold-500 focus:ring-gold-500"
            />
            <span className="text-sm text-neutral-700">
              Son de notification
            </span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={settings.desktop_notifications}
              onChange={(e) => updateSetting('desktop_notifications', e.target.checked)}
              className="w-4 h-4 rounded border-neutral-300 text-gold-500 focus:ring-gold-500"
            />
            <span className="text-sm text-neutral-700">
              Notifications bureau (navigateur)
            </span>
          </label>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-gradient-to-r from-gold-50 to-gold-100 border border-gold-200 rounded-lg p-6">
        <h4 className="font-medium text-foreground mb-3">Résumé de vos notifications</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <div className="text-neutral-600 mb-1">Événements actifs</div>
            <div className="text-2xl font-bold text-foreground">
              {NOTIFICATION_EVENTS.filter(e => settings[e.key as keyof NotificationSettings]).length}
              /{NOTIFICATION_EVENTS.length}
            </div>
          </div>
          <div>
            <div className="text-neutral-600 mb-1">Email</div>
            <div className="font-medium text-foreground truncate">
              {settings.notification_email || 'Non configuré'}
            </div>
          </div>
          <div>
            <div className="text-neutral-600 mb-1">Rappels automatiques</div>
            <div className="font-medium text-foreground">
              {settings.enable_appointment_reminders ? `Oui (${settings.reminder_hours_before}h avant)` : 'Non'}
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
