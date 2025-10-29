import { createContext, useContext, useState, type ReactNode } from 'react';
import { motion } from 'framer-motion';

interface TabsContextValue {
  activeTab: string;
  setActiveTab: (value: string) => void;
}

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabsContext() {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error('Tabs components must be used within a Tabs component');
  }
  return context;
}

export interface TabsProps {
  children: ReactNode;
  defaultValue: string;
  value?: string;
  onValueChange?: (value: string) => void;
  className?: string;
}

export function Tabs({ children, defaultValue, value, onValueChange, className = '' }: TabsProps) {
  const [internalValue, setInternalValue] = useState(defaultValue);

  const activeTab = value !== undefined ? value : internalValue;

  const handleValueChange = (newValue: string) => {
    if (value === undefined) {
      setInternalValue(newValue);
    }
    onValueChange?.(newValue);
  };

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab: handleValueChange }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
}

export interface TabsListProps {
  children: ReactNode;
  className?: string;
}

export function TabsList({ children, className = '' }: TabsListProps) {
  return (
    <div
      className={`inline-flex items-center gap-1 p-1 bg-neutral-100 rounded-lg ${className}`}
      role="tablist"
    >
      {children}
    </div>
  );
}

export interface TabsTriggerProps {
  children: ReactNode;
  value: string;
  disabled?: boolean;
  className?: string;
}

export function TabsTrigger({ children, value, disabled = false, className = '' }: TabsTriggerProps) {
  const { activeTab, setActiveTab } = useTabsContext();
  const isActive = activeTab === value;

  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      disabled={disabled}
      onClick={() => !disabled && setActiveTab(value)}
      className={`
        relative px-4 py-2 text-sm font-medium rounded-md
        transition-colors duration-200
        ${
          isActive
            ? 'text-neutral-900'
            : disabled
            ? 'text-neutral-400 cursor-not-allowed'
            : 'text-neutral-600 hover:text-neutral-900'
        }
        ${className}
      `}
    >
      {isActive && (
        <motion.div
          layoutId="activeTab"
          className="absolute inset-0 bg-white shadow-sm rounded-md"
          transition={{ type: 'spring', duration: 0.5, bounce: 0.2 }}
        />
      )}
      <span className="relative z-10">{children}</span>
    </button>
  );
}

export interface TabsContentProps {
  children: ReactNode;
  value: string;
  className?: string;
}

export function TabsContent({ children, value, className = '' }: TabsContentProps) {
  const { activeTab } = useTabsContext();

  if (activeTab !== value) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      role="tabpanel"
      className={className}
    >
      {children}
    </motion.div>
  );
}
