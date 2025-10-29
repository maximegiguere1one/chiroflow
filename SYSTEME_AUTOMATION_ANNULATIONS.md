# 🚀 Système d'Automatisation des Annulations - 100% Automatique

## 📋 Vue d'ensemble

Le système envoie **automatiquement** des emails aux patients sur la waitlist quand un rendez-vous est annulé.

## ⚡ Comment ça fonctionne

### 1️⃣ **Détection automatique**
```
Rendez-vous annulé (status = 'cancelled')
          ↓
    Trigger PostgreSQL
          ↓
  Crée un slot_offer
          ↓
  Appelle Edge Function
          ↓
 Envoie 5 emails max
```

### 2️⃣ **Workflow complet**

1. **Admin/Patient annule un RDV** → Le status passe à `cancelled`

2. **Trigger PostgreSQL se déclenche automatiquement**:
   - Crée un `appointment_slot_offer`
   - Log l'événement dans `waitlist_trigger_logs`
   - Appelle la fonction Edge `process-cancellation` via `pg_net`

3. **Edge Function `process-cancellation`**:
   - Trouve les 5 meilleurs candidats sur la waitlist
   - Génère des tokens uniques sécurisés
   - Crée des invitations dans `slot_offer_invitations`
   - Envoie des emails via Resend

4. **Patient reçoit l'email** avec:
   - Date et heure du créneau libéré
   - Bouton ✅ "Je prends ce rendez-vous!"
   - Bouton ❌ "Non merci"
   - Expiration: 24 heures

5. **Premier arrivé, premier servi**:
   - Le premier qui clique "Accepter" obtient le créneau
   - Les autres reçoivent une notification "Déjà pris"
   - Le créneau est automatiquement marqué `claimed`

## 🗄️ Tables de la base de données

### `appointment_slot_offers`
Créneaux libérés suite à des annulations
```sql
- id: uuid
- cancelled_appointment_id: uuid (lien vers appointment)
- slot_date: date
- slot_time: time
- slot_datetime: timestamptz
- duration_minutes: integer
- status: 'available' | 'pending' | 'claimed' | 'expired'
- invitation_count: integer (combien d'emails envoyés)
- claimed_by: uuid (qui a pris le créneau)
```

### `slot_offer_invitations`
Invitations individuelles envoyées
```sql
- id: uuid
- slot_offer_id: uuid
- waitlist_entry_id: uuid
- response_token: text (token sécurisé unique)
- status: 'pending' | 'accepted' | 'declined' | 'expired'
- sent_at: timestamptz
- expires_at: timestamptz (24h après envoi)
```

### `waitlist_notifications`
Historique de tous les emails envoyés
```sql
- id: uuid
- waitlist_entry_id: uuid
- invitation_id: uuid
- notification_type: text
- channel: 'email' | 'sms'
- sent_at: timestamptz
- metadata: jsonb (resend_id, etc)
```

### `waitlist_trigger_logs`
Logs de tous les triggers et erreurs
```sql
- id: uuid
- trigger_name: text
- appointment_id: uuid
- event_type: text
- status: 'pending' | 'success' | 'error'
- error_message: text
```

## 🔧 Configuration requise

### Variables d'environnement Supabase

Ces secrets doivent être configurés dans **Supabase Dashboard → Project Settings → Edge Functions**:

```bash
RESEND_API_KEY=re_xxxxxxxxxx
RESEND_DOMAIN=janiechiro.com
APP_DOMAIN=janiechiro.com
```

### Comment ajouter les secrets:
1. Va sur https://supabase.com/dashboard
2. Sélectionne ton projet
3. Project Settings → Edge Functions
4. Clique "Add Secret"
5. Ajoute chaque secret

## 📧 Template d'email

L'email envoyé contient:

### Sujet
```
🎯 Un créneau vient de se libérer pour vous!
```

### Contenu
```
Bonjour [Nom du patient],

Un client vient d'annuler son rendez-vous et nous avons pensé à vous!

📅 [Date complète]
🕐 [Heure]
⏱ Durée: 30 minutes

⏰ Cette invitation expire dans 24 heures
Premier arrivé, premier servi!

[✅ Oui, je prends ce rendez-vous!]  ← Bouton vert
[Non merci, je ne peux pas]          ← Bouton gris
```

## 🎯 Sélection des candidats

### Critères de priorisation:
1. **Date d'inscription** - Plus vieux = priorité
2. **Préférences de jours** - Match avec le jour du créneau
3. **Préférences d'horaire** - Match avec l'heure
4. **Nombre d'invitations reçues** - Moins = priorité
5. **Consentement** - A accepté les notifications auto

### Algorithme:
```sql
get_eligible_waitlist_candidates(
  p_slot_datetime,
  p_slot_day_of_week,
  p_max_candidates: 5
)
```

## 🖥️ Interface de monitoring

### Dashboard: "📧 Automation Annulations"

**Statistiques en temps réel:**
- 🔴 Annulations totales
- 📧 Emails envoyés
- ✅ Créneaux réclamés
- 📊 Taux de succès (%)

**Activité récente:**
Table avec toutes les annulations et leur statut:
- Date/heure du rendez-vous
- Status du créneau (available/pending/claimed)
- Nombre d'invitations envoyées
- Nombre acceptées
- Dernière action du système
- Status (Succès/Erreur/En cours)

**Logs système:**
Liste des 10 derniers événements avec:
- ✅ Succès (vert)
- ❌ Erreur (rouge)
- ⏳ En cours (bleu)
- Messages d'erreur détaillés

## 🧪 Comment tester

### Test manuel:

