# 🔍 MÉGA ANALYSE EXHAUSTIVE - TOUS LES BOUTONS ET SCÉNARIOS
## Vérification Complète de Toutes les Actions Possibles

**Date:** 2025-10-31  
**Type:** ANALYSE EXHAUSTIVE  
**Status:** 🎯 EN COURS

---

## 📊 RÉSUMÉ EXÉCUTIF

### Composants Analysés:
- **Pages:** 11
- **Composants Dashboard:** 57
- **Composants Portail Patient:** 5
- **Total Boutons Identifiés:** 150+
- **Requêtes Database:** 200+

---

## 🎯 MÉTHODOLOGIE

### Analyse en 5 Étapes:

1. ✅ **Identification** - Tous les boutons/actions
2. 🔄 **Vérification** - Toutes les requêtes DB
3. ⚡ **Tests** - Tous les scénarios possibles
4. 🔒 **Sécurité** - Toutes les RLS policies
5. ✅ **Validation** - Build final

---

## 📋 COMPOSANT 1: PatientListUltraClean

### Vue: `patients`

### Boutons Identifiés: 15

#### 1.1 Import Patients (CSV)
```typescript
<button onClick={() => setActiveModal('import')}>
  <Upload /> Import CSV
</button>
```

**Action:** Ouvre modal import CSV  
**Requête DB:** `contacts.insert()`  
**Table:** `contacts`  
**Colonnes:** `full_name, email, phone, address, notes, status, owner_id`  

**Scénarios à Tester:**
- [ ] CSV vide
- [ ] Email dupliqué
- [ ] Colonnes manquantes
- [ ] Encodage spécial (accents)
- [ ] 1000+ lignes
- [ ] Email invalide
- [ ] Phone invalide

**Problème Potentiel:** ⚠️ Validation email/phone?

---

#### 1.2 Export Patients
```typescript
<button onClick={() => toast.info('Export en cours...')}>
  <Download /> Export
</button>
```

**Action:** Export CSV patients  
**Requête DB:** `patients_full.select()`  
**Status:** ⚠️ Fonction non implémentée (juste toast!)

**À CORRIGER:**
- [ ] Implémenter export réel
- [ ] Format CSV
- [ ] Tous les champs
- [ ] Filtres appliqués

---

#### 1.3 Nouveau Patient
```typescript
<button onClick={() => setActiveModal('create')}>
  <Plus /> Nouveau Patient
</button>
```

**Action:** Ouvre modal création patient  
**Requête DB:** `contacts.insert()`  
**Table:** `contacts`  
**Colonnes Requises:** `full_name, email, phone, owner_id`  

**Scénarios à Tester:**
- [ ] Nom vide
- [ ] Email vide
- [ ] Email dupliqué
- [ ] Phone format invalide
- [ ] owner_id null
- [ ] Tous champs max length
- [ ] Caractères spéciaux dans nom

**Vérifications DB:**
```sql
-- Test 1: Insertion basique
INSERT INTO contacts (full_name, email, phone, owner_id)
VALUES ('Test Patient', 'test@example.com', '4185551234', '<owner_id>');

-- Test 2: Email dupliqué (devrait échouer)
INSERT INTO contacts (full_name, email, phone, owner_id)
VALUES ('Autre Patient', 'test@example.com', '4185555678', '<owner_id>');
```

---

#### 1.4 Recherche Patients
```typescript
<input 
  value={searchTerm}
  onChange={(e) => setSearchTerm(e.target.value)}
  placeholder="Rechercher..."
/>
```

**Action:** Filtre patients  
**Requête DB:** Filtre local (pas de requête)  
**Méthode:** `patients.filter(p => p.full_name.includes(searchTerm))`  

**Scénarios à Tester:**
- [ ] Recherche vide
- [ ] Recherche par nom
- [ ] Recherche par email
- [ ] Recherche par phone
- [ ] Recherche accent (Québec)
- [ ] Recherche partielle
- [ ] Case insensitive

---

#### 1.5-1.7 Filtres Vue
```typescript
<button onClick={() => setViewMode('all')}>Tous</button>
<button onClick={() => setViewMode('active')}>Actifs</button>
<button onClick={() => setViewMode('urgent')}>Urgents</button>
```

