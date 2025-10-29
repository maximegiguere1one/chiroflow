/*
  # Fonction manuelle pour notifier les recall clients

  ## Description
  Fonction SQL qui peut être appelée manuellement pour envoyer les notifications
  aux recall clients quand un rendez-vous est annulé.

  ## Usage
  SELECT manual_notify_recall_clients(
    'date-du-creneau',
    'heure-du-creneau',
    'owner-id'
  );
*/

CREATE OR REPLACE FUNCTION manual_notify_recall_clients(
  p_cancelled_date date,
  p_cancelled_time time,
  p_owner_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_recall_clients record;
  v_notification_count int := 0;
  v_results jsonb := '[]'::jsonb;
BEGIN
  -- Récupère tous les clients de recall actifs
  FOR v_recall_clients IN
    SELECT *
    FROM recall_waitlist
    WHERE owner_id = p_owner_id
      AND status = 'active'
    ORDER BY priority DESC, added_at
  LOOP
    -- Vérifie si le client est éligible
    IF v_recall_clients.current_appointment_date IS NULL OR
       (p_cancelled_date < v_recall_clients.current_appointment_date::date AND
        (v_recall_clients.current_appointment_date::date - p_cancelled_date) <= v_recall_clients.willing_to_move_forward_by_days)
    THEN
      -- Crée une invitation
      INSERT INTO waitlist_invitations (
        owner_id,
        invitation_type,
        waitlist_entry_id,
        recipient_name,
        recipient_email,
        recipient_phone,
        opportunity_type,
        available_slot_date,
        available_slot_time,
        email_sent_successfully
      ) VALUES (
        p_owner_id,
        'recall_client',
        v_recall_clients.id,
        v_recall_clients.patient_name,
        v_recall_clients.patient_email,
        v_recall_clients.patient_phone,
        'appointment_cancelled',
        p_cancelled_date::timestamptz,
        p_cancelled_time::text,
        false -- Les emails seront envoyés par le système externe
      );

      -- Met à jour le statut du recall client
      UPDATE recall_waitlist
      SET
        status = 'notified',
        last_notified_at = now()
      WHERE id = v_recall_clients.id;

      v_notification_count := v_notification_count + 1;

      -- Ajoute au résultat
      v_results := v_results || jsonb_build_object(
        'name', v_recall_clients.patient_name,
        'email', v_recall_clients.patient_email,
        'eligible', true
      );
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'notified_count', v_notification_count,
    'clients', v_results
  );
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION manual_notify_recall_clients(date, time, uuid) TO authenticated;

COMMENT ON FUNCTION manual_notify_recall_clients IS
  'Fonction manuelle pour notifier les recall clients lors d''une annulation';
