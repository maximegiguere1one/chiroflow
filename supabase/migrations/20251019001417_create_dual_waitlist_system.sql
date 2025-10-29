/*
  # Système de double liste d'attente

  1. Nouvelles Tables
    - `new_client_waitlist` - Liste d'attente pour NOUVEAUX clients
      - Invités quand un client actuel part définitivement
      - Premier arrivé, premier servi
    
    - `recall_waitlist` - Liste de rappel pour CLIENTS ACTUELS
      - Notifiés quand un rendez-vous est annulé
      - Peuvent devancer leur prochain rendez-vous
      - Basé sur leur prochain RDV prévu
    
    - `waitlist_invitations` - Historique des invitations envoyées
      - Track qui a été invité, quand, et leur réponse
  
  2. Sécurité
    - RLS activé sur toutes les tables
    - Seuls les admins peuvent gérer les listes
  
  3. Automatisation
    - Quand un client part: inviter nouveaux clients
    - Quand annulation: notifier clients actuels en attente
*/

-- Table: Liste d'attente NOUVEAUX clients
CREATE TABLE IF NOT EXISTS new_client_waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Informations du prospect
  full_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  
  -- Préférences
  preferred_days text[], -- ['lundi', 'mardi', etc.]
  preferred_times text[], -- ['matin', 'après-midi', 'soir']
  service_type_id uuid REFERENCES service_types(id),
  
  -- Statut
  status text DEFAULT 'waiting' CHECK (status IN ('waiting', 'invited', 'accepted', 'declined', 'expired')),
  priority integer DEFAULT 0, -- Pour gérer l'ordre (plus élevé = plus prioritaire)
  
  -- Notes
  notes text,
  
  -- Métadonnées
  added_at timestamptz DEFAULT now(),
  invited_at timestamptz,
  responded_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table: Liste de rappel CLIENTS ACTUELS
CREATE TABLE IF NOT EXISTS recall_waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Lien vers le patient existant
  patient_id uuid NOT NULL,
  patient_name text NOT NULL,
  patient_email text NOT NULL,
  patient_phone text,
  
  -- Context du rendez-vous actuel
  current_appointment_id uuid,
  current_appointment_date timestamptz,
  
  -- Préférences pour devancer
  preferred_days text[],
  preferred_times text[],
  service_type_id uuid REFERENCES service_types(id),
  willing_to_move_forward_by_days integer DEFAULT 7, -- Combien de jours avant ils veulent devancer
  
  -- Statut
  status text DEFAULT 'active' CHECK (status IN ('active', 'notified', 'accepted', 'declined', 'expired', 'cancelled')),
  priority integer DEFAULT 0,
  
  -- Notes
  notes text,
  
  -- Métadonnées
  added_at timestamptz DEFAULT now(),
  last_notified_at timestamptz,
  responded_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table: Historique des invitations
CREATE TABLE IF NOT EXISTS waitlist_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Type et source
  invitation_type text NOT NULL CHECK (invitation_type IN ('new_client', 'recall_client')),
  waitlist_entry_id uuid NOT NULL, -- ID de l'entrée dans new_client_waitlist OU recall_waitlist
  
  -- Informations du destinataire
  recipient_name text NOT NULL,
  recipient_email text NOT NULL,
  recipient_phone text,
  
  -- Détails de l'opportunité
  opportunity_type text NOT NULL CHECK (opportunity_type IN ('client_left', 'appointment_cancelled')),
  available_slot_date timestamptz,
  available_slot_time text,
  service_type_id uuid REFERENCES service_types(id),
  
  -- Réponse
  status text DEFAULT 'sent' CHECK (status IN ('sent', 'opened', 'accepted', 'declined', 'expired', 'error')),
  sent_at timestamptz DEFAULT now(),
  opened_at timestamptz,
  responded_at timestamptz,
  response_notes text,
  
  -- Email tracking
  email_sent_successfully boolean DEFAULT false,
  email_error_message text,
  
  -- Métadonnées
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE new_client_waitlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE recall_waitlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE waitlist_invitations ENABLE ROW LEVEL SECURITY;

-- Policies pour new_client_waitlist
CREATE POLICY "Admins can manage new client waitlist"
  ON new_client_waitlist FOR ALL
  TO authenticated
  USING (owner_id = auth.uid());

-- Policies pour recall_waitlist  
CREATE POLICY "Admins can manage recall waitlist"
  ON recall_waitlist FOR ALL
  TO authenticated
  USING (owner_id = auth.uid());

-- Policies pour waitlist_invitations
CREATE POLICY "Admins can view all invitations"
  ON waitlist_invitations FOR SELECT
  TO authenticated
  USING (owner_id = auth.uid());

CREATE POLICY "Admins can insert invitations"
  ON waitlist_invitations FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Admins can update invitations"
  ON waitlist_invitations FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid());

-- Indexes pour performance
CREATE INDEX IF NOT EXISTS idx_new_waitlist_owner ON new_client_waitlist(owner_id);
CREATE INDEX IF NOT EXISTS idx_new_waitlist_status ON new_client_waitlist(status);
CREATE INDEX IF NOT EXISTS idx_new_waitlist_priority ON new_client_waitlist(priority DESC, added_at);

CREATE INDEX IF NOT EXISTS idx_recall_waitlist_owner ON recall_waitlist(owner_id);
CREATE INDEX IF NOT EXISTS idx_recall_waitlist_patient ON recall_waitlist(patient_id);
CREATE INDEX IF NOT EXISTS idx_recall_waitlist_status ON recall_waitlist(status);
CREATE INDEX IF NOT EXISTS idx_recall_waitlist_priority ON recall_waitlist(priority DESC, added_at);

CREATE INDEX IF NOT EXISTS idx_invitations_owner ON waitlist_invitations(owner_id);
CREATE INDEX IF NOT EXISTS idx_invitations_type ON waitlist_invitations(invitation_type);
CREATE INDEX IF NOT EXISTS idx_invitations_status ON waitlist_invitations(status);
CREATE INDEX IF NOT EXISTS idx_invitations_entry ON waitlist_invitations(waitlist_entry_id);

-- Fonction pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_waitlist_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers pour updated_at
DROP TRIGGER IF EXISTS trigger_new_waitlist_updated_at ON new_client_waitlist;
CREATE TRIGGER trigger_new_waitlist_updated_at
  BEFORE UPDATE ON new_client_waitlist
  FOR EACH ROW
  EXECUTE FUNCTION update_waitlist_updated_at();

DROP TRIGGER IF EXISTS trigger_recall_waitlist_updated_at ON recall_waitlist;
CREATE TRIGGER trigger_recall_waitlist_updated_at
  BEFORE UPDATE ON recall_waitlist
  FOR EACH ROW
  EXECUTE FUNCTION update_waitlist_updated_at();

DROP TRIGGER IF EXISTS trigger_invitations_updated_at ON waitlist_invitations;
CREATE TRIGGER trigger_invitations_updated_at
  BEFORE UPDATE ON waitlist_invitations
  FOR EACH ROW
  EXECUTE FUNCTION update_waitlist_updated_at();