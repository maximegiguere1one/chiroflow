# 🔍 Guide de Débogage SMS

## Problème identifié

Les messages SMS apparaissent dans la base de données **sans `twilio_message_sid`**, ce qui signifie qu'ils ne sont pas envoyés via Twilio mais créés directement en base.

### Exemples de messages problématiques:
```sql
{
  "id": "91623447-2580-4a34-8d2a-71793a48f6fb",
  "channel": "sms",
  "from_address": "maxime@giguere-influence.com",  ❌ Devrait être un numéro
  "to_address": "maxime@giguere-influence.com",     ❌ Devrait être un numéro
  "twilio_message_sid": null,                       ❌ Devrait avoir un SID
  "status": "sent"                                  ❌ Faux - pas vraiment envoyé
}
```

### Messages corrects (avec Twilio):
```sql
{
  "id": "338f32c5-cd93-47b0-ab0d-eb985e0d5739",
  "channel": "sms",
  "from_address": "+14314457272",                   ✅ Numéro Twilio
  "to_address": "4185728464",                       ✅ Numéro destinataire
  "twilio_message_sid": "SM897810c7d761aaab...",   ✅ SID Twilio présent
  "status": "queued"                                ✅ Statut Twilio
}
```

---

## 🔎 Étapes de diagnostic

### 1. Ouvrir la console du navigateur

Dans Chrome/Edge/Firefox:
- Appuie sur `F12` ou `Ctrl+Shift+I`
- Va dans l'onglet **Console**
- Garde-la ouverte pendant que tu envoies un SMS

### 2. Essayer d'envoyer un SMS

Dans l'interface Communications:
1. Sélectionne une conversation SMS
2. Tape un message de test: "Test debug SMS"
3. Envoie le message
4. **Regarde immédiatement la console**

### 3. Vérifier les logs

Tu devrais voir quelque chose comme:

**✅ Si ça fonctionne:**
```
POST https://[ton-projet].supabase.co/functions/v1/send-sms-twilio 200 OK
{success: true, twilioSid: "SM...", messageId: "..."}
✅ SMS envoyé avec succès!
```

**❌ Si ça ne fonctionne pas:**
```
POST https://[ton-projet].supabase.co/functions/v1/send-sms-twilio 500 Error
SMS send error: {status: 500, error: "...", result: {...}}
```

---

## 🛠️ Solutions selon l'erreur

### Erreur: "Twilio settings not configured"

**Problème:** Les identifiants Twilio ne sont pas dans la base de données.

**Solution:**
```sql
-- Vérifier ta config
SELECT
  twilio_account_sid IS NOT NULL as has_sid,
  twilio_auth_token IS NOT NULL as has_token,
  twilio_phone_number,
  sms_enabled
FROM clinic_settings
WHERE owner_id = auth.uid();

-- Si manquant, va dans Paramètres > Téléphonie SMS
```

### Erreur: "SMS n'est pas activé"

**Problème:** Le flag `sms_enabled` est à `false`.

**Solution:**
```sql
UPDATE clinic_settings
SET sms_enabled = true
WHERE owner_id = auth.uid();
```

### Erreur: "Twilio phone number not configured"

**Problème:** Pas de numéro Twilio configuré.

