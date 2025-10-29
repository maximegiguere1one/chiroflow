# Vérification et Configuration des Secrets Supabase - Resend API

**Date:** 2025-10-17
**Objectif:** Résoudre le problème d'envoi d'emails via Resend API

---

## Diagnostic Actuel

D'après les logs du diagnostic système:
- Status: `degraded` (1 avertissement)
- 10 vérifications réussies
- 1 avertissement détecté

**Symptômes observés:**
- Les Edge Functions sont déployées et actives
- Le système est configuré mais les emails ne s'envoient pas
- Le diagnostic indique probablement un problème de configuration Resend

---

## Étape 1: Vérifier les Secrets Supabase

### 1.1 Accéder aux Secrets

1. Allez sur [supabase.com/dashboard](https://supabase.com/dashboard)
2. Sélectionnez votre projet dans le dashboard
3. Menu gauche: **Project Settings** (icône engrenage ⚙️)
4. Onglet: **Edge Functions**
5. Scrollez jusqu'à la section **"Secrets"**

### 1.2 Vérifier RESEND_API_KEY

**Checklist:**
- [ ] Le secret `RESEND_API_KEY` existe dans la liste
- [ ] La valeur commence par `re_` (format valide Resend)
- [ ] Aucun espace avant ou après la clé
- [ ] La clé fait environ 40-50 caractères

**Si le secret n'existe pas ou est incorrect:**

```
1. Allez sur resend.com/api-keys
2. Créez une nouvelle API Key:
   - Nom: "ChiroFlow Production"
   - Permission: "Sending access"
3. Copiez la clé (commence par re_)
4. Dans Supabase > Secrets:
   - Cliquez "Add new secret"
   - Name: RESEND_API_KEY
   - Value: [collez votre clé]
   - Save
```

### 1.3 Vérifier RESEND_DOMAIN

**Checklist:**
- [ ] Le secret `RESEND_DOMAIN` existe
- [ ] La valeur est exactement: `janiechiro.com`
- [ ] Pas de "https://" ou "www."
- [ ] Pas d'espaces ou caractères invisibles

**Si le secret n'existe pas:**

```
Dans Supabase > Secrets:
- Cliquez "Add new secret"
- Name: RESEND_DOMAIN
- Value: janiechiro.com
- Save
```

### 1.4 Vérifier APP_DOMAIN

**Checklist:**
- [ ] Le secret `APP_DOMAIN` existe
- [ ] La valeur correspond à votre domaine d'application
- [ ] Format: `votredomaine.com` (sans https://)

**Si le secret n'existe pas:**

```
Dans Supabase > Secrets:
- Cliquez "Add new secret"
- Name: APP_DOMAIN
- Value: janiechiro.com
- Save
```

---

## Étape 2: Vérifier Resend.com Configuration

### 2.1 Vérifier le Domaine

1. Allez sur [resend.com/domains](https://resend.com/domains)
2. Trouvez `janiechiro.com` dans la liste
3. **Le statut DOIT être: "Verified" avec checkmark verte ✓**

**Si status = "Pending" ou "Not Verified":**

```
Le problème vient des enregistrements DNS!

Actions à prendre:
1. Cliquez sur le domaine dans Resend
2. Notez les 3 enregistrements DNS requis:
   - SPF (TXT)
   - DKIM (TXT)
   - DMARC (TXT)
3. Allez dans votre registrar DNS (GoDaddy, Namecheap, etc.)
4. Ajoutez ces 3 enregistrements EXACTEMENT comme indiqué
5. Attendez 10-30 minutes (propagation DNS)
6. Retournez dans Resend et cliquez "Verify Domain"
```

### 2.2 Vérifier l'API Key dans Resend

1. Allez sur [resend.com/api-keys](https://resend.com/api-keys)
2. Trouvez votre clé "ChiroFlow Production"
3. **Status doit être: "Active"**

**Si la clé est révoquée ou n'existe pas:**
- Créez une nouvelle clé
- Mettez à jour le secret `RESEND_API_KEY` dans Supabase

---

## Étape 3: Redéployer les Edge Functions

**IMPORTANT:** Après avoir modifié les secrets, vous DEVEZ redéployer les fonctions!

### Via Supabase CLI:

```bash
# Se connecter
supabase login

# Lier le projet
supabase link --project-ref YOUR_PROJECT_REF

# Redéployer toutes les fonctions
supabase functions deploy test-email
supabase functions deploy process-cancellation
supabase functions deploy handle-invitation-response
supabase functions deploy diagnose-email-system
```

**Attendu:**
Chaque commande doit afficher:
```
✓ Deployed function [nom-fonction] successfully
```

### Via le Dashboard Supabase (Alternative):

1. Edge Functions > Sélectionnez une fonction
2. Cliquez sur "Redeploy"
3. Attendez la confirmation
4. Répétez pour chaque fonction

---

## Étape 4: Tester la Configuration

### Test 1: Diagnostic Système

1. Ouvrez votre application admin dashboard
2. Naviguez vers la section "Waitlist"
3. Cliquez sur le bouton **"🔍 Diagnostic"**
4. Observez les résultats dans la console

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

**Si vous voyez encore des erreurs:**
- Lisez attentivement les messages d'erreur
- Vérifiez la catégorie qui échoue
- Référez-vous à ce guide pour corriger

### Test 2: Email Simple

1. Cliquez sur le bouton **"📧 Tester email"**
2. Entrez votre adresse email
3. Cliquez OK

**Résultat attendu:**
- Toast: "Email de test envoyé à [votre-email]!"
- Email reçu dans les 30 secondes
- Subject: "Test Configuration Resend - ChiroFlow"
- De: "Clinique Chiropratique <noreply@janiechiro.com>"

**Si l'email n'arrive pas:**
1. Vérifiez votre dossier spam/promotions
2. Attendez 2 minutes complètes
3. Allez sur resend.com/emails
4. Vérifiez si l'email apparaît et son statut:
   - "Delivered" = ✅ Email envoyé avec succès
   - "Bounced" = ❌ Adresse email invalide
   - "Failed" = ❌ Problème de configuration

### Test 3: Annulation Complète

1. Cliquez sur **"🧪 Tester annulation"**
2. Attendez 10-20 secondes
3. Le dashboard doit se rafraîchir automatiquement

**Résultat attendu:**
- Nouveau créneau dans "Créneaux disponibles"
- Nouvelle invitation dans "Invitations récentes"
- Email d'invitation reçu avec 2 boutons (Accepter/Refuser)

---

## Dépannage Avancé

### Problème: "RESEND_API_KEY not configured"

**Cause:** Le secret n'est pas défini ou mal nommé

**Solution:**
1. Vérifiez l'orthographe exacte: `RESEND_API_KEY` (sensible à la casse)
2. Recréez le secret si nécessaire
3. Redéployez les fonctions

### Problème: "Domain not verified"

**Cause:** Les enregistrements DNS ne sont pas configurés

**Solution:**
1. Vérifiez les DNS avec [mxtoolbox.com/SuperTool.aspx](https://mxtoolbox.com/SuperTool.aspx)
2. Testez SPF: `nslookup -type=txt janiechiro.com`
3. Testez DKIM: `nslookup -type=txt resend._domainkey.janiechiro.com`
4. Attendez jusqu'à 24h pour propagation complète

### Problème: "Failed to send email via Resend"

**Causes possibles:**
1. Quota Resend dépassé (vérifiez resend.com/usage)
2. Adresse email destinataire invalide
3. API Key révoquée ou expirée
4. Problème temporaire de Resend (vérifiez status.resend.com)

**Solution:**
- Consultez les logs Resend Dashboard > Emails
- Vérifiez le message d'erreur exact
- Contactez support@resend.com si nécessaire

### Problème: Les fonctions ne se déploient pas

**Erreur courante:**
```
Error: Failed to deploy function
```

**Solution:**
```bash
# Vérifier la connexion
supabase projects list

# Si pas connecté
supabase login

# Vérifier le lien projet
supabase link --project-ref YOUR_PROJECT_REF

# Retry le déploiement
supabase functions deploy [nom-fonction] --debug
```

---

## Checklist de Validation Finale

Avant de considérer le problème résolu, validez TOUS ces points:

- [ ] ✅ Secrets configurés dans Supabase (RESEND_API_KEY, RESEND_DOMAIN, APP_DOMAIN)
- [ ] ✅ Domaine vérifié dans Resend (status = "Verified")
- [ ] ✅ API Key active dans Resend
- [ ] ✅ Edge Functions redéployées (4/4)
- [ ] ✅ Diagnostic système retourne "healthy"
- [ ] ✅ Test email simple fonctionne (email reçu)
- [ ] ✅ Test annulation fonctionne (slot créé + invitation envoyée)
- [ ] ✅ Email d'invitation reçu avec boutons fonctionnels
- [ ] ✅ Acceptation d'invitation fonctionne
- [ ] ✅ Email de confirmation reçu

---

## Résumé des Commandes Utiles

```bash
# Vérifier les secrets (ne montre pas les valeurs)
supabase secrets list

# Définir un secret
supabase secrets set RESEND_API_KEY=re_votre_cle

# Lister les fonctions déployées
supabase functions list

# Voir les logs d'une fonction
supabase functions logs test-email

# Redéployer toutes les fonctions
supabase functions deploy test-email && \
supabase functions deploy process-cancellation && \
supabase functions deploy handle-invitation-response && \
supabase functions deploy diagnose-email-system
```

---

## Support

Si après avoir suivi ce guide le problème persiste:

1. **Consultez les logs:**
   - Supabase Dashboard > Edge Functions > [fonction] > Logs
   - Resend Dashboard > Emails (vérifiez les statuts)

2. **Partagez ces informations:**
   - Résultat complet du diagnostic (console)
   - Logs de la fonction test-email
   - Statut du domaine dans Resend
   - Message d'erreur exact

3. **Contactez:**
   - Support Resend: support@resend.com
   - Support Supabase: support@supabase.com

---

**Dernière mise à jour:** 2025-10-17
**Version:** 1.0
**Status:** Guide de dépannage complet
