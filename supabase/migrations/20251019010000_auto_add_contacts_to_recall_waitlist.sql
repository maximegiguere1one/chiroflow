/*
  # Ajout automatique des contacts à la liste de rappel

  1. Modifications
    - Créer un trigger qui ajoute automatiquement chaque nouveau contact actif
      à la liste de rappel (recall_waitlist)
    - Ceci assure que tous les clients actuels sont toujours dans la liste

  2. Fonctionnement
    - Quand un nouveau contact est créé avec status='active'
    - Il est automatiquement ajouté à recall_waitlist
    - Permet aux clients de recevoir des notifications de créneaux disponibles
*/

-- Fonction pour ajouter automatiquement un contact à la liste de rappel
CREATE OR REPLACE FUNCTION auto_add_to_recall_waitlist()
RETURNS TRIGGER AS $$
BEGIN
  -- Seulement pour les contacts actifs
  IF NEW.status = 'active' THEN
    -- Vérifier si pas déjà dans la liste
    IF NOT EXISTS (
      SELECT 1 FROM recall_waitlist
      WHERE patient_id = NEW.id
      AND owner_id = NEW.owner_id
      AND status = 'active'
    ) THEN
      -- Ajouter à la liste de rappel
      INSERT INTO recall_waitlist (
        owner_id,
        patient_id,
        patient_name,
        patient_email,
        patient_phone,
        status,
        priority,
        willing_to_move_forward_by_days
      ) VALUES (
        NEW.owner_id,
        NEW.id,
        NEW.full_name,
        COALESCE(NEW.email, ''),
        COALESCE(NEW.phone, ''),
        'active',
        0,
        7
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour les nouveaux contacts
DROP TRIGGER IF EXISTS trigger_auto_add_to_recall_waitlist ON contacts;
CREATE TRIGGER trigger_auto_add_to_recall_waitlist
  AFTER INSERT OR UPDATE OF status ON contacts
  FOR EACH ROW
  EXECUTE FUNCTION auto_add_to_recall_waitlist();
