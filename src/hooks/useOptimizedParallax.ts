import { useEffect, useState, useRef } from 'react';
import { useReducedMotion } from './useReducedMotion';
import { throttle } from '../lib/animations/optimized';

interface ParallaxOptions {
  speed?: number;
  disableOnMobile?: boolean;
  enableGPU?: boolean;
}

export const useOptimizedParallax = (options: ParallaxOptions = {}) => {
  const {
    speed = 0.5,
    disableOnMobile = true,
    enableGPU = true,
  } = options;

  const [offset, setOffset] = useState(0);
  const prefersReducedMotion = useReducedMotion();
  const rafRef = useRef<number>();
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  useEffect(() => {
    if (prefersReducedMotion || (isMobile && disableOnMobile)) {
      setOffset(0);
      return;
    }

    const handleScroll = () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }

      rafRef.current = requestAnimationFrame(() => {
        const scrolled = window.scrollY;
        setOffset(scrolled * speed);
      });
    };

    const throttledScroll = throttle(handleScroll, 16);

    window.addEventListener('scroll', throttledScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', throttledScroll);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [speed, prefersReducedMotion, isMobile, disableOnMobile]);

  const style = enableGPU ? {
    transform: `translate3d(0, ${offset}px, 0)`,
    willChange: 'transform',
  } : {
    transform: `translateY(${offset}px)`,
  };

  return { offset, style };
};

export const useHorizontalParallax = (options: ParallaxOptions = {}) => {
  const {
    speed = 0.5,
    disableOnMobile = true,
    enableGPU = true,
  } = options;

  const [offset, setOffset] = useState(0);
  const prefersReducedMotion = useReducedMotion();
  const rafRef = useRef<number>();
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  useEffect(() => {
    if (prefersReducedMotion || (isMobile && disableOnMobile)) {
      setOffset(0);
      return;
    }

    const handleScroll = () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }

      rafRef.current = requestAnimationFrame(() => {
        const scrolled = window.scrollY;
        setOffset(scrolled * speed);
      });
    };

    const throttledScroll = throttle(handleScroll, 16);

    window.addEventListener('scroll', throttledScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', throttledScroll);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [speed, prefersReducedMotion, isMobile, disableOnMobile]);

  const style = enableGPU ? {
    transform: `translate3d(${offset}px, 0, 0)`,
    willChange: 'transform',
  } : {
    transform: `translateX(${offset}px)`,
  };

  return { offset, style };
};

export const useMouseParallax = (strength = 20) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const prefersReducedMotion = useReducedMotion();
  const rafRef = useRef<number>();
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  useEffect(() => {
    if (prefersReducedMotion || isMobile) {
      setPosition({ x: 0, y: 0 });
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }

      rafRef.current = requestAnimationFrame(() => {
        const x = (e.clientX - window.innerWidth / 2) / window.innerWidth;
        const y = (e.clientY - window.innerHeight / 2) / window.innerHeight;

        setPosition({
          x: x * strength,
          y: y * strength,
        });
      });
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [strength, prefersReducedMotion, isMobile]);

  const style = {
    transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
    willChange: 'transform',
  };

  return { position, style };
};