1. **Crée un rendez-vous** dans le système
2. **Ajoute des patients à la waitlist**:
   ```sql
   INSERT INTO waitlist (
     email,
     name,
     phone,
     consent_automated_notifications
   ) VALUES (
     'test@example.com',
     'Test Patient',
     '514-555-1234',
     true
   );
   ```

3. **Annule le rendez-vous**:
   - Va dans "Rendez-vous"
   - Clique sur le RDV
   - Change le status à "Cancelled"
   - OU via SQL:
   ```sql
   UPDATE appointments
   SET status = 'cancelled'
   WHERE id = '[appointment_id]';
   ```

4. **Vérifie les logs**:
   - Va dans "📧 Automation Annulations"
   - Regarde les stats en temps réel
   - Vérifie que les emails sont envoyés

5. **Check la console Edge Function**:
   ```bash
   # Logs Supabase
   Dashboard → Edge Functions → process-cancellation → Logs
   ```

### Requêtes SQL utiles:

**Voir tous les slot offers:**
```sql
SELECT * FROM appointment_slot_offers
ORDER BY created_at DESC;
```

**Voir toutes les invitations:**
```sql
SELECT * FROM slot_offer_invitations
ORDER BY sent_at DESC;
```

**Voir les logs des triggers:**
```sql
SELECT * FROM waitlist_trigger_logs
ORDER BY created_at DESC;
```

**Voir la vue de monitoring:**
```sql
SELECT * FROM cancellation_automation_monitor;
```

**Obtenir les statistiques:**
```sql
SELECT get_cancellation_automation_stats();
```

## 🚨 Dépannage

### Problème: Emails non envoyés

**Vérifications:**
1. RESEND_API_KEY configuré?
   ```bash
   Dashboard → Settings → Edge Functions → Secrets
   ```

2. Domaine vérifié dans Resend?
   - Va sur resend.com/domains
   - Vérifie que ton domaine est "Verified"

3. Check les logs Edge Function:
   ```bash
   Dashboard → Edge Functions → process-cancellation → Logs
   ```

### Problème: Trigger ne se déclenche pas

**Vérifications:**
1. La migration est appliquée?
   ```sql
   SELECT * FROM waitlist_trigger_logs
   WHERE trigger_name = 'auto_process_cancelled_appointment';
   ```

2. Le trigger existe?
   ```sql
   SELECT * FROM pg_trigger
   WHERE tgname = 'trigger_auto_process_cancellation';
   ```

3. Extension pg_net activée?
   ```sql
   SELECT * FROM pg_extension WHERE extname = 'pg_net';
   ```

### Problème: Invitations expirées

**Solution:**
Les invitations expirent après 24h automatiquement. Pour modifier:
```sql
-- Dans la migration ou manuellement:
UPDATE slot_offer_invitations
SET expires_at = now() + interval '48 hours'
WHERE status = 'pending';
```

## 📊 Métriques de succès

### KPIs à surveiller:

1. **Taux de conversion**:
   ```
   (Créneaux réclamés / Annulations) × 100
   ```

2. **Taux de réponse**:
   ```
   (Invitations acceptées / Invitations envoyées) × 100
   ```

3. **Temps moyen de réclamation**:
   ```
   Moyenne(claimed_at - sent_at)
   ```

4. **Efficacité du matching**:
   ```
   (Acceptations au 1er email / Total acceptations) × 100
   ```

### Objectifs:
- ✅ Taux de conversion: > 50%
- ✅ Taux de réponse: > 30%
- ✅ Temps de réclamation: < 2 heures
- ✅ Efficacité matching: > 60%

## 🔐 Sécurité

### Mesures en place:

1. **Tokens sécurisés**:
   - UUID + hash du waitlist_id
   - Unique et non-devinable
   - Expire après 24h

2. **RLS activé** sur toutes les tables:
   ```sql
   ALTER TABLE appointment_slot_offers ENABLE ROW LEVEL SECURITY;
   ```

3. **Validation d'expiration**:
   - Vérification automatique avant acceptation
   - Impossible d'accepter un créneau expiré

4. **Rate limiting**:
   - Max 5 invitations par slot
   - Cooldown entre invitations

5. **Logs complets**:
   - Audit trail de toutes les actions
   - Conformité RGPD

## 🎓 Points importants

### ✅ À FAIRE:
- Surveiller le dashboard régulièrement
- Vérifier que RESEND_API_KEY est configuré
- Tester avec de vrais emails avant production
- Avoir au moins 5 patients sur la waitlist

### ❌ À NE PAS FAIRE:
- Ne pas désactiver RLS
- Ne pas modifier les tokens manuellement
- Ne pas spam les patients (max 1 email/24h)
- Ne pas oublier d'expirer les invitations

## 📚 Ressources

### Fichiers clés:

**Migration:**
```
/supabase/migrations/20251019040000_auto_trigger_cancellation_emails.sql
```

**Edge Function:**
```
/supabase/functions/process-cancellation/index.ts
```

**Interface:**
```
/src/components/dashboard/CancellationAutomationMonitor.tsx
```

### Documentation:
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Resend API](https://resend.com/docs)
- [PostgreSQL Triggers](https://www.postgresql.org/docs/current/triggers.html)

## 🎉 Résumé

Le système est **100% automatique**:
1. ✅ Détection des annulations automatique
2. ✅ Création des slot offers automatique
3. ✅ Envoi des emails automatique
4. ✅ Gestion des réponses automatique
5. ✅ Mise à jour des statuts automatique

**Tu n'as rien à faire manuellement!** Juste surveiller le dashboard. 🚀
