/*
  # Trigger automatique d'envoi d'emails lors d'annulation de rendez-vous

  ## Description
  Ce trigger se déclenche automatiquement quand un rendez-vous est annulé (status = 'cancelled')
  et crée un slot_offer + appelle la fonction Edge pour envoyer les emails aux patients sur la waitlist.

  ## Tables modifiées
  - appointments: trigger on UPDATE when status changes to 'cancelled'

  ## Nouvelles fonctions
  1. `auto_process_cancelled_appointment()`: Trigger function qui:
     - Détecte quand status devient 'cancelled'
     - Crée un slot_offer
     - Appelle l'Edge Function process-cancellation via pg_net

  ## Sécurité
  - Vérifie que le changement de status est valide
  - Log toutes les actions dans waitlist_trigger_logs
  - Gestion d'erreurs complète

  ## Performance
  - Exécution asynchrone via pg_net
  - Ne bloque pas l'annulation du rendez-vous
  - Traitement en arrière-plan
*/

-- Fonction trigger qui se déclenche sur annulation
CREATE OR REPLACE FUNCTION auto_process_cancelled_appointment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_slot_offer_id uuid;
  v_request_id bigint;
  v_function_url text;
  v_service_role_key text;
  v_payload jsonb;
BEGIN
  -- Vérifie que le status est passé à 'cancelled'
  IF NEW.status = 'cancelled' AND (OLD.status IS NULL OR OLD.status != 'cancelled') THEN

    -- Log l'événement
    INSERT INTO waitlist_trigger_logs (
      trigger_name,
      appointment_id,
      event_type,
      event_data,
      status
    ) VALUES (
      'auto_process_cancelled_appointment',
      NEW.id,
      'appointment_cancelled',
      jsonb_build_object(
        'appointment_id', NEW.id,
        'scheduled_time', NEW.scheduled_time,
        'old_status', OLD.status,
        'new_status', NEW.status,
        'contact_id', NEW.contact_id
      ),
      'pending'
    );

    -- Crée un slot_offer pour ce créneau libéré
    INSERT INTO appointment_slot_offers (
      cancelled_appointment_id,
      slot_date,
      slot_time,
      slot_datetime,
      duration_minutes,
      reason,
      status,
      expires_at,
      max_invitations
    ) VALUES (
      NEW.id,
      NEW.scheduled_time::date,
      NEW.scheduled_time::time,
      NEW.scheduled_time,
      COALESCE(NEW.duration_minutes, 30),
      'Annulation de rendez-vous',
      'available',
      now() + interval '7 days',
      5
    )
    RETURNING id INTO v_slot_offer_id;

    -- Prépare l'URL de la fonction Edge
    -- Note: L'URL sera construite avec SUPABASE_URL qui est disponible dans l'environnement
    v_function_url := current_setting('app.settings.supabase_url', true) || '/functions/v1/process-cancellation';

    -- Si pas de setting, utilise une URL par défaut (sera overridé par les variables d'environnement)
    IF v_function_url IS NULL OR v_function_url = '' THEN
      v_function_url := 'http://localhost:54321/functions/v1/process-cancellation';
    END IF;

    -- Récupère la clé de service (si configurée)
    v_service_role_key := current_setting('app.settings.service_role_key', true);

    -- Prépare le payload
    v_payload := jsonb_build_object(
      'slot_offer_id', v_slot_offer_id,
      'slot_datetime', NEW.scheduled_time,
      'appointment_id', NEW.id
    );

    -- Appelle l'Edge Function via pg_net de manière asynchrone
    BEGIN
      SELECT net.http_post(
        url := v_function_url,
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || COALESCE(v_service_role_key, '')
        ),
        body := v_payload
      ) INTO v_request_id;

      -- Log le succès
      UPDATE waitlist_trigger_logs
      SET
        status = 'success',
        result_data = jsonb_build_object(
          'slot_offer_id', v_slot_offer_id,
          'request_id', v_request_id,
          'function_url', v_function_url
        ),
        processed_at = now()
      WHERE appointment_id = NEW.id
        AND trigger_name = 'auto_process_cancelled_appointment'
        AND status = 'pending';

    EXCEPTION WHEN OTHERS THEN
      -- Log l'erreur mais ne bloque pas la transaction
      UPDATE waitlist_trigger_logs
      SET
        status = 'error',
        error_message = SQLERRM,
        processed_at = now()
      WHERE appointment_id = NEW.id
        AND trigger_name = 'auto_process_cancelled_appointment'
        AND status = 'pending';

      -- Note: On ne RAISE pas l'erreur pour ne pas bloquer l'annulation
      -- L'admin peut réessayer manuellement via le dashboard
    END;

  END IF;

  RETURN NEW;
