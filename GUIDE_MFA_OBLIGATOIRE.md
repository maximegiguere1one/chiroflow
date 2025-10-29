# Guide MFA (Authentification à Deux Facteurs) Obligatoire

## Vue d'ensemble

Le système d'authentification à deux facteurs (MFA) est maintenant **OBLIGATOIRE** pour tous les utilisateurs administratifs (administrateurs et praticiens) qui accèdent aux dossiers patients.

Cette mesure de sécurité est requise pour :
- ✅ Conformité Loi 25 (Québec)
- ✅ Conformité LPRPDE (Canada)
- ✅ Protection des renseignements personnels de santé (RPS)
- ✅ Prévention des accès non autorisés

## Ce qui a été implémenté

### 1. Infrastructure de base de données
- ✅ Tables MFA complètes (`user_2fa_settings`, `user_2fa_attempts`, `user_trusted_devices`, `user_2fa_recovery_logs`)
- ✅ Fonctions PostgreSQL pour gestion MFA
- ✅ RLS policies strictes avec vérification MFA obligatoire
- ✅ Audit automatique de tous les accès

### 2. Bibliothèque MFA (`src/lib/mfa.ts`)
- ✅ Génération TOTP (Time-based One-Time Password)
- ✅ Vérification des codes 6 chiffres
- ✅ Génération de codes de secours
- ✅ Gestion des appareils de confiance
- ✅ Rate limiting (5 tentatives par 15 minutes)
- ✅ Implémentation complète SHA-1 et HMAC (pas de dépendances externes)

### 3. Interface utilisateur
- ✅ Modal de configuration MFA (`MFASetupModal.tsx`)
- ✅ Modal de vérification MFA (`MFAVerificationModal.tsx`)
- ✅ Intégration dans le dashboard admin
- ✅ QR codes pour authenticator apps
- ✅ Téléchargement des codes de secours

### 4. Sécurité renforcée
- ✅ Blocage automatique des admins sans MFA
- ✅ Vérification MFA obligatoire avant accès aux données patients
- ✅ Logs de toutes les tentatives MFA
- ✅ Appareils de confiance avec expiration (30 jours)

## Comment fonctionne le système

### Premier login après déploiement

1. **Admin se connecte** → Redirection automatique vers setup MFA
2. **Modal s'ouvre** avec message "Configuration obligatoire"
3. **Admin scanne QR code** avec Google Authenticator / Authy
4. **Admin entre le code** de 6 chiffres pour vérifier
5. **Admin sauvegarde les codes de secours** (10 codes)
6. **MFA activé** → Accès complet au système

### Logins suivants

1. **Admin entre email/password**
2. **Système vérifie MFA** → Si activé, demande code
3. **Admin entre code TOTP** de son app
4. **Vérification réussie** → Accès accordé

Si 5 tentatives échouées = verrouillage temporaire 15 minutes

### Utilisation des codes de secours

Si l'admin perd son téléphone :
1. Utiliser un des 10 codes de secours
2. Chaque code ne peut être utilisé qu'une seule fois
3. Régénérer de nouveaux codes dans Settings

## Applications Authenticator recommandées

- **Google Authenticator** (iOS / Android)
- **Authy** (iOS / Android / Desktop)
- **Microsoft Authenticator** (iOS / Android)
- **1Password** (avec support TOTP)
- **Bitwarden** (avec support TOTP)

## Désactiver temporairement MFA (DÉCONSEILLÉ)

Pour désactiver MFA en développement seulement :

```sql
-- NE PAS FAIRE EN PRODUCTION
UPDATE user_2fa_settings
SET is_enabled = false
WHERE user_id = 'USER_UUID_ICI';
```

## RLS Policies avec enforcement MFA

Exemple de policy sur la table `contacts` :

```sql
CREATE POLICY "Admins can view contacts"
  ON contacts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'practitioner')
    )
    AND NOT check_mfa_required() -- ← Vérifie que MFA est activé
  );
```

La fonction `check_mfa_required()` :
- Retourne `false` si utilisateur n'est pas admin (pas de MFA requis)
- Retourne `false` si admin a MFA activé et vérifié (accès OK)
- Retourne `true` si admin n'a PAS MFA (bloque l'accès)

## Fichiers modifiés

### Migrations
- `supabase/migrations/20251017223317_create_2fa_authentication_system.sql` (tables MFA)
- `supabase/migrations/20251019030000_enforce_mfa_requirement.sql` (enforcement obligatoire)

