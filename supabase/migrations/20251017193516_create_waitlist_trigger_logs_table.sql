/*
  # Création de la table waitlist_trigger_logs pour le suivi des automatisations

  1. Nouvelle Table: waitlist_trigger_logs
    - `id` (uuid, primary key) - Identifiant unique du log
    - `slot_offer_id` (uuid) - Référence au créneau traité
    - `trigger_type` (text) - Type de déclenchement (trigger_db, webhook, manual, cron)
    - `action` (text) - Action effectuée (create_slot, call_function, send_email)
    - `status` (text) - Statut (success, error, pending, retry)
    - `http_status_code` (int) - Code HTTP retourné par l'appel
    - `error_message` (text) - Message d'erreur si échec
    - `retry_count` (int) - Nombre de tentatives effectuées
    - `metadata` (jsonb) - Données supplémentaires (payload, response, etc.)
    - `created_at` (timestamptz) - Date de création du log
    - `updated_at` (timestamptz) - Date de dernière mise à jour

  2. Indexes
    - Index sur slot_offer_id pour recherche rapide par créneau
    - Index sur status pour filtrer les erreurs
    - Index sur created_at pour requêtes chronologiques

  3. Security
    - Enable RLS
    - Politique de lecture pour les utilisateurs authentifiés
    - Aucune politique d'insertion/modification (uniquement via trigger)
*/

-- Créer la table des logs
CREATE TABLE IF NOT EXISTS waitlist_trigger_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_offer_id uuid REFERENCES appointment_slot_offers(id) ON DELETE SET NULL,
  trigger_type text NOT NULL CHECK (trigger_type IN ('trigger_db', 'webhook', 'manual', 'cron', 'monitor')),
  action text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('success', 'error', 'pending', 'retry')),
  http_status_code int,
  error_message text,
  retry_count int DEFAULT 0,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Créer les indexes
CREATE INDEX IF NOT EXISTS idx_trigger_logs_slot_offer ON waitlist_trigger_logs(slot_offer_id);
CREATE INDEX IF NOT EXISTS idx_trigger_logs_status ON waitlist_trigger_logs(status);
CREATE INDEX IF NOT EXISTS idx_trigger_logs_created_at ON waitlist_trigger_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_trigger_logs_trigger_type ON waitlist_trigger_logs(trigger_type);

-- Activer RLS
ALTER TABLE waitlist_trigger_logs ENABLE ROW LEVEL SECURITY;

-- Politique de lecture pour les utilisateurs authentifiés
CREATE POLICY "Authenticated users can view trigger logs"
  ON waitlist_trigger_logs FOR SELECT
  TO authenticated
  USING (true);

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_waitlist_trigger_logs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour updated_at
DROP TRIGGER IF EXISTS trigger_update_waitlist_trigger_logs_updated_at ON waitlist_trigger_logs;
CREATE TRIGGER trigger_update_waitlist_trigger_logs_updated_at
  BEFORE UPDATE ON waitlist_trigger_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_waitlist_trigger_logs_updated_at();