END;
$$;

-- Crée le trigger sur appointments
DROP TRIGGER IF EXISTS trigger_auto_process_cancellation ON appointments;

CREATE TRIGGER trigger_auto_process_cancellation
  AFTER UPDATE OF status ON appointments
  FOR EACH ROW
  WHEN (NEW.status = 'cancelled' AND (OLD.status IS DISTINCT FROM 'cancelled'))
  EXECUTE FUNCTION auto_process_cancelled_appointment();

-- Fonction helper pour obtenir les stats du système
CREATE OR REPLACE FUNCTION get_cancellation_automation_stats()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_stats jsonb;
BEGIN
  SELECT jsonb_build_object(
    'total_cancellations', (
      SELECT COUNT(*) FROM appointments WHERE status = 'cancelled'
    ),
    'slot_offers_created', (
      SELECT COUNT(*) FROM appointment_slot_offers
    ),
    'invitations_sent', (
      SELECT COUNT(*) FROM slot_offer_invitations
    ),
    'slots_claimed', (
      SELECT COUNT(*) FROM appointment_slot_offers WHERE status = 'claimed'
    ),
    'success_rate', (
      SELECT ROUND(
        (COUNT(*) FILTER (WHERE status = 'claimed')::numeric /
         NULLIF(COUNT(*), 0) * 100), 2
      )
      FROM appointment_slot_offers
    ),
    'last_24h', jsonb_build_object(
      'cancellations', (
        SELECT COUNT(*) FROM appointments
        WHERE status = 'cancelled'
        AND updated_at > now() - interval '24 hours'
      ),
      'emails_sent', (
        SELECT COUNT(*) FROM slot_offer_invitations
        WHERE sent_at > now() - interval '24 hours'
      ),
      'slots_claimed', (
        SELECT COUNT(*) FROM appointment_slot_offers
        WHERE status = 'claimed'
        AND claimed_at > now() - interval '24 hours'
      )
    ),
    'recent_logs', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', id,
          'event_type', event_type,
          'status', status,
          'created_at', created_at,
          'error_message', error_message
        )
      )
      FROM (
        SELECT * FROM waitlist_trigger_logs
        WHERE trigger_name = 'auto_process_cancelled_appointment'
        ORDER BY created_at DESC
        LIMIT 10
      ) recent
    )
  ) INTO v_stats;

  RETURN v_stats;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION auto_process_cancelled_appointment() TO authenticated;
GRANT EXECUTE ON FUNCTION get_cancellation_automation_stats() TO authenticated;

-- Commentaires
COMMENT ON FUNCTION auto_process_cancelled_appointment() IS
  'Trigger automatique qui envoie des emails aux patients sur la waitlist quand un RDV est annulé';

COMMENT ON FUNCTION get_cancellation_automation_stats() IS
  'Retourne les statistiques du système d''automatisation des annulations';

-- Créer une vue pour faciliter le monitoring
CREATE OR REPLACE VIEW cancellation_automation_monitor AS
SELECT
  a.id as appointment_id,
  a.scheduled_time,
  a.status as appointment_status,
  aso.id as slot_offer_id,
  aso.status as slot_status,
  aso.invitation_count,
  aso.claimed_by,
  aso.claimed_at,
  COUNT(soi.id) as invitations_sent,
  COUNT(soi.id) FILTER (WHERE soi.status = 'accepted') as invitations_accepted,
  MAX(wtl.created_at) as last_trigger_log,
  MAX(wtl.status) as last_trigger_status,
  MAX(wtl.error_message) as last_error
FROM appointments a
LEFT JOIN appointment_slot_offers aso ON aso.cancelled_appointment_id = a.id
LEFT JOIN slot_offer_invitations soi ON soi.slot_offer_id = aso.id
LEFT JOIN waitlist_trigger_logs wtl ON wtl.appointment_id = a.id
  AND wtl.trigger_name = 'auto_process_cancelled_appointment'
WHERE a.status = 'cancelled'
GROUP BY a.id, a.scheduled_time, a.status, aso.id, aso.status, aso.invitation_count, aso.claimed_by, aso.claimed_at
ORDER BY a.updated_at DESC;

-- Grant access to the view
GRANT SELECT ON cancellation_automation_monitor TO authenticated;

COMMENT ON VIEW cancellation_automation_monitor IS
  'Vue de monitoring pour suivre le système d''automatisation des annulations en temps réel';
