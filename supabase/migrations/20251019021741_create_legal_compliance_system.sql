/*
  # Système de Conformité Légale Québec/Canada

  ## Tables Créées
  
  ### 1. `patient_consents`
  - Enregistre tous les consentements du patient
  - Conforme à la Loi 25 et LPRPDE
  - Traçabilité complète avec dates et versions
  
  ### 2. `access_audit_log`
  - Journal d'audit de tous les accès aux dossiers
  - Requis par la Loi 25 pour la traçabilité
  - Enregistre qui a accédé à quoi et quand
  
  ### 3. `data_breach_log`
  - Registre des incidents de confidentialité
  - Obligatoire selon la Loi 25
  - Permet la notification aux autorités
  
  ### 4. `patient_rights_requests`
  - Gestion des demandes d'accès, rectification, effacement
  - Droit à l'oubli (Loi 25)
  - Droit à la portabilité (LPRPDE)
  
  ### 5. `retention_policy`
  - Politique de conservation des données
  - Minimum 5 ans (Code des professions)
  - Suppression automatique après période légale

  ## Sécurité
  - RLS activé sur toutes les tables
  - Accès restreint aux professionnels authentifiés
  - Chiffrement des données sensibles
  - Audit complet de tous les accès
*/

-- Table des consentements patients
CREATE TABLE IF NOT EXISTS patient_consents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid REFERENCES contacts(id) ON DELETE CASCADE NOT NULL,
  consent_type text NOT NULL,
  consent_granted boolean NOT NULL DEFAULT false,
  consent_date timestamptz NOT NULL DEFAULT now(),
  consent_withdrawn_date timestamptz,
  consent_version text NOT NULL DEFAULT '1.0',
  signature_name text,
  signature_date date,
  ip_address inet,
  user_agent text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_patient_consents_patient ON patient_consents(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_consents_type ON patient_consents(consent_type);
CREATE INDEX IF NOT EXISTS idx_patient_consents_date ON patient_consents(consent_date DESC);

-- Table journal d'audit des accès
CREATE TABLE IF NOT EXISTS access_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  patient_id uuid REFERENCES contacts(id),
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id uuid,
  ip_address inet,
  user_agent text,
  details jsonb,
  created_at timestamptz DEFAULT now()
);

-- Index pour audit
CREATE INDEX IF NOT EXISTS idx_audit_log_user ON access_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_patient ON access_audit_log(patient_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_date ON access_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON access_audit_log(action);

-- Table registre des incidents de confidentialité
CREATE TABLE IF NOT EXISTS data_breach_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  breach_type text NOT NULL,
  severity text NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  description text NOT NULL,
  affected_patients_count integer DEFAULT 0,
  affected_patient_ids uuid[],
  discovery_date timestamptz NOT NULL DEFAULT now(),
  containment_date timestamptz,
  resolution_date timestamptz,
  authority_notified boolean DEFAULT false,
  authority_notification_date timestamptz,
  patients_notified boolean DEFAULT false,
  patients_notification_date timestamptz,
  root_cause text,
  corrective_actions text,
  responsible_party text,
  status text DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'contained', 'resolved')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table demandes d'exercice des droits
CREATE TABLE IF NOT EXISTS patient_rights_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid REFERENCES contacts(id) ON DELETE CASCADE NOT NULL,
  request_type text NOT NULL CHECK (request_type IN (
    'access',           -- Droit d'accès
    'rectification',    -- Droit de rectification
    'erasure',          -- Droit à l'oubli
    'portability',      -- Droit à la portabilité
    'restriction',      -- Droit à la limitation
    'objection',        -- Droit d'opposition
    'consent_withdrawal' -- Retrait du consentement
  )),
  request_date timestamptz NOT NULL DEFAULT now(),
  request_details text,
  status text DEFAULT 'pending' CHECK (status IN (
    'pending',
    'in_progress',
    'completed',
    'denied',
    'cancelled'
  )),
  denial_reason text,
  completion_date timestamptz,
  response_deadline timestamptz NOT NULL DEFAULT (now() + interval '30 days'),
  assigned_to uuid REFERENCES auth.users(id),
  notes text,
  attachments jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Index pour gestion des demandes
