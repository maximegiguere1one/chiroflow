/*
  # Amélioration du système de rappels avec confirmation de présence

  1. Modifications de appointment_reminders
    - Ajout de `scheduled_send_at` (quand envoyer)
    - Ajout de `status` (pending, sent, failed, cancelled)
    - Ajout de `confirmed` (patient a confirmé)
    - Ajout de `confirmed_at` (date de confirmation)

  2. Nouvelles fonctions
    - Fonction de confirmation publique avec token
    - Fonction de création automatique des rappels
    - Vue des rappels à envoyer
*/

-- Ajouter les nouvelles colonnes à appointment_reminders
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'appointment_reminders' AND column_name = 'scheduled_send_at'
  ) THEN
    ALTER TABLE appointment_reminders ADD COLUMN scheduled_send_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'appointment_reminders' AND column_name = 'status'
  ) THEN
    ALTER TABLE appointment_reminders ADD COLUMN status text DEFAULT 'pending';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'appointment_reminders' AND column_name = 'confirmed'
  ) THEN
    ALTER TABLE appointment_reminders ADD COLUMN confirmed boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'appointment_reminders' AND column_name = 'confirmed_at'
  ) THEN
    ALTER TABLE appointment_reminders ADD COLUMN confirmed_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'appointment_reminders' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE appointment_reminders ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END $$;

-- Ajouter contrainte sur status
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'appointment_reminders_status_check'
  ) THEN
    ALTER TABLE appointment_reminders ADD CONSTRAINT appointment_reminders_status_check 
      CHECK (status IN ('pending', 'sent', 'failed', 'cancelled'));
  END IF;
END $$;

-- Fonction pour créer automatiquement les rappels lors de la création d'un RDV
CREATE OR REPLACE FUNCTION create_appointment_reminders()
RETURNS TRIGGER AS $$
BEGIN
  -- Créer un rappel 24h avant (seulement si le RDV est dans plus de 24h)
  IF NEW.scheduled_date > (now() + interval '24 hours') THEN
    INSERT INTO appointment_reminders (
      appointment_id,
      reminder_type,
      scheduled_send_at,
      status
    ) VALUES (
      NEW.id,
      '24h',
      NEW.scheduled_date - interval '24 hours',
      'pending'
    ) ON CONFLICT (appointment_id, reminder_type) DO NOTHING;
  END IF;
  
  -- Créer un rappel de confirmation 48h avant (pour demander confirmation)
  IF NEW.scheduled_date > (now() + interval '48 hours') THEN
    INSERT INTO appointment_reminders (
      appointment_id,
      reminder_type,
      scheduled_send_at,
      status
    ) VALUES (
      NEW.id,
      'confirmation',
      NEW.scheduled_date - interval '48 hours',
      'pending'
    ) ON CONFLICT (appointment_id, reminder_type) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour créer les rappels automatiquement
DROP TRIGGER IF EXISTS create_reminders_on_appointment ON appointments;
CREATE TRIGGER create_reminders_on_appointment
  AFTER INSERT OR UPDATE OF scheduled_date ON appointments
  FOR EACH ROW
  WHEN (NEW.status IN ('scheduled', 'confirmed'))
  EXECUTE FUNCTION create_appointment_reminders();

-- Fonction pour marquer un RDV comme confirmé (accessible publiquement avec token)
CREATE OR REPLACE FUNCTION confirm_appointment_attendance(
  p_confirmation_token text
)
RETURNS json AS $$
DECLARE
  v_appointment_id uuid;
  v_scheduled_date timestamptz;
  v_patient_name text;
BEGIN
  -- Trouver le RDV avec ce token
  SELECT id, scheduled_date, name INTO v_appointment_id, v_scheduled_date, v_patient_name
  FROM appointments
  WHERE confirmation_token = p_confirmation_token
  AND status IN ('scheduled', 'confirmed')
  AND scheduled_date > now();
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Rendez-vous non trouvé ou déjà passé'
    );
  END IF;
  
  -- Mettre à jour le RDV
  UPDATE appointments
  SET 
    presence_confirmed = true,
    presence_confirmed_at = now(),
    status = 'confirmed',
    updated_at = now()
  WHERE id = v_appointment_id;
  
  -- Mettre à jour le rappel
  UPDATE appointment_reminders
  SET 
    confirmed = true,
    confirmed_at = now(),
    updated_at = now()
  WHERE appointment_id = v_appointment_id
  AND reminder_type = 'confirmation';
  
  RETURN json_build_object(
    'success', true,
    'message', 'Votre présence a été confirmée avec succès',
    'appointment', json_build_object(
      'date', v_scheduled_date,
      'patient_name', v_patient_name
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Vue pour les rappels à envoyer
CREATE OR REPLACE VIEW pending_reminders AS
SELECT 
  ar.id as reminder_id,
  ar.appointment_id,
  ar.reminder_type,
  ar.scheduled_send_at,
  ar.sent_at,
  a.scheduled_date,
  a.name as patient_name,
  a.email as patient_email,
  a.phone as patient_phone,
  a.confirmation_token,
  a.owner_id,
  a.presence_confirmed as patient_confirmed,
  st.name as service_name,
  st.duration_minutes
FROM appointment_reminders ar
JOIN appointments a ON ar.appointment_id = a.id
LEFT JOIN service_types st ON a.service_type_id = st.id
WHERE ar.status = 'pending'
AND ar.scheduled_send_at IS NOT NULL
AND ar.scheduled_send_at <= now()
AND a.status IN ('scheduled', 'confirmed')
AND a.scheduled_date > now()
ORDER BY ar.scheduled_send_at ASC;

-- Index pour la performance
CREATE INDEX IF NOT EXISTS idx_reminders_status_scheduled ON appointment_reminders(status, scheduled_send_at) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_reminders_appointment ON appointment_reminders(appointment_id);
CREATE INDEX IF NOT EXISTS idx_appointments_presence_confirmed ON appointments(presence_confirmed) WHERE presence_confirmed = false;

-- Accorder les permissions sur la vue
GRANT SELECT ON pending_reminders TO authenticated;

-- Mettre à jour les rappels existants pour avoir scheduled_send_at
UPDATE appointment_reminders ar
SET scheduled_send_at = a.scheduled_date - 
  CASE 
    WHEN ar.reminder_type = '24h' THEN interval '24 hours'
    WHEN ar.reminder_type = 'confirmation' THEN interval '48 hours'
    WHEN ar.reminder_type = '1h' THEN interval '1 hour'
    ELSE interval '24 hours'
  END,
  status = CASE WHEN ar.sent_at IS NOT NULL THEN 'sent' ELSE 'pending' END
FROM appointments a
WHERE ar.appointment_id = a.id
AND ar.scheduled_send_at IS NULL;
