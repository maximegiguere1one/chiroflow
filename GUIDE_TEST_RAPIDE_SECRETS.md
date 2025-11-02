# ⚡ GUIDE TEST RAPIDE - SECRETS & AUTOMATISATIONS

## 🎯 **OBJECTIF**

Vérifier que Resend, Twilio et toutes les automatisations fonctionnent correctement.

---

## 🚀 **OPTION 1: TEST VIA DASHBOARD (Recommandé)**

### **1. Accède au Dashboard Admin**
```
→ https://ton-app.com/admin
→ Login avec ton compte admin
```

### **2. Utilise le Composant SecretsTester**

Le composant `SecretsTester` est intégré au dashboard et permet de:
- ✅ Vérifier tous les secrets en 1 clic
- ✅ Envoyer email de test
- ✅ Envoyer SMS de test
- ✅ Voir le status de chaque secret
- ✅ Voir les recommandations

**Pour l'intégrer:**

```tsx
// Dans AdminDashboard.tsx
import { SecretsTester } from '../components/dashboard/SecretsTester';

// Ajoute une nouvelle vue 'secrets-test' dans AdminSidebar
{currentView === 'secrets-test' && <SecretsTester />}
```

---

## 🧪 **OPTION 2: TEST VIA CURL (Terminal)**

### **Setup Initial:**

```bash
# Définir les variables
SUPABASE_URL="https://zbqznetaqujfedlqanng.supabase.co"
ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpicXpuZXRhcXVqZmVkbHFhbm5nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3MjI5NzksImV4cCI6MjA3NzI5ODk3OX0.5mEJDG-YkFqQbB1WtINzHDjrqFo5Y4rXZuoe36H-rOQ"
```

### **Test 1: Vérifier Secrets** (30 sec)

```bash
curl -X POST "$SUPABASE_URL/functions/v1/check-secrets" \
  -H "Authorization: Bearer $ANON_KEY" \
  -H "Content-Type: application/json" | jq
```

**Résultat attendu:**
```json
{
  "status": "ready",
  "summary": {
    "critical_errors": 0,
    "warnings": 0,
    "secrets_configured": 6,
    "secrets_valid": 6
  },
  "secrets": [
    {
      "name": "RESEND_API_KEY",
      "exists": true,
      "valid": true
    },
    {
      "name": "TWILIO_ACCOUNT_SID",
      "exists": true,
      "valid": true
    }
    // etc...
  ],
  "domain_verification": {
    "status": "verified"
  }
}
```

**✅ Si status = "ready":** Tout est OK, passe aux tests suivants!

**❌ Si status = "critical":** Suis les "action_items" retournés

---

### **Test 2: Envoyer Email** (1 min)

```bash
# Remplace TON_EMAIL par ton vrai email
curl -X POST "$SUPABASE_URL/functions/v1/test-email" \
  -H "Authorization: Bearer $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "TON_EMAIL@example.com",
    "subject": "Test ChiroFlow"
  }' | jq
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
- ✅ Email reçu dans inbox (pas spam)
- ✅ Design correct
- ✅ From: correctement configuré

---

### **Test 3: Envoyer SMS** (1 min)

```bash
# Remplace +1XXXXXXXXXX par ton vrai numéro
curl -X POST "$SUPABASE_URL/functions/v1/send-sms-reminder" \
  -H "Authorization: Bearer $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "+1XXXXXXXXXX",
    "message": "Test ChiroFlow - SMS fonctionnel!"
  }' | jq
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
- ✅ From number correct

---

### **Test 4: Rappels Automatiques** (2 min)

#### **4A. Créer RDV de test**

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
  (SELECT id FROM contacts LIMIT 1),
  NOW() + INTERVAL '25 hours',
  30,
  'Test rappel auto',
  'confirmed',
  (SELECT id FROM auth.users LIMIT 1)
);
```

#### **4B. Trigger manuellement**

```bash
curl -X POST "$SUPABASE_URL/functions/v1/send-appointment-reminders" \
  -H "Authorization: Bearer $ANON_KEY" | jq
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
- ✅ Email de rappel reçu
- ✅ SMS de rappel reçu
- ✅ Contenu correct (date, heure, nom)

---

### **Test 5: Email Confirmation Booking** (1 min)

