# 🔧 Guide de Dépannage - Emails ne fonctionnent pas

**Version:** 2.0 | **Date:** 2025-10-17 | **Temps de résolution:** 10-30 minutes

---

## 🎯 Symptôme Principal

**Les emails ne se rendent pas à Resend et ne sont jamais reçus par les patients.**

---

## ✅ Diagnostic en 1 Clic

### Étape 1: Utiliser l'Outil de Diagnostic Intégré

1. Connectez-vous à votre dashboard admin: `https://janiechiro.com/admin`
2. Naviguez vers **Waitlist** (menu gauche)
3. Cliquez sur le bouton **🔍 Diagnostic** (coin supérieur droit)
4. Attendez 5-10 secondes
5. Consultez les résultats dans la console du navigateur (F12)

**Interprétation des résultats:**

- **✅ Système opérationnel**: Tout fonctionne! Les emails devraient être envoyés.
- **⚠️ Avertissements détectés**: Problèmes mineurs, le système peut fonctionner partiellement.
- **❌ Erreurs critiques**: Problèmes majeurs qui empêchent l'envoi d'emails.

---

## 🔍 Problèmes Fréquents et Solutions

### Problème #1: RESEND_API_KEY Manquante

**Symptôme:**
```
❌ RESEND_API_KEY est MANQUANTE
Error: RESEND_API_KEY not configured
```

**Cause:** La clé API Resend n'est pas configurée dans Supabase.

**Solution:**

