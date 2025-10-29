import { createContext, useContext, useState, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

interface AccordionContextValue {
  openItems: Set<string>;
  toggleItem: (value: string) => void;
  type: 'single' | 'multiple';
}

const AccordionContext = createContext<AccordionContextValue | null>(null);

function useAccordionContext() {
  const context = useContext(AccordionContext);
  if (!context) {
    throw new Error('Accordion components must be used within an Accordion component');
  }
  return context;
}

export interface AccordionProps {
  children: ReactNode;
  type?: 'single' | 'multiple';
  defaultValue?: string | string[];
  className?: string;
}

export function Accordion({
  children,
  type = 'single',
  defaultValue,
  className = '',
}: AccordionProps) {
  const [openItems, setOpenItems] = useState<Set<string>>(() => {
    if (!defaultValue) return new Set();
    if (Array.isArray(defaultValue)) return new Set(defaultValue);
    return new Set([defaultValue]);
  });

  const toggleItem = (value: string) => {
    setOpenItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(value)) {
        newSet.delete(value);
      } else {
        if (type === 'single') {
          newSet.clear();
        }
        newSet.add(value);
      }
      return newSet;
    });
  };

  return (
    <AccordionContext.Provider value={{ openItems, toggleItem, type }}>
      <div className={`space-y-2 ${className}`}>{children}</div>
    </AccordionContext.Provider>
  );
}

export interface AccordionItemProps {
  children: ReactNode;
  value: string;
  className?: string;
}

export function AccordionItem({ children, value, className = '' }: AccordionItemProps) {
  return (
    <div className={`border border-neutral-200 rounded-lg ${className}`} data-value={value}>
      {children}
    </div>
  );
}

export interface AccordionTriggerProps {
  children: ReactNode;
  className?: string;
}

export function AccordionTrigger({ children, className = '' }: AccordionTriggerProps) {
  const { openItems, toggleItem } = useAccordionContext();

  const parentValue = (children as any)?.props?.['data-value'];
  const value = parentValue || '';

  const isOpen = openItems.has(value);

  return (
    <button
      type="button"
      onClick={() => toggleItem(value)}
      className={`
        w-full flex items-center justify-between
        px-4 py-3 text-left font-medium
        hover:bg-neutral-50 transition-colors
        ${className}
      `}
      aria-expanded={isOpen}
    >
      {children}
      <ChevronDown
        className={`w-4 h-4 text-neutral-500 transition-transform duration-200 ${
          isOpen ? 'rotate-180' : ''
        }`}
      />
    </button>
  );
}

export interface AccordionContentProps {
  children: ReactNode;
  className?: string;
}

export function AccordionContent({ children, className = '' }: AccordionContentProps) {
  const { openItems } = useAccordionContext();

  const parentValue = (children as any)?.props?.['data-value'];
  const value = parentValue || '';

  const isOpen = openItems.has(value);

  return (
    <AnimatePresence initial={false}>
      {isOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="overflow-hidden"
        >
          <div className={`px-4 py-3 pt-0 text-neutral-600 ${className}`}>{children}</div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface SimpleAccordionItemProps {
  value: string;
  title: string;
  children: ReactNode;
}

export function SimpleAccordionItem({ value, title, children }: SimpleAccordionItemProps) {
  const { openItems, toggleItem } = useAccordionContext();
  const isOpen = openItems.has(value);

  return (
    <div className="border border-neutral-200 rounded-lg">
      <button
        type="button"
        onClick={() => toggleItem(value)}
        className="w-full flex items-center justify-between px-4 py-3 text-left font-medium hover:bg-neutral-50 transition-colors"
        aria-expanded={isOpen}
      >
        <span>{title}</span>
        <ChevronDown
          className={`w-4 h-4 text-neutral-500 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 py-3 pt-0 text-neutral-600">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