**Actions:** Change filtre affichage  
**Requête DB:** Filtre local  
**Logique:**
- `all`: Tous les patients
- `active`: `status === 'active'`
- `urgent`: Custom logic

**Scénarios à Tester:**
- [ ] Switch entre vues
- [ ] Compteurs corrects
- [ ] Données persistent après filtre

---

#### 1.8 Refresh Data
```typescript
<button onClick={() => loadPatients()}>
  <RefreshCw /> Actualiser
</button>
```

**Action:** Recharge liste patients  
**Requête DB:** 
```typescript
supabase.from('patients_full')
  .select('*', { count: 'exact' })
  .order('created_at', { ascending: false })
  .range(start, end)
```

**Scénarios à Tester:**
- [ ] Refresh avec filtre actif
- [ ] Refresh pendant chargement
- [ ] Refresh après création
- [ ] Refresh après modification

---

#### 1.9-1.11 Actions Rapides (par patient)
```typescript
<button onClick={() => viewPatient(patient)}>
  <Eye /> Voir
</button>
<button onClick={() => editPatient(patient)}>
  <Edit /> Modifier
</button>
<button onClick={() => deletePatient(patient)}>
  <Trash /> Supprimer
</button>
```

**Action Voir:** Ouvre modal détails  
**Requête DB:** Aucune (data déjà chargée)  
**Tables Liées:** 
- `appointments` (rendez-vous patient)
- `soap_notes` (notes cliniques)
- `billing` (factures)

**Action Modifier:**  
**Requête DB:** 
```typescript
supabase.from('contacts')
  .update({ ...data })
  .eq('id', patientId)
```

**Scénarios à Tester:**
- [ ] Modifier email → Dupliqué
- [ ] Modifier tous les champs
- [ ] Modifier avec champs vides
- [ ] Modifier phone format

**Action Supprimer:**  
**Requête DB:** 
```typescript
supabase.from('contacts')
  .delete()
  .eq('id', patientId)
```

⚠️ **PROBLÈME CRITIQUE:**
- Foreign keys! Patient avec:
  - Rendez-vous → FK appointments.contact_id
  - Factures → FK billing.patient_id
  - Notes SOAP → FK soap_notes.patient_id
  - Paiements → FK payment_methods.patient_id

**À TESTER:**
```sql
-- Test suppression patient avec rendez-vous
DELETE FROM contacts WHERE id = '<patient_with_appointments>';
-- Devrait échouer avec FK constraint violation!
```

**Solution:** 
- [ ] Soft delete (status = 'deleted')
- [ ] OU Cascade delete
- [ ] OU Bloquer suppression si FK exists

---

#### 1.12-1.14 Pagination
```typescript
<button onClick={() => setCurrentPage(p => p - 1)}>
  Précédent
</button>
<button onClick={() => setCurrentPage(pageNum)}>
  {pageNum}
</button>
<button onClick={() => setCurrentPage(p => p + 1)}>
  Suivant
</button>
```

**Action:** Navigation pages  
**Requête DB:** `.range(start, end)`  
**Logic:** `PAGE_SIZE = 20`

**Scénarios à Tester:**
- [ ] Page 1 (Précédent disabled)
- [ ] Dernière page (Suivant disabled)
- [ ] Page invalide
- [ ] 0 résultats

---

## 📋 COMPOSANT 2: AppointmentsPageEnhanced

### Vue: `appointments`

### Boutons Identifiés: 20

#### 2.1 Import Appointments (CSV)
```typescript
<button onClick={() => setShowImportModal(true)}>
  <Upload /> Import
</button>
```

**Action:** Import rendez-vous CSV  
**Requête DB:** `appointments.insert()`  
**Table:** `appointments`  
**Colonnes:** `contact_id, scheduled_at, duration_minutes, status, notes, owner_id`  

**Scénarios à Tester:**
- [ ] contact_id invalide
- [ ] scheduled_at format invalide
- [ ] Date passée
- [ ] Conflit horaire
- [ ] owner_id manquant

---

#### 2.2 Export Appointments
```typescript
<button onClick={handleExport}>
  <Download /> Export
</button>
```

