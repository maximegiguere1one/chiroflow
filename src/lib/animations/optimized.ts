export const ANIMATION_DURATIONS = {
  instant: 0.15,
  fast: 0.25,
  normal: 0.35,
  slow: 0.5,
  verySlow: 0.8,
} as const;

export const ANIMATION_DELAYS = {
  none: 0,
  stagger: 0.05,
  section: 0.1,
  medium: 0.2,
  max: 0.8,
} as const;

export const ANIMATION_EASING = {
  smooth: [0.43, 0.13, 0.23, 0.96],
  sharp: [0.4, 0.0, 0.2, 1],
  elastic: [0.68, -0.55, 0.265, 1.55],
  apple: [0.25, 0.1, 0.25, 1],
} as const;

export const GPU_OPTIMIZED_STYLES = {
  willChange: 'transform',
  transform: 'translate3d(0,0,0)',
  backfaceVisibility: 'hidden' as const,
} as const;

export const REDUCED_MOTION_CONFIG = {
  initial: false,
  animate: {},
  transition: { duration: 0.01 },
} as const;

export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  return function (this: any, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};
