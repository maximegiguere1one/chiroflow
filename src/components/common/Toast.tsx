import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';
import { useEffect, forwardRef } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastProps {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
  onClose: (id: string) => void;
}

const icons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertCircle,
  info: Info,
};

const colors = {
  success: 'from-green-50 to-green-100 border-green-200 text-green-800',
  error: 'from-red-50 to-red-100 border-red-200 text-red-800',
  warning: 'from-gold-50 to-gold-100 border-gold-200 text-gold-800',
  info: 'from-neutral-50 to-neutral-100 border-neutral-300 text-neutral-800',
};

const iconColors = {
  success: 'text-green-600',
  error: 'text-red-600',
  warning: 'text-gold-600',
  info: 'text-neutral-600',
};

export const Toast = forwardRef<HTMLDivElement, ToastProps>(
  ({ id, type, message, duration = 5000, onClose }, ref) => {
    const Icon = icons[type];

    useEffect(() => {
      const timer = setTimeout(() => {
        onClose(id);
      }, duration);

      return () => clearTimeout(timer);
    }, [id, duration, onClose]);

    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
        className={`flex items-start gap-3 p-4 rounded-lg border shadow-soft-lg bg-gradient-to-br ${colors[type]} min-w-[320px] max-w-md`}
      >
        <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${iconColors[type]}`} />
        <p className="flex-1 text-sm font-medium">{message}</p>
        <button
          onClick={() => onClose(id)}
          className="flex-shrink-0 p-1 hover:bg-white/50 rounded transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </motion.div>
    );
  }
);

Toast.displayName = 'Toast';

interface ToastContainerProps {
  toasts: Array<{
    id: string;
    type: ToastType;
    message: string;
    duration?: number;
  }>;
  onClose: (id: string) => void;
}

export function ToastContainer({ toasts, onClose }: ToastContainerProps) {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-3">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <Toast key={toast.id} {...toast} onClose={onClose} />
        ))}
      </AnimatePresence>
    </div>
  );
}
