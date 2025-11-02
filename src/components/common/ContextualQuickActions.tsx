import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Tooltip } from './UniversalTooltip';

export interface QuickAction {
  id: string;
  label: string;
  icon: ReactNode;
  onClick: () => void;
  variant?: 'default' | 'primary' | 'success' | 'danger';
  shortcut?: string;
  disabled?: boolean;
  loading?: boolean;
}

interface ContextualQuickActionsProps {
  actions: QuickAction[];
  context?: string;
  vertical?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function ContextualQuickActions({
  actions,
  context,
  vertical = false,
  size = 'md',
  className = ''
}: ContextualQuickActionsProps) {
  const variantClasses = {
    default: 'bg-white hover:bg-gray-50 text-gray-700 border-gray-200',
    primary: 'bg-blue-500 hover:bg-blue-600 text-white border-blue-600',
    success: 'bg-green-500 hover:bg-green-600 text-white border-green-600',
    danger: 'bg-red-500 hover:bg-red-600 text-white border-red-600'
  };

  const sizeClasses = {
    sm: 'p-2 text-sm',
    md: 'p-3',
    lg: 'p-4 text-lg'
  };

  return (
    <div className={`${vertical ? 'flex flex-col space-y-2' : 'flex flex-wrap gap-2'} ${className}`}>
      {context && (
        <div className="w-full text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1">
          {context}
        </div>
      )}

      {actions.map((action) => (
        <Tooltip
          key={action.id}
          content={action.label}
          shortcut={action.shortcut}
          disabled={action.disabled}
        >
          <motion.button
            onClick={action.onClick}
            disabled={action.disabled || action.loading}
            whileHover={!action.disabled ? { scale: 1.05 } : {}}
            whileTap={!action.disabled ? { scale: 0.95 } : {}}
            className={`
              ${sizeClasses[size]}
              ${variantClasses[action.variant || 'default']}
              border-2 rounded-lg
              transition-all duration-200
              disabled:opacity-50 disabled:cursor-not-allowed
              flex items-center gap-2
              font-medium
              shadow-sm hover:shadow-md
            `}
          >
            {action.loading ? (
              <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              action.icon
            )}
            {vertical && <span className="flex-1 text-left">{action.label}</span>}
          </motion.button>
        </Tooltip>
      ))}
    </div>
  );
}

export function FloatingQuickActions({
  actions,
  position = 'bottom-right',
  className = ''
}: {
  actions: QuickAction[];
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  className?: string;
}) {
  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4'
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className={`fixed ${positionClasses[position]} z-40 ${className}`}
    >
      <div className="bg-white rounded-xl shadow-2xl border-2 border-gray-200 p-3">
        <ContextualQuickActions actions={actions} vertical size="md" />
      </div>
    </motion.div>
  );
}

interface QuickActionsBarProps {
  actions: QuickAction[];
  title?: string;
  className?: string;
}

export function QuickActionsBar({
  actions,
  title,
  className = ''
}: QuickActionsBarProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`
        bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50
        border-2 border-blue-200 rounded-xl p-4
        ${className}
      `}
    >
      {title && (
        <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <span className="text-blue-500">⚡</span>
          {title}
        </h3>
      )}

      <ContextualQuickActions actions={actions} size="md" />
    </motion.div>
  );
}

export function HoverQuickActions({
  actions,
  children,
  position = 'right'
}: {
  actions: QuickAction[];
  children: ReactNode;
  position?: 'top' | 'right' | 'bottom' | 'left';
}) {
  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2'
  };

  return (
    <div className="relative group">
      {children}

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        whileHover={{ opacity: 1, scale: 1 }}
        className={`
          absolute ${positionClasses[position]}
          hidden group-hover:block
          pointer-events-none group-hover:pointer-events-auto
        `}
      >
        <div className="bg-white rounded-lg shadow-xl border-2 border-gray-200 p-2">
          <ContextualQuickActions actions={actions} vertical size="sm" />
        </div>
      </motion.div>
    </div>
  );
}
