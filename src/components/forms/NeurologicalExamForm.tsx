import { useState } from 'react';
import { motion } from 'framer-motion';
import { Save, Brain } from 'lucide-react';
import { FormSection } from './FormSection';
import { SimpleCheckbox } from './SimpleCheckbox';
import { SmartInput } from './SmartInput';
import { RadioGroup } from './RadioGroup';
import { supabase } from '../../lib/supabase';
import { useToastContext } from '../../contexts/ToastContext';

interface NeurologicalExamFormProps {
  contactId: string;
  onSave?: () => void;
  onClose?: () => void;
}

export const NeurologicalExamForm = ({ contactId, onSave, onClose }: NeurologicalExamFormProps) => {
  const toast = useToastContext();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    headaches: false,
    dizziness: false,
    weakness: false,
    numbness: false,
    other_indications: '',
    patient_confused: false,
    patient_incoherent: false,
    dysarthria: false,
    consciousness_alert: true,
    orientation_temporal: 'N' as 'N' | 'AN',
    orientation_spatial: 'N' as 'N' | 'AN',
    concentration: 'N' as 'N' | 'AN',
    memory_short_term: 'N' as 'N' | 'AN',
    memory_long_term: 'N' as 'N' | 'AN',
    language_fluent: true,
    autonomy_level: 'autonome' as 'autonome' | 'assistance_certaines_taches' | 'assistance_hebdomadaire' | 'assistance_quotidienne' | 'peu_autonome',
    additional_notes: '',
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const { error } = await supabase.from('neurological_exams').insert({
        contact_id: contactId,
        owner_id: user.id,
        ...formData,
        completed: true,
        exam_date: new Date().toISOString(),
      });

      if (error) throw error;

      toast.success('Examen neurologique sauvegardé avec succès');
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
          <div className="p-3 bg-purple-100 rounded-xl">
            <Brain className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-neutral-900">Examen Neurologique</h2>
            <p className="text-sm text-neutral-600">Évaluation neurologique détaillée</p>
          </div>
        </div>
      </div>

      <FormSection icon={Brain} title="Indications Examen">
        <div className="grid grid-cols-2 gap-4">
          <SimpleCheckbox
            label="Céphalées"
            checked={formData.headaches}
            onChange={(checked) => setFormData({ ...formData, headaches: checked })}
          />
          <SimpleCheckbox
            label="Étourdissements"
            checked={formData.dizziness}
            onChange={(checked) => setFormData({ ...formData, dizziness: checked })}
          />
          <SimpleCheckbox
            label="Faiblesse"
            checked={formData.weakness}
            onChange={(checked) => setFormData({ ...formData, weakness: checked })}
          />
          <SimpleCheckbox
            label="Engourdissement"
            checked={formData.numbness}
            onChange={(checked) => setFormData({ ...formData, numbness: checked })}
          />
        </div>
        <SmartInput
          label="Autres indications"
          type="textarea"
          value={formData.other_indications}
          onChange={(e) => setFormData({ ...formData, other_indications: e.target.value })}
          placeholder="Autres raisons pour l'examen..."
          rows={2}
        />
      </FormSection>

      <FormSection icon={Brain} title="Observations">
        <div className="grid grid-cols-2 gap-4">
          <SimpleCheckbox
            label="Patient confus"
            checked={formData.patient_confused}
            onChange={(checked) => setFormData({ ...formData, patient_confused: checked })}
          />
          <SimpleCheckbox
            label="Patient incohérent"
            checked={formData.patient_incoherent}
            onChange={(checked) => setFormData({ ...formData, patient_incoherent: checked })}
          />
          <SimpleCheckbox
            label="Dysarthrie"
            checked={formData.dysarthria}
            onChange={(checked) => setFormData({ ...formData, dysarthria: checked })}
          />
          <SimpleCheckbox
            label="Alerte"
            checked={formData.consciousness_alert}
            onChange={(checked) => setFormData({ ...formData, consciousness_alert: checked })}
          />
        </div>
      </FormSection>

      <FormSection icon={Brain} title="État Mental">
        <div className="space-y-4">
          <RadioGroup
            label="Orientation temporelle"
            options={[
              { value: 'N', label: 'Normal' },
              { value: 'AN', label: 'Anormal' },
            ]}
            value={formData.orientation_temporal}
            onChange={(value) => setFormData({ ...formData, orientation_temporal: value as 'N' | 'AN' })}
          />
          <RadioGroup
            label="Orientation spatiale"
            options={[
              { value: 'N', label: 'Normal' },
              { value: 'AN', label: 'Anormal' },
            ]}
            value={formData.orientation_spatial}
            onChange={(value) => setFormData({ ...formData, orientation_spatial: value as 'N' | 'AN' })}
          />
          <RadioGroup
            label="Concentration"
            options={[
              { value: 'N', label: 'Normal' },
              { value: 'AN', label: 'Anormal' },
            ]}
            value={formData.concentration}
            onChange={(value) => setFormData({ ...formData, concentration: value as 'N' | 'AN' })}
          />
          <RadioGroup
            label="Mémoire court terme"
            options={[
              { value: 'N', label: 'Normal' },
              { value: 'AN', label: 'Anormal' },
            ]}
            value={formData.memory_short_term}
            onChange={(value) => setFormData({ ...formData, memory_short_term: value as 'N' | 'AN' })}
          />
          <RadioGroup
            label="Mémoire long terme"
            options={[
              { value: 'N', label: 'Normal' },
              { value: 'AN', label: 'Anormal' },
            ]}
            value={formData.memory_long_term}
            onChange={(value) => setFormData({ ...formData, memory_long_term: value as 'N' | 'AN' })}
          />
        </div>
      </FormSection>

      <FormSection icon={Brain} title="Langage">
        <SimpleCheckbox
          label="Langage fluide"
          checked={formData.language_fluent}
          onChange={(checked) => setFormData({ ...formData, language_fluent: checked })}
        />
      </FormSection>

      <FormSection icon={Brain} title="Autonomie">
        <RadioGroup
          label="Niveau d'autonomie"
          options={[
            { value: 'autonome', label: 'Autonome' },
            { value: 'assistance_certaines_taches', label: 'Assistance certaines tâches' },
            { value: 'assistance_hebdomadaire', label: 'Assistance hebdomadaire' },
            { value: 'assistance_quotidienne', label: 'Assistance quotidienne' },
            { value: 'peu_autonome', label: 'Peu autonome' },
          ]}
          value={formData.autonomy_level}
          onChange={(value) => setFormData({ ...formData, autonomy_level: value as any })}
        />
      </FormSection>

      <FormSection icon={Brain} title="Notes Additionnelles">
        <SmartInput
          label="Observations complémentaires"
          type="textarea"
          value={formData.additional_notes}
          onChange={(e) => setFormData({ ...formData, additional_notes: e.target.value })}
          placeholder="Autres observations..."
          rows={4}
        />
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
          className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 disabled:opacity-50"
        >
          <Save className="w-5 h-5" />
          {saving ? 'Enregistrement...' : 'Sauvegarder'}
        </motion.button>
      </div>
    </div>
  );
};