```bash
# Remplace APPOINTMENT_ID par un ID réel
curl -X POST "$SUPABASE_URL/functions/v1/send-booking-confirmation" \
  -H "Authorization: Bearer $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "appointmentId": "APPOINTMENT_ID"
  }' | jq
```

---

### **Test 6: Email Post-Visite** (1 min)

```bash
# RDV doit être complété
curl -X POST "$SUPABASE_URL/functions/v1/send-post-visit-followup" \
  -H "Authorization: Bearer $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "appointmentId": "COMPLETED_APPOINTMENT_ID"
  }' | jq
```

---

## 📊 **CHECKLIST COMPLÈTE**

### **Secrets Supabase:**
```
□ RESEND_API_KEY (commence par 're_')
□ RESEND_DOMAIN (ex: janiechiro.com)
□ APP_DOMAIN (ex: janiechiro.com)
□ TWILIO_ACCOUNT_SID (commence par 'AC', 34 chars)
□ TWILIO_AUTH_TOKEN (32 chars)
□ TWILIO_PHONE_NUMBER (format: +15551234567)
```

### **Vérifications:**
```
□ Domain Resend vérifié (status = 'verified')
□ DNS records configurés (SPF, DKIM, DMARC)
□ Twilio balance > $5
□ Phone number Twilio actif
```

### **Tests Fonctionnels:**
```
□ check-secrets retourne "status": "ready"
□ test-email envoie et reçu
□ send-sms-reminder envoie et reçu
□ send-appointment-reminders marche
□ send-booking-confirmation marche
□ send-post-visit-followup marche
□ Emails pas dans spam
□ SMS format correct
```

---

## 🚨 **TROUBLESHOOTING**

### **Erreur: "RESEND_API_KEY not configured"**

```bash
# 1. Vérifie dans Supabase Dashboard
→ Project Settings
→ Edge Functions
→ Manage secrets
→ Ajouter: RESEND_API_KEY = ta_clé

# 2. Redéployer edge function
supabase functions deploy check-secrets
```

### **Erreur: "Domain not verified"**

```bash
# 1. Va sur resend.com/domains
# 2. Click sur ton domaine
# 3. Vérifie les 3 DNS records sont configurés:
   - TXT _resend (SPF)
   - TXT resend._domainkey (DKIM)
   - TXT _dmarc (DMARC)

# 4. Dans ton DNS provider (ex: Cloudflare):
→ Ajoute ces 3 records EXACTEMENT comme Resend te les donne
→ Attends 5-30 min
→ Retourne sur Resend et clique "Verify"
```

### **Erreur: "Twilio insufficient balance"**

```bash
# Va sur console.twilio.com
→ Billing
→ Add funds (minimum $20)
```

### **Emails vont dans spam:**

```bash
# 1. Vérifie SPF/DKIM/DMARC configurés
# 2. Utilise un vrai domaine (pas @gmail.com)
# 3. Envoie depuis email@ton-domaine.com
# 4. Pas de mots spam dans subject (FREE, WIN, etc)
# 5. Warm up progressif:
   - Jour 1: 10 emails
   - Jour 2: 20 emails
   - Jour 3: 50 emails
   - Etc.
```

---

## 🎯 **TEST RAPIDE (5 MIN)**

### **Script tout-en-un:**

