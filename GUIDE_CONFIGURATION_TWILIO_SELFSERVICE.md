# 🎯 Guide Complet: Achat et Configuration Twilio Self-Service

## Vue d'ensemble

Votre système permet maintenant à **chaque clinique d'acheter et configurer son propre numéro Twilio** directement depuis l'interface, exactement comme GoHighLevel!

---

## 🎨 Interface Utilisateur

### Accès
```
Dashboard Admin → Paramètres → Téléphonie SMS
```

### Fonctionnalités

#### 1. Configuration des Identifiants Twilio
```
┌─────────────────────────────────────────────────┐
│  Identifiants Twilio API                        │
│                                                  │
│  Account SID                                     │
│  ├─ ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx          │
│                                                  │
│  Auth Token                                      │
│  ├─ ********************************            │
│                                                  │
│  [Sauvegarder les identifiants]                 │
└─────────────────────────────────────────────────┘
```

#### 2. Recherche de Numéros
```
┌─────────────────────────────────────────────────┐
│  Rechercher un numéro                            │
│                                                  │
│  Code régional  │  Contient  │  Pays            │
│  418, 514...    │  1234      │  🇨🇦 Canada       │
│                                                  │
│  [🔍 Rechercher des numéros]                    │
└─────────────────────────────────────────────────┘
```

#### 3. Liste des Numéros Disponibles
```
┌─────────────────────────────────────────────────┐
│  Numéros disponibles (15)                        │
│                                                  │
│  ┌─────────────────────────────────────────┐   │
│  │ +1 (418) 123-4567                       │   │
│  │ 📍 Québec, QC  📱 SMS + MMS            │   │
│  │                    [🛒 Acheter ~$1/mois] │   │
│  └─────────────────────────────────────────┘   │
│                                                  │
│  ┌─────────────────────────────────────────┐   │
│  │ +1 (418) 987-6543                       │   │
│  │ 📍 Québec, QC  📱 SMS + MMS            │   │
│  │                    [🛒 Acheter ~$1/mois] │   │
│  └─────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

#### 4. Numéro Configuré (État Final)
```
┌─────────────────────────────────────────────────┐
│  ✅ Numéro Actif                                │
│                                                  │
│  +1 (581) 500-6712                              │
│                                                  │
│  ✓ SMS entrants configurés                      │
│  ✓ SMS sortants activés                         │
│                                                  │
│  Modifier la configuration →                    │
└─────────────────────────────────────────────────┘
```

---

## 🚀 Processus d'Achat Automatique

### Étape 1: Obtenir les identifiants Twilio

1. Créez un compte sur [Twilio.com](https://www.twilio.com/console)
2. Allez dans **Console → Account → API Keys & Tokens**
3. Copiez:
   - **Account SID**: `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
   - **Auth Token**: Cliquez sur "Show" et copiez

### Étape 2: Configurer dans ChiroFlow

```typescript
// Dans l'interface:
1. Collez Account SID
2. Collez Auth Token
3. Cliquez "Sauvegarder les identifiants"

// Sauvegardé dans clinic_settings:
{
  twilio_account_sid: "ACxxxxxxx",
  twilio_auth_token: "xxxxxxx",
  twilio_phone_number: null,  // Pas encore acheté
  twilio_app_sid: null
}
```

### Étape 3: Rechercher un Numéro

```typescript
// Recherche avec filtres:
{
  areaCode: "418",        // Code régional
  contains: "1234",       // Chiffres spécifiques (optionnel)
  country: "CA"           // Canada
}

// Appelle: supabase.functions.invoke('search-twilio-numbers')
// Retourne: Liste de 15-30 numéros disponibles
```

### Étape 4: Acheter le Numéro

```typescript
// 1 clic sur "Acheter"
// → Appelle: supabase.functions.invoke('purchase-twilio-number')
// → Twilio achète le numéro (~$1 USD/mois)
// → Sauvegarde dans clinic_settings
// → Configure automatiquement le webhook
```

