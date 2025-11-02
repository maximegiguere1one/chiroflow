import { CheckCircle, XCircle, AlertCircle, Info } from 'lucide-react';
import { motion } from 'framer-motion';

interface ToastAction {
  label: string;
  onClick: () => void;
}

interface EnhancedToastProps {
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  solution?: string;
  action?: ToastAction;
}

const icons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertCircle,
  info: Info
};

const colors = {
  success: {
    border: 'border-green-500',
    icon: 'text-green-500',
    button: 'text-green-600 hover:text-green-700'
  },
  error: {
    border: 'border-red-500',
    icon: 'text-red-500',
    button: 'text-red-600 hover:text-red-700'
  },
  warning: {
    border: 'border-amber-500',
    icon: 'text-amber-500',
    button: 'text-amber-600 hover:text-amber-700'
  },
  info: {
    border: 'border-blue-500',
    icon: 'text-blue-500',
    button: 'text-blue-600 hover:text-blue-700'
  }
};

export const EnhancedToast: React.FC<EnhancedToastProps> = ({
  type,
  title,
  message,
  solution,
  action
}) => {
  const Icon = icons[type];
  const colorScheme = colors[type];

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      className={`bg-white rounded-lg shadow-lg border-l-4 ${colorScheme.border} p-4 max-w-md`}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <Icon className={`w-6 h-6 ${colorScheme.icon}`} />
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-foreground mb-1">
            {type === 'success' && '✓ '}
            {title}
          </h4>
          {message && (
            <p className="text-sm text-foreground/70 mb-2">{message}</p>
          )}
          {solution && (
            <p className="text-sm text-foreground/60 mb-3">
              💡 {solution}
            </p>
          )}
          {action && (
            <button
              onClick={action.onClick}
              className={`text-sm font-medium ${colorScheme.button}`}
            >
              {action.label} →
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export const showToast = {
  success: (title: string, message?: string, action?: ToastAction) => ({
    type: 'success' as const,
    title,
    message,
    action
  }),
  error: (title: string, message?: string, solution?: string, action?: ToastAction) => ({
    type: 'error' as const,
    title,
    message,
    solution,
    action
  }),
  warning: (title: string, message?: string, action?: ToastAction) => ({
    type: 'warning' as const,
    title,
    message,
    action
  }),
  info: (title: string, message?: string, action?: ToastAction) => ({
    type: 'info' as const,
    title,
    message,
    action
  })
};
