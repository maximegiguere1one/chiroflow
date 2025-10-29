# Guide de Troubleshooting - Système d'Emails ChiroFlow

**Date:** 2025-10-17
**Version:** 2.0
**Objectif:** Diagnostiquer et résoudre tous les problèmes d'envoi d'emails

---

## Table des Matières

1. [Vue d'ensemble](#vue-densemble)
2. [Diagnostic rapide](#diagnostic-rapide)
3. [Problèmes courants et solutions](#problèmes-courants-et-solutions)
4. [Vérifications par composant](#vérifications-par-composant)
5. [Logs et monitoring](#logs-et-monitoring)
6. [Checklist complète](#checklist-complète)

---

## Vue d'ensemble

### Architecture du système

```
Annulation RDV → Trigger DB → Edge Function → Resend API → Email envoyé
                       ↓
                 Slot Offer créé
                       ↓
              get_eligible_candidates
                       ↓
            Création des invitations
```

### Points de défaillance possibles

1. **Secrets manquants** - RESEND_API_KEY, RESEND_DOMAIN, APP_DOMAIN
2. **Domaine non vérifié** - DNS records (SPF, DKIM, DMARC) manquants
3. **API Key invalide** - Révoquée, expirée, ou mauvais format
4. **Edge Functions** - Pas déployées ou anciennes versions
5. **Connexion réseau** - Firewall bloque api.resend.com
6. **Quota dépassé** - Limite d'envoi Resend atteinte

---

## Diagnostic rapide

### Étape 1: Test du diagnostic système

```javascript
// Dans votre dashboard admin > Waitlist
// Cliquez sur "🔍 Diagnostic"
// Observez la console du navigateur
```

**Résultat attendu:**
```json
{
  "overall_status": "healthy",
  "results": {
    "successes": 11,
    "warnings": 0,
    "errors": 0
  }
}
```

**Si "degraded" ou "critical":**
- Regardez la liste `diagnostics` dans l'objet retourné
- Identifiez les catégories avec `status: "error"`
- Suivez les recommandations dans `recommendations`

### Étape 2: Test d'email simple

```javascript
// Cliquez sur "📧 Tester email"
// Entrez votre adresse email
```

**Scénarios:**

#### ✅ Succès
```
Toast: "Email de test envoyé à votre@email.com!"
Email reçu en 10-30 secondes
```

#### ❌ Erreur: "RESEND_API_KEY not configured"
```
Cause: Secret manquant dans Supabase
Solution: Voir section "Configuration des secrets"
```

#### ❌ Erreur: "Failed to send email via Resend"
```
Cause: Problème avec Resend (domaine, API key, DNS)
Solution: Voir section "Vérification Resend"
```

#### ❌ Pas d'erreur mais email non reçu
```
Causes possibles:
1. Email dans spam/promotions
2. Adresse email invalide
3. Délai de livraison (attendre 2 minutes)
Solution: Vérifier Resend Dashboard > Emails
```

---

## Problèmes courants et solutions

### 1. "RESEND_API_KEY not configured"

**Symptômes:**
- Toast d'erreur lors du test email
- Console: "❌ RESEND_API_KEY is not configured!"

**Diagnostic:**
```bash
# Via Supabase CLI
supabase secrets list

# Doit montrer: RESEND_API_KEY (sans la valeur)
```

**Solution:**

1. Obtenir une API Key:
   - Allez sur [resend.com/api-keys](https://resend.com/api-keys)
   - Créez une nouvelle clé: "ChiroFlow Production"
   - Permission: "Sending access"
   - Copiez la clé (commence par `re_`)

2. Ajouter le secret:
   ```bash
   # Option 1: Via CLI
   supabase secrets set RESEND_API_KEY=re_votre_cle_ici

   # Option 2: Via Dashboard
   # Supabase Dashboard > Project Settings > Edge Functions > Secrets
   # Add new secret: RESEND_API_KEY = re_votre_cle_ici
   ```

3. Redéployer les fonctions:
   ```bash
   supabase functions deploy test-email
   supabase functions deploy process-cancellation
   supabase functions deploy handle-invitation-response
   ```

4. Retester:
   - Cliquez à nouveau sur "📧 Tester email"
   - L'email devrait s'envoyer

---

### 2. "Domain not verified"

**Symptômes:**
- Resend retourne erreur 403 ou 400
- Message: "Domain not verified" ou "Domain not found"

**Diagnostic:**

1. Allez sur [resend.com/domains](https://resend.com/domains)
2. Trouvez `janiechiro.com`
3. Vérifiez le status:
   - ✅ **Verified** = OK
   - ⚠️ **Pending** = DNS pas configurés
   - ❌ **Not Verified** = DNS incorrects

**Solution:**

1. Dans Resend, cliquez sur votre domaine
2. Copiez les 3 enregistrements DNS:

   **SPF Record:**
   ```
   Type: TXT
   Name: @ (ou janiechiro.com)
   Value: v=spf1 include:_spf.resend.com ~all
   ```

   **DKIM Record:**
   ```
   Type: TXT
   Name: resend._domainkey
   Value: [valeur unique fournie par Resend]
   ```

   **DMARC Record:**
   ```
   Type: TXT
   Name: _dmarc
   Value: v=DMARC1; p=none; rua=mailto:admin@janiechiro.com
   ```

3. Ajoutez ces records dans votre registrar DNS:
   - **GoDaddy:** My Products > Domains > DNS > Add
   - **Namecheap:** Domain List > Manage > Advanced DNS
   - **Cloudflare:** DNS > Add record (désactivez le proxy!)

4. Attendez 10-30 minutes (propagation DNS)

5. Dans Resend, cliquez "Verify Domain"

6. Le status doit passer à "Verified" ✓

**Vérification DNS:**
```bash
# Tester SPF
nslookup -type=txt janiechiro.com

# Tester DKIM
nslookup -type=txt resend._domainkey.janiechiro.com

# Tester DMARC
nslookup -type=txt _dmarc.janiechiro.com

# Via web
# https://mxtoolbox.com/SuperTool.aspx
```

---

### 3. API Key invalide ou expirée

**Symptômes:**
- Resend retourne erreur 401 ou 403
- Message: "Invalid API key" ou "Unauthorized"

**Diagnostic:**

1. Vérifiez le format:
   ```
   ✅ Correct: re_abc123def456...
   ❌ Incorrect: abc123def456... (pas de préfixe re_)
   ```

2. Vérifiez le status dans Resend:
   - Allez sur [resend.com/api-keys](https://resend.com/api-keys)
   - Status doit être "Active"

**Solution:**

1. Si la clé est révoquée ou invalide:
   - Créez une nouvelle API Key dans Resend
   - Mettez à jour le secret Supabase:
     ```bash
     supabase secrets set RESEND_API_KEY=re_nouvelle_cle
     ```
   - Redéployez les fonctions

2. Vérifiez qu'il n'y a pas d'espaces:
   ```bash
   # Mauvais
   RESEND_API_KEY=" re_abc123 "

   # Bon
   RESEND_API_KEY="re_abc123"
   ```

---

### 4. Emails vont dans spam

**Symptômes:**
- Email envoyé avec succès (logs Resend = "Delivered")
- Mais destinataire ne le voit pas
- Email trouvé dans spam/promotions

**Causes:**
1. Domaine pas complètement vérifié (DKIM/SPF/DMARC)
2. IP Resend temporairement blacklistée
3. Contenu de l'email déclenche filtres spam

**Solutions:**

1. Vérifier les DNS:
   - Tous les 3 records doivent être présents
   - Testez avec [mail-tester.com](https://www.mail-tester.com/)

2. Améliorer le score spam:
   - Évitez CAPS LOCK excessif
   - Évitez trop d'emojis
   - Ajoutez un lien de désinscription
   - Incluez votre adresse physique

3. Warmup du domaine:
   - Envoyez d'abord à des adresses internes
   - Augmentez progressivement le volume
   - Resend fait le warmup automatiquement

---

### 5. Invitations pas envoyées automatiquement

**Symptômes:**
- Annulation de RDV fonctionne
- Slot offer créé dans la DB
- Mais aucun email d'invitation envoyé

**Diagnostic:**

1. Vérifier le trigger:
   ```sql
   -- Via SQL Editor Supabase
   SELECT tgname, tgenabled
   FROM pg_trigger
   WHERE tgname = 'trigger_appointment_cancellation';

   -- Doit retourner 1 ligne avec tgenabled = 'O' (Origine = enabled)
   ```

2. Vérifier les candidats éligibles:
   ```sql
   SELECT * FROM waitlist
   WHERE status = 'active'
     AND consent_automated_notifications = true
     AND unsubscribed_at IS NULL;

   -- Doit retourner au moins 1 personne
   ```

3. Vérifier les logs Edge Function:
   ```bash
   supabase functions logs process-cancellation --tail
   ```

**Solutions:**

**Si aucun candidat éligible:**
- Ajoutez des personnes à la waitlist
- Assurez-vous que `consent_automated_notifications = true`
- Vérifiez que `status = 'active'`

**Si trigger pas actif:**
```sql
-- Réactiver le trigger
ALTER TABLE appointments ENABLE TRIGGER trigger_appointment_cancellation;
```

**Si Edge Function pas déclenchée:**
- Vérifiez que la fonction est déployée:
  ```bash
  supabase functions list
  ```
- Redéployez si nécessaire:
  ```bash
  supabase functions deploy process-cancellation
  ```

---

### 6. URLs de callback cassées dans les emails

**Symptômes:**
- Email d'invitation reçu
- Clic sur "Accepter" → 404 ou erreur
- URL incorrecte (mauvais domaine)

**Diagnostic:**

Vérifiez les URLs dans l'email:
```
❌ Mauvais: https://YOUR_PROJECT_REF.supabase.co/invitation/...
✅ Bon: https://janiechiro.com/invitation/...
```

**Solution:**

1. Configurez APP_DOMAIN:
   ```bash
   supabase secrets set APP_DOMAIN=janiechiro.com
   ```

2. Redéployez process-cancellation:
   ```bash
   supabase functions deploy process-cancellation
   ```

3. Testez à nouveau l'annulation complète

**Note:** La dernière version du code utilise maintenant APP_DOMAIN correctement!

---

## Vérifications par composant

### A. Secrets Supabase

**Commande:**
```bash
supabase secrets list
```

**Attendu:**
```
RESEND_API_KEY
RESEND_DOMAIN
APP_DOMAIN
SUPABASE_URL (automatique)
SUPABASE_SERVICE_ROLE_KEY (automatique)
```

**Valeurs correctes:**
```bash
RESEND_API_KEY=re_abc123...        # Commence par re_
RESEND_DOMAIN=janiechiro.com       # Sans https://
APP_DOMAIN=janiechiro.com          # Sans https://
```

---

### B. Configuration Resend

**Checklist:**
- [ ] Compte créé sur resend.com
- [ ] Domaine ajouté: janiechiro.com
- [ ] Status domaine: "Verified" ✓
- [ ] DNS SPF configuré
- [ ] DNS DKIM configuré
- [ ] DNS DMARC configuré
- [ ] API Key créée
- [ ] API Key status: "Active"
- [ ] API Key copiée dans Supabase secrets

**Vérification:**
1. Resend Dashboard > Domains > janiechiro.com → Status = Verified
2. Resend Dashboard > API Keys → Status = Active
3. Resend Dashboard > Usage → Quota disponible

---

### C. Edge Functions

**Commande:**
```bash
supabase functions list
```

**Attendu:**
```
test-email                    ACTIVE
process-cancellation          ACTIVE
handle-invitation-response    ACTIVE
diagnose-email-system         ACTIVE
```

**Si pas déployées:**
```bash
supabase functions deploy test-email
supabase functions deploy process-cancellation
supabase functions deploy handle-invitation-response
supabase functions deploy diagnose-email-system
```

**Vérifier les logs:**
```bash
# Logs temps réel
supabase functions logs process-cancellation --tail

# Logs récents
supabase functions logs test-email --limit 50
```

---

### D. Base de données

**Tables requises:**
```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'waitlist',
    'appointment_slot_offers',
    'slot_offer_invitations',
    'waitlist_notifications',
    'waitlist_settings'
  );
```

**Doit retourner 5 lignes.**

**Vérifier les données:**
```sql
-- Personnes en waitlist
SELECT COUNT(*) FROM waitlist WHERE status = 'active';

-- Créneaux disponibles
SELECT COUNT(*) FROM appointment_slot_offers WHERE status IN ('available', 'pending');

-- Invitations récentes
SELECT COUNT(*) FROM slot_offer_invitations WHERE sent_at > now() - interval '7 days';

-- Notifications envoyées
SELECT COUNT(*) FROM waitlist_notifications;
```

---

## Logs et monitoring

### Logs Supabase Edge Functions

**Via CLI:**
```bash
# Logs en temps réel
supabase functions logs process-cancellation --tail

# Logs avec filtre
supabase functions logs process-cancellation --search "error"

# Logs récents
supabase functions logs test-email --limit 100
```

**Via Dashboard:**
1. Supabase Dashboard
2. Edge Functions
3. Sélectionnez une fonction
4. Onglet "Logs"
5. Filtrez par date/niveau/texte

**Ce qu'il faut chercher:**

✅ **Logs de succès:**
```
📧 Process Cancellation - Configuration:
✅ Found 3 eligible candidates
📤 Preparing email for patient@email.com
📧 Sending email via Resend
✅ Email sent successfully! Resend ID: abc123
✅ Process completed: 3 invitation(s) sent
```

❌ **Logs d'erreur:**
```
❌ RESEND_API_KEY is not configured!
❌ Resend API error: Domain not verified
❌ Exception while sending email: TypeError
```

---

### Logs Resend Dashboard

**Accès:**
1. [resend.com/emails](https://resend.com/emails)
2. Filtrez par date
3. Cliquez sur un email pour détails

**Statuts possibles:**

| Status | Signification | Action |
|--------|---------------|--------|
| **Delivered** ✅ | Email envoyé avec succès | Aucune |
| **Sent** 📤 | En cours de livraison | Attendre |
| **Bounced** ⚠️ | Adresse invalide | Corriger l'email |
| **Failed** ❌ | Erreur d'envoi | Vérifier config |
| **Queued** ⏳ | En attente | Attendre |

**Informations utiles:**
- Resend ID
- Timestamp d'envoi
- Destinataire
- Subject
- Status de livraison
- Opens / Clicks (si webhook configuré)

---

### Monitoring proactif

**Requête SQL pour statistiques:**
```sql
-- Emails envoyés dernières 24h
SELECT
  COUNT(*) as total_sent,
  COUNT(*) FILTER (WHERE notification_type = 'invitation') as invitations,
  COUNT(*) FILTER (WHERE notification_type = 'confirmation') as confirmations,
  COUNT(*) FILTER (WHERE bounced = true) as bounced
FROM waitlist_notifications
WHERE sent_at > now() - interval '24 hours';

-- Taux de conversion
SELECT
  COUNT(DISTINCT soi.id) as total_invitations,
  COUNT(DISTINCT soi.id) FILTER (WHERE soi.status = 'accepted') as accepted,
  ROUND(
    COUNT(DISTINCT soi.id) FILTER (WHERE soi.status = 'accepted')::numeric /
    COUNT(DISTINCT soi.id)::numeric * 100,
    2
  ) as conversion_rate_pct
FROM slot_offer_invitations soi
WHERE soi.sent_at > now() - interval '7 days';

-- Temps de réponse moyen
SELECT
  AVG(EXTRACT(EPOCH FROM (responded_at - sent_at)) / 3600)::numeric(10,2) as avg_hours_to_respond
FROM slot_offer_invitations
WHERE status IN ('accepted', 'declined')
  AND responded_at IS NOT NULL;
```

---

## Checklist complète

### Configuration initiale

- [ ] Compte Resend créé
- [ ] Domaine ajouté dans Resend
- [ ] DNS SPF record ajouté
- [ ] DNS DKIM record ajouté
- [ ] DNS DMARC record ajouté
- [ ] Domaine vérifié (status = Verified)
- [ ] API Key créée dans Resend
- [ ] API Key copiée dans Supabase
- [ ] Secret RESEND_API_KEY ajouté
- [ ] Secret RESEND_DOMAIN ajouté
- [ ] Secret APP_DOMAIN ajouté
- [ ] Edge Functions déployées (4/4)

### Tests fonctionnels

- [ ] Diagnostic système = "healthy"
- [ ] Test email simple fonctionne
- [ ] Email reçu (pas dans spam)
- [ ] Personne créée dans waitlist
- [ ] Test annulation déclenché
- [ ] Slot offer créé dans DB
- [ ] Invitation créée dans DB
- [ ] Email invitation reçu
- [ ] Boutons Accepter/Refuser fonctionnels
- [ ] Acceptation crée un RDV
- [ ] Email confirmation reçu

### Monitoring

- [ ] Logs Supabase sans erreurs
- [ ] Logs Resend montrent "Delivered"
- [ ] Statistiques DB cohérentes
- [ ] Aucun bounce récent
- [ ] Taux de conversion > 30%

---

## Commandes de maintenance

### Nettoyage des données de test

```sql
-- Supprimer les RDV de test
DELETE FROM appointments WHERE name LIKE '%Test%';

-- Supprimer les invitations expirées (> 30 jours)
DELETE FROM slot_offer_invitations
WHERE status = 'expired'
  AND expires_at < now() - interval '30 days';

-- Marquer invitations expirées
UPDATE slot_offer_invitations
SET status = 'expired'
WHERE status = 'pending'
  AND expires_at < now();

-- Archiver les anciennes notifications (> 90 jours)
-- (Créez d'abord une table d'archive)
INSERT INTO waitlist_notifications_archive
SELECT * FROM waitlist_notifications
WHERE sent_at < now() - interval '90 days';

DELETE FROM waitlist_notifications
WHERE sent_at < now() - interval '90 days';
```

### Redéploiement complet

```bash
# Sauvegarder la config actuelle
supabase secrets list > secrets_backup.txt

# Redéployer toutes les fonctions
supabase functions deploy test-email
supabase functions deploy process-cancellation
supabase functions deploy handle-invitation-response
supabase functions deploy diagnose-email-system

# Vérifier le déploiement
supabase functions list

# Tester chaque fonction
supabase functions invoke test-email --data '{"to":"test@example.com"}'
```

---

## Support et ressources

### Documentation

- **Resend Docs:** [resend.com/docs](https://resend.com/docs)
- **Supabase Edge Functions:** [supabase.com/docs/guides/functions](https://supabase.com/docs/guides/functions)
- **DNS Configuration:** [cloudflare.com/learning/dns](https://www.cloudflare.com/learning/dns/)

### Outils

- **Test DNS:** [mxtoolbox.com](https://mxtoolbox.com/SuperTool.aspx)
- **Test Spam Score:** [mail-tester.com](https://www.mail-tester.com/)
- **Resend Status:** [status.resend.com](https://status.resend.com/)
- **Supabase Status:** [status.supabase.com](https://status.supabase.com/)

### Support

- **Resend:** support@resend.com
- **Supabase:** support@supabase.com
- **Documentation projet:** Voir fichiers DEPLOYMENT_CHECKLIST.md et VERIFICATION_SECRETS_SUPABASE.md

---

**Dernière mise à jour:** 2025-10-17
**Version:** 2.0
**Auteur:** ChiroFlow AI Team
**Status:** Guide complet et testé
