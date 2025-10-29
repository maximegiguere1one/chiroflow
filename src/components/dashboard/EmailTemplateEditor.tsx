import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useToastContext } from '../../contexts/ToastContext';
import {
  Mail,
  Eye,
  Save,
  Send,
  X,
  Palette,
  Sparkles,
} from 'lucide-react';

interface EmailTemplate {
  id?: string;
  template_key: string;
  template_name: string;
  subject: string;
  html_content: string;
  available_variables: string[];
  description: string;
  is_active: boolean;
}

interface EmailTemplateEditorProps {
  templateKey?: string;
  onClose?: () => void;
}

const DEFAULT_TEMPLATES = {
  appointment_confirmation: {
    template_key: 'appointment_confirmation',
    template_name: 'Confirmation de rendez-vous',
    subject: 'Confirmation de votre rendez-vous',
    description: 'Envoyé automatiquement après la réservation d\'un rendez-vous',
    available_variables: ['{nom_patient}', '{date_rdv}', '{heure_rdv}', '{duree}', '{nom_clinique}', '{adresse_clinique}', '{telephone_clinique}'],
    html_content: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Confirmation de rendez-vous</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8f9fa;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f9fa; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #C9A55C 0%, #b89448 100%); padding: 40px 30px; text-align: center; border-radius: 12px 12px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">
                Rendez-vous confirmé!
              </h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.5;">
                Bonjour <strong>{nom_patient}</strong>,
              </p>

              <p style="margin: 0 0 30px 0; color: #333333; font-size: 16px; line-height: 1.5;">
                Votre rendez-vous a été confirmé avec succès.
              </p>

              <!-- Appointment Details -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
                <tr>
                  <td style="padding: 10px 0;">
                    <p style="margin: 0; color: #666666; font-size: 14px;">📅 Date</p>
                    <p style="margin: 5px 0 0 0; color: #333333; font-size: 18px; font-weight: 600;">{date_rdv}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0;">
                    <p style="margin: 0; color: #666666; font-size: 14px;">🕐 Heure</p>
                    <p style="margin: 5px 0 0 0; color: #333333; font-size: 18px; font-weight: 600;">{heure_rdv}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0;">
                    <p style="margin: 0; color: #666666; font-size: 14px;">⏱️ Durée</p>
                    <p style="margin: 5px 0 0 0; color: #333333; font-size: 18px; font-weight: 600;">{duree} minutes</p>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.5;">
                📍 <strong>{nom_clinique}</strong><br>
                {adresse_clinique}<br>
                📞 {telephone_clinique}
              </p>

              <p style="margin: 30px 0 0 0; color: #666666; font-size: 14px; line-height: 1.5;">
                Merci de votre confiance!
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-radius: 0 0 12px 12px;">
              <p style="margin: 0; color: #999999; font-size: 12px;">
                {nom_clinique} - {adresse_clinique}
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
  },
  appointment_reminder: {
    template_key: 'appointment_reminder',
    template_name: 'Rappel de rendez-vous',
    subject: 'Rappel: Rendez-vous demain',
    description: 'Rappel automatique 24h avant le rendez-vous',
    available_variables: ['{nom_patient}', '{date_rdv}', '{heure_rdv}', '{nom_clinique}', '{telephone_clinique}'],
    html_content: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Rappel de rendez-vous</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8f9fa;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f9fa; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">

          <tr>
            <td style="background: linear-gradient(135deg, #C9A55C 0%, #b89448 100%); padding: 40px 30px; text-align: center; border-radius: 12px 12px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">
                ⏰ Rappel de rendez-vous
              </h1>
            </td>
          </tr>

          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.5;">
                Bonjour <strong>{nom_patient}</strong>,
              </p>

              <p style="margin: 0 0 30px 0; color: #333333; font-size: 16px; line-height: 1.5;">
                Nous vous rappelons votre rendez-vous prévu demain:
              </p>

              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fff9e6; border-left: 4px solid #C9A55C; padding: 20px; margin-bottom: 30px;">
                <tr>
                  <td>
                    <p style="margin: 0 0 10px 0; color: #333333; font-size: 18px; font-weight: 600;">
                      📅 {date_rdv} à {heure_rdv}
                    </p>
                    <p style="margin: 0; color: #666666; font-size: 14px;">
                      {nom_clinique}<br>
                      📞 {telephone_clinique}
                    </p>
                  </td>
                </tr>
              </table>

              <p style="margin: 0; color: #666666; font-size: 14px; line-height: 1.5;">
                En cas d'empêchement, merci de nous prévenir au moins 24h à l'avance.
              </p>
            </td>
          </tr>

          <tr>
            <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-radius: 0 0 12px 12px;">
              <p style="margin: 0; color: #999999; font-size: 12px;">
                {nom_clinique}
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
  },
  waitlist_invitation: {
    template_key: 'waitlist_invitation',
    template_name: 'Invitation liste d\'attente',
    subject: '🎯 Un créneau vient de se libérer!',
    description: 'Envoyé quand un créneau se libère pour un patient en liste d\'attente',
    available_variables: ['{nom_patient}', '{date_rdv}', '{heure_rdv}', '{duree}', '{url_accepter}', '{url_refuser}', '{expiration}'],
    html_content: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Créneau disponible</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8f9fa;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f9fa; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">

          <tr>
            <td style="background: linear-gradient(135deg, #C9A55C 0%, #b89448 100%); padding: 40px 30px; text-align: center; border-radius: 12px 12px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">
                🎯 Bonne nouvelle!
              </h1>
              <p style="margin: 10px 0 0 0; color: rgba(255, 255, 255, 0.95); font-size: 16px;">
                Un rendez-vous vient de se libérer
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.5;">
                Bonjour <strong>{nom_patient}</strong>,
              </p>

              <p style="margin: 0 0 30px 0; color: #333333; font-size: 16px; line-height: 1.5;">
                Un créneau correspond à votre disponibilité:
              </p>

              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #e8f5e9; border-radius: 8px; padding: 25px; margin-bottom: 30px;">
                <tr>
                  <td style="text-align: center;">
                    <p style="margin: 0 0 10px 0; color: #2e7d32; font-size: 24px; font-weight: 600;">
                      {date_rdv}
                    </p>
                    <p style="margin: 0 0 5px 0; color: #2e7d32; font-size: 20px; font-weight: 600;">
                      {heure_rdv}
                    </p>
                    <p style="margin: 0; color: #666666; font-size: 14px;">
                      Durée: {duree} minutes
                    </p>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 30px 0; color: #d32f2f; font-size: 14px; font-weight: 600; text-align: center;">
                ⚠️ Cette offre expire dans {expiration}
              </p>

              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 20px;">
                <tr>
                  <td width="48%" align="center">
                    <a href="{url_accepter}" style="display: inline-block; padding: 15px 30px; background-color: #4caf50; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                      ✓ J'accepte
                    </a>
                  </td>
                  <td width="4%"></td>
                  <td width="48%" align="center">
                    <a href="{url_refuser}" style="display: inline-block; padding: 15px 30px; background-color: #f44336; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                      ✗ Je refuse
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-radius: 0 0 12px 12px;">
              <p style="margin: 0; color: #999999; font-size: 12px;">
                Vous recevez cet email car vous êtes sur notre liste de rappel
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
  },
};

