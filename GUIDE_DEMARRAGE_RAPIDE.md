# ⚡ Guide de Démarrage Rapide - Nouvelles Fonctionnalités

## 🎯 En 5 Minutes, Votre Système Est Opérationnel

---

## Étape 1: Vérifiez que tout fonctionne (2 min)

### Testez la page de réservation
```
1. Allez sur: votresite.com/booking
2. Vous devriez voir: "Réservation en ligne" avec calendrier
3. ✅ Si ça fonctionne → Passez à l'étape 2
4. ❌ Si erreur → Consultez DIAGNOSTIC_COMPLET.md
```

### Testez les rappels automatiques
```sql
-- Dans Supabase SQL Editor:
SELECT COUNT(*) FROM appointment_reminders;

-- Devrait retourner un nombre ≥ 0
-- Si erreur "table does not exist" → Migration non appliquée
```

---

## Étape 2: Configuration Email (3 min)

### Option A: Vous avez déjà Resend configuré ✅
```
Rien à faire! Le système utilise votre config existante.
```

### Option B: Première configuration Resend
```
1. Allez sur: https://resend.com/api-keys
2. Créez une clé API
3. Dans Supabase Dashboard:
   - Settings → Edge Functions → Add Secret
   - Name: RESEND_API_KEY
   - Value: [Collez votre clé]
   - Save
```

---

## Étape 3: Premier Test Complet (5 min)

### Test #1: Créer un RDV avec rappels automatiques

```
1. Allez sur /booking
2. Choisissez un service
3. Sélectionnez une date dans 3 jours
4. Choisissez une heure
5. Remplissez: Jean Test / jean.test@votreemail.com / 514-555-1234
6. Cliquez "Réserver"
```

**Vérification:**
```sql
-- Dans Supabase SQL Editor:
SELECT
  a.name as patient,
  a.scheduled_date,
  a.confirmation_token,
  COUNT(ar.id) as rappels_crees
FROM appointments a
LEFT JOIN appointment_reminders ar ON ar.appointment_id = a.id
WHERE a.email = 'jean.test@votreemail.com'
GROUP BY a.id, a.name, a.scheduled_date, a.confirmation_token;

-- Devrait montrer 2 rappels créés
```

### Test #2: Page de gestion du RDV

```
1. Copiez le `confirmation_token` de la requête ci-dessus
2. Allez sur: votresite.com/appointment/manage/{TOKEN}
3. Vous devriez voir la page avec 3 boutons:
   ✅ Confirmer ma présence
   📅 Reprogrammer mon RDV
   ❌ Annuler mon RDV
```

### Test #3: Confirmation de présence

```
1. Sur la page de gestion, cliquez "Confirmer ma présence"
2. Message de succès devrait apparaître
3. Vérification:
```

```sql
SELECT
  name,
  presence_confirmed,
  presence_confirmed_at
FROM appointments
WHERE email = 'jean.test@votreemail.com';

-- presence_confirmed devrait être TRUE
```

### Test #4: Liste d'attente (optionnel)

```
1. Dashboard Admin → Gestion → Liste d'attente
2. Ajoutez 2-3 patients de test
3. Créez un RDV pour demain
4. Annulez-le immédiatement
5. Dans 10-30 secondes: Les patients en liste reçoivent un email!
```

**Vérification:**
```sql
SELECT
  w.name,
  w.email,
  COUNT(i.id) as invitations_recues
FROM waitlist w
LEFT JOIN slot_offer_invitations i ON i.waitlist_entry_id = w.id
GROUP BY w.id, w.name, w.email;

-- Devrait montrer les invitations envoyées
```

---

## Étape 4: Activer l'envoi automatique des rappels (1 min)

### Option A: Cron Job (Recommandé)

Dans Supabase Dashboard:
```
1. Database → Cron Jobs (Extension pg_cron)
2. Activez l'extension si pas déjà fait
3. Créez un job:
```

```sql
-- Exécuter toutes les 15 minutes
SELECT cron.schedule(
  'send-appointment-reminders',
  '*/15 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://[VOTRE-PROJET].supabase.co/functions/v1/send-appointment-reminders',
    headers := '{"Authorization": "Bearer [VOTRE-SERVICE-ROLE-KEY]", "Content-Type": "application/json"}'::jsonb
  );
  $$
);
```

