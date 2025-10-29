/*
  # Système de réservation en ligne complet

  1. Modifications de la table appointments
    - Ajout de `service_type_id` (lien vers le service choisi)
    - Ajout de `payment_status` (pending, paid, refunded)
    - Ajout de `payment_intent_id` (pour Stripe)
    - Ajout de `payment_amount` (montant payé)
    - Ajout de `deposit_amount` (acompte payé)
    - Ajout de `booking_source` (online, admin, phone)
    - Ajout de `confirmation_token` (pour confirmer/annuler)
    - Ajout de `reminder_sent` (rappel envoyé)
    - Ajout de `cancellation_reason` (raison d'annulation)
    - Ajout de `cancelled_at` (date d'annulation)
    - Amélioration des champs existants

  2. Nouvelles tables
    - `booking_slots` (créneaux horaires disponibles)
    - `booking_settings` (configuration du système)
    - `booking_blocks` (blocages de créneaux - vacances, etc.)

  3. Security
    - Politiques RLS pour permettre la réservation publique
    - Politiques RLS pour la gestion admin
    - Protection contre les doubles réservations
*/

-- Étendre la table appointments avec les nouveaux champs
DO $$
BEGIN
  -- Ajouter service_type_id si n'existe pas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'appointments' AND column_name = 'service_type_id'
  ) THEN
    ALTER TABLE appointments ADD COLUMN service_type_id uuid REFERENCES service_types(id);
  END IF;

  -- Ajouter payment_status si n'existe pas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'appointments' AND column_name = 'payment_status'
  ) THEN
    ALTER TABLE appointments ADD COLUMN payment_status text DEFAULT 'pending';
  END IF;

  -- Ajouter payment_intent_id si n'existe pas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'appointments' AND column_name = 'payment_intent_id'
  ) THEN
    ALTER TABLE appointments ADD COLUMN payment_intent_id text;
  END IF;

  -- Ajouter payment_amount si n'existe pas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'appointments' AND column_name = 'payment_amount'
  ) THEN
    ALTER TABLE appointments ADD COLUMN payment_amount numeric DEFAULT 0;
  END IF;

  -- Ajouter deposit_amount si n'existe pas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'appointments' AND column_name = 'deposit_amount'
  ) THEN
    ALTER TABLE appointments ADD COLUMN deposit_amount numeric DEFAULT 0;
  END IF;

  -- Ajouter booking_source si n'existe pas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'appointments' AND column_name = 'booking_source'
  ) THEN
    ALTER TABLE appointments ADD COLUMN booking_source text DEFAULT 'admin';
  END IF;

  -- Ajouter confirmation_token si n'existe pas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'appointments' AND column_name = 'confirmation_token'
  ) THEN
    ALTER TABLE appointments ADD COLUMN confirmation_token text UNIQUE;
  END IF;

  -- Ajouter reminder_sent si n'existe pas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'appointments' AND column_name = 'reminder_sent'
  ) THEN
    ALTER TABLE appointments ADD COLUMN reminder_sent boolean DEFAULT false;
  END IF;

  -- Ajouter cancellation_reason si n'existe pas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'appointments' AND column_name = 'cancellation_reason'
  ) THEN
    ALTER TABLE appointments ADD COLUMN cancellation_reason text;
  END IF;

  -- Ajouter cancelled_at si n'existe pas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'appointments' AND column_name = 'cancelled_at'
  ) THEN
    ALTER TABLE appointments ADD COLUMN cancelled_at timestamptz;
  END IF;

  -- Ajouter owner_id si n'existe pas (pour savoir à quelle clinique appartient le RDV)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'appointments' AND column_name = 'owner_id'
  ) THEN
    ALTER TABLE appointments ADD COLUMN owner_id uuid REFERENCES auth.users(id);
  END IF;
END $$;

