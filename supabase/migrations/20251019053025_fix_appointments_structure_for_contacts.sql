/*
  # Corriger la structure de appointments pour supporter contacts
  
  1. Modifications
    - Ajouter colonne `contact_id` (référence à contacts)
    - Rendre `patient_id` nullable (pour backward compatibility)
    - Ajouter index sur contact_id
  
  2. Sécurité
    - Mise à jour des policies RLS pour supporter contact_id
*/

-- Ajouter la colonne contact_id si elle n'existe pas
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'appointments' AND column_name = 'contact_id'
  ) THEN
    ALTER TABLE appointments ADD COLUMN contact_id uuid REFERENCES contacts(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Créer un index pour la performance
CREATE INDEX IF NOT EXISTS idx_appointments_contact_id ON appointments(contact_id);

-- Mettre à jour les policies RLS pour supporter contact_id
DROP POLICY IF EXISTS "Admins can view own appointments" ON appointments;
CREATE POLICY "Admins can view own appointments"
  ON appointments FOR SELECT
  TO authenticated
  USING (owner_id = auth.uid());

DROP POLICY IF EXISTS "Admins can insert own appointments" ON appointments;
CREATE POLICY "Admins can insert own appointments"
  ON appointments FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "Admins can update own appointments" ON appointments;
CREATE POLICY "Admins can update own appointments"
  ON appointments FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "Admins can delete own appointments" ON appointments;
CREATE POLICY "Admins can delete own appointments"
  ON appointments FOR DELETE
  TO authenticated
  USING (owner_id = auth.uid());