### Option B: Service externe (Alternative)

Utilisez Zapier, Make.com, ou cron-job.org pour appeler:
```
POST https://[VOTRE-PROJET].supabase.co/functions/v1/send-appointment-reminders
Headers:
  Authorization: Bearer [VOTRE-SERVICE-ROLE-KEY]
  Content-Type: application/json

Fréquence: Toutes les 15 minutes
```

---

## Étape 5: Personnalisation (Optionnel, 10 min)

### Personnalisez les templates d'email

Modifiez:
```
supabase/functions/send-appointment-reminders/index.ts
```

Cherchez `htmlContent` et modifiez:
- Les couleurs (ex: `#667eea` → votre couleur)
- Le nom de votre clinique
- Les messages
- Les images de logo

Puis redéployez:
```bash
# Dans le terminal (pas nécessaire ici, déjà déployé)
# supabase functions deploy send-appointment-reminders
```

### Ajustez les délais de rappel

Modifiez dans la migration ou directement en SQL:
```sql
-- Changer 48h → 72h pour confirmation
-- Changer 24h → 12h pour rappel final

-- Exemple:
UPDATE appointment_reminders
SET scheduled_send_at = scheduled_date - interval '72 hours'
WHERE reminder_type = 'confirmation';
```

---

## ✅ Checklist Finale

Cochez ce qui est fait:

### Configuration de base
- [ ] Page /booking fonctionne
- [ ] Table appointment_reminders existe
- [ ] RESEND_API_KEY configuré
- [ ] Edge function send-appointment-reminders déployée

### Tests fonctionnels
- [ ] RDV créé avec rappels automatiques
- [ ] Page /appointment/manage/{token} accessible
- [ ] Confirmation de présence fonctionne
- [ ] Email de test reçu

### Automatisation
- [ ] Cron job configuré pour rappels automatiques
- [ ] Liste d'attente testée (optionnel)
- [ ] Notifications instantanées fonctionnent

### Personnalisation (optionnel)
- [ ] Templates d'email personnalisés
- [ ] Délais ajustés selon vos besoins
- [ ] Logo ajouté dans les emails

---

## 🚨 Dépannage Rapide

### "Les rappels ne sont pas créés"
```sql
-- Vérifiez que le trigger existe:
SELECT tgname FROM pg_trigger WHERE tgname = 'create_reminders_on_appointment';

-- Si absent, relancez la migration:
-- 20251018201600_enhance_reminders_with_confirmation.sql
```

### "Les emails ne partent pas"
```
1. Vérifiez RESEND_API_KEY dans Edge Functions secrets
2. Testez manuellement:
   POST /functions/v1/send-appointment-reminders
3. Consultez les logs dans Supabase Dashboard
```

### "Token invalide" sur page de gestion
```sql
-- Vérifiez que le token existe et n'est pas expiré:
SELECT
  name,
  confirmation_token,
  scheduled_date,
  status
FROM appointments
WHERE confirmation_token = 'VOTRE-TOKEN';

-- Le token doit exister et le RDV doit être futur
```

### "La liste d'attente ne notifie pas"
```
1. Vérifiez que waitlist-listener est déployée
2. Vérifiez qu'il y a des patients en liste d'attente
3. Testez manuellement:
   POST /functions/v1/process-cancellation
   Body: {"slot_offer_id": "...", "slot_datetime": "..."}
```

---

## 📞 Besoin d'Aide?

**Documentation complète:**
- `NOUVELLES_FONCTIONNALITES.md` - Vue d'ensemble détaillée
- `GUIDE_TROUBLESHOOTING_EMAILS.md` - Problèmes d'emails
- `DIAGNOSTIC_COMPLET.md` - Diagnostic système

**Logs à consulter:**
1. Supabase Dashboard → Edge Functions → Logs
2. Supabase Dashboard → Database → Logs
3. Browser Console (F12) pour erreurs frontend

---

## 🎉 C'est Parti!

Votre système est maintenant **10x plus intelligent**!

**Ce qui fonctionne automatiquement:**
- ✅ Rappels 48h et 24h avant chaque RDV
- ✅ Confirmation de présence en 1 clic
- ✅ Annulation/reprogrammation self-service
- ✅ Notifications instantanées liste d'attente

**Profitez de votre temps retrouvé!** ⏰💰😊
