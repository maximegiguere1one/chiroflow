# 🧪 Guide de Test - Système d'Automatisation des Annulations

## ✅ Corrections appliquées

Le composant est maintenant **robuste** et gère tous les cas d'erreur:
- ✅ Affiche un message clair si la migration n'est pas appliquée
- ✅ Gère les données null/undefined
- ✅ Valeurs par défaut pour toutes les stats
- ✅ Ne crashe plus sur `.length` undefined

## 🚀 Test en 5 minutes

### Étape 1: Applique la migration SQL

**Option A - Via Supabase Dashboard (Recommandé):**

1. Va sur https://supabase.com/dashboard
2. Sélectionne ton projet
3. Clique "SQL Editor" dans le menu
4. Copie le contenu de: `/supabase/migrations/20251019040000_auto_trigger_cancellation_emails.sql`
5. Colle dans l'éditeur SQL
6. Clique "Run"

**Option B - Via Supabase CLI:**

```bash
supabase db push
```

### Étape 2: Vérifie que la migration est appliquée

Dans le SQL Editor, exécute:

```sql
-- Vérifie que les tables existent
SELECT table_name FROM information_schema.tables
WHERE table_name IN (
  'appointment_slot_offers',
  'slot_offer_invitations',
  'waitlist_trigger_logs'
);

-- Vérifie que la fonction existe
SELECT routine_name FROM information_schema.routines
WHERE routine_name = 'get_cancellation_automation_stats';

-- Vérifie que le trigger existe
SELECT trigger_name FROM information_schema.triggers
WHERE trigger_name = 'trigger_auto_process_cancellation';
```

Tu devrais voir:
- ✅ 3 tables
- ✅ 1 fonction
- ✅ 1 trigger

### Étape 3: Ajoute des patients à la waitlist

```sql
-- Ajoute 5 patients test
INSERT INTO waitlist (
  email,
  name,
  phone,
  consent_automated_notifications,
  notification_preferences
) VALUES
  ('patient1@test.com', 'Test Patient 1', '514-555-0001', true, '{"email": true}'::jsonb),
  ('patient2@test.com', 'Test Patient 2', '514-555-0002', true, '{"email": true}'::jsonb),
  ('patient3@test.com', 'Test Patient 3', '514-555-0003', true, '{"email": true}'::jsonb),
  ('patient4@test.com', 'Test Patient 4', '514-555-0004', true, '{"email": true}'::jsonb),
  ('patient5@test.com', 'Test Patient 5', '514-555-0005', true, '{"email": true}'::jsonb);
```

### Étape 4: Crée un rendez-vous

Dans ton app ou via SQL:

```sql
-- Trouve un contact_id existant
SELECT id, first_name, last_name FROM contacts LIMIT 1;

-- Crée un rendez-vous (remplace [contact_id])
INSERT INTO appointments (
  contact_id,
  scheduled_time,
  duration_minutes,
  status,
  appointment_type
) VALUES (
  '[contact_id]',
  now() + interval '2 days',
  30,
  'scheduled',
  'Consultation'
) RETURNING id;
```

Note l'ID du rendez-vous créé.

### Étape 5: Annule le rendez-vous

```sql
-- Remplace [appointment_id] par l'ID de l'étape 4
UPDATE appointments
SET status = 'cancelled'
WHERE id = '[appointment_id]';
```

### Étape 6: Vérifie que le système fonctionne

**Dans l'app:**
1. Va dans le menu "📧 Automation Annulations"
2. Tu devrais voir:
   - 1 annulation totale
   - Un créneau dans "Activité récente"
   - Des logs dans "Logs Système"

**Via SQL:**

```sql
-- Vérifie le slot_offer créé
SELECT * FROM appointment_slot_offers
ORDER BY created_at DESC
LIMIT 1;

-- Vérifie les invitations créées
SELECT * FROM slot_offer_invitations
ORDER BY sent_at DESC
LIMIT 5;

-- Vérifie les logs
SELECT * FROM waitlist_trigger_logs
ORDER BY created_at DESC
LIMIT 1;

-- Vérifie les stats
SELECT get_cancellation_automation_stats();
```

