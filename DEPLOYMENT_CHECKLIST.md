# 📋 Checklist de Déploiement - ChiroFlow AI + Resend

**Date:** 2025-10-17
**Temps estimé:** 30 minutes
**Niveau:** Débutant (instructions détaillées)

---

## ⚠️ Avant de Commencer

Assurez-vous d'avoir:
- [ ] Accès au dashboard Supabase (voir votre URL de projet)
- [ ] Accès à votre registrar DNS (GoDaddy, Namecheap, Cloudflare, etc.)
- [ ] Adresse email valide pour recevoir les tests
- [ ] 30 minutes devant vous sans interruption

---

## Phase 1: Configuration Resend (10-15 minutes)

### Étape 1.1: Créer le compte Resend

- [ ] Allez sur [resend.com](https://resend.com)
- [ ] Cliquez sur **"Sign Up"** (coin supérieur droit)
- [ ] Créez votre compte avec votre email professionnel
- [ ] Confirmez votre email (vérifiez votre boîte mail)
- [ ] Connectez-vous à votre dashboard Resend

**✅ Checkpoint:** Vous êtes connecté au dashboard Resend

---

### Étape 1.2: Ajouter le domaine janiechiro.com

- [ ] Dans le dashboard, cliquez sur **"Domains"** (menu gauche)
- [ ] Cliquez sur **"Add Domain"** (bouton bleu)
- [ ] Entrez: `janiechiro.com`
- [ ] Cliquez sur **"Add"**

**✅ Checkpoint:** Le domaine apparaît dans la liste avec status "Pending"

---

### Étape 1.3: Configurer les DNS Records

Resend vous montre maintenant 3 enregistrements DNS à configurer:

#### Record 1: SPF (TXT)
```
Type: TXT
Name: @ (ou janiechiro.com)
Value: v=spf1 include:_spf.resend.com ~all
TTL: 3600
```

#### Record 2: DKIM (TXT)
```
Type: TXT
Name: resend._domainkey
Value: [valeur unique fournie par Resend - IMPORTANT: copiez-la exactement]
TTL: 3600
```

#### Record 3: DMARC (TXT)
```
Type: TXT
Name: _dmarc
Value: v=DMARC1; p=none; rua=mailto:admin@janiechiro.com
TTL: 3600
```

**⚠️ IMPORTANT:**
- Ne fermez PAS la page Resend, vous aurez besoin des valeurs
- La valeur DKIM est unique pour votre domaine

---

### Étape 1.4: Ajouter les records dans votre DNS

**Pour GoDaddy:**
1. Connectez-vous à [godaddy.com](https://godaddy.com)
2. My Products > Domains > janiechiro.com > DNS
3. Cliquez "Add" pour chaque record
4. Collez exactement les valeurs de Resend

**Pour Namecheap:**
1. Connectez-vous à [namecheap.com](https://namecheap.com)
2. Domain List > Manage > Advanced DNS
3. Add New Record
4. Collez les valeurs de Resend

**Pour Cloudflare:**
1. Connectez-vous à [cloudflare.com](https://cloudflare.com)
2. Sélectionnez janiechiro.com
3. DNS > Add record
4. **IMPORTANT:** Désactivez le proxy (icône nuage orange → gris)
5. Collez les valeurs de Resend

**Checklist Records:**
- [ ] SPF record ajouté
- [ ] DKIM record ajouté
- [ ] DMARC record ajouté
- [ ] Sauvegardé dans le registrar DNS

**✅ Checkpoint:** Les 3 records sont dans votre DNS

---

### Étape 1.5: Attendre et vérifier

- [ ] Attendez **5-10 minutes** (propagation DNS)
- [ ] ☕ Prenez un café ou thé
- [ ] Retournez dans Resend > Domains
- [ ] Cliquez sur le bouton **"Verify Domain"** à côté de janiechiro.com
- [ ] Le status doit passer à **"Verified"** avec une checkmark verte ✓

**⚠️ Si "Not Verified":**
- Attendez encore 10 minutes (propagation peut prendre jusqu'à 30 min)
- Vérifiez que vous avez copié les valeurs EXACTEMENT
- Testez avec [mxtoolbox.com/SuperTool.aspx](https://mxtoolbox.com/SuperTool.aspx)

**✅ Checkpoint:** Domaine vérifié (status = Verified)

---

### Étape 1.6: Générer l'API Key

- [ ] Dans Resend, cliquez sur **"API Keys"** (menu gauche)
- [ ] Cliquez sur **"Create API Key"**
- [ ] Nom: `ChiroFlow Production`
- [ ] Permission: Sélectionnez **"Sending access"**
- [ ] Cliquez sur **"Add"**
- [ ] **IMPORTANT:** Copiez immédiatement la clé (commence par `re_`)
- [ ] Collez-la dans un endroit sûr (notepad, password manager)

**Format de la clé:**
```
re_abc123def456ghi789jkl012mno345pqr678
```

**⚠️ ATTENTION:**
- Vous ne pourrez PLUS voir cette clé après avoir fermé la fenêtre
- Si vous la perdez, vous devrez en regénérer une nouvelle

**✅ Checkpoint:** API Key copiée et sauvegardée

---

## Phase 2: Configuration Supabase (2-3 minutes)

### Étape 2.1: Accéder aux Secrets

- [ ] Allez sur [supabase.com/dashboard](https://supabase.com/dashboard)
- [ ] Connectez-vous si nécessaire
- [ ] Sélectionnez votre projet dans le dashboard
- [ ] Dans le menu gauche: **Project Settings** (icône engrenage)
- [ ] Onglet **Edge Functions**
- [ ] Scrollez jusqu'à la section **"Secrets"**

**✅ Checkpoint:** Vous voyez la section Secrets avec un bouton "Add new secret"

---

### Étape 2.2: Ajouter les 3 Secrets

**Secret 1: RESEND_API_KEY**
- [ ] Cliquez **"Add new secret"**
- [ ] Name: `RESEND_API_KEY`
- [ ] Value: `re_votre_cle_copiee_etape_1_6`
- [ ] Cliquez **"Add secret"**

**Secret 2: RESEND_DOMAIN**
- [ ] Cliquez **"Add new secret"**
- [ ] Name: `RESEND_DOMAIN`
- [ ] Value: `janiechiro.com`
- [ ] Cliquez **"Add secret"**

**Secret 3: APP_DOMAIN**
- [ ] Cliquez **"Add new secret"**
- [ ] Name: `APP_DOMAIN`
- [ ] Value: `janiechiro.com` (ou votre domaine d'app si différent)
- [ ] Cliquez **"Add secret"**

**Checklist Secrets:**
- [ ] RESEND_API_KEY ajouté
- [ ] RESEND_DOMAIN ajouté
- [ ] APP_DOMAIN ajouté
- [ ] Les 3 apparaissent dans la liste

**✅ Checkpoint:** 3 secrets configurés dans Supabase

---

## Phase 3: Déploiement Edge Functions (5 minutes)

### Prérequis

Vous devez avoir Supabase CLI installé. Si pas encore fait:

```bash
# macOS/Linux
brew install supabase/tap/supabase

# Windows
scoop install supabase

# Ou npm
npm install -g supabase
```

---

### Étape 3.1: Login Supabase CLI

```bash
# Se connecter
supabase login

# Vérifier connexion
supabase projects list
```

- [ ] Login réussi
- [ ] Votre projet apparaît dans la liste

---

### Étape 3.2: Lier le projet

```bash
# Depuis le dossier du projet
cd /chemin/vers/votre/projet

# Lier le projet
supabase link --project-ref YOUR_PROJECT_REF
```

- [ ] Projet lié avec succès

---

### Étape 3.3: Déployer les fonctions

**Fonction 1: test-email**
```bash
supabase functions deploy test-email
```
- [ ] Déployée avec succès

**Fonction 2: process-cancellation**
```bash
supabase functions deploy process-cancellation
```
- [ ] Déployée avec succès

**Fonction 3: handle-invitation-response**
```bash
supabase functions deploy handle-invitation-response
```
- [ ] Déployée avec succès

**Fonction 4: waitlist-listener (optionnel)**
```bash
supabase functions deploy waitlist-listener
```
- [ ] Déployée avec succès

**✅ Checkpoint:** Les 4 fonctions sont déployées

---

### Étape 3.4: Vérifier les déploiements

```bash
# Lister les fonctions
supabase functions list
```

Vous devriez voir:
```
┌──────────────────────────────────┬──────────┬─────────┐
│ NAME                              │ VERSION  │ STATUS  │
├──────────────────────────────────┼──────────┼─────────┤
│ test-email                        │ 1        │ ACTIVE  │
│ process-cancellation              │ 1        │ ACTIVE  │
│ handle-invitation-response        │ 1        │ ACTIVE  │
│ waitlist-listener                 │ 1        │ ACTIVE  │
└──────────────────────────────────┴──────────┴─────────┘
```

- [ ] Les 4 fonctions apparaissent avec status ACTIVE

**✅ Checkpoint:** Toutes les fonctions sont actives

---

## Phase 4: Tests (10 minutes)

### Test 1: Email de Test Simple

**Via Dashboard Admin:**
1. - [ ] Connectez-vous à votre app: `https://janiechiro.com/admin`
2. - [ ] Naviguez vers la section **Waitlist** (menu gauche)
3. - [ ] Cliquez sur le bouton **"📧 Tester email"** (coin supérieur droit)
4. - [ ] Entrez votre email personnel dans le prompt
5. - [ ] Cliquez OK

**Attendu:**
- Toast "Envoi de l'email de test en cours..."
- Après 2-5 secondes: Toast "Email de test envoyé à [votre-email]!"

**Vérification:**
- [ ] Ouvrez votre boîte email
- [ ] Email reçu de "Clinique Chiropratique <noreply@janiechiro.com>"
- [ ] Subject: "Test Configuration Resend - ChiroFlow"
- [ ] Email bien formaté avec checkmark vert
- [ ] Pas dans spam

**🐛 Si email NON reçu:**
1. Vérifiez spam/promotions
2. Attendez 2 minutes (délai serveur)
3. Dashboard Resend > Emails > Vérifiez si envoyé
4. Si erreur Resend: Vérifiez RESEND_API_KEY

**✅ Checkpoint:** Email de test reçu et bien formaté

---

### Test 2: Créer une Personne Waitlist

**Via SQL Editor (Supabase):**
1. - [ ] Dashboard Supabase > SQL Editor
2. - [ ] Nouvelle requête
3. - [ ] Copiez-collez:

```sql
INSERT INTO waitlist (
  name,
  email,
  phone,
  reason,
  status,
  consent_automated_notifications
) VALUES (
  'Test Patient',
  'votre@email.com',  -- Remplacez par VOTRE email
  '418-555-0123',
  'Mal de dos chronique',
  'active',
  true
);
```

4. - [ ] Remplacez `votre@email.com` par VOTRE vrai email
5. - [ ] Cliquez **"Run"**
6. - [ ] Vérifiez: "Success. 1 rows affected"

**✅ Checkpoint:** Personne créée dans waitlist

---

### Test 3: Simuler une Annulation

**Via Dashboard Admin:**
1. - [ ] Retournez dans section Waitlist
2. - [ ] Cliquez sur le bouton **"🧪 Tester annulation"**
3. - [ ] Toast "Test d'annulation lancé!"

**Ce qui se passe en coulisses:**
1. Crée un RDV pour demain 10h
2. L'annule immédiatement (status = cancelled)
3. Trigger DB crée un slot_offer
4. Edge Function process-cancellation se lance
5. Trouve les candidats éligibles (vous!)
6. Génère token sécurisé
7. Envoie email d'invitation via Resend

**Attendu (après 10-20 secondes):**
- [ ] Dashboard se refresh automatiquement
- [ ] Statistiques mises à jour
- [ ] Section "Créneaux disponibles" montre 1 nouveau slot
- [ ] Section "Invitations récentes" montre votre invitation

**Vérification Email:**
- [ ] Email reçu de "Clinique Chiropratique <noreply@janiechiro.com>"
- [ ] Subject: "🎯 Un créneau vient de se libérer pour vous!"
- [ ] Contient date/heure demain 10h00
- [ ] 2 boutons: "Oui, je prends ce rendez-vous!" (vert) et "Non merci" (gris)
- [ ] Banner jaune "Cette invitation expire dans..."

**🐛 Si email NON reçu:**
1. Attendez 1 minute complète
2. Dashboard Supabase > Table Explorer > `slot_offer_invitations`
   - Vérifiez qu'une ligne existe avec votre email
3. Dashboard Supabase > Edge Functions > process-cancellation > Logs
   - Cherchez des erreurs
4. Dashboard Resend > Emails
   - Vérifiez si email apparaît (delivered, bounced, etc.)

**✅ Checkpoint:** Email d'invitation reçu avec boutons

---

### Test 4: Accepter l'Invitation

**Via Email:**
1. - [ ] Ouvrez l'email d'invitation dans votre boîte
2. - [ ] Cliquez sur le bouton vert **"Oui, je prends ce rendez-vous!"**
3. - [ ] Une nouvelle page s'ouvre: `/invitation/[TOKEN]`

**Page d'invitation:**
- [ ] Voit le créneau (date, heure, durée)
- [ ] Banner jaune avec countdown
- [ ] 2 boutons: Accepter (vert) et Décliner (gris)
- [ ] Cliquez sur le bouton **"Oui, je prends ce rendez-vous!"**

**Attendu:**
- [ ] Bouton montre "Traitement en cours..." avec spinner
- [ ] Après 2-3 secondes: Page verte avec checkmark
- [ ] Message "Merci! Rendez-vous confirmé!"
- [ ] Bouton "Retour à l'accueil"

**Vérification Dashboard:**
1. - [ ] Retournez dashboard admin > Waitlist
2. - [ ] Statistique "Planifiés" a augmenté de 1
3. - [ ] L'invitation apparaît en vert (status: accepted)

**Vérification Email Confirmation:**
- [ ] Email reçu de "Clinique Chiropratique <noreply@janiechiro.com>"
- [ ] Subject: "✅ Votre rendez-vous est confirmé!"
- [ ] Checkmark géant vert
- [ ] Récapitulatif: Date, Heure, Durée, Adresse
- [ ] Notes de préparation (arrivez 10 min avant, etc.)

**Vérification Database:**
```sql
-- Via SQL Editor Supabase
SELECT * FROM appointments
WHERE name = 'Test Patient'
ORDER BY created_at DESC
LIMIT 1;
```
- [ ] Un rendez-vous existe avec status = 'confirmed'

**✅ Checkpoint:** Flux complet fonctionne end-to-end!

---

### Test 5: Vérifier les Logs

**Logs Supabase:**
1. - [ ] Dashboard Supabase > Edge Functions
2. - [ ] Cliquez sur **"process-cancellation"**
3. - [ ] Onglet **"Logs"**
4. - [ ] Vous devriez voir:
   - "📤 Calling Resend API"
   - "✅ Email sent successfully"
   - "Resend ID: [id]"

**Logs Resend:**
1. - [ ] Dashboard Resend > Emails
2. - [ ] Filtrez par "Last 24 hours"
3. - [ ] Vous devriez voir 3 emails:
   - Email test
   - Email invitation
   - Email confirmation
4. - [ ] Tous avec status "Delivered" ✓

**✅ Checkpoint:** Tous les logs montrent succès

---

## Phase 5: Nettoyage Test (2 minutes)

### Supprimer les données de test

```sql
-- Via SQL Editor Supabase

-- Supprimer le RDV de test
DELETE FROM appointments
WHERE name = 'Test Patient';

-- Supprimer la personne waitlist de test (optionnel)
DELETE FROM waitlist
WHERE email = 'votre@email.com';

-- Vérifier que tout est clean
SELECT COUNT(*) FROM appointments WHERE name LIKE '%Test%';
SELECT COUNT(*) FROM waitlist WHERE name LIKE '%Test%';
```

- [ ] Données de test supprimées
- [ ] Counts retournent 0

**✅ Checkpoint:** Environment propre

---

## 🎉 Félicitations! Déploiement Complet

Vous avez maintenant un système de liste d'attente intelligente **100% opérationnel** en production!

### Ce qui fonctionne:

✅ Détection automatique des annulations
✅ Sélection intelligente des candidats (scoring)
✅ Envoi automatique d'invitations (jusqu'à 5 simultanées)
✅ Page web pour Accept/Decline
✅ Emails de confirmation automatiques
✅ Expiration automatique (24h)
✅ Sécurité robuste (tokens, RLS, validation)
✅ Monitoring complet (logs, analytics)

---

## Prochaines Actions Recommandées

### Immédiat (Aujourd'hui)

- [ ] Ajoutez vos vrais patients dans la waitlist
- [ ] Testez avec une vraie annulation
- [ ] Surveillez les premières invitations

### Cette Semaine

- [ ] Configurez webhooks Resend pour tracking opens/clicks
- [ ] Créez un dashboard analytics (requêtes SQL fournies)
- [ ] Ajustez le scoring si besoin
- [ ] Formez votre équipe

### Ce Mois

- [ ] Analysez les métriques (taux conversion, temps réponse)
- [ ] Optimisez les templates email (A/B testing)
- [ ] Considérez SMS backup via Twilio
- [ ] Documentez vos processus internes

---

## Support et Ressources

### Documentation

- **RESEND_SETUP_GUIDE.md** - Guide de configuration détaillé
- **RESEND_INTEGRATION_REPORT.md** - Rapport technique complet
- **IMPLEMENTATION_COMPLETE.md** - Vue d'ensemble

### Support

- **Resend:** support@resend.com ou [resend.com/docs](https://resend.com/docs)
- **Supabase:** support@supabase.com ou [supabase.com/docs](https://supabase.com/docs)

### Outils Utiles

- **Test DNS:** [mxtoolbox.com](https://mxtoolbox.com/SuperTool.aspx)
- **Test Spam:** [mail-tester.com](https://www.mail-tester.com/)
- **Resend Status:** [status.resend.com](https://status.resend.com/)

---

## Récapitulatif Final

```
✅ Phase 1: Resend configuré (domaine vérifié, API key générée)
✅ Phase 2: Supabase secrets configurés (3/3)
✅ Phase 3: Edge Functions déployées (4/4)
✅ Phase 4: Tests réussis (5/5)
✅ Phase 5: Nettoyage effectué

Status: 🎉 PRODUCTION READY
Temps total: ~30 minutes
Prochaine étape: Utilisez en production!
```

---

**Checklist complétée le:** ___________________
**Par:** ___________________
**Temps réel:** ___________ minutes
**Status:** ✅ Succès
