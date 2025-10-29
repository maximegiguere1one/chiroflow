# 🗺️ GUIDE D'ACCÈS RAPIDE - OÙ TOUT SE TROUVE

## 🏠 PAGE D'ACCUEIL

**URL**: `/admin` (après connexion)

C'est ton tableau de bord principal où tu vois:
- Résumé des RDV du jour
- Statistiques rapides
- Menu de navigation à gauche

---

## 📍 NAVIGATION PRINCIPALE (Menu de gauche)

### 1. 📊 **Dashboard d'automatisation** → `/admin` (onglet "Automation")
**C'EST ICI QUE TU VOIS TOUT LE SYSTÈME AUTOMATIQUE!**

Tu y trouves:
- ✅ Nombre de réservations automatiques vs manuelles
- ✅ Confirmations reçues automatiquement
- ✅ Rappels envoyés (48h, 24h, 2h)
- ✅ Suivis post-RDV effectués
- ✅ Invitations liste d'attente envoyées
- ✅ **TEMPS ÉCONOMISÉ** en heures/jours
- ✅ Taux d'automatisation en %
- ✅ Activité en temps réel

**Boutons en haut à droite**:
- "Aujourd'hui" / "7 jours" / "30 jours" → Change la période affichée

---

### 2. 📅 **Calendrier** → Bouton "Calendrier" dans le menu

