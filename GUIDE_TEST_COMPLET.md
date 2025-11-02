# 🧪 GUIDE DE TEST COMPLET - 4 NOUVELLES FONCTIONNALITÉS

**Date:** 2025-11-02
**Testeur:** À compléter
**Durée estimée:** 30-45 minutes

---

## ✅ CHECKLIST DE TEST

### **#1: RECHERCHE GLOBALE (Cmd+K)** ⚡

#### **Test 1.1: Ouverture Modal**
- [ ] Dashboard ouvert
- [ ] Appuyer `Cmd+K` (ou `Ctrl+K` Windows)
- [ ] Modal s'ouvre instantanément
- [ ] Input focus automatique
- [ ] Placeholder: "Rechercher patients, rendez-vous, notes..."

**Résultat attendu:** Modal ouvert en <100ms, input prêt à taper

#### **Test 1.2: Recherche Patient**
- [ ] Taper nom patient existant (ex: "Leblanc")
- [ ] Résultats apparaissent en <300ms
- [ ] Section "Patients" affichée
- [ ] Nom + email + téléphone visibles
- [ ] Badge "X visites" affiché

**Résultat attendu:** Patient trouvé avec détails complets

#### **Test 1.3: Recherche RDV**
- [ ] Taper nom patient avec RDV (ex: "Martin")
- [ ] Section "Rendez-vous" affichée
- [ ] Date + heure visibles
- [ ] Statut coloré (Confirmé = bleu, etc.)
- [ ] Badge statut correct

**Résultat attendu:** RDV trouvés et bien formatés

#### **Test 1.4: Recherche Notes SOAP**
- [ ] Taper terme médical (ex: "lombalgie")
- [ ] Section "Notes SOAP" affichée
- [ ] Nom patient + date visibles
- [ ] Preview S: et A: affichés
- [ ] Badge "Note SOAP" violet

**Résultat attendu:** Notes trouvées avec contexte

#### **Test 1.5: Navigation Clavier**
- [ ] Rechercher n'importe quoi
- [ ] Appuyer `↓` - Sélection descend
- [ ] Appuyer `↑` - Sélection monte
- [ ] Sélection surbrillance dorée
- [ ] Appuyer `Enter` - Ouvre dossier
- [ ] Appuyer `Esc` - Ferme modal

**Résultat attendu:** Navigation fluide sans souris

#### **Test 1.6: Bouton Visible**
- [ ] Header dashboard visible
- [ ] Bouton "Rechercher..." présent
- [ ] Icône 🔍 visible
- [ ] Badge "⌘ K" affiché
- [ ] Clic bouton ouvre modal

**Résultat attendu:** Bouton accessible et fonctionnel

#### **Test 1.7: Recherches Récentes**
- [ ] Ouvrir modal (Cmd+K)
- [ ] Ne rien taper
- [ ] Section "Recherches récentes" visible
- [ ] Historique 5 dernières recherches
- [ ] Clic recherche récente = re-recherche

**Résultat attendu:** Historique fonctionnel

**VERDICT #1: ⬜ PASS / ⬜ FAIL**
**Notes:**
```
[Vos observations ici]
```

---

### **#2: FACTURATION EXPRESS (Zap ⚡)** 💰

#### **Test 2.1: Accès Bouton**
- [ ] Aller section "Patients"
- [ ] Trouver patient avec email
- [ ] Icône ⚡ (Zap) dorée visible
- [ ] Hover → couleur gold + fill
- [ ] Tooltip "Facturation Express ⚡"

**Résultat attendu:** Bouton visible et attractif

#### **Test 2.2: Ouverture Modal**
- [ ] Clic icône ⚡
- [ ] Modal s'ouvre instantanément
- [ ] Header doré avec icône Zap
- [ ] Nom patient affiché
- [ ] Instructions claires en haut

**Résultat attendu:** Modal moderne et clair

#### **Test 2.3: Services Disponibles**
- [ ] Services groupés par catégorie
- [ ] Au moins 1 service visible
- [ ] Nom + description + prix affichés
- [ ] Durée (min) visible
- [ ] Badge couleur par service

**Résultat attendu:** Services bien présentés

**Note:** Si aucun service, aller Paramètres → Types de service → Créer 2-3 services test

#### **Test 2.4: Sélection Services**
- [ ] Clic sur carte service
- [ ] Carte devient dorée (border-gold-400)
- [ ] Checkmark vert apparaît
- [ ] Clic à nouveau = déselection
- [ ] Sélectionner 2-3 services

**Résultat attendu:** Sélection visuelle claire

#### **Test 2.5: Calcul Automatique**
- [ ] Services sélectionnés
- [ ] Section footer affichée
- [ ] Sous-total = somme services
- [ ] Taxes = 14.975% du sous-total
- [ ] Total = sous-total + taxes
- [ ] Calcul en temps réel

**Résultat attendu:** Calculs corrects automatiquement

**Exemple:**
```
Service 1: 100$
Service 2: 50$
Sous-total: 150$
Taxes: 22.46$ (14.975%)
Total: 172.46$
```

