# ⚡ QUICK REFERENCE - DESIGN 10X

## 🎨 **IMPORT & SETUP**

```tsx
import { designSystem, getProgressColor, getBadgeVariant } from '../../lib/designSystem10X';
```

---

## 📦 **COMPOSANTS READY-TO-USE**

### **1. PAGE HEADER**

```tsx
<div className={designSystem.components.pageHeader.container}>
  <div className={designSystem.components.pageHeader.left}>
    <div className={designSystem.components.pageHeader.indicator}>
      <div className={designSystem.components.pageHeader.pulse} />
      <span className={designSystem.components.pageHeader.subtitle}>
        Section
      </span>
    </div>
    <h1 className={designSystem.components.pageHeader.title}>
      Page Title
    </h1>
  </div>
  <div className={designSystem.components.pageHeader.right}>
    <div className={designSystem.typography.numberMedium}>42</div>
    <div className={designSystem.typography.label}>Total</div>
  </div>
</div>
```

---

### **2. STAT CARD**

```tsx
<motion.div
  whileHover={{ y: -4 }}
  className={designSystem.components.statCard.base}
>
  <div className={designSystem.components.statCard.header}>
    <Users className={designSystem.components.statCard.icon + ' text-blue-500'} />
    <span className={designSystem.components.statCard.number}>42</span>
  </div>
  <div className={designSystem.components.statCard.label}>
    Total patients
  </div>
  <div className={designSystem.components.statCard.secondary + ' text-blue-600'}>
    +5 ce mois
  </div>
</motion.div>
```

---

### **3. CARD SIMPLE**

```tsx
<div className={designSystem.components.card.base}>
  Content here
</div>

// Interactive
<div className={`
  ${designSystem.components.card.base}
  ${designSystem.components.card.interactive}
`}>
  Clickable content
</div>
```

---

### **4. BUTTON**

```tsx
// Primary
<button className={designSystem.components.button.primary}>
  <Plus className="w-5 h-5" />
  Action
</button>

// Success
<button className={designSystem.components.button.success}>
  <Check className="w-5 h-5" />
  Valider
</button>

// Secondary
<button className={designSystem.components.button.secondary}>
  Annuler
</button>

// Ghost
<button className={designSystem.components.button.ghost}>
  Options
</button>

// Icon only
<button className={designSystem.components.button.icon}>
  <Edit className="w-4 h-4" />
</button>
```

---

### **5. PROGRESS BAR**

```tsx
const progress = 62; // %

<div className={designSystem.components.progressBar.container}>
  <motion.div
    initial={{ width: 0 }}
    animate={{ width: `${progress}%` }}
    className={`
      ${designSystem.components.progressBar.fill}
      ${getProgressColor(progress)}
    `}
  />
</div>
```

---

### **6. LIST**

```tsx
<div className={designSystem.components.list.container}>
  <div className={designSystem.components.list.header}>
    <h3 className={designSystem.components.list.headerTitle}>
      Items
    </h3>
    <span className={designSystem.components.list.headerBadge}>
      {items.length} total
    </span>
  </div>

  <div className={designSystem.components.list.divider}>
    {items.map((item, index) => (
      <motion.div
        key={item.id}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.05 }}
        className={designSystem.components.list.item}
      >
        {/* Item content */}
      </motion.div>
    ))}
  </div>
</div>
```

---

### **7. BADGE**

```tsx
<span className={`
  ${designSystem.components.badge.base}
  ${getBadgeVariant(status)}
`}>
  <Activity className="w-3 h-3" />
  {label}
</span>

// Or manual
<span className={`
  ${designSystem.components.badge.base}
  ${designSystem.components.badge.success}
`}>
  Actif
</span>
```

---

### **8. INFO BLOCK**

```tsx
<div className={`
  ${designSystem.components.infoBlock.base}
  ${designSystem.components.infoBlock.primary}
`}>
  <div className="text-xs font-medium text-blue-600 mb-1">
    Info
  </div>
  <div className="text-sm text-foreground/80">
    Message content
  </div>
</div>
```

---

### **9. EMPTY STATE**