### Étape 7: Vérifie les emails (avec Resend configuré)

Si tu as configuré RESEND_API_KEY:

1. Les 5 patients devraient recevoir un email
2. L'email contient:
   - Date/heure du créneau
   - Bouton "✅ Je prends ce rendez-vous"
   - Bouton "Non merci"
3. Premier qui clique accepte → Obtient le RDV

**Check les logs Edge Function:**
```
Supabase Dashboard → Edge Functions → process-cancellation → Logs
```

## 🔍 Dépannage

### Problème: "Migration requise" s'affiche

**Solution:**
- La migration n'est pas appliquée
- Retourne à l'Étape 1

### Problème: Stats à 0 partout

**Causes possibles:**
1. **Pas de rendez-vous annulé** → Annule un RDV
2. **Trigger non déclenché** → Vérifie:
   ```sql
   SELECT * FROM waitlist_trigger_logs;
   ```
3. **Pas de patients sur waitlist** → Ajoute des patients (Étape 3)

### Problème: Emails non envoyés

**Vérifications:**

1. **RESEND_API_KEY configuré?**
   ```
   Dashboard → Settings → Edge Functions → Secrets
   ```

2. **Domaine vérifié dans Resend?**
   - Va sur resend.com
   - Vérifie que ton domaine est "Verified"

3. **Check les logs:**
   ```
   Dashboard → Edge Functions → process-cancellation → Logs
   ```

### Problème: "fonction get_cancellation_automation_stats n'existe pas"

**Solution:**
La migration n'est pas complètement appliquée. Re-run la migration:

```sql
-- Copie TOUT le contenu de la migration et run
```

## 📊 Ce que tu dois voir

### Dashboard "📧 Automation Annulations"

**Cartes de stats:**
```
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│ 🔴 Annulations  │  │ 📧 Emails       │  │ ✅ Créneaux     │  │ 📊 Taux succès  │
│     1           │  │     5           │  │     0           │  │     0%          │
│ 0 dernières 24h │  │ 5 dernières 24h │  │ 0 dernières 24h │  │                 │
└─────────────────┘  └─────────────────┘  └─────────────────┘  └─────────────────┘
```

**Table "Activité Récente":**
| RDV | Status | Invitations | Acceptées | Dernière action | Status |
|-----|--------|-------------|-----------|-----------------|--------|
| Date | pending | 5 | 0 | Il y a 1 min | ✅ Succès |

**Logs Système:**
```
✅ appointment_cancelled
   Il y a 1 minute
```

## ✅ Test réussi si:

1. ✅ Le dashboard s'affiche sans erreur
2. ✅ Les stats montrent: 1 annulation, 5 emails
3. ✅ La table montre le créneau avec status "pending"
4. ✅ Les logs montrent "success"
5. ✅ Les 5 patients sont dans `slot_offer_invitations`
6. ✅ (Bonus) Les emails sont envoyés via Resend

## 🎯 Prochaines étapes

### Pour tester l'acceptation d'un créneau:

1. Récupère un `response_token`:
   ```sql
   SELECT response_token FROM slot_offer_invitations LIMIT 1;
   ```

2. Visite l'URL:
   ```
   https://[ton-domaine]/invitation/[response_token]?action=accept
   ```

3. Le créneau devrait passer à status "claimed"

### Pour tester en production:

1. Configure RESEND_API_KEY
2. Utilise de vrais emails
3. Annule un vrai RDV
4. Les patients reçoivent l'email
5. Le premier qui clique obtient le RDV

## 📝 Notes importantes

- Le système est 100% automatique après setup
- Max 5 invitations par créneau
- Expiration: 24 heures
- Premier arrivé, premier servi
- Logs complets pour audit

## 🆘 Besoin d'aide?

1. Check la console navigateur (F12)
2. Check les logs Edge Function
3. Check `waitlist_trigger_logs`
4. Vérifie que toutes les tables existent
5. Vérifie que le trigger existe

---

**Bon test! 🚀**
