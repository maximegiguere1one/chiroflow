/*
  # Ajout du champ created_by aux soap_notes
  
  1. Modifications
    - Ajouter colonne created_by aux soap_notes (référence auth.users)
    - Mettre à jour les statistiques initiales
*/

-- Add created_by to soap_notes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'soap_notes' AND column_name = 'created_by'
  ) THEN
    ALTER TABLE soap_notes ADD COLUMN created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_soap_notes_created_by ON soap_notes(created_by);