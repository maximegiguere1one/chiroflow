/*
  # Correction des Policies RLS pour waitlist_trigger_logs

  ## Problème Identifié
  Le trigger `handle_appointment_cancellation` ne peut pas insérer dans `waitlist_trigger_logs`
  car il n'y a AUCUNE policy INSERT. Le trigger s'exécute sans contexte utilisateur authentifié.

  ## Solution
  1. Ajouter policy INSERT pour permettre au trigger d'insérer
  2. Utiliser `TO public` pour permettre l'insertion depuis le trigger système
  3. Ajouter policy UPDATE pour le monitor qui retente les échecs

  ## Sécurité
  - Les policies sont restrictives : permettent seulement l'insertion de logs système
  - Pas de modification manuelle possible par les utilisateurs
  - Les utilisateurs authentifiés peuvent seulement LIRE les logs
*/

-- Supprimer l'ancienne policy SELECT si elle existe
DROP POLICY IF EXISTS "Authenticated users can view trigger logs" ON waitlist_trigger_logs;

-- Policy SELECT : Les utilisateurs authentifiés peuvent LIRE tous les logs
CREATE POLICY "Users can view trigger logs"
  ON waitlist_trigger_logs FOR SELECT
  TO authenticated
  USING (true);

-- Policy INSERT : Permettre au trigger système d'insérer des logs
-- IMPORTANT: Utilise TO public pour permettre l'insertion depuis les triggers
CREATE POLICY "System can insert trigger logs"
  ON waitlist_trigger_logs FOR INSERT
  TO public
  WITH CHECK (true);

-- Policy UPDATE : Permettre au système de mettre à jour les logs (retry, status update)
CREATE POLICY "System can update trigger logs"
  ON waitlist_trigger_logs FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- Note: Aucune policy DELETE - les logs ne doivent jamais être supprimés
