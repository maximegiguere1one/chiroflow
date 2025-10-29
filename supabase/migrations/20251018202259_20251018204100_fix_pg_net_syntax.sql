/*
  # Correction syntaxe pg_net.http_post

  1. Changements
    - Utilisation de la syntaxe correcte pour pg_net
    - Paramètres positionnels au lieu de nommés

  2. Notes
    - pg_net.http_post attend (url, body, headers)
    - Pas de syntaxe := pour les paramètres
*/

-- Supprimer l'ancienne fonction
DROP FUNCTION IF EXISTS notify_admin_new_booking() CASCADE;

-- Nouvelle fonction avec la bonne syntaxe pg_net
CREATE OR REPLACE FUNCTION notify_admin_new_booking()
RETURNS TRIGGER AS $$
DECLARE
  request_id bigint;
  function_url text;
  payload jsonb;
BEGIN
  -- Seulement pour les RDV réservés en ligne
  IF NEW.booking_source = 'online' THEN
    function_url := 'https://tuwswtgpkgtckhmnjnru.supabase.co/functions/v1/notify-admin-new-booking';
    payload := jsonb_build_object('appointment_id', NEW.id);

    -- Appel HTTP asynchrone via pg_net (syntaxe correcte)
    SELECT INTO request_id net.http_post(
      function_url,
      payload::text,
      '{"Content-Type": "application/json"}'::jsonb
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

    RAISE NOTICE 'Admin notification request_id: %', request_id;
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
    SQLERRM,
    now()
  );
  
  RAISE WARNING 'Erreur notification admin: %', SQLERRM;
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
