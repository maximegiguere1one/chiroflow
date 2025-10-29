/*
  # Activation de l'extension pg_net pour appels HTTP depuis PostgreSQL

  1. Extension
    - Active pg_net pour permettre les appels HTTP asynchrones depuis PostgreSQL
    - Nécessaire pour que le trigger puisse appeler automatiquement les Edge Functions

  2. Notes
    - pg_net permet de faire des requêtes HTTP depuis les fonctions PostgreSQL
    - C'est la base pour l'automatisation 100% du système de liste d'attente
    - Les appels sont asynchrones et n'bloquent pas les transactions
*/

CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;