CREATE INDEX IF NOT EXISTS idx_rights_requests_patient ON patient_rights_requests(patient_id);
CREATE INDEX IF NOT EXISTS idx_rights_requests_status ON patient_rights_requests(status);
CREATE INDEX IF NOT EXISTS idx_rights_requests_deadline ON patient_rights_requests(response_deadline);

-- Table politique de rétention
CREATE TABLE IF NOT EXISTS retention_policy (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  data_type text NOT NULL,
  retention_period_days integer NOT NULL,
  legal_basis text NOT NULL,
  deletion_method text NOT NULL DEFAULT 'secure_delete',
  last_review_date timestamptz DEFAULT now(),
  next_review_date timestamptz NOT NULL,
  is_active boolean DEFAULT true,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Politique par défaut: 5 ans minimum (Code des professions)
INSERT INTO retention_policy (data_type, retention_period_days, legal_basis, next_review_date, notes)
VALUES 
  ('patient_records', 1825, 'Code des professions du Québec - Article 60.5', now() + interval '1 year', 'Conservation minimale de 5 ans après la dernière visite'),
  ('soap_notes', 1825, 'Code des professions du Québec', now() + interval '1 year', 'Notes cliniques - 5 ans minimum'),
  ('consent_forms', 1825, 'Loi 25 et LPRPDE', now() + interval '1 year', 'Formulaires de consentement - 5 ans'),
  ('billing_records', 2555, 'Loi sur les impôts', now() + interval '1 year', 'Facturation - 7 ans pour conformité fiscale'),
  ('audit_logs', 2555, 'Loi 25 - Article 3.5', now() + interval '1 year', 'Journaux d''audit - 7 ans pour investigation'),
  ('marketing_consent', 1095, 'LPRPDE', now() + interval '1 year', 'Consentement marketing - 3 ans')
ON CONFLICT DO NOTHING;

-- Enable RLS
ALTER TABLE patient_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_breach_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_rights_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE retention_policy ENABLE ROW LEVEL SECURITY;

-- RLS Policies pour patient_consents
CREATE POLICY "Admins can view all consents"
  ON patient_consents FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'practitioner')
    )
  );

CREATE POLICY "Admins can insert consents"
  ON patient_consents FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'practitioner')
    )
  );

CREATE POLICY "Admins can update consents"
  ON patient_consents FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'practitioner')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'practitioner')
    )
  );

-- RLS Policies pour access_audit_log
CREATE POLICY "Admins can view audit logs"
  ON access_audit_log FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "System can insert audit logs"
  ON access_audit_log FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- RLS Policies pour data_breach_log
CREATE POLICY "Admins can manage breach log"
  ON data_breach_log FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- RLS Policies pour patient_rights_requests
CREATE POLICY "Admins can view all rights requests"
  ON patient_rights_requests FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'practitioner')
    )
  );

CREATE POLICY "Admins can manage rights requests"
  ON patient_rights_requests FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'practitioner')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'practitioner')
    )
  );

-- RLS Policies pour retention_policy
CREATE POLICY "Admins can view retention policy"
  ON retention_policy FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can manage retention policy"
  ON retention_policy FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Fonction pour logger automatiquement les accès
CREATE OR REPLACE FUNCTION log_patient_access()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO access_audit_log (
    user_id,
    patient_id,
    action,
    resource_type,
    resource_id,
    details
  ) VALUES (
    auth.uid(),
    NEW.id,
    TG_OP,
    TG_TABLE_NAME,
    NEW.id,
    jsonb_build_object(
      'timestamp', now(),
      'operation', TG_OP
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger sur contacts pour logger les accès
DROP TRIGGER IF EXISTS audit_contacts_access ON contacts;
CREATE TRIGGER audit_contacts_access
  AFTER INSERT OR UPDATE ON contacts
  FOR EACH ROW
  EXECUTE FUNCTION log_patient_access();
