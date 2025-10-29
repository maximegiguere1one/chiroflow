/*
  # Créer la table contacts pour gérer les patients/clients

  1. Nouvelle Table
    - `contacts` - Table principale pour tous les patients/clients
      - `id` (uuid, primary key)
      - `owner_id` (uuid, référence profiles)
      - `full_name` (text, requis)
      - `email` (text)
      - `phone` (text)
      - `status` (text, 'active' | 'inactive' | 'archived')
      - `date_of_birth` (date)
      - `address` (text)
      - `notes` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Sécurité
    - RLS activé
    - Seuls les admins propriétaires peuvent voir/gérer leurs contacts

  3. Indexes
    - Index sur owner_id pour performance
    - Index sur status
    - Index sur email pour recherches
*/

-- Table contacts
CREATE TABLE IF NOT EXISTS contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Informations de base
  full_name text NOT NULL,
  email text,
  phone text,

  -- Statut
  status text DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),

  -- Informations additionnelles
  date_of_birth date,
  address text,
  notes text,

  -- Métadonnées
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Admins can view own contacts"
  ON contacts FOR SELECT
  TO authenticated
  USING (owner_id = auth.uid());

CREATE POLICY "Admins can insert own contacts"
  ON contacts FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Admins can update own contacts"
  ON contacts FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Admins can delete own contacts"
  ON contacts FOR DELETE
  TO authenticated
  USING (owner_id = auth.uid());

-- Indexes pour performance
CREATE INDEX IF NOT EXISTS idx_contacts_owner ON contacts(owner_id);
CREATE INDEX IF NOT EXISTS idx_contacts_status ON contacts(status);
CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email);
CREATE INDEX IF NOT EXISTS idx_contacts_created_at ON contacts(created_at DESC);

-- Fonction pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_contacts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour updated_at
DROP TRIGGER IF EXISTS trigger_contacts_updated_at ON contacts;
CREATE TRIGGER trigger_contacts_updated_at
  BEFORE UPDATE ON contacts
  FOR EACH ROW
  EXECUTE FUNCTION update_contacts_updated_at();