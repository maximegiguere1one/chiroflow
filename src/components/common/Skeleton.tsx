import React from 'react';
import { motion } from 'framer-motion';

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  animation?: 'pulse' | 'wave' | 'none';
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  width = '100%',
  height = '1rem',
  variant = 'rectangular',
  animation = 'pulse',
}) => {
  const baseClasses = 'bg-slate-200';

  const variantClasses = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: '',
    rounded: 'rounded-xl',
  };

  const animationVariants = {
    pulse: {
      opacity: [0.5, 1, 0.5],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
    wave: {
      backgroundPosition: ['200% 0', '-200% 0'],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: 'linear',
      },
    },
    none: {},
  };

  const waveStyle = animation === 'wave' ? {
    backgroundImage: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)',
    backgroundSize: '200% 100%',
  } : {};

  return (
    <motion.div
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      style={{
        width,
        height,
        ...waveStyle,
      }}
      animate={animation !== 'none' ? animationVariants[animation] : {}}
      aria-hidden="true"
    />
  );
};

export const HeroSkeleton: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-teal-50/30 to-slate-100">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center w-full">
      <Skeleton width="80%" height="3rem" className="mx-auto mb-8" variant="rounded" />
      <Skeleton width="90%" height="1.5rem" className="mx-auto mb-4" />
      <Skeleton width="85%" height="1.5rem" className="mx-auto mb-12" />

      <div className="flex justify-center gap-6 mb-16">
        <Skeleton width="200px" height="60px" variant="rounded" />
        <Skeleton width="200px" height="60px" variant="rounded" />
      </div>

      <div className="grid grid-cols-4 gap-6 max-w-4xl mx-auto">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} height="120px" variant="rounded" />
        ))}
      </div>
    </div>
  </div>
);

export const SectionSkeleton: React.FC<{ rows?: number }> = ({ rows = 3 }) => (
  <div className="py-32 max-w-7xl mx-auto px-4">
    <Skeleton width="300px" height="2rem" className="mx-auto mb-6" variant="rounded" />
    <Skeleton width="500px" height="1.5rem" className="mx-auto mb-12" />

    <div className="space-y-8">
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="flex items-start space-x-6">
          <Skeleton width="80px" height="80px" variant="rounded" />
          <div className="flex-1 space-y-3">
            <Skeleton width="60%" height="1.5rem" />
            <Skeleton width="90%" height="1rem" />
            <Skeleton width="80%" height="1rem" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

export const TestimonialSkeleton: React.FC = () => (
  <div className="py-32 max-w-7xl mx-auto px-4">
    <Skeleton width="300px" height="2rem" className="mx-auto mb-12" variant="rounded" />

    <div className="bg-white rounded-3xl p-8 max-w-4xl mx-auto">
      <div className="flex items-center space-x-4 mb-6">
        <Skeleton width="80px" height="80px" variant="circular" />
        <div className="flex-1">
          <Skeleton width="200px" height="1.5rem" className="mb-2" />
          <Skeleton width="150px" height="1rem" />
        </div>
      </div>

      <div className="space-y-3">
        <Skeleton width="100%" height="1rem" />
        <Skeleton width="95%" height="1rem" />
        <Skeleton width="90%" height="1rem" />
      </div>
    </div>
  </div>
);
