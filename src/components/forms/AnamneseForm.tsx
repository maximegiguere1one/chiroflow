import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, FileText, User, Heart, Pill, Activity, AlertTriangle, Sparkles } from 'lucide-react';
import { FormSection } from './FormSection';
import { CheckboxGroup } from './CheckboxGroup';
import { RadioGroup } from './RadioGroup';
import { BodyDiagram } from './BodyDiagram';
import { SmartInput } from './SmartInput';
import { SmartTextarea } from '../common/SmartTextarea';
import { supabase } from '../../lib/supabase';
import { useToastContext } from '../../contexts/ToastContext';

interface AnamneseFormProps {
  contactId: string;
  existingFormId?: string;
  onSave?: () => void;
  onCancel?: () => void;
}

interface AnamneseData {
  contact_id: string;
  owner_id: string;
  dc_number: string;
  form_date: string;
  file_number: string;

  parent1_history: string;
  parent2_history: string;
  siblings_history: string;
  hereditary_diseases: string;

  consulted_medecin: boolean;
  consulted_dentiste: boolean;
  consulted_optometriste: boolean;
  consulted_physiotherapeute: boolean;
  consulted_other: string;

  reason_head: boolean;
  reason_cervical: boolean;
  reason_thoracique: boolean;
  reason_lombaire: boolean;
  reason_membre_inf: boolean;
  reason_membre_sup: boolean;
  reason_notes: string;

  pain_location: string;
  pain_diagram_data: any;

  has_irradiation: boolean;
  irradiation_details: string;

  onset_sudden: boolean;
  onset_gradual: boolean;
  onset_accident: boolean;
  onset_unknown: boolean;
  onset_details: string;
  onset_date: string;

  duration_acute: boolean;
  duration_subacute: boolean;
  duration_chronic: boolean;
  duration_recurrent: boolean;
  episodes_count: number | null;
  episodes_period: string;
  duration_notes: string;

  progression_better: boolean;
  progression_stable: boolean;
  progression_worse: boolean;
  progression_variable: boolean;
  progression_percentage: number | null;
  progression_period: string;
  progression_notes: string;

  pain_throbbing: boolean;
  pain_stabbing: boolean;
  pain_pinching: boolean;
  pain_stretching: boolean;
  pain_burning: boolean;
  pain_tingling: boolean;
  pain_numbness: boolean;
  pain_other: string;

  factor_ice_helps: boolean | null;
  factor_ice_worsens: boolean | null;
  factor_heat_helps: boolean | null;
  factor_heat_worsens: boolean | null;
  factor_rest_helps: boolean | null;
  factor_rest_worsens: boolean | null;
  factor_movement_details: string;
  factor_medication_details: string;

  associated_symptoms: string;
  past_episodes: boolean;
  past_treatment_received: string;
  current_treatment: string;

  [key: string]: any;
}

