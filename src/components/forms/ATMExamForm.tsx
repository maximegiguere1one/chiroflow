import { useState } from 'react';
import { motion } from 'framer-motion';
import { Save, Bone } from 'lucide-react';
import { FormSection } from './FormSection';
import { SimpleCheckbox } from './SimpleCheckbox';
import { SmartInput } from './SmartInput';
import { supabase } from '../../lib/supabase';
import { useToastContext } from '../../contexts/ToastContext';

interface ATMExamFormProps {
  contactId: string;
  onSave?: () => void;
  onClose?: () => void;
}

export const ATMExamForm = ({ contactId, onSave, onClose }: ATMExamFormProps) => {
  const toast = useToastContext();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    mouth_opening_normal: false,
    mouth_opening_mm: '',
    mandibular_2mm_deviation: false,
    occlusion_normal: false,
    palpation_left_pain: false,
    palpation_right_pain: false,
    palpation_notes: '',
    muscle_palpation_notes: '',
    has_xrays_at_clinic: false,
    xray_request: false,
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const { error } = await supabase.from('atm_exams').insert({
        contact_id: contactId,
        owner_id: user.id,
        ...formData,
        mouth_opening_mm: formData.mouth_opening_mm ? parseFloat(formData.mouth_opening_mm) : null,
        completed: true,
        exam_date: new Date().toISOString(),
      });

      if (error) throw error;

      toast.success('Examen ATM sauvegardé avec succès');
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
          <div className="p-3 bg-green-100 rounded-xl">
            <Bone className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-neutral-900">Examen ATM</h2>
            <p className="text-sm text-neutral-600">Articulation temporo-mandibulaire</p>
          </div>
        </div>
      </div>

      <FormSection icon={Bone} title="Ouverture Buccale">
        <SimpleCheckbox
          label="Ouverture normale"
          checked={formData.mouth_opening_normal}
          onChange={(checked) => setFormData({ ...formData, mouth_opening_normal: checked })}
        />
        <SmartInput
          label="Ouverture (mm)"
          type="number"
          value={formData.mouth_opening_mm}
          onChange={(e) => setFormData({ ...formData, mouth_opening_mm: e.target.value })}
          placeholder="45-50 mm normal"
        />
      </FormSection>

      <FormSection icon={Bone} title="Démarche Mandibulaire">
        <SimpleCheckbox
          label="Déviation >2mm"
          checked={formData.mandibular_2mm_deviation}
          onChange={(checked) => setFormData({ ...formData, mandibular_2mm_deviation: checked })}
        />
      </FormSection>

      <FormSection icon={Bone} title="Occlusion/Dentition">
        <SimpleCheckbox
          label="Occlusion normale"
          checked={formData.occlusion_normal}
          onChange={(checked) => setFormData({ ...formData, occlusion_normal: checked })}
        />
      </FormSection>

      <FormSection icon={Bone} title="Palpation ATM">
        <div className="grid grid-cols-2 gap-4">
          <SimpleCheckbox
            label="Douleur gauche"
            checked={formData.palpation_left_pain}
            onChange={(checked) => setFormData({ ...formData, palpation_left_pain: checked })}
          />
          <SimpleCheckbox
            label="Douleur droite"
            checked={formData.palpation_right_pain}
            onChange={(checked) => setFormData({ ...formData, palpation_right_pain: checked })}
          />
        </div>
        <SmartInput
          label="Notes palpation"
          type="textarea"
          value={formData.palpation_notes}
          onChange={(e) => setFormData({ ...formData, palpation_notes: e.target.value })}
          placeholder="Observations détaillées..."
          rows={3}
        />
      </FormSection>

      <FormSection icon={Bone} title="Radiographies">
        <div className="grid grid-cols-2 gap-4">
          <SimpleCheckbox
            label="Radio à la clinique"
            checked={formData.has_xrays_at_clinic}
            onChange={(checked) => setFormData({ ...formData, has_xrays_at_clinic: checked })}
          />
          <SimpleCheckbox
            label="Demande radio"
            checked={formData.xray_request}
            onChange={(checked) => setFormData({ ...formData, xray_request: checked })}
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
          className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 disabled:opacity-50"
        >
          <Save className="w-5 h-5" />
          {saving ? 'Enregistrement...' : 'Sauvegarder'}
        </motion.button>
      </div>
    </div>
  );
};
