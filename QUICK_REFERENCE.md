# 🚀 Quick Reference - Resend Integration

**Version:** 1.0.0 | **Date:** 2025-10-17 | **Status:** Production Ready ✅

---

## TL;DR - 30 Secondes

```bash
# 1. Configuration Resend (10 min)
→ resend.com → Add domain janiechiro.com → Configure DNS → Get API key

# 2. Secrets Supabase (2 min)
RESEND_API_KEY=re_xxx
RESEND_DOMAIN=janiechiro.com
APP_DOMAIN=janiechiro.com

# 3. Déployer (5 min)
supabase functions deploy test-email
supabase functions deploy process-cancellation
supabase functions deploy handle-invitation-response
supabase functions deploy waitlist-listener

# 4. Tester (5 min)
Dashboard → Waitlist → "📧 Tester email" → "🧪 Tester annulation"
```

---

## Variables d'Environnement Requises

```bash
# Supabase Dashboard > Project Settings > Edge Functions > Secrets
RESEND_API_KEY=re_votre_cle_resend
RESEND_DOMAIN=janiechiro.com
APP_DOMAIN=janiechiro.com
```

---

## DNS Records (GoDaddy/Namecheap/Cloudflare)

```dns
# SPF
Type: TXT
Name: @
Value: v=spf1 include:_spf.resend.com ~all

# DKIM (valeur fournie par Resend)
Type: TXT
Name: resend._domainkey
Value: [copier depuis Resend]

# DMARC
Type: TXT
Name: _dmarc
Value: v=DMARC1; p=none; rua=mailto:admin@janiechiro.com
```

---

## Commandes CLI Essentielles

```bash
# Login Supabase
supabase login

# Lier projet
supabase link --project-ref YOUR_PROJECT_REF

# Déployer toutes les fonctions
supabase functions deploy test-email
supabase functions deploy process-cancellation
supabase functions deploy handle-invitation-response
supabase functions deploy waitlist-listener

# Voir les logs
supabase functions logs process-cancellation --tail

# Lister les secrets
supabase secrets list

# Ajouter un secret
supabase secrets set RESEND_API_KEY=re_xxx
```

---

## Test Rapide

### Via Dashboard Admin

```
1. Login → /admin
2. Waitlist section
3. Cliquez "📧 Tester email"
4. Entrez votre email
5. Vérifiez réception
```

### Via SQL

```sql
-- Créer personne waitlist
INSERT INTO waitlist (name, email, phone, reason, status, consent_automated_notifications)
VALUES ('Test', 'vous@email.com', '555-0123', 'Test', 'active', true);

-- Simuler annulation
UPDATE appointments SET status = 'cancelled'
WHERE id = 'APPOINTMENT_ID';

-- Vérifier invitations créées
SELECT * FROM slot_offer_invitations ORDER BY sent_at DESC LIMIT 5;
```

---

## Endpoints Edge Functions

```
Test Email:
POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/test-email
Body: {"to":"email@example.com"}

Process Cancellation:
POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/process-cancellation
Body: {"slot_offer_id":"uuid","slot_datetime":"2025-10-18T10:00:00Z"}

Handle Response:
POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/handle-invitation-response
Body: {"token":"uuid-xxx","action":"accept"}
```

---

## Requêtes SQL Utiles

```sql
-- Statistiques globales
SELECT
  COUNT(*) FILTER (WHERE status = 'active') as active_waitlist,
  COUNT(*) FILTER (WHERE status = 'scheduled') as scheduled,
  COUNT(*) FILTER (WHERE status = 'contacted') as contacted
FROM waitlist;

-- Taux de conversion invitations
SELECT
  COUNT(*) as total_invitations,
  COUNT(*) FILTER (WHERE status = 'accepted') as accepted,
  COUNT(*) FILTER (WHERE status = 'declined') as declined,
  ROUND(
    COUNT(*) FILTER (WHERE status = 'accepted')::numeric /
    NULLIF(COUNT(*)::numeric, 0) * 100, 2
  ) as conversion_rate
FROM slot_offer_invitations
WHERE sent_at > now() - interval '30 days';

-- Dernières invitations
SELECT
  w.name,
  w.email,
  soi.status,
  soi.sent_at,
  soi.responded_at
FROM slot_offer_invitations soi
JOIN waitlist w ON w.id = soi.waitlist_entry_id
ORDER BY soi.sent_at DESC
LIMIT 10;

-- Performance emails
SELECT
  notification_type,
  COUNT(*) as sent,
  SUM(CASE WHEN bounced THEN 1 ELSE 0 END) as bounced,
  ROUND(AVG(CASE WHEN opened_at IS NOT NULL THEN 1 ELSE 0 END) * 100, 2) as open_rate
FROM waitlist_notifications
GROUP BY notification_type;

-- Nettoyer tests
DELETE FROM appointments WHERE name LIKE '%Test%';
DELETE FROM waitlist WHERE name LIKE '%Test%';
```

---

## Troubleshooting 1-Minute

### Email non reçu
```bash
# Vérifier logs
supabase functions logs process-cancellation | grep -i error

# Vérifier secrets
supabase secrets list | grep RESEND

# Test direct
curl -X POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/test-email \
  -H "Authorization: Bearer ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"to":"vous@email.com"}'
```

### Token invalide
```sql
-- Vérifier invitation
SELECT * FROM slot_offer_invitations WHERE response_token = 'TOKEN';

-- Vérifier expiration
SELECT expires_at, now(), expires_at < now() as expired
FROM slot_offer_invitations WHERE response_token = 'TOKEN';
```

### Trigger ne fonctionne pas
```sql
-- Vérifier trigger existe
SELECT tgname FROM pg_trigger WHERE tgname = 'trigger_appointment_cancellation';

-- Re-run si manquant
\i supabase/migrations/20251017145738_add_intelligent_waitlist_system.sql
```

---

## Dashboards et Monitoring

### Resend Dashboard
```
https://resend.com/emails
→ Voir: Delivered, Opened, Clicked, Bounced
```

### Supabase Dashboard
```
https://supabase.com/dashboard (select your project)

Table Explorer → waitlist_notifications
Edge Functions → Logs
SQL Editor → Analytics queries
```

---

## Configuration Emails

### Email From
```typescript
// Par défaut
from: "Clinique Chiropratique <noreply@janiechiro.com>"

// Personnalisé (modifier dans Edge Functions)
from: "Clinique Chiropratique <rdv@janiechiro.com>"
```

### Templates
```
Invitation: process-cancellation/index.ts (ligne 100-262)
Confirmation: handle-invitation-response/index.ts (ligne 228-305)
```

---

## Limites et Coûts

### Resend
```
Gratuit: 3,000 emails/mois → $0
Pro: 50,000 emails/mois → $20/mois
Business: 200,000 emails/mois → $85/mois
```

### Supabase
```
Edge Functions: 500K invocations/mois (inclus)
Database: Illimité (plan pro)
```

**Recommandation:** Plan gratuit Resend suffit pour démarrer

---

## Métriques Clés à Surveiller

```
✓ Taux de conversion invitations (objectif: >40%)
✓ Temps moyen de réponse (objectif: <4 heures)
✓ Taux d'expiration (objectif: <30%)
✓ Bounce rate emails (objectif: <2%)
✓ Créneaux récupérés (objectif: 80%+ des annulations)
```

---

## Flux Complet - Diagramme

```
Patient annule
    ↓
[Trigger DB] handle_appointment_cancellation
    ↓
INSERT appointment_slot_offers
    ↓
[Realtime] waitlist-listener détecte
    ↓
[Function] process-cancellation
    ↓
get_eligible_waitlist_candidates() → Top 5
    ↓
Génère tokens + Envoie emails (Resend API)
    ↓
Patient reçoit email avec boutons
    ↓
Patient clique "Accepter"
    ↓
[Page] /invitation/:token
    ↓
[Function] handle-invitation-response
    ↓
Crée RDV + Annule autres + Envoie confirmation
    ↓
✅ Done
```

---

## Support Ultra-Rapide

```
📚 Docs complètes: RESEND_SETUP_GUIDE.md
📋 Checklist: DEPLOYMENT_CHECKLIST.md
📊 Rapport: RESEND_INTEGRATION_REPORT.md
🎯 Vue d'ensemble: IMPLEMENTATION_COMPLETE.md

🆘 Resend: support@resend.com
🆘 Supabase: support@supabase.com

🔧 Test DNS: mxtoolbox.com
📧 Test Spam: mail-tester.com
```

---

## Checklist 60 Secondes

```
Configuration:
☐ Resend domain verified
☐ 3 Supabase secrets configured
☐ 4 Edge Functions deployed

Tests:
☐ test-email reçu
☐ Annulation test → invitation reçue
☐ Accept fonctionne → confirmation reçue

Logs:
☐ Resend dashboard: emails delivered
☐ Supabase logs: no errors

Status:
☐ PRODUCTION READY ✅
```

---

**Mise à jour:** 2025-10-17
**Version:** 1.0.0
**Status:** ✅ Production Ready
