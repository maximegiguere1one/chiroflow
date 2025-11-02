# 🔐 TEST DE TOUS LES SECRETS - CHIROFLOW

## 📋 **SECRETS À VÉRIFIER**

### **1. Supabase**
```
✅ VITE_SUPABASE_URL
✅ VITE_SUPABASE_ANON_KEY
🔒 SUPABASE_SERVICE_ROLE_KEY (dans Supabase Dashboard)
```

### **2. Resend (Email)**
```
🔒 RESEND_API_KEY
📧 Domain: Ton domaine vérifié
```

### **3. Twilio (SMS)**
```
🔒 TWILIO_ACCOUNT_SID
🔒 TWILIO_AUTH_TOKEN
📱 TWILIO_PHONE_NUMBER
```

---

## 🧪 **TESTS À EFFECTUER**

### **Test 1: Vérifier les Secrets Supabase** ✅

```bash
# Dans ton terminal local
curl -X POST \
  https://zbqznetaqujfedlqanng.supabase.co/functions/v1/check-secrets \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpicXpuZXRhcXVqZmVkbHFhbm5nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3MjI5NzksImV4cCI6MjA3NzI5ODk3OX0.5mEJDG-YkFqQbB1WtINzHDjrqFo5Y4rXZuoe36H-rOQ" \
  -H "Content-Type: application/json"
```

**Résultat attendu:**
```json
{
  "secrets": {
    "RESEND_API_KEY": "configured",
    "TWILIO_ACCOUNT_SID": "configured",
    "TWILIO_AUTH_TOKEN": "configured",
    "TWILIO_PHONE_NUMBER": "configured"
  },
  "status": "all_ok"
}
```

---

### **Test 2: Envoyer Email de Test** 📧

```bash
# Test simple
curl -X POST \
  https://zbqznetaqujfedlqanng.supabase.co/functions/v1/test-email \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpicXpuZXRhcXVqZmVkbHFhbm5nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3MjI5NzksImV4cCI6MjA3NzI5ODk3OX0.5mEJDG-YkFqQbB1WtINzHDjrqFo5Y4rXZuoe36H-rOQ" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "TON_EMAIL@example.com",
    "subject": "Test ChiroFlow"
  }'
```

**Résultat attendu:**
```json
{
  "success": true,
  "messageId": "re_xxx",
  "message": "Email sent successfully"
}
```

**Vérifie:**
- ✅ Email reçu dans ta boîte
- ✅ Pas de spam
- ✅ Design correct
- ✅ Links fonctionnels

---

### **Test 3: Envoyer SMS de Test** 📱

```bash
curl -X POST \
  https://zbqznetaqujfedlqanng.supabase.co/functions/v1/send-sms-reminder \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpicXpuZXRhcXVqZmVkbHFhbm5nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3MjI5NzksImV4cCI6MjA3NzI5ODk3OX0.5mEJDG-YkFqQbB1WtINzHDjrqFo5Y4rXZuoe36H-rOQ" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "+1XXXXXXXXXX",
    "message": "Test ChiroFlow: Votre RDV demain à 10h"
  }'
```

**Résultat attendu:**
```json
{
  "success": true,
  "messageSid": "SMxxx",
  "status": "sent"
}
```

**Vérifie:**
- ✅ SMS reçu sur ton téléphone
- ✅ Message lisible
- ✅ Numéro expéditeur correct

---

### **Test 4: Système de Rappels Automatiques** 🔔

#### **4A. Créer un RDV de test**

```sql
-- Dans Supabase SQL Editor
INSERT INTO appointments_api (
  contact_id,
  scheduled_at,
  duration_minutes,
  reason,
  status,
  owner_id
) VALUES (
  (SELECT id FROM contacts LIMIT 1),  -- Prend le premier contact
  NOW() + INTERVAL '25 hours',        -- RDV dans 25h
  30,
  'Test rappel automatique',
  'confirmed',
  (SELECT id FROM auth.users LIMIT 1)
);
```

