import { useState, useEffect } from 'react';

export const useLazyAnimation = (delay = 0) => {
  const [shouldAnimate, setShouldAnimate] = useState(false);

  useEffect(() => {
    if (document.readyState === 'complete') {
      const timer = setTimeout(() => {
        setShouldAnimate(true);
      }, delay);
      return () => clearTimeout(timer);
    } else {
      const handleLoad = () => {
        const timer = setTimeout(() => {
          setShouldAnimate(true);
        }, delay);
        return () => clearTimeout(timer);
      };

      window.addEventListener('load', handleLoad, { once: true });
      return () => window.removeEventListener('load', handleLoad);
    }
  }, [delay]);

  return shouldAnimate;
};

export const useAfterFirstPaint = () => {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if ('requestIdleCallback' in window) {
      const idleCallback = requestIdleCallback(() => {
        setIsReady(true);
      }, { timeout: 1000 });

      return () => cancelIdleCallback(idleCallback);
    } else {
      const timer = setTimeout(() => {
        setIsReady(true);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, []);

  return isReady;
};

export const LAZY_ANIMATION_PRIORITIES = {
  critical: 0,
  high: 100,
  medium: 300,
  low: 500,
  veryLow: 1000,
} as const;
