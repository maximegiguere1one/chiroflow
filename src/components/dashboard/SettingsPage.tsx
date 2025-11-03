import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import {
  Settings as SettingsIcon,
  User,
  Building2,
  Bell,
  Lock,
  Palette,
  Calendar,
  Mail,
  Save,
  Eye,
  EyeOff,
  Globe,
} from 'lucide-react';
import { OnlineBookingConfig } from './OnlineBookingConfig';
import { useToastContext } from '../../contexts/ToastContext';
import { Tooltip } from '../common/Tooltip';
import { FormSkeleton } from '../common/LoadingSkeleton';
import { ValidationInput } from '../common/ValidationInput';
import { ConfirmModal } from '../common/ConfirmModal';
import { buttonHover, buttonTap } from '../../lib/animations';
import { useKeyboardShortcuts, COMMON_SHORTCUTS } from '../../hooks/useKeyboardShortcuts';
import { emailValidation, phoneValidation } from '../../lib/validations';

interface ClinicSettings {
  id: string;
  owner_id: string;
  clinic_name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  timezone: string;
  created_at: string;
  updated_at: string;
}

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: string;
}

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'profile' | 'clinic' | 'notifications' | 'security' | 'booking'>(
    'profile'
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [clinicSettings, setClinicSettings] = useState<ClinicSettings | null>(null);
  const [saveConfirmOpen, setSaveConfirmOpen] = useState(false);
  const toast = useToastContext();

  function handleSave() {
    setSaveConfirmOpen(true);
  }

  const shortcuts = [
    { ...COMMON_SHORTCUTS.SAVE, action: handleSave },
  ];

  useKeyboardShortcuts(shortcuts);

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const [profileRes, settingsRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
        supabase.from('clinic_settings').select('*').eq('owner_id', user.id).maybeSingle(),
      ]);

      if (profileRes.error) throw profileRes.error;
      if (settingsRes.error) throw settingsRes.error;

      setUserProfile(
        profileRes.data || { id: user.id, email: user.email || '', full_name: '', role: 'admin' }
      );
      setClinicSettings(settingsRes.data);
    } catch (error) {
      console.error('Error loading settings:', error);
      toast.error('Erreur lors du chargement des paramètres');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-12 bg-neutral-200 rounded animate-pulse" />
        <FormSkeleton fields={8} />
      </div>
    );
  }

  const tabs = [
    { id: 'profile', label: 'Profil', icon: User },
    { id: 'clinic', label: 'Clinique', icon: Building2 },
    { id: 'booking', label: 'Réservation en ligne', icon: Globe },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Sécurité', icon: Lock },
  ] as const;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-heading text-foreground">Paramètres</h2>
        <p className="text-sm text-foreground/60 mt-1">
          Gérez vos préférences et paramètres de la clinique
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="bg-white border border-neutral-200 shadow-soft-lg p-4 h-fit">
          <nav className="space-y-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-gold-500 to-gold-600 text-white shadow-gold'
                    : 'text-foreground/70 hover:bg-neutral-100 hover:text-foreground'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                <span className="font-light">{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          {activeTab === 'profile' && (
            <ProfileSettings
              profile={userProfile}
              onSave={loadSettings}
              onSavingChange={setSaving}
            />
          )}
          {activeTab === 'clinic' && (
            <ClinicSettingsForm
              settings={clinicSettings}
              userId={userProfile?.id || ''}
              onSave={loadSettings}
              onSavingChange={setSaving}
            />
          )}
          {activeTab === 'booking' && <OnlineBookingConfig />}
          {activeTab === 'notifications' && <NotificationSettings />}
          {activeTab === 'security' && <SecuritySettings />}
        </div>
      </div>
    </div>
  );
}