### Bibliothèques
- `src/lib/mfa.ts` (logique TOTP complète)

### Composants
- `src/components/dashboard/MFASetupModal.tsx` (configuration)
- `src/components/dashboard/MFAVerificationModal.tsx` (vérification)

### Pages
- `src/pages/AdminDashboard.tsx` (intégration + check automatique)

## Tests de validation

### Test 1: Admin sans MFA
1. Créer nouvel admin
2. Login → Modal MFA s'ouvre automatiquement
3. Impossible de fermer le modal (bouton X caché)
4. Doit compléter setup pour continuer

### Test 2: Vérification TOTP
1. Scanner QR code avec Google Authenticator
2. Entrer code → Vérification immédiate
3. Code invalide → Message d'erreur
4. Code valide → Accès accordé

### Test 3: Codes de secours
1. Télécharger codes de secours
2. Utiliser code au lieu de TOTP
3. Code fonctionne une seule fois
4. Code déjà utilisé = rejeté

### Test 4: Rate limiting
1. Entrer 5 codes invalides
2. Compte verrouillé 15 minutes
3. Message "Too many attempts"

### Test 5: Accès données sans MFA
1. Admin sans MFA essaie de voir liste patients
2. Query retourne 0 résultats (RLS bloque)
3. Aucune erreur visible, juste pas de données

## Conformité légale

### Loi 25 (Québec)
- ✅ Article 10: MFA = mesure de sécurité renforcée
- ✅ Article 13: Audit automatique de tous les accès
- ✅ Article 14: Journalisation complète des tentatives MFA

### LPRPDE (Canada)
- ✅ Principe 7: MFA = mesures de sécurité appropriées
- ✅ Protection PHI/RPS selon standards PHIPA
- ✅ Traçabilité complète des accès

### Documentation générée
Tous les accès sont enregistrés dans :
- `access_audit_log` (accès aux dossiers)
- `user_2fa_attempts` (tentatives MFA)
- `user_2fa_recovery_logs` (récupérations)

Conservation: 7 ans (conformité investigations)

## Support et récupération

### Admin a perdu son téléphone
1. Utiliser codes de secours sauvegardés
2. Login avec code de secours
3. Désactiver ancien MFA dans Settings
4. Reconfigurer MFA avec nouveau téléphone

### Admin a perdu codes de secours
1. Contacter super-admin
2. Super-admin peut reset MFA via SQL:
```sql
UPDATE user_2fa_settings
SET is_enabled = false, verified_at = NULL
WHERE user_id = 'USER_UUID';
```
3. Admin doit reconfigurer MFA au prochain login

### Récupération de dernier recours
Si admin principal bloqué :
```sql
-- Désactiver temporairement MFA requirement
-- SEULEMENT EN URGENCE
ALTER FUNCTION check_mfa_required()
RETURNS boolean AS $$ BEGIN RETURN false; END; $$
LANGUAGE plpgsql;
```

## Statistiques et monitoring

Dashboard MFA (à implémenter) :
- Nombre d'admins avec MFA activé
- Tentatives échouées par jour
- Codes de secours utilisés
- Appareils de confiance actifs

Requêtes utiles :
```sql
-- Admins sans MFA
SELECT p.email, p.role
FROM profiles p
LEFT JOIN user_2fa_settings mfa ON mfa.user_id = p.id
WHERE p.role IN ('admin', 'practitioner')
AND (mfa.is_enabled = false OR mfa.is_enabled IS NULL);

-- Tentatives échouées aujourd'hui
SELECT user_id, COUNT(*) as failed_attempts
FROM user_2fa_attempts
WHERE success = false
AND attempted_at >= CURRENT_DATE
GROUP BY user_id
ORDER BY failed_attempts DESC;
```

## Prochaines étapes (optionnel)

- [ ] SMS backup (Twilio integration)
- [ ] Push notifications (OneSignal)
- [ ] Biometric auth (WebAuthn)
- [ ] Admin dashboard pour gestion MFA
- [ ] Email alerts sur nouvelles connexions
- [ ] Géolocalisation des connexions

## Conclusion

Le système MFA est maintenant **100% opérationnel et obligatoire**. Tous les admins et praticiens DOIVENT configurer MFA pour accéder aux dossiers patients. Cette mesure garantit la conformité légale et la sécurité maximale des renseignements personnels de santé.

**Aucune donnée patient ne peut être consultée sans MFA vérifié.**
