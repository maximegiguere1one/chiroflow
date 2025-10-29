# Système Automatique 100% - Liste d'Attente avec Emails

## ARCHITECTURE IMPLEMENTEE

Votre système de liste d'attente est maintenant **100% automatique**. Voici comment il fonctionne:

---

## FLUX AUTOMATIQUE COMPLET

```
1. Patient annule un rendez-vous
   └─> Status devient 'cancelled' dans la table appointments

2. Trigger PostgreSQL (handle_appointment_cancellation)
   ├─> Crée automatiquement un slot dans appointment_slot_offers
   ├─> Log l'action dans waitlist_trigger_logs
   └─> Appelle process-cancellation via pg_net (HTTP asynchrone)

3. Edge Function process-cancellation
   ├─> Trouve les candidats éligibles (RPC get_eligible_waitlist_candidates)
   ├─> Crée les invitations (slot_offer_invitations)
   ├─> Envoie les emails via Resend API
   └─> Met à jour les statuts

4. Patient reçoit l'email et clique sur un lien
   └─> Edge Function handle-invitation-response
       ├─> Si accepté: Crée le rendez-vous automatiquement
       ├─> Si refusé: Patient reste sur la liste
       └─> Envoie email de confirmation si accepté
```

---

## COMPOSANTS INSTALLES

### 1. Extension PostgreSQL: pg_net ✅
- Permet d'appeler des URLs HTTP depuis PostgreSQL
- Utilisée par le trigger pour appeler process-cancellation
- Appels asynchrones (ne bloque pas les transactions)

### 2. Table: waitlist_trigger_logs ✅
- Trace chaque exécution du système
- Enregistre succès et erreurs
- Permet debugging via Dashboard Supabase
- Colonnes: slot_offer_id, trigger_type, status, error_message, retry_count

### 3. Trigger Modifié: handle_appointment_cancellation ✅
- Détecte les annulations automatiquement
- Crée le slot offer
- Appelle process-cancellation via HTTP
- Log tout dans waitlist_trigger_logs
- Ne bloque jamais la transaction principale

### 4. Edge Function: process-cancellation (optimisée) ✅
- Validation: vérifie que le slot n'est pas déjà traité
- Évite les doublons avec invitation_count
- Meilleurs logs pour debugging
- Gestion d'erreurs améliorée

### 5. Edge Function: monitor-waitlist-system ✅
- Trouve les slots non traités (invitation_count = 0)
- Réessaie automatiquement les échecs
- Peut être appelée manuellement ou via cron
- Retourne statistiques complètes

---

## COMMENT TESTER

### Test 1: Annulation Simple

Dans votre dashboard admin, annulez un rendez-vous:

1. Allez dans Rendez-vous
2. Trouvez un rendez-vous confirmé
3. Changez le statut à "Annulé"
4. Attendez 5-10 secondes

**Ce qui devrait se passer:**
- Un slot offer est créé dans appointment_slot_offers
- process-cancellation est appelé automatiquement
- Les emails sont envoyés aux candidats éligibles
- Les logs apparaissent dans waitlist_trigger_logs

### Test 2: Vérifier les Logs

```sql
-- Voir tous les logs récents
SELECT * FROM waitlist_trigger_logs
ORDER BY created_at DESC
LIMIT 10;

-- Voir les slot offers créés
SELECT * FROM appointment_slot_offers
ORDER BY created_at DESC
LIMIT 5;

-- Voir les invitations envoyées
SELECT * FROM slot_offer_invitations
ORDER BY sent_at DESC
LIMIT 10;
```

### Test 3: Utiliser Monitor Manuellement

Appelez la fonction monitor depuis votre dashboard:

```javascript
const response = await fetch(
  'https://tuwswtgpkgtckhmnjnru.supabase.co/functions/v1/monitor-waitlist-system',
  {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer YOUR_SERVICE_ROLE_KEY',
      'Content-Type': 'application/json'
    }
  }
);

const data = await response.json();
console.log(data);
```

