import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface ProgressiveLoaderProps {
  isLoading: boolean;
  children: ReactNode;
  skeleton?: ReactNode;
  delay?: number;
  className?: string;
}

export function ProgressiveLoader({
  isLoading,
  children,
  skeleton,
  delay = 0,
  className = ''
}: ProgressiveLoaderProps) {
  if (!isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay }}
        className={className}
      >
        {children}
      </motion.div>
    );
  }

  if (skeleton) {
    return <>{skeleton}</>;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={className}
    >
      <LoadingSkeleton />
    </motion.div>
  );
}

export function LoadingSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-8 bg-gray-200 rounded-lg w-1/3" />
      <div className="space-y-3">
        <div className="h-4 bg-gray-200 rounded w-full" />
        <div className="h-4 bg-gray-200 rounded w-5/6" />
        <div className="h-4 bg-gray-200 rounded w-4/6" />
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 items-center p-4 bg-gray-50 rounded-lg animate-pulse">
          <div className="w-10 h-10 bg-gray-200 rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-1/3" />
            <div className="h-3 bg-gray-200 rounded w-1/2" />
          </div>
          <div className="h-8 w-20 bg-gray-200 rounded" />
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 animate-pulse">
      <div className="flex items-center gap-4 mb-4">
        <div className="w-12 h-12 bg-gray-200 rounded-full" />
        <div className="flex-1">
          <div className="h-5 bg-gray-200 rounded w-1/3 mb-2" />
          <div className="h-3 bg-gray-200 rounded w-1/2" />
        </div>
      </div>
      <div className="space-y-3">
        <div className="h-4 bg-gray-200 rounded w-full" />
        <div className="h-4 bg-gray-200 rounded w-5/6" />
        <div className="h-4 bg-gray-200 rounded w-4/6" />
      </div>
    </div>
  );
}

export function CalendarSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 animate-pulse">
      <div className="flex items-center justify-between mb-6">
        <div className="h-8 bg-gray-200 rounded w-1/3" />
        <div className="flex gap-2">
          <div className="h-8 w-24 bg-gray-200 rounded" />
          <div className="h-8 w-24 bg-gray-200 rounded" />
        </div>
      </div>
      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: 35 }).map((_, i) => (
          <div key={i} className="aspect-square bg-gray-100 rounded-lg" />
        ))}
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CalendarSkeleton />
        <div className="space-y-4">
          <TableSkeleton rows={5} />
        </div>
      </div>
    </div>
  );
}

interface ProgressiveContentProps {
  items: any[];
  renderItem: (item: any, index: number) => ReactNode;
  isLoading: boolean;
  batchSize?: number;
  delay?: number;
  skeleton?: ReactNode;
}

export function ProgressiveContent({
  items,
  renderItem,
  isLoading,
  batchSize = 10,
  delay = 50,
  skeleton
}: ProgressiveContentProps) {
  if (isLoading) {
    return <>{skeleton || <TableSkeleton rows={batchSize} />}</>;
  }

  return (
    <>
      {items.map((item, index) => (
        <motion.div
          key={item.id || index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.3,
            delay: Math.min(index, 10) * (delay / 1000)
          }}
        >
          {renderItem(item, index)}
        </motion.div>
      ))}
    </>
  );
}