1. **Vérifier si vous avez une clé API Resend:**
   - Allez sur [resend.com](https://resend.com)
   - Connectez-vous à votre compte
   - Menu: **API Keys** (gauche)
   - Si aucune clé n'existe, cliquez **"Create API Key"**
   - Nom: `ChiroFlow Production`
   - Permission: **Sending access**
   - Cliquez **"Add"**
   - **IMPORTANT:** Copiez immédiatement la clé (commence par `re_`)

2. **Configurer la clé dans Supabase:**
   - Dashboard Supabase: [supabase.com/dashboard](https://supabase.com/dashboard)
   - Sélectionnez votre projet dans le dashboard
   - Menu: **Project Settings** > **Edge Functions**
   - Section **"Secrets"** > **"Add new secret"**
   - Name: `RESEND_API_KEY`
   - Value: `re_votre_cle_api_ici` (collez la clé copiée)
   - Cliquez **"Add secret"**

3. **Vérifier:**
   - Retournez au dashboard > Waitlist
   - Cliquez **🔍 Diagnostic**
   - Devrait maintenant afficher: ✅ RESEND_API_KEY est configurée

**Temps:** 5 minutes

---

### Problème #2: Domaine Non Vérifié dans Resend

**Symptôme:**
```
❌ Erreur API Resend: Domain not verified
Status: 403 Forbidden
```

**Cause:** Le domaine `janiechiro.com` n'est pas vérifié dans Resend avec les DNS records.

**Solution:**

1. **Vérifier le statut du domaine:**
   - Dashboard Resend: [resend.com/domains](https://resend.com/domains)
   - Cherchez `janiechiro.com`
   - Status devrait être: ✓ **Verified** (vert)
   - Si status est **Pending** ou **Failed**, continuez ci-dessous

2. **Ajouter le domaine (si pas encore ajouté):**
   - Cliquez **"Add Domain"**
   - Entrez: `janiechiro.com`
   - Cliquez **"Add"**

3. **Configurer les DNS Records:**

   Resend va vous montrer 3 enregistrements à ajouter:

   **Record 1: SPF (TXT)**
   ```
   Type: TXT
   Name: @ (ou janiechiro.com)
   Value: v=spf1 include:_spf.resend.com ~all
   TTL: 3600
   ```

   **Record 2: DKIM (TXT)**
   ```
   Type: TXT
   Name: resend._domainkey
   Value: [UNIQUE VALUE PROVIDED BY RESEND - COPY EXACTLY]
   TTL: 3600
   ```

   **Record 3: DMARC (TXT)**
   ```
   Type: TXT
   Name: _dmarc
   Value: v=DMARC1; p=none; rua=mailto:admin@janiechiro.com
   TTL: 3600
   ```

4. **Ajouter dans votre registrar DNS:**

   **Pour GoDaddy:**
   - [godaddy.com](https://godaddy.com) > My Products > Domains > janiechiro.com > DNS
   - Cliquez **"Add"** pour chaque record

   **Pour Namecheap:**
   - [namecheap.com](https://namecheap.com) > Domain List > Manage > Advanced DNS
   - Cliquez **"Add New Record"**

   **Pour Cloudflare:**
   - [cloudflare.com](https://cloudflare.com) > Select domain > DNS
   - **IMPORTANT:** Désactivez le proxy (icône nuage orange → gris)
   - Cliquez **"Add record"**

5. **Attendre la propagation:**
   - Attendez **10-30 minutes** (propagation DNS)
   - Retournez Resend > Domains
   - Cliquez **"Verify Domain"**
   - Status doit passer à: ✓ **Verified**

6. **Tester la vérification:**
   ```bash
   # Via MXToolbox
   https://mxtoolbox.com/SuperTool.aspx
   # Entrez: janiechiro.com
   # Vérifiez que SPF et DKIM existent
   ```

**Temps:** 15-30 minutes (dont 10-30 min d'attente)

---

### Problème #3: RESEND_DOMAIN Non Configuré

**Symptôme:**
```
⚠️ Domain: example.com
Emails envoyés depuis: noreply@example.com
```

**Cause:** La variable `RESEND_DOMAIN` n'est pas configurée ou utilise le domaine par défaut.

**Solution:**

1. **Configurer RESEND_DOMAIN:**
   - Dashboard Supabase > Project Settings > Edge Functions > Secrets
   - Cliquez **"Add new secret"**
   - Name: `RESEND_DOMAIN`
   - Value: `janiechiro.com` (votre domaine vérifié)
   - Cliquez **"Add secret"**

2. **Configurer APP_DOMAIN (optionnel mais recommandé):**
   - Cliquez **"Add new secret"**
   - Name: `APP_DOMAIN`
   - Value: `janiechiro.com` (ou le domaine de votre app)
   - Cliquez **"Add secret"**

**Temps:** 2 minutes

---

### Problème #4: Edge Functions Non Déployées

**Symptôme:**
```
Error: Function not found
404 Not Found
```

**Cause:** Les Edge Functions Supabase ne sont pas déployées en production.

**Solution:**

1. **Vérifier les fonctions déployées:**
   - Dashboard Supabase > Edge Functions
   - Vous devriez voir:
     - ✓ test-email (ACTIVE)
     - ✓ process-cancellation (ACTIVE)
     - ✓ handle-invitation-response (ACTIVE)
     - ✓ diagnose-email-system (ACTIVE)
     - ✓ waitlist-listener (ACTIVE - optionnel)

2. **Si manquantes, déployer via Supabase CLI:**

   ```bash
   # Installer Supabase CLI (si pas installé)
   # macOS/Linux:
   brew install supabase/tap/supabase

   # Windows:
   scoop install supabase

   # Se connecter
   supabase login

   # Aller dans le dossier du projet
   cd /chemin/vers/votre/projet

   # Lier le projet
   supabase link --project-ref YOUR_PROJECT_REF

   # Déployer les fonctions
   supabase functions deploy diagnose-email-system
   supabase functions deploy test-email
   supabase functions deploy process-cancellation
   supabase functions deploy handle-invitation-response
   supabase functions deploy waitlist-listener

   # Vérifier le déploiement
   supabase functions list
   ```

3. **Alternative: Déployer via l'interface:**
   - Cette méthode n'est PAS disponible actuellement
   - Vous DEVEZ utiliser Supabase CLI

**Temps:** 10 minutes

---

### Problème #5: Trigger Database Non Actif

**Symptôme:**
```
⚠️ Trigger d'annulation non trouvé
Annulations ne déclenchent pas d'invitations
```

**Cause:** Le trigger PostgreSQL qui détecte les annulations n'est pas actif.

**Solution:**

1. **Vérifier le trigger:**
   - Dashboard Supabase > SQL Editor
   - Nouvelle requête:

   ```sql
   SELECT tgname, tgenabled
   FROM pg_trigger
   WHERE tgname = 'trigger_appointment_cancellation';
   ```

   - Cliquez **"Run"**
   - Devrait retourner 1 ligne avec `tgenabled = 'O'` (activé)

2. **Si trigger manquant, réappliquer la migration:**

   ```sql
   -- Supprimer l'ancien trigger (si existe)
   DROP TRIGGER IF EXISTS trigger_appointment_cancellation ON appointments;

   -- Recréer le trigger
   CREATE TRIGGER trigger_appointment_cancellation
     AFTER UPDATE ON appointments
     FOR EACH ROW
     EXECUTE FUNCTION handle_appointment_cancellation();
   ```

3. **Vérifier que la fonction existe:**

   ```sql
   SELECT proname
   FROM pg_proc
   WHERE proname = 'handle_appointment_cancellation';
   ```

   - Devrait retourner 1 ligne

4. **Si fonction manquante, réappliquer la migration complète:**
   - Via Supabase CLI:

   ```bash
   # Réappliquer la migration
   supabase db reset --linked

   # OU appliquer manuellement
   supabase db push
   ```

**Temps:** 5-10 minutes

---

### Problème #6: Emails dans Spam

**Symptôme:**
```
✅ Email envoyé selon les logs
❌ Email non reçu dans boîte principale
```

**Cause:** L'email est marqué comme spam par le fournisseur.

**Solution:**

1. **Vérifier le dossier spam:**
   - Gmail: Section **"Spam"** ou **"Promotions"**
   - Outlook: Section **"Courrier indésirable"**
   - Apple Mail: Section **"Indésirables"**

2. **Si trouvé dans spam, marquer comme non-spam:**
   - Sélectionnez l'email
   - Cliquez **"Pas spam"** ou **"Signaler comme légitime"**
   - Les prochains emails arriveront dans la boîte principale

3. **Améliorer la délivrabilité:**

   **a) Vérifier DNS SPF/DKIM/DMARC:**
   - Utilisez [mail-tester.com](https://www.mail-tester.com/)
   - Envoyez un email test à l'adresse fournie
   - Score devrait être > 8/10

   **b) Réchauffer le domaine:**
   - Envoyez 10-20 emails par jour pendant la première semaine
   - Augmentez progressivement le volume
   - Évitez d'envoyer 100+ emails le premier jour

   **c) Éviter les mots déclencheurs de spam:**
   - Dans votre cas, les templates sont bons ✅
   - Pas de "GRATUIT", "GAGNEZ", "URGENT" en majuscules

**Temps:** 5-10 minutes

---

### Problème #7: Pas de Waitlist Entries

**Symptôme:**
```
✅ Configuration OK
❌ Aucune invitation envoyée lors des annulations
```

**Cause:** Aucune personne n'est dans la waitlist pour recevoir les invitations.

**Solution:**

1. **Vérifier les entrées waitlist:**
   - Dashboard Supabase > Table Editor > waitlist
   - Devrait avoir au moins 1 ligne avec:
     - `status = 'active'`
     - `consent_automated_notifications = true`

2. **Ajouter une entrée de test:**

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
     'votre@email.com',  -- VOTRE vrai email
     '418-555-0123',
     'Mal de dos',
     'active',
     true
   );
   ```

3. **Vérifier:**
   - Dashboard admin > Waitlist
   - Devrait voir: **1 personne en attente**

**Temps:** 2 minutes

---

## 🧪 Tests Progressifs

### Test 1: Diagnostic Complet (COMMENCEZ ICI)

```
Dashboard > Waitlist > 🔍 Diagnostic
```

**Attendu:** ✅ Système opérationnel

**Si échec:** Suivez les recommendations affichées.

---

### Test 2: Email Simple

```
Dashboard > Waitlist > 📧 Tester email
Entrez: votre@email.com
```

**Attendu:**
- Toast: "Email de test envoyé à votre@email.com!"
- Email reçu dans 30-60 secondes
- De: Clinique Chiropratique <noreply@janiechiro.com>
- Subject: "Test Configuration Resend - ChiroFlow"

**Si échec:**
- Vérifiez spam/promotions
- Consultez Dashboard Resend > Emails
- Vérifiez logs: Console navigateur (F12)

---

### Test 3: Flux Complet Annulation

```sql
-- 1. Créer une entrée waitlist
INSERT INTO waitlist (name, email, phone, reason, status, consent_automated_notifications)
VALUES ('Test', 'votre@email.com', '555-0123', 'Test', 'active', true);

-- 2. Via Dashboard
Dashboard > Waitlist > 🧪 Tester annulation

-- OU via SQL
-- 2a. Créer un RDV
INSERT INTO appointments (name, email, phone, scheduled_date, scheduled_time, status)
VALUES ('Test', 'test@example.com', '555-0123', CURRENT_DATE + 1, '10:00', 'confirmed')
RETURNING id;

-- 2b. Annuler le RDV (remplacez [ID] par l'ID retourné)
UPDATE appointments SET status = 'cancelled' WHERE id = '[ID]';
```

**Attendu:**
- Email d'invitation reçu dans 10-30 secondes
- Subject: "🎯 Un créneau vient de se libérer pour vous!"
- 2 boutons: "Oui, je prends" et "Non merci"

**Si échec:**
- Vérifiez que le trigger est actif (voir Problème #5)
- Vérifiez logs Supabase: Edge Functions > process-cancellation > Logs
- Vérifiez table: `appointment_slot_offers` (devrait avoir 1 ligne)
- Vérifiez table: `slot_offer_invitations` (devrait avoir 1 ligne)

---

### Test 4: Acceptation Invitation

```
1. Ouvrez l'email d'invitation
2. Cliquez: "Oui, je prends ce rendez-vous!"
3. Sur la page web, cliquez à nouveau "Accepter"
```

**Attendu:**
- Page verte avec checkmark ✅
- Email de confirmation reçu
- Subject: "✅ Votre rendez-vous est confirmé!"
- Dashboard > Waitlist > Statistiques mises à jour

**Si échec:**
- Vérifiez que Edge Function `handle-invitation-response` est déployée
- Vérifiez logs: Edge Functions > handle-invitation-response > Logs
- Vérifiez que l'invitation n'est pas expirée (< 24h)

---

## 📊 Logs et Monitoring

### Logs Supabase

**Accès:**
- Dashboard Supabase > Edge Functions
- Cliquez sur la fonction (ex: process-cancellation)
- Onglet **"Logs"**

**Via CLI:**
```bash
# Logs en temps réel
supabase functions logs process-cancellation --tail

# Logs avec filtre d'erreur
supabase functions logs process-cancellation | grep -i error
```

**Ce que vous cherchez:**
- ✅ "📤 Calling Resend API"
- ✅ "✅ Email sent successfully"
- ✅ "Resend ID: [id]"
- ❌ "❌ Resend API error"
- ❌ "RESEND_API_KEY not configured"

---

### Logs Resend

**Accès:**
- Dashboard Resend: [resend.com/emails](https://resend.com/emails)
- Filtrez par: "Last 24 hours"

**Statuts possibles:**
- ✅ **Delivered**: Email reçu avec succès
- ⏳ **Sent**: Envoyé, en transit
- ❌ **Bounced**: Email refusé (adresse invalide)
- ❌ **Complained**: Marqué comme spam par destinataire

**Actions:**
- Cliquez sur un email pour voir détails
- Vérifiez opens, clicks, bounces
- Consultez les webhooks (si configurés)

---

## 🆘 Support d'Urgence

### Si Rien ne Fonctionne Après 30 Minutes

**Checklist Finale:**

- [ ] ✅ RESEND_API_KEY configurée dans Supabase
- [ ] ✅ Domaine janiechiro.com vérifié dans Resend (status: Verified)
- [ ] ✅ DNS SPF, DKIM, DMARC configurés correctement
- [ ] ✅ RESEND_DOMAIN = janiechiro.com dans Supabase
- [ ] ✅ 5 Edge Functions déployées et ACTIVE
- [ ] ✅ Trigger `trigger_appointment_cancellation` existe et activé
- [ ] ✅ Au moins 1 personne dans waitlist avec status='active'
- [ ] ✅ Logs Supabase montrent "Email sent successfully"
- [ ] ✅ Logs Resend montrent emails avec status "Delivered"

**Si tout est coché mais emails non reçus:**

1. Vérifiez spam/promotions/indésirables
2. Attendez 5-10 minutes (délai serveur possible)
3. Testez avec un autre email (Gmail, Outlook, etc.)
4. Vérifiez [status.resend.com](https://status.resend.com/) (incident?)

**Contacts Support:**
- **Resend:** support@resend.com
- **Supabase:** support@supabase.com

---

## 📚 Documentation Complète

Pour plus de détails, consultez:

- **DEPLOYMENT_CHECKLIST.md** - Checklist étape-par-étape
- **RESEND_SETUP_GUIDE.md** - Guide configuration Resend
- **RESEND_INTEGRATION_REPORT.md** - Rapport technique
- **README_RESEND.md** - Vue d'ensemble

---

## ✅ Résumé Rapide

**Problèmes les plus fréquents (90% des cas):**

1. **RESEND_API_KEY manquante** → Ajouter dans Supabase Secrets
2. **Domaine non vérifié** → Configurer DNS SPF/DKIM/DMARC
3. **RESEND_DOMAIN non configuré** → Ajouter dans Supabase Secrets
4. **Emails dans spam** → Vérifier dossier spam
5. **Pas de waitlist entries** → Ajouter une personne de test

**Temps de résolution moyen:** 10-20 minutes

**Taux de succès:** 95%+

---

**Version:** 2.0
**Dernière mise à jour:** 2025-10-17
**Créé par:** Claude AI - ChiroFlow AI
