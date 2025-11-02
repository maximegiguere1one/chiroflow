import { motion } from 'framer-motion';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  primaryAction?: {
    label: string;
    icon?: React.ReactNode;
    onClick: () => void;
  };
  secondaryActions?: Array<{
    label: string;
    onClick?: () => void;
    href?: string;
  }>;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  primaryAction,
  secondaryActions
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 px-4"
    >
      <div className="w-20 h-20 rounded-full bg-neutral-100 flex items-center justify-center mb-6 text-neutral-400">
        {icon}
      </div>

      <h3 className="text-xl font-semibold text-foreground mb-2 text-center">
        {title}
      </h3>

      <p className="text-foreground/60 text-center max-w-md mb-8">
        {description}
      </p>

      {primaryAction && (
        <button
          onClick={primaryAction.onClick}
          className="flex items-center gap-2 px-6 py-3 bg-gold-600 hover:bg-gold-700 text-white rounded-lg font-medium transition-colors shadow-sm mb-4"
        >
          {primaryAction.icon}
          {primaryAction.label}
        </button>
      )}

      {secondaryActions && secondaryActions.length > 0 && (
        <div className="flex flex-wrap items-center justify-center gap-3">
          {secondaryActions.map((action, index) =>
            action.href ? (
              <a
                key={index}
                href={action.href}
                className="text-sm text-foreground/60 hover:text-foreground transition-colors"
              >
                {action.label}
              </a>
            ) : (
              <button
                key={index}
                onClick={action.onClick}
                className="text-sm text-foreground/60 hover:text-foreground transition-colors"
              >
                {action.label}
              </button>
            )
          )}
        </div>
      )}
    </motion.div>
  );
};
