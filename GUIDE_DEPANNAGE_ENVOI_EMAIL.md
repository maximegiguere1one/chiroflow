# 🔍 GUIDE DÉPANNAGE - ENVOI EMAIL

## 🎯 **ERREUR "proxy.js":**

**Cette erreur vient d'une extension Chrome, PAS de ton app!**

```
proxy.js:1 Uncaught Error: Attempting to use a disconnected port object
```

**C'est probablement:**
- React DevTools
- Redux DevTools
- Apollo DevTools

**Solution:** Ignore l'erreur ou désactive extensions temporairement.

---

## 🔍 **TROUVER LA VRAIE ERREUR:**

### **1. Ouvre la Console Proprement**
```bash
F12 → Console
Clique l'icône "Clear console" 🗑️
Clique droit → "Hide messages from extensions"
```

### **2. Envoie Email Nouveau**
```bash
1. Dossier patient
2. Onglet Communication
3. Nouveau message
4. Remplis formulaire
5. Clique "Envoyer"
6. Regarde TOUTES les erreurs rouges
```

### **3. Check Network Tab**
```bash
F12 → Network tab
Envoie email
Cherche requête: "send-custom-email"
Clique dessus
Onglet "Response"
→ Que dit la réponse?
```

---

## ✅ **CHECKLIST DE DIAGNOSTIC:**

### **Étape 1: Email du Patient**
```bash
✓ Patient a-t-il un email?
✓ Email valide (format correct)?
✓ Pas d'espaces dans l'email?

Vérification:
- Ouvre fiche patient
- Check champ email
```

### **Étape 2: Supabase Secrets**
```bash
✓ RESEND_API_KEY configuré?

Vérification:
1. Supabase Dashboard
2. Project Settings → Edge Functions → Manage secrets
3. Cherche: RESEND_API_KEY
4. Valeur présente?
```

### **Étape 3: Edge Function Deploy**
```bash
✓ Function send-custom-email déployée?

Vérification:
Liste functions:
- send-custom-email ✓ (ACTIVE)
```

### **Étape 4: Resend API Key Valide**
```bash
✓ API Key commence par "re_"?
✓ Pas expirée?
✓ Domain vérifié sur Resend?

Vérification:
1. Va sur resend.com
2. Login
3. API Keys → Check status
4. Domains → Vérifie DNS records
```

---

## 🧪 **TESTS MANUELS:**

### **Test 1: Email Tracking DB**
```sql
-- Dans Supabase SQL Editor
SELECT * FROM email_tracking
ORDER BY created_at DESC
LIMIT 5;
```

**Que chercher:**
- ✓ Nouvel enregistrement créé?
- ✓ status = 'pending' ou 'sent'?
- ✓ recipient_email correct?

### **Test 2: Edge Function Logs**
```bash
1. Supabase Dashboard
2. Edge Functions
3. Clique "send-custom-email"
4. Onglet "Logs"
5. Regarde dernières entrées
```

**Que chercher:**
- ✓ Logs d'exécution?
- ✓ Erreurs?
- ✓ "Email sent successfully"?

### **Test 3: Resend Dashboard**
```bash
1. Va sur resend.com/emails
2. Check derniers emails
3. Email présent?
4. Status = Delivered/Sent?
```

---

## 🚨 **ERREURS COMMUNES:**

### **Erreur 1: "Email service not configured"**
```json
{
  "error": "Email service not configured"
}
```

**Cause:** RESEND_API_KEY manquant

**Solution:**
```bash
1. Supabase Dashboard
2. Project Settings → Edge Functions
3. Manage secrets
4. Add secret:
   Key: RESEND_API_KEY
   Value: re_xxxxxxxxxxxxx
```

---

### **Erreur 2: "Missing required fields"**
```json
{
  "error": "Missing required fields: to, subject, message"
}
```

**Cause:** Données manquantes dans requête

**Solution:**
Vérifie que SendMessageModal envoie:
```json
{
  "to": "patient@email.com",
  "subject": "Sujet du message",
  "message": "Contenu du message",
  "patient_name": "Jean Dupont"
}
```

---

### **Erreur 3: "Resend API error: 401"**
```json
{
  "error": "Resend API error: 401"
}
```

**Cause:** API Key invalide ou expirée

**Solution:**
```bash
1. Va sur resend.com
2. API Keys
3. Créer nouvelle clé
4. Update Supabase secret
```

---

### **Erreur 4: "Resend API error: 403"**
```json
{
  "error": "Resend API error: 403"
}
```

**Cause:** Domain pas vérifié