Ton calendrier de RDV avec:
- Vue des RDV confirmés/en attente
- Gestion manuelle si besoin (mais c'est automatique maintenant!)
- Statuts colorés des RDV

---

### 3. 👥 **Patients** → Bouton "Patients" dans le menu

Liste de tous tes patients avec:
- Recherche rapide
- Historique des RDV
- Notes SOAP
- Bouton "Nouveau patient" (si besoin manuel)

---

### 4. ⚙️ **Paramètres** → Bouton "Paramètres" ou "Settings"

**C'EST ICI QUE TU CONFIGURES TOUT!**

#### A. **Réservation en ligne** (Onglet "Online Booking")
```
☐ Activer la réservation en ligne
📅 Heures d'ouverture par jour
⏰ Durée des créneaux
📆 Nombre de jours à l'avance pour réserver
⏳ Préavis minimum (ex: 24h)
💳 Options de paiement
📝 Instructions pour les patients
❌ Politique d'annulation
```

**Actions**:
- Cocher "Activer réservation en ligne"
- Configurer tes heures (ex: Lundi 9h-17h)
- Sauvegarder

#### B. **Types de services** (Onglet "Services")
```
+ Ajouter un service
  - Nom: "Ajustement chiropratique"
  - Durée: 30 minutes
  - Prix: 80$
  - Couleur pour le calendrier
  - Permettre réservation en ligne: ☑
```

#### C. **Formulaires d'admission** (Onglet "Intake Forms")
**NOUVEAU!** Créer des formulaires que les patients remplissent avant d'arriver:
- Questions personnalisables
- Envoi automatique X heures avant le RDV
- Peut être rendu obligatoire

**Comment**:
1. Cliquer "Nouveau formulaire"
2. Donner un titre
3. Ajouter des questions
4. Choisir quand l'envoyer (ex: 48h avant)
5. Sauvegarder

#### D. **Notifications** (Onglet "Notifications")
Configure quand TU veux être notifié:
- ☐ Nouvelle réservation
- ☐ Annulation
- ☑ No-show
- ☑ Paiement échoué
- 🌙 Heures de silence (22h-8h)

---

### 5. 📧 **Liste d'attente** → Bouton "Waitlist" dans le menu

**Système déjà actif!**

Tu y vois:
- Personnes inscrites sur la liste d'attente
- Créneaux disponibles qui ont été proposés
- Invitations envoyées automatiquement
- Statut des réponses

**Boutons en haut**:
- 🔍 **"Diagnostic"** → Vérifie que les emails fonctionnent
- 📧 **"Tester email"** → Envoie un email test
- 🧪 **"Tester annulation"** → Simule une annulation pour voir le système en action

---

### 6. 💳 **Paiements** → Bouton "Billing" ou "Payments"

Si tu configures les paiements en ligne:
- Facturation automatique
- Suivi des paiements
- Génération de reçus

---

### 7. 📊 **Analytiques** → Bouton "Analytics"

Statistiques détaillées:
- Performance globale
- Taux de conversion
- Revenus
- Tendances

---

## 🔗 LIEN PUBLIC DE RÉSERVATION

**TON LIEN À PARTAGER PARTOUT**:
```
https://VOTRE-SITE.com/book
```

Ce lien:
- ✅ Fonctionne 24/7
- ✅ Accessible sur mobile
- ✅ Tout est automatique
- ✅ Aucune intervention de ta part nécessaire

**Où le partager**:
- Sur ton site web principal
- Dans ta signature email
- Sur Facebook/Instagram
- Sur Google My Business
- Dans tes messages texte

---

## 📧 EMAILS AUTOMATIQUES - OÙ ILS SONT

### Vérifier que tout fonctionne

**Aller dans**: Menu → **Waitlist** → Bouton **"🔍 Diagnostic"**

Ça vérifie:
- ✅ Configuration email (Resend)
- ✅ Domaine vérifié
- ✅ Edge Functions déployées
- ✅ Système opérationnel

Si tout est vert → **C'est bon, tout est automatique!**

### Voir l'activité des emails

**Dashboard d'automatisation** → Section "Activité récente"

Tu y vois en temps réel:
- "Nouvelle réservation en ligne"
- "Rappel automatique envoyé"
- "Email de suivi envoyé"
- "Invitation liste d'attente envoyée"

---

## 🎯 CONFIGURATION INITIALE (À FAIRE UNE FOIS)

### Étape 1: Services (2 minutes)
1. Menu → **Paramètres** → Onglet **"Services"**
2. Cliquer **"+ Ajouter un service"**
3. Remplir:
   - Nom: "Ajustement"
   - Durée: 30 min
   - Prix: 80$
   - ☑ Permettre réservation en ligne
4. **Sauvegarder**

### Étape 2: Heures d'ouverture (2 minutes)
1. Menu → **Paramètres** → Onglet **"Online Booking"**
2. Cocher **"☑ Activer réservation en ligne"**
3. Pour chaque jour:
   - ☑ Activer le jour
   - Heure début: 9:00
   - Heure fin: 17:00
4. **Sauvegarder**

### Étape 3: Tester (1 minute)
1. Ouvrir un nouvel onglet
2. Aller sur `/book`
3. Faire une réservation test
4. Vérifier l'email de confirmation
5. Cliquer sur le lien de gestion
6. Tester la confirmation

**C'EST TOUT! Le système fait le reste automatiquement.**

---

## 🚨 MONITORING - COMMENT SURVEILLER

### Dashboard d'automatisation (à regarder 1x par semaine)

**Ce que tu devrais voir**:
- ✅ Taux d'automatisation: **>80%** (idéal: 95%+)
- ✅ Confirmations: La majorité des patients confirment
- ✅ No-shows: **<5%** (grâce aux rappels)
- ✅ Temps économisé: Devrait augmenter chaque semaine

**Si un nombre semble bas**:
- Vérifier le diagnostic des emails
- S'assurer que le lien `/book` est bien partagé
- Vérifier que "réservation en ligne" est activée

### État du système (bas de page)

3 indicateurs doivent être **VERTS**:
- ✅ Système opérationnel
- ✅ Emails activés
- ✅ Liste d'attente active

Si un est **ROUGE** → Cliquer sur "🔍 Diagnostic"

---

## 📱 ACCÈS RAPIDE - URLs DIRECTES

```
Dashboard:            /admin
Automation:           /admin (onglet Automation)
Calendrier:           /admin (onglet Calendrier)
Patients:             /admin (onglet Patients)
Paramètres:           /admin (onglet Settings)
  - Réservation:      /admin → Settings → Online Booking
  - Services:         /admin → Settings → Services
  - Formulaires:      /admin → Settings → Intake Forms
  - Notifications:    /admin → Settings → Notifications
Liste d'attente:      /admin (onglet Waitlist)
Paiements:            /admin (onglet Billing)
Analytiques:          /admin (onglet Analytics)

RÉSERVATION PUBLIQUE: /book
```

---

## 🎓 FORMATION EXPRESS (5 MINUTES)

### Minute 1: Activer la réservation
→ Settings → Online Booking → ☑ Activer

### Minute 2: Ajouter un service
→ Settings → Services → + Ajouter

### Minute 3: Tester
→ Ouvrir `/book` → Réserver

### Minute 4: Vérifier les emails
→ Waitlist → 🔍 Diagnostic

### Minute 5: Partager le lien
→ Copier `https://votre-site.com/book`
→ Ajouter sur site web et réseaux sociaux

**TERMINÉ!** Le système fait tout automatiquement maintenant.

---

## ❓ FAQ RAPIDE

**Q: Où je vois si quelqu'un a réservé?**
A: Dashboard → Section "Activité récente" OU Calendrier

**Q: Comment je sais si les emails partent?**
A: Dashboard d'automatisation → Compteur "Rappels envoyés"

**Q: Si quelqu'un annule, ça fait quoi?**
A: Le système propose AUTOMATIQUEMENT le créneau à ta liste d'attente

**Q: Je dois envoyer les rappels manuellement?**
A: NON! C'est automatique (48h, 24h, 2h avant)

**Q: Je dois relancer les patients pour rebooker?**
A: NON! Email automatique 3 jours après leur RDV

**Q: Comment j'ajoute quelqu'un sur la liste d'attente?**
A: C'est automatique quand les patients réservent et qu'il n'y a pas de place

**Q: Ça coûte quelque chose?**
A: Emails gratuits jusqu'à 3000/mois avec Resend (largement suffisant)

**Q: Je peux désactiver certaines automatisations?**
A: Oui, dans Settings → Notifications

---

## 🎉 EN RÉSUMÉ

**Pour toi (Janie)**:
1. Configure une fois (5 minutes)
2. Partage le lien `/book`
3. Regarde le Dashboard 1x par semaine
4. **TOUT LE RESTE EST AUTOMATIQUE!**

**Le système fait**:
- Réservations 24/7
- Confirmations immédiates
- Rappels multiples
- Gestion des annulations
- Liste d'attente
- Suivis post-RDV
- Rebooking automatique

**Tu n'as PLUS BESOIN d'adjointe pour les rendez-vous!** 🎊
