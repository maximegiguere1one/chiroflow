# Configuration des Secrets Supabase - GUIDE RAPIDE

**Date:** 2025-10-17
**Temps estimé:** 5 minutes
**Priorité:** CRITIQUE

---

## SECRETS REQUIS

Votre projet a besoin de **3 secrets** configurés dans Supabase pour fonctionner:

### 1. RESEND_API_KEY

**Valeur:** Votre clé API Resend (commence par `re_`)

**Où la trouver:**
1. Allez sur https://resend.com/api-keys
2. Copiez votre clé API (elle commence par `re_`)
3. Si vous n'en avez pas, cliquez "Create API Key"

**Format attendu:** `re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

---

### 2. RESEND_DOMAIN

**Valeur:** `janiechiro.com`

**Important:** Ce domaine DOIT être vérifié dans Resend (avec DNS configurés)

---

### 3. APP_DOMAIN

**Valeur:** `janiechiro.com`

**Utilité:** Générer les URLs de callback pour les invitations (boutons Accepter/Refuser)

---

## COMMENT CONFIGURER LES SECRETS

### Méthode 1: Via Supabase Dashboard (Recommandé)

1. Allez sur https://supabase.com/dashboard (sélectionnez votre projet)

2. Cliquez sur "Project Settings" (icône engrenage en bas à gauche)

3. Dans le menu, cliquez sur "Edge Functions"

4. Cliquez sur l'onglet "Manage secrets"

5. Pour chaque secret, cliquez "Add new secret":

   ```
   Name: RESEND_API_KEY
   Value: re_[votre_clé_ici]
   ```

   ```
   Name: RESEND_DOMAIN
   Value: janiechiro.com
   ```

   ```
   Name: APP_DOMAIN
   Value: janiechiro.com
   ```

6. Cliquez "Save" après chaque secret

---

### Méthode 2: Via Supabase CLI (Alternative)

```bash
# Se connecter
supabase login

# Lier le projet
supabase link --project-ref YOUR_PROJECT_REF

# Définir les secrets
supabase secrets set RESEND_API_KEY=re_votre_cle_ici
supabase secrets set RESEND_DOMAIN=janiechiro.com
supabase secrets set APP_DOMAIN=janiechiro.com

# Vérifier
supabase secrets list
```

---

## VÉRIFICATION

Après avoir configuré les secrets, vérifiez qu'ils sont bien enregistrés:

```bash
supabase secrets list
```

**Résultat attendu:**
```
NAME                    VALUE
RESEND_API_KEY          re_...
RESEND_DOMAIN           janiechiro.com
APP_DOMAIN              janiechiro.com
SUPABASE_URL            (déjà présent)
SUPABASE_SERVICE_ROLE_KEY (déjà présent)
```

**Note:** Les valeurs complètes des secrets sont masquées pour la sécurité.

---

## SECRETS AUTOMATIQUES

Ces secrets sont **déjà configurés automatiquement** par Supabase (ne pas les modifier):

- `SUPABASE_URL` - URL de votre projet Supabase
- `SUPABASE_SERVICE_ROLE_KEY` - Clé secrète pour accès privilégié
- `SUPABASE_ANON_KEY` - Clé publique pour frontend

---

## APRÈS LA CONFIGURATION

Une fois les 3 secrets ajoutés, vous devez **redéployer les Edge Functions** pour qu'elles utilisent les nouvelles valeurs:

```bash
# Redéployer toutes les fonctions
supabase functions deploy process-cancellation
supabase functions deploy test-email
supabase functions deploy handle-invitation-response
supabase functions deploy diagnose-email-system
supabase functions deploy waitlist-listener
supabase functions deploy manual-process-slot
```

---

## TESTER LA CONFIGURATION

1. Ouvrez votre Dashboard Admin: https://janiechiro.com/admin

2. Allez dans "Liste de rappel"

3. Cliquez sur "🔍 Diagnostic"

4. Vérifiez le résultat:
   - **healthy** ✅ = Tout fonctionne!
   - **degraded** ⚠️ = Warnings à corriger
   - **critical** ❌ = Erreurs critiques à résoudre

5. Si "healthy", testez l'envoi d'email:
   - Cliquez "📧 Tester email"
   - Entrez votre email
   - Vérifiez la réception sous 30 secondes

---

## DÉPANNAGE

### Le diagnostic affiche "RESEND_API_KEY is MISSING"

**Solution:** Le secret n'est pas encore configuré ou les fonctions n'ont pas été redéployées.

1. Vérifiez que le secret existe: `supabase secrets list`
2. Si absent, ajoutez-le via le Dashboard ou CLI
3. Redéployez les fonctions: `supabase functions deploy process-cancellation`

---

### Le diagnostic affiche "Domain not verified"

**Solution:** Le domaine `janiechiro.com` n'est pas vérifié dans Resend.

1. Allez sur https://resend.com/domains
2. Trouvez `janiechiro.com`
3. Si status = "Pending", configurez les DNS records
4. Si status = "Verified", vérifiez que RESEND_DOMAIN est bien `janiechiro.com`

---

### Les emails vont à delivered@resend.dev

**Cause:** Le domaine n'est pas vérifié dans Resend.

**Solution:**
1. Vérifiez votre domaine sur resend.com/domains
2. Configurez les DNS records (SPF, DKIM, DMARC)
3. Attendez 24-48h pour la propagation DNS
4. Retestez avec "📧 Tester email"

---

## RÉSUMÉ VISUEL

```
┌─────────────────────────────────────────────────────────┐
│                SECRETS SUPABASE REQUIS                  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ✅ RESEND_API_KEY = re_xxxxx (depuis resend.com)      │
│  ✅ RESEND_DOMAIN = janiechiro.com                     │
│  ✅ APP_DOMAIN = janiechiro.com                        │
│                                                         │
│  🔒 SUPABASE_URL (automatique)                         │
│  🔒 SUPABASE_SERVICE_ROLE_KEY (automatique)            │
│                                                         │
└─────────────────────────────────────────────────────────┘

APRÈS CONFIGURATION → REDÉPLOYER → TESTER → ✅ PRÊT!
```

---

## SÉCURITÉ

⚠️ **IMPORTANT:**

- Ne commitez JAMAIS les secrets dans Git
- Ne partagez JAMAIS votre RESEND_API_KEY publiquement
- Ne loggez JAMAIS les secrets dans la console
- Les secrets sont automatiquement injectés dans les Edge Functions

---

## PROCHAINE ÉTAPE

Une fois les secrets configurés et les fonctions redéployées:

📖 Consultez **DEPLOY_GUIDE_RAPIDE.md** pour les étapes de déploiement complètes.

---

**Questions?** Consultez GUIDE_DEPANNAGE_EMAILS.md pour le troubleshooting complet.
