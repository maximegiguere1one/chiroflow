import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AllSettings } from '../../hooks/useSettings';
import { useToastContext } from '../../contexts/ToastContext';
import { Palette, Save, Eye, Upload, Sparkles } from 'lucide-react';
import { buttonHover, buttonTap } from '../../lib/animations';

interface BrandingConfigProps {
  settings: AllSettings;
  updateBrandingSettings: (updates: any) => Promise<any>;
}

export function BrandingConfig({ settings, updateBrandingSettings }: BrandingConfigProps) {
  const toast = useToastContext();
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const [brandingData, setBrandingData] = useState({
    primary_color: '#C9A55C',
    secondary_color: '#1a1a1a',
    accent_color: '#d4b36a',
    text_color: '#333333',
    background_color: '#ffffff',
    heading_font: 'Inter',
    body_font: 'Inter',
  });

  useEffect(() => {
    if (settings.branding) {
      setBrandingData({
        primary_color: settings.branding.primary_color,
        secondary_color: settings.branding.secondary_color,
        accent_color: settings.branding.accent_color,
        text_color: settings.branding.text_color,
        background_color: settings.branding.background_color,
        heading_font: settings.branding.heading_font,
        body_font: settings.branding.body_font,
      });
    }
  }, [settings.branding]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await updateBrandingSettings(brandingData);
      toast.success('Paramètres de branding sauvegardés!');
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde');
      console.error(error);
    } finally {
      setSaving(false);
    }
  }

  function applyPreset(preset: 'professional' | 'warm' | 'modern' | 'calm') {
    const presets = {
      professional: {
        primary_color: '#2c5282',
        secondary_color: '#1a365d',
        accent_color: '#4299e1',
        text_color: '#2d3748',
        background_color: '#ffffff',
      },
      warm: {
        primary_color: '#d97706',
        secondary_color: '#92400e',
        accent_color: '#fbbf24',
        text_color: '#451a03',
        background_color: '#fffbeb',
      },
      modern: {
        primary_color: '#7c3aed',
        secondary_color: '#5b21b6',
        accent_color: '#a78bfa',
        text_color: '#1f2937',
        background_color: '#ffffff',
      },
      calm: {
        primary_color: '#059669',
        secondary_color: '#047857',
        accent_color: '#34d399',
        text_color: '#064e3b',
        background_color: '#f0fdf4',
      },
    };

    setBrandingData({ ...brandingData, ...presets[preset] });
    toast.success(`Thème "${preset}" appliqué!`);
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-heading text-foreground flex items-center gap-2">
            <Palette className="w-5 h-5 text-gold-500" />
            Personnalisation du Branding
          </h3>
          <p className="text-sm text-neutral-600 mt-1">
            Créez l'identité visuelle de votre clinique
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className="flex items-center gap-2 px-4 py-2 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors"
          >
            <Eye className="w-4 h-4" />
            {showPreview ? 'Masquer' : 'Prévisualiser'}
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2 bg-gold-500 text-white rounded-lg hover:bg-gold-600 transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Sauvegarde...' : 'Sauvegarder'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configuration */}
        <div className="space-y-6">
          {/* Preset Themes */}
          <div className="bg-white rounded-lg border border-neutral-200 p-6">
            <h4 className="font-medium text-foreground mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-gold-500" />
              Thèmes pré-conçus
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => applyPreset('professional')}
                className="p-4 border-2 border-neutral-200 rounded-lg hover:border-blue-500 transition-colors"
              >
                <div className="flex gap-2 mb-2">
                  <div className="w-6 h-6 rounded" style={{ backgroundColor: '#2c5282' }}></div>
                  <div className="w-6 h-6 rounded" style={{ backgroundColor: '#4299e1' }}></div>
                </div>
                <div className="text-sm font-medium">Professionnel</div>
              </button>
              <button
                type="button"
                onClick={() => applyPreset('warm')}
                className="p-4 border-2 border-neutral-200 rounded-lg hover:border-orange-500 transition-colors"
              >
                <div className="flex gap-2 mb-2">
                  <div className="w-6 h-6 rounded" style={{ backgroundColor: '#d97706' }}></div>
                  <div className="w-6 h-6 rounded" style={{ backgroundColor: '#fbbf24' }}></div>
                </div>
                <div className="text-sm font-medium">Chaleureux</div>
              </button>
              <button
                type="button"
                onClick={() => applyPreset('modern')}
                className="p-4 border-2 border-neutral-200 rounded-lg hover:border-purple-500 transition-colors"
              >
                <div className="flex gap-2 mb-2">
                  <div className="w-6 h-6 rounded" style={{ backgroundColor: '#7c3aed' }}></div>
                  <div className="w-6 h-6 rounded" style={{ backgroundColor: '#a78bfa' }}></div>
                </div>
                <div className="text-sm font-medium">Moderne</div>
              </button>
              <button
                type="button"
                onClick={() => applyPreset('calm')}
                className="p-4 border-2 border-neutral-200 rounded-lg hover:border-green-500 transition-colors"
              >
                <div className="flex gap-2 mb-2">
                  <div className="w-6 h-6 rounded" style={{ backgroundColor: '#059669' }}></div>
                  <div className="w-6 h-6 rounded" style={{ backgroundColor: '#34d399' }}></div>
                </div>
                <div className="text-sm font-medium">Calme</div>
              </button>
            </div>
          </div>

          {/* Colors */}
          <div className="bg-white rounded-lg border border-neutral-200 p-6">
            <h4 className="font-medium text-foreground mb-4">Palette de couleurs</h4>
            <div className="space-y-4">
              {[
                { key: 'primary_color', label: 'Couleur principale', desc: 'Boutons, liens importants' },
                { key: 'secondary_color', label: 'Couleur secondaire', desc: 'En-têtes, éléments sombres' },
                { key: 'accent_color', label: 'Couleur d\'accent', desc: 'Éléments de mise en valeur' },
                { key: 'text_color', label: 'Couleur du texte', desc: 'Texte principal' },
                { key: 'background_color', label: 'Couleur de fond', desc: 'Fond des pages' },
              ].map((color) => (
                <div key={color.key} className="flex items-center gap-3">
                  <input
                    type="color"
                    value={brandingData[color.key as keyof typeof brandingData]}
                    onChange={(e) => setBrandingData({...brandingData, [color.key]: e.target.value})}
                    className="w-16 h-10 rounded border border-neutral-300 cursor-pointer"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-sm text-foreground">{color.label}</div>
                    <div className="text-xs text-neutral-600">{color.desc}</div>
                  </div>
                  <input
                    type="text"
                    value={brandingData[color.key as keyof typeof brandingData]}
                    onChange={(e) => setBrandingData({...brandingData, [color.key]: e.target.value})}
                    className="w-24 px-2 py-1 border border-neutral-300 rounded text-sm font-mono"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Fonts */}
          <div className="bg-white rounded-lg border border-neutral-200 p-6">
            <h4 className="font-medium text-foreground mb-4">Typographie</h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Police des titres
                </label>
                <select
                  value={brandingData.heading_font}
                  onChange={(e) => setBrandingData({...brandingData, heading_font: e.target.value})}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-gold-500"
                >
                  <option value="Inter">Inter (Moderne)</option>
                  <option value="Poppins">Poppins (Géométrique)</option>
                  <option value="Montserrat">Montserrat (Élégant)</option>
                  <option value="Raleway">Raleway (Sophistiqué)</option>
                  <option value="Playfair Display">Playfair Display (Classique)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Police du corps de texte
                </label>
                <select
                  value={brandingData.body_font}
                  onChange={(e) => setBrandingData({...brandingData, body_font: e.target.value})}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-gold-500"
                >
                  <option value="Inter">Inter (Par défaut)</option>
                  <option value="Open Sans">Open Sans (Lisible)</option>
                  <option value="Roboto">Roboto (Moderne)</option>
                  <option value="Lato">Lato (Professionnel)</option>
                  <option value="Source Sans Pro">Source Sans Pro (Élégant)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Logo Upload */}
          <div className="bg-white rounded-lg border border-neutral-200 p-6">
            <h4 className="font-medium text-foreground mb-4">Logo et Images</h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Logo de la clinique
                </label>
                <div className="border-2 border-dashed border-neutral-300 rounded-lg p-6 text-center hover:border-gold-500 transition-colors cursor-pointer">
                  <Upload className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
                  <p className="text-sm text-neutral-600">Cliquez pour télécharger</p>
                  <p className="text-xs text-neutral-500 mt-1">PNG, JPG jusqu'à 2MB</p>
                </div>
              </div>
              <p className="text-xs text-blue-600 bg-blue-50 p-3 rounded">
                💡 Fonctionnalité d'upload à venir - Pour l'instant, ajoutez l'URL de votre logo
              </p>
            </div>
          </div>
        </div>

        {/* Live Preview */}
        {showPreview && (
          <div className="lg:sticky lg:top-6 h-fit">
            <div className="bg-white rounded-lg border border-neutral-200 p-6">
              <h4 className="font-medium text-foreground mb-4">Prévisualisation Live</h4>

              <div
                className="rounded-lg overflow-hidden shadow-lg"
                style={{
                  backgroundColor: brandingData.background_color,
                  fontFamily: brandingData.body_font,
                }}
              >
                {/* Preview Header */}
                <div
                  className="p-6"
                  style={{
                    background: `linear-gradient(135deg, ${brandingData.primary_color}, ${brandingData.secondary_color})`,
                  }}
                >
                  <h1
                    className="text-2xl font-bold mb-2"
                    style={{
                      color: '#ffffff',
                      fontFamily: brandingData.heading_font,
                    }}
                  >
                    {settings.clinic?.clinic_name || 'Votre Clinique'}
                  </h1>
                  <p style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                    {settings.clinic?.clinic_tagline || 'Soins professionnels'}
                  </p>
                </div>

                {/* Preview Content */}
                <div className="p-6" style={{ color: brandingData.text_color }}>
                  <h2
                    className="text-xl font-semibold mb-3"
                    style={{
                      fontFamily: brandingData.heading_font,
                      color: brandingData.secondary_color,
                    }}
                  >
                    À propos
                  </h2>
                  <p className="mb-4" style={{ color: brandingData.text_color }}>
                    Ceci est un aperçu de votre thème. Les couleurs et polices s'appliquent automatiquement à l'ensemble de votre interface.
                  </p>

                  <button
                    className="px-6 py-2 rounded-lg font-medium transition-opacity hover:opacity-90"
                    style={{
                      backgroundColor: brandingData.primary_color,
                      color: '#ffffff',
                    }}
                  >
                    Bouton Principal
                  </button>

                  <button
                    className="ml-3 px-6 py-2 rounded-lg font-medium transition-opacity hover:opacity-90"
                    style={{
                      backgroundColor: brandingData.accent_color,
                      color: '#ffffff',
                    }}
                  >
                    Bouton Accent
                  </button>

                  <div className="mt-6 p-4 rounded-lg" style={{ backgroundColor: brandingData.accent_color + '20' }}>
                    <p className="text-sm" style={{ color: brandingData.secondary_color }}>
                      ✨ Les modifications sont appliquées en temps réel sur tout le système!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </form>
  );
}
