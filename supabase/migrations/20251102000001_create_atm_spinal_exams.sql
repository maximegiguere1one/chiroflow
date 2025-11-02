/*
  # EXAMENS ATM ET COLONNE VERTÉBRALE
  
  Création tables pour:
  - Examen ATM (articulation temporo-mandibulaire)
  - Examen physique colonne vertébrale (cervical, thoracique, lombaire)
*/

-- =====================================================
-- TABLE 2: EXAMEN ATM
-- =====================================================
CREATE TABLE IF NOT EXISTS atm_exams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  
  dc_number text,
  exam_date timestamptz DEFAULT now(),
  file_number text,
  
  -- Analyse ouverture buccale
  mouth_opening_normal boolean DEFAULT false,
  mouth_opening_mm numeric(4,1),
  mouth_opening_passive_normal boolean,
  mouth_opening_passive_limited text,
  
  -- Démarche mandibulaire
  mandibular_2mm_deviation boolean DEFAULT false,
  mandibular_straight_left boolean DEFAULT false,
  mandibular_straight_right boolean DEFAULT false,
  mandibular_hypomobility_left boolean DEFAULT false,
  mandibular_hypomobility_right boolean DEFAULT false,
  mandibular_hypermobility_left boolean DEFAULT false,
  mandibular_hypermobility_right boolean DEFAULT false,
  mandibular_c_pattern_lg boolean DEFAULT false,
  mandibular_c_pattern_rl boolean DEFAULT false,
  mandibular_zigzag boolean DEFAULT false,
  
  -- Occlusion/Dentition
  occlusion_normal boolean DEFAULT false,
  malocclusion_details text,
  orthodontics_details text,
  atm_surgery_details text,
  missing_teeth text,
  occlusion_notes text,
  
  -- Palpation ATM
  palpation_left_pain boolean DEFAULT false,
  palpation_right_pain boolean DEFAULT false,
  palpation_left_hypermobility boolean DEFAULT false,
  palpation_right_hypermobility boolean DEFAULT false,
  palpation_left_periauricular text CHECK (palpation_left_periauricular IN ('N', 'AN')),
  palpation_right_periauricular text CHECK (palpation_right_periauricular IN ('N', 'AN')),
  palpation_left_endoauricular text CHECK (palpation_left_endoauricular IN ('N', 'AN')),
  palpation_right_endoauricular text CHECK (palpation_right_endoauricular IN ('N', 'AN')),
  palpation_notes text,
  
  -- Tests particuliers
  krogh_poulsen_left text CHECK (krogh_poulsen_left IN ('N', 'AN')),
  krogh_poulsen_right text CHECK (krogh_poulsen_right IN ('N', 'AN')),
  chin_pressure_left text CHECK (chin_pressure_left IN ('N', 'AN')),
  chin_pressure_right text CHECK (chin_pressure_right IN ('N', 'AN')),
  resistance_left text CHECK (resistance_left IN ('elastique', 'ferme')),
  resistance_right text CHECK (resistance_right IN ('elastique', 'ferme')),
  
  -- Bruits et ressauts (format JSON pour timing détaillé)
  clicks_opening jsonb DEFAULT '{"left": {}, "right": {}}'::jsonb,
  clicks_closing jsonb DEFAULT '{"left": {}, "right": {}}'::jsonb,
  clicks_laterality jsonb DEFAULT '{"left": {}, "right": {}}'::jsonb,
  clicks_combined jsonb DEFAULT '{"left": {}, "right": {}}'::jsonb,
  clicks_hyperlaxity jsonb DEFAULT '{"left": {}, "right": {}}'::jsonb,
  sand_noise_atm jsonb DEFAULT '{"left": false, "right": false}'::jsonb,
  
  -- Amplitude articulaire
  laterality_active_normal boolean,
  laterality_active_limit_left boolean,
  laterality_active_limit_right boolean,
  laterality_passive_normal boolean,
  laterality_passive_limit_left boolean,
  laterality_passive_limit_right boolean,
  
  protrusion_active_normal boolean,
  protrusion_active_limit_left boolean,
  protrusion_active_limit_right boolean,
  protrusion_passive_normal boolean,
  protrusion_passive_limit_left boolean,
  protrusion_passive_limit_right boolean,
  
  combined_lat_prot_active_normal boolean,
  combined_lat_prot_active_limit_left boolean,
  combined_lat_prot_active_limit_right boolean,
  combined_lat_prot_passive_normal boolean,
  combined_lat_prot_passive_limit_left boolean,
  combined_lat_prot_passive_limit_right boolean,
  
  retrusion_active_normal boolean,
  retrusion_active_limitation boolean,
  retrusion_passive_normal boolean,
  retrusion_passive_limitation boolean,
  
  -- Palpation musculaire
  muscle_palpation_notes text,
  
  -- Radiographies
  has_xrays_at_clinic boolean DEFAULT false,
  xray_request boolean DEFAULT false,
  
  -- Metadata
  completed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  CONSTRAINT atm_exams_contact_owner_fk 
    FOREIGN KEY (contact_id, owner_id) 
    REFERENCES contacts(id, owner_id)
);

