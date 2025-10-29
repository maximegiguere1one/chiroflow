/*
  # Ajouter des contacts de test

  1. Modifications
    - Ajouter 2 contacts de test pour l'admin existant
    - Ces contacts serviront à tester le système de liste de rappel

  2. Données
    - Contact 1: Marie Tremblay (cliente active)
    - Contact 2: Jean Bouchard (client actif)
*/

-- Ajouter 2 contacts de test pour l'admin
INSERT INTO contacts (
  owner_id,
  full_name,
  email,
  phone,
  status,
  notes
) VALUES
  (
    '93e1c7fe-19fb-42f8-8101-36c269ec8eb9',
    'Marie Tremblay',
    'marie.tremblay@example.com',
    '514-555-0101',
    'active',
    'Cliente régulière depuis 2 ans'
  ),
  (
    '93e1c7fe-19fb-42f8-8101-36c269ec8eb9',
    'Jean Bouchard',
    'jean.bouchard@example.com',
    '514-555-0102',
    'active',
    'Nouveau client, très motivé'
  )
ON CONFLICT (id) DO NOTHING;
