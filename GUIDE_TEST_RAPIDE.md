# Guide de Test Rapide - Système Automatique

## TEST EN 5 MINUTES

Suivez ces étapes pour tester que tout fonctionne:

---

## ETAPE 1: Vérifier l'Installation (30 secondes)

Allez sur le SQL Editor de Supabase et exécutez:

```sql
-- Vérifier pg_net
SELECT extname, extversion FROM pg_extension WHERE extname = 'pg_net';

-- Vérifier la table de logs
SELECT COUNT(*) FROM waitlist_trigger_logs;

-- Vérifier les Edge Functions déployées
-- (Allez dans Edge Functions → devrait voir monitor-waitlist-system et process-cancellation)
```

**Résultat attendu:**
- pg_net version 0.19.5 (ou supérieure)
- La table waitlist_trigger_logs existe
- 2 fonctions déployées et ACTIVE

---

## ETAPE 2: Créer un Candidat sur la Liste d'Attente (1 minute)

```sql
-- Ajouter un patient à la liste d'attente
INSERT INTO waitlist (
  name,
  email,
  phone,
  reason,
  status,
  consent_automated_notifications
) VALUES (
  'Test Patient',
  'VOTRE_EMAIL@example.com',  -- REMPLACEZ par votre vrai email
  '555-1234',
  'Test automatisation',
  'active',
  true
);
```

**Important:** Utilisez VOTRE VRAI EMAIL pour recevoir le test!

---

## ETAPE 3: Créer un Rendez-vous à Annuler (1 minute)

```sql
-- Créer un rendez-vous demain à 10h
INSERT INTO appointments (
  name,
  email,
  phone,
  reason,
  scheduled_date,
  scheduled_time,
  duration_minutes,
  status
) VALUES (
  'Patient à Annuler',
  'cancel@example.com',
  '555-0000',
  'Test annulation',
  (CURRENT_DATE + INTERVAL '1 day')::text,
  '10:00',
  30,
  'confirmed'
)
RETURNING id;
```

**Notez l'ID retourné!**

---

## ETAPE 4: Annuler le Rendez-vous (10 secondes)

```sql
-- REMPLACEZ 'xxx' par l'ID de l'étape 3
UPDATE appointments
SET status = 'cancelled'
WHERE id = 'xxx';
```

---

## ETAPE 5: Vérifier que ça Fonctionne (2 minutes)

### A. Vérifier le Slot Offer Créé

```sql
SELECT * FROM appointment_slot_offers
ORDER BY created_at DESC
LIMIT 1;
```

**Résultat attendu:**
- Une ligne créée il y a quelques secondes
- status = 'available' ou 'pending'
- invitation_count devrait passer à > 0

### B. Vérifier les Logs du Trigger

```sql
SELECT * FROM waitlist_trigger_logs
ORDER BY created_at DESC
LIMIT 3;
```

**Résultat attendu:**
- Au moins 1 log avec trigger_type = 'trigger_db'
- status = 'success' (si tout va bien) ou 'error' (si problème)
- Regardez error_message si status = 'error'

### C. Vérifier les Invitations Créées

```sql
SELECT
  i.*,
  w.name as patient_name,
  w.email as patient_email
FROM slot_offer_invitations i
JOIN waitlist w ON w.id = i.waitlist_entry_id
ORDER BY i.sent_at DESC
LIMIT 3;
```

**Résultat attendu:**
- Au moins 1 invitation créée
- status = 'pending'
- response_token existe

### D. Vérifier les Notifications Envoyées

```sql
SELECT * FROM waitlist_notifications
ORDER BY sent_at DESC
LIMIT 3;
```

**Résultat attendu:**
- Au moins 1 notification avec notification_type = 'invitation'
- sent_at = maintenant
- metadata contient resend_id

### E. Vérifier votre Email

