/*
  # Fix appointments table - Ajouter owner_id
  
  ## Changements
  1. Ajouter colonne owner_id à appointments
  2. Migrer données de provider_id vers owner_id
  3. Recréer appointments_api view avec owner_id
  4. Mettre à jour RLS policies
*/

-- Ajouter owner_id à appointments
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES profiles(id) ON DELETE CASCADE;

-- Migrer les données existantes
UPDATE appointments 
SET owner_id = provider_id 
WHERE owner_id IS NULL AND provider_id IS NOT NULL;

-- Créer index
CREATE INDEX IF NOT EXISTS idx_appointments_owner_id ON appointments(owner_id);

-- Drop et recréer la vue appointments_api
DROP VIEW IF EXISTS appointments_api CASCADE;

CREATE VIEW appointments_api AS
SELECT 
  a.id,
  a.scheduled_at,
  a.scheduled_at::date as scheduled_date,
  a.scheduled_at::time as scheduled_time,
  COALESCE(a.owner_id, a.provider_id) as owner_id,
  a.contact_id,
  a.duration_minutes,
  a.status,
  a.notes,
  a.created_at,
  a.updated_at,
  NULL::text as service_type,
  NULL::boolean as reminder_sent,
  NULL::text as confirmation_status,
  NULL::numeric as no_show_risk_score
FROM appointments a;

-- Enable RLS on view
ALTER VIEW appointments_api SET (security_invoker = true);

GRANT SELECT, INSERT, UPDATE, DELETE ON appointments_api TO authenticated;

-- Re-créer les fonctions pour les triggers
CREATE OR REPLACE FUNCTION appointments_api_insert()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO appointments (
    id,
    owner_id,
    provider_id,
    contact_id,
    name,
    email,
    phone,
    reason,
    scheduled_at,
    duration_minutes,
    status,
    notes
  ) VALUES (
    COALESCE(NEW.id, gen_random_uuid()),
    NEW.owner_id,
    NEW.owner_id,
    NEW.contact_id,
    COALESCE((SELECT full_name FROM contacts WHERE id = NEW.contact_id), 'Patient'),
    COALESCE((SELECT email FROM contacts WHERE id = NEW.contact_id), 'email@example.com'),
    COALESCE((SELECT phone FROM contacts WHERE id = NEW.contact_id), '000-000-0000'),
    COALESCE(NEW.notes, 'Rendez-vous'),
    (NEW.scheduled_date::text || ' ' || NEW.scheduled_time::text)::timestamptz,
    COALESCE(NEW.duration_minutes, 30),
    COALESCE(NEW.status, 'confirmed'),
    NEW.notes
  )
  RETURNING * INTO NEW;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION appointments_api_update()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE appointments SET
    owner_id = NEW.owner_id,
    provider_id = NEW.owner_id,
    contact_id = NEW.contact_id,
    scheduled_at = (NEW.scheduled_date::text || ' ' || NEW.scheduled_time::text)::timestamptz,
    duration_minutes = NEW.duration_minutes,
    status = NEW.status,
    notes = NEW.notes,
    updated_at = now()
  WHERE id = OLD.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION appointments_api_delete()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM appointments WHERE id = OLD.id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-créer les triggers
CREATE TRIGGER appointments_api_insert_trigger
  INSTEAD OF INSERT ON appointments_api
  FOR EACH ROW
  EXECUTE FUNCTION appointments_api_insert();

CREATE TRIGGER appointments_api_update_trigger
  INSTEAD OF UPDATE ON appointments_api
  FOR EACH ROW
  EXECUTE FUNCTION appointments_api_update();

CREATE TRIGGER appointments_api_delete_trigger
  INSTEAD OF DELETE ON appointments_api
  FOR EACH ROW
  EXECUTE FUNCTION appointments_api_delete();

-- Mettre à jour les RLS policies sur appointments
DROP POLICY IF EXISTS "Users view own appointments" ON appointments;
DROP POLICY IF EXISTS "Users insert own appointments" ON appointments;
DROP POLICY IF EXISTS "Users update own appointments" ON appointments;
DROP POLICY IF EXISTS "Users delete own appointments" ON appointments;

CREATE POLICY "Users view own appointments"
  ON appointments FOR SELECT
  TO authenticated
  USING (owner_id = auth.uid() OR provider_id = auth.uid());

CREATE POLICY "Users insert own appointments"
  ON appointments FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = auth.uid() OR provider_id = auth.uid());

CREATE POLICY "Users update own appointments"
  ON appointments FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid() OR provider_id = auth.uid())
  WITH CHECK (owner_id = auth.uid() OR provider_id = auth.uid());

CREATE POLICY "Users delete own appointments"
  ON appointments FOR DELETE
  TO authenticated
  USING (owner_id = auth.uid() OR provider_id = auth.uid());

-- Ajouter policies publiques pour la réservation en ligne
CREATE POLICY "Public can insert appointments"
  ON appointments FOR INSERT
  TO anon
  WITH CHECK (true);

COMMENT ON COLUMN appointments.owner_id IS 'Praticien propriétaire du rendez-vous (identique à provider_id pour compatibilité)';
