# Guide Rapide: Correction du Problème d'Envoi d'Emails

**Date:** 2025-10-17
**Objectif:** Faire fonctionner l'envoi d'emails en 15 minutes

---

## Vue d'Ensemble du Problème

Votre système ne peut pas envoyer d'emails car **deux éléments critiques** sont manquants ou mal configurés:

1. Les secrets Supabase (RESEND_API_KEY, RESEND_DOMAIN)
2. La vérification du domaine dans Resend

## Nouveau: Outils de Diagnostic Automatique

### Assistant de Configuration Email

Un nouvel assistant a été ajouté au Dashboard Waitlist qui:
- Vérifie automatiquement tous les secrets Supabase
- Valide la configuration du domaine Resend
- Affiche les problèmes en temps réel avec des actions précises
- Fournit des liens directs vers Resend et Supabase

**Comment l'utiliser:**
1. Connectez-vous au Dashboard Admin
2. Allez dans l'onglet "Waitlist"
3. L'assistant s'affiche en haut de la page
4. Suivez les instructions affichées

### Nouvelle Fonction: check-secrets

Une nouvelle Edge Function `check-secrets` analyse votre configuration:

```bash
# Appeler via l'URL
curl -X POST https://VOTRE_PROJET.supabase.co/functions/v1/check-secrets \
  -H "Authorization: Bearer VOTRE_ANON_KEY"
```

**Réponse exemple:**
```json
{
  "status": "critical",
  "summary": {
    "critical_errors": 2,
    "secrets_valid": 0
  },
  "secrets": [
    {
      "name": "RESEND_API_KEY",
      "exists": false,
      "issue": "Secret manquant"
    }
  ],
  "action_items": [
    "1. Allez sur resend.com/api-keys",
    "2. Créez une nouvelle API Key..."
  ]
}
```

---

## Étape 1: Vérifier et Configurer les Secrets Supabase (10 minutes)

### 1.1 Accéder aux Secrets Supabase

