import { useState } from 'react';
import { motion } from 'framer-motion';
import { Save, Activity } from 'lucide-react';
import { FormSection } from './FormSection';
import { SimpleCheckbox } from './SimpleCheckbox';
import { SmartInput } from './SmartInput';
import { supabase } from '../../lib/supabase';
import { useToastContext } from '../../contexts/ToastContext';

interface SpinalExamFormProps {
  contactId: string;
  onSave?: () => void;
  onClose?: () => void;
}

export const SpinalExamForm = ({ contactId, onSave, onClose }: SpinalExamFormProps) => {
  const toast = useToastContext();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    bp_left_systolic: '',
    bp_left_diastolic: '',
    pulse_left: '',
    temperature_celsius: '',
    weight_kg: '',
    height_cm: '',
    rust_sign: false,
    bakody_sign: false,
    posture_notes: '',
    cervical_flexion_active: '',
    cervical_extension_active: '',
    thoracolumbar_flexion_active: '',
    thoracolumbar_extension_active: '',
    muscle_palpation_notes: '',
    has_xrays_at_clinic: false,
    xray_request: false,
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const { error } = await supabase.from('spinal_exams').insert({
        contact_id: contactId,
        owner_id: user.id,
        bp_left_systolic: formData.bp_left_systolic ? parseInt(formData.bp_left_systolic) : null,
        bp_left_diastolic: formData.bp_left_diastolic ? parseInt(formData.bp_left_diastolic) : null,
        pulse_left: formData.pulse_left ? parseInt(formData.pulse_left) : null,
        temperature_celsius: formData.temperature_celsius ? parseFloat(formData.temperature_celsius) : null,
        weight_kg: formData.weight_kg ? parseFloat(formData.weight_kg) : null,
        height_cm: formData.height_cm ? parseFloat(formData.height_cm) : null,
        cervical_flexion_active: formData.cervical_flexion_active ? parseFloat(formData.cervical_flexion_active) : null,
        cervical_extension_active: formData.cervical_extension_active ? parseFloat(formData.cervical_extension_active) : null,
        thoracolumbar_flexion_active: formData.thoracolumbar_flexion_active ? parseFloat(formData.thoracolumbar_flexion_active) : null,
        thoracolumbar_extension_active: formData.thoracolumbar_extension_active ? parseFloat(formData.thoracolumbar_extension_active) : null,
        rust_sign: formData.rust_sign,
        bakody_sign: formData.bakody_sign,
        posture_notes: formData.posture_notes,
        muscle_palpation_notes: formData.muscle_palpation_notes,
        has_xrays_at_clinic: formData.has_xrays_at_clinic,
        xray_request: formData.xray_request,
        completed: true,
        exam_date: new Date().toISOString(),
      });

      if (error) throw error;

      toast.success('Examen colonne sauvegardé avec succès');
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
          <div className="p-3 bg-orange-100 rounded-xl">
            <Activity className="w-6 h-6 text-orange-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-neutral-900">Examen Colonne Vertébrale</h2>
            <p className="text-sm text-neutral-600">Examen physique complet</p>
          </div>
        </div>
      </div>

      <FormSection icon={Activity} title="Signes Vitaux">
        <div className="grid grid-cols-2 gap-4">
          <SmartInput
            label="Tension systolique"
            type="number"
            value={formData.bp_left_systolic}
            onChange={(e) => setFormData({ ...formData, bp_left_systolic: e.target.value })}
            placeholder="120"
          />
          <SmartInput
            label="Tension diastolique"
            type="number"
            value={formData.bp_left_diastolic}
            onChange={(e) => setFormData({ ...formData, bp_left_diastolic: e.target.value })}
            placeholder="80"
          />
          <SmartInput
            label="Pouls"
            type="number"
            value={formData.pulse_left}
            onChange={(e) => setFormData({ ...formData, pulse_left: e.target.value })}
            placeholder="70"
          />
          <SmartInput
            label="Température (°C)"
            type="number"
            value={formData.temperature_celsius}
            onChange={(e) => setFormData({ ...formData, temperature_celsius: e.target.value })}
            placeholder="37.0"
          />
          <SmartInput
            label="Poids (kg)"
            type="number"
            value={formData.weight_kg}
            onChange={(e) => setFormData({ ...formData, weight_kg: e.target.value })}
            placeholder="70"
          />
          <SmartInput
            label="Taille (cm)"
            type="number"
            value={formData.height_cm}
            onChange={(e) => setFormData({ ...formData, height_cm: e.target.value })}
            placeholder="170"
          />
        </div>
      </FormSection>

      <FormSection icon={Activity} title="Observations">
        <div className="grid grid-cols-2 gap-4">
          <SimpleCheckbox
            label="Signe de Rust"
            checked={formData.rust_sign}
            onChange={(checked) => setFormData({ ...formData, rust_sign: checked })}
          />
          <SimpleCheckbox
            label="Signe de Bakody"
            checked={formData.bakody_sign}
            onChange={(checked) => setFormData({ ...formData, bakody_sign: checked })}
          />
        </div>
        <SmartInput
          label="Notes posture"
          type="textarea"
          value={formData.posture_notes}
          onChange={(e) => setFormData({ ...formData, posture_notes: e.target.value })}
          placeholder="Observations posturales..."
          rows={3}
        />
      </FormSection>

      <FormSection icon={Activity} title="Amplitudes Cervicales (°)">
        <div className="grid grid-cols-2 gap-4">
          <SmartInput
            label="Flexion active"
            type="number"
            value={formData.cervical_flexion_active}
            onChange={(e) => setFormData({ ...formData, cervical_flexion_active: e.target.value })}
            placeholder="50"
          />
          <SmartInput
            label="Extension active"
            type="number"
            value={formData.cervical_extension_active}
            onChange={(e) => setFormData({ ...formData, cervical_extension_active: e.target.value })}
            placeholder="60"
          />
        </div>
      </FormSection>

      <FormSection icon={Activity} title="Amplitudes Thoraco-lombaires (°)">
        <div className="grid grid-cols-2 gap-4">
          <SmartInput
            label="Flexion active"
            type="number"
            value={formData.thoracolumbar_flexion_active}
            onChange={(e) => setFormData({ ...formData, thoracolumbar_flexion_active: e.target.value })}
            placeholder="90"
          />
          <SmartInput
            label="Extension active"
            type="number"
            value={formData.thoracolumbar_extension_active}
            onChange={(e) => setFormData({ ...formData, thoracolumbar_extension_active: e.target.value })}
            placeholder="30"
          />
        </div>
      </FormSection>

      <FormSection icon={Activity} title="Radiographies">
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
          className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-xl font-medium hover:bg-orange-700 disabled:opacity-50"
        >
          <Save className="w-5 h-5" />
          {saving ? 'Enregistrement...' : 'Sauvegarder'}
        </motion.button>
      </div>
    </div>
  );
};
