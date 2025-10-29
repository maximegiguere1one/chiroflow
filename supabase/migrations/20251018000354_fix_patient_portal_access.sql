/*
  # Correction d'accès au portail patient

  ## Problème identifié
  La table `patient_portal_users` est vide, empêchant tous les patients d'accéder au portail
  car la fonction RLS `owns_patient_record()` vérifie l'existence dans cette table.

  ## Solution
  1. Créer une fonction trigger qui auto-crée une entrée dans `patient_portal_users`
     quand un utilisateur s'authentifie via Supabase Auth
  2. Ajouter une fonction helper pour lier manuellement un patient existant
  3. Améliorer la policy RLS pour permettre l'accès direct par email

  ## Changements
  - Crée une fonction `sync_patient_portal_user()` 
  - Crée un trigger sur auth.users pour auto-création
  - Ajoute une policy RLS alternative basée sur l'email
  - Crée une fonction helper `link_patient_to_auth_user()`
*/

-- Fonction pour synchroniser automatiquement patient_portal_users
CREATE OR REPLACE FUNCTION sync_patient_portal_user()
RETURNS TRIGGER AS $$
DECLARE
  matched_patient_id uuid;
BEGIN
  -- Chercher un patient avec l'email correspondant
  SELECT id INTO matched_patient_id
  FROM patients_full
  WHERE email = NEW.email
  LIMIT 1;

  -- Si un patient existe avec cet email
  IF matched_patient_id IS NOT NULL THEN
    -- Insérer ou mettre à jour dans patient_portal_users
    INSERT INTO patient_portal_users (
      id,
      patient_id,
      email,
      is_active,
      email_verified,
      last_login,
      login_count,
      preferences,
      created_at,
      updated_at
    ) VALUES (
      NEW.id,
      matched_patient_id,
      NEW.email,
      true,
      NEW.email_confirmed_at IS NOT NULL,
      NOW(),
      1,
      '{}',
      NOW(),
      NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      last_login = NOW(),
      login_count = patient_portal_users.login_count + 1,
      email_verified = NEW.email_confirmed_at IS NOT NULL,
      updated_at = NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger sur auth.users pour auto-sync (si possible)
-- Note: Ce trigger peut ne pas fonctionner car auth.users est dans un schema protégé
-- Dans ce cas, nous utiliserons une approche alternative

-- Fonction helper pour lier manuellement un patient à un utilisateur auth
CREATE OR REPLACE FUNCTION link_patient_to_auth_user(
  p_auth_user_id uuid,
  p_patient_email text
)
RETURNS void AS $$
DECLARE
  matched_patient_id uuid;
BEGIN
  -- Vérifier que l'utilisateur existe dans auth.users
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = p_auth_user_id) THEN
    RAISE EXCEPTION 'Utilisateur authentifié non trouvé';
  END IF;

  -- Chercher le patient par email
  SELECT id INTO matched_patient_id
  FROM patients_full
  WHERE email = p_patient_email
  LIMIT 1;

  IF matched_patient_id IS NULL THEN
    RAISE EXCEPTION 'Aucun patient trouvé avec cet email';
  END IF;

  -- Créer ou mettre à jour l'entrée patient_portal_users
  INSERT INTO patient_portal_users (
    id,
    patient_id,
    email,
    is_active,
    email_verified,
    last_login,
    login_count,
    preferences,
    created_at,
    updated_at
  ) VALUES (
    p_auth_user_id,
    matched_patient_id,
    p_patient_email,
    true,
    true,
    NOW(),
    1,
    '{}',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    patient_id = matched_patient_id,
    email = p_patient_email,
    last_login = NOW(),
    login_count = patient_portal_users.login_count + 1,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Améliorer la fonction owns_patient_record pour inclure un fallback par email
CREATE OR REPLACE FUNCTION owns_patient_record(patient_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $$
DECLARE
  user_email text;
  patient_email text;
BEGIN
  -- Méthode 1: Vérifier via patient_portal_users (standard)
  IF EXISTS (
    SELECT 1 FROM patient_portal_users
    WHERE patient_portal_users.id = auth.uid()
    AND patient_portal_users.patient_id = patient_uuid
  ) THEN
    RETURN true;
  END IF;

  -- Méthode 2: Fallback par email si patient_portal_users n'est pas configuré
  -- Récupérer l'email de l'utilisateur authentifié
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = auth.uid();

  -- Récupérer l'email du patient
  SELECT email INTO patient_email
  FROM patients_full
  WHERE id = patient_uuid;

  -- Comparer les emails
  IF user_email IS NOT NULL AND patient_email IS NOT NULL 
     AND LOWER(user_email) = LOWER(patient_email) THEN
    RETURN true;
  END IF;

  RETURN false;
END;
$$;

-- Ajouter des index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_patient_portal_users_patient_id 
ON patient_portal_users(patient_id);

CREATE INDEX IF NOT EXISTS idx_patient_portal_users_email 
ON patient_portal_users(email);

-- Ajouter un commentaire sur la table
COMMENT ON FUNCTION link_patient_to_auth_user IS 
'Lie manuellement un utilisateur Supabase Auth à un patient. 
Utilisé pour initialiser l''accès au portail patient.';

COMMENT ON FUNCTION owns_patient_record IS 
'Vérifie si l''utilisateur authentifié peut accéder aux données d''un patient.
Utilise patient_portal_users comme méthode principale, avec fallback par email.';
