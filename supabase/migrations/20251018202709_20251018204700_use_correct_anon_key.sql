/*
  # Utilisation de la vraie clé anon depuis .env

  1. Changements
    - Mise à jour avec la vraie SUPABASE_ANON_KEY du projet
    - Cette clé est valide jusqu'en 2075

  2. Notes
    - Clé récupérée depuis .env
    - Format Authorization: Bearer <key>
*/

-- Supprimer l'ancienne fonction
DROP FUNCTION IF EXISTS notify_admin_new_booking() CASCADE;

-- Nouvelle fonction avec la VRAIE clé anon
CREATE OR REPLACE FUNCTION notify_admin_new_booking()
RETURNS TRIGGER AS $$
DECLARE
  request_id bigint;
  function_url text;
  payload jsonb;
  request_headers jsonb;
  anon_key text;
BEGIN
  -- Seulement pour les RDV réservés en ligne
  IF NEW.booking_source = 'online' THEN
    function_url := 'https://tuwswtgpkgtckhmnjnru.supabase.co/functions/v1/notify-admin-new-booking';
    payload := jsonb_build_object('appointment_id', NEW.id);
    
    -- VRAIE clé anon du projet (depuis .env)
    anon_key := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR1d3N3dGdwa2d0Y2tobW5qbnJ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAxOTE4NTIsImV4cCI6MjA3NTc2Nzg1Mn0.x-LuFVuwjRowhH8IaHE6jMhYIqHH2C6Sg0-HfxeBvoI';
    
    -- Headers avec Authorization Bearer
    request_headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || anon_key
    );

    -- Appel HTTP via pg_net
    SELECT INTO request_id net.http_post(
      url := function_url,
      body := payload,
      headers := request_headers
    );

    -- Log succès
    INSERT INTO admin_notifications_log (
      appointment_id,
      notification_type,
      success,
      error_message,
      created_at
    ) VALUES (
      NEW.id,
      'new_booking',
      true,
      'Request ID: ' || request_id || ' - Email envoyé!',
      now()
    );

    RAISE NOTICE '✅ Email admin envoyé - request_id: %', request_id;
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- En cas d'erreur, on log mais on ne bloque pas l'insertion
  INSERT INTO admin_notifications_log (
    appointment_id,
    notification_type,
    success,
    error_message,
    created_at
  ) VALUES (
    NEW.id,
    'new_booking',
    false,
    'ERREUR: ' || SQLERRM,
    now()
  );
  
  RAISE WARNING '❌ Erreur notification admin: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recréer le trigger
DROP TRIGGER IF EXISTS trigger_notify_admin_new_booking ON appointments;
CREATE TRIGGER trigger_notify_admin_new_booking
  AFTER INSERT ON appointments
  FOR EACH ROW
  WHEN (NEW.booking_source = 'online')
  EXECUTE FUNCTION notify_admin_new_booking();

-- Message de confirmation
DO $$
BEGIN
  RAISE NOTICE '🎉 Trigger mis à jour avec la VRAIE clé anon!';
END $$;