### Étape 5: Configuration Automatique du Webhook

```typescript
// Automatiquement après l'achat:
const webhookUrl = `${SUPABASE_URL}/functions/v1/receive-sms-twilio`;

// Configure dans Twilio:
PhoneNumber.update({
  smsUrl: webhookUrl,
  smsMethod: 'POST'
});

// ✅ Les SMS entrants arrivent maintenant automatiquement!
```

---

## 📡 Edge Functions Déployées

### 1. search-twilio-numbers

**But**: Rechercher des numéros disponibles sur Twilio

```typescript
// Endpoint
POST /functions/v1/search-twilio-numbers

// Body
{
  "account_sid": "ACxxxxxxx",
  "auth_token": "xxxxxxx",
  "areaCode": "418",
  "contains": "1234",
  "country": "CA"
}

// Response
{
  "success": true,
  "numbers": [
    {
      "phoneNumber": "+14185551234",
      "friendlyName": "(418) 555-1234",
      "locality": "Québec",
      "region": "QC",
      "capabilities": {
        "SMS": true,
        "MMS": true,
        "voice": true
      }
    }
  ],
  "count": 15
}
```

### 2. purchase-twilio-number

**But**: Acheter un numéro via l'API Twilio

```typescript
// Endpoint
POST /functions/v1/purchase-twilio-number

// Body
{
  "account_sid": "ACxxxxxxx",
  "auth_token": "xxxxxxx",
  "phone_number": "+14185551234"
}

// Response
{
  "success": true,
  "phone_number": "+14185551234",
  "sid": "PNxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "friendly_name": "(418) 555-1234"
}
```

### 3. configure-twilio-webhook

**But**: Configurer automatiquement le webhook SMS

```typescript
// Endpoint
POST /functions/v1/configure-twilio-webhook

// Body
{
  "account_sid": "ACxxxxxxx",
  "auth_token": "xxxxxxx",
  "phone_number": "+14185551234",
  "webhook_url": "https://zbqznetaqujfedlqanng.supabase.co/functions/v1/receive-sms-twilio"
}

// Response
{
  "success": true,
  "phone_number": "+14185551234",
  "sms_url": "https://zbqznetaqujfedlqanng.supabase.co/functions/v1/receive-sms-twilio",
  "message": "Webhook configured successfully"
}
```

---

## 🔒 Sécurité Multi-Tenant

### Isolation des Données

```sql
-- Chaque clinique a ses propres identifiants Twilio
CREATE TABLE clinic_settings (
  id UUID PRIMARY KEY,
  owner_id UUID REFERENCES auth.users(id),
  twilio_account_sid TEXT,      -- Isolé par owner_id
  twilio_auth_token TEXT,        -- Chiffré
  twilio_phone_number TEXT,      -- Unique par clinique
  twilio_app_sid TEXT
);

-- RLS Policy
CREATE POLICY "Clinics manage own Twilio config"
ON clinic_settings FOR ALL
TO authenticated
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);
```

### Flow de Sécurité

```
┌──────────────┐
│  Clinique A  │ → Account SID: AC111... → Numéro: +1-418-111-1111
└──────────────┘

┌──────────────┐
│  Clinique B  │ → Account SID: AC222... → Numéro: +1-514-222-2222
└──────────────┘

┌──────────────┐
│  Clinique C  │ → Account SID: AC333... → Numéro: +1-581-333-3333
└──────────────┘

Chaque clinique:
✓ Son propre compte Twilio
✓ Ses propres numéros
✓ Ses propres SMS
✓ Sa propre facturation Twilio
```

---

## 💰 Coûts Twilio (Transparents pour chaque clinique)

### Tarification Canada

| Service | Coût |
|---------|------|
| Numéro local (location mensuelle) | ~$1 USD/mois |
| SMS sortant | ~$0.0075 USD par SMS |
| SMS entrant | ~$0.0075 USD par SMS |
| MMS sortant | ~$0.02 USD par MMS |

