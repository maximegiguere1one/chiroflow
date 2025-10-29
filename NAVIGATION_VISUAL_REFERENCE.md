# 🎨 Référence Visuelle - Navigation

## 📱 Structures de Navigation

### 1. Header Public (Desktop)

```
┌─────────────────────────────────────────────────────────────────────────┐
│ 🏠 Dre Janie Leblanc    Services  Approche  Témoignages  Contact       │
│    Chiropraticienne                                                     │
│                                                                         │
│         📅 Réserver ▼    👤 Portails ▼         [Prendre RDV]           │
│             │                │                                          │
│             └─ Réservation   └─ Portail Patient                        │
│                en ligne         Espace Admin                           │
│                Modifier RDV                                            │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2. Header Public (Mobile)

```
┌─────────────────────────────┐
│ 🏠 Dre Janie      ☰ Menu   │
│    Leblanc                  │
└─────────────────────────────┘

Menu ouvert:
┌─────────────────────────────┐
│ 🏠 Dre Janie      ✕ Fermer │
│    Leblanc                  │
├─────────────────────────────┤
│                             │
│ Services                    │
│ Approche                    │
│ Témoignages                │
│ Contact                     │
│                             │
│ ───────────────────────     │
│                             │
│ 📅 RÉSERVER                 │
│   📅 Réservation en ligne   │
│   📝 Modifier mon RDV       │
│                             │
│ 👤 PORTAILS                 │
│   👤 Portail Patient        │
│   🔐 Espace Admin           │
│                             │
│ ───────────────────────     │
│                             │
│ [Prendre rendez-vous]       │
│                             │
└─────────────────────────────┘
```

### 3. Sidebar Admin (Desktop)

```
┌────────────────────────────────────────────────────────────────┐
│ Sidebar (280px)          │  Main Content                       │
├──────────────────────────┼─────────────────────────────────────┤
│                          │                                     │
│ 👤 admin@email.com       │  ← Breadcrumbs                      │
│    Administrateur        │  🏠 Accueil > Admin > Dashboard     │
│                          │                                     │
│ ▼ 📌 Principal           │  ┌──────────────────────────┐       │
│   📊 Tableau de bord ●   │  │  Dashboard Content       │       │
│   📅 Calendrier          │  │                          │       │
│   ⚡ Actions rapides     │  │  Stats, Charts, etc.     │       │
│                          │  │                          │       │
│ ▼ 📋 Gestion             │  └──────────────────────────┘       │
│   👥 Patients            │                                     │
│   🕐 Rendez-vous         │                                     │
│   📝 Liste d'attente     │                                     │
│   🔄 Re-réservations     │                                     │
│                          │                                     │
│ ▶ 💰 Finances            │                                     │
│                          │                                     │
│ ▶ 📈 Analyses            │                                     │
│                          │                                     │
│ ▶ ⚙️ Configuration       │                                     │
│                          │                                     │
│ ─────────────────────    │                                     │
│                          │                                     │
│ 🏠 Voir le site          │                                     │
│ 🚪 Déconnexion           │                                     │
│                          │                                     │
└──────────────────────────┴─────────────────────────────────────┘

Légende:
● = Vue active (barre latérale gold)
▼ = Section dépliée
▶ = Section repliée
```

### 4. Sidebar Admin (Mobile - Fermée)

```
┌─────────────────────────────┐
│                             │
│  [●] Toggle                 │
│       (floating button)     │
│                             │
│    Main Content             │
│    (full width)             │
│                             │
│                             │
└─────────────────────────────┘
```

### 5. Sidebar Admin (Mobile - Ouverte)

```
┌─────────────────────────────┐
│ ████ Overlay (dark) ████    │
│ █                      █    │
│ █┌────────────────────┐█    │
│ █│ 👤 admin@email     ││█    │
│ █│    Admin        ✕  ││█    │
│ █├────────────────────┤│█    │
│ █│                    ││█    │
│ █│ ▼ 📌 Principal     ││█    │
│ █│   📊 Dashboard  ●  ││█    │
│ █│   📅 Calendrier    ││█    │
│ █│   ⚡ Actions       ││█    │
│ █│                    ││█    │
│ █│ ▼ 📋 Gestion       ││█    │
│ █│   👥 Patients      ││█    │
│ █│   🕐 RDV           ││█    │
│ █│   ...              ││█    │
│ █│                    ││█    │
│ █│ ──────────────     ││█    │
│ █│ 🏠 Voir site       ││█    │
│ █│ 🚪 Déconnexion     ││█    │
│ █└────────────────────┘│█    │
│ █                      █    │
│ ████████████████████████    │
└─────────────────────────────┘

Tap sur overlay → Ferme sidebar
```

---

## 🎨 États Visuels

### Items de Menu (États)

```
┌─────────────────────────────┐
│ Default (repos)             │
│ 📊 Tableau de bord          │
│    text-neutral-700         │
└─────────────────────────────┘