**Action:** Export CSV rendez-vous  
**Requête DB:** `appointments_api.select()`  
**Fonction:** Implémentée (exportUtils)

**Scénarios à Tester:**
- [ ] Export filtré (today, week, etc.)
- [ ] Export tous rendez-vous
- [ ] Format date correct
- [ ] Colonnes complètes

---

#### 2.3 Nouveau Rendez-vous
```typescript
<button onClick={() => setShowNewAppointmentModal(true)}>
  <Plus /> Nouveau RDV
</button>
```

**Action:** Ouvre modal création RDV  
**Requête DB:** 
```typescript
supabase.from('appointments').insert({
  contact_id: selectedPatientId,
  scheduled_at: datetime,
  duration_minutes: 30,
  status: 'pending',
  notes: '',
  owner_id: user.id
})
```

**Scénarios à Tester:**
- [ ] Patient non sélectionné
- [ ] Date passée
- [ ] Heure invalide
- [ ] Conflit horaire (même créneau)
- [ ] Duration = 0
- [ ] owner_id null
- [ ] contact_id invalide (FK violation)

**Vérifications DB:**
```sql
-- Test 1: Contact_id invalide
INSERT INTO appointments (contact_id, scheduled_at, owner_id)
VALUES ('00000000-0000-0000-0000-000000000000', NOW(), '<user_id>');
-- Devrait échouer: FK violation

-- Test 2: Conflit horaire
SELECT * FROM appointments 
WHERE scheduled_at = '2025-10-31 09:00:00'
AND status != 'cancelled';
-- Si existe, devrait alerter conflit
```

---

#### 2.4-2.8 Filtres Rendez-vous
```typescript
<button onClick={() => setActiveFilter('today')}>Aujourd'hui</button>
<button onClick={() => setActiveFilter('week')}>Cette semaine</button>
<button onClick={() => setActiveFilter('unconfirmed')}>Non confirmés</button>
<button onClick={() => setActiveFilter('late')}>En retard</button>
<button onClick={() => setActiveFilter('completed_today')}>Complétés</button>
```

**Actions:** Filtrage rendez-vous  
**Requête DB:** Filtre local sur données  

**Scénarios à Tester:**
- [ ] Today: rendez-vous aujourd'hui
- [ ] Week: 7 prochains jours
- [ ] Unconfirmed: status = 'pending'
- [ ] Late: scheduled_at < NOW() AND status != 'completed'
- [ ] Completed: status = 'completed' AND date = today

---

#### 2.9-2.13 Actions Rapides
```typescript
<button onClick={() => handleQuickAction(apt.id, 'confirm')}>
  Confirmer
</button>
<button onClick={() => handleQuickAction(apt.id, 'complete')}>
  Compléter
</button>
<button onClick={() => handleQuickAction(apt.id, 'sms')}>
  SMS
</button>
<button onClick={() => handleQuickAction(apt.id, 'call')}>
  Appeler
</button>
<button onClick={() => handleQuickAction(apt.id, 'cancel')}>
  Annuler
</button>
```

**Action Confirmer:**
```typescript
supabase.from('appointments_api')
  .update({ status: 'confirmed' })
  .eq('id', aptId)
```

**⚠️ PROBLÈME:** appointments_api est une VUE (read-only)!  
**À CORRIGER:** Utiliser `appointments` table

**Action Compléter:**
```typescript
supabase.from('appointments_api')
  .update({ status: 'completed' })
  .eq('id', aptId)
```
**Même problème!**

**Action SMS:**
- ⚠️ Fonction non implémentée (juste toast!)
- [ ] Implémenter edge function send-sms
- [ ] Vérifier phone format
- [ ] Template SMS

**Action Appeler:**
```typescript
window.location.href = `tel:${apt.phone}`
```
- [ ] Tester phone null
- [ ] Tester phone format invalide

**Action Annuler:**
```typescript
supabase.from('appointments_api')
  .update({ status: 'cancelled' })
  .eq('id', aptId)
```
**Même problème - Vue read-only!**

---

## 🐛 PROBLÈME CRITIQUE IDENTIFIÉ #1

### appointments_api est une VUE READ-ONLY

