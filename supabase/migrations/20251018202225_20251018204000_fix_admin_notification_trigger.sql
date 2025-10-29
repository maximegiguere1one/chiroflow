/*
  # Correction du trigger de notification admin

  1. Changements
    - Simplification du trigger pour utiliser net.http_post correctement
    - Ajout de logging pour debug
    - URL fixe du projet Supabase

  2. Notes
    - Le trigger appelle l'edge function via pg_net
    - Logging dans admin_notifications_log pour traçabilité
*/

-- Supprimer l'ancien trigger et fonction
DROP TRIGGER IF EXISTS trigger_notify_admin_new_booking ON appointments;
DROP FUNCTION IF EXISTS notify_admin_new_booking_pgnet();
DROP FUNCTION IF EXISTS notify_admin_new_booking();

-- Nouvelle fonction simplifiée
CREATE OR REPLACE FUNCTION notify_admin_new_booking()
RETURNS TRIGGER AS $$
DECLARE
  request_id bigint;
BEGIN
  -- Seulement pour les RDV réservés en ligne
  IF NEW.booking_source = 'online' THEN
    -- Log le début de la tentative
    INSERT INTO admin_notifications_log (
      appointment_id,
      notification_type,
      success,
      error_message,
      created_at
    ) VALUES (
      NEW.id,
      'new_booking',
      NULL,
      'Tentative d''envoi en cours',
      now()
    );

    -- Appel HTTP asynchrone via pg_net
    SELECT net.http_post(
      url := 'https://tuwswtgpkgtckhmnjnru.supabase.co/functions/v1/notify-admin-new-booking',
      headers := '{"Content-Type": "application/json"}'::jsonb,
      body := json_build_object('appointment_id', NEW.id)::text
    ) INTO request_id;

    -- Log le request_id pour tracking
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

-- Créer le trigger
CREATE TRIGGER trigger_notify_admin_new_booking
  AFTER INSERT ON appointments
  FOR EACH ROW
  WHEN (NEW.booking_source = 'online')
  EXECUTE FUNCTION notify_admin_new_booking();

-- Vérifier que le trigger est bien créé
DO $$
BEGIN
  RAISE NOTICE 'Trigger trigger_notify_admin_new_booking créé avec succès';
END $$;