┌─────────────────────────────┐
│ Hover                       │
│ 📊 Tableau de bord          │
│    bg-neutral-50            │
│    text-neutral-900         │
└─────────────────────────────┘

┌─────────────────────────────┐
│● Active                      │
│ 📊 Tableau de bord          │
│    bg-gold-50               │
│    text-gold-700            │
│    border-l: gold-600       │
└─────────────────────────────┘

┌─────────────────────────────┐
│ Focus (keyboard)            │
│ 📊 Tableau de bord          │
│    ring-2 ring-gold-500     │
└─────────────────────────────┘
```

### Dropdowns (Animation)

```
État fermé:
┌─────────────────┐
│ Réserver ▼      │
└─────────────────┘

État ouvert (fade-in + slide-down):
┌─────────────────┐
│ Réserver ▼      │
└─────────────────┘
  │
  └─┬─────────────────────────┐
    │ 📅 Réservation en ligne │
    │ 📝 Modifier mon RDV     │
    └─────────────────────────┘

Animation: 200ms ease-in-out
```

---

## 📏 Dimensions & Espacements

### Header

```
┌─────────────────────────────────────────────────────────────────┐
│ ↕ 80px                                                          │
│                                                                 │
│ ← 24px → Logo    ← 48px spacing → Menu items ← 32px → CTA     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

Hauteur:          80px (5rem)
Padding H:        24px (1.5rem) mobile, 48px (3rem) desktop
Logo height:      32px
Nav item spacing: 48px (3rem)
```

### Sidebar

```
┌────────────────────────┐
│ ↔ 280px               │
│                        │
│ Header: 80px ↕         │
│                        │
│ ← 12px padding →       │
│                        │
│ Item: 44px ↕           │
│  ├─ Icon: 20px         │
│  └─ Text: 14px         │
│                        │
│ Gap: 4px ↕             │
│                        │
│ Section gap: 24px ↕    │
│                        │
└────────────────────────┘

Largeur:          280px (17.5rem)
Item height:      44px (touch target)
Icon size:        20px
Padding:          12px (0.75rem)
Section spacing:  24px (1.5rem)
```

### Breadcrumbs

```
┌──────────────────────────────────────────────────┐
│ ↕ 32px                                          │
│                                                 │
│ 🏠 Accueil  >  Admin  >  Patients              │
│ ← 16px →   8px   16px  8px                     │
│                                                 │
└──────────────────────────────────────────────────┘

Height:           32px
Item spacing:     8px
Icon size:        16px
Text size:        14px
Separator:        > (ChevronRight icon)
```

---

## 🎨 Palette de Couleurs

### Navigation Colors

```
┌──────────────────────────────────────┐
│ Text (default)                       │
│ #374151 (Neutral-700)                │
│ ████████████████████████████████     │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│ Text (hover)                         │
│ #111827 (Neutral-900)                │
│ ████████████████████████████████████ │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│ Active (background)                  │
│ #FEF3C7 (Gold-50)                    │
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│ Active (text & accent)               │
│ #D97706 (Gold-600)                   │
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓     │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│ Borders                              │
│ #E5E7EB (Neutral-200)                │
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│ Backgrounds                          │
│ #FFFFFF (White)                      │
│                                      │
└──────────────────────────────────────┘
```

---

## 📱 Responsive Breakpoints (Visual)

### Mobile (< 640px)

```
┌───────────────┐
│   Header      │  ← Stack vertical
│   (collapsed) │  ← Menu hamburger
│               │
│   Content     │  ← Full width
│   Full Width  │
│               │
└───────────────┘
```

### Tablet (640px - 1024px)

```
┌─────────────────────────┐
│   Header (horizontal)   │
│                         │
├─────────────────────────┤
│                         │
│   Content Full Width    │
│   (Sidebar on demand)   │
│                         │
└─────────────────────────┘
```

### Desktop (≥ 1024px)

```
┌───────┬────────────────┐
│       │   Header       │
│ Side  ├────────────────┤
│ bar   │                │
│       │    Content     │
│ 280px │                │
│       │                │
└───────┴────────────────┘
```

---

## 🔄 Flux de Navigation

### Parcours Utilisateur Public

```
Arrivée sur site
      │
      ├─→ Header Logo ────────→ Accueil
      │
      ├─→ Menu Services ──────→ #services (scroll)
      │
      ├─→ Dropdown Réserver ──→ /booking
      │   └─→ Modifier RDV ────→ Modal
      │
      └─→ CTA Prendre RDV ────→ Modal Appointment

Modal Appointment
      │
      ├─→ Formulaire complété ─→ Confirmation
      └─→ Fermer ──────────────→ Retour page
```

### Parcours Admin

```
Login (/admin)
      │
      └─→ Auth Success
            │
            └─→ Dashboard (/admin/dashboard)
                  │
                  ├─→ Sidebar: Patients ─────→ /admin/patients
                  │                                  │
                  │                                  └─→ Breadcrumb: Accueil ─→ Dashboard
                  │
                  ├─→ Sidebar: Calendrier ───→ /admin/calendar
                  │
                  ├─→ Quick Action ──────────→ Modal SOAP
                  │
                  └─→ Déconnexion ───────────→ /admin (logout)
