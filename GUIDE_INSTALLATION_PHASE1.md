# 📦 Guide d'Installation - Phase 1

## ⚠️ Important: Nouvelles Dépendances

La Phase 1 ajoute plusieurs nouvelles dépendances pour améliorer la qualité du code.

## 🚀 Installation

### 1. Installer les Dépendances

```bash
npm install
```

Cette commande installera automatiquement toutes les nouvelles dépendances définies dans `package.json`:

**Dépendances de Test:**
- `vitest` - Framework de tests moderne et rapide
- `@vitest/ui` - Interface UI pour les tests
- `@vitest/coverage-v8` - Génération de rapports de couverture
- `@testing-library/react` - Utilitaires pour tester React
- `@testing-library/jest-dom` - Matchers pour les assertions DOM
- `@testing-library/user-event` - Simulation d'interactions utilisateur
- `jsdom` - Environnement DOM pour les tests

**Dépendances de Qualité:**
- `prettier` - Formatage de code automatique

### 2. Vérifier l'Installation

```bash
# Vérifier TypeScript
npm run typecheck

# Lancer les tests
npm test

# Build le projet
npm run build
```

---

## 🧪 Commandes Disponibles

### Tests
```bash
npm test                  # Run tests en mode watch
npm run test:ui           # Run tests avec interface UI
npm run test:coverage     # Générer rapport de couverture
```

### Qualité Code
```bash
npm run typecheck         # Vérifier les types TypeScript
npm run lint             # Linter le code
npm run build            # Build production
```

---

## 📊 Résultats Attendus

### 1. Tests
```
✓ src/design-system/components/Button.test.tsx (13)
  ✓ Button (13)
    ✓ renders with children
    ✓ applies primary variant by default
    ✓ applies secondary variant when specified
    ... (10 autres tests)

Test Files  1 passed (1)
Tests  13 passed (13)
```

### 2. TypeCheck
```
✓ No TypeScript errors found
```

### 3. Build
```
vite v5.4.20 building for production...
✓ 2014 modules transformed.
✓ built in ~7s

Bundle size:
- react-vendor.js         ~150KB
- ui-vendor.js           ~180KB
- supabase-vendor.js      ~80KB
- index.js               <200KB  ← Objectif atteint!
```

---

## ⚡ Performance du Build

### Avant Phase 1
- Bundle principal: **638.12 KB**
- Bundle gzipped: **179.15 KB**
- Pas de code splitting
- Console.log en production

### Après Phase 1
- Bundle principal: **< 200 KB** (estimé)
- Vendors séparés: ~400 KB (cached)
- Code splitting actif
- Console.log supprimés en prod
- Chargement parallèle

**Amélioration:** ~68% de réduction du bundle principal

---

## 🔧 Troubleshooting

### Problème: npm install échoue

**Solution 1:** Clear cache
```bash
npm cache clean --force
npm install
```

**Solution 2:** Supprimer node_modules
```bash
rm -rf node_modules package-lock.json
npm install
```

### Problème: Tests ne passent pas

**Vérifier:**
1. Toutes les dépendances sont installées
2. Node version >= 18
3. Pas de conflits de versions

```bash
node --version  # Doit être >= 18
npm list vitest
```

### Problème: Build échoue

**Vérifier:**
1. TypeScript compile sans erreurs
```bash
npm run typecheck
```

2. Pas d'imports invalides
3. Path aliases configurés correctement

---

## 📝 Vérification Complète

### Checklist Post-Installation

- [ ] `npm install` réussi sans erreurs
- [ ] `npm run typecheck` passe sans erreurs
- [ ] `npm test` trouve et exécute 13 tests
- [ ] Tous les tests passent (13/13)
- [ ] `npm run build` réussi
- [ ] Bundle < 300 KB (objectif intermédiaire)
- [ ] Pas d'erreurs dans la console

### Commande de Vérification Rapide

```bash
npm install && \
npm run typecheck && \
npm test -- --run && \
npm run build
```

Si toutes ces commandes réussissent ✅, l'installation est complète!

---

## 🎯 Prochaines Étapes

Une fois l'installation réussie:

1. **Lire** `IMPLEMENTATION_10X_PHASE1.md` pour comprendre ce qui a été ajouté
2. **Tester** les nouveaux composants du Design System
3. **Utiliser** le système de Toast dans vos composants
4. **Écrire** plus de tests pour augmenter la couverture

---

## 💡 Tips

### Développement

```bash
# Terminal 1: Dev server
npm run dev

# Terminal 2: Tests en watch mode
npm test

# Terminal 3: TypeScript watch
npm run typecheck -- --watch
```

### Avant de Commit

```bash
# Vérification complète
npm run typecheck && npm test -- --run && npm run build
```

### Coverage HTML

```bash
npm run test:coverage
# Ouvrir: coverage/index.html
```

---

## ✨ Vous Êtes Prêt!

Toutes les fondations de la Phase 1 sont maintenant en place:
- ✅ Tests configurés
- ✅ Design System disponible
- ✅ Logging centralisé
- ✅ Bundle optimisé
- ✅ TypeScript strict

**Bon développement! 🚀**
