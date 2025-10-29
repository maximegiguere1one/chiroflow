# Vérification Finale - Système MFA Obligatoire

## Checklist de déploiement

### Étape 1: Appliquer les migrations ✅

```bash
# Si vous utilisez Supabase CLI
supabase db push

# OU via Dashboard Supabase
# 1. Aller dans SQL Editor
# 2. Copier contenu de: supabase/migrations/20251019030000_enforce_mfa_requirement.sql
# 3. Exécuter la requête
```

**Migration à appliquer:**
- `20251019030000_enforce_mfa_requirement.sql`

Cette migration ajoute:
- Fonction `check_mfa_required()` qui valide MFA
- Policies mises à jour sur tables sensibles
- Enforcement automatique du MFA

### Étape 2: Vérifier que la migration est appliquée

```sql
-- Dans SQL Editor Supabase, exécuter:

-- 1. Vérifier que la fonction existe
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_name = 'check_mfa_required';

-- Résultat attendu: 1 ligne retournée
-- routine_name: check_mfa_required
-- routine_type: FUNCTION

-- 2. Vérifier les policies avec MFA enforcement
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE policyname ILIKE '%can view%'
AND schemaname = 'public';

-- Résultat attendu: Plusieurs policies listées incluant:
-- "Admins and practitioners can view contacts"
-- "Admins and practitioners can view all appointments"
-- etc.
```

### Étape 3: Test du système MFA

#### Test 1: Admin sans MFA ne peut pas voir les données

```sql
-- 1. Créer un admin test (dans SQL Editor)
INSERT INTO auth.users (id, email)
VALUES (gen_random_uuid(), 'admin-test@example.com')
RETURNING id;

-- Copier l'ID retourné et l'utiliser ci-dessous
INSERT INTO profiles (id, email, role, full_name)
VALUES (
  '[ID_COPIÉ_CI-DESSUS]',
  'admin-test@example.com',
  'admin',
  'Admin Test'
);

-- 2. Vérifier qu'aucune config MFA existe
SELECT * FROM user_2fa_settings
WHERE user_id = '[ID_ADMIN_TEST]';
-- Résultat attendu: 0 lignes (pas de MFA configuré)

-- 3. Simuler l'accès aux contacts (comme si l'admin était connecté)
SET LOCAL "request.jwt.claims" = '{"sub": "[ID_ADMIN_TEST]"}';

SELECT * FROM contacts LIMIT 5;
-- Résultat attendu: 0 lignes (bloqué par RLS + MFA check)
```

#### Test 2: Admin avec MFA peut voir les données

```sql
-- 1. Activer MFA pour l'admin test
INSERT INTO user_2fa_settings (
  user_id,
  is_enabled,
  method,
  totp_secret,
  verified_at
) VALUES (
  '[ID_ADMIN_TEST]',
  true,
  'totp',
  'JBSWY3DPEHPK3PXP',  -- Secret de test
  now()
);

-- 2. Tenter à nouveau l'accès
SET LOCAL "request.jwt.claims" = '{"sub": "[ID_ADMIN_TEST]"}';

SELECT COUNT(*) FROM contacts;
-- Résultat attendu: Nombre total de contacts (accès autorisé)
```

### Étape 4: Test frontend complet

#### 4.1 Premier login admin

1. **Créer un nouvel admin** (ou utiliser admin existant)
   ```
   Email: admin@votreclinique.com
   Password: [votre mot de passe]
   ```

2. **Login sur /admin**
   - Entrer email/password
   - Si MFA non configuré → Modal s'ouvre AUTOMATIQUEMENT

3. **Configuration MFA**
   - Modal ne peut PAS être fermé (bouton X caché si `isRequired=true`)
   - Scanner QR code avec Google Authenticator
   - Entrer code de 6 chiffres
   - Télécharger codes de secours

4. **Vérification accès**
   - Après setup MFA → Accès complet dashboard
   - Liste patients visible
   - Rendez-vous accessibles

#### 4.2 Login suivant

1. **Logout et re-login**
   - Entrer email/password
   - **Pas de demande MFA** (déjà configuré lors du premier login)
   - Accès direct au dashboard