CREATE INDEX IF NOT EXISTS idx_atm_exams_contact ON atm_exams(contact_id);
CREATE INDEX IF NOT EXISTS idx_atm_exams_owner ON atm_exams(owner_id);
CREATE INDEX IF NOT EXISTS idx_atm_exams_date ON atm_exams(exam_date DESC);

ALTER TABLE atm_exams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Chiros view own ATM exams" ON atm_exams FOR SELECT TO authenticated USING (auth.uid() = owner_id);
CREATE POLICY "Chiros create own ATM exams" ON atm_exams FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Chiros update own ATM exams" ON atm_exams FOR UPDATE TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Chiros delete own ATM exams" ON atm_exams FOR DELETE TO authenticated USING (auth.uid() = owner_id);

-- =====================================================
-- TABLE 3: EXAMEN PHYSIQUE COLONNE VERTÉBRALE
-- =====================================================
CREATE TABLE IF NOT EXISTS spinal_exams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  
  dc_number text,
  exam_date timestamptz DEFAULT now(),
  file_number text,
  
  -- Signes vitaux
  bp_left_systolic integer,
  bp_left_diastolic integer,
  bp_right_systolic integer,
  bp_right_diastolic integer,
  pulse_left integer,
  pulse_right integer,
  respiration_rate integer,
  temperature_celsius numeric(4,1),
  temperature_fahrenheit numeric(5,1),
  weight_lbs numeric(5,1),
  weight_kg numeric(5,1),
  height_inches numeric(4,1),
  height_cm numeric(5,1),
  
  -- Observations
  rust_sign boolean DEFAULT false,
  bakody_sign boolean DEFAULT false,
  minor_sign boolean DEFAULT false,
  dejerine_triad boolean DEFAULT false,
  
  -- Ganglions lymphatiques
  lymph_cervical text CHECK (lymph_cervical IN ('N', 'AN')),
  lymph_axillary text CHECK (lymph_axillary IN ('N', 'AN')),
  lymph_inguinal text CHECK (lymph_inguinal IN ('N', 'AN')),
  thyroid_palpation text CHECK (thyroid_palpation IN ('N', 'AN')),
  
  -- Posture
  posture_notes text,
  adam_test_position text,
  adam_test_observations text,
  
  -- Démarches
  gait_normal text CHECK (gait_normal IN ('N', 'AN')),
  gait_funambule text CHECK (gait_funambule IN ('N', 'AN')),
  gait_tiptoe text CHECK (gait_tiptoe IN ('N', 'AN')),
  gait_heel text CHECK (gait_heel IN ('N', 'AN')),
  gait_hopping text CHECK (gait_hopping IN ('N', 'AN')),
  gait_genuflexion text CHECK (gait_genuflexion IN ('N', 'AN')),
  gait_notes text,
  
  -- Autres tests
  romberg_test text CHECK (romberg_test IN ('N', 'AN')),
  pronator_drift text CHECK (pronator_drift IN ('N', 'AN')),
  
  -- Amplitudes cervical (degrés)
  cervical_flexion_active numeric(5,1),
  cervical_flexion_passive numeric(5,1),
  cervical_flexion_pain boolean,
  cervical_extension_active numeric(5,1),
  cervical_extension_passive numeric(5,1),
  cervical_extension_pain boolean,
  cervical_lat_flex_right_active numeric(5,1),
  cervical_lat_flex_right_passive numeric(5,1),
  cervical_lat_flex_right_pain boolean,
  cervical_lat_flex_left_active numeric(5,1),
  cervical_lat_flex_left_passive numeric(5,1),
  cervical_lat_flex_left_pain boolean,
  cervical_rotation_right_active numeric(5,1),
  cervical_rotation_right_passive numeric(5,1),
  cervical_rotation_right_pain boolean,
  cervical_rotation_left_active numeric(5,1),
  cervical_rotation_left_passive numeric(5,1),
  cervical_rotation_left_pain boolean,
  
  -- Amplitudes thoraco-lombaire (degrés)
  thoracolumbar_flexion_active numeric(5,1),
  thoracolumbar_flexion_passive numeric(5,1),
  thoracolumbar_flexion_pain boolean,
  thoracolumbar_extension_active numeric(5,1),
  thoracolumbar_extension_passive numeric(5,1),
  thoracolumbar_extension_pain boolean,
  thoracolumbar_lat_flex_right_active numeric(5,1),
  thoracolumbar_lat_flex_right_passive numeric(5,1),
  thoracolumbar_lat_flex_right_pain boolean,
  thoracolumbar_lat_flex_left_active numeric(5,1),
  thoracolumbar_lat_flex_left_passive numeric(5,1),
  thoracolumbar_lat_flex_left_pain boolean,
  thoracolumbar_rotation_right_active numeric(5,1),
  thoracolumbar_rotation_right_passive numeric(5,1),
  thoracolumbar_rotation_right_pain boolean,
  thoracolumbar_rotation_left_active numeric(5,1),
  thoracolumbar_rotation_left_passive numeric(5,1),
  thoracolumbar_rotation_left_pain boolean,
  
  -- ROT (0-4+)
  rot_biceps_left numeric(1),
  rot_biceps_right numeric(1),
  rot_brachioradial_left numeric(1),
  rot_brachioradial_right numeric(1),
  rot_triceps_left numeric(1),
  rot_triceps_right numeric(1),
  rot_patellar_left numeric(1),
  rot_patellar_right numeric(1),
  rot_semitendinous_left numeric(1),
  rot_semitendinous_right numeric(1),
  rot_achilles_left numeric(1),
  rot_achilles_right numeric(1),
  
  -- Réflexes pathologiques
  plantar_cutaneous_left text CHECK (plantar_cutaneous_left IN ('N', 'AN')),
  plantar_cutaneous_right text CHECK (plantar_cutaneous_right IN ('N', 'AN')),
  hoffman_left text CHECK (hoffman_left IN ('N', 'AN')),
  hoffman_right text CHECK (hoffman_right IN ('N', 'AN')),
  clonus_left text CHECK (clonus_left IN ('N', 'AN')),
  clonus_right text CHECK (clonus_right IN ('N', 'AN')),
  abdominal_cutaneous_left text CHECK (abdominal_cutaneous_left IN ('N', 'AN')),
  abdominal_cutaneous_right text CHECK (abdominal_cutaneous_right IN ('N', 'AN')),
  
  -- Évaluation motrice (0-5)
  motor_data jsonb DEFAULT '{}'::jsonb,
  
  -- Tests orthopédiques (JSON pour flexibilité)
  ortho_cervical_tests jsonb DEFAULT '{}'::jsonb,
  ortho_thoracic_tests jsonb DEFAULT '{}'::jsonb,
  ortho_lumbopelvic_tests jsonb DEFAULT '{}'::jsonb,
  ortho_thoracic_outlet_tests jsonb DEFAULT '{}'::jsonb,
  ortho_other_tests jsonb DEFAULT '{}'::jsonb,
  
  -- Sensibilité
  sensibility_data jsonb DEFAULT '{}'::jsonb,
  
  -- Évaluation vasculaire
  vascular_data jsonb DEFAULT '{}'::jsonb,
  
  -- Nerfs crâniens (concis)
  cranial_nerves_data jsonb DEFAULT '{}'::jsonb,
  
  -- Palpation chiropratique
  spinal_palpation_data jsonb DEFAULT '{}'::jsonb,
  muscle_palpation_notes text,
  trigger_points_notes text,
  teno_periosteal_sensitivity text,
  cellulalgia_notes text,
  other_signs text,
  
  -- Évaluations spécialisées
  specialized_evaluations text,
  
  -- Radiographies
  has_xrays_at_clinic boolean DEFAULT false,
  xray_request boolean DEFAULT false,
  
  -- Metadata
  completed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  CONSTRAINT spinal_exams_contact_owner_fk 
    FOREIGN KEY (contact_id, owner_id) 
    REFERENCES contacts(id, owner_id)
);

CREATE INDEX IF NOT EXISTS idx_spinal_exams_contact ON spinal_exams(contact_id);
CREATE INDEX IF NOT EXISTS idx_spinal_exams_owner ON spinal_exams(owner_id);
CREATE INDEX IF NOT EXISTS idx_spinal_exams_date ON spinal_exams(exam_date DESC);

ALTER TABLE spinal_exams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Chiros view own spinal exams" ON spinal_exams FOR SELECT TO authenticated USING (auth.uid() = owner_id);
CREATE POLICY "Chiros create own spinal exams" ON spinal_exams FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Chiros update own spinal exams" ON spinal_exams FOR UPDATE TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Chiros delete own spinal exams" ON spinal_exams FOR DELETE TO authenticated USING (auth.uid() = owner_id);