1. Allez sur [supabase.com/dashboard](https://supabase.com/dashboard)
2. Sélectionnez votre projet
3. Menu: **Project Settings** > **Edge Functions**
4. Section **Secrets**

### 1.2 Ajouter RESEND_API_KEY

**Si vous avez déjà une clé Resend:**

1. Récupérez votre clé sur [resend.com/api-keys](https://resend.com/api-keys)
2. Cliquez **Add new secret**
   - Name: `RESEND_API_KEY`
   - Value: Votre clé (commence par `re_`)
3. Cliquez **Save**

**Si vous n'avez PAS de clé:**

1. Allez sur [resend.com/api-keys](https://resend.com/api-keys)
2. Cliquez **Create API Key**
   - Name: `ChiroFlow Production`
   - Permission: **Sending access**
3. Cliquez **Add**
4. Copiez immédiatement la clé (vous ne pourrez plus la voir)
5. Ajoutez-la dans Supabase comme ci-dessus

### 1.3 Ajouter RESEND_DOMAIN

1. Dans Supabase Secrets, cliquez **Add new secret**
   - Name: `RESEND_DOMAIN`
   - Value: `janiechiro.com`
2. Cliquez **Save**

### 1.4 Ajouter APP_DOMAIN (Optionnel mais recommandé)

1. Cliquez **Add new secret**
   - Name: `APP_DOMAIN`
   - Value: `janiechiro.com`
2. Cliquez **Save**

### 1.5 Vérifier la Configuration

Utilisez l'assistant dans le Dashboard ou appelez:
```bash
curl -X POST https://VOTRE_PROJET.supabase.co/functions/v1/check-secrets
```

**Résultat attendu:**
- `status: "ready"` ou `status: "warning"`
- `secrets_valid: 3` (ou 2 si APP_DOMAIN manque)

---

## Étape 2: Vérifier le Domaine dans Resend (5 minutes)

### 2.1 Vérifier le Statut du Domaine

1. Allez sur [resend.com/domains](https://resend.com/domains)
2. Cherchez `janiechiro.com` dans la liste

**Trois scénarios possibles:**

#### Scénario A: Domaine VERIFIED ✅
Si le statut affiche **"Verified"** avec une coche verte:
- Vous êtes prêt! Passez à l'Étape 3

#### Scénario B: Domaine PENDING ⚠️
Si le statut affiche **"Pending"** ou **"Not Verified"**:
- Les DNS records ne sont pas configurés ou n'ont pas propagé
- Continuez avec la section 2.2 ci-dessous

#### Scénario C: Domaine NON EXISTANT ❌
Si `janiechiro.com` n'apparaît pas dans la liste:
- Vous devez ajouter le domaine
- Continuez avec la section 2.3 ci-dessous

### 2.2 Si le Domaine est PENDING

1. Cliquez sur votre domaine dans la liste
2. Vous verrez 3 DNS records à configurer:
   - SPF (TXT record)
   - DKIM (TXT record)
   - DMARC (TXT record)

3. Copiez chaque record et ajoutez-les chez votre registrar DNS:
   - **GoDaddy:** My Products > DNS > Add Record
   - **Namecheap:** Domain List > Advanced DNS > Add New Record
   - **Cloudflare:** DNS > Add record (désactivez le proxy orange)

4. Attendez 5-30 minutes pour la propagation DNS

5. Retournez sur Resend et cliquez **Verify Domain**

6. Le statut devrait passer à **"Verified"** ✅

### 2.3 Si le Domaine N'Existe Pas

1. Sur [resend.com/domains](https://resend.com/domains), cliquez **Add Domain**
2. Entrez: `janiechiro.com`
3. Cliquez **Add**
4. Suivez les instructions de la section 2.2 pour configurer les DNS records

---

## Étape 3: Tester la Configuration (2 minutes)

### 3.1 Test Automatique via le Dashboard

1. Allez dans le Dashboard Admin > Waitlist
2. Cliquez sur **📧 Tester email**
3. Entrez votre adresse email
4. Cliquez OK

**Résultats possibles:**

✅ **Succès!**
```
Email envoyé avec succès à votre@email.com!
Vérifiez votre boîte mail
```
→ Configuration complète! Vous pouvez utiliser le système.

⚠️ **Avertissement - Domaine non vérifié**
```
Email envoyé (mais attention au domaine non vérifié)
L'email a été envoyé à delivered@resend.dev
```
→ Retournez à l'Étape 2 pour vérifier votre domaine.

❌ **Erreur - API Key invalide**
```
API Key Authentication Failed
RESEND_API_KEY est invalide, révoquée, ou a expiré
```
→ Votre clé API est incorrecte. Retournez à l'Étape 1.2.

❌ **Erreur - Domaine non configuré**
```
Domain Configuration Problem
Le domaine info@janiechiro.com n'est pas vérifié
```
→ Retournez à l'Étape 2 pour configurer votre domaine.

### 3.2 Test Manuel via curl

```bash
curl -X POST https://VOTRE_PROJET.supabase.co/functions/v1/test-email \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer VOTRE_ANON_KEY" \
  -d '{"to":"votre@email.com","name":"Test User"}'
```

### 3.3 Vérifier les Logs

**Dans Supabase:**
1. Dashboard > Edge Functions > test-email
2. Cliquez sur **Logs**
3. Cherchez les messages récents

**Logs normaux (succès):**
```
🧪 Test Email Function - Starting
- RESEND_API_KEY exists: true
- RESEND_DOMAIN: janiechiro.com
📧 Sending test email to: votre@email.com
Resend Response Status: 200
✅ Email sent successfully!
```

**Logs d'erreur (échec):**
```
❌ RESEND_API_KEY is missing!
```
ou
```
❌ Resend API Error Details:
- Status: 401
- Message: Invalid API key
```

---

## Étape 4: Test du Flux Complet (3 minutes)

Une fois l'envoi d'emails validé, testez le flux automatique:

1. Dans le Dashboard Waitlist, cliquez **🧪 Tester annulation**
2. Le système va:
   - Créer un rendez-vous test demain à 10h
   - L'annuler immédiatement
   - Déclencher le trigger PostgreSQL
   - Créer un slot offer
   - Chercher des candidats dans la waitlist
   - Envoyer des emails d'invitation

3. Vérifiez les résultats:
   - Message de succès dans le Dashboard
   - Nouvelles entrées dans les sections "Créneaux Disponibles" et "Invitations"
   - Emails reçus (si des candidats dans la waitlist)

---

## Dépannage Rapide

### Problème: "RESEND_API_KEY not configured"

**Cause:** Le secret n'existe pas ou a un nom incorrect dans Supabase

**Solution:**
1. Vérifiez l'orthographe exacte: `RESEND_API_KEY` (sensible à la casse)
2. Ajoutez-le dans Supabase Dashboard > Project Settings > Edge Functions > Secrets
3. Attendez 30 secondes après l'ajout
4. Retestez

### Problème: "API Key Authentication Failed"

**Cause:** La clé API est invalide, révoquée, ou a expiré

**Solution:**
1. Vérifiez que la clé commence par `re_`
2. Vérifiez sur [resend.com/api-keys](https://resend.com/api-keys) que la clé est active
3. Si révoquée ou absente, générez une nouvelle clé
4. Mettez à jour le secret dans Supabase
5. Retestez après 30 secondes

### Problème: "Domain not verified"

**Cause:** Le domaine janiechiro.com n'est pas vérifié dans Resend

**Solution:**
1. Allez sur [resend.com/domains](https://resend.com/domains)
2. Si le domaine n'existe pas, ajoutez-le
3. Configurez les 3 DNS records (SPF, DKIM, DMARC)
4. Attendez 5-30 minutes pour la propagation DNS
5. Cliquez "Verify Domain" dans Resend
6. Retestez une fois vérifié

### Problème: Les emails vont à delivered@resend.dev

**Cause:** RESEND_DOMAIN n'est pas configuré OU le domaine n'est pas vérifié

**Solution:**
1. Vérifiez que RESEND_DOMAIN=janiechiro.com existe dans Supabase Secrets
2. Vérifiez que janiechiro.com est "Verified" dans Resend
3. Les deux doivent être corrects pour que les emails aillent aux vrais destinataires

### Problème: L'assistant affiche toujours des erreurs

**Cause:** Les secrets sont mal configurés ou le cache n'est pas rafraîchi

**Solution:**
1. Cliquez sur le bouton **🔄 Rafraîchir** dans l'assistant
2. Attendez 30 secondes après toute modification de secrets
3. Si les erreurs persistent, vérifiez chaque secret individuellement
4. Redémarrez les Edge Functions (elles se redémarrent automatiquement après 30s)

---

## Checklist de Configuration Complète

Avant de considérer la configuration terminée, vérifiez:

- [ ] **RESEND_API_KEY** existe dans Supabase Secrets
- [ ] La clé commence par `re_` et a plus de 20 caractères
- [ ] **RESEND_DOMAIN** = `janiechiro.com` dans Supabase Secrets
- [ ] Le domaine `janiechiro.com` existe dans [resend.com/domains](https://resend.com/domains)
- [ ] Le statut du domaine est **"Verified"** (coche verte)
- [ ] Les 3 DNS records sont configurés (SPF, DKIM, DMARC)
- [ ] L'assistant de configuration affiche `status: "ready"`
- [ ] Test d'email réussi: email reçu dans votre boîte mail
- [ ] Test d'annulation réussi: slot créé et invitations envoyées

---

## Liens Rapides

- [Supabase Dashboard - Secrets](https://supabase.com/dashboard) → Project Settings > Edge Functions > Secrets
- [Resend - API Keys](https://resend.com/api-keys)
- [Resend - Domains](https://resend.com/domains)
- [Resend - Email Logs](https://resend.com/emails)
- [Dashboard Admin Local](http://localhost:5173/admin/dashboard)

---

## Support

Si après avoir suivi ce guide, les emails ne fonctionnent toujours pas:

1. Utilisez le bouton **🔍 Diagnostic** dans le Dashboard Waitlist
2. Consultez les logs détaillés dans la console du navigateur
3. Vérifiez les logs des Edge Functions dans Supabase Dashboard
4. Consultez RESEND_SETUP_GUIDE.md pour des instructions détaillées
5. Contactez le support technique avec:
   - Le statut affiché par l'assistant de configuration
   - Les messages d'erreur exacts
   - Les captures d'écran du dashboard Resend (statut du domaine)

---

**Temps estimé total:** 15-20 minutes
**Difficulté:** Facile (configuration uniquement, pas de code)
**Résultat:** Système d'envoi d'emails 100% fonctionnel
