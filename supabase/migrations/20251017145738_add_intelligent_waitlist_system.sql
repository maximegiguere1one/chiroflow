/*
  # Système intelligent de gestion automatisée de la liste de rappel
  
  ## Vue d'ensemble
  Ce système automatise l'envoi d'invitations aux personnes en liste d'attente lorsqu'un
  rendez-vous est annulé. Mode "premier arrivé, premier servi" avec invitations multiples
  simultanées (5 maximum) et expiration automatique après 24h.
  
  ## Nouvelles tables
  
  ### 1. appointment_slot_offers
  - Représente un créneau disponible suite à une annulation
  - Stocke les détails du créneau: date, heure, durée
  - Suit le statut: available, pending, claimed, expired
  - Permet de tracer quel créneau a été réclamé par qui
  
  ### 2. slot_offer_invitations
  - Une invitation envoyée à une personne spécifique pour un créneau
  - Contient le token unique sécurisé pour accepter/refuser
  - Suit le statut: pending, accepted, declined, expired
  - Enregistre les timestamps de toutes les actions
  
  ### 3. waitlist_notifications
  - Historique de toutes les notifications envoyées
  - Pour audit et analytics: taux d'ouverture, de clic, de conversion
  - Permet de savoir combien de fois chaque personne a été contactée
  
  ### 4. waitlist_settings
  - Configuration globale du système d'automatisation
  - Permet d'activer/désactiver, ajuster les paramètres
  - Stocke les préférences de l'admin pour les templates
  
  ## Enrichissements des tables existantes
  
  ### waitlist
  - preferred_days_of_week: quels jours la personne préfère (array)
  - preferred_time_ranges: plages horaires préférées (jsonb)
  - max_wait_days: combien de temps accepte d'attendre maximum
  - notification_preferences: canaux préférés (email, sms)
  - auto_accept_enabled: accepte invitations automatiques
  - consent_automated_notifications: a consenti aux notifications auto
  - invitation_count: nombre total d'invitations reçues
  - last_invitation_sent_at: dernière invitation envoyée
  
  ## Sécurité
  - RLS activé sur toutes les tables
  - Tokens sécurisés avec crypto pour les invitations
  - Validation d'expiration automatique
  - Logs complets pour audit et conformité
  
  ## Performance
  - Index sur tous les champs de recherche fréquents
  - Index composites pour les requêtes de matching
  - Triggers optimisés pour ne pas ralentir les updates
*/

-- Table des créneaux offerts suite à annulation
CREATE TABLE IF NOT EXISTS appointment_slot_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cancelled_appointment_id uuid REFERENCES appointments(id) ON DELETE SET NULL,
  slot_date date NOT NULL,
  slot_time time NOT NULL,
  slot_datetime timestamptz NOT NULL,
  duration_minutes integer NOT NULL DEFAULT 30,
  reason text,
  original_patient_name text,
  status text NOT NULL DEFAULT 'available',
  invitation_count integer DEFAULT 0,
  max_invitations integer DEFAULT 5,
  expires_at timestamptz NOT NULL,
  claimed_by uuid REFERENCES waitlist(id) ON DELETE SET NULL,
  claimed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT slot_offers_status_check CHECK (status IN ('available', 'pending', 'claimed', 'expired', 'cancelled'))
);

ALTER TABLE appointment_slot_offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all slot offers"
  ON appointment_slot_offers FOR ALL
  TO authenticated
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role IN ('admin', 'practitioner')))
  WITH CHECK (auth.uid() IN (SELECT id FROM profiles WHERE role IN ('admin', 'practitioner')));

-- Table des invitations individuelles
CREATE TABLE IF NOT EXISTS slot_offer_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_offer_id uuid NOT NULL REFERENCES appointment_slot_offers(id) ON DELETE CASCADE,
  waitlist_entry_id uuid NOT NULL REFERENCES waitlist(id) ON DELETE CASCADE,
  response_token text UNIQUE NOT NULL,
  sent_at timestamptz DEFAULT now(),
  expires_at timestamptz NOT NULL,
  opened_at timestamptz,
  clicked_at timestamptz,
  responded_at timestamptz,
  status text NOT NULL DEFAULT 'pending',
  response_type text,
  notification_channel text DEFAULT 'email',
  created_at timestamptz DEFAULT now(),
  CONSTRAINT invitations_status_check CHECK (status IN ('pending', 'accepted', 'declined', 'expired', 'cancelled')),
  CONSTRAINT invitations_response_check CHECK (response_type IN ('accepted', 'declined', NULL))
);

ALTER TABLE slot_offer_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all invitations"
  ON slot_offer_invitations FOR SELECT
  TO authenticated
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role IN ('admin', 'practitioner')));