**Solution:**
1. Va sur [Twilio Console](https://console.twilio.com/)
2. Achète un numéro ou utilise un existant
3. Configure-le dans Paramètres > Téléphonie SMS

### Erreur: "Unauthorized" ou "Session expirée"

**Problème:** Token d'authentification invalide.

**Solution:**
1. Déconnexion
2. Reconnexion
3. Réessaye

### Erreur: "Failed to send SMS" + code Twilio

**Problème:** Twilio refuse le message.

**Codes courants:**
- `21211`: Numéro invalide
- `21408`: Permission refusée pour ce numéro
- `21610`: Numéro blacklisté
- `21614`: Numéro invalide pour ce pays

**Solution:**
- Vérifie que le numéro est au format international: `+1XXXXXXXXXX`
- Vérifie que le numéro n'est pas sur une blacklist
- Pour tester: utilise ton propre numéro vérifié sur Twilio

---

## 🧪 Test manuel rapide

### Étape 1: Test direct de la fonction

Ouvre la console et exécute:

```javascript
const testSMS = async () => {
  const { data: { session } } = await supabase.auth.getSession();

  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-sms-twilio`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: '+15145551234',  // TON numéro ici
        body: 'Test debug direct',
        contactId: 'xxx-xxx-xxx' // ID d'un contact existant
      })
    }
  );

  const result = await response.json();
  console.log('Result:', result);

  if (!response.ok) {
    console.error('Error:', result);
  }
};

testSMS();
```

### Étape 2: Vérifier dans la base

Après l'envoi, vérifie:

```sql
SELECT
  id,
  twilio_message_sid,
  from_address,
  to_address,
  status,
  body,
  created_at
FROM conversation_messages
WHERE channel = 'sms'
ORDER BY created_at DESC
LIMIT 1;
```

**Si `twilio_message_sid` est NULL** = La fonction edge n'a pas été appelée ou a échoué silencieusement.

**Si `twilio_message_sid` a une valeur** = Le SMS est parti vers Twilio (vérifie ton téléphone).

---

## 🔧 Fix à appliquer si erreur silencieuse

Si les messages sont créés sans passer par Twilio, le problème est dans le code frontend. Voici le fix:

### Problème potentiel dans `UnifiedCommunications10X.tsx`

Le code actuel:
```typescript
if (channel === 'sms') {
  // Appel à send-sms-twilio
  const response = await fetch(...);
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error);
  }

  // ⚠️ Si on arrive ici, on assume que c'est OK
  // Mais si result.success === false, on devrait throw aussi

  if (!result.success) {
    throw new Error(result.error);
  }
}
```

**Le fix est déjà dans le code**, mais vérifie que tu utilises bien cette version.

---

## 📱 Vérification Twilio Console

### 1. Va sur Twilio Console

https://console.twilio.com/

### 2. Va dans "Logs" > "Errors & Warnings"

Vérifie s'il y a des erreurs récentes quand tu essayes d'envoyer.

### 3. Va dans "Monitor" > "Logs" > "Programmable SMS"

Tu devrais voir tous les messages envoyés, même les échecs.

---

## ✅ Checklist complète

Avant d'envoyer un SMS, vérifie:

- [ ] `clinic_settings.twilio_account_sid` est rempli
- [ ] `clinic_settings.twilio_auth_token` est rempli
- [ ] `clinic_settings.twilio_phone_number` commence par `+1`
- [ ] `clinic_settings.sms_enabled` est `true`
- [ ] Le contact a un numéro de téléphone valide
- [ ] Le numéro est au format `+1XXXXXXXXXX` ou `XXXXXXXXXX`
- [ ] Tu es bien authentifié (session valide)
- [ ] La fonction `send-sms-twilio` est déployée (vérifié ✅)

---

## 🎯 Solution rapide (90% des cas)

La plupart du temps, le problème vient de:

1. **Credentials Twilio manquants** → Va dans Paramètres
2. **Mauvais format de numéro** → Ajoute `+1` devant
3. **Session expirée** → Déconnexion/Reconnexion

---

## 📞 Besoin d'aide?

Si après tout ça ça ne fonctionne toujours pas:

1. Copie les logs de la console
2. Copie le résultat de cette requête:
   ```sql
   SELECT * FROM clinic_settings WHERE owner_id = auth.uid();
   ```
3. Copie le dernier message créé:
   ```sql
   SELECT * FROM conversation_messages
   WHERE channel = 'sms'
   ORDER BY created_at DESC LIMIT 1;
   ```

Avec ces 3 infos, on pourra identifier le problème exact.