**Note:** Le MFA est vérifié une seule fois à la configuration. Les logins suivants ne demandent que le password, mais l'accès aux données patients est protégé par les RLS policies qui vérifient que MFA est activé.

#### 4.3 Test codes de secours

1. **Utiliser un code de secours au lieu de TOTP**
   - Login normal
   - Au lieu du code app, entrer un code de secours
   - Code doit fonctionner UNE SEULE FOIS
   - Code déjà utilisé = refusé

### Étape 5: Vérifier les logs

```sql
-- Voir les tentatives MFA
SELECT
  u.email,
  mfa.attempt_type,
  mfa.success,
  mfa.attempted_at,
  mfa.failure_reason
FROM user_2fa_attempts mfa
JOIN auth.users u ON u.id = mfa.user_id
ORDER BY mfa.attempted_at DESC
LIMIT 20;

-- Voir les admins avec/sans MFA
SELECT
  p.email,
  p.role,
  CASE
    WHEN mfa.is_enabled = true AND mfa.verified_at IS NOT NULL THEN 'MFA Actif'
    WHEN mfa.is_enabled = false THEN 'MFA Désactivé'
    ELSE 'MFA Jamais Configuré'
  END as mfa_status,
  mfa.verified_at,
  mfa.last_used_at
FROM profiles p
LEFT JOIN user_2fa_settings mfa ON mfa.user_id = p.id
WHERE p.role IN ('admin', 'practitioner')
ORDER BY p.email;
```

### Étape 6: Vérifier région Supabase

1. **Aller dans Dashboard Supabase**
2. **Project Settings → General**
3. **Vérifier "Region"**
   - ✅ Canada (Central) - ca-central-1
   - ✅ Canada (Montreal) - si disponible
   - ❌ US East, US West, Europe = NON CONFORME LOI 25

Si région n'est PAS Canada:
```
⚠️ ATTENTION: Migration de région requise
Contacter support Supabase pour:
- Migration vers Canada region
- Backup + Restore dans nouvelle région
- Vérifier downtime acceptable
```

### Étape 7: Documentation utilisateur

Créer guide rapide pour les admins:

```markdown
# Guide MFA - Pour les administrateurs

## Premier login
1. Connectez-vous normalement (email + password)
2. Modal MFA s'ouvre → Installation obligatoire
3. Téléchargez Google Authenticator ou Authy
4. Scannez le QR code affiché
5. Entrez le code à 6 chiffres de l'app
6. **IMPORTANT:** Téléchargez et sauvegardez vos 10 codes de secours
7. Conservez les codes en lieu sûr (coffre-fort, gestionnaire mots de passe)

## Logins suivants
- Email + password comme d'habitude
- Accès immédiat (MFA déjà configuré)

## Si vous perdez votre téléphone
- Utilisez un code de secours
- Contactez l'administrateur principal
- Reconfigurez MFA avec nouveau téléphone

## Applications recommandées
- Google Authenticator (gratuit)
- Authy (gratuit, multi-device)
- Microsoft Authenticator (gratuit)
```

### Étape 8: Plan de récupération d'urgence

**Scénario: Admin principal perd accès MFA**

#### Option 1: Codes de secours (recommandé)
- Utiliser un des 10 codes sauvegardés
- Login avec code de secours
- Régénérer nouveaux codes dans Settings

#### Option 2: Reset par super-admin
```sql
-- Exécuter dans SQL Editor (super-admin seulement)
UPDATE user_2fa_settings
SET
  is_enabled = false,
  verified_at = NULL
WHERE user_id = (
  SELECT id FROM auth.users
  WHERE email = 'admin-bloqué@example.com'
);

-- L'admin devra reconfigurer MFA au prochain login
```

#### Option 3: Désactivation temporaire MFA (URGENCE EXTRÊME)
```sql
-- ⚠️ SEULEMENT EN CAS D'URGENCE CRITIQUE
-- Désactive temporairement le check MFA pour TOUS les utilisateurs

CREATE OR REPLACE FUNCTION check_mfa_required()
RETURNS boolean AS $$
BEGIN
  -- Toujours retourner false = MFA check désactivé
  RETURN false;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ⚠️ RÉACTIVER DÈS QUE POSSIBLE avec la fonction originale
```

### Étape 9: Monitoring et alertes

