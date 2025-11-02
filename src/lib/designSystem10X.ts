/**
 * 🎨 DESIGN SYSTEM 10X
 *
 * Système de design unifié pour toute l'application
 * Basé sur les principes: Less But Better, Clear Hierarchy, Zero Friction
 */

export const designSystem = {
  /**
   * COULEURS - Palette minimaliste
   */
  colors: {
    primary: {
      50: 'bg-blue-50',
      100: 'bg-blue-100',
      500: 'bg-blue-500',
      600: 'bg-blue-600',
      text: 'text-blue-600',
      border: 'border-blue-200',
      hover: 'hover:bg-blue-600'
    },
    success: {
      50: 'bg-green-50',
      100: 'bg-green-100',
      500: 'bg-green-500',
      600: 'bg-green-600',
      text: 'text-green-600',
      border: 'border-green-200',
      hover: 'hover:bg-green-600'
    },
    warning: {
      50: 'bg-orange-50',
      100: 'bg-orange-100',
      500: 'bg-orange-500',
      600: 'bg-orange-600',
      text: 'text-orange-600',
      border: 'border-orange-200',
      hover: 'hover:bg-orange-600'
    },
    danger: {
      50: 'bg-red-50',
      100: 'bg-red-100',
      500: 'bg-red-500',
      600: 'bg-red-600',
      text: 'text-red-600',
      border: 'border-red-200',
      hover: 'hover:bg-red-600'
    },
    accent: {
      50: 'bg-gold-50',
      500: 'bg-gold-500',
      600: 'bg-gold-600',
      text: 'text-gold-600',
      border: 'border-gold-200'
    },
    neutral: {
      50: 'bg-neutral-50',
      100: 'bg-neutral-100',
      200: 'bg-neutral-200',
      text: 'text-foreground',
      textSecondary: 'text-foreground/60',
      textMuted: 'text-foreground/40',
      border: 'border-neutral-200',
      borderLight: 'border-neutral-100'
    }
  },

  /**
   * TYPOGRAPHY - Hiérarchie claire
   */
  typography: {
    // Headlines
    h1: 'text-5xl font-light tracking-tight',
    h2: 'text-4xl font-light',
    h3: 'text-3xl font-light',
    h4: 'text-2xl font-light',
    h5: 'text-xl font-medium',
    h6: 'text-lg font-medium',

    // Body
    bodyLarge: 'text-lg font-normal',
    body: 'text-base font-normal',
    bodySmall: 'text-sm font-normal',

    // Special
    caption: 'text-xs font-medium uppercase tracking-wider',
    label: 'text-sm font-medium',
    tiny: 'text-xs font-normal',

    // Numbers (tabular)
    number: 'tabular-nums',
    numberLarge: 'text-6xl font-extralight tabular-nums tracking-tight',
    numberMedium: 'text-3xl font-light tabular-nums',
    numberSmall: 'text-2xl font-light tabular-nums'
  },

  /**
   * SPACING - 8px system
   */
  spacing: {
    micro: 'gap-2 p-2',     // 8px
    small: 'gap-4 p-4',     // 16px
    medium: 'gap-6 p-6',    // 24px
    large: 'gap-8 p-8',     // 32px
    xl: 'gap-12 p-12'       // 48px
  },

  /**
   * RADIUS - 3 niveaux
   */
  radius: {
    standard: 'rounded-xl',  // 12px
    large: 'rounded-2xl',    // 16px
    soft: 'rounded-3xl',     // 24px - hero sections only
    full: 'rounded-full'
  },

  /**
   * SHADOWS - 3 niveaux
   */
  shadows: {
    subtle: 'shadow-sm',
    default: 'shadow-md',
    elevated: 'shadow-xl'
  },

  /**
   * COMPOSANTS PRÉ-CONSTRUITS
   */
  components: {
    // Cards
    card: {
      base: 'bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all',
      interactive: 'cursor-pointer hover:border-blue-200',
      elevated: 'shadow-md hover:shadow-xl'
    },

    // Stats cards
    statCard: {
      base: 'bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all cursor-pointer',
      header: 'flex items-center justify-between mb-4',
      icon: 'w-5 h-5',
      number: 'text-3xl font-light tabular-nums',
      label: 'text-sm font-medium text-foreground/70',
      secondary: 'mt-2 text-xs font-medium'
    },

    // Buttons
    button: {
      // Primary
      primary: 'flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl transition-all shadow-lg hover:shadow-xl font-medium',

      // Success
      success: 'flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-xl transition-all shadow-lg hover:shadow-xl font-medium',

      // Warning
      warning: 'flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl transition-all shadow-lg hover:shadow-xl font-medium',

      // Secondary
      secondary: 'flex items-center justify-center gap-2 px-4 py-3 bg-white hover:bg-neutral-50 border-2 border-neutral-200 hover:border-blue-300 text-foreground rounded-xl transition-all font-medium',

      // Ghost
      ghost: 'flex items-center justify-center gap-2 px-4 py-3 hover:bg-neutral-100 text-foreground rounded-xl transition-all',

      // Icon button
      icon: 'p-2.5 hover:bg-neutral-100 rounded-lg transition-all',
      iconColored: 'p-2.5 rounded-lg transition-all'
    },

    // Headers
    pageHeader: {
      container: 'flex items-start justify-between mb-6',
      left: 'space-y-2',
      indicator: 'flex items-center gap-2 mb-2',
      pulse: 'w-2 h-2 bg-green-500 rounded-full animate-pulse',
      subtitle: 'text-sm font-medium text-foreground/60 uppercase tracking-wider',
      title: 'text-5xl font-light text-foreground tracking-tight',
      right: 'text-right space-y-2'
    },

    // Progress bar
    progressBar: {
      container: 'relative h-3 bg-neutral-100 rounded-full overflow-hidden',
      fill: 'absolute inset-y-0 left-0 rounded-full transition-all duration-1000',
      orange: 'bg-gradient-to-r from-orange-400 to-orange-500',
      blue: 'bg-gradient-to-r from-blue-400 to-blue-500',
      green: 'bg-gradient-to-r from-green-400 to-green-500'
    },

    // Lists
    list: {
      container: 'bg-white border border-neutral-200 rounded-2xl overflow-hidden shadow-sm',
      header: 'px-6 py-4 border-b border-neutral-100 flex items-center justify-between',
      headerTitle: 'text-lg font-medium text-foreground',
      headerBadge: 'text-sm text-foreground/50',
      item: 'px-6 py-4 hover:bg-neutral-50 transition-colors cursor-pointer group',
      divider: 'divide-y divide-neutral-100'
    },

    // Badges
    badge: {
      base: 'inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider',
      primary: 'bg-blue-500 text-white',
      success: 'bg-green-500 text-white',
      warning: 'bg-orange-500 text-white',
      danger: 'bg-red-500 text-white',
      neutral: 'bg-neutral-200 text-foreground'
    },

    // Info blocks
    infoBlock: {
      base: 'rounded-xl p-4',
      primary: 'bg-blue-50 border border-blue-100',
      success: 'bg-green-50 border border-green-100',
      warning: 'bg-orange-50 border border-orange-100',
      neutral: 'bg-neutral-50 border border-neutral-100'
    },

    // Empty states
    emptyState: {
      container: 'flex flex-col items-center justify-center py-20',
      icon: 'w-20 h-20 bg-neutral-100 rounded-full flex items-center justify-center mb-6',
      title: 'text-2xl font-light text-foreground mb-2',
      description: 'text-foreground/60 text-center max-w-md'
    },

    // Loading
    loading: {
      spinner: 'w-12 h-12 border-4 border-gold-200 border-t-gold-600 rounded-full animate-spin',
      container: 'flex items-center justify-center py-20',
      text: 'text-foreground/60 font-light mt-4'
    }
  },

  /**
   * ANIMATIONS - Subtiles et purposeful
   */
  animations: {
    hover: {
      lift: 'hover:translate-y-[-4px] transition-transform',
      scale: 'hover:scale-[1.02] transition-transform',
      glow: 'hover:shadow-xl transition-shadow'
    },
    entrance: {
      fadeIn: 'animate-fadeIn',
      slideUp: 'animate-slideUp',
      scale: 'animate-scaleIn'
    }
  },

  /**
   * LAYOUT PATTERNS
   */
  layouts: {
    // Grid responsive
    statsGrid: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4',
    cardsGrid: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6',

    // Flex patterns
    spaceBetween: 'flex items-center justify-between',
    centered: 'flex items-center justify-center',
    stack: 'flex flex-col space-y-4',
    row: 'flex items-center gap-4',

    // Content widths
    maxWidth: {
      sm: 'max-w-2xl mx-auto',
      md: 'max-w-4xl mx-auto',
      lg: 'max-w-6xl mx-auto',
      xl: 'max-w-7xl mx-auto'
    }
  }
} as const;

