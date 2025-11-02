import { motion } from 'framer-motion';

interface SkeletonProps {
  width?: string;
  height?: string;
  className?: string;
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'full';
  animate?: boolean;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = 'w-full',
  height = 'h-4',
  className = '',
  rounded = 'md',
  animate = true
}) => {
  const roundedClasses = {
    none: '',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    full: 'rounded-full'
  };

  return (
    <motion.div
      className={`bg-neutral-200 ${width} ${height} ${roundedClasses[rounded]} ${className}`}
      animate={animate ? {
        opacity: [0.5, 1, 0.5],
      } : {}}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    />
  );
};

export const PatientCardSkeleton = () => (
  <div className="p-6 border-b border-neutral-200">
    <div className="flex items-start justify-between">
      <div className="flex-1 space-y-3">
        <div className="flex items-center gap-3">
          <Skeleton width="w-48" height="h-6" />
          <Skeleton width="w-20" height="h-6" rounded="full" />
        </div>
        <div className="space-y-2">
          <Skeleton width="w-64" height="h-4" />
          <Skeleton width="w-56" height="h-4" />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Skeleton width="w-10" height="h-10" rounded="lg" />
        <Skeleton width="w-10" height="h-10" rounded="lg" />
        <Skeleton width="w-10" height="h-10" rounded="lg" />
        <Skeleton width="w-10" height="h-10" rounded="lg" />
      </div>
    </div>
  </div>
);

export const TableSkeleton = ({ rows = 5 }: { rows?: number }) => (
  <div className="space-y-0">
    {Array.from({ length: rows }).map((_, i) => (
      <PatientCardSkeleton key={i} />
    ))}
  </div>
);

export const FormSkeleton = () => (
  <div className="space-y-6">
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="space-y-2">
        <Skeleton width="w-32" height="h-4" />
        <Skeleton width="w-full" height="h-12" rounded="lg" />
      </div>
    ))}
  </div>
);

export const CardSkeleton = () => (
  <div className="bg-white p-6 rounded-lg border border-neutral-200 space-y-4">
    <Skeleton width="w-3/4" height="h-6" />
    <Skeleton width="w-full" height="h-4" />
    <Skeleton width="w-full" height="h-4" />
    <Skeleton width="w-2/3" height="h-4" />
  </div>
);