```bash
#!/bin/bash

SUPABASE_URL="https://zbqznetaqujfedlqanng.supabase.co"
ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpicXpuZXRhcXVqZmVkbHFhbm5nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3MjI5NzksImV4cCI6MjA3NzI5ODk3OX0.5mEJDG-YkFqQbB1WtINzHDjrqFo5Y4rXZuoe36H-rOQ"

echo "🔍 Test 1/4: Vérification secrets..."
CHECK_RESULT=$(curl -s -X POST "$SUPABASE_URL/functions/v1/check-secrets" \
  -H "Authorization: Bearer $ANON_KEY")

echo $CHECK_RESULT | jq '.status'

if echo $CHECK_RESULT | jq -e '.status == "ready"' > /dev/null; then
  echo "✅ Secrets OK!"
else
  echo "❌ Erreurs dans secrets:"
  echo $CHECK_RESULT | jq '.action_items'
  exit 1
fi

echo ""
echo "📧 Test 2/4: Email..."
read -p "Entre ton email: " EMAIL
EMAIL_RESULT=$(curl -s -X POST "$SUPABASE_URL/functions/v1/test-email" \
  -H "Authorization: Bearer $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"to\":\"$EMAIL\",\"subject\":\"Test ChiroFlow\"}")

echo $EMAIL_RESULT | jq

echo ""
echo "📱 Test 3/4: SMS..."
read -p "Entre ton numéro (+15551234567): " PHONE
SMS_RESULT=$(curl -s -X POST "$SUPABASE_URL/functions/v1/send-sms-reminder" \
  -H "Authorization: Bearer $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"to\":\"$PHONE\",\"message\":\"Test ChiroFlow\"}")

echo $SMS_RESULT | jq

echo ""
echo "🔔 Test 4/4: Rappels automatiques..."
REMINDER_RESULT=$(curl -s -X POST "$SUPABASE_URL/functions/v1/send-appointment-reminders" \
  -H "Authorization: Bearer $ANON_KEY")

echo $REMINDER_RESULT | jq

echo ""
echo "✅ TESTS TERMINÉS!"
echo ""
echo "Vérifie:"
echo "- Email reçu dans inbox"
echo "- SMS reçu sur téléphone"
echo "- Rappels envoyés (si RDV dans 24h)"
```

**Sauvegarde et exécute:**

```bash
nano test-all.sh
chmod +x test-all.sh
./test-all.sh
```

---

## 📝 **CONFIGURATION SUPABASE SECRETS**

### **Où ajouter les secrets:**

```
1. Supabase Dashboard
2. Project: zbqznetaqujfedlqanng
3. Settings > Edge Functions
4. Click "Manage secrets"
5. Ajouter chaque secret:

Name: RESEND_API_KEY
Value: re_xxxxxxxxxxxxxxxx

Name: RESEND_DOMAIN
Value: janiechiro.com

Name: APP_DOMAIN
Value: janiechiro.com

Name: TWILIO_ACCOUNT_SID
Value: ACxxxxxxxxxxxxxxxx

Name: TWILIO_AUTH_TOKEN
Value: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

Name: TWILIO_PHONE_NUMBER
Value: +15551234567
```

### **Après ajout:**

```bash
# Redéployer les edge functions
supabase functions deploy check-secrets
supabase functions deploy test-email
supabase functions deploy send-sms-reminder
# etc...
```

---

## 🎉 **TOUT EST OK SI:**

```
✅ check-secrets status = "ready"
✅ Domain verification status = "verified"
✅ test-email success = true
✅ send-sms-reminder success = true
✅ Email reçu (pas spam)
✅ SMS reçu
✅ Rappels automatiques marchent
✅ Aucune erreur dans logs
```

---

## 📞 **BESOIN D'AIDE?**

### **Logs Edge Functions:**

```
1. Supabase Dashboard
2. Edge Functions
3. Click fonction (ex: test-email)
4. Onglet "Logs"
5. Voir les erreurs détaillées
```

### **Test Resend Direct:**

```bash
curl https://api.resend.com/emails \
  -H "Authorization: Bearer TA_RESEND_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "from": "onboarding@resend.dev",
    "to": "ton@email.com",
    "subject": "Test direct",
    "html": "<p>Test</p>"
  }'
```

### **Test Twilio Direct:**

```bash
curl -X POST "https://api.twilio.com/2010-04-01/Accounts/TON_SID/Messages.json" \
  --data-urlencode "Body=Test" \
  --data-urlencode "From=TON_NUMERO" \
  --data-urlencode "To=+1XXXXXXXXXX" \
  -u "TON_SID:TON_AUTH_TOKEN"
```

---

## 📚 **DOCUMENTATION COMPLÈTE:**

```
📄 TEST_TOUS_LES_SECRETS.md (détails complets)
📄 GUIDE_TEST_RAPIDE_SECRETS.md (ce fichier)
📄 README_RESEND.md (config Resend)
📄 GUIDE_DEPANNAGE_EMAILS.md (troubleshooting)
```

---

**Lance les tests maintenant!** 🚀

**Commence par Option 1 (Dashboard) ou Option 2 (Curl)!** ✨

**Tout devrait marcher en 5 minutes!** 💪