#### **4B. Déclencher manuellement**

```bash
curl -X POST \
  https://zbqznetaqujfedlqanng.supabase.co/functions/v1/send-appointment-reminders \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpicXpuZXRhcXVqZmVkbHFhbm5nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3MjI5NzksImV4cCI6MjA3NzI5ODk3OX0.5mEJDG-YkFqQbB1WtINzHDjrqFo5Y4rXZuoe36H-rOQ" \
  -H "Content-Type: application/json"
```

**Résultat attendu:**
```json
{
  "success": true,
  "remindersSent": 1,
  "details": [
    {
      "appointmentId": "xxx",
      "patientName": "Jean Dupont",
      "emailSent": true,
      "smsSent": true
    }
  ]
}
```

**Vérifie:**
- ✅ Email reçu
- ✅ SMS reçu
- ✅ Contenu correct (date, heure, nom)

---

### **Test 5: Confirmation de RDV Patient** ✅

```bash
curl -X POST \
  https://zbqznetaqujfedlqanng.supabase.co/functions/v1/confirm-appointment \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpicXpuZXRhcXVqZmVkbHFhbm5nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3MjI5NzksImV4cCI6MjA3NzI5ODk3OX0.5mEJDG-YkFqQbB1WtINzHDjrqFo5Y4rXZuoe36H-rOQ" \
  -H "Content-Type: application/json" \
  -d '{
    "appointmentId": "ID_DU_RDV_TEST",
    "action": "confirm"
  }'
```

**Résultat attendu:**
```json
{
  "success": true,
  "message": "Appointment confirmed",
  "confirmationEmailSent": true
}
```

---

### **Test 6: Email Booking Confirmation** 📅

```bash
curl -X POST \
  https://zbqznetaqujfedlqanng.supabase.co/functions/v1/send-booking-confirmation \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpicXpuZXRhcXVqZmVkbHFhbm5nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3MjI5NzksImV4cCI6MjA3NzI5ODk3OX0.5mEJDG-YkFqQbB1WtINzHDjrqFo5Y4rXZuoe36H-rOQ" \
  -H "Content-Type: application/json" \
  -d '{
    "appointmentId": "ID_DU_RDV_TEST"
  }'
```

---

### **Test 7: Email Post-Visite** 💌

```bash
curl -X POST \
  https://zbqznetaqujfedlqanng.supabase.co/functions/v1/send-post-visit-followup \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpicXpuZXRhcXVqZmVkbHFhbm5nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3MjI5NzksImV4cCI6MjA3NzI5ODk3OX0.5mEJDG-YkFqQbB1WtINzHDjrqFo5Y4rXZuoe36H-rOQ" \
  -H "Content-Type: application/json" \
  -d '{
    "appointmentId": "ID_DU_RDV_COMPLETE"
  }'
```

---

### **Test 8: Rebooking Email** 🔄

```bash
curl -X POST \
  https://zbqznetaqujfedlqanng.supabase.co/functions/v1/send-rebooking-email \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpicXpuZXRhcXVqZmVkbHFhbm5nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3MjI5NzksImV4cCI6MjA3NzI5ODk3OX0.5mEJDG-YkFqQbB1WtINzHDjrqFo5Y4rXZuoe36H-rOQ" \
  -H "Content-Type: application/json" \
  -d '{
    "contactId": "ID_DU_CONTACT",
    "rebookingLink": "https://chiroflow.app/book/xxx"
  }'
```

---

## 🔍 **DIAGNOSTIC COMPLET**

### **Edge Function de Diagnostic:**

```bash
curl -X POST \
  https://zbqznetaqujfedlqanng.supabase.co/functions/v1/diagnose-email-system \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpicXpuZXRhcXVqZmVkbHFhbm5nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3MjI5NzksImV4cCI6MjA3NzI5ODk3OX0.5mEJDG-YkFqQbB1WtINzHDjrqFo5Y4rXZuoe36H-rOQ" \
  -H "Content-Type: application/json"
```