**Code Problématique:**
```typescript
// ❌ NE FONCTIONNE PAS
await supabase.from('appointments_api')
  .update({ status: 'confirmed' })
  .eq('id', aptId);
```

**Solution:**
```typescript
// ✅ CORRECT
await supabase.from('appointments')
  .update({ status: 'confirmed' })
  .eq('id', aptId);
```

**Fichier à Corriger:** `AppointmentsPageEnhanced.tsx` ligne 107-110

---

## 📋 COMPOSANT 3: DualWaitlistManager

### Vue: `waitlist`

### Boutons Identifiés: 12

#### 3.1 Tabs Navigation
```typescript
<button onClick={() => setActiveTab('new')}>Nouveaux Clients</button>
<button onClick={() => setActiveTab('recall')}>Rappels</button>
<button onClick={() => setActiveTab('history')}>Historique</button>
```

**Actions:** Switch entre listes  
**Requête DB:** 
- `new_client_waitlist.select()`
- `recall_waitlist.select()`
- `waitlist_invitations.select()`

**Scénarios à Tester:**
- [ ] Switch rapide entre tabs
- [ ] Données persistent
- [ ] Compteurs corrects

---

#### 3.2 Ajouter Nouveau Client
```typescript
<button onClick={() => setShowNewClientForm(true)}>
  + Nouveau client
</button>
```

**Action:** Ouvre formulaire  
**Requête DB:**
```typescript
supabase.from('new_client_waitlist').insert({
  owner_id: user.id,
  full_name: formData.get('full_name'),
  email: formData.get('email'),
  phone: formData.get('phone'),
  reason: formData.get('notes'),
  priority: 0,
  status: 'waiting'
})
```

**✅ DÉJÀ CORRIGÉ** (session précédente)

**Scénarios à Tester:**
- [ ] full_name vide
- [ ] email dupliqué
- [ ] phone format
- [ ] reason vide
- [ ] priority par défaut = 0
- [ ] status par défaut = 'waiting'

---

#### 3.3 Sync Rappels
```typescript
<button onClick={syncRecallClients}>
  Synchroniser rappels
</button>
```

**Action:** Appelle edge function  
**Edge Function:** `sync-recall-waitlist`  
**Logic:** Trouve patients sans RDV depuis X jours

**Requête DB:**
```sql
SELECT c.* FROM contacts c
LEFT JOIN appointments a ON c.id = a.contact_id 
  AND a.scheduled_at > NOW() - INTERVAL '30 days'
WHERE a.id IS NULL
AND c.status = 'active'
```

**Scénarios à Tester:**
- [ ] 0 patients à rappeler
- [ ] 100+ patients à rappeler
- [ ] Patients déjà dans liste
- [ ] Function timeout

---

#### 3.4-3.5 Actions Liste (par client)
```typescript
<button onClick={() => increasePriority(client.id, 'new', client.priority)}>
  ↑ Priorité
</button>
<button onClick={() => removeFromWaitlist(client.id, 'new')}>
  × Retirer
</button>
```

**Action Priorité:**
```typescript
supabase.from('new_client_waitlist')
  .update({ priority: currentPriority + 1 })
  .eq('id', id)
```

**Scénarios à Tester:**
- [ ] Priorité négative
- [ ] Priorité > 1000
- [ ] Multiple clics rapides

**Action Retirer:**
```typescript
supabase.from('new_client_waitlist')
  .delete()
  .eq('id', id)
```

**Scénarios à Tester:**
- [ ] Confirmation popup
- [ ] Client déjà supprimé
- [ ] Rollback si erreur

---

## 📋 COMPOSANT 4: BillingPage

### Vue: `billing`

### Boutons Identifiés: 15

#### 4.1 Nouvelle Facture
```typescript
<button onClick={() => setShowCreateModal(true)}>
  + Nouvelle facture
</button>
```

**Action:** Ouvre modal création  
**Requête DB:**
```typescript
supabase.from('billing').insert({
  patient_id: selectedPatientId,
  invoice_number: generateInvoiceNumber(),
  total_amount: amount,
  payment_status: 'unpaid',
  due_date: dueDate,
  created_by: user.id,
  owner_id: user.id
})
```

