-- =====================================================
-- FIX pour les politiques RLS de service_types
-- =====================================================
-- Exécutez ce script dans l'éditeur SQL de Supabase
-- Dashboard > SQL Editor > New Query
-- =====================================================

-- Activer RLS sur la table service_types
ALTER TABLE service_types ENABLE ROW LEVEL SECURITY;

-- Supprimer les politiques existantes si elles existent
DROP POLICY IF EXISTS "Users can read own service types" ON service_types;
DROP POLICY IF EXISTS "Users can insert own service types" ON service_types;
DROP POLICY IF EXISTS "Users can update own service types" ON service_types;
DROP POLICY IF EXISTS "Users can delete own service types" ON service_types;

-- Créer les politiques pour les utilisateurs authentifiés
CREATE POLICY "Users can read own service types"
  ON service_types
  FOR SELECT
  TO authenticated
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert own service types"
  ON service_types
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update own service types"
  ON service_types
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can delete own service types"
  ON service_types
  FOR DELETE
  TO authenticated
  USING (auth.uid() = owner_id);

-- Créer des index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_service_types_owner_id ON service_types(owner_id);
CREATE INDEX IF NOT EXISTS idx_service_types_is_active ON service_types(is_active);

-- Créer une fonction pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION update_service_types_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger pour updated_at
DROP TRIGGER IF EXISTS service_types_updated_at ON service_types;
CREATE TRIGGER service_types_updated_at
  BEFORE UPDATE ON service_types
  FOR EACH ROW
  EXECUTE FUNCTION update_service_types_updated_at();

-- Vérifier les politiques créées
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'service_types'
ORDER BY policyname;
