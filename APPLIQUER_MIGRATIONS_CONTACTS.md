# 🚀 Guide Rapide: Appliquer les Migrations Contacts

## ⚠️ IMPORTANT
Tu dois appliquer 2 migrations pour que la synchronisation fonctionne.

---

## 📋 ÉTAPE 1: Créer la table contacts (2 min)

1. **Aller sur:** https://supabase.com/dashboard
2. **Sélectionner** ton projet ChiroFlow
3. **Menu gauche** → **SQL Editor**
4. **Cliquer** "New Query"
5. **Copier-coller** TOUT le contenu du fichier:
   ```
   supabase/migrations/20251019020000_create_contacts_table.sql
   ```
6. **Cliquer** "Run" (en bas à droite)
7. **Attendre:** `✓ Success. No rows returned`

### ✅ Vérification
```sql
SELECT COUNT(*) FROM contacts;
```
Si ça retourne `0` sans erreur → **OK! ✅**

---

## 📋 ÉTAPE 2: Ajouter les contacts de test (1 min)

1. **SQL Editor** → "New Query"
2. **Copier-coller** le contenu de:
   ```
   supabase/migrations/20251019020100_seed_test_contacts.sql
   ```
3. **Cliquer** "Run"
4. **Attendre:** `✓ Success. 2 rows returned`

### ✅ Vérification
```sql
SELECT full_name, email FROM contacts;
```
Tu devrais voir:
- Marie Tremblay
- Jean Bouchard

---

## 📋 ÉTAPE 3: Ajouter le trigger auto (1 min)

1. **SQL Editor** → "New Query"
2. **Copier-coller** le contenu de:
   ```
   supabase/migrations/20251019010000_auto_add_contacts_to_recall_waitlist.sql
   ```
3. **Cliquer** "Run"
4. **Attendre:** `✓ Success. No rows returned`

---

## 🎯 ÉTAPE 4: Tester la synchronisation

1. **Rafraîchir** ton application (Ctrl+Shift+R)
2. **Aller dans:** Admin → Liste d'attente
3. **Onglet:** "Clients Actuels (Rappel)"
4. **Cliquer:** "Synchroniser les clients"
5. **Résultat attendu:**
   ```
   ✅ Synchronisation terminée: 2 ajoutés, 0 ignorés
   ```

### ✅ Vérification finale
Tu devrais maintenant voir **2 clients** dans la liste de rappel:
- ✅ Marie Tremblay (marie.tremblay@example.com)
- ✅ Jean Bouchard (jean.bouchard@example.com)

---

## 🔧 Si tu as des problèmes

### Erreur: "relation contacts does not exist"
→ Retour à l'Étape 1, la migration n'a pas été appliquée

### Erreur: "permission denied for table contacts"
→ Tu n'es pas connecté en tant qu'admin dans Supabase

### Aucun client affiché après sync
→ Vérifie l'Étape 2, les données de test ne sont pas insérées

---

## 📁 Fichiers à appliquer (dans l'ordre)

1. `supabase/migrations/20251019020000_create_contacts_table.sql`
2. `supabase/migrations/20251019020100_seed_test_contacts.sql`
3. `supabase/migrations/20251019010000_auto_add_contacts_to_recall_waitlist.sql`

---

## 🎉 Une fois terminé

Tous les **nouveaux contacts** que tu créeras seront automatiquement ajoutés à la liste de rappel!

Le système est maintenant **100% automatique** 🚀