/**
 * HELPER FUNCTIONS
 */

// Obtenir classe de couleur de progress selon %
export function getProgressColor(percentage: number): string {
  if (percentage === 100) return designSystem.components.progressBar.green;
  if (percentage > 50) return designSystem.components.progressBar.blue;
  return designSystem.components.progressBar.orange;
}

// Obtenir classe de badge selon status
export function getBadgeVariant(status: string): string {
  const map: Record<string, string> = {
    'active': designSystem.components.badge.success,
    'pending': designSystem.components.badge.warning,
    'completed': designSystem.components.badge.primary,
    'cancelled': designSystem.components.badge.danger,
    'default': designSystem.components.badge.neutral
  };
  return map[status] || map.default;
}

// Obtenir classe de bouton selon variant
export function getButtonVariant(variant: 'primary' | 'success' | 'warning' | 'secondary' | 'ghost' = 'primary'): string {
  return designSystem.components.button[variant];
}

/**
 * CONSTANTES UTILES
 */
export const TRANSITIONS = {
  fast: 'transition-all duration-150',
  normal: 'transition-all duration-300',
  slow: 'transition-all duration-500'
} as const;

export const FOCUS_RING = 'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2';

export const TRUNCATE = 'truncate overflow-hidden text-ellipsis';

export const SCREEN_READER_ONLY = 'sr-only';