```

---

## ⌨️ Navigation au Clavier

### Raccourcis Globaux

```
Tab           → Focus élément suivant
Shift + Tab   → Focus élément précédent
Enter/Space   → Activer élément
Escape        → Fermer modal/dropdown
```

### Raccourcis Admin (Ctrl/Cmd + ...)

```
Ctrl + N  →  Nouveau patient
Ctrl + R  →  Rendez-vous
Ctrl + S  →  Note SOAP rapide
Ctrl + K  →  Calendrier
Ctrl + B  →  Facturation
?         →  Aide raccourcis
```

### Ordre de Focus (Tab Order)

```
Header:
1. Logo
2. Service
3. Approche
4. Témoignages
5. Contact
6. Dropdown Réserver
7. Dropdown Portails
8. CTA Button
9. Mobile menu toggle

Sidebar Admin:
1. Profile area
2. Section header (Principal)
3. Dashboard
4. Calendrier
5. Actions rapides
6. Section header (Gestion)
7. Patients
... etc
```

---

## 🎭 Animations & Transitions

### Timings

```
Fast:     150ms   → Hover effects, focus
Normal:   200ms   → Dropdowns, sidebar toggle
Slow:     300ms   → Page transitions, modals

Easing:
- ease-in-out  → Most transitions
- ease-out     → Entrances
- ease-in      → Exits
```

### Exemples

```css
/* Hover state */
.nav-item {
  transition: all 150ms ease-in-out;
}

/* Dropdown open */
.dropdown {
  animation: fade-in 200ms ease-out,
             slide-down 200ms ease-out;
}

/* Sidebar slide */
.sidebar {
  transition: transform 300ms ease-in-out;
}
```

---

## 📊 Hiérarchie Visuelle

### Poids Visuels

```
1. Primary CTA (le plus important)
   ┌──────────────────────────┐
   │  [Prendre rendez-vous]   │  ← Bold, colored, large
   └──────────────────────────┘

2. Section headers
   📌 PRINCIPAL                  ← Uppercase, small, bold

3. Active navigation
   ● Tableau de bord            ← Bold, colored, indicator

4. Normal navigation
   Patients                     ← Medium weight

5. Secondary text
   Administrateur               ← Light, small
```

### Espacements (Importance)

```
Importance Haute:   48px gap
Importance Moyenne: 24px gap
Importance Basse:   12px gap
Items liés:         4px gap
```

---

## ♿ Accessibilité Visuelle

### Contraste (WCAG AA)

```
✅ Pass: 4.5:1 minimum (texte normal)
┌────────────────────────┐
│ #374151 sur #FFFFFF    │
│ Contrast: 8.9:1 ✓      │
└────────────────────────┘

✅ Pass: 3:1 minimum (large text)
┌────────────────────────┐
│ #D97706 sur #FEF3C7    │
│ Contrast: 5.2:1 ✓      │
└────────────────────────┘

❌ Fail: Insufficient
┌────────────────────────┐
│ #FEF3C7 sur #FFFFFF    │
│ Contrast: 1.1:1 ✗      │
└────────────────────────┘
```

### Focus Indicators

```
Keyboard focus:
┌─────────────────────────────┐
│ ┏━━━━━━━━━━━━━━━━━━━━━━━┓ │
│ ┃ [Prendre rendez-vous] ┃ │
│ ┗━━━━━━━━━━━━━━━━━━━━━━━┛ │
└─────────────────────────────┘
ring-2 ring-gold-500
```

### Screen Reader Labels

```
<nav aria-label="Navigation principale">
  <button aria-expanded="false"
          aria-controls="mobile-menu"
          aria-label="Ouvrir le menu de navigation">
    ☰
  </button>
</nav>
```

---

## 📱 Touch Targets

### Minimum Sizes (44x44px)

```
✅ Correct:
┌────────────────┐
│                │
│   [Button]     │  44px minimum
│                │
└────────────────┘
    44px min

❌ Trop petit:
┌──────┐
│ Btn  │  32px
└──────┘

❌ Touch overlap:
[Btn1][Btn2][Btn3]  ← Pas d'espace entre
     8px min ↕
```

---

## 💡 Légende des Symboles

```
● Active state
▼ Section dépliée
▶ Section repliée
🏠 Home
👤 User
📅 Calendar
💰 Money
📊 Analytics
⚙️ Settings
✕ Close
☰ Menu
← → ↑ ↓ Directions
```

---

**Note:** Ces représentations ASCII sont des simplifications pour la documentation.
Le design final utilise des composants React avec Tailwind CSS et Framer Motion.

Pour voir le design en action, consultez:
- `src/components/navigation/ImprovedHeader.tsx`
- `src/components/navigation/AdminSidebar.tsx`
- `src/components/navigation/Breadcrumbs.tsx`

---

*Créé pour documenter visuellement la nouvelle architecture de navigation*