Ouvrez votre boîte email (celle que vous avez utilisée à l'étape 2).

**Résultat attendu:**
- Email reçu avec sujet "🎯 Un créneau vient de se libérer pour vous!"
- Email contient 2 boutons: "Oui, je prends" et "Non merci"
- Date et heure du créneau affichées

---

## ETAPE 6: Appeler le Monitor (30 secondes)

Depuis votre terminal ou Postman:

```bash
curl -X POST \
  https://tuwswtgpkgtckhmnjnru.supabase.co/functions/v1/monitor-waitlist-system \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json"
```

**Résultat attendu:**
```json
{
  "timestamp": "2025-10-17T...",
  "untreated_slots_found": 0,
  "slots_processed": 0,
  "errors_encountered": 0,
  "recent_errors_last_24h": 0,
  "stats_last_7_days": {
    "pending": 1,
    "available": 0
  }
}
```

---

## DIAGNOSTICS SI ÇA NE FONCTIONNE PAS

### Problème 1: Pas de Slot Offer Créé

```sql
-- Vérifier que le trigger existe
SELECT tgname FROM pg_trigger WHERE tgname = 'trigger_appointment_cancellation';

-- Vérifier les logs d'erreur
SELECT * FROM waitlist_trigger_logs WHERE status = 'error';
```

**Solution:** Si le trigger n'existe pas, réappliquez la migration.

### Problème 2: Slot Créé mais invitation_count = 0

```sql
-- Vérifier les logs
SELECT * FROM waitlist_trigger_logs WHERE status = 'error';
```

**Solutions possibles:**
- process-cancellation n'a pas été appelé → vérifier pg_net
- Pas de candidats éligibles → vérifier la table waitlist
- Erreur d'appel HTTP → vérifier error_message dans les logs

### Problème 3: Invitations Créées mais Pas d'Email

```sql
-- Vérifier les notifications
SELECT * FROM waitlist_notifications;
```

**Solutions:**
- Si aucune notification → RESEND_API_KEY manquant
- Si notification mais pas d'email reçu → domaine pas vérifié sur Resend
- Consultez les logs de process-cancellation dans Supabase Dashboard

### Problème 4: Erreur dans waitlist_trigger_logs

```sql
SELECT
  error_message,
  metadata,
  created_at
FROM waitlist_trigger_logs
WHERE status = 'error'
ORDER BY created_at DESC
LIMIT 1;
```

**Erreurs communes:**
- `could not find function net.http_post` → pg_net pas installé
- `permission denied` → problème de RLS ou permissions
- `connection refused` → URL de fonction incorrecte

---

## NETTOYAGE APRÈS TEST

```sql
-- Supprimer les données de test
DELETE FROM appointments WHERE email = 'cancel@example.com';
DELETE FROM waitlist WHERE email LIKE '%example.com%';
DELETE FROM appointment_slot_offers WHERE created_at > NOW() - INTERVAL '1 hour';
DELETE FROM waitlist_trigger_logs WHERE created_at > NOW() - INTERVAL '1 hour';
```

---

## RÉSUMÉ - QUE VÉRIFIER

✅ pg_net installé
✅ waitlist_trigger_logs existe
✅ Edge Functions déployées (monitor + process-cancellation)
✅ Slot offer créé automatiquement après annulation
✅ Logs créés dans waitlist_trigger_logs
✅ Invitations créées dans slot_offer_invitations
✅ Emails envoyés (vérifier votre boîte)
✅ Monitor fonctionne sans erreur

**Si tous les ✅ sont cochés, votre système est 100% opérationnel!**

---

## PROCHAINE ETAPE

Maintenant que vous avez confirmé que tout fonctionne, vous pouvez:

1. Ajouter de vrais patients à la liste d'attente
2. Configurer un cron job pour monitor-waitlist-system
3. Tester avec de vraies annulations
4. Surveiller les logs pendant quelques jours

Consultez `SYSTEME_AUTOMATIQUE_100_COMPLET.md` pour plus de détails!