```tsx
<div className={designSystem.components.emptyState.container}>
  <div className={designSystem.components.emptyState.icon}>
    <Users className="w-10 h-10 text-neutral-400" />
  </div>
  <h3 className={designSystem.components.emptyState.title}>
    Aucun résultat
  </h3>
  <p className={designSystem.components.emptyState.description}>
    Description here
  </p>
  <button className={designSystem.components.button.primary + ' mt-6'}>
    <Plus className="w-5 h-5" />
    Action
  </button>
</div>
```

---

### **10. LOADING**

```tsx
<div className={designSystem.components.loading.container}>
  <div className="flex flex-col items-center gap-4">
    <div className={designSystem.components.loading.spinner} />
    <p className={designSystem.components.loading.text}>
      Chargement...
    </p>
  </div>
</div>
```

---

## 🎨 **TYPOGRAPHY**

```tsx
// Headlines
<h1 className={designSystem.typography.h1}>Titre principal</h1>
<h2 className={designSystem.typography.h2}>Sous-titre</h2>
<h3 className={designSystem.typography.h3}>Section</h3>

// Body
<p className={designSystem.typography.body}>Texte normal</p>
<p className={designSystem.typography.bodySmall}>Texte petit</p>

// Special
<span className={designSystem.typography.caption}>
  Label uppercase
</span>
<span className={designSystem.typography.label}>
  Label medium
</span>

// Numbers
<div className={designSystem.typography.numberLarge}>15:43</div>
<div className={designSystem.typography.numberMedium}>42</div>
<div className={designSystem.typography.numberSmall}>8</div>
```

---

## 📐 **LAYOUTS**

```tsx
// Stats grid (responsive 1-2-4 cols)
<div className={designSystem.layouts.statsGrid}>
  {/* Stats cards */}
</div>

// Cards grid (responsive 1-2-3 cols)
<div className={designSystem.layouts.cardsGrid}>
  {/* Cards */}
</div>

// Flex patterns
<div className={designSystem.layouts.spaceBetween}>
  <div>Left</div>
  <div>Right</div>
</div>

<div className={designSystem.layouts.centered}>
  Centered content
</div>

<div className={designSystem.layouts.stack}>
  <div>Item 1</div>
  <div>Item 2</div>
</div>

<div className={designSystem.layouts.row}>
  <Icon />
  <span>Text</span>
</div>

// Max widths
<div className={designSystem.layouts.maxWidth.lg}>
  Constrained content
</div>
```

---

## 🎨 **COLORS**

```tsx
// Primary (blue)
className={designSystem.colors.primary[500]}  // bg
className={designSystem.colors.primary.text}  // text
className={designSystem.colors.primary.border} // border

// Success (green)
className={designSystem.colors.success[500]}
className={designSystem.colors.success.text}

// Warning (orange)
className={designSystem.colors.warning[500]}
className={designSystem.colors.warning.text}

// Danger (red)
className={designSystem.colors.danger[500]}
className={designSystem.colors.danger.text}

// Neutral
className={designSystem.colors.neutral[100]}
className={designSystem.colors.neutral.text}
className={designSystem.colors.neutral.textSecondary}
className={designSystem.colors.neutral.border}
```

---

## 🎭 **ANIMATIONS**

```tsx
// Hover effects
<motion.div whileHover={{ y: -4 }}>
  Lift on hover
</motion.div>

<motion.div whileHover={{ scale: 1.02 }}>
  Scale on hover
</motion.div>

// Entrance
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
>
  Fade & slide in
</motion.div>

// Stagger
{items.map((item, index) => (
  <motion.div
    key={item.id}
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: index * 0.05 }}
  >
    {item.name}
  </motion.div>
))}

// Exit
<AnimatePresence>
  {show && (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      Content
    </motion.div>
  )}
</AnimatePresence>
```

---

## 🔧 **HELPERS**

```tsx
// Progress color
const color = getProgressColor(percentage);
// Returns: orange (0-50%), blue (51-99%), green (100%)

// Badge variant
const variant = getBadgeVariant(status);
// Returns: appropriate badge class based on status
```

---

## 📋 **COMPLETE PAGE TEMPLATE**

