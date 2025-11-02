import { useState } from 'react';
import { motion } from 'framer-motion';
import { Save, Video } from 'lucide-react';
import { FormSection } from './FormSection';
import { SimpleCheckbox } from './SimpleCheckbox';
import { SmartInput } from './SmartInput';
import { supabase } from '../../lib/supabase';
import { useToastContext } from '../../contexts/ToastContext';

interface TeleconsultationConsentFormProps {
  contactId: string;
  onSave?: () => void;
  onClose?: () => void;
}

export const TeleconsultationConsentForm = ({ contactId, onSave, onClose }: TeleconsultationConsentFormProps) => {
  const toast = useToastContext();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    patient_name: '',
    chiropractor_name: '',
    technologies_used: 'Zoom, Microsoft Teams, Google Meet',
    emergency_contact_1_name: '',
    emergency_contact_1_relationship: '',
    emergency_contact_1_phone: '',
    emergency_contact_2_name: '',
    emergency_contact_2_relationship: '',
    emergency_contact_2_phone: '',
    understands_risks: false,
    understands_limits: false,
    understands_recording_rules: false,
    understands_tech_failure_procedure: false,
    understands_emergency_procedure: false,
  });

  const handleSave = async () => {
    if (!formData.patient_name || !formData.chiropractor_name) {
      toast.error('Veuillez remplir les noms requis');
      return;
    }

    if (!formData.understands_risks || !formData.understands_limits) {
      toast.error('Veuillez accepter tous les consentements requis');
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const { error } = await supabase.from('teleconsultation_consents').insert({
        contact_id: contactId,
        owner_id: user.id,
        ...formData,
        is_valid: true,
        consent_date: new Date().toISOString(),
      });

      if (error) throw error;

      toast.success('Consentement téléconsultation sauvegardé');
      onSave?.();
      onClose?.();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-100 rounded-xl">
            <Video className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-neutral-900">Consentement Téléconsultation</h2>
            <p className="text-sm text-neutral-600">Formulaire de consentement éclairé</p>
          </div>
        </div>
      </div>

      <FormSection icon={Video} title="Informations">
        <div className="grid grid-cols-2 gap-4">
          <SmartInput
            label="Nom du patient *"
            value={formData.patient_name}
            onChange={(e) => setFormData({ ...formData, patient_name: e.target.value })}
            placeholder="Nom complet"
            required
          />
          <SmartInput
            label="Nom du chiropraticien *"
            value={formData.chiropractor_name}
            onChange={(e) => setFormData({ ...formData, chiropractor_name: e.target.value })}
            placeholder="Dr. Nom"
            required
          />
        </div>
        <SmartInput
          label="Technologies utilisées"
          value={formData.technologies_used}
          onChange={(e) => setFormData({ ...formData, technologies_used: e.target.value })}
          placeholder="Ex: Zoom, Microsoft Teams"
        />
      </FormSection>

      <FormSection icon={Video} title="Contacts d'Urgence">
        <div className="space-y-4">
          <div className="p-4 bg-neutral-50 rounded-xl space-y-3">
            <h4 className="font-medium text-neutral-900">Contact #1</h4>
            <div className="grid grid-cols-3 gap-3">
              <SmartInput
                label="Nom"
                value={formData.emergency_contact_1_name}
                onChange={(e) => setFormData({ ...formData, emergency_contact_1_name: e.target.value })}
                placeholder="Nom complet"
              />
              <SmartInput
                label="Relation"
                value={formData.emergency_contact_1_relationship}
                onChange={(e) => setFormData({ ...formData, emergency_contact_1_relationship: e.target.value })}
                placeholder="Ex: Conjoint"
              />
              <SmartInput
                label="Téléphone"
                value={formData.emergency_contact_1_phone}
                onChange={(e) => setFormData({ ...formData, emergency_contact_1_phone: e.target.value })}
                placeholder="514-xxx-xxxx"
              />
            </div>
          </div>

          <div className="p-4 bg-neutral-50 rounded-xl space-y-3">
            <h4 className="font-medium text-neutral-900">Contact #2 (optionnel)</h4>
            <div className="grid grid-cols-3 gap-3">
              <SmartInput
                label="Nom"
                value={formData.emergency_contact_2_name}
                onChange={(e) => setFormData({ ...formData, emergency_contact_2_name: e.target.value })}
                placeholder="Nom complet"
              />
              <SmartInput
                label="Relation"
                value={formData.emergency_contact_2_relationship}
                onChange={(e) => setFormData({ ...formData, emergency_contact_2_relationship: e.target.value })}
                placeholder="Ex: Parent"
              />
              <SmartInput
                label="Téléphone"
                value={formData.emergency_contact_2_phone}
                onChange={(e) => setFormData({ ...formData, emergency_contact_2_phone: e.target.value })}
                placeholder="514-xxx-xxxx"
              />
            </div>
          </div>
        </div>
      </FormSection>

      <FormSection icon={Video} title="Consentements Requis">
        <div className="space-y-3">
          <SimpleCheckbox
            label="Je comprends les risques liés à la téléconsultation *"
            checked={formData.understands_risks}
            onChange={(checked) => setFormData({ ...formData, understands_risks: checked })}
          />
          <SimpleCheckbox
            label="Je comprends les limites de la téléconsultation *"
            checked={formData.understands_limits}
            onChange={(checked) => setFormData({ ...formData, understands_limits: checked })}
          />
          <SimpleCheckbox
            label="Je comprends les règles d'enregistrement"
            checked={formData.understands_recording_rules}
            onChange={(checked) => setFormData({ ...formData, understands_recording_rules: checked })}
          />
          <SimpleCheckbox
            label="Je comprends la procédure en cas de défaillance technique"
            checked={formData.understands_tech_failure_procedure}
            onChange={(checked) => setFormData({ ...formData, understands_tech_failure_procedure: checked })}
          />
          <SimpleCheckbox
            label="Je comprends la procédure en cas d'urgence"
            checked={formData.understands_emergency_procedure}
            onChange={(checked) => setFormData({ ...formData, understands_emergency_procedure: checked })}
          />
        </div>
      </FormSection>

      <div className="flex gap-4 pt-6 border-t border-neutral-200">
        {onClose && (
          <button
            onClick={onClose}
            className="px-6 py-3 border-2 border-neutral-200 rounded-xl font-medium hover:bg-neutral-50"
          >
            Annuler
          </button>
        )}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSave}
          disabled={saving}
          className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 disabled:opacity-50"
        >
          <Save className="w-5 h-5" />
          {saving ? 'Enregistrement...' : 'Sauvegarder Consentement'}
        </motion.button>
      </div>
    </div>
  );
};
