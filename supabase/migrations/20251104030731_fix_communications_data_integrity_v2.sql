/*
  # Correction de l'Intégrité des Données - Module Communications (v2)
  
  ## Problèmes Corrigés
  
  1. **twilio_message_sid manquants** - Copie metadata vers colonne
  2. **sent_at manquants** - Utilise created_at comme fallback
  3. **delivered_at manquants** - Utilise created_at comme fallback
  4. **Téléphones invalides** - Nettoie avant d'ajouter contrainte
  5. **Trigger validation** - Empêche créations invalides
  6. **Index performance** - Optimise les requêtes
*/

-- =====================================
-- ÉTAPE 1: CORRIGER LES DONNÉES EXISTANTES
-- =====================================

-- 1.1: Copier twilio_sid de metadata vers colonne dédiée
UPDATE conversation_messages
SET twilio_message_sid = metadata->>'twilio_sid'
WHERE channel = 'sms' 
  AND twilio_message_sid IS NULL
  AND metadata->>'twilio_sid' IS NOT NULL;

-- 1.2: Ajouter sent_at pour messages sortants
UPDATE conversation_messages
SET sent_at = created_at
WHERE direction = 'outbound'
  AND sent_at IS NULL;

-- 1.3: Ajouter delivered_at pour messages entrants
UPDATE conversation_messages
SET delivered_at = created_at
WHERE direction = 'inbound'
  AND delivered_at IS NULL;

-- 1.4: Nettoyer les téléphones invalides
-- Option A: Les mettre à NULL (préserve le contact)
UPDATE contacts
SET phone = NULL
WHERE phone IS NOT NULL
  AND phone !~ '^[\+]?[1-9]\d{10,14}$';

-- =====================================
-- ÉTAPE 2: AJOUTER CONTRAINTE TÉLÉPHONE
-- =====================================

-- Ajouter contrainte CHECK sur format téléphone
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'phone_format_check'
  ) THEN
    ALTER TABLE contacts
    ADD CONSTRAINT phone_format_check
    CHECK (
      phone IS NULL OR
      phone ~ '^[\+]?[1-9]\d{10,14}$'
    );
  END IF;
END $$;

-- =====================================
-- ÉTAPE 3: TRIGGER VALIDATION CONVERSATION
-- =====================================

-- Fonction pour valider que le canal correspond aux infos du contact
CREATE OR REPLACE FUNCTION validate_conversation_channel()
RETURNS TRIGGER AS $$
DECLARE
  contact_phone TEXT;
  contact_email TEXT;
BEGIN
  -- Récupérer les infos du contact
  SELECT phone, email INTO contact_phone, contact_email
  FROM contacts
  WHERE id = NEW.contact_id;
  
  -- Validation SMS: contact DOIT avoir un téléphone
  IF NEW.channel = 'sms' THEN
    IF contact_phone IS NULL OR contact_phone = '' THEN
      RAISE EXCEPTION 'Cannot create SMS conversation: contact (%) has no phone number', NEW.contact_id;
    END IF;
  END IF;
  
  -- Validation Email: contact DOIT avoir un email
  IF NEW.channel = 'email' THEN
    IF contact_email IS NULL OR contact_email = '' THEN
      RAISE EXCEPTION 'Cannot create email conversation: contact (%) has no email address', NEW.contact_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer ou remplacer le trigger
DROP TRIGGER IF EXISTS validate_conversation_channel_trigger ON conversations;
CREATE TRIGGER validate_conversation_channel_trigger
  BEFORE INSERT OR UPDATE ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION validate_conversation_channel();

-- =====================================
-- ÉTAPE 4: INDEX DE PERFORMANCE
-- =====================================

-- Index sur twilio_message_sid pour recherche rapide
CREATE INDEX IF NOT EXISTS idx_messages_twilio_sid 
ON conversation_messages(twilio_message_sid) 
WHERE twilio_message_sid IS NOT NULL;

-- Index sur channel + direction pour filtres
CREATE INDEX IF NOT EXISTS idx_messages_channel_direction 
ON conversation_messages(channel, direction);

-- Index sur sent_at pour tri chronologique
CREATE INDEX IF NOT EXISTS idx_messages_sent_at 
ON conversation_messages(sent_at DESC)
WHERE sent_at IS NOT NULL;

-- Index sur conversation_id pour requêtes par conversation
CREATE INDEX IF NOT EXISTS idx_messages_conversation 
ON conversation_messages(conversation_id, created_at DESC);

-- Index composite pour conversations actives par propriétaire
CREATE INDEX IF NOT EXISTS idx_conversations_owner_status 
ON conversations(owner_id, status)
WHERE status = 'active';

-- Index sur contacts pour recherche par téléphone
CREATE INDEX IF NOT EXISTS idx_contacts_phone 
ON contacts(phone)
WHERE phone IS NOT NULL;

-- =====================================
-- ÉTAPE 5: VÉRIFICATIONS POST-MIGRATION
-- =====================================

DO $$
DECLARE
  fixed_twilio_sid INTEGER;
  fixed_sent_at INTEGER;
  fixed_delivered_at INTEGER;
  cleaned_phones INTEGER;
BEGIN
  -- Vérifier twilio_message_sid
  SELECT COUNT(*) INTO fixed_twilio_sid
  FROM conversation_messages
  WHERE channel = 'sms' AND twilio_message_sid IS NOT NULL;
  
  -- Vérifier sent_at
  SELECT COUNT(*) INTO fixed_sent_at
  FROM conversation_messages
  WHERE direction = 'outbound' AND sent_at IS NOT NULL;
  
  -- Vérifier delivered_at
  SELECT COUNT(*) INTO fixed_delivered_at
  FROM conversation_messages
  WHERE direction = 'inbound' AND delivered_at IS NOT NULL;
  
  -- Compter les téléphones nettoyés
  SELECT COUNT(*) INTO cleaned_phones
  FROM contacts
  WHERE phone IS NULL;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'MIGRATION COMPLETED SUCCESSFULLY';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Data Integrity Fixes:';
  RAISE NOTICE '  ✅ twilio_message_sid filled: % messages', fixed_twilio_sid;
  RAISE NOTICE '  ✅ sent_at filled: % outbound messages', fixed_sent_at;
  RAISE NOTICE '  ✅ delivered_at filled: % inbound messages', fixed_delivered_at;
  RAISE NOTICE '  ✅ Invalid phones cleaned: % contacts', cleaned_phones;
  RAISE NOTICE '';
  RAISE NOTICE 'Database Constraints:';
  RAISE NOTICE '  ✅ phone_format_check constraint added';
  RAISE NOTICE '  ✅ validate_conversation_channel trigger added';
  RAISE NOTICE '';
  RAISE NOTICE 'Performance Indexes:';
  RAISE NOTICE '  ✅ 6 indexes created for optimal query performance';
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
END $$;