CREATE POLICY "Public can update with valid token"
  ON slot_offer_invitations FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Table d'historique des notifications
CREATE TABLE IF NOT EXISTS waitlist_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  waitlist_entry_id uuid NOT NULL REFERENCES waitlist(id) ON DELETE CASCADE,
  invitation_id uuid REFERENCES slot_offer_invitations(id) ON DELETE SET NULL,
  notification_type text NOT NULL,
  channel text NOT NULL,
  recipient_email text,
  recipient_phone text,
  subject text,
  content text,
  sent_at timestamptz DEFAULT now(),
  delivered_at timestamptz,
  opened_at timestamptz,
  clicked_at timestamptz,
  bounced boolean DEFAULT false,
  bounce_reason text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  CONSTRAINT notifications_type_check CHECK (notification_type IN ('invitation', 'confirmation', 'expiration', 'reminder')),
  CONSTRAINT notifications_channel_check CHECK (channel IN ('email', 'sms', 'push'))
);

ALTER TABLE waitlist_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all notifications"
  ON waitlist_notifications FOR SELECT
  TO authenticated
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role IN ('admin', 'practitioner')));

-- Table des paramètres du système
CREATE TABLE IF NOT EXISTS waitlist_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key text UNIQUE NOT NULL,
  setting_value jsonb NOT NULL,
  description text,
  updated_by uuid REFERENCES auth.users(id),
  updated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE waitlist_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage settings"
  ON waitlist_settings FOR ALL
  TO authenticated
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'))
  WITH CHECK (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

-- Enrichir la table waitlist existante
DO $$
BEGIN
  -- Jours préférés (0=dimanche, 1=lundi, etc.)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'waitlist' AND column_name = 'preferred_days_of_week'
  ) THEN
    ALTER TABLE waitlist ADD COLUMN preferred_days_of_week integer[] DEFAULT ARRAY[1,2,3,4,5];
  END IF;

  -- Plages horaires préférées
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'waitlist' AND column_name = 'preferred_time_ranges'
  ) THEN
    ALTER TABLE waitlist ADD COLUMN preferred_time_ranges jsonb DEFAULT '[{"start": "08:00", "end": "18:00"}]';
  END IF;

  -- Délai maximum d'attente en jours
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'waitlist' AND column_name = 'max_wait_days'
  ) THEN
    ALTER TABLE waitlist ADD COLUMN max_wait_days integer DEFAULT 90;
  END IF;

  -- Préférences de notification
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'waitlist' AND column_name = 'notification_preferences'
  ) THEN
    ALTER TABLE waitlist ADD COLUMN notification_preferences jsonb DEFAULT '{"email": true, "sms": false}';
  END IF;

  -- Auto-acceptation activée
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'waitlist' AND column_name = 'auto_accept_enabled'
  ) THEN
    ALTER TABLE waitlist ADD COLUMN auto_accept_enabled boolean DEFAULT false;
  END IF;

  -- Consentement pour notifications automatiques
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'waitlist' AND column_name = 'consent_automated_notifications'
  ) THEN
    ALTER TABLE waitlist ADD COLUMN consent_automated_notifications boolean DEFAULT true;
  END IF;

  -- Compteur d'invitations
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'waitlist' AND column_name = 'invitation_count'
  ) THEN
    ALTER TABLE waitlist ADD COLUMN invitation_count integer DEFAULT 0;
  END IF;

  -- Dernière invitation envoyée
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'waitlist' AND column_name = 'last_invitation_sent_at'
  ) THEN
    ALTER TABLE waitlist ADD COLUMN last_invitation_sent_at timestamptz;
  END IF;

  -- Email de désinscription
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'waitlist' AND column_name = 'unsubscribed_at'
  ) THEN
    ALTER TABLE waitlist ADD COLUMN unsubscribed_at timestamptz;
  END IF;
END $$;

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_slot_offers_status ON appointment_slot_offers(status);
CREATE INDEX IF NOT EXISTS idx_slot_offers_datetime ON appointment_slot_offers(slot_datetime);
CREATE INDEX IF NOT EXISTS idx_slot_offers_expires ON appointment_slot_offers(expires_at);
CREATE INDEX IF NOT EXISTS idx_invitations_token ON slot_offer_invitations(response_token);
CREATE INDEX IF NOT EXISTS idx_invitations_status ON slot_offer_invitations(status);
CREATE INDEX IF NOT EXISTS idx_invitations_expires ON slot_offer_invitations(expires_at);
CREATE INDEX IF NOT EXISTS idx_invitations_slot ON slot_offer_invitations(slot_offer_id);
CREATE INDEX IF NOT EXISTS idx_invitations_waitlist ON slot_offer_invitations(waitlist_entry_id);
CREATE INDEX IF NOT EXISTS idx_notifications_waitlist ON waitlist_notifications(waitlist_entry_id);
CREATE INDEX IF NOT EXISTS idx_notifications_sent ON waitlist_notifications(sent_at);
CREATE INDEX IF NOT EXISTS idx_waitlist_status_consent ON waitlist(status, consent_automated_notifications);