---

## DEBUGGING

### Voir les Logs des Edge Functions

1. Allez sur https://supabase.com/dashboard
2. Sélectionnez votre projet
3. Edge Functions → Logs
4. Filtrez par fonction (process-cancellation ou monitor-waitlist-system)

### Vérifier pg_net

```sql
-- Confirmer que pg_net est installé
SELECT * FROM pg_extension WHERE extname = 'pg_net';

-- Voir les requêtes HTTP en cours
SELECT * FROM net._http_response LIMIT 10;
```

### Table de Logs

```sql
-- Voir uniquement les erreurs
SELECT * FROM waitlist_trigger_logs
WHERE status = 'error'
ORDER BY created_at DESC;

-- Statistiques par type de trigger
SELECT trigger_type, status, COUNT(*)
FROM waitlist_trigger_logs
GROUP BY trigger_type, status;
```

---

## MECANISMES DE SECURITE

### 1. Validation des Doublons
- process-cancellation vérifie si le slot est déjà traité
- Empêche d'envoyer plusieurs fois les mêmes emails
- Check sur invitation_count et status

### 2. Logs Complets
- Chaque action est tracée
- Permet d'identifier les problèmes rapidement
- Inclut retry_count pour suivre les tentatives

### 3. Appels Asynchrones
- pg_net ne bloque pas les transactions
- Si l'appel HTTP échoue, le slot est quand même créé
- monitor-waitlist-system peut retraiter les échecs

### 4. Expiration Automatique
- Les invitations expirent après 24h
- Les slots expirent 2h avant le rendez-vous
- Évite les conflits et confusions

---

## MONITORING CONTINU

### Option 1: Cron Job Supabase (Recommandé)

Configurez un cron job pour appeler monitor toutes les 15 minutes:

1. Allez dans Project Settings → Database → Cron Jobs
2. Créez un nouveau cron:
   - Schedule: `*/15 * * * *` (toutes les 15 minutes)
   - Job: Appeler l'URL de monitor-waitlist-system

### Option 2: Appel Manuel

Créez un bouton dans votre dashboard admin pour appeler monitor manuellement.

### Option 3: Monitoring Externe

Utilisez un service comme UptimeRobot ou Cronitor pour appeler monitor régulièrement.

---

## TROUBLESHOOTING

### Les emails ne partent pas

1. Vérifiez RESEND_API_KEY dans Supabase Secrets
2. Vérifiez que le domaine est vérifié sur resend.com
3. Consultez les logs de process-cancellation
4. Vérifiez waitlist_trigger_logs pour les erreurs

### Le trigger ne s'exécute pas

1. Vérifiez que pg_net est bien installé
2. Consultez waitlist_trigger_logs (devrait avoir des entrées)
3. Vérifiez que les credentials dans vault sont corrects
4. Testez manuellement avec une annulation

### Les candidats ne reçoivent pas d'invitations

1. Vérifiez qu'il y a des candidats dans la table waitlist
2. Vérifiez leurs préférences de disponibilité
3. Vérifiez que consent_automated_notifications = true
4. Consultez les logs de process-cancellation

---

## PROCHAINES ETAPES

### Recommandé:
1. Configurez un cron job pour monitor-waitlist-system
2. Testez le système avec de vraies annulations
3. Surveillez les logs pendant quelques jours
4. Ajustez les paramètres si nécessaire

### Optionnel:
1. Ajoutez des alertes email si des erreurs persistent
2. Créez un dashboard admin pour voir les statistiques
3. Ajoutez des notifications SMS en plus des emails
4. Configurez des webhooks pour d'autres intégrations

---

## SUPPORT

Si vous rencontrez des problèmes:

1. Consultez d'abord waitlist_trigger_logs
2. Vérifiez les logs des Edge Functions
3. Appelez monitor-waitlist-system pour voir l'état du système
4. Vérifiez que tous les secrets sont configurés

---

**Félicitations! Votre système de liste d'attente est maintenant 100% automatique! 🎉**
