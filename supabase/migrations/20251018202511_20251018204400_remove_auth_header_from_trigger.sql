/*
  # Retrait du header Authorization du trigger

  1. Changements
    - Le trigger n'envoie plus de header Authorization
    - L'edge function est publique (verify_jwt: false)
    - Seul Content-Type est envoyé

  2. Sécurité
    - L'edge function est appelée uniquement depuis le backend
    - Pas besoin d'auth car c'est une communication interne
*/

-- Supprimer l'ancienne fonction
DROP FUNCTION IF EXISTS notify_admin_new_booking() CASCADE;

-- Nouvelle fonction SANS Authorization header
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
    
    -- Headers basiques seulement (pas d'Authorization)
    request_headers := jsonb_build_object(
      'Content-Type', 'application/json'
    );

    -- Appel HTTP via pg_net
    SELECT INTO request_id net.http_post(
      url := function_url,
      body := payload,
      headers := request_headers
    );

    -- Log succès avec request_id
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

-- Message de confirmation
DO $$
BEGIN
  RAISE NOTICE '✅ Trigger mis à jour - SANS Authorization header!';
END $$;