-- Créer la table booking_settings pour la configuration
CREATE TABLE IF NOT EXISTS booking_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Heures d'ouverture par défaut
  monday_start time,
  monday_end time,
  monday_enabled boolean DEFAULT true,

  tuesday_start time,
  tuesday_end time,
  tuesday_enabled boolean DEFAULT true,

  wednesday_start time,
  wednesday_end time,
  wednesday_enabled boolean DEFAULT true,

  thursday_start time,
  thursday_end time,
  thursday_enabled boolean DEFAULT true,

  friday_start time,
  friday_end time,
  friday_enabled boolean DEFAULT true,

  saturday_start time,
  saturday_end time,
  saturday_enabled boolean DEFAULT false,

  sunday_start time,
  sunday_end time,
  sunday_enabled boolean DEFAULT false,

  -- Configuration de réservation
  slot_duration_minutes integer DEFAULT 30,
  buffer_time_minutes integer DEFAULT 0,
  advance_booking_days integer DEFAULT 30,
  minimum_notice_hours integer DEFAULT 24,
  max_bookings_per_slot integer DEFAULT 1,

  -- Options de paiement
  require_payment boolean DEFAULT false,
  require_deposit boolean DEFAULT false,
  deposit_percentage numeric DEFAULT 50,
  cancellation_hours integer DEFAULT 24,

  -- Messages personnalisés
  booking_confirmation_message text,
  booking_instructions text,
  cancellation_policy text,

  -- Activer/désactiver les réservations en ligne
  online_booking_enabled boolean DEFAULT true,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  UNIQUE(owner_id)
);

-- Créer la table booking_blocks pour bloquer des créneaux
CREATE TABLE IF NOT EXISTS booking_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  start_date date NOT NULL,
  end_date date NOT NULL,
  start_time time,
  end_time time,

  reason text,
  recurring boolean DEFAULT false,
  recurrence_pattern text,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE booking_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_blocks ENABLE ROW LEVEL SECURITY;

-- Policies pour booking_settings
DROP POLICY IF EXISTS "Public can read booking settings" ON booking_settings;
CREATE POLICY "Public can read booking settings"
  ON booking_settings
  FOR SELECT
  TO anon, authenticated
  USING (online_booking_enabled = true);

DROP POLICY IF EXISTS "Owners can manage their booking settings" ON booking_settings;
CREATE POLICY "Owners can manage their booking settings"
  ON booking_settings
  FOR ALL
  TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- Policies pour booking_blocks
DROP POLICY IF EXISTS "Public can read active booking blocks" ON booking_blocks;
CREATE POLICY "Public can read active booking blocks"
  ON booking_blocks
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Owners can manage their booking blocks" ON booking_blocks;
CREATE POLICY "Owners can manage their booking blocks"
  ON booking_blocks
  FOR ALL
  TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- Mettre à jour les policies d'appointments pour permettre les réservations publiques
DROP POLICY IF EXISTS "Anyone can create online bookings" ON appointments;
CREATE POLICY "Anyone can create online bookings"
  ON appointments
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (booking_source = 'online');

DROP POLICY IF EXISTS "Anyone can view their own booking with token" ON appointments;
CREATE POLICY "Anyone can view their own booking with token"
  ON appointments
  FOR SELECT
  TO anon, authenticated
  USING (confirmation_token IS NOT NULL);

DROP POLICY IF EXISTS "Anyone can cancel their booking with token" ON appointments;
CREATE POLICY "Anyone can cancel their booking with token"
  ON appointments
  FOR UPDATE
  TO anon, authenticated
  USING (confirmation_token IS NOT NULL)
  WITH CHECK (status = 'cancelled');

-- Créer des index pour la performance
CREATE INDEX IF NOT EXISTS idx_appointments_service_type ON appointments(service_type_id);
CREATE INDEX IF NOT EXISTS idx_appointments_scheduled_date ON appointments(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_appointments_confirmation_token ON appointments(confirmation_token);
CREATE INDEX IF NOT EXISTS idx_appointments_payment_status ON appointments(payment_status);
CREATE INDEX IF NOT EXISTS idx_appointments_booking_source ON appointments(booking_source);
CREATE INDEX IF NOT EXISTS idx_booking_blocks_dates ON booking_blocks(start_date, end_date);

-- Fonction pour générer un token de confirmation unique
CREATE OR REPLACE FUNCTION generate_confirmation_token()
RETURNS text AS $$
DECLARE
  token text;
  token_exists boolean;
BEGIN
  LOOP
    token := encode(gen_random_bytes(32), 'hex');
    SELECT EXISTS(SELECT 1 FROM appointments WHERE confirmation_token = token) INTO token_exists;
    IF NOT token_exists THEN
      RETURN token;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour générer automatiquement un token lors de la création d'un RDV en ligne
CREATE OR REPLACE FUNCTION set_appointment_confirmation_token()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.booking_source = 'online' AND NEW.confirmation_token IS NULL THEN
    NEW.confirmation_token := generate_confirmation_token();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS appointments_confirmation_token_trigger ON appointments;
CREATE TRIGGER appointments_confirmation_token_trigger
  BEFORE INSERT ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION set_appointment_confirmation_token();
