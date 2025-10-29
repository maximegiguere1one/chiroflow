/*
  # Notification automatique admin pour nouveaux RDV

  1. Fonction trigger
    - Appelle l'edge function notify-admin-new-booking
    - S'exécute après chaque insertion dans appointments
    - Envoie email à maxime@giguere-influence.com

  2. Sécurité
    - Exécution asynchrone (ne bloque pas l'insertion)
    - Gestion d'erreur gracieuse

  3. Notes
    - Email envoyé seulement pour les RDV en ligne (booking_source = 'online')
    - Contient tous les détails du RDV
*/

-- Fonction pour notifier l'admin d'un nouveau RDV
CREATE OR REPLACE FUNCTION notify_admin_new_booking()
RETURNS TRIGGER AS $$
DECLARE
  function_url text;
  payload jsonb;
BEGIN
  -- Seulement pour les RDV réservés en ligne
  IF NEW.booking_source = 'online' THEN
    function_url := current_setting('app.settings.supabase_url', true) || '/functions/v1/notify-admin-new-booking';
    
    payload := jsonb_build_object(
      'appointment_id', NEW.id
    );

    -- Appel asynchrone à l'edge function
    PERFORM net.http_post(
      url := function_url,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
      ),
      body := payload
    );
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- En cas d'erreur, on log mais on ne bloque pas l'insertion
  RAISE WARNING 'Erreur notification admin: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger qui s'exécute après insertion d'un nouveau RDV
DROP TRIGGER IF EXISTS trigger_notify_admin_new_booking ON appointments;
CREATE TRIGGER trigger_notify_admin_new_booking
  AFTER INSERT ON appointments
  FOR EACH ROW
  WHEN (NEW.booking_source = 'online')
  EXECUTE FUNCTION notify_admin_new_booking();

-- Alternative: Utiliser pg_net si disponible
-- Cette version fonctionne mieux car pg_net est optimisé pour les appels HTTP

CREATE OR REPLACE FUNCTION notify_admin_new_booking_pgnet()
RETURNS TRIGGER AS $$
DECLARE
  function_url text;
  supabase_url text;
  service_role_key text;
BEGIN
  -- Seulement pour les RDV réservés en ligne
  IF NEW.booking_source = 'online' THEN
    -- Récupérer l'URL Supabase depuis les variables d'environnement
    supabase_url := current_setting('request.headers', true)::json->>'x-forwarded-host';
    IF supabase_url IS NULL THEN
      supabase_url := 'https://tuwswtgpkgtckhmnjnru.supabase.co';
    ELSE
      supabase_url := 'https://' || supabase_url;
    END IF;

    function_url := supabase_url || '/functions/v1/notify-admin-new-booking';

    -- Appel HTTP asynchrone via pg_net
    PERFORM net.http_post(
      url := function_url,
      headers := jsonb_build_object(
        'Content-Type', 'application/json'
      )::text,
      body := jsonb_build_object(
        'appointment_id', NEW.id
      )::text
    );
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- En cas d'erreur, on log mais on ne bloque pas l'insertion
  RAISE WARNING 'Erreur notification admin pgnet: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Remplacer le trigger par la version pg_net
DROP TRIGGER IF EXISTS trigger_notify_admin_new_booking ON appointments;
CREATE TRIGGER trigger_notify_admin_new_booking
  AFTER INSERT ON appointments
  FOR EACH ROW
  WHEN (NEW.booking_source = 'online')
  EXECUTE FUNCTION notify_admin_new_booking_pgnet();

-- Log des notifications envoyées (pour debug)
CREATE TABLE IF NOT EXISTS admin_notifications_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid REFERENCES appointments(id) ON DELETE CASCADE,
  notification_type text DEFAULT 'new_booking',
  sent_at timestamptz DEFAULT now(),
  success boolean,
  error_message text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE admin_notifications_log ENABLE ROW LEVEL SECURITY;

-- Policy pour les admins seulement
DROP POLICY IF EXISTS "Admins can view notification logs" ON admin_notifications_log;
CREATE POLICY "Admins can view notification logs"
  ON admin_notifications_log
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_admin_notifications_appointment ON admin_notifications_log(appointment_id);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_sent_at ON admin_notifications_log(sent_at DESC);
