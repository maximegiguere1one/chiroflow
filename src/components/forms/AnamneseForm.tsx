import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, FileText, User, Heart, Pill, Activity, AlertTriangle, Sparkles, Clock } from 'lucide-react';
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
        <FormSection title="Identification" icon={User} color="blue" required>
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

        <FormSection title="Histoire Médicale Familiale" icon={Heart} color="red">
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

        <FormSection title="Professionnels de la Santé Consultés" icon={Activity} color="green">
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

        <FormSection title="Motif de la Consultation" icon={AlertTriangle} color="amber" required>
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

          <div className="mt-6">
            <RadioGroup
              label="Irradiation de la douleur"
              options={[
                { id: 'no', label: 'Non' },
                { id: 'yes', label: 'Oui' }
              ]}
              selected={formData.has_irradiation ? 'yes' : 'no'}
              onChange={(v) => updateField('has_irradiation', v === 'yes')}
              columns={2}
            />
            {formData.has_irradiation && (
              <SmartTextarea
                label="Détails irradiation"
                value={formData.irradiation_details || ''}
                onChange={(v) => updateField('irradiation_details', v)}
                rows={2}
                placeholder="Décrivez où la douleur irradie..."
                className="mt-4"
              />
            )}
          </div>
        </FormSection>

        <FormSection title="Circonstance de Survenue" icon={AlertTriangle} color="amber" required>
          <CheckboxGroup
            label="Comment est apparue la douleur?"
            options={[
              { id: 'sudden', label: 'Soudainement', sublabel: 'Apparition brutale' },
              { id: 'gradual', label: 'Graduellement', sublabel: 'Apparition progressive' },
              { id: 'accident', label: 'Suite à un accident/Traumatisme' },
              { id: 'unknown', label: 'Cause inconnue' }
            ]}
            selected={[
              formData.onset_sudden && 'sudden',
              formData.onset_gradual && 'gradual',
              formData.onset_accident && 'accident',
              formData.onset_unknown && 'unknown'
            ].filter(Boolean) as string[]}
            onChange={(selected) => {
              updateField('onset_sudden', selected.includes('sudden'));
              updateField('onset_gradual', selected.includes('gradual'));
              updateField('onset_accident', selected.includes('accident'));
              updateField('onset_unknown', selected.includes('unknown'));
            }}
            columns={2}
          />

          <div className="grid grid-cols-2 gap-4 mt-4">
            <SmartInput
              label="Date de début"
              type="date"
              value={formData.onset_date || ''}
              onChange={(v) => updateField('onset_date', v)}
            />
            <SmartTextarea
              label="Précisions"
              value={formData.onset_details || ''}
              onChange={(v) => updateField('onset_details', v)}
              rows={2}
              placeholder="Ex: En soulevant une boîte..."
            />
          </div>
        </FormSection>

        <FormSection title="Durée / Fréquence" icon={Clock} color="blue">
          <CheckboxGroup
            label="Type de problème"
            options={[
              { id: 'acute', label: 'Aigu', sublabel: '< 6 semaines' },
              { id: 'subacute', label: 'Sub aigu', sublabel: '6-12 semaines' },
              { id: 'chronic', label: 'Chronique', sublabel: '> 12 semaines' },
              { id: 'recurrent', label: 'Récurrent', sublabel: 'Épisodes répétés' }
            ]}
            selected={[
              formData.duration_acute && 'acute',
              formData.duration_subacute && 'subacute',
              formData.duration_chronic && 'chronic',
              formData.duration_recurrent && 'recurrent'
            ].filter(Boolean) as string[]}
            onChange={(selected) => {
              updateField('duration_acute', selected.includes('acute'));
              updateField('duration_subacute', selected.includes('subacute'));
              updateField('duration_chronic', selected.includes('chronic'));
              updateField('duration_recurrent', selected.includes('recurrent'));
            }}
            columns={4}
          />

          {formData.duration_recurrent && (
            <div className="grid grid-cols-3 gap-4 mt-4">
              <SmartInput
                label="Nombre d'épisodes"
                type="number"
                value={formData.episodes_count?.toString() || ''}
                onChange={(v) => updateField('episodes_count', v ? parseInt(v) : null)}
                min={0}
              />
              <SmartInput
                label="Période"
                value={formData.episodes_period || ''}
                onChange={(v) => updateField('episodes_period', v)}
                placeholder="Ex: par mois, par année"
              />
              <SmartTextarea
                label="Notes"
                value={formData.duration_notes || ''}
                onChange={(v) => updateField('duration_notes', v)}
                rows={1}
              />
            </div>
          )}
        </FormSection>

        <FormSection title="Progression" icon={Activity} color="green">
          <RadioGroup
            label="Évolution du problème"
            options={[
              { id: 'better', label: 'Mieux', sublabel: 'S\'améliore' },
              { id: 'stable', label: 'Stable', sublabel: 'Aucun changement' },
              { id: 'worse', label: 'Pire', sublabel: 'Se détériore' },
              { id: 'variable', label: 'Variable', sublabel: 'Fluctue' }
            ]}
            selected={
              formData.progression_better ? 'better' :
              formData.progression_stable ? 'stable' :
              formData.progression_worse ? 'worse' :
              formData.progression_variable ? 'variable' : ''
            }
            onChange={(v) => {
              updateField('progression_better', v === 'better');
              updateField('progression_stable', v === 'stable');
              updateField('progression_worse', v === 'worse');
              updateField('progression_variable', v === 'variable');
            }}
            columns={4}
          />

          <div className="grid grid-cols-3 gap-4 mt-4">
            <SmartInput
              label="Pourcentage changement"
              type="number"
              value={formData.progression_percentage?.toString() || ''}
              onChange={(v) => updateField('progression_percentage', v ? parseInt(v) : null)}
              min={0}
              max={100}
              placeholder="Ex: 30%"
            />
            <SmartInput
              label="Sur quelle période"
              value={formData.progression_period || ''}
              onChange={(v) => updateField('progression_period', v)}
              placeholder="Ex: dernière semaine"
            />
            <SmartTextarea
              label="Notes"
              value={formData.progression_notes || ''}
              onChange={(v) => updateField('progression_notes', v)}
              rows={1}
            />
          </div>
        </FormSection>

        <FormSection title="Caractère / Intensité de la Douleur" icon={AlertTriangle} color="red">
          <CheckboxGroup
            label="Type de douleur (plusieurs choix possibles)"
            options={[
              { id: 'throbbing', label: 'Élancement', sublabel: 'Pulsation' },
              { id: 'stabbing', label: 'Coup de poignard', sublabel: 'Aiguë' },
              { id: 'pinching', label: 'Pincement' },
              { id: 'stretching', label: 'Étirement' },
              { id: 'burning', label: 'Chaleur / Brûlure' },
              { id: 'tingling', label: 'Picotement' },
              { id: 'numbness', label: 'Engourdissement' }
            ]}
            selected={[
              formData.pain_throbbing && 'throbbing',
              formData.pain_stabbing && 'stabbing',
              formData.pain_pinching && 'pinching',
              formData.pain_stretching && 'stretching',
              formData.pain_burning && 'burning',
              formData.pain_tingling && 'tingling',
              formData.pain_numbness && 'numbness'
            ].filter(Boolean) as string[]}
            onChange={(selected) => {
              updateField('pain_throbbing', selected.includes('throbbing'));
              updateField('pain_stabbing', selected.includes('stabbing'));
              updateField('pain_pinching', selected.includes('pinching'));
              updateField('pain_stretching', selected.includes('stretching'));
              updateField('pain_burning', selected.includes('burning'));
              updateField('pain_tingling', selected.includes('tingling'));
              updateField('pain_numbness', selected.includes('numbness'));
            }}
            columns={3}
          />

          <SmartInput
            label="Autre type de douleur"
            value={formData.pain_other || ''}
            onChange={(v) => updateField('pain_other', v)}
            placeholder="Décrivez si autre type..."
            className="mt-4"
          />
        </FormSection>

        <FormSection title="Facteurs Aggravants (+) et Atténuants (-)" icon={Activity} color="blue">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-3">
                Glace
              </label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    updateField('factor_ice_helps', formData.factor_ice_helps ? null : true);
                    updateField('factor_ice_worsens', null);
                  }}
                  className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                    formData.factor_ice_helps === true
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-neutral-200 hover:border-neutral-300'
                  }`}
                >
                  <span className="font-medium">+ Aide</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    updateField('factor_ice_worsens', formData.factor_ice_worsens ? null : true);
                    updateField('factor_ice_helps', null);
                  }}
                  className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                    formData.factor_ice_worsens === true
                      ? 'border-red-500 bg-red-50 text-red-700'
                      : 'border-neutral-200 hover:border-neutral-300'
                  }`}
                >
                  <span className="font-medium">- Empire</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-3">
                Chaleur
              </label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    updateField('factor_heat_helps', formData.factor_heat_helps ? null : true);
                    updateField('factor_heat_worsens', null);
                  }}
                  className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                    formData.factor_heat_helps === true
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-neutral-200 hover:border-neutral-300'
                  }`}
                >
                  <span className="font-medium">+ Aide</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    updateField('factor_heat_worsens', formData.factor_heat_worsens ? null : true);
                    updateField('factor_heat_helps', null);
                  }}
                  className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                    formData.factor_heat_worsens === true
                      ? 'border-red-500 bg-red-50 text-red-700'
                      : 'border-neutral-200 hover:border-neutral-300'
                  }`}
                >
                  <span className="font-medium">- Empire</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-3">
                Repos
              </label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    updateField('factor_rest_helps', formData.factor_rest_helps ? null : true);
                    updateField('factor_rest_worsens', null);
                  }}
                  className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                    formData.factor_rest_helps === true
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-neutral-200 hover:border-neutral-300'
                  }`}
                >
                  <span className="font-medium">+ Aide</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    updateField('factor_rest_worsens', formData.factor_rest_worsens ? null : true);
                    updateField('factor_rest_helps', null);
                  }}
                  className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                    formData.factor_rest_worsens === true
                      ? 'border-red-500 bg-red-50 text-red-700'
                      : 'border-neutral-200 hover:border-neutral-300'
                  }`}
                >
                  <span className="font-medium">- Empire</span>
                </button>
              </div>
            </div>

            <SmartTextarea
              label="Mouvements (précisez lesquels aident ou empirent)"
              value={formData.factor_movement_details || ''}
              onChange={(v) => updateField('factor_movement_details', v)}
              rows={2}
              placeholder="Ex: Flexion empire, extension aide..."
            />

            <SmartTextarea
              label="Médication (précisez laquelle aide)"
              value={formData.factor_medication_details || ''}
              onChange={(v) => updateField('factor_medication_details', v)}
              rows={2}
              placeholder="Ex: Advil aide temporairement..."
            />
          </div>
        </FormSection>

        <FormSection title="Médication et Suppléments" icon={Pill} color="purple">
          <CheckboxGroup
            label="Médication actuelle"
            options={[
              { id: 'tylenol', label: 'Tylenol' },
              { id: 'aspirin', label: 'Aspirine' },
              { id: 'ains', label: 'Ains / Relaxants musculaires / Analgésiques' },
              { id: 'opioids', label: 'Opioïdes' },
              { id: 'hta', label: 'HTA (Hypertension)' },
              { id: 'cholesterol', label: 'Cholestérol' },
              { id: 'anxiolytics', label: 'Anxiolytiques' },
              { id: 'antidepressants', label: 'Anti-dépresseurs' },
              { id: 'diabetes', label: 'Diabète' },
              { id: 'injection', label: 'Médicament en injection' },
              { id: 'calcium', label: 'Calcium / Vitamine D' },
              { id: 'otc', label: 'Médicaments en vente libre' },
              { id: 'contraceptives', label: 'Contraceptifs hormonaux' },
              { id: 'infiltration', label: 'Infiltration' },
              { id: 'anticoagulant', label: 'Anti coagulant / Anti plaquettaire' }
            ]}
            selected={[
              (formData as any).takes_tylenol && 'tylenol',
              (formData as any).takes_aspirin && 'aspirin',
              (formData as any).takes_ains && 'ains',
              (formData as any).takes_opioids && 'opioids',
              (formData as any).takes_hta && 'hta',
              (formData as any).takes_cholesterol && 'cholesterol',
              (formData as any).takes_anxiolytics && 'anxiolytics',
              (formData as any).takes_antidepressants && 'antidepressants',
              (formData as any).takes_diabetes && 'diabetes',
              (formData as any).takes_injection_meds && 'injection',
              (formData as any).takes_calcium_vitd && 'calcium',
              (formData as any).takes_otc && 'otc',
              (formData as any).takes_contraceptives && 'contraceptives',
              (formData as any).takes_infiltration && 'infiltration',
              (formData as any).takes_anticoagulant && 'anticoagulant'
            ].filter(Boolean) as string[]}
            onChange={(selected) => {
              updateField('takes_tylenol', selected.includes('tylenol'));
              updateField('takes_aspirin', selected.includes('aspirin'));
              updateField('takes_ains', selected.includes('ains'));
              updateField('takes_opioids', selected.includes('opioids'));
              updateField('takes_hta', selected.includes('hta'));
              updateField('takes_cholesterol', selected.includes('cholesterol'));
              updateField('takes_anxiolytics', selected.includes('anxiolytics'));
              updateField('takes_antidepressants', selected.includes('antidepressants'));
              updateField('takes_diabetes', selected.includes('diabetes'));
              updateField('takes_injection_meds', selected.includes('injection'));
              updateField('takes_calcium_vitd', selected.includes('calcium'));
              updateField('takes_otc', selected.includes('otc'));
              updateField('takes_contraceptives', selected.includes('contraceptives'));
              updateField('takes_infiltration', selected.includes('infiltration'));
              updateField('takes_anticoagulant', selected.includes('anticoagulant'));
            }}
            columns={3}
          />

          <div className="grid grid-cols-2 gap-4 mt-6">
            <SmartTextarea
              label="Médication cessée récemment"
              value={(formData as any).medication_stopped_recently || ''}
              onChange={(v) => updateField('medication_stopped_recently', v)}
              rows={2}
              placeholder="Ex: Arrêt Advil il y a 2 semaines..."
            />
            <SmartTextarea
              label="Autres médicaments"
              value={(formData as any).medication_other || ''}
              onChange={(v) => updateField('medication_other', v)}
              rows={2}
              placeholder="Précisez autres médicaments..."
            />
          </div>
        </FormSection>

        <FormSection title="Habitudes de Vie" icon={Activity} color="green">
          <div className="space-y-6">
            <div>
              <RadioGroup
                label="Niveau d'activité sportive"
                options={[
                  { id: 'tres_actif', label: 'TRÈS ACTIF', sublabel: '+ 300 min/sem modérée ou + 150 min/sem intense' },
                  { id: 'actif', label: 'ACTIF', sublabel: '150 min/sem modéré ou 75-150 min/sem intense' },
                  { id: 'sedentaire', label: 'SÉDENTAIRE', sublabel: '- de 150 min/sem modérée et - de 75 min/sem intense' }
                ]}
                selected={(formData as any).activity_level || ''}
                onChange={(v) => updateField('activity_level', v)}
                columns={1}
              />
              <SmartTextarea
                label="Activités principales"
                value={(formData as any).main_activities || ''}
                onChange={(v) => updateField('main_activities', v)}
                rows={2}
                placeholder="Ex: Course 3×/semaine, yoga..."
                className="mt-4"
                autoFillValue={previousData?.main_activities}
              />
            </div>

            <div className="border-t-2 border-neutral-200 pt-6">
              <h4 className="font-semibold text-neutral-900 mb-4">Sommeil</h4>
              <div className="grid grid-cols-2 gap-4">
                <RadioGroup
                  label="Qualité sommeil"
                  options={[
                    { id: 'restorative', label: 'Sommeil réparateur' },
                    { id: 'insomnia', label: 'Insomnie' }
                  ]}
                  selected={(formData as any).sleep_restorative ? 'restorative' : (formData as any).sleep_insomnia ? 'insomnia' : ''}
                  onChange={(v) => {
                    updateField('sleep_restorative', v === 'restorative');
                    updateField('sleep_insomnia', v === 'insomnia');
                  }}
                  columns={2}
                />
                <SmartInput
                  label="Heures de sommeil par nuit"
                  type="number"
                  value={(formData as any).sleep_hours_per_night?.toString() || ''}
                  onChange={(v) => updateField('sleep_hours_per_night', v ? parseFloat(v) : null)}
                  min={0}
                  max={24}
                  step={0.5}
                  placeholder="Ex: 7.5"
                />
              </div>

              <RadioGroup
                label="Position de sommeil"
                options={[
                  { id: 'dos', label: 'Dos' },
                  { id: 'ventre', label: 'Ventre' },
                  { id: 'cote', label: 'Côté' },
                  { id: 'variable', label: 'Variable' }
                ]}
                selected={(formData as any).sleep_position || ''}
                onChange={(v) => updateField('sleep_position', v)}
                columns={4}
                className="mt-4"
              />

              <div className="mt-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={(formData as any).sleep_pain_wakes || false}
                    onChange={(e) => updateField('sleep_pain_wakes', e.target.checked)}
                    className="w-4 h-4 rounded border-neutral-300"
                  />
                  <span className="text-sm font-medium text-neutral-700">
                    Douleur qui réveille la nuit
                  </span>
                </label>
                {(formData as any).sleep_pain_wakes && (
                  <SmartTextarea
                    label="Détails"
                    value={(formData as any).sleep_pain_details || ''}
                    onChange={(v) => updateField('sleep_pain_details', v)}
                    rows={2}
                    className="mt-3"
                  />
                )}
              </div>
            </div>

            <div className="border-t-2 border-neutral-200 pt-6">
              <h4 className="font-semibold text-neutral-900 mb-4">Occupation / Travail</h4>
              <CheckboxGroup
                options={[
                  { id: 'study', label: 'Étude' },
                  { id: 'work_full', label: 'Travail temps plein' },
                  { id: 'work_part', label: 'Travail temps partiel' }
                ]}
                selected={[
                  (formData as any).occupation_study && 'study',
                  (formData as any).occupation_fulltime && 'work_full',
                  (formData as any).occupation_parttime && 'work_part'
                ].filter(Boolean) as string[]}
                onChange={(selected) => {
                  updateField('occupation_study', selected.includes('study'));
                  updateField('occupation_fulltime', selected.includes('work_full'));
                  updateField('occupation_parttime', selected.includes('work_part'));
                }}
                columns={3}
              />

              <div className="grid grid-cols-2 gap-4 mt-4">
                <SmartTextarea
                  label="Postures de travail contraignantes"
                  value={(formData as any).work_posture_details || ''}
                  onChange={(v) => updateField('work_posture_details', v)}
                  rows={2}
                  placeholder="Ex: Assis 8h/jour à l'ordinateur..."
                />
                <div>
                  <SmartInput
                    label="Satisfaction au travail"
                    type="number"
                    value={(formData as any).work_satisfaction_score?.toString() || ''}
                    onChange={(v) => updateField('work_satisfaction_score', v ? parseInt(v) : null)}
                    min={0}
                    max={10}
                    placeholder="0-10"
                  />
                  <label className="flex items-center gap-2 mt-4">
                    <input
                      type="checkbox"
                      checked={(formData as any).recent_work_stoppage || false}
                      onChange={(e) => updateField('recent_work_stoppage', e.target.checked)}
                      className="w-4 h-4 rounded border-neutral-300"
                    />
                    <span className="text-sm font-medium text-neutral-700">
                      Arrêt de travail récent
                    </span>
                  </label>
                  {(formData as any).recent_work_stoppage && (
                    <SmartInput
                      label="Détails arrêt travail"
                      value={(formData as any).work_stoppage_details || ''}
                      onChange={(v) => updateField('work_stoppage_details', v)}
                      className="mt-3"
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </FormSection>

        <FormSection title="🚨 Drapeaux Rouges NMS" icon={AlertTriangle} color="red" required>
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 mb-6">
            <p className="text-sm text-red-800 font-medium">
              ⚠️ IMPORTANT: Cochez UNIQUEMENT si le patient présente ces symptômes.
              Ces drapeaux rouges nécessitent une évaluation médicale immédiate.
            </p>
          </div>

          <CheckboxGroup
            label="Drapeaux rouges neuromusculosquelettiques"
            options={[
              { id: 'genital_loss', label: 'Perte de sensation génitale / Péri-anale', sublabel: '🚨 URGENT' },
              { id: 'incontinence', label: 'Incontinence urinaire ou fécale', sublabel: '🚨 URGENT' },
              { id: 'urinary_retention', label: 'Rétention urinaire', sublabel: '🚨 URGENT' },
              { id: 'morning_stiffness', label: 'Déverrouillage matinal > 1h' },
              { id: 'cancer_history', label: 'Historique de cancer' },
              { id: 'progressive_deficit', label: 'Déficit neurologique progressif', sublabel: '🚨 URGENT' }
            ]}
            selected={[
              (formData as any).red_flag_genital_loss && 'genital_loss',
              (formData as any).red_flag_incontinence && 'incontinence',
              (formData as any).red_flag_urinary_retention && 'urinary_retention',
              (formData as any).red_flag_morning_stiffness_1h && 'morning_stiffness',
              (formData as any).red_flag_cancer_history && 'cancer_history',
              (formData as any).red_flag_progressive_neuro_deficit && 'progressive_deficit'
            ].filter(Boolean) as string[]}
            onChange={(selected) => {
              updateField('red_flag_genital_loss', selected.includes('genital_loss'));
              updateField('red_flag_incontinence', selected.includes('incontinence'));
              updateField('red_flag_urinary_retention', selected.includes('urinary_retention'));
              updateField('red_flag_morning_stiffness_1h', selected.includes('morning_stiffness'));
              updateField('red_flag_cancer_history', selected.includes('cancer_history'));
              updateField('red_flag_progressive_neuro_deficit', selected.includes('progressive_deficit'));

              if (selected.includes('genital_loss') || selected.includes('incontinence') ||
                  selected.includes('urinary_retention') || selected.includes('progressive_deficit')) {
                toast.error('⚠️ DRAPEAU ROUGE CRITIQUE! Évaluation médicale urgente requise!');
              }
            }}
            columns={2}
          />

          <SmartTextarea
            label="Autres drapeaux rouges"
            value={(formData as any).red_flag_other || ''}
            onChange={(v) => updateField('red_flag_other', v)}
            rows={2}
            placeholder="Précisez autres drapeaux rouges observés..."
            className="mt-6"
          />

          <div className="mt-6 p-4 bg-amber-50 border-2 border-amber-200 rounded-xl">
            <h4 className="font-semibold text-amber-900 mb-3">Symptômes Constitutionnels</h4>
            <CheckboxGroup
              options={[
                { id: 'fever', label: 'Fièvre' },
                { id: 'malaise', label: 'Malaise généralisé' },
                { id: 'fatigue', label: 'Fatigue' },
                { id: 'weight_loss', label: 'Perte de poids inexpliquée' },
                { id: 'night_sweats', label: 'Sueurs nocturnes' },
                { id: 'night_pain', label: 'Douleur nocturne' }
              ]}
              selected={[
                (formData as any).symptom_fever && 'fever',
                (formData as any).symptom_malaise && 'malaise',
                (formData as any).symptom_fatigue && 'fatigue',
                (formData as any).symptom_weight_loss && 'weight_loss',
                (formData as any).symptom_night_sweats && 'night_sweats',
                (formData as any).symptom_night_pain && 'night_pain'
              ].filter(Boolean) as string[]}
              onChange={(selected) => {
                updateField('symptom_fever', selected.includes('fever'));
                updateField('symptom_malaise', selected.includes('malaise'));
                updateField('symptom_fatigue', selected.includes('fatigue'));
                updateField('symptom_weight_loss', selected.includes('weight_loss'));
                updateField('symptom_night_sweats', selected.includes('night_sweats'));
                updateField('symptom_night_pain', selected.includes('night_pain'));
              }}
              columns={3}
            />
          </div>
        </FormSection>

        <FormSection title="Commentaires Additionnels" icon={FileText} color="neutral">
          <SmartTextarea
            label="Autres informations pertinentes"
            value={(formData as any).other_comments || ''}
            onChange={(v) => updateField('other_comments', v)}
            rows={4}
            placeholder="Notes additionnelles, observations, etc..."
          />
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
