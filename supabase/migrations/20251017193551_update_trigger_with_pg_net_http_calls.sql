/*
  # Mise à jour du trigger d'annulation pour utiliser pg_net et appeler automatiquement process-cancellation

  1. Modification de la fonction handle_appointment_cancellation
    - Remplace pg_notify par un vrai appel HTTP via pg_net
    - Appelle directement l'Edge Function process-cancellation
    - Enregistre les logs dans waitlist_trigger_logs
    - Gère les erreurs gracieusement sans bloquer la transaction

  2. Comportement
    - Détecte les annulations (status = 'cancelled' ou 'no_show')
    - Crée automatiquement un slot offer dans appointment_slot_offers
    - Appelle process-cancellation via HTTP POST asynchrone
    - Log tous les appels pour debugging
    - Ne bloque jamais la transaction principale

  3. Notes Techniques
    - pg_net.http_post est asynchrone, ne bloque pas
    - L'appel HTTP se fait en arrière-plan
    - Les logs permettent de tracer chaque étape
    - En cas d'échec de l'appel HTTP, le slot est quand même créé
    - Le système monitor-waitlist-system pourra retraiter les échecs
*/

-- Fonction améliorée avec pg_net pour appels HTTP automatiques
CREATE OR REPLACE FUNCTION handle_appointment_cancellation()
RETURNS TRIGGER AS $$
DECLARE
  v_slot_datetime timestamptz;
  v_expires_at timestamptz;
  v_slot_offer_id uuid;
  v_log_id uuid;
  v_function_url text;
  v_request_id bigint;
  v_supabase_url text;
  v_service_role_key text;
BEGIN
  -- Vérifier si le statut est passé à cancelled ou no_show
  IF NEW.status IN ('cancelled', 'no_show') AND OLD.status NOT IN ('cancelled', 'no_show') THEN
    
    -- Vérifier que le rendez-vous a une date/heure planifiée
    IF NEW.scheduled_date IS NOT NULL AND NEW.scheduled_time IS NOT NULL THEN
      
      -- Construire le timestamp complet
      v_slot_datetime := (NEW.scheduled_date || ' ' || NEW.scheduled_time)::timestamptz;
      
      -- Ne créer une offre que si le créneau est dans le futur et à plus de 2h
      IF v_slot_datetime > now() + interval '2 hours' THEN
        
        -- Calculer l'expiration: 24h ou jusqu'à 2h avant le rendez-vous
        v_expires_at := LEAST(
          now() + interval '24 hours',
          v_slot_datetime - interval '2 hours'
        );
        
        -- Créer l'offre de créneau
        INSERT INTO appointment_slot_offers (
          cancelled_appointment_id,
          slot_date,
          slot_time,
          slot_datetime,
          duration_minutes,
          reason,
          original_patient_name,
          status,
          expires_at
        ) VALUES (
          NEW.id,
          NEW.scheduled_date,
          NEW.scheduled_time,
          v_slot_datetime,
          COALESCE(NEW.duration_minutes, 30),
          NEW.reason,
          NEW.name,
          'available',
          v_expires_at
        )
        RETURNING id INTO v_slot_offer_id;
        
        -- Créer un log initial
        INSERT INTO waitlist_trigger_logs (
          slot_offer_id,
          trigger_type,
          action,
          status,
          metadata
        ) VALUES (
          v_slot_offer_id,
          'trigger_db',
          'create_slot_and_call_function',
          'pending',
          jsonb_build_object(
            'appointment_id', NEW.id,
            'slot_datetime', v_slot_datetime,
            'patient_name', NEW.name
          )
        )
        RETURNING id INTO v_log_id;
        
        -- Récupérer les variables d'environnement depuis vault
        -- Note: Ces valeurs doivent être configurées dans Supabase Dashboard -> Project Settings -> Vault
        BEGIN
          SELECT decrypted_secret INTO v_supabase_url 
          FROM vault.decrypted_secrets 
          WHERE name = 'SUPABASE_URL';
          
          SELECT decrypted_secret INTO v_service_role_key 
          FROM vault.decrypted_secrets 
          WHERE name = 'SUPABASE_SERVICE_ROLE_KEY';
        EXCEPTION WHEN OTHERS THEN
          -- Fallback: utiliser les variables PostgreSQL settings si disponibles
          v_supabase_url := current_setting('app.settings.supabase_url', true);
          v_service_role_key := current_setting('app.settings.service_role_key', true);
        END;
        
        -- Si on n'a pas les credentials, utiliser une URL par défaut (projet actuel)
        IF v_supabase_url IS NULL OR v_supabase_url = '' THEN
          v_supabase_url := 'https://tuwswtgpkgtckhmnjnru.supabase.co';
        END IF;
        
        -- Construire l'URL de la fonction
        v_function_url := v_supabase_url || '/functions/v1/process-cancellation';
        
        -- Appeler l'Edge Function via pg_net (asynchrone, ne bloque pas)
        BEGIN
          SELECT INTO v_request_id
            extensions.http_post(
              url := v_function_url,
              headers := jsonb_build_object(
                'Content-Type', 'application/json',
                'Authorization', 'Bearer ' || COALESCE(v_service_role_key, '')
              ),
              body := jsonb_build_object(
                'slot_offer_id', v_slot_offer_id,
                'slot_datetime', v_slot_datetime,
                'appointment_id', NEW.id
              )
            );
          
          -- Mettre à jour le log avec le request_id
          UPDATE waitlist_trigger_logs
          SET 
            status = 'success',
            metadata = metadata || jsonb_build_object(
              'request_id', v_request_id,
              'function_url', v_function_url,
              'called_at', now()
            )
          WHERE id = v_log_id;
          
        EXCEPTION WHEN OTHERS THEN
          -- En cas d'erreur, logger mais ne pas bloquer
          UPDATE waitlist_trigger_logs
          SET 
            status = 'error',
            error_message = SQLERRM,
            metadata = metadata || jsonb_build_object(
              'error_detail', SQLSTATE,
              'function_url', v_function_url
            )
          WHERE id = v_log_id;
        END;
        
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Re-créer le trigger (il existe déjà, donc on le remplace)
DROP TRIGGER IF EXISTS trigger_appointment_cancellation ON appointments;
CREATE TRIGGER trigger_appointment_cancellation
  AFTER UPDATE ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION handle_appointment_cancellation();