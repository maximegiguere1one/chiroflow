import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastContextValue {
  toasts: Toast[];
  addToast: (toast: Toast) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Toast) => {
    setToasts((prev) => [...prev, toast]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
}

function ToastContainer() {
  const context = useContext(ToastContext);
  if (!context) return null;

  const { toasts, removeToast } = context;

  return (
    <div className="fixed bottom-4 right-4 z-[1070] space-y-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 50, scale: 0.3 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
            className={`
              flex items-start gap-3 p-4 rounded-xl shadow-xl
              bg-white border-l-4 min-w-[320px] max-w-md
              pointer-events-auto
              ${toast.type === 'success' && 'border-success-500'}
              ${toast.type === 'error' && 'border-error-500'}
              ${toast.type === 'warning' && 'border-warning-500'}
              ${toast.type === 'info' && 'border-info-500'}
            `}
          >
            <div className="flex-shrink-0 mt-0.5">
              {toast.type === 'success' && <CheckCircle className="w-5 h-5 text-success-500" />}
              {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-error-500" />}
              {toast.type === 'warning' && <AlertCircle className="w-5 h-5 text-warning-500" />}
              {toast.type === 'info' && <Info className="w-5 h-5 text-info-500" />}
            </div>

            <div className="flex-1 min-w-0">
              <p className="font-semibold text-neutral-900">{toast.title}</p>
              {toast.message && <p className="mt-1 text-sm text-neutral-600">{toast.message}</p>}
              {toast.action && (
                <button
                  onClick={() => {
                    toast.action!.onClick();
                    removeToast(toast.id);
                  }}
                  className="mt-2 text-sm font-medium text-primary-600 hover:text-primary-700"
                >
                  {toast.action.label}
                </button>
              )}
            </div>

            <button
              onClick={() => removeToast(toast.id)}
              className="flex-shrink-0 text-neutral-400 hover:text-neutral-600"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

export function useToasts() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToasts must be used within ToastProvider');

  const showToast = useCallback(
    (toast: Omit<Toast, 'id'>) => {
      const id = crypto.randomUUID();
      context.addToast({ ...toast, id });

      const duration = toast.duration || 5000;
      setTimeout(() => {
        context.removeToast(id);
      }, duration);

      return id;
    },
    [context]
  );

  return {
    toasts: context.toasts,
    showSuccess: (title: string, message?: string) => showToast({ type: 'success', title, message }),
    showError: (title: string, message?: string) => showToast({ type: 'error', title, message }),
    showWarning: (title: string, message?: string) => showToast({ type: 'warning', title, message }),
    showInfo: (title: string, message?: string) => showToast({ type: 'info', title, message }),
    removeToast: context.removeToast,
  };
}
