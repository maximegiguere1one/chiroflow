import { useState, useRef, useEffect, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Command } from 'lucide-react';

interface SmartTooltipProps {
  content: string | ReactNode;
  children: ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'auto';
  delay?: number;
  shortcut?: string;
  disabled?: boolean;
  maxWidth?: number;
}

export function SmartTooltip({
  content,
  children,
  position = 'auto',
  delay = 300,
  shortcut,
  disabled = false,
  maxWidth = 200
}: SmartTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [calculatedPosition, setCalculatedPosition] = useState(position);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const timeoutRef = useRef<NodeJS.Timeout>();
  const triggerRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter = () => {
    if (disabled) return;

    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
      calculatePosition();
    }, delay);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  const calculatePosition = () => {
    if (!triggerRef.current) return;

    const rect = triggerRef.current.getBoundingClientRect();
    const tooltipWidth = maxWidth;
    const tooltipHeight = 40;
    const offset = 8;

    let finalPosition = position;

    if (position === 'auto') {
      const spaceAbove = rect.top;
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceLeft = rect.left;
      const spaceRight = window.innerWidth - rect.right;

      if (spaceBelow > tooltipHeight + offset) {
        finalPosition = 'bottom';
      } else if (spaceAbove > tooltipHeight + offset) {
        finalPosition = 'top';
      } else if (spaceRight > tooltipWidth + offset) {
        finalPosition = 'right';
      } else if (spaceLeft > tooltipWidth + offset) {
        finalPosition = 'left';
      } else {
        finalPosition = 'bottom';
      }
    }

    setCalculatedPosition(finalPosition as any);

    let top = 0;
    let left = 0;

    switch (finalPosition) {
      case 'top':
        top = rect.top - tooltipHeight - offset;
        left = rect.left + rect.width / 2 - tooltipWidth / 2;
        break;
      case 'bottom':
        top = rect.bottom + offset;
        left = rect.left + rect.width / 2 - tooltipWidth / 2;
        break;
      case 'left':
        top = rect.top + rect.height / 2 - tooltipHeight / 2;
        left = rect.left - tooltipWidth - offset;
        break;
      case 'right':
        top = rect.top + rect.height / 2 - tooltipHeight / 2;
        left = rect.right + offset;
        break;
    }

    left = Math.max(8, Math.min(left, window.innerWidth - tooltipWidth - 8));
    top = Math.max(8, Math.min(top, window.innerHeight - tooltipHeight - 8));

    setCoords({ top, left });
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="inline-block"
      >
        {children}
      </div>

      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.15 }}
            style={{
              position: 'fixed',
              top: coords.top,
              left: coords.left,
              maxWidth,
              zIndex: 9999
            }}
            className="pointer-events-none"
          >
            <div className="bg-gray-900 text-white text-sm px-3 py-2 rounded-lg shadow-xl">
              <div className="flex items-center gap-2">
                <span>{content}</span>
                {shortcut && (
                  <kbd className="px-2 py-0.5 bg-gray-800 rounded text-xs font-mono flex items-center gap-1">
                    {shortcut.includes('⌘') && <Command className="w-3 h-3" />}
                    {shortcut.replace('⌘', '')}
                  </kbd>
                )}
              </div>
              <TooltipArrow position={calculatedPosition} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function TooltipArrow({ position }: { position: string }) {
  const arrowClasses = {
    top: 'bottom-[-4px] left-1/2 -translate-x-1/2 border-t-gray-900',
    bottom: 'top-[-4px] left-1/2 -translate-x-1/2 border-b-gray-900',
    left: 'right-[-4px] top-1/2 -translate-y-1/2 border-l-gray-900',
    right: 'left-[-4px] top-1/2 -translate-y-1/2 border-r-gray-900'
  };

  return (
    <div
      className={`absolute w-0 h-0 border-4 border-transparent ${arrowClasses[position as keyof typeof arrowClasses]}`}
    />
  );
}

export function TooltipProvider({ children }: { children: ReactNode }) {
  return <div className="relative">{children}</div>;
}

export function withTooltip<P extends object>(
  Component: React.ComponentType<P>,
  tooltip: string | ((props: P) => string),
  options?: {
    position?: 'top' | 'bottom' | 'left' | 'right' | 'auto';
    shortcut?: string;
  }
) {
  return function WithTooltip(props: P) {
    const content = typeof tooltip === 'function' ? tooltip(props) : tooltip;

    return (
      <SmartTooltip
        content={content}
        position={options?.position}
        shortcut={options?.shortcut}
      >
        <Component {...props} />
      </SmartTooltip>
    );
  };
}

interface TooltipConfig {
  [key: string]: {
    content: string;
    shortcut?: string;
    position?: 'top' | 'bottom' | 'left' | 'right' | 'auto';
  };
}

export const tooltipConfig: TooltipConfig = {
  'new-patient': {
    content: 'Créer un nouveau patient',
    shortcut: 'N'
  },
  'new-appointment': {
    content: 'Planifier un rendez-vous',
    shortcut: 'A'
  },
  'search': {
    content: 'Recherche universelle',
    shortcut: '⌘K'
  },
  'settings': {
    content: 'Paramètres',
    shortcut: '⌘,'
  },
  'help': {
    content: 'Aide et documentation',
    shortcut: '?'
  },
  'save': {
    content: 'Enregistrer',
    shortcut: '⌘S'
  },
  'cancel': {
    content: 'Annuler',
    shortcut: 'Esc'
  },
  'export': {
    content: 'Exporter les données',
    position: 'bottom'
  },
  'import': {
    content: 'Importer des données',
    position: 'bottom'
  },
  'refresh': {
    content: 'Actualiser',
    shortcut: '⌘R'
  },
  'delete': {
    content: 'Supprimer',
    shortcut: '⌫'
  },
  'edit': {
    content: 'Modifier',
    shortcut: 'E'
  },
  'view': {
    content: 'Voir les détails',
    shortcut: 'V'
  },
  'print': {
    content: 'Imprimer',
    shortcut: '⌘P'
  },
  'email': {
    content: 'Envoyer un email'
  },
  'sms': {
    content: 'Envoyer un SMS'
  },
  'call': {
    content: 'Appeler'
  }
};

export function TooltipButton({
  onClick,
  icon: Icon,
  tooltipKey,
  className = '',
  ...props
}: {
  onClick?: () => void;
  icon: React.ComponentType<{ className?: string }>;
  tooltipKey: keyof typeof tooltipConfig;
  className?: string;
  [key: string]: any;
}) {
  const config = tooltipConfig[tooltipKey];

  return (
    <SmartTooltip
      content={config.content}
      shortcut={config.shortcut}
      position={config.position}
    >
      <button
        onClick={onClick}
        className={`p-2 hover:bg-gray-100 rounded-lg transition-colors ${className}`}
        {...props}
      >
        <Icon className="w-5 h-5" />
      </button>
    </SmartTooltip>
  );
}
