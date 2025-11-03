import { motion } from 'framer-motion';
import { useState } from 'react';
import { useSettings } from '../../hooks/useSettings';
import { useToastContext } from '../../contexts/ToastContext';
import {
  Building2,
  Palette,
  Calendar,
  DollarSign,
  Bell,
  Globe,
  Phone,
  MapPin,
  Save,
  Mail,
  Clock,
} from 'lucide-react';
import { EmailTemplateEditor } from './EmailTemplateEditor';
import { BusinessHoursConfig } from './BusinessHoursConfig';
import { BillingConfig } from './BillingConfig';
import { BrandingConfig } from './BrandingConfig';
import { ServiceTypesManager } from './ServiceTypesManager';
import { NotificationsConfig } from './NotificationsConfig';

export function AdvancedSettings() {
  const {
    clinicSettings,
    brandingSettings,
    loading,
    updateClinicSettings,
    updateBrandingSettings
  } = useSettings();
  const toast = useToastContext();
  const [activeTab, setActiveTab] = useState<'clinic' | 'branding' | 'hours' | 'emails' | 'services' | 'billing' | 'notifications'>('clinic');
  const [saving, setSaving] = useState(false);

  const tabs = [
    { id: 'clinic' as const, label: 'Clinique', icon: Building2 },
    { id: 'branding' as const, label: 'Branding', icon: Palette },
    { id: 'hours' as const, label: 'Heures d\'ouverture', icon: Clock },
    { id: 'emails' as const, label: 'Templates Emails', icon: Mail },
    { id: 'services' as const, label: 'Services', icon: Calendar },
    { id: 'billing' as const, label: 'Facturation', icon: DollarSign },
    { id: 'notifications' as const, label: 'Notifications', icon: Bell },
  ];

  async function handleSaveClinic(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    try {
      const formData = new FormData(e.currentTarget);
      await updateClinicSettings({
        clinic_name: formData.get('clinic_name') as string,
        owner_name: formData.get('owner_name') as string,
        owner_title: formData.get('owner_title') as string,
        clinic_tagline: formData.get('clinic_tagline') as string,
        phone: formData.get('phone') as string,
        email: formData.get('email') as string,
        website: formData.get('website') as string,
        street_address: formData.get('street_address') as string,
        suite_number: formData.get('suite_number') as string,
        city: formData.get('city') as string,
        province: formData.get('province') as string,
        postal_code: formData.get('postal_code') as string,
        facebook_url: formData.get('facebook_url') as string || undefined,
        instagram_url: formData.get('instagram_url') as string || undefined,
        linkedin_url: formData.get('linkedin_url') as string || undefined,
      });
      toast.success('Paramètres de la clinique sauvegardés!');
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde');
      console.error(error);
    } finally {
      setSaving(false);
    }
  }


  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-500"></div>
      </div>
    );
  }

  if (!clinicSettings) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Aucun paramètre trouvé</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-gold-500 text-white rounded-lg hover:bg-gold-600"
          >
            Recharger
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading text-foreground">Configuration Avancée</h1>
          <p className="text-sm text-neutral-600 mt-1">
            Personnalisez tous les aspects de votre système
          </p>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'bg-gold-500 text-white'
                  : 'bg-white text-neutral-700 hover:bg-neutral-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>

      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-lifted p-6"
      >
        {activeTab === 'clinic' && (
          <form onSubmit={handleSaveClinic} className="space-y-6">
            <div>
              <h3 className="text-lg font-heading text-foreground mb-4 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-gold-500" />
                Informations de la Clinique
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Nom de la clinique
                  </label>
                  <input
                    type="text"
                    name="clinic_name"
                    defaultValue={clinicSettings?.clinic_name}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Slogan
                  </label>
                  <input
                    type="text"
                    name="clinic_tagline"
                    defaultValue={clinicSettings?.clinic_tagline}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Nom du propriétaire
                  </label>
                  <input
                    type="text"
                    name="owner_name"
                    defaultValue={clinicSettings?.owner_name}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Titre professionnel
                  </label>
                  <input
                    type="text"
                    name="owner_title"
                    defaultValue={clinicSettings?.owner_title}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-heading text-foreground mb-4 flex items-center gap-2">
                <Phone className="w-5 h-5 text-gold-500" />
                Coordonnées
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Téléphone
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    defaultValue={clinicSettings?.phone}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    defaultValue={clinicSettings?.email}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Site web
                  </label>
                  <input
                    type="url"
                    name="website"
                    defaultValue={clinicSettings?.website}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-heading text-foreground mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-gold-500" />
                Adresse
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Rue
                  </label>
                  <input
                    type="text"
                    name="street_address"
                    defaultValue={clinicSettings?.street_address}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Suite/Bureau
                  </label>
                  <input
                    type="text"
                    name="suite_number"
                    defaultValue={clinicSettings?.suite_number}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Ville
                  </label>
                  <input
                    type="text"
                    name="city"
                    defaultValue={clinicSettings?.city}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Province
                  </label>
                  <input
                    type="text"
                    name="province"
                    defaultValue={clinicSettings?.province}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Code postal
                  </label>
                  <input
                    type="text"
                    name="postal_code"
                    defaultValue={clinicSettings?.postal_code}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-heading text-foreground mb-4 flex items-center gap-2">
                <Globe className="w-5 h-5 text-gold-500" />
                Réseaux Sociaux
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Facebook
                  </label>
                  <input
                    type="url"
                    name="facebook_url"
                    defaultValue={clinicSettings?.facebook_url}
                    placeholder="https://facebook.com/..."
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Instagram
                  </label>
                  <input
                    type="url"
                    name="instagram_url"
                    defaultValue={clinicSettings?.instagram_url}
                    placeholder="https://instagram.com/..."
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    LinkedIn
                  </label>
                  <input
                    type="url"
                    name="linkedin_url"
                    defaultValue={clinicSettings?.linkedin_url}
                    placeholder="https://linkedin.com/..."
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2 bg-gold-500 text-white rounded-lg hover:bg-gold-600 transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Sauvegarde...' : 'Sauvegarder'}
              </button>
            </div>
          </form>
        )}

        {activeTab === 'branding' && (
          <BrandingConfig settings={brandingSettings} updateBrandingSettings={updateBrandingSettings} />
        )}

        {activeTab === 'hours' && (
          <BusinessHoursConfig />
        )}

        {activeTab === 'emails' && (
          <EmailTemplateEditor />
        )}


        {activeTab === 'services' && (
          <ServiceTypesManager />
        )}

        {activeTab === 'billing' && (
          <BillingConfig settings={clinicSettings} />
        )}

        {activeTab === 'notifications' && (
          <NotificationsConfig />
        )}
      </motion.div>
    </div>
  );
}