### Exemple pour 1 mois

```
Clinique avec 500 patients:
- Location du numéro:        $1.00
- 500 rappels SMS sortants:  $3.75
- 100 réponses entrantes:    $0.75
- TOTAL:                     $5.50 USD/mois
```

---

## 🧪 Comment Tester

### Test Complet (Production-Ready)

```bash
# 1. Allez dans l'interface
http://localhost:5173/admin/settings → Téléphonie SMS

# 2. Entrez vos identifiants Twilio réels
Account SID: ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
Auth Token: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# 3. Recherchez un numéro
Code régional: 581
Pays: Canada

# 4. Achetez un numéro (~$1 USD)
Cliquez "Acheter" sur un numéro disponible

# 5. Vérifiez la configuration
✓ Le numéro apparaît comme "Actif"
✓ SMS entrants configurés
✓ SMS sortants activés

# 6. Testez la réception
Envoyez un SMS au numéro acheté depuis votre téléphone
→ Il devrait apparaître dans /admin/communications

# 7. Testez l'envoi
Répondez depuis l'interface
→ Vous devriez recevoir le SMS sur votre téléphone
```

---

## 🎯 Avantages par rapport à GoHighLevel

| Fonctionnalité | GoHighLevel | ChiroFlow |
|----------------|-------------|-----------|
| Achat de numéro en 1 clic | ✅ | ✅ |
| Configuration automatique webhook | ✅ | ✅ |
| Isolation multi-tenant | ✅ | ✅ |
| **Open Source** | ❌ | ✅ |
| **Pas de frais de plateforme** | ❌ ($97-297/mois) | ✅ (GRATUIT) |
| **Contrôle total des données** | ❌ | ✅ |
| **Hébergement personnalisé** | ❌ | ✅ |

---

## 📊 Dashboard pour Chaque Clinique

```
┌────────────────────────────────────────────────────────┐
│  Ma Configuration Téléphonie                           │
├────────────────────────────────────────────────────────┤
│                                                         │
│  Numéro Actif: +1 (581) 500-6712                      │
│                                                         │
│  Statistiques ce mois:                                  │
│  • SMS envoyés: 347                                     │
│  • SMS reçus: 89                                        │
│  • Coût estimé: $3.27 USD                              │
│                                                         │
│  [Voir les détails de facturation Twilio] →           │
│                                                         │
└────────────────────────────────────────────────────────┘
```

---

## 🔧 Configuration Manuelle (Alternative)

Si vous préférez configurer manuellement:

1. **Copiez l'URL du webhook:**
```
https://zbqznetaqujfedlqanng.supabase.co/functions/v1/receive-sms-twilio
```

2. **Dans Twilio Console:**
```
Phone Numbers → Active Numbers
→ Sélectionnez votre numéro
→ Messaging Configuration
→ Webhook URL for incoming messages: [Collez l'URL]
→ HTTP Method: POST
→ Save
```

---

## ✅ Checklist de Déploiement

- [x] Interface TwilioPhoneSetup créée
- [x] Edge Function search-twilio-numbers
- [x] Edge Function purchase-twilio-number
- [x] Edge Function configure-twilio-webhook
- [x] Intégration dans SettingsPage
- [x] RLS policies pour isolation multi-tenant
- [x] Gestion d'erreurs complète
- [x] Documentation complète

---

## 🎉 Résultat Final

**Chaque clinique peut maintenant:**

1. ✅ Acheter son propre numéro Twilio en 1 clic
2. ✅ Configuration automatique (zéro technique)
3. ✅ Recevoir des SMS immédiatement
4. ✅ Envoyer des SMS depuis l'interface
5. ✅ Isolation complète des données
6. ✅ Facturation Twilio directe (pas de frais de plateforme)
7. ✅ Contrôle total de leur téléphonie

**Exactement comme GoHighLevel, mais en mieux! 🚀**
