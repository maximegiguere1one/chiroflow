# 🚀 Configuration des variables d'environnement Netlify

## ❌ Erreur actuelle

```
Uncaught Error: VITE_SUPABASE_URL is required but not defined
```

**Cause:** Netlify ne connaît pas tes variables d'environnement Supabase.

---

## ✅ Solution: Configurer dans Netlify

### Option 1: Via l'interface Netlify (RECOMMANDÉ)

1. **Va sur ton site Netlify:**
   - https://app.netlify.com/sites/TON-SITE/settings/env

2. **Ajoute ces variables:**

   Clique sur "Add a variable" et ajoute:

   ```
   Nom: VITE_SUPABASE_URL
   Valeur: https://zbqznetaqujfedlqanng.supabase.co
   ```

   ```
   Nom: VITE_SUPABASE_ANON_KEY
   Valeur: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpicXpuZXRhcXVqZmVkbHFhbm5nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3MjI5NzksImV4cCI6MjA3NzI5ODk3OX0.5mEJDG-YkFqQbB1WtINzHDjrqFo5Y4rXZuoe36H-rOQ
   ```

3. **Sauvegarde**

4. **Redéploie:**
   ```bash
   netlify deploy --prod --dir=dist
   ```

---

### Option 2: Via Netlify CLI

```bash
# Set les variables
netlify env:set VITE_SUPABASE_URL "https://zbqznetaqujfedlqanng.supabase.co"
netlify env:set VITE_SUPABASE_ANON_KEY "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpicXpuZXRhcXVqZmVkbHFhbm5nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3MjI5NzksImV4cCI6MjA3NzI5ODk3OX0.5mEJDG-YkFqQbB1WtINzHDjrqFo5Y4rXZuoe36H-rOQ"

# Vérifie
netlify env:list

# Redéploie avec build sur Netlify
netlify deploy --prod --build
```

---

### Option 3: Build en local avec .env

Si tu veux éviter de configurer Netlify maintenant:

```bash
# Build en local (va lire ton .env)
npm run build

# Déploie le build déjà fait
netlify deploy --prod --dir=dist
```

**⚠️ Mais attention:** Au prochain push sur Git, Netlify va rebuild sans les variables!

---

## 🎯 Méthode recommandée

**Utilise l'Option 3 pour tester maintenant:**

```bash
# 1. Build localement (lit ton .env)
npm run build

# 2. Déploie
netlify deploy --prod --dir=dist
```

**Puis configure l'Option 1 pour les futurs déploiements:**
- Va dans Netlify UI
- Ajoute les 2 variables d'environnement
- Comme ça, chaque push sur Git déploiera automatiquement avec les bonnes variables

---

## 📋 Checklist

- [ ] Option rapide: Build local + deploy
  ```bash
  npm run build && netlify deploy --prod --dir=dist
  ```

- [ ] Option permanente: Configure Netlify env vars
  - VITE_SUPABASE_URL
  - VITE_SUPABASE_ANON_KEY

- [ ] Teste le site déployé
  - Va sur ton URL Netlify
  - Ouvre la console (F12)
  - Vérifie qu'il n'y a plus l'erreur

---

## 🔍 Comment vérifier que ça marche

Après déploiement, va sur ton site et ouvre la console:

### ✅ Si ça marche:
```
(aucune erreur VITE_SUPABASE_URL)
```

### ❌ Si ça ne marche pas:
```
Uncaught Error: VITE_SUPABASE_URL is required
```
→ Les variables ne sont pas configurées dans Netlify

---

## 💡 Pourquoi ça arrive?

Vite remplace `import.meta.env.VITE_*` **au moment du build**.

- **Build local:** Lit ton fichier `.env` ✅
- **Build Netlify:** Ne connaît pas ton `.env` (pas commit) ❌
- **Solution:** Dire à Netlify les variables via leur UI/CLI

---

## 🚀 Commande rapide pour tester MAINTENANT

```bash
npm run build && netlify deploy --prod --dir=dist
```

Puis va sur ton site Netlify et vérifie que l'interface s'affiche sans erreur!