export function EmailTemplateEditor({ templateKey, onClose }: EmailTemplateEditorProps) {
  const toast = useToastContext();
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [editedSubject, setEditedSubject] = useState('');
  const [editedContent, setEditedContent] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#C9A55C');
  const [showPreview, setShowPreview] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadTemplates();
  }, []);

  useEffect(() => {
    if (templateKey && templates.length > 0) {
      const template = templates.find(t => t.template_key === templateKey);
      if (template) {
        selectTemplate(template);
      }
    }
  }, [templateKey, templates]);

  async function loadTemplates() {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('custom_email_templates')
        .select('*')
        .eq('owner_id', user.id);

      if (error) throw error;

      const loadedTemplates = data || [];

      Object.values(DEFAULT_TEMPLATES).forEach((defaultTemplate) => {
        const exists = loadedTemplates.find(t => t.template_key === defaultTemplate.template_key);
        if (!exists) {
          loadedTemplates.push(defaultTemplate as EmailTemplate);
        }
      });

      setTemplates(loadedTemplates);

      if (loadedTemplates.length > 0 && !selectedTemplate) {
        selectTemplate(loadedTemplates[0]);
      }
    } catch (error) {
      console.error('Error loading templates:', error);
      toast.error('Erreur lors du chargement des templates');
    } finally {
      setLoading(false);
    }
  }

  function selectTemplate(template: EmailTemplate) {
    setSelectedTemplate(template);
    setEditedSubject(template.subject);
    setEditedContent(template.html_content);
  }

  function applyColor(color: string) {
    const updated = editedContent
      .replace(/#C9A55C/g, color)
      .replace(/#b89448/g, adjustBrightness(color, -10));
    setEditedContent(updated);
    setPrimaryColor(color);
  }

  function adjustBrightness(color: string, percent: number): string {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
      (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
      (B < 255 ? B < 1 ? 0 : B : 255))
      .toString(16).slice(1);
  }

  async function handleSave() {
    if (!selectedTemplate) return;

    try {
      setSaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const templateData = {
        owner_id: user.id,
        template_key: selectedTemplate.template_key,
        template_name: selectedTemplate.template_name,
        subject: editedSubject,
        html_content: editedContent,
        available_variables: selectedTemplate.available_variables,
        description: selectedTemplate.description,
        is_active: true,
      };

      const { error } = await supabase
        .from('custom_email_templates')
        .upsert(templateData, {
          onConflict: 'owner_id,template_key'
        });

      if (error) throw error;

      toast.success('Template sauvegardé!');
      await loadTemplates();
    } catch (error) {
      console.error('Error saving template:', error);
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  }

  async function handleSendTest() {
    if (!testEmail || !selectedTemplate) return;

    try {
      const testData = {
        nom_patient: 'Marie Exemple',
        date_rdv: '15 janvier 2025',
        heure_rdv: '14:30',
        duree: '30',
        nom_clinique: 'Clinique Chiropratique',
        adresse_clinique: '123 Rue Principale, Montréal',
        telephone_clinique: '(514) 555-0123',
        url_accepter: 'https://exemple.com/accepter',
        url_refuser: 'https://exemple.com/refuser',
        expiration: '2 heures',
      };

      let testContent = editedContent;
      Object.entries(testData).forEach(([key, value]) => {
        testContent = testContent.replace(new RegExp(`{${key}}`, 'g'), value);
      });

      console.log('Envoi test email à:', testEmail);
      toast.success('Email de test envoyé! (simulation)');
    } catch (error) {
      console.error('Error sending test:', error);
      toast.error('Erreur lors de l\'envoi du test');
    }
  }

  function getPreviewContent() {
    if (!selectedTemplate) return '';

    const testData = {
      nom_patient: 'Marie Exemple',
      date_rdv: '15 janvier 2025',
      heure_rdv: '14:30',
      duree: '30',
      nom_clinique: 'Clinique Chiropratique Dre Janie Leblanc',
      adresse_clinique: '123 Rue Principale, Montréal, QC',
      telephone_clinique: '(514) 555-0123',
      url_accepter: '#',
      url_refuser: '#',
      expiration: '2 heures',
    };

    let preview = editedContent;
    Object.entries(testData).forEach(([key, value]) => {
      preview = preview.replace(new RegExp(`{${key}}`, 'g'), value);
    });

    return preview;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-heading text-foreground flex items-center gap-2">
            <Mail className="w-6 h-6 text-gold-500" />
            Éditeur de Templates d'Emails
          </h2>
          <p className="text-sm text-neutral-600 mt-1">
            Personnalisez vos emails automatiques
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Template List */}
        <div className="lg:col-span-1 space-y-2">
          <h3 className="text-sm font-medium text-neutral-700 mb-3">Templates disponibles</h3>
          {templates.map((template) => (
            <button
              key={template.template_key}
              onClick={() => selectTemplate(template)}
              className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                selectedTemplate?.template_key === template.template_key
                  ? 'border-gold-500 bg-gold-50'
                  : 'border-neutral-200 hover:border-neutral-300 bg-white'
              }`}
            >
              <div className="font-medium text-foreground">{template.template_name}</div>
              <div className="text-xs text-neutral-600 mt-1">{template.description}</div>
            </button>
          ))}
        </div>

        {/* Editor */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-lifted p-6 space-y-6">
          {selectedTemplate && (
            <>
              {/* Toolbar */}
              <div className="flex flex-wrap gap-4 pb-4 border-b border-neutral-200">
                <div className="flex items-center gap-2">
                  <Palette className="w-4 h-4 text-neutral-600" />
                  <label className="text-sm font-medium text-neutral-700">Couleur:</label>
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => applyColor(e.target.value)}
                    className="w-12 h-8 rounded border border-neutral-300 cursor-pointer"
                  />
                </div>

                <button
                  onClick={() => setShowPreview(!showPreview)}
                  className="flex items-center gap-2 px-4 py-2 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  {showPreview ? 'Éditer' : 'Prévisualiser'}
                </button>

                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-gold-500 text-white rounded-lg hover:bg-gold-600 transition-colors disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Sauvegarde...' : 'Sauvegarder'}
                </button>
              </div>

              {/* Variables disponibles */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-blue-900 mb-2 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Variables disponibles
                </h4>
                <div className="flex flex-wrap gap-2">
                  {selectedTemplate.available_variables.map((variable) => (
                    <code
                      key={variable}
                      className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-mono cursor-pointer hover:bg-blue-200"
                      onClick={() => {
                        navigator.clipboard.writeText(variable);
                        toast.success('Variable copiée!');
                      }}
                    >
                      {variable}
                    </code>
                  ))}
                </div>
              </div>

              {/* Subject */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Sujet de l'email
                </label>
                <input
                  type="text"
                  value={editedSubject}
                  onChange={(e) => setEditedSubject(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                />
              </div>

              {/* Content Editor or Preview */}
              {showPreview ? (
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Prévisualisation
                  </label>
                  <div className="border border-neutral-300 rounded-lg overflow-hidden">
                    <iframe
                      srcDoc={getPreviewContent()}
                      className="w-full h-[600px]"
                      title="Email Preview"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Contenu HTML
                  </label>
                  <textarea
                    value={editedContent}
                    onChange={(e) => setEditedContent(e.target.value)}
                    className="w-full h-[500px] px-3 py-2 border border-neutral-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                  />
                </div>
              )}

              {/* Test Email */}
              <div className="pt-4 border-t border-neutral-200">
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Tester l'email
                </label>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    placeholder="votre@email.com"
                    className="flex-1 px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                  />
                  <button
                    onClick={handleSendTest}
                    disabled={!testEmail}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                    Envoyer test
                  </button>
                </div>
                <p className="text-xs text-neutral-600 mt-2">
                  Un email de test sera envoyé avec des données d'exemple
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