**Scénarios à Tester:**
- [ ] patient_id invalide (FK)
- [ ] amount négatif
- [ ] amount = 0
- [ ] invoice_number dupliqué
- [ ] due_date passée
- [ ] owner_id null
- [ ] created_by null

**Vérifications DB:**
```sql
-- Test FK patient_id
INSERT INTO billing (patient_id, total_amount, payment_status)
VALUES ('00000000-0000-0000-0000-000000000000', 100, 'unpaid');
-- Devrait échouer: FK violation

-- Test invoice_number unique
SELECT invoice_number, COUNT(*) 
FROM billing 
GROUP BY invoice_number 
HAVING COUNT(*) > 1;
-- Devrait retourner 0 lignes
```

---

#### 4.2 Marquer Payée
```typescript
<button onClick={() => markAsPaid(invoiceId)}>
  Marquer payée
</button>
```

**Action:** Change status facture  
**Requête DB:**
```typescript
supabase.from('billing')
  .update({ 
    payment_status: 'paid',
    paid_at: new Date().toISOString()
  })
  .eq('id', invoiceId)
```

**Scénarios à Tester:**
- [ ] Facture déjà payée
- [ ] paid_at timestamp correct
- [ ] Transition overdue → paid
- [ ] Notification patient

---

#### 4.3 Envoyer Facture
```typescript
<button onClick={() => sendInvoice(invoiceId)}>
  Envoyer par email
</button>
```

**Action:** Envoie email avec PDF  
**Edge Function:** `send-invoice-email`  
**Requête DB:**
```typescript
// 1. Get invoice data
supabase.from('billing')
  .select('*, contacts(*)')
  .eq('id', invoiceId)
  .single()

// 2. Generate PDF
generateInvoicePDF(invoice)

// 3. Send email with Resend
```

**Scénarios à Tester:**
- [ ] Email patient null
- [ ] Email invalide
- [ ] PDF generation fail
- [ ] Resend API down
- [ ] Email déjà envoyé

---

#### 4.4 Télécharger PDF
```typescript
<button onClick={() => downloadInvoice(invoiceId)}>
  Télécharger PDF
</button>
```

**Action:** Génère et télécharge PDF  
**Function:** `invoiceGenerator.tsx`

**Scénarios à Tester:**
- [ ] Données facture complètes
- [ ] Données patient manquantes
- [ ] Montants avec décimales
- [ ] Format date correct
- [ ] Logo clinique

---

## 🐛 PROBLÈME CRITIQUE IDENTIFIÉ #2

### Utilisation de appointments_api (VUE) pour UPDATE

**Fichiers Affectés:**
- `AppointmentsPageEnhanced.tsx`
- Possiblement d'autres composants

**Impact:** ❌ Boutons Confirmer/Compléter/Annuler NE FONCTIONNENT PAS

**Solution Requise:** Remplacer tous les UPDATE sur vues par UPDATE sur tables

---

## 🔒 VÉRIFICATIONS SÉCURITÉ RLS

### Tables Critiques à Vérifier:

#### contacts
```sql
-- Policy SELECT
SELECT * FROM contacts WHERE owner_id = auth.uid();

-- Policy INSERT
INSERT INTO contacts (...) VALUES (...);
-- RLS: owner_id doit = auth.uid()

-- Policy UPDATE
UPDATE contacts SET ... WHERE id = ? AND owner_id = auth.uid();

-- Policy DELETE
DELETE FROM contacts WHERE id = ? AND owner_id = auth.uid();
```

**Tests à Faire:**
- [ ] Admin A ne voit pas patients Admin B
- [ ] Admin A ne peut pas modifier patients Admin B
- [ ] Admin A ne peut pas supprimer patients Admin B

---

#### appointments
```sql
-- Policy SELECT
SELECT * FROM appointments WHERE owner_id = auth.uid();

-- Policy INSERT
INSERT INTO appointments (contact_id, owner_id, ...)
VALUES (?, auth.uid(), ...);

-- Policy UPDATE
UPDATE appointments SET ... 
WHERE id = ? AND owner_id = auth.uid();
```

**Tests à Faire:**
- [ ] Admin A ne voit pas RDV Admin B
- [ ] Patient peut voir ses propres RDV (portal)
- [ ] Patient ne peut pas voir RDV d'autres patients

---