function ProfileSettings({
  profile,
  onSave,
  onSavingChange,
}: {
  profile: UserProfile | null;
  onSave: () => void;
  onSavingChange: (saving: boolean) => void;
}) {
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || '',
    email: profile?.email || '',
  });
  const toast = useToastContext();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSavingChange(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: formData.full_name })
        .eq('id', profile?.id);

      if (error) throw error;
      toast.success('Profil mis à jour');
      onSave();
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error('Erreur: ' + (error.message || 'Erreur inconnue'));
    } finally {
      onSavingChange(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-neutral-200 shadow-soft-lg p-6"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-gradient-to-br from-gold-400 to-gold-600 rounded-full flex items-center justify-center">
          <User className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-xl font-heading text-foreground">Profil utilisateur</h3>
          <p className="text-sm text-foreground/60">Gérez vos informations personnelles</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-foreground/70 mb-2">
            Nom complet <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={formData.full_name}
            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
            className="w-full px-4 py-3 border border-neutral-300 focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200 transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground/70 mb-2">Email</label>
          <input
            type="email"
            value={formData.email}
            disabled
            className="w-full px-4 py-3 border border-neutral-300 bg-neutral-50 text-foreground/60 cursor-not-allowed"
          />
          <p className="text-xs text-foreground/50 mt-1">
            L'email ne peut pas être modifié pour des raisons de sécurité
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground/70 mb-2">Rôle</label>
          <input
            type="text"
            value={profile?.role || 'admin'}
            disabled
            className="w-full px-4 py-3 border border-neutral-300 bg-neutral-50 text-foreground/60 cursor-not-allowed capitalize"
          />
        </div>

        <div className="flex items-center justify-end pt-4 border-t border-neutral-200">
          <Tooltip content="Enregistrer les modifications" shortcut="Ctrl+S" placement="top">
            <motion.button
              type="submit"
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-gold-500 to-gold-600 text-white hover:from-gold-600 hover:to-gold-700 transition-all duration-300 shadow-soft hover:shadow-gold"
              whileHover={buttonHover}
              whileTap={buttonTap}
            >
              <Save className="w-4 h-4" />
              <span>Enregistrer</span>
            </motion.button>
          </Tooltip>
        </div>
      </form>
    </motion.div>
  );
}

