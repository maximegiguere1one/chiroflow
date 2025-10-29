/*
  # Autoriser l'inscription publique à la liste d'attente

  1. Modifications
    - Ajouter une politique pour permettre aux Edge Functions d'insérer dans new_client_waitlist
    - Cette politique permet l'insertion sans authentification (via service role key)
  
  2. Sécurité
    - Seule l'insertion est permise publiquement
    - Les lectures, mises à jour et suppressions restent restreintes aux admins
*/

-- Autoriser l'insertion publique dans new_client_waitlist (via service role key)
CREATE POLICY "Public can insert into waitlist via service role"
  ON new_client_waitlist FOR INSERT
  WITH CHECK (true);
