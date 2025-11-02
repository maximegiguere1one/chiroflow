export const buttonHover = {
  scale: 1.02,
  transition: { duration: 0.2, ease: 'easeOut' }
};

export const buttonTap = {
  scale: 0.98,
  transition: { duration: 0.1 }
};

export const iconSpin = {
  rotate: 360,
  transition: { duration: 0.5, ease: 'easeInOut' }
};

export const iconBounce = {
  y: [0, -4, 0],
  transition: { duration: 0.4, ease: 'easeInOut' }
};

export const successPulse = {
  scale: [1, 1.05, 1],
  transition: { duration: 0.3, ease: 'easeInOut' }
};

export const shake = {
  x: [0, -8, 8, -8, 8, 0],
  transition: { duration: 0.4 }
};

export const slideInFromRight = {
  initial: { x: 100, opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: 100, opacity: 0 },
  transition: { duration: 0.3, ease: 'easeOut' }
};

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.2 }
};

export const scaleIn = {
  initial: { scale: 0.9, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  exit: { scale: 0.9, opacity: 0 },
  transition: { duration: 0.2 }
};