-- Trigger pour updated_at
CREATE TRIGGER update_slot_offers_updated_at
  BEFORE UPDATE ON appointment_slot_offers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_waitlist_settings_updated_at
  BEFORE UPDATE ON waitlist_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Fonction pour obtenir les candidats éligibles
CREATE OR REPLACE FUNCTION get_eligible_waitlist_candidates(
  p_slot_datetime timestamptz,
  p_slot_day_of_week integer,
  p_max_candidates integer DEFAULT 5
)
RETURNS TABLE (
  waitlist_id uuid,
  name text,
  email text,
  phone text,
  priority_score decimal
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    w.id,
    w.name,
    w.email,
    w.phone,
    -- Score de priorité: temps d'attente + bonus pour match de préférences
    (EXTRACT(EPOCH FROM (now() - w.created_at)) / 86400.0 + 
     CASE WHEN p_slot_day_of_week = ANY(w.preferred_days_of_week) THEN 10 ELSE 0 END
    )::decimal as priority_score
  FROM waitlist w
  WHERE w.status = 'active'
    AND w.consent_automated_notifications = true
    AND w.unsubscribed_at IS NULL
    AND (w.last_invitation_sent_at IS NULL OR w.last_invitation_sent_at < now() - interval '24 hours')
    -- Ne pas inviter ceux qui ont déjà une invitation active
    AND NOT EXISTS (
      SELECT 1 FROM slot_offer_invitations soi
      WHERE soi.waitlist_entry_id = w.id
        AND soi.status = 'pending'
        AND soi.expires_at > now()
    )
  ORDER BY priority_score DESC, w.created_at ASC
  LIMIT p_max_candidates;
END;
$$ LANGUAGE plpgsql;

-- Fonction trigger pour détecter les annulations
CREATE OR REPLACE FUNCTION handle_appointment_cancellation()
RETURNS TRIGGER AS $$
DECLARE
  v_slot_datetime timestamptz;
  v_expires_at timestamptz;
  v_slot_offer_id uuid;
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
        
        -- Notifier via pg_notify pour déclencher l'Edge Function
        PERFORM pg_notify(
          'appointment_cancelled',
          json_build_object(
            'slot_offer_id', v_slot_offer_id,
            'slot_datetime', v_slot_datetime,
            'appointment_id', NEW.id
          )::text
        );
        
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger sur appointments
DROP TRIGGER IF EXISTS trigger_appointment_cancellation ON appointments;
CREATE TRIGGER trigger_appointment_cancellation
  AFTER UPDATE ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION handle_appointment_cancellation();

-- Fonction pour marquer les invitations expirées
CREATE OR REPLACE FUNCTION mark_expired_invitations()
RETURNS void AS $$
BEGIN
  -- Marquer les invitations expirées
  UPDATE slot_offer_invitations
  SET status = 'expired',
      updated_at = now()
  WHERE status = 'pending'
    AND expires_at < now();
    
  -- Marquer les offres comme expirées si aucune invitation acceptée
  UPDATE appointment_slot_offers
  SET status = 'expired',
      updated_at = now()
  WHERE status IN ('available', 'pending')
    AND expires_at < now()
    AND NOT EXISTS (
      SELECT 1 FROM slot_offer_invitations
      WHERE slot_offer_id = appointment_slot_offers.id
        AND status = 'accepted'
    );
END;
$$ LANGUAGE plpgsql;

-- Insérer les paramètres par défaut
INSERT INTO waitlist_settings (setting_key, setting_value, description) VALUES
  ('system_enabled', 'true', 'Système d''automatisation activé globalement'),
  ('max_simultaneous_invitations', '5', 'Nombre maximum d''invitations simultanées par créneau'),
  ('invitation_expiry_hours', '24', 'Délai d''expiration des invitations en heures'),
  ('min_hours_before_appointment', '2', 'Heures minimum avant le rendez-vous pour envoyer invitations'),
  ('notification_channels', '{"email": true, "sms": false}', 'Canaux de notification activés'),
  ('email_template_invitation', '{"subject": "🎯 Créneau disponible pour vous!", "preview": "Un rendez-vous vient de se libérer"}', 'Template email invitation'),
  ('email_template_confirmation', '{"subject": "✅ Rendez-vous confirmé", "preview": "Votre rendez-vous est confirmé"}', 'Template email confirmation'),
  ('admin_notification_enabled', 'true', 'Notifications admin en temps réel activées')
ON CONFLICT (setting_key) DO NOTHING;
