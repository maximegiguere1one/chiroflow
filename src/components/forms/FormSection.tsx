import { motion } from 'framer-motion';
import { ChevronDown, ChevronUp, LucideIcon } from 'lucide-react';
import { useState, ReactNode } from 'react';
import React from 'react';

interface FormSectionProps {
  title: string;
  icon?: LucideIcon;
  children: ReactNode;
  defaultExpanded?: boolean;
  required?: boolean;
  completed?: boolean;
  color?: string;
}

export function FormSection({
  title,
  icon,
  children,
  defaultExpanded = true,
  required = false,
  completed = false,
  color = 'blue'
}: FormSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 text-blue-900',
    green: 'bg-green-50 border-green-200 text-green-900',
    purple: 'bg-purple-50 border-purple-200 text-purple-900',
    red: 'bg-red-50 border-red-200 text-red-900',
    amber: 'bg-amber-50 border-amber-200 text-amber-900',
    neutral: 'bg-neutral-50 border-neutral-200 text-neutral-900'
  };

  return (
    <div className="mb-4">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className={`w-full px-4 py-3 rounded-t-xl border-2 ${
          colorClasses[color as keyof typeof colorClasses] || colorClasses.blue
        } hover:opacity-80 transition-all flex items-center justify-between`}
      >
        <div className="flex items-center gap-3">
          {icon && React.createElement(icon, { className: 'w-5 h-5' })}
          <h3 className="font-semibold text-lg">{title}</h3>
          {required && (
            <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
              Requis
            </span>
          )}
          {completed && (
            <span className="px-2 py-0.5 bg-green-500 text-white text-xs rounded-full">
              ✓ Complété
            </span>
          )}
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5" />
        ) : (
          <ChevronDown className="w-5 h-5" />
        )}
      </button>

      {isExpanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="border-2 border-t-0 border-neutral-200 rounded-b-xl p-6 bg-white"
        >
          {children}
        </motion.div>
      )}
    </div>
  );
}
