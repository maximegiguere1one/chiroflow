/*
  # Automatisation simplifiée des emails de rappel

  ## Description
  Version simplifiée qui enregistre juste un log quand un RDV est annulé.
  Les emails seront envoyés manuellement via le dashboard ou automatiquement
  via un cron job qui vérifie les logs.

  ## Fonctionnement
  1. Un rendez-vous est annulé (status = 'cancelled')
  2. Trigger crée un log avec les infos du créneau libéré
  3. Dashboard affiche une notification "Nouveau créneau libre!"
  4. Admin peut cliquer pour envoyer les emails aux recall clients
*/

-- Remplace la fonction trigger par une version plus simple
CREATE OR REPLACE FUNCTION auto_notify_recall_on_cancellation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Vérifie que le status est passé à 'cancelled'
  IF NEW.status = 'cancelled' AND (OLD.status IS NULL OR OLD.status != 'cancelled') THEN

    -- Log l'événement simplement
    INSERT INTO waitlist_trigger_logs (
      trigger_type,
      action,
      status,
      metadata
    ) VALUES (
      'trigger_db',
      'appointment_cancelled_for_recall',
      'pending',
      jsonb_build_object(
        'type', 'recall_notification_needed',
        'appointment_id', NEW.id,
        'scheduled_date', NEW.scheduled_date,
        'scheduled_time', NEW.scheduled_time,
        'contact_id', NEW.contact_id,
        'service_type_id', NEW.service_type_id,
        'message', 'Créneau libéré - Envoyer aux clients de rappel'
      )
    );

  END IF;

  RETURN NEW;
END;
$$;

-- Le trigger existe déjà, pas besoin de le recréer

COMMENT ON FUNCTION auto_notify_recall_on_cancellation() IS
  'Trigger qui enregistre les créneaux libérés pour notification des recall clients';