#### **Test 2.6: Option Email**
- [ ] Patient a email configuré
- [ ] Checkbox "Envoyer par email" visible
- [ ] Pré-coché par défaut
- [ ] Email patient affiché
- [ ] Décocher/cocher fonctionne

**Résultat attendu:** Option email claire

#### **Test 2.7: Création Facture**
- [ ] Sélectionner 1-2 services
- [ ] Cocher "Envoyer email"
- [ ] Clic "Créer Facture"
- [ ] Loading spinner apparaît
- [ ] Toast vert "Facture INV-XXX créée!"
- [ ] Modal se ferme automatiquement

**Résultat attendu:** Facture créée avec succès

#### **Test 2.8: Vérification DB**
- [ ] Aller onglet Facturation patient
- [ ] Facture récente visible
- [ ] Numéro INV-[timestamp]-[random]
- [ ] Montant correct
- [ ] Statut "pending"
- [ ] Description des services

**Résultat attendu:** Facture en base de données

#### **Test 2.9: Email Envoyé**
- [ ] Vérifier inbox patient (si configuré)
- [ ] Email reçu avec sujet "Facture INV-XXX"
- [ ] Détails services listés
- [ ] Sous-total + Taxes + Total
- [ ] Professionnel et formaté

**Résultat attendu:** Email reçu (si Resend configuré)

**Note:** Si email non reçu, vérifier:
- RESEND_API_KEY dans secrets Supabase
- Edge function "send-booking-confirmation" déployée

**VERDICT #2: ⬜ PASS / ⬜ FAIL**
**Notes:**
```
[Vos observations ici]
```

---

### **#3: NOTES VOCALES SOAP (Micro 🎤)** 🎤

#### **Test 3.1: Ouverture Note SOAP**
- [ ] Dashboard ouvert
- [ ] Raccourci `Ctrl+N` OU
- [ ] Bouton "Nouvelle Note"
- [ ] Modal UltraFastSoapNote s'ouvre
- [ ] 4 champs SOAP visibles

**Résultat attendu:** Modal note SOAP ouvert

#### **Test 3.2: Bouton Micro Visible**
- [ ] Champ "S - Subjectif" visible
- [ ] Bouton micro 🎤 à droite
- [ ] Couleur grise (idle)
- [ ] Hover → couleur gold
- [ ] Même pour O, A, P

**Résultat attendu:** 4 boutons micro présents

#### **Test 3.3: Permission Microphone**
- [ ] Clic bouton micro 🎤 (champ S)
- [ ] Navigateur demande permission
- [ ] Clic "Autoriser"
- [ ] Permission accordée

**Résultat attendu:** Permission accordée

**Note:** Si refusé, aller paramètres navigateur → site → microphone → autoriser

#### **Test 3.4: Démarrage Enregistrement**
- [ ] Clic micro après permission
- [ ] Bouton devient ROUGE
- [ ] Icône change (MicOff)
- [ ] Animation pulse visible
- [ ] Texte "Dictée en cours..." sous champ
- [ ] 3 barres animées

**Résultat attendu:** États visuels clairs

#### **Test 3.5: Dictée Temps Réel**
- [ ] Micro actif (rouge)
- [ ] Parler clairement:
  ```
  "Patient rapporte douleur au bas du dos 
   depuis trois jours, intensité sept sur dix,
   aggravée par flexion antérieure"
  ```
- [ ] Texte apparaît pendant parole
- [ ] Mots corrects en français
- [ ] Ponctuation automatique

**Résultat attendu:** Transcription précise

**Note:** Qualité dépend de:
- Chrome/Edge: Excellent
- Safari: Bon
- Firefox: Limité

#### **Test 3.6: Arrêt Enregistrement**
- [ ] Clic micro à nouveau
- [ ] Bouton redevient gris
- [ ] Animation disparaît
- [ ] Texte reste dans champ
- [ ] Peut éditer manuellement

**Résultat attendu:** Arrêt propre

#### **Test 3.7: Combinaison Clavier + Voix**
- [ ] Taper texte: "Test manuel"
- [ ] Clic micro
- [ ] Dicter: "test vocal"
- [ ] Arrêter micro
- [ ] Texte = "Test manuel test vocal"

**Résultat attendu:** Textes combinés

#### **Test 3.8: Tous les Champs SOAP**
- [ ] Dicter dans S (Subjectif) ✓
- [ ] Dicter dans O (Objectif) ✓
- [ ] Dicter dans A (Assessment) ✓
- [ ] Dicter dans P (Plan) ✓
- [ ] Tous fonctionnent

**Résultat attendu:** 4 champs vocaux

#### **Test 3.9: Sauvegarde Note**
- [ ] Notes dictées dans S, O, A, P
- [ ] Clic "Sauvegarder"
- [ ] Toast vert "Note sauvegardée"
- [ ] Modal se ferme
- [ ] Note visible dans liste

**Résultat attendu:** Note sauvegardée