**Solution:**
```bash
1. Resend Dashboard → Domains
2. Add domain: chiroflow.app (ou ton domain)
3. Ajoute DNS records (TXT, DKIM, etc)
4. Attends vérification (quelques minutes)
5. Status = Verified ✓
```

---

### **Erreur 5: Email pas reçu (mais pas d'erreur)**
```
Status: sent
Mais email pas dans inbox
```

**Causes possibles:**
1. Spam folder
2. Email invalide
3. Rate limiting Resend
4. Domain reputation

**Solutions:**
```bash
1. Check spam/junk folder
2. Vérifie email exact du patient
3. Resend Dashboard → Logs
4. Check bounce/complaint rates
```

---

## 🔧 **SOLUTION RAPIDE:**

### **Si l'email ne s'envoie pas:**

```bash
# 1. Vérifie secret Supabase
Supabase → Settings → Edge Functions → Secrets
RESEND_API_KEY = re_xxxxx

# 2. Test function directement
curl -X POST \
  https://zbqznetaqujfedlqanng.supabase.co/functions/v1/send-custom-email \
  -H "Authorization: Bearer [TON_ANON_KEY]" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "ton-email@gmail.com",
    "subject": "Test",
    "message": "Test message",
    "patient_name": "Test Patient"
  }'

# 3. Check réponse
Si 200 = ✅ Function OK
Si 500 = ❌ Check logs
```

---

## 📊 **WORKFLOW DEBUG COMPLET:**

```
1. User clique "Envoyer"
   └→ Check Console: erreurs JS?

2. SendMessageModal.handleSend()
   └→ Check: validations passent?

3. Insert email_tracking
   └→ Check DB: enregistrement créé?

4. Fetch edge function
   └→ Check Network: 200 ou erreur?

5. Edge function → Resend
   └→ Check Logs: success ou fail?

6. Update email_tracking status
   └→ Check DB: status = 'sent'?

7. Email reçu?
   └→ Check inbox + spam
```

---

## 🎯 **DIAGNOSTIC EN 30 SECONDES:**

```bash
# Console
Erreurs rouges? (Ignore proxy.js)

# Network Tab
send-custom-email → Status code?
200 = ✅
400/500 = ❌ Check Response tab

# Supabase Logs
Edge Function logs → Dernières entrées?

# Resend Dashboard
Derniers emails → Email présent?

# Database
email_tracking → Status?
```

---

## 💡 **SI TOUT ÉCHOUE:**

### **Option 1: Réinitialise Edge Function**
```bash
1. Redéploie function
2. Clear secrets
3. Re-add RESEND_API_KEY
4. Retry
```

### **Option 2: Test avec Email Personnel**
```bash
1. Change recipient à ton email
2. Envoie
3. Reçu? → Problem = Email patient
4. Pas reçu? → Problem = Configuration
```

### **Option 3: Use test-email Function**
```bash
# Test la config Resend directement
curl -X POST \
  https://zbqznetaqujfedlqanng.supabase.co/functions/v1/test-email \
  -H "Authorization: Bearer [ANON_KEY]"

# Si ça marche → send-custom-email a un bug
# Si ça marche pas → Resend config incorrect
```

---

## 📞 **BESOIN D'AIDE?**

Fournis ces infos:

```
1. Message d'erreur EXACT (copie console)
2. Network tab screenshot
3. Edge function logs (Supabase)
4. email_tracking table (dernière ligne)
5. Resend dashboard status
```

---

## 🎊 **CHECKLIST FINALE:**

```
Avant de demander de l'aide:

□ J'ai clear console et retry
□ J'ai check Network tab (pas juste Console)
□ J'ai vérifié RESEND_API_KEY existe
□ J'ai check Supabase logs
□ J'ai vérifié domain Resend
□ J'ai testé avec mon propre email
□ J'ai check spam folder
□ J'ai vérifié email patient valide
□ J'ai lu les logs edge function
□ J'ai check DB email_tracking
```

---

## 🚀 **PROCHAINES ÉTAPES:**

1. **Clear console** (ignore proxy.js)
2. **Envoie email nouveau**
3. **Check Network tab** (send-custom-email)
4. **Copie erreur EXACTE** si erreur
5. **Share screenshot** de Network Response

**Je pourrai t'aider précisément avec la vraie erreur!** 🔍✅

---

## 💬 **FORMAT DE BUG REPORT:**

```
❌ Problème: Email ne s'envoie pas

Console:
[copie erreur ici]

Network:
Status: [200/400/500]
Response: [copie JSON]

Edge Function Logs:
[copie logs Supabase]

email_tracking DB:
status: [pending/sent/failed]

Resend:
Email visible? [oui/non]
```

**Avec ça je peux fix en 2 minutes!** ⚡
