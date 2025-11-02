export const motionConfig = {
  spring: {
    soft: { type: 'spring' as const, stiffness: 50, damping: 20 },
    medium: { type: 'spring' as const, stiffness: 100, damping: 20 },
    bouncy: { type: 'spring' as const, stiffness: 300, damping: 25 },
    smooth: { type: 'spring' as const, stiffness: 80, damping: 30 },
  },

  ease: {
    smooth: [0.43, 0.13, 0.23, 0.96],
    sharp: [0.4, 0.0, 0.2, 1],
    apple: [0.25, 0.1, 0.25, 1],
    elastic: [0.68, -0.55, 0.265, 1.55],
  },

  duration: {
    instant: 0.2,
    fast: 0.3,
    normal: 0.5,
    slow: 0.8,
    verySlow: 1.2,
  },

  variants: {
    fadeIn: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
    },

    fadeInUp: {
      initial: { opacity: 0, y: 40 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: -40 },
    },

    fadeInDown: {
      initial: { opacity: 0, y: -40 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: 40 },
    },

    fadeInScale: {
      initial: { opacity: 0, scale: 0.8 },
      animate: { opacity: 1, scale: 1 },
      exit: { opacity: 0, scale: 0.8 },
    },

    slideInLeft: {
      initial: { x: -100, opacity: 0 },
      animate: { x: 0, opacity: 1 },
      exit: { x: 100, opacity: 0 },
    },

    slideInRight: {
      initial: { x: 100, opacity: 0 },
      animate: { x: 0, opacity: 1 },
      exit: { x: -100, opacity: 0 },
    },

    reveal: {
      initial: { clipPath: 'inset(0 100% 0 0)' },
      animate: { clipPath: 'inset(0 0% 0 0)' },
      exit: { clipPath: 'inset(0 0 0 100%)' },
    },
  },

  stagger: {
    fast: 0.05,
    normal: 0.1,
    slow: 0.2,
  },

  magnetic: {
    strength: 0.3,
    damping: 0.5,
  },
};

export const getStaggerChildren = (stagger = 0.1) => ({
  animate: {
    transition: {
      staggerChildren: stagger,
    },
  },
});

export const getDelayedAnimation = (delay = 0) => ({
  transition: {
    delay,
  },
});