#### **Test 3.10: Vérification DB**
- [ ] Ouvrir dossier patient
- [ ] Onglet "Notes SOAP"
- [ ] Note récente visible
- [ ] Contenu S, O, A, P correct
- [ ] Date création affichée

**Résultat attendu:** Note en DB

**VERDICT #3: ⬜ PASS / ⬜ FAIL**
**Notes:**
```
[Vos observations ici]
```

---

### **#4: DRAG & DROP CALENDRIER** 📅

#### **Test 4.1: Vue Calendrier**
- [ ] Dashboard → Calendrier
- [ ] Vue "Semaine" sélectionnée
- [ ] 7 colonnes (Lun-Dim) visibles
- [ ] Heures 8h-20h affichées
- [ ] Au moins 1 RDV visible

**Résultat attendu:** Vue semaine claire

**Note:** Si aucun RDV, créer 2-3 RDV test

#### **Test 4.2: Curseur Hover**
- [ ] Hover sur RDV existant
- [ ] Curseur change (move 🖐️)
- [ ] Carte RDV scale légèrement (1.02x)
- [ ] Shadow plus prononcée

**Résultat attendu:** Feedback hover

#### **Test 4.3: Démarrage Drag**
- [ ] Clic et maintenir sur RDV
- [ ] Commencer à glisser
- [ ] RDV devient semi-transparent (0.8)
- [ ] Curseur reste "move"

**Résultat attendu:** Drag démarré

#### **Test 4.4: Zones de Drop**
- [ ] Drag en cours
- [ ] Passer sur créneau vide
- [ ] Créneau devient doré (bg-gold-100)
- [ ] Border gold visible
- [ ] Texte "Déposer ici" apparaît

**Résultat attendu:** Zones drop highlights

#### **Test 4.5: Drop Valide**
- [ ] Drag RDV vers créneau vide
- [ ] Relâcher souris
- [ ] RDV disparaît emplacement original
- [ ] RDV apparaît nouvel emplacement
- [ ] Toast: "✅ RDV déplacé au [date] à [heure]"
- [ ] Date + heure correctes

**Résultat attendu:** Déplacement réussi

**Exemple Toast:**
```
✅ RDV déplacé au lundi 4 novembre à 14:00
```

#### **Test 4.6: Conflit Détecté**
- [ ] Drag RDV vers créneau OCCUPÉ
- [ ] Relâcher
- [ ] Toast warning: "Ce créneau est déjà occupé"
- [ ] RDV reste emplacement original
- [ ] Pas de double-booking

**Résultat attendu:** Conflit bloqué

#### **Test 4.7: Vue Jour**
- [ ] Changer vue → "Jour"
- [ ] 1 seule colonne visible
- [ ] Heures détaillées (8h00, 8h30, 9h00...)
- [ ] RDV visibles
- [ ] Drag & drop fonctionne aussi

**Résultat attendu:** Vue jour opérationnelle

#### **Test 4.8: Persistence DB**
- [ ] Drag RDV de 10h00 → 14h00
- [ ] Toast confirmation
- [ ] Rafraîchir page (F5)
- [ ] RDV toujours à 14h00
- [ ] Changement persisté

**Résultat attendu:** Changement en DB

#### **Test 4.9: Multi-Déplacements**
- [ ] Déplacer RDV 1: 9h → 10h
- [ ] Déplacer RDV 2: 11h → 15h
- [ ] Déplacer RDV 3: 14h → 9h
- [ ] Tous fonctionnent
- [ ] Pas de bugs

**Résultat attendu:** Multiples drags OK

#### **Test 4.10: Touch (Tablette)**
- [ ] Si disponible, tester sur tablette
- [ ] Touch et maintenir sur RDV
- [ ] Glisser vers nouveau créneau
- [ ] Relâcher
- [ ] Fonctionne comme souris

**Résultat attendu:** Touch supporté

**Note:** Test optionnel

**VERDICT #4: ⬜ PASS / ⬜ FAIL**
**Notes:**
```
[Vos observations ici]
```

---

## 📊 RÉSULTATS GLOBAUX

### **Statistiques:**
```
Tests Fonctionnalité #1: ⬜/7 passés
Tests Fonctionnalité #2: ⬜/9 passés
Tests Fonctionnalité #3: ⬜/10 passés
Tests Fonctionnalité #4: ⬜/10 passés

TOTAL: ⬜/36 tests passés (⬜%)
```

### **Bugs Trouvés:**
```
1. [Description bug si trouvé]
2. [Description bug si trouvé]
...
```

### **Améliorations Suggérées:**
```
1. [Suggestion si applicable]
2. [Suggestion si applicable]
...
```

---

## 🎯 VERDICT FINAL

**Status Global:** ⬜ PRODUCTION-READY / ⬜ BESOIN CORRECTIONS

**Prêt à déployer?** ⬜ OUI / ⬜ NON

**Commentaires:**
```
[Vos observations générales ici]
```

---

**Testeur:** ________________
**Date:** ________________
**Signature:** ________________