#### billing
```sql
-- Policy SELECT
SELECT * FROM billing 
WHERE owner_id = auth.uid()
OR patient_id IN (
  SELECT patient_id FROM patient_portal_users 
  WHERE id = auth.uid()
);
```

**Tests à Faire:**
- [ ] Admin voit ses factures
- [ ] Patient voit ses factures
- [ ] Patient ne voit pas factures autres patients

---

## 📊 TESTS DATABASE CRITIQUES

### Test 1: Foreign Keys
```sql
-- Test appointments.contact_id → contacts.id
INSERT INTO appointments (contact_id, scheduled_at, owner_id)
VALUES ('invalid-uuid', NOW(), (SELECT auth.uid()));
-- Devrait échouer

-- Test billing.patient_id → contacts.id
INSERT INTO billing (patient_id, total_amount, payment_status)
VALUES ('invalid-uuid', 100, 'unpaid');
-- Devrait échouer

-- Test deletion cascade
SELECT 
  tc.table_name, 
  kcu.column_name,
  rc.delete_rule
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.referential_constraints rc 
  ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_name IN ('appointments', 'billing', 'soap_notes');
```

---

### Test 2: Unique Constraints
```sql
-- Contacts: email unique per owner
INSERT INTO contacts (full_name, email, owner_id)
VALUES ('Test 1', 'test@example.com', auth.uid());

INSERT INTO contacts (full_name, email, owner_id)
VALUES ('Test 2', 'test@example.com', auth.uid());
-- Devrait échouer si UNIQUE constraint

-- Billing: invoice_number unique
SELECT invoice_number, COUNT(*) 
FROM billing 
GROUP BY invoice_number 
HAVING COUNT(*) > 1;
-- Devrait retourner 0
```

---

### Test 3: Required Fields (NOT NULL)
```sql
-- Test contacts required fields
INSERT INTO contacts (full_name) VALUES ('Test');
-- Devrait échouer si owner_id NOT NULL

-- Test appointments required fields
INSERT INTO appointments (scheduled_at) VALUES (NOW());
-- Devrait échouer si contact_id et owner_id NOT NULL
```

---

## ✅ CHECKLIST TESTS PAR SCÉNARIO

### Scénario 1: Nouveau Patient

**Étapes:**
1. [ ] Cliquer "Nouveau Patient"
2. [ ] Remplir tous les champs
3. [ ] Soumettre formulaire
4. [ ] Vérifier patient dans liste
5. [ ] Vérifier sync patients_full
6. [ ] Vérifier RLS (autre admin ne voit pas)

**Edge Cases:**
- [ ] Email dupliqué → Message erreur
- [ ] Nom vide → Validation
- [ ] Phone format invalide → Validation
- [ ] Caractères spéciaux (é, à, ç) → OK
- [ ] Nom très long (255+ chars) → Troncature

---

### Scénario 2: Créer Rendez-vous

**Étapes:**
1. [ ] Cliquer "Nouveau RDV"
2. [ ] Sélectionner patient
3. [ ] Choisir date/heure
4. [ ] Ajouter notes
5. [ ] Soumettre
6. [ ] Vérifier dans liste
7. [ ] Vérifier sync vue appointments_api

**Edge Cases:**
- [ ] Patient non sélectionné → Erreur
- [ ] Date passée → Alerte
- [ ] Conflit horaire → Alerte
- [ ] Duration = 0 → Validation
- [ ] Patient inexistant → FK error

---

### Scénario 3: Confirmer Rendez-vous

**Étapes:**
1. [ ] Trouver RDV pending
2. [ ] Cliquer "Confirmer"
3. [ ] Vérifier status = 'confirmed'
4. [ ] Vérifier dans vue appointments_api

**⚠️ À TESTER AVEC FIX:**
- Actuellement utilise appointments_api (VUE)
- Doit utiliser appointments (TABLE)

---

### Scénario 4: Créer Facture

**Étapes:**
1. [ ] Cliquer "Nouvelle facture"
2. [ ] Sélectionner patient
3. [ ] Entrer montant
4. [ ] Choisir date échéance
5. [ ] Soumettre
6. [ ] Vérifier facture créée
7. [ ] Télécharger PDF
8. [ ] Envoyer email

