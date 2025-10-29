import { useState, useRef, useEffect, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface PopoverProps {
  children: ReactNode;
  content: ReactNode;
  trigger?: 'click' | 'hover';
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
  onOpenChange?: (open: boolean) => void;
}

const positionStyles = {
  top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
  bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
  left: 'right-full top-1/2 -translate-y-1/2 mr-2',
  right: 'left-full top-1/2 -translate-y-1/2 ml-2',
};

export function Popover({
  children,
  content,
  trigger = 'click',
  position = 'bottom',
  className = '',
  onOpenChange,
}: PopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleOpen = () => {
    setIsOpen(true);
    onOpenChange?.(true);
  };

  const handleClose = () => {
    setIsOpen(false);
    onOpenChange?.(false);
  };

  const handleToggle = () => {
    if (isOpen) {
      handleClose();
    } else {
      handleOpen();
    }
  };

  useEffect(() => {
    if (trigger === 'click' && isOpen) {
      const handleClickOutside = (event: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
          handleClose();
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, trigger]);

  const triggerProps = trigger === 'click'
    ? { onClick: handleToggle }
    : { onMouseEnter: handleOpen, onMouseLeave: handleClose };

  return (
    <div ref={containerRef} className={`relative inline-block ${className}`}>
      <div {...triggerProps}>{children}</div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.15 }}
            className={`absolute z-50 ${positionStyles[position]}`}
          >
            <div className="bg-white rounded-lg shadow-lg border border-neutral-200 p-4 min-w-[200px]">
              {content}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
