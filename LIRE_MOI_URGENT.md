# ⚠️ EMAILS NE FONCTIONNENT PAS - SOLUTION RAPIDE

**Problème:** Les emails n'arrivent jamais à Resend
**Solution:** Configuration manquante dans Supabase
**Temps:** 15-20 minutes

---

## 🚀 Solution Rapide en 5 Étapes

### Étape 1: Déployer la Fonction de Diagnostic (2 min)

```bash
cd /chemin/vers/votre/projet
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase functions deploy diagnose-email-system
```

---

### Étape 2: Exécuter le Diagnostic (1 min)

**Option A - Via Dashboard (Recommandé):**
1. Allez sur https://janiechiro.com/admin
2. Cliquez **Waitlist** (menu gauche)
3. Cliquez **🔍 Diagnostic** (coin supérieur droit)
4. Ouvrez la Console du navigateur (F12)
5. Lisez les recommendations

**Option B - Via Curl:**
```bash
curl -X POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/diagnose-email-system \
  -H "Authorization: Bearer YOUR_SUPABASE_ANON_KEY"
```

**Le diagnostic va vous dire EXACTEMENT quoi faire!**

---

### Étape 3: Créer un Compte Resend (5 min)

1. Allez sur [resend.com/signup](https://resend.com/signup)
2. Créez votre compte gratuit
3. Confirmez votre email
4. Menu: **API Keys** > **Create API Key**
   - Nom: `ChiroFlow Production`
   - Permission: **Sending access**
5. **COPIEZ LA CLÉ** (commence par `re_`)

---

### Étape 4: Configurer Supabase Secrets (3 min)

1. Allez sur [supabase.com/dashboard](https://supabase.com/dashboard)
2. Sélectionnez votre projet dans le dashboard
3. Menu: **Project Settings** > **Edge Functions**
4. Section **Secrets** > **Add new secret**

**Secret 1:**
```
Name: RESEND_API_KEY
Value: re_votre_cle_copiee_etape_3
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

---

### Étape 5: Vérifier le Domaine dans Resend (15 min)

1. Dashboard Resend > **Domains** > **Add Domain**
2. Entrez: `janiechiro.com`
3. Resend va afficher 3 DNS records à ajouter

**Allez dans votre registrar DNS** (GoDaddy, Namecheap, Cloudflare, etc.):

**Record 1 - SPF:**
```
Type: TXT
Name: @
Value: v=spf1 include:_spf.resend.com ~all
```

**Record 2 - DKIM:**
```
Type: TXT
Name: resend._domainkey
Value: [COPIEZ LA VALEUR UNIQUE DE RESEND]
```

**Record 3 - DMARC:**
```
Type: TXT
Name: _dmarc
Value: v=DMARC1; p=none; rua=mailto:admin@janiechiro.com
```

4. Attendez 10-20 minutes (propagation DNS)
5. Resend > Domains > **Verify Domain**
6. Status doit passer à: ✓ **Verified**

---

## ✅ Tester

### Test 1: Diagnostic (30 sec)
```
Dashboard > Waitlist > 🔍 Diagnostic
```
**Attendu:** "✅ Système opérationnel!"

### Test 2: Email Simple (1 min)
```
Dashboard > Waitlist > 📧 Tester email
Entrez votre email
```
**Attendu:** Email reçu dans 30-60 secondes

### Test 3: Flux Complet (2 min)
```
Dashboard > Waitlist > 🧪 Tester annulation
```
**Attendu:** Email d'invitation avec boutons

---

## 🆘 Aide

**Si blocage après 30 minutes:**

1. Consultez **GUIDE_DEPANNAGE_EMAILS.md** (détails complets)
2. Consultez **ANALYSE_CORRECTION_EMAILS.md** (analyse technique)
3. Vérifiez logs: Dashboard Supabase > Edge Functions > Logs
4. Vérifiez emails: Dashboard Resend > Emails

**Support:**
- Resend: support@resend.com
- Supabase: support@supabase.com

---

## 📚 Documentation Complète

- **ANALYSE_CORRECTION_EMAILS.md** ← Lisez CECI pour comprendre le problème
- **GUIDE_DEPANNAGE_EMAILS.md** ← Solutions pour 7 problèmes courants
- **DEPLOYMENT_CHECKLIST.md** ← Checklist complète étape-par-étape
- **README_RESEND.md** ← Vue d'ensemble du système

---

## ⚡ TL;DR

**Problème:** RESEND_API_KEY manquante + domaine non vérifié
**Solution:** Configurer 3 secrets Supabase + vérifier domaine DNS
**Temps:** 15-20 minutes
**Résultat:** Emails fonctionnent automatiquement!

---

**Créé le:** 2025-10-17
**Par:** Claude AI - ChiroFlow AI
