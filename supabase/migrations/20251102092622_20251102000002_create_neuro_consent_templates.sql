/*
  # EXAMEN NEUROLOGIQUE, CONSENTEMENTS ET TEMPLATES
  
  Tables pour:
  - Examen neurologique détaillé
  - Consentements téléconsultation
  - Templates de formulaires intelligents
*/

CREATE TABLE IF NOT EXISTS neurological_exams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  
  dc_number text,
  exam_date timestamptz DEFAULT now(),
  file_number text,
  
  headaches boolean DEFAULT false,
  head_injury boolean DEFAULT false,
  dizziness boolean DEFAULT false,
  epilepsy boolean DEFAULT false,
  tremors boolean DEFAULT false,
  weakness boolean DEFAULT false,
  lack_coordination boolean DEFAULT false,
  numbness boolean DEFAULT false,
  swallowing_difficulty boolean DEFAULT false,
  speech_difficulty boolean DEFAULT false,
  double_vision boolean DEFAULT false,
  significant_medical_history boolean DEFAULT false,
  other_indications text,
  
  vital_signs_reference text,
  
  patient_confused boolean DEFAULT false,
  patient_incoherent boolean DEFAULT false,
  dysarthria boolean DEFAULT false,
  tics boolean DEFAULT false,
  involuntary_movements boolean DEFAULT false,
  resting_tremors boolean DEFAULT false,
  essential_tremors boolean DEFAULT false,
  intentional_tremors boolean DEFAULT false,
  dystonia boolean DEFAULT false,
  myoclonus boolean DEFAULT false,
  dyspraxia boolean DEFAULT false,
  choreic_movements boolean DEFAULT false,
  athetotic_movements boolean DEFAULT false,
  ballistic_movements boolean DEFAULT false,
  observations_notes text,
  
  patient_visual_impairment boolean DEFAULT false,
  patient_hearing_impairment boolean DEFAULT false,
  patient_anxiety_depression boolean DEFAULT false,
  
  consciousness_alert boolean DEFAULT false,
  consciousness_distracted boolean DEFAULT false,
  consciousness_lethargic boolean DEFAULT false,
  
  orientation_temporal text CHECK (orientation_temporal IN ('N', 'AN')),
  orientation_spatial text CHECK (orientation_spatial IN ('N', 'AN')),
  
  concentration text CHECK (concentration IN ('N', 'AN')),
  
  memory_short_term text CHECK (memory_short_term IN ('N', 'AN')),
  memory_long_term text CHECK (memory_long_term IN ('N', 'AN')),
  
  language_fluent boolean DEFAULT false,
  language_searching_words boolean DEFAULT false,
  language_laborious boolean DEFAULT false,
  language_absent boolean DEFAULT false,
  
  autonomy_level text CHECK (autonomy_level IN ('autonome', 'assistance_certaines_taches', 'assistance_hebdomadaire', 'assistance_quotidienne', 'peu_autonome')),
  
  gait_tests_reference text,
  rot_reference text,
  
  coordination_data jsonb DEFAULT '{"finger_index": {"left": "N", "right": "N"}, "heel_knee": {"left": "N", "right": "N"}, "finger_finger": {"left": "N", "right": "N"}, "pronation_supination": {"left": "N", "right": "N"}, "marionnette": {"left": "N", "right": "N"}, "index_thumb": {"left": "N", "right": "N"}, "foot_pedaling": {"left": "N", "right": "N"}}'::jsonb,
  
  motor_evaluation jsonb DEFAULT '{}'::jsonb,
  sensibility_data jsonb DEFAULT '{"elementary": {}, "discriminative": {}}'::jsonb,
  cranial_nerves_data jsonb DEFAULT '{}'::jsonb,
  
  additional_notes text,
  
  completed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_neuro_exams_contact ON neurological_exams(contact_id);
CREATE INDEX IF NOT EXISTS idx_neuro_exams_owner ON neurological_exams(owner_id);
CREATE INDEX IF NOT EXISTS idx_neuro_exams_date ON neurological_exams(exam_date DESC);