```tsx
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { designSystem, getProgressColor } from '../../lib/designSystem10X';
import { Users, Plus, Search, X } from 'lucide-react';

export function MyPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Header
  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-gold-50/20 p-8">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className={designSystem.components.pageHeader.container}>
          <div className={designSystem.components.pageHeader.left}>
            <div className={designSystem.components.pageHeader.indicator}>
              <div className={designSystem.components.pageHeader.pulse} />
              <span className={designSystem.components.pageHeader.subtitle}>
                Module
              </span>
            </div>
            <h1 className={designSystem.components.pageHeader.title}>
              Ma Page
            </h1>
          </div>
          <div className={designSystem.components.pageHeader.right}>
            <div className={designSystem.typography.numberMedium}>
              {items.length}
            </div>
            <div className={designSystem.typography.label}>Total</div>
          </div>
        </div>

        {/* Progress (optional) */}
        <div className={designSystem.components.progressBar.container}>
          <motion.div
            animate={{ width: '62%' }}
            className={`
              ${designSystem.components.progressBar.fill}
              ${designSystem.components.progressBar.blue}
            `}
          />
        </div>

        {/* Stats */}
        <div className={designSystem.layouts.statsGrid}>
          <motion.div
            whileHover={{ y: -4 }}
            className={designSystem.components.statCard.base}
          >
            <div className={designSystem.components.statCard.header}>
              <Users className={designSystem.components.statCard.icon + ' text-blue-500'} />
              <span className={designSystem.components.statCard.number}>42</span>
            </div>
            <div className={designSystem.components.statCard.label}>
              Total
            </div>
          </motion.div>
        </div>

        {/* Search & Actions */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher..."
              className="w-full pl-12 pr-4 py-3 bg-white border-2 border-neutral-200 hover:border-blue-300 focus:border-blue-500 focus:outline-none rounded-xl transition-all"
            />
          </div>
          <button className={designSystem.components.button.primary}>
            <Plus className="w-5 h-5" />
            Nouveau
          </button>
        </div>

        {/* List */}
        {loading ? (
          <div className={designSystem.components.loading.container}>
            <div className="flex flex-col items-center gap-4">
              <div className={designSystem.components.loading.spinner} />
              <p className={designSystem.components.loading.text}>
                Chargement...
              </p>
            </div>
          </div>
        ) : items.length === 0 ? (
          <div className={designSystem.components.emptyState.container}>
            <div className={designSystem.components.emptyState.icon}>
              <Users className="w-10 h-10 text-neutral-400" />
            </div>
            <h3 className={designSystem.components.emptyState.title}>
              Aucun élément
            </h3>
            <p className={designSystem.components.emptyState.description}>
              Commencez par ajouter votre premier élément
            </p>
          </div>
        ) : (
          <div className={designSystem.components.list.container}>
            <div className={designSystem.components.list.header}>
              <h3 className={designSystem.components.list.headerTitle}>
                Éléments
              </h3>
              <span className={designSystem.components.list.headerBadge}>
                {items.length} total
              </span>
            </div>
            <div className={designSystem.components.list.divider}>
              {items.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={designSystem.components.list.item}
                >
                  {/* Item content */}
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
```

---

## 🎯 **RÈGLES D'OR**

```
✅ Toujours utiliser designSystem tokens
✅ Max 3 couleurs par page
✅ Max 3 niveaux de shadows
✅ Spacing 8px system (2, 4, 6, 8, 12)
✅ Typography hiérarchisée (h1→h6→body)
✅ Animations subtiles (4px lift, 2% scale)
✅ Progressive disclosure (hover = actions)
✅ Empty states pro (icon + title + CTA)
✅ Loading states stylés (spinner + text)
✅ Responsive (statsGrid, cardsGrid)
```

---

## ❌ **À ÉVITER**

```
❌ Gradients partout
❌ Emojis dans headers
❌ Couleurs vives non justifiées
❌ Shadow-2xl ou shadow-3xl
❌ Font-bold partout
❌ Border-4 ou plus
❌ Icons trop gros (> 6x6 pour stats)
❌ Spacing random (13px, 7px, etc)
❌ Animations flashy
❌ Text center everywhere
```

---

## 🚀 **PRÊT À TRANSFORMER!**

1. **Copie le template complet** ci-dessus
2. **Replace le contenu** par tes données
3. **Ajuste les stats** selon tes besoins
4. **Customise les items** de la liste
5. **Test & iterate!**

**C'est aussi simple que ça!** ⚡✨
