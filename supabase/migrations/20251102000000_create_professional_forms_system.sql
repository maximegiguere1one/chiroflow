/*
  # SYSTÈME FORMULAIRES PROFESSIONNELS CHIROPRATIQUES
  
  ## Nouveau Système
  
  Création d'un système complet pour gérer tous les formulaires professionnels:
  
  1. Tables Principales:
     - `anamnese_forms` - Formulaire d'anamnèse (historique patient)
     - `atm_exams` - Examen articulation temporo-mandibulaire
     - `neurological_exams` - Examen neurologique détaillé
     - `spinal_exams` - Examen physique colonne vertébrale
     - `teleconsultation_consents` - Consentements téléconsultation
     - `form_templates` - Templates pré-remplis intelligents
  
  2. Sécurité:
     - RLS activé sur toutes les tables
     - Accès restreint au chiro propriétaire
     - Historique complet des modifications
  
  3. Fonctionnalités:
     - Remplissage intelligent basé historique
     - Auto-complétion champs
     - Validation données
     - Export PDF
*/

-- =====================================================
-- TABLE 1: ANAMNÈSE (Historique patient complet)
-- =====================================================
CREATE TABLE IF NOT EXISTS anamnese_forms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Identification
  dc_number text,
  form_date timestamptz DEFAULT now(),
  file_number text,
  
  -- Histoire médicale familiale
  parent1_history text,
  parent2_history text,
  siblings_history text,
  hereditary_diseases text,
  
  -- Professionnels consultés
  consulted_medecin boolean DEFAULT false,
  consulted_dentiste boolean DEFAULT false,
  consulted_optometriste boolean DEFAULT false,
  consulted_physiotherapeute boolean DEFAULT false,
  consulted_other text,
  
  -- Motif de consultation
  reason_head boolean DEFAULT false,
  reason_cervical boolean DEFAULT false,
  reason_thoracique boolean DEFAULT false,
  reason_lombaire boolean DEFAULT false,
  reason_membre_inf boolean DEFAULT false,
  reason_membre_sup boolean DEFAULT false,
  reason_notes text,
  
  -- Localisation douleur
  pain_location text,
  pain_diagram_data jsonb,
  
  -- Irradiation
  has_irradiation boolean DEFAULT false,
  irradiation_details text,
  
  -- Circonstance survenue
  onset_sudden boolean DEFAULT false,
  onset_gradual boolean DEFAULT false,
  onset_accident boolean DEFAULT false,
  onset_unknown boolean DEFAULT false,
  onset_details text,
  onset_date date,
  
  -- Durée/Fréquence
  duration_acute boolean DEFAULT false,
  duration_subacute boolean DEFAULT false,
  duration_chronic boolean DEFAULT false,
  duration_recurrent boolean DEFAULT false,
  episodes_count integer,
  episodes_period text,
  duration_notes text,
  
  -- Progression
  progression_better boolean DEFAULT false,
  progression_stable boolean DEFAULT false,
  progression_worse boolean DEFAULT false,
  progression_variable boolean DEFAULT false,
  progression_percentage integer,
  progression_period text,
  progression_notes text,
  
  -- Douleur caractéristiques
  pain_throbbing boolean DEFAULT false,
  pain_stabbing boolean DEFAULT false,
  pain_pinching boolean DEFAULT false,
  pain_stretching boolean DEFAULT false,
  pain_burning boolean DEFAULT false,
  pain_tingling boolean DEFAULT false,
  pain_numbness boolean DEFAULT false,
  pain_other text,
  
  -- Facteurs aggravants/atténuants
  factor_ice_helps boolean,
  factor_ice_worsens boolean,
  factor_heat_helps boolean,
  factor_heat_worsens boolean,
  factor_rest_helps boolean,
  factor_rest_worsens boolean,
  factor_movement_details text,
  factor_medication_details text,
  
  -- Symptômes associés
  associated_symptoms text,
  
  -- Histoire passée
  past_episodes boolean DEFAULT false,
  past_treatment_received text,
  current_treatment text,
  
  -- Accidents/Traumas
  has_accident boolean DEFAULT false,
  accident_details text,
  has_trauma boolean DEFAULT false,
  trauma_details text,
  has_surgery boolean DEFAULT false,
  surgery_details text,
  has_hospitalization boolean DEFAULT false,
  hospitalization_details text,
  
  -- Médication
  medication_list_on_file boolean DEFAULT false,
  medication_list_dsq boolean DEFAULT false,
  takes_tylenol boolean DEFAULT false,
  takes_aspirin boolean DEFAULT false,
  takes_ains boolean DEFAULT false,
  takes_opioids boolean DEFAULT false,
  takes_hta boolean DEFAULT false,
  takes_cholesterol boolean DEFAULT false,
  takes_anxiolytics boolean DEFAULT false,
  takes_antidepressants boolean DEFAULT false,
  takes_diabetes boolean DEFAULT false,
  takes_injection_meds boolean DEFAULT false,
  takes_calcium_vitd boolean DEFAULT false,
  takes_otc boolean DEFAULT false,
  takes_contraceptives boolean DEFAULT false,
  takes_infiltration boolean DEFAULT false,
  takes_anticoagulant boolean DEFAULT false,
  medication_stopped_recently text,
  medication_other text,
  
  -- Habitudes de vie - Sport
  activity_level text CHECK (activity_level IN ('tres_actif', 'actif', 'sedentaire')),
  main_activities text,
  
  -- Sommeil
  sleep_restorative boolean,
  sleep_insomnia boolean,
  sleep_hours_per_night numeric(3,1),
  sleep_position text CHECK (sleep_position IN ('dos', 'ventre', 'cote', 'variable')),
  sleep_pain_wakes boolean DEFAULT false,
  sleep_pain_details text,
  
  -- Facteurs chronicisation
  factor_poor_health boolean DEFAULT false,
  factor_smoking boolean DEFAULT false,
  factor_depression boolean DEFAULT false,
  factor_catastrophization boolean DEFAULT false,
  factor_disproportionate_reaction boolean DEFAULT false,
  factor_kinesiophobia boolean DEFAULT false,
  factor_total_disability_12m boolean DEFAULT false,
  factor_addiction boolean DEFAULT false,
  factor_weak_social_network boolean DEFAULT false,
  factor_family_context boolean DEFAULT false,
  factor_stressors text,
  
  -- Occupation/Travail
  occupation_study boolean DEFAULT false,
  occupation_work boolean DEFAULT false,
  occupation_fulltime boolean DEFAULT false,
  occupation_parttime boolean DEFAULT false,
  work_constraining_postures boolean DEFAULT false,
  work_posture_details text,
  work_satisfaction_score integer CHECK (work_satisfaction_score BETWEEN 0 AND 10),
  recent_work_stoppage boolean DEFAULT false,
  work_stoppage_details text,
  
  -- Radiographies/Investigations
  has_recent_xrays boolean DEFAULT false,
  xray_details text,
  has_specialized_exams boolean DEFAULT false,
  specialized_exam_details text,
  has_other_investigations boolean DEFAULT false,
  other_investigation_details text,
  pending_investigations text,
  
  -- Revue des systèmes
  system_psychological text CHECK (system_psychological IN ('N', 'AN')),
  system_neurological text CHECK (system_neurological IN ('N', 'AN')),
  system_musculoskeletal text CHECK (system_musculoskeletal IN ('N', 'AN')),
  system_endocrine text CHECK (system_endocrine IN ('N', 'AN')),
  system_orl text CHECK (system_orl IN ('N', 'AN')),
  system_respiratory text CHECK (system_respiratory IN ('N', 'AN')),
  system_cardiovascular text CHECK (system_cardiovascular IN ('N', 'AN')),
  system_gastrointestinal text CHECK (system_gastrointestinal IN ('N', 'AN')),
  system_genitourinary text CHECK (system_genitourinary IN ('N', 'AN')),
  system_allergies text CHECK (system_allergies IN ('N', 'AN')),
  system_other text,
  
  -- Symptômes constitutionnels
  symptom_fever boolean DEFAULT false,
  symptom_malaise boolean DEFAULT false,
  symptom_fatigue boolean DEFAULT false,
  symptom_weight_loss boolean DEFAULT false,
  symptom_night_sweats boolean DEFAULT false,
  symptom_night_pain boolean DEFAULT false,
  symptom_other text,
  
  -- Drapeaux rouges NMS
  red_flag_genital_loss boolean DEFAULT false,
  red_flag_incontinence boolean DEFAULT false,
  red_flag_urinary_retention boolean DEFAULT false,
  red_flag_morning_stiffness_1h boolean DEFAULT false,
  red_flag_cancer_history boolean DEFAULT false,
  red_flag_progressive_neuro_deficit boolean DEFAULT false,
  red_flag_other text,
  
  -- Autres/Commentaires
  other_comments text,
  
  -- Metadata
  completed boolean DEFAULT false,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  
  CONSTRAINT anamnese_forms_contact_owner_fk 
    FOREIGN KEY (contact_id, owner_id) 
    REFERENCES contacts(id, owner_id)
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_anamnese_forms_contact 
  ON anamnese_forms(contact_id);
CREATE INDEX IF NOT EXISTS idx_anamnese_forms_owner 
  ON anamnese_forms(owner_id);
CREATE INDEX IF NOT EXISTS idx_anamnese_forms_date 
  ON anamnese_forms(form_date DESC);
CREATE INDEX IF NOT EXISTS idx_anamnese_forms_org 
  ON anamnese_forms(organization_id);

-- RLS
ALTER TABLE anamnese_forms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Chiros can view own anamnese forms"
  ON anamnese_forms FOR SELECT
  TO authenticated
  USING (auth.uid() = owner_id);

CREATE POLICY "Chiros can create own anamnese forms"
  ON anamnese_forms FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Chiros can update own anamnese forms"
  ON anamnese_forms FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Chiros can delete own anamnese forms"
  ON anamnese_forms FOR DELETE
  TO authenticated
  USING (auth.uid() = owner_id);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_anamnese_forms_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER anamnese_forms_updated_at
  BEFORE UPDATE ON anamnese_forms
  FOR EACH ROW
  EXECUTE FUNCTION update_anamnese_forms_updated_at();

-- Continuer dans partie 2...
