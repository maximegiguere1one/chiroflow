/*
  # Correction des policies RLS pour payment_methods
  
  ## Problème
  Les policies actuelles font des requêtes directes à auth.users depuis le contexte
  de l'utilisateur authentifié, ce qui cause "permission denied for table users"
  
  ## Solution
  1. Créer une fonction helper SECURITY DEFINER qui peut lire auth.users
  2. Utiliser patient_portal_users comme table de liaison
  3. Simplifier les policies pour utiliser la fonction helper
  
  ## Changements
  - Crée get_current_patient_id() pour obtenir l'ID patient de l'utilisateur
  - Recrée toutes les policies patients pour utiliser cette fonction
  - Maintient les policies admin existantes
*/

-- Fonction helper pour obtenir l'ID patient de l'utilisateur connecté
CREATE OR REPLACE FUNCTION get_current_patient_id()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  patient_uuid uuid;
BEGIN
  -- Méthode 1: Via patient_portal_users (préférée)
  SELECT patient_id INTO patient_uuid
  FROM patient_portal_users
  WHERE id = auth.uid()
  LIMIT 1;
  
  IF patient_uuid IS NOT NULL THEN
    RETURN patient_uuid;
  END IF;
  
  -- Méthode 2: Fallback par email depuis auth.users
  SELECT p.id INTO patient_uuid
  FROM patients_full p
  INNER JOIN auth.users u ON LOWER(u.email) = LOWER(p.email)
  WHERE u.id = auth.uid()
  LIMIT 1;
  
  RETURN patient_uuid;
END;
$$;

-- Supprimer les anciennes policies patients
DROP POLICY IF EXISTS "Patients can view own payment methods" ON payment_methods;
DROP POLICY IF EXISTS "Patients can insert own payment methods" ON payment_methods;
DROP POLICY IF EXISTS "Patients can update own payment methods" ON payment_methods;
DROP POLICY IF EXISTS "Patients can delete own payment methods" ON payment_methods;

-- Recréer les policies avec la fonction helper
CREATE POLICY "Patients can view own payment methods"
  ON payment_methods FOR SELECT
  TO authenticated
  USING (patient_id = get_current_patient_id());

CREATE POLICY "Patients can insert own payment methods"
  ON payment_methods FOR INSERT
  TO authenticated
  WITH CHECK (patient_id = get_current_patient_id());

CREATE POLICY "Patients can update own payment methods"
  ON payment_methods FOR UPDATE
  TO authenticated
  USING (patient_id = get_current_patient_id())
  WITH CHECK (patient_id = get_current_patient_id());

CREATE POLICY "Patients can delete own payment methods"
  ON payment_methods FOR DELETE
  TO authenticated
  USING (patient_id = get_current_patient_id());

-- Ajouter un commentaire sur la fonction
COMMENT ON FUNCTION get_current_patient_id IS 
'Retourne l''ID du patient pour l''utilisateur authentifié actuel.
Utilise patient_portal_users comme source principale avec fallback par email.
SECURITY DEFINER permet l''accès à auth.users de manière sécurisée.';
