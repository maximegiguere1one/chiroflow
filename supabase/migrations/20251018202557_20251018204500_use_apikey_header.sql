/*
  # Utilisation du header Apikey au lieu d'Authorization

  1. Changements
    - Ajout du header Apikey avec la clé anon
    - Alternative à Authorization pour les edge functions publiques

  2. Notes
    - Apikey header est accepté par les edge functions Supabase
    - Pas de vérification JWT mais header requis pour routing
*/

-- Supprimer l'ancienne fonction
DROP FUNCTION IF EXISTS notify_admin_new_booking() CASCADE;

-- Nouvelle fonction avec Apikey header
CREATE OR REPLACE FUNCTION notify_admin_new_booking()
RETURNS TRIGGER AS $$
DECLARE
  request_id bigint;
  function_url text;
  payload jsonb;
  request_headers jsonb;
BEGIN
  -- Seulement pour les RDV réservés en ligne
  IF NEW.booking_source = 'online' THEN
    function_url := 'https://tuwswtgpkgtckhmnjnru.supabase.co/functions/v1/notify-admin-new-booking';
    payload := jsonb_build_object('appointment_id', NEW.id);
    
    -- Headers avec Apikey (clé anon publique)
    request_headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'apikey', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR1d3N3dGdwa2d0Y2tobW5qbnJ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mjg2NjAwMjMsImV4cCI6MjA0NDIzNjAyM30.wV5ZUfNEf9rbdVmNOKVDt2vk3Xr2iwCIrqMhPnFz9YU'
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
      'Request ID: ' || request_id,
      now()
    );

    RAISE NOTICE '✅ Notification admin envoyée - request_id: %', request_id;
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
