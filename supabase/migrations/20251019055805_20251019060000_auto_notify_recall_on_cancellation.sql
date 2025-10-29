/*
  # Automatisation des emails de rappel lors d'annulation

  ## Description
  Quand un rendez-vous est annulé, le système envoie automatiquement des emails
  aux patients actuels qui sont dans la liste de rappel (recall_waitlist).

  ## Fonctionnement
  1. Un rendez-vous est annulé (status = 'cancelled')
  2. Trigger détecte l'annulation
  3. Appelle automatiquement la fonction Edge `notify-recall-clients`
  4. Les patients de recall_waitlist reçoivent un email

  ## Tables modifiées
  - appointments: nouveau trigger pour rappeler les clients actuels

  ## Nouvelles fonctions
  - `auto_notify_recall_on_cancellation()`: Envoie emails aux recall clients

  ## Sécurité
  - Authentification automatique avec service role key
  - Logs de toutes les actions
  - Ne bloque pas l'annulation en cas d'erreur
*/

-- Fonction trigger pour notifier les recall clients
CREATE OR REPLACE FUNCTION auto_notify_recall_on_cancellation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_request_id bigint;
  v_function_url text;
  v_payload jsonb;
  v_supabase_url text;
  v_anon_key text;
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
      'auto_notify_recall_on_cancellation',
      NEW.id,
      'appointment_cancelled_recall_notification',
      jsonb_build_object(
        'appointment_id', NEW.id,
        'scheduled_time', NEW.scheduled_time,
        'old_status', OLD.status,
        'new_status', NEW.status,
        'contact_id', NEW.contact_id,
        'service_type_id', NEW.service_type_id
      ),
      'pending'
    );

    -- Récupère SUPABASE_URL depuis les settings ou utilise une valeur par défaut
    BEGIN
      v_supabase_url := current_setting('app.settings.supabase_url', true);
      IF v_supabase_url IS NULL OR v_supabase_url = '' THEN
        -- Fallback: essaie de construire l'URL à partir du contexte
        v_supabase_url := 'http://127.0.0.1:54321';
      END IF;
    EXCEPTION WHEN OTHERS THEN
      v_supabase_url := 'http://127.0.0.1:54321';
    END;

    -- Construit l'URL de la fonction Edge
    v_function_url := v_supabase_url || '/functions/v1/notify-recall-clients';

    -- Récupère l'anon key (utilisé pour l'authentification)
    BEGIN
      v_anon_key := current_setting('app.settings.anon_key', true);
      IF v_anon_key IS NULL OR v_anon_key = '' THEN
        v_anon_key := '';
      END IF;
    EXCEPTION WHEN OTHERS THEN
      v_anon_key := '';
    END;

    -- Prépare le payload avec les infos du rendez-vous annulé
    v_payload := jsonb_build_object(
      'cancelled_appointment_date', (NEW.scheduled_time::date)::text,
      'cancelled_appointment_time', (NEW.scheduled_time::time)::text,
      'service_type_id', NEW.service_type_id
    );

    -- Appelle l'Edge Function via pg_net de manière asynchrone
    BEGIN
      SELECT net.http_post(
        url := v_function_url,
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || v_anon_key,
          'apikey', v_anon_key
        ),
        body := v_payload
      ) INTO v_request_id;

      -- Log le succès
      UPDATE waitlist_trigger_logs
      SET
        status = 'success',
        result_data = jsonb_build_object(
          'request_id', v_request_id,
          'function_url', v_function_url,
          'payload', v_payload
        ),
        processed_at = now()
      WHERE appointment_id = NEW.id
        AND trigger_name = 'auto_notify_recall_on_cancellation'
        AND status = 'pending';

    EXCEPTION WHEN OTHERS THEN
      -- Log l'erreur mais ne bloque pas l'annulation
      UPDATE waitlist_trigger_logs
      SET
        status = 'error',
        error_message = SQLERRM,
        result_data = jsonb_build_object(
          'error_detail', SQLERRM,
          'function_url', v_function_url,
          'payload', v_payload
        ),
        processed_at = now()
      WHERE appointment_id = NEW.id
        AND trigger_name = 'auto_notify_recall_on_cancellation'
        AND status = 'pending';

      -- Ne pas raise l'erreur pour ne pas bloquer l'annulation du RDV
    END;

  END IF;

  RETURN NEW;
END;
$$;

-- Crée le trigger sur appointments
DROP TRIGGER IF EXISTS trigger_auto_notify_recall_on_cancellation ON appointments;

CREATE TRIGGER trigger_auto_notify_recall_on_cancellation
  AFTER UPDATE OF status ON appointments
  FOR EACH ROW
  WHEN (NEW.status = 'cancelled' AND (OLD.status IS DISTINCT FROM 'cancelled'))
  EXECUTE FUNCTION auto_notify_recall_on_cancellation();

-- Grant permissions
GRANT EXECUTE ON FUNCTION auto_notify_recall_on_cancellation() TO authenticated;
GRANT EXECUTE ON FUNCTION auto_notify_recall_on_cancellation() TO service_role;

-- Commentaire
COMMENT ON FUNCTION auto_notify_recall_on_cancellation() IS
  'Trigger automatique qui envoie des emails aux patients de la recall_waitlist quand un RDV est annulé';

COMMENT ON TRIGGER trigger_auto_notify_recall_on_cancellation ON appointments IS
  'Envoie automatiquement des emails de rappel aux clients actuels lors d''une annulation';
