/*
  # ChiroFlow Admin - Tables backend
  
  Tables pour dashboard admin complet
  
  ## Nouvelles tables
  - admin_users: Utilisateurs admin (Dre Janie uniquement)
  - patients_full: Dossiers patients complets
  - soap_notes: Notes SOAP avec IA
  - billing: Facturation
  - analytics_dashboard: Métriques temps réel
*/

-- Admin users (pour Dre Janie uniquement)
CREATE TABLE IF NOT EXISTS admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  role text DEFAULT 'owner',
  password_hash text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Patients complets
CREATE TABLE IF NOT EXISTS patients_full (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text UNIQUE,
  phone text,
  date_of_birth date,
  gender text,
  address text,
  city text,
  postal_code text,
  emergency_contact text,
  emergency_phone text,
  insurance_provider text,
  insurance_number text,
  medical_history text,
  medications text[],
  allergies text[],
  status text DEFAULT 'active',
  last_visit timestamptz,
  total_visits integer DEFAULT 0,
  total_spent decimal(10,2) DEFAULT 0,
  tags text[],
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE patients_full ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access to patients"
  ON patients_full FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Notes SOAP avec IA
CREATE TABLE IF NOT EXISTS soap_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid REFERENCES patients_full(id) ON DELETE CASCADE,
  visit_date timestamptz DEFAULT now(),
  subjective text,
  objective text,
  assessment text,
  plan text,
  ai_generated boolean DEFAULT false,
  ai_confidence decimal(3,2),
  voice_transcription_url text,
  attachments text[],
  treatment_duration_minutes integer,
  next_visit_date date,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE soap_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access to soap notes"
  ON soap_notes FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Facturation complète
CREATE TABLE IF NOT EXISTS billing (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid REFERENCES patients_full(id) ON DELETE CASCADE,
  invoice_number text UNIQUE NOT NULL,
  service_date date DEFAULT CURRENT_DATE,
  description text NOT NULL,
  amount decimal(10,2) NOT NULL,
  tax_amount decimal(10,2) DEFAULT 0,
  total_amount decimal(10,2) NOT NULL,
  payment_method text,
  payment_status text DEFAULT 'unpaid',
  paid_date date,
  insurance_claim_number text,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE billing ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access to billing"
  ON billing FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Analytics dashboard
CREATE TABLE IF NOT EXISTS analytics_dashboard (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_name text NOT NULL,
  metric_value decimal(12,2) NOT NULL,
  metric_type text,
  period_start timestamptz,
  period_end timestamptz,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE analytics_dashboard ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin access to analytics"
  ON analytics_dashboard FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Rendez-vous avancés (réutilise la table existante mais ajoute une vue)
CREATE OR REPLACE VIEW appointments_full AS
SELECT 
  a.*,
  CASE 
    WHEN a.status = 'pending' THEN 'En attente'
    WHEN a.status = 'confirmed' THEN 'Confirmé'
    WHEN a.status = 'completed' THEN 'Complété'
    WHEN a.status = 'cancelled' THEN 'Annulé'
    ELSE a.status
  END as status_fr
FROM appointments a;

-- Indexes pour performance
CREATE INDEX IF NOT EXISTS idx_patients_full_email ON patients_full(email);
CREATE INDEX IF NOT EXISTS idx_patients_full_status ON patients_full(status);
CREATE INDEX IF NOT EXISTS idx_soap_notes_patient ON soap_notes(patient_id);
CREATE INDEX IF NOT EXISTS idx_soap_notes_date ON soap_notes(visit_date);
CREATE INDEX IF NOT EXISTS idx_billing_patient ON billing(patient_id);
CREATE INDEX IF NOT EXISTS idx_billing_status ON billing(payment_status);
CREATE INDEX IF NOT EXISTS idx_analytics_metric ON analytics_dashboard(metric_name);

-- Fonction pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger updated_at sur patients_full
DROP TRIGGER IF EXISTS update_patients_full_updated_at ON patients_full;
CREATE TRIGGER update_patients_full_updated_at
    BEFORE UPDATE ON patients_full
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- Données de démo pour Dre Janie
INSERT INTO admin_users (email, full_name, role) 
VALUES ('dre.janie@example.com', 'Dre Janie Leblanc', 'owner')
ON CONFLICT (email) DO NOTHING;

-- Métriques analytics initiales
INSERT INTO analytics_dashboard (metric_name, metric_value, metric_type) VALUES
  ('total_patients', 0, 'count'),
  ('active_patients', 0, 'count'),
  ('total_revenue_month', 0, 'currency'),
  ('avg_visit_duration', 30, 'minutes'),
  ('patient_satisfaction', 4.9, 'rating')
ON CONFLICT DO NOTHING;