#### Requêtes de monitoring quotidiennes

```sql
-- Dashboard sécurité - À exécuter chaque jour

-- 1. Admins sans MFA actif (CRITIQUE)
SELECT
  p.email,
  p.role,
  p.created_at
FROM profiles p
LEFT JOIN user_2fa_settings mfa ON mfa.user_id = p.id
WHERE p.role IN ('admin', 'practitioner')
AND (mfa.is_enabled = false OR mfa.is_enabled IS NULL);

-- 2. Tentatives MFA échouées aujourd'hui
SELECT
  u.email,
  COUNT(*) as failed_attempts,
  MAX(mfa.attempted_at) as last_attempt
FROM user_2fa_attempts mfa
JOIN auth.users u ON u.id = mfa.user_id
WHERE mfa.success = false
AND mfa.attempted_at >= CURRENT_DATE
GROUP BY u.email
HAVING COUNT(*) >= 3
ORDER BY failed_attempts DESC;

-- 3. Codes de secours restants
SELECT
  u.email,
  array_length(mfa.backup_codes, 1) as codes_remaining
FROM user_2fa_settings mfa
JOIN auth.users u ON u.id = mfa.user_id
WHERE mfa.is_enabled = true
AND array_length(mfa.backup_codes, 1) < 3
ORDER BY codes_remaining;

-- 4. Appareils de confiance expirant bientôt
SELECT
  u.email,
  td.device_name,
  td.expires_at,
  td.expires_at - now() as time_remaining
FROM user_trusted_devices td
JOIN auth.users u ON u.id = td.user_id
WHERE td.expires_at < now() + interval '7 days'
ORDER BY td.expires_at;
```

### Étape 10: Tests de pénétration recommandés

#### Test 1: Bypass MFA via SQL injection
- Tenter d'injecter SQL dans tous les champs
- Vérifier que paramètres sont bien bindés
- Confirm: Protection RLS active même si injection réussit

#### Test 2: Brute force codes MFA
- Tenter 10+ codes consécutifs invalides
- Vérifier: Rate limiting active après 5 tentatives
- Confirm: Verrouillage 15 minutes

#### Test 3: Session hijacking
- Voler cookie session
- Tenter accès sur autre appareil
- Vérifier: Token Supabase vérifié côté serveur

#### Test 4: CSRF sur endpoints MFA
- Tenter requêtes cross-origin
- Vérifier: CORS headers correctement configurés
- Confirm: Supabase Auth protège automatiquement

---

## Résumé de vérification

### ✅ Liste de vérification finale

- [ ] Migration MFA appliquée dans Supabase
- [ ] Fonction `check_mfa_required()` existe
- [ ] RLS policies mises à jour sur toutes tables
- [ ] Test admin sans MFA = bloqué
- [ ] Test admin avec MFA = accès OK
- [ ] Modal MFA s'ouvre au premier login
- [ ] QR code généré correctement
- [ ] Codes de secours téléchargeables
- [ ] Rate limiting fonctionne (5 tentatives)
- [ ] Logs MFA enregistrés
- [ ] Région Supabase = Canada
- [ ] Documentation utilisateur créée
- [ ] Plan récupération documenté
- [ ] Monitoring quotidien configuré
- [ ] Super-admin a ses codes de secours

### 🎯 Critères de succès

**Système est prêt si:**
1. ✅ Aucun admin ne peut accéder aux données patients sans MFA actif
2. ✅ Modal MFA force la configuration au premier login
3. ✅ Logs enregistrent toutes les tentatives
4. ✅ Codes de secours fonctionnent
5. ✅ Rate limiting empêche brute force
6. ✅ Région Supabase est au Canada

**Si tous les critères sont verts → DÉPLOIEMENT APPROUVÉ ✅**

---

**Date de vérification:** _____________
**Vérifié par:** _____________
**Approuvé par:** _____________
**Signature:** _____________

---

## Contacts support

**Supabase Support:** https://supabase.com/dashboard/support
**Documentation MFA:** Voir `GUIDE_MFA_OBLIGATOIRE.md`
**Conformité:** Voir `CONFORMITE_SECURITE_COMPLETE.md`

**En cas de problème critique:** Contacter administrateur système immédiatement.