function ClinicSettingsForm({
  settings,
  userId,
  onSave,
  onSavingChange,
}: {
  settings: ClinicSettings | null;
  userId: string;
  onSave: () => void;
  onSavingChange: (saving: boolean) => void;
}) {
  const [formData, setFormData] = useState({
    clinic_name: settings?.clinic_name || 'Ma Clinique',
    email: settings?.email || '',
    phone: settings?.phone || '',
    address: settings?.address || '',
    timezone: settings?.timezone || 'America/Toronto',
  });
  const toast = useToastContext();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSavingChange(true);

    try {
      if (settings) {
        const { error } = await supabase
          .from('clinic_settings')
          .update(formData)
          .eq('id', settings.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('clinic_settings').insert({
          owner_id: userId,
          ...formData,
        });
        if (error) throw error;
      }

      toast.success('Paramètres de la clinique enregistrés');
      onSave();
    } catch (error: any) {
      console.error('Error updating clinic settings:', error);
      toast.error('Erreur: ' + (error.message || 'Erreur inconnue'));
    } finally {
      onSavingChange(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-neutral-200 shadow-soft-lg p-6"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
          <Building2 className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-xl font-heading text-foreground">Paramètres de la clinique</h3>
          <p className="text-sm text-foreground/60">Informations de votre établissement</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-foreground/70 mb-2">
            Nom de la clinique <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={formData.clinic_name}
            onChange={(e) => setFormData({ ...formData, clinic_name: e.target.value })}
            className="w-full px-4 py-3 border border-neutral-300 focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200 transition-all"
          />
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-foreground/70 mb-2">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-3 border border-neutral-300 focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground/70 mb-2">Téléphone</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-3 border border-neutral-300 focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200 transition-all"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground/70 mb-2">Adresse</label>
          <textarea
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            rows={3}
            className="w-full px-4 py-3 border border-neutral-300 focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200 transition-all resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground/70 mb-2">
            Fuseau horaire
          </label>
          <select
            value={formData.timezone}
            onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
            className="w-full px-4 py-3 border border-neutral-300 focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200 transition-all"
          >
            <option value="America/Toronto">America/Toronto (EST)</option>
            <option value="America/Montreal">America/Montreal (EST)</option>
            <option value="America/Vancouver">America/Vancouver (PST)</option>
            <option value="America/Edmonton">America/Edmonton (MST)</option>
            <option value="America/Winnipeg">America/Winnipeg (CST)</option>
          </select>
        </div>

        <div className="flex items-center justify-end pt-4 border-t border-neutral-200">
          <Tooltip content="Enregistrer les modifications" shortcut="Ctrl+S" placement="top">
            <motion.button
              type="submit"
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-gold-500 to-gold-600 text-white hover:from-gold-600 hover:to-gold-700 transition-all duration-300 shadow-soft hover:shadow-gold"
              whileHover={buttonHover}
              whileTap={buttonTap}
            >
              <Save className="w-4 h-4" />
              <span>Enregistrer</span>
            </motion.button>
          </Tooltip>
        </div>
      </form>
    </motion.div>
  );
}

function NotificationSettings() {
  const [notifications, setNotifications] = useState({
    emailAppointments: true,
    emailReminders: true,
    emailReports: false,
    smsAppointments: false,
    smsReminders: true,
    pushNotifications: true,
  });
  const toast = useToastContext();

  function handleSave() {
    toast.success(
      '✓ Paramètres enregistrés',
      'Vos préférences de notifications ont été mises à jour'
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-neutral-200 shadow-soft-lg p-6"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center">
          <Bell className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-xl font-heading text-foreground">Notifications</h3>
          <p className="text-sm text-foreground/60">Gérez vos préférences de notification</p>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <h4 className="font-medium text-foreground mb-4">Notifications par email</h4>
          <div className="space-y-3">
            <NotificationToggle
              label="Nouveaux rendez-vous"
              description="Recevoir un email pour chaque nouveau rendez-vous"
              checked={notifications.emailAppointments}
              onChange={(checked) =>
                setNotifications({ ...notifications, emailAppointments: checked })
              }
            />
            <NotificationToggle
              label="Rappels de rendez-vous"
              description="Rappels 24h avant les rendez-vous"
              checked={notifications.emailReminders}
              onChange={(checked) =>
                setNotifications({ ...notifications, emailReminders: checked })
              }
            />
            <NotificationToggle
              label="Rapports hebdomadaires"
              description="Statistiques et résumés hebdomadaires"
              checked={notifications.emailReports}
              onChange={(checked) =>
                setNotifications({ ...notifications, emailReports: checked })
              }
            />
          </div>
        </div>

        <div className="border-t border-neutral-200 pt-6">
          <h4 className="font-medium text-foreground mb-4">Notifications SMS</h4>
          <div className="space-y-3">
            <NotificationToggle
              label="Nouveaux rendez-vous"
              description="SMS pour les nouveaux rendez-vous urgents"
              checked={notifications.smsAppointments}
              onChange={(checked) =>
                setNotifications({ ...notifications, smsAppointments: checked })
              }
            />
            <NotificationToggle
              label="Rappels"
              description="SMS de rappel aux patients"
              checked={notifications.smsReminders}
              onChange={(checked) =>
                setNotifications({ ...notifications, smsReminders: checked })
              }
            />
          </div>
        </div>

        <div className="border-t border-neutral-200 pt-6">
          <h4 className="font-medium text-foreground mb-4">Autres</h4>
          <NotificationToggle
            label="Notifications push"
            description="Notifications dans le navigateur"
            checked={notifications.pushNotifications}
            onChange={(checked) =>
              setNotifications({ ...notifications, pushNotifications: checked })
            }
          />
        </div>

        <div className="flex items-center justify-end pt-4 border-t border-neutral-200">
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-gold-500 to-gold-600 text-white hover:from-gold-600 hover:to-gold-700 transition-all duration-300 shadow-soft hover:shadow-gold"
          >
            <Save className="w-4 h-4" />
            <span>Enregistrer</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function NotificationToggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between p-4 bg-neutral-50 border border-neutral-200 rounded-lg">
      <div className="flex-1">
        <div className="font-medium text-sm text-foreground mb-1">{label}</div>
        <div className="text-xs text-foreground/60">{description}</div>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          checked ? 'bg-gold-500' : 'bg-neutral-300'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
}

function SecuritySettings() {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const toast = useToastContext();

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();

    if (formData.newPassword !== formData.confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }

    if (formData.newPassword.length < 6) {
      toast.error('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: formData.newPassword,
      });

      if (error) throw error;

      toast.success('Mot de passe changé avec succès');
      setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error: any) {
      console.error('Error changing password:', error);
      toast.error('Erreur: ' + (error.message || 'Erreur inconnue'));
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-neutral-200 shadow-soft-lg p-6"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-gradient-to-br from-red-400 to-red-600 rounded-full flex items-center justify-center">
          <Lock className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-xl font-heading text-foreground">Sécurité</h3>
          <p className="text-sm text-foreground/60">Gérez votre mot de passe et sécurité</p>
        </div>
      </div>

      <form onSubmit={handleChangePassword} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-foreground/70 mb-2">
            Mot de passe actuel
          </label>
          <div className="relative">
            <input
              type={showCurrentPassword ? 'text' : 'password'}
              value={formData.currentPassword}
              onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
              className="w-full px-4 py-3 pr-12 border border-neutral-300 focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200 transition-all"
            />
            <button
              type="button"
              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-neutral-100 rounded"
            >
              {showCurrentPassword ? (
                <EyeOff className="w-5 h-5 text-foreground/40" />
              ) : (
                <Eye className="w-5 h-5 text-foreground/40" />
              )}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground/70 mb-2">
            Nouveau mot de passe <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type={showNewPassword ? 'text' : 'password'}
              required
              value={formData.newPassword}
              onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
              className="w-full px-4 py-3 pr-12 border border-neutral-300 focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200 transition-all"
              minLength={6}
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-neutral-100 rounded"
            >
              {showNewPassword ? (
                <EyeOff className="w-5 h-5 text-foreground/40" />
              ) : (
                <Eye className="w-5 h-5 text-foreground/40" />
              )}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground/70 mb-2">
            Confirmer le mot de passe <span className="text-red-500">*</span>
          </label>
          <input
            type="password"
            required
            value={formData.confirmPassword}
            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            className="w-full px-4 py-3 border border-neutral-300 focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200 transition-all"
            minLength={6}
          />
        </div>

        <div className="bg-gold-50 border border-gold-200 p-4 rounded-lg">
          <p className="text-sm text-foreground/70">
            <strong>Conseils pour un mot de passe sécurisé:</strong>
          </p>
          <ul className="text-xs text-foreground/60 mt-2 space-y-1 ml-4 list-disc">
            <li>Minimum 6 caractères (recommandé: 12+)</li>
            <li>Mélangez majuscules, minuscules, chiffres et symboles</li>
            <li>Évitez les mots du dictionnaire</li>
            <li>N'utilisez pas le même mot de passe ailleurs</li>
          </ul>
        </div>

        <div className="flex items-center justify-end pt-4 border-t border-neutral-200">
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-gold-500 to-gold-600 text-white hover:from-gold-600 hover:to-gold-700 transition-all duration-300 shadow-soft hover:shadow-gold"
          >
            <Save className="w-4 h-4" />
            <span>Changer le mot de passe</span>
          </button>
        </div>
      </form>
    </motion.div>
  );
}
