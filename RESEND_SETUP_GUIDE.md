# Guide de Configuration Resend pour janiechiro.com

## Vue d'ensemble

Ce guide détaille la configuration complète de l'API Resend pour le système de liste d'attente intelligente ChiroFlow AI.

---

## Étape 1: Créer un compte Resend

1. Allez sur [resend.com](https://resend.com)
2. Cliquez sur "Sign Up"
3. Créez votre compte avec votre email professionnel
4. Confirmez votre email

---

## Étape 2: Ajouter et vérifier votre domaine

### A. Ajouter le domaine

1. Dans le dashboard Resend, allez dans **Domains**
2. Cliquez sur **Add Domain**
3. Entrez: `janiechiro.com`
4. Cliquez sur **Add**

### B. Configurer les DNS Records

Resend va vous fournir 3 enregistrements DNS à configurer:

#### 1. SPF Record (TXT)
```
Type: TXT
Name: @
Value: v=spf1 include:_spf.resend.com ~all
TTL: 3600
```

#### 2. DKIM Record (TXT)
```
Type: TXT
Name: resend._domainkey
Value: [fourni par Resend - valeur unique]
TTL: 3600
```

#### 3. DMARC Record (TXT)
```
Type: TXT
Name: _dmarc
Value: v=DMARC1; p=none; rua=mailto:admin@janiechiro.com
TTL: 3600
```

### C. Ajouter les records dans votre registrar DNS

**Si votre domaine est chez:**

**GoDaddy:**
1. Allez dans My Products > DNS
2. Cliquez sur "Add" pour chaque record
3. Collez les valeurs exactement comme fournies

**Namecheap:**
1. Domain List > Manage > Advanced DNS
2. Add New Record
3. Collez les valeurs

**Cloudflare:**
1. DNS > Add record
2. Collez les valeurs
3. **Important:** Désactivez le proxy (cliquez sur le nuage orange pour qu'il devienne gris)

### D. Vérifier le domaine

1. Retournez dans Resend > Domains
2. Attendez 5-10 minutes pour la propagation DNS
3. Cliquez sur **Verify Domain**
4. Le statut doit passer à **Verified** ✅

---

## Étape 3: Obtenir votre API Key

1. Dans Resend, allez dans **API Keys**
2. Cliquez sur **Create API Key**
3. Nom: `ChiroFlow Production`
4. Permission: **Sending access**
5. Cliquez sur **Add**
6. **IMPORTANT:** Copiez immédiatement la clé (elle commence par `re_`)
   - Exemple: `re_123abc456def789ghi012jkl345mno678`
7. Sauvegardez-la en sécurité (vous ne pourrez plus la voir après)

---

## Étape 4: Configurer les variables d'environnement Supabase

### Via Supabase Dashboard (Recommandé)

1. Allez sur [supabase.com/dashboard](https://supabase.com/dashboard)
2. Sélectionnez votre projet: `tuwswtgpkgtckhmnjnru`
3. Allez dans **Project Settings** > **Edge Functions**
4. Section **Secrets**, cliquez sur **Add new secret**

Ajoutez ces 3 secrets:

**Secret 1:**
```
Name: RESEND_API_KEY
Value: re_votre_cle_api_ici
```

**Secret 2:**
```
Name: RESEND_DOMAIN
Value: janiechiro.com
```

**Secret 3:**
```
Name: APP_DOMAIN
Value: janiechiro.com
```

5. Cliquez sur **Save** pour chaque secret

### Via Supabase CLI (Alternative)

```bash
supabase secrets set RESEND_API_KEY=re_votre_cle_api_ici
supabase secrets set RESEND_DOMAIN=janiechiro.com
supabase secrets set APP_DOMAIN=janiechiro.com
```

---

## Étape 5: Configurer l'adresse email "From"

Dans Resend, vous pouvez utiliser:

**Option A: noreply@janiechiro.com** (par défaut dans le code)
- Aucune configuration supplémentaire requise
- Fonctionne automatiquement une fois le domaine vérifié

**Option B: rdv@janiechiro.com** (recommandé)
- Plus professionnel
- Permet aux patients de répondre
- Pour utiliser, modifiez dans les Edge Functions:
  ```typescript
  from: "Clinique Chiropratique <rdv@janiechiro.com>"
  ```

**Option C: notification@janiechiro.com**
- Bon compromis entre les deux

---

## Étape 6: Tester l'envoi d'emails

### Test manuel via Dashboard Resend

1. Dans Resend > **Emails** > **Send Test Email**
2. From: `noreply@janiechiro.com`
3. To: votre email personnel
4. Subject: `Test ChiroFlow`
5. Body: `Ceci est un test`
6. Cliquez sur **Send**
7. Vérifiez la réception dans votre boîte mail

### Test via Edge Function

Utilisez le bouton "🧪 Tester annulation" dans le WaitlistDashboard:

1. Connectez-vous au dashboard admin
2. Allez dans la section Waitlist
3. Cliquez sur "🧪 Tester annulation"
4. Vérifiez:
   - Console Supabase Edge Functions logs
   - Dashboard Resend > Emails (nouvel email envoyé)
   - Votre boîte email (si vous êtes dans la waitlist)

---

## Étape 7: Déployer les Edge Functions

### Déployer process-cancellation
```bash
supabase functions deploy process-cancellation
```

### Déployer handle-invitation-response
```bash
supabase functions deploy handle-invitation-response
```

### Déployer waitlist-listener (nouveau)
```bash
supabase functions deploy waitlist-listener
```

---

## Étape 8: Activer le Realtime Listener

**Option A: Via Dashboard Supabase**
1. Database > Extensions
2. Vérifiez que `pg_net` est activé
3. Database > Functions
4. Vérifiez que `handle_appointment_cancellation` existe

**Option B: Scheduler/Cron Job**

Si Realtime ne fonctionne pas, créez un cron job:
```sql
-- Exécuter toutes les minutes
SELECT cron.schedule(
  'process-new-slot-offers',
  '* * * * *',
  $$
  SELECT net.http_post(
    url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/manual-process-slot',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb,
    body := '{"check_all": true}'::jsonb
  );
  $$
);
```

---

## Vérification finale - Checklist

### Configuration Resend ✅
- [ ] Compte Resend créé
- [ ] Domaine `janiechiro.com` ajouté
- [ ] Records DNS (SPF, DKIM, DMARC) configurés
- [ ] Domaine vérifié (status = Verified)
- [ ] API Key générée (commence par `re_`)
- [ ] Test email envoyé et reçu

### Configuration Supabase ✅
- [ ] Secret `RESEND_API_KEY` ajouté
- [ ] Secret `RESEND_DOMAIN=janiechiro.com` ajouté
- [ ] Secret `APP_DOMAIN` ajouté
- [ ] Edge Functions déployées
- [ ] Logs Edge Functions vérifiés (pas d'erreur)

### Tests Fonctionnels ✅
- [ ] Créer une personne dans waitlist
- [ ] Créer un rendez-vous
- [ ] Annuler le rendez-vous (status = cancelled)
- [ ] Vérifier création slot_offer dans DB
- [ ] Vérifier invitations envoyées
- [ ] Recevoir l'email d'invitation
- [ ] Cliquer sur "Accepter" dans l'email
- [ ] Voir page de confirmation
- [ ] Recevoir email de confirmation

---

## Monitoring et Maintenance

### Vérifier les emails envoyés

**Dashboard Resend:**
- Emails > Recent Deliveries
- Voir: Delivered, Opened, Clicked, Bounced

**Supabase:**
```sql
-- Voir toutes les notifications envoyées
SELECT * FROM waitlist_notifications
ORDER BY sent_at DESC
LIMIT 50;

-- Taux de succès
SELECT
  notification_type,
  COUNT(*) as total,
  SUM(CASE WHEN bounced THEN 1 ELSE 0 END) as bounced_count,
  ROUND(AVG(CASE WHEN opened_at IS NOT NULL THEN 1 ELSE 0 END) * 100, 2) as open_rate
FROM waitlist_notifications
GROUP BY notification_type;
```

### Logs et Debugging

**Supabase Edge Functions Logs:**
1. Dashboard > Edge Functions
2. Sélectionnez la fonction
3. Onglet **Logs**
4. Filtrez par erreur: `level:error`

**Resend Webhook (optionnel):**
Pour tracker opens/clicks automatiquement:
1. Resend > Webhooks
2. Add Webhook
3. URL: `https://YOUR_PROJECT_REF.supabase.co/functions/v1/resend-webhook`
4. Events: `email.delivered`, `email.opened`, `email.clicked`

---

## Troubleshooting

### "Domain not verified"
**Solution:**
- Vérifiez les DNS records dans votre registrar
- Attendez 10-30 minutes pour propagation
- Utilisez [mxtoolbox.com](https://mxtoolbox.com/SuperTool.aspx) pour vérifier

### "API Key invalid"
**Solution:**
- Regénérez une nouvelle clé dans Resend
- Mettez à jour le secret Supabase
- Redéployez les Edge Functions

### "Email not sent"
**Solution:**
1. Vérifiez les logs Supabase Edge Functions
2. Vérifiez que `RESEND_API_KEY` est défini
3. Testez avec curl:
```bash
curl -X POST 'https://api.resend.com/emails' \
  -H 'Authorization: Bearer re_votre_cle' \
  -H 'Content-Type: application/json' \
  -d '{
    "from": "noreply@janiechiro.com",
    "to": "votre@email.com",
    "subject": "Test",
    "html": "<p>Test email</p>"
  }'
```

### Emails vont en spam
**Solution:**
- Vérifiez SPF/DKIM/DMARC avec [mail-tester.com](https://www.mail-tester.com/)
- Ajoutez un footer "Unsubscribe" dans les templates
- Warmup: Envoyez progressivement (10, 50, 100, 500 emails/jour)

---

## Support et Ressources

**Documentation Resend:**
- [Resend Docs](https://resend.com/docs)
- [Domain Verification](https://resend.com/docs/dashboard/domains/introduction)
- [API Reference](https://resend.com/docs/api-reference/emails/send-email)

**Documentation Supabase:**
- [Edge Functions](https://supabase.com/docs/guides/functions)
- [Secrets Management](https://supabase.com/docs/guides/functions/secrets)
- [Realtime](https://supabase.com/docs/guides/realtime)

**Support:**
- Resend: support@resend.com
- Supabase: support@supabase.com

---

## Prochaines étapes recommandées

1. **Webhooks Resend** - Tracker automatiquement opens/clicks
2. **Templates avancés** - Designer dans Resend React Email
3. **A/B Testing** - Tester différents subject lines
4. **Analytics** - Dashboard des taux de conversion
5. **SMS Backup** - Via Twilio si email échoue

---

**Date de création:** 2025-10-17
**Dernière mise à jour:** 2025-10-17
**Version:** 1.0.0