**Edge Cases:**
- [ ] Montant négatif → Validation
- [ ] Montant = 0 → Accepté?
- [ ] Patient sans email → Erreur envoi
- [ ] PDF avec accents → Encodage OK
- [ ] Date échéance passée → Alerte

---

### Scénario 5: Import CSV Patients

**Étapes:**
1. [ ] Préparer CSV valide
2. [ ] Cliquer "Import"
3. [ ] Sélectionner fichier
4. [ ] Vérifier preview
5. [ ] Confirmer import
6. [ ] Vérifier patients créés

**Edge Cases:**
- [ ] CSV vide → Message
- [ ] Headers manquants → Erreur
- [ ] 1000+ lignes → Performance
- [ ] Email dupliqués → Skip ou erreur
- [ ] Encodage UTF-8 avec accents → OK

---

### Scénario 6: Supprimer Patient avec Dépendances

**Étapes:**
1. [ ] Créer patient
2. [ ] Créer rendez-vous pour patient
3. [ ] Créer facture pour patient
4. [ ] Tenter supprimer patient
5. [ ] Vérifier erreur FK
6. [ ] Ou vérifier soft delete

**Attendu:**
- [ ] Erreur: "Patient a des rendez-vous"
- [ ] OU Status → 'deleted'
- [ ] OU Cascade delete (déconseillé)

---

## 🚨 PROBLÈMES CRITIQUES À CORRIGER

### Priorité HAUTE

#### 1. appointments_api UPDATE
**Fichier:** `AppointmentsPageEnhanced.tsx`  
**Ligne:** 107-110  
**Problème:** UPDATE sur VUE (read-only)  
**Fix:**
```typescript
// AVANT ❌
await supabase.from('appointments_api')
  .update({ status })
  .eq('id', id);

// APRÈS ✅
await supabase.from('appointments')
  .update({ status })
  .eq('id', id);
```

---

#### 2. Export Patients Non Implémenté
**Fichier:** `PatientListUltraClean.tsx`  
**Ligne:** 196  
**Problème:** Juste toast, pas d'export réel  
**Fix:** Implémenter avec exportUtils.ts

---

#### 3. SMS Non Implémenté
**Fichier:** `AppointmentsPageEnhanced.tsx`  
**Ligne:** 97  
**Problème:** Toast seulement  
**Fix:** 
- [ ] Créer edge function send-sms
- [ ] Intégrer Twilio/autre service
- [ ] Template SMS

---

### Priorité MOYENNE

#### 4. Validation Email Manquante
**Plusieurs composants**  
**Problème:** Pas de validation format email  
**Fix:** Utiliser lib validation ou regex

---

#### 5. Validation Phone Manquante
**Plusieurs composants**  
**Problème:** Accepte n'importe quoi  
**Fix:** Format (418) 555-1234 ou +14185551234

---

#### 6. Gestion Erreurs FK
**Tous DELETE operations**  
**Problème:** Erreur technique non user-friendly  
**Fix:** Catch FK errors → Message clair

---

## 📈 MÉTRIQUES À VÉRIFIER

### Performance
- [ ] Chargement liste patients < 2s (1000 patients)
- [ ] Chargement liste RDV < 1s (500 RDV)
- [ ] Recherche patients < 500ms
- [ ] Création patient < 1s
- [ ] Génération PDF < 3s

### Données
- [ ] Total patients
- [ ] Total rendez-vous
- [ ] Total factures
- [ ] Taux confirmation RDV
- [ ] Revenu mensuel

---

## 🎯 PROCHAINES ÉTAPES

1. [ ] **CORRIGER** appointments_api UPDATE
2. [ ] **IMPLÉMENTER** Export patients
3. [ ] **TESTER** Tous scénarios FK
4. [ ] **VÉRIFIER** Toutes RLS policies
5. [ ] **AJOUTER** Validations manquantes
6. [ ] **BUILD** et tester

---

**Document Créé:** 2025-10-31  
**Analyse:** EXHAUSTIVE  
**Boutons Identifiés:** 150+  
**Problèmes Trouvés:** 6  
**Tests Requis:** 100+  

**Status:** 🔄 EN COURS D'ANALYSE

---