ALTER TABLE neurological_exams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Chiros view own neuro exams" ON neurological_exams FOR SELECT TO authenticated USING (auth.uid() = owner_id);
CREATE POLICY "Chiros create own neuro exams" ON neurological_exams FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Chiros update own neuro exams" ON neurological_exams FOR UPDATE TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Chiros delete own neuro exams" ON neurological_exams FOR DELETE TO authenticated USING (auth.uid() = owner_id);

CREATE TABLE IF NOT EXISTS teleconsultation_consents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  
  consent_date timestamptz DEFAULT now(),
  patient_name text NOT NULL,
  patient_signature_data text,
  patient_dob date,
  
  chiropractor_name text NOT NULL,
  chiropractor_signature_data text,
  
  technologies_used text,
  
  emergency_contact_1_name text,
  emergency_contact_1_relationship text,
  emergency_contact_1_phone text,
  emergency_contact_1_other_phone text,
  
  emergency_contact_2_name text,
  emergency_contact_2_relationship text,
  emergency_contact_2_phone text,
  emergency_contact_2_other_phone text,
  
  understands_risks boolean DEFAULT false,
  understands_limits boolean DEFAULT false,
  understands_recording_rules boolean DEFAULT false,
  understands_tech_failure_procedure boolean DEFAULT false,
  understands_emergency_procedure boolean DEFAULT false,
  
  is_valid boolean DEFAULT true,
  revoked_at timestamptz,
  revoked_reason text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_telecons_consents_contact ON teleconsultation_consents(contact_id);
CREATE INDEX IF NOT EXISTS idx_telecons_consents_owner ON teleconsultation_consents(owner_id);
CREATE INDEX IF NOT EXISTS idx_telecons_consents_date ON teleconsultation_consents(consent_date DESC);
CREATE INDEX IF NOT EXISTS idx_telecons_consents_valid ON teleconsultation_consents(is_valid) WHERE is_valid = true;

ALTER TABLE teleconsultation_consents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Chiros view own consents" ON teleconsultation_consents FOR SELECT TO authenticated USING (auth.uid() = owner_id);
CREATE POLICY "Chiros create own consents" ON teleconsultation_consents FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Chiros update own consents" ON teleconsultation_consents FOR UPDATE TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Chiros delete own consents" ON teleconsultation_consents FOR DELETE TO authenticated USING (auth.uid() = owner_id);

CREATE TABLE IF NOT EXISTS form_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  
  form_type text NOT NULL CHECK (form_type IN ('anamnese', 'atm', 'neurological', 'spinal', 'teleconsultation')),
  
  template_name text NOT NULL,
  description text,
  category text,
  
  template_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  
  condition_keywords text[],
  condition_age_min integer,
  condition_age_max integer,
  condition_gender text CHECK (condition_gender IN ('M', 'F', 'other', null)),
  
  usage_count integer DEFAULT 0,
  last_used_at timestamptz,
  
  is_public boolean DEFAULT false,
  is_system_template boolean DEFAULT false,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  CONSTRAINT form_templates_unique_name_owner 
    UNIQUE (owner_id, form_type, template_name)
);

CREATE INDEX IF NOT EXISTS idx_form_templates_owner ON form_templates(owner_id);
CREATE INDEX IF NOT EXISTS idx_form_templates_type ON form_templates(form_type);
CREATE INDEX IF NOT EXISTS idx_form_templates_public ON form_templates(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_form_templates_system ON form_templates(is_system_template) WHERE is_system_template = true;

ALTER TABLE form_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Chiros view own templates" ON form_templates FOR SELECT TO authenticated USING (auth.uid() = owner_id OR is_public = true OR is_system_template = true);
CREATE POLICY "Chiros create own templates" ON form_templates FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id AND is_system_template = false);
CREATE POLICY "Chiros update own templates" ON form_templates FOR UPDATE TO authenticated USING (auth.uid() = owner_id AND is_system_template = false) WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Chiros delete own templates" ON form_templates FOR DELETE TO authenticated USING (auth.uid() = owner_id AND is_system_template = false);

CREATE OR REPLACE FUNCTION increment_template_usage(template_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE form_templates
  SET 
    usage_count = usage_count + 1,
    last_used_at = now()
  WHERE id = template_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;