**Résultat attendu:**
```json
{
  "resend": {
    "configured": true,
    "domain": "chiroflow.app",
    "verified": true
  },
  "twilio": {
    "configured": true,
    "phoneNumber": "+1XXXXXXXXXX",
    "balance": "$10.00"
  },
  "database": {
    "contacts": 50,
    "appointments": 120,
    "emailTracking": true
  },
  "edgeFunctions": {
    "deployed": [
      "send-appointment-reminders",
      "send-booking-confirmation",
      "send-post-visit-followup",
      "send-sms-reminder",
      "send-rebooking-email",
      "test-email",
      "check-secrets"
    ]
  }
}
```

---

## 📊 **CHECKLIST COMPLÈTE**

### **Secrets Supabase:**
```
□ RESEND_API_KEY configuré
□ TWILIO_ACCOUNT_SID configuré
□ TWILIO_AUTH_TOKEN configuré
□ TWILIO_PHONE_NUMBER configuré
□ Domain Resend vérifié
□ Twilio balance > $5
```

### **Edge Functions:**
```
□ check-secrets déployée
□ test-email déployée
□ send-appointment-reminders déployée
□ send-booking-confirmation déployée
□ send-post-visit-followup déployée
□ send-sms-reminder déployée
□ send-rebooking-email déployée
□ diagnose-email-system déployée
```

### **Tests Email:**
```
□ Email de test envoyé et reçu
□ Email de confirmation booking
□ Email de rappel 24h
□ Email post-visite
□ Email rebooking
□ Tous les emails dans inbox (pas spam)
□ Design correct
□ Links fonctionnels
```

### **Tests SMS:**
```
□ SMS de test envoyé et reçu
□ SMS de rappel 24h
□ SMS de confirmation
□ Format correct
□ Numéro expéditeur correct
```

### **Automatisations:**
```
□ Cron job rappels 24h actif
□ Cron job post-visite actif
□ Cron job rebooking actif
□ Triggers annulation fonctionnels
□ Triggers booking fonctionnels
```

---

## 🚨 **TROUBLESHOOTING**

### **Si Email ne passe pas:**

**1. Vérifier Domain Resend:**
```
→ https://resend.com/domains
→ Status = Verified?
→ DNS records configurés?
```

**2. Vérifier API Key:**
```bash
curl https://api.resend.com/emails \
  -H "Authorization: Bearer TA_RESEND_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "from": "onboarding@resend.dev",
    "to": "ton@email.com",
    "subject": "Test",
    "html": "<p>Test</p>"
  }'
```

**3. Vérifier Edge Function:**
```bash
# Logs dans Supabase
→ Edge Functions → test-email → Logs
```

### **Si SMS ne passe pas:**

**1. Vérifier Twilio:**
```
→ https://console.twilio.com
→ Account balance > $0?
→ Phone number active?
```

**2. Tester API:**
```bash
curl -X POST "https://api.twilio.com/2010-04-01/Accounts/TON_SID/Messages.json" \
  --data-urlencode "Body=Test" \
  --data-urlencode "From=TON_NUMERO" \
  --data-urlencode "To=+1XXXXXXXXXX" \
  -u "TON_SID:TON_AUTH_TOKEN"
```

**3. Vérifier Edge Function:**
```bash
→ Edge Functions → send-sms-reminder → Logs
```

### **Si Automatisations ne marchent pas:**

**1. Vérifier Cron Jobs:**
```sql
-- Dans Supabase SQL Editor
SELECT * FROM cron.job;
```

**2. Activer manuellement:**
```bash
# Rappels
curl -X POST https://zbqznetaqujfedlqanng.supabase.co/functions/v1/send-appointment-reminders \
  -H "Authorization: Bearer TON_ANON_KEY"

# Post-visite
curl -X POST https://zbqznetaqujfedlqanng.supabase.co/functions/v1/send-post-visit-followup \
  -H "Authorization: Bearer TON_ANON_KEY"
```

**3. Check Logs:**
```
→ Supabase Dashboard → Edge Functions → Logs
→ Vérifier les erreurs
```

---

## 🎯 **TEST RAPIDE (5 MIN)**

### **Script de test automatique:**

```bash
#!/bin/bash

SUPABASE_URL="https://zbqznetaqujfedlqanng.supabase.co"
ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpicXpuZXRhcXVqZmVkbHFhbm5nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3MjI5NzksImV4cCI6MjA3NzI5ODk3OX0.5mEJDG-YkFqQbB1WtINzHDjrqFo5Y4rXZuoe36H-rOQ"

echo "🔍 1. Vérification des secrets..."
curl -s -X POST "$SUPABASE_URL/functions/v1/check-secrets" \
  -H "Authorization: Bearer $ANON_KEY" | jq

echo ""
echo "📧 2. Test email..."
curl -s -X POST "$SUPABASE_URL/functions/v1/test-email" \
  -H "Authorization: Bearer $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"to":"TON_EMAIL@example.com","subject":"Test ChiroFlow"}' | jq

echo ""
echo "📱 3. Test SMS..."
curl -s -X POST "$SUPABASE_URL/functions/v1/send-sms-reminder" \
  -H "Authorization: Bearer $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"to":"+1XXXXXXXXXX","message":"Test ChiroFlow"}' | jq

echo ""
echo "🏥 4. Diagnostic complet..."
curl -s -X POST "$SUPABASE_URL/functions/v1/diagnose-email-system" \
  -H "Authorization: Bearer $ANON_KEY" | jq

echo ""
echo "✅ Tests terminés!"
```

**Sauvegarde dans:**
```bash
nano test-secrets.sh
chmod +x test-secrets.sh
./test-secrets.sh
```

---

## 📋 **RÉSUMÉ DES COMMANDES**

### **Tests Essentiels:**

```bash
# 1. Check secrets
curl -X POST https://zbqznetaqujfedlqanng.supabase.co/functions/v1/check-secrets \
  -H "Authorization: Bearer TON_ANON_KEY"

# 2. Test email
curl -X POST https://zbqznetaqujfedlqanng.supabase.co/functions/v1/test-email \
  -H "Authorization: Bearer TON_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"to":"ton@email.com","subject":"Test"}'

# 3. Test SMS
curl -X POST https://zbqznetaqujfedlqanng.supabase.co/functions/v1/send-sms-reminder \
  -H "Authorization: Bearer TON_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"to":"+1XXXXXXXXXX","message":"Test"}'

# 4. Diagnostic
curl -X POST https://zbqznetaqujfedlqanng.supabase.co/functions/v1/diagnose-email-system \
  -H "Authorization: Bearer TON_ANON_KEY"
```

---

## 🎉 **TOUT EST OK SI:**

```
✅ check-secrets retourne "all_ok"
✅ test-email envoie et tu reçois
✅ send-sms-reminder envoie et tu reçois
✅ diagnose-email-system montre tout "configured: true"
✅ Rappels automatiques marchent
✅ Emails pas dans spam
✅ SMS format correct
```

---

## 📞 **BESOIN D'AIDE?**

### **Vérifier logs:**
```
1. Supabase Dashboard
2. Edge Functions
3. Click sur la fonction
4. Onglet "Logs"
5. Voir les erreurs
```

### **Erreurs communes:**

```
❌ "RESEND_API_KEY not configured"
→ Ajouter dans Supabase Vault

❌ "Domain not verified"
→ Vérifier DNS dans Resend

❌ "Twilio insufficient balance"
→ Recharger compte Twilio

❌ "Phone number invalid"
→ Format: +1XXXXXXXXXX
```

---

**Teste maintenant!** 🚀

**Lance les commandes curl et vérifie que tout marche!** ✨