export function AnamneseForm({ contactId, existingFormId, onSave, onCancel }: AnamneseFormProps) {
  const toast = useToastContext();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [previousData, setPreviousData] = useState<AnamneseData | null>(null);

  const [formData, setFormData] = useState<Partial<AnamneseData>>({
    contact_id: contactId,
    form_date: new Date().toISOString().split('T')[0],
    dc_number: '',
    file_number: '',

    consulted_medecin: false,
    consulted_dentiste: false,
    consulted_optometriste: false,
    consulted_physiotherapeute: false,
    consulted_other: '',

    reason_head: false,
    reason_cervical: false,
    reason_thoracique: false,
    reason_lombaire: false,
    reason_membre_inf: false,
    reason_membre_sup: false,
    reason_notes: '',

    pain_diagram_data: { points: [] },
    has_irradiation: false,

    onset_sudden: false,
    onset_gradual: false,
    onset_accident: false,
    onset_unknown: false,

    duration_acute: false,
    duration_subacute: false,
    duration_chronic: false,
    duration_recurrent: false,

    progression_better: false,
    progression_stable: false,
    progression_worse: false,
    progression_variable: false,

    pain_throbbing: false,
    pain_stabbing: false,
    pain_pinching: false,
    pain_stretching: false,
    pain_burning: false,
    pain_tingling: false,
    pain_numbness: false,

    past_episodes: false
  });

  useEffect(() => {
    loadPreviousData();
  }, [contactId]);

  async function loadPreviousData() {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      if (existingFormId) {
        const { data, error } = await supabase
          .from('anamnese_forms')
          .select('*')
          .eq('id', existingFormId)
          .single();

        if (error) throw error;
        if (data) {
          setFormData(data);
        }
      } else {
        const { data, error } = await supabase
          .from('anamnese_forms')
          .select('*')
          .eq('contact_id', contactId)
          .eq('owner_id', user.user.id)
          .order('form_date', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (data) {
          setPreviousData(data);
        }
      }
    } catch (error) {
      console.error('Error loading previous data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    try {
      setSaving(true);
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      const saveData = {
        ...formData,
        owner_id: user.user.id,
        contact_id: contactId,
        completed: true,
        completed_at: new Date().toISOString()
      };

      if (existingFormId) {
        const { error } = await supabase
          .from('anamnese_forms')
          .update(saveData)
          .eq('id', existingFormId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('anamnese_forms')
          .insert(saveData);

        if (error) throw error;
      }

      toast.success('Formulaire d\'anamnèse sauvegardé avec succès!');
      onSave?.();
    } catch (error: any) {
      console.error('Error saving:', error);
      toast.error('Erreur lors de la sauvegarde: ' + error.message);
    } finally {
      setSaving(false);
    }
  }

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-6 rounded-t-2xl">
        <div className="flex items-center gap-3 mb-2">
          <FileText className="w-8 h-8" />
          <h1 className="text-3xl font-bold">Formulaire d'Anamnèse</h1>
        </div>
        <p className="text-blue-100">Historique complet du patient - OCQ 2023</p>

        {previousData && (
          <div className="mt-4 p-3 bg-white/20 rounded-lg flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            <span className="text-sm">
              Données de la dernière visite disponibles pour auto-remplissage
            </span>
          </div>
        )}
      </div>

      <div className="bg-white p-6 space-y-6">
        <FormSection title="Identification" icon={<User />} color="blue" required>
          <div className="grid grid-cols-3 gap-4">
            <SmartInput
              label="No de permis DC"
              value={formData.dc_number || ''}
              onChange={(v) => updateField('dc_number', v)}
              autoFillValue={previousData?.dc_number}
            />
            <SmartInput
              label="Date"
              type="date"
              value={formData.form_date || ''}
              onChange={(v) => updateField('form_date', v)}
              required
            />
            <SmartInput
              label="No de dossier"
              value={formData.file_number || ''}
              onChange={(v) => updateField('file_number', v)}
              autoFillValue={previousData?.file_number}
            />
          </div>
        </FormSection>

        <FormSection title="Histoire Médicale Familiale" icon={<Heart />} color="red">
          <div className="space-y-4">
            <SmartInput
              label="Parent 1"
              value={formData.parent1_history || ''}
              onChange={(v) => updateField('parent1_history', v)}
              placeholder="Ex: Père - hypertension, diabète"
              autoFillValue={previousData?.parent1_history}
            />
            <SmartInput
              label="Parent 2"
              value={formData.parent2_history || ''}
              onChange={(v) => updateField('parent2_history', v)}
              placeholder="Ex: Mère - arthrite, cholestérol"
              autoFillValue={previousData?.parent2_history}
            />
            <SmartInput
              label="Fratrie"
              value={formData.siblings_history || ''}
              onChange={(v) => updateField('siblings_history', v)}
              placeholder="Ex: Frère - aucun problème"
              autoFillValue={previousData?.siblings_history}
            />
            <SmartTextarea
              label="Maladie héréditaire dans la famille élargie"
              value={formData.hereditary_diseases || ''}
              onChange={(v) => updateField('hereditary_diseases', v)}
              rows={2}
              placeholder="Ex: Cancer du sein (grand-mère maternelle)"
            />
          </div>
        </FormSection>

        <FormSection title="Professionnels de la Santé Consultés" icon={<Activity />} color="green">
          <CheckboxGroup
            options={[
              { id: 'medecin', label: 'Médecin' },
              { id: 'dentiste', label: 'Dentiste' },
              { id: 'optometriste', label: 'Optométriste' },
              { id: 'physiotherapeute', label: 'Physiothérapeute' }
            ]}
            selected={[
              formData.consulted_medecin && 'medecin',
              formData.consulted_dentiste && 'dentiste',
              formData.consulted_optometriste && 'optometriste',
              formData.consulted_physiotherapeute && 'physiotherapeute'
            ].filter(Boolean) as string[]}
            onChange={(selected) => {
              updateField('consulted_medecin', selected.includes('medecin'));
              updateField('consulted_dentiste', selected.includes('dentiste'));
              updateField('consulted_optometriste', selected.includes('optometriste'));
              updateField('consulted_physiotherapeute', selected.includes('physiotherapeute'));
            }}
            columns={4}
          />
          <SmartInput
            label="Autre professionnel"
            value={formData.consulted_other || ''}
            onChange={(v) => updateField('consulted_other', v)}
            placeholder="Ex: Ostéopathe, acupuncteur..."
            className="mt-4"
          />
        </FormSection>

        <FormSection title="Motif de la Consultation" icon={<AlertTriangle />} color="amber" required>
          <CheckboxGroup
            label="Localisation de la douleur"
            options={[
              { id: 'head', label: 'Tête' },
              { id: 'cervical', label: 'Cervical' },
              { id: 'thoracique', label: 'Thoracique' },
              { id: 'lombaire', label: 'Lombaire' },
              { id: 'membre_inf', label: 'Membre inférieur' },
              { id: 'membre_sup', label: 'Membre supérieur' }
            ]}
            selected={[
              formData.reason_head && 'head',
              formData.reason_cervical && 'cervical',
              formData.reason_thoracique && 'thoracique',
              formData.reason_lombaire && 'lombaire',
              formData.reason_membre_inf && 'membre_inf',
              formData.reason_membre_sup && 'membre_sup'
            ].filter(Boolean) as string[]}
            onChange={(selected) => {
              updateField('reason_head', selected.includes('head'));
              updateField('reason_cervical', selected.includes('cervical'));
              updateField('reason_thoracique', selected.includes('thoracique'));
              updateField('reason_lombaire', selected.includes('lombaire'));
              updateField('reason_membre_inf', selected.includes('membre_inf'));
              updateField('reason_membre_sup', selected.includes('membre_sup'));
            }}
            columns={3}
            required
          />

          <SmartTextarea
            label="Notes spécifiques"
            value={formData.reason_notes || ''}
            onChange={(v) => updateField('reason_notes', v)}
            rows={3}
            placeholder="Décrivez le motif principal de consultation..."
            className="mt-4"
          />

          <div className="mt-6">
            <BodyDiagram
              label="Diagramme Corps - Zones Douloureuses"
              selectedAreas={formData.pain_diagram_data?.points || []}
              onChange={(points) =>
                updateField('pain_diagram_data', { ...formData.pain_diagram_data, points })
              }
            />
          </div>
        </FormSection>

        {/* Footer Actions */}
        <div className="flex justify-between items-center pt-6 border-t-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 border-2 border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-all font-medium"
          >
            Annuler
          </button>

          <div className="flex gap-3">
            <button
              type="button"
              className="px-6 py-3 bg-neutral-200 text-neutral-700 rounded-lg hover:bg-neutral-300 transition-all font-medium"
            >
              Sauvegarder Brouillon
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="px-8 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:shadow-lg transition-all font-semibold flex items-center gap-2 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Sauvegarde...</span>
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  <span>Sauvegarder Formulaire</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
