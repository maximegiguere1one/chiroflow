import { useState, useRef, useEffect, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check } from 'lucide-react';

export interface DropdownOption {
  value: string;
  label: string;
  disabled?: boolean;
  icon?: ReactNode;
}

export interface DropdownProps {
  options: DropdownOption[];
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  disabled?: boolean;
  className?: string;
}

export function Dropdown({
  options,
  value,
  onChange,
  placeholder = 'Sélectionner...',
  label,
  error,
  disabled = false,
  className = '',
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(opt => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setIsOpen(!isOpen);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    } else if (e.key === 'ArrowDown' && isOpen) {
      e.preventDefault();
      const currentIndex = options.findIndex(opt => opt.value === value);
      const nextIndex = Math.min(currentIndex + 1, options.length - 1);
      if (nextIndex >= 0 && !options[nextIndex].disabled) {
        onChange(options[nextIndex].value);
      }
    } else if (e.key === 'ArrowUp' && isOpen) {
      e.preventDefault();
      const currentIndex = options.findIndex(opt => opt.value === value);
      const prevIndex = Math.max(currentIndex - 1, 0);
      if (prevIndex >= 0 && !options[prevIndex].disabled) {
        onChange(options[prevIndex].value);
      }
    }
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <label className="block text-sm font-medium text-neutral-700 mb-1">
          {label}
        </label>
      )}

      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className={`
          w-full flex items-center justify-between
          px-4 py-2.5 rounded-lg border
          bg-white text-left
          transition-all duration-200
          ${disabled
            ? 'bg-neutral-50 text-neutral-400 cursor-not-allowed border-neutral-200'
            : error
            ? 'border-error-500 focus:border-error-600 focus:ring-2 focus:ring-error-100'
            : isOpen
            ? 'border-primary-500 ring-2 ring-primary-100'
            : 'border-neutral-300 hover:border-neutral-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-100'
          }
        `}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="flex items-center gap-2">
          {selectedOption?.icon}
          <span className={selectedOption ? 'text-neutral-900' : 'text-neutral-500'}>
            {selectedOption?.label || placeholder}
          </span>
        </span>
        <ChevronDown
          className={`w-4 h-4 text-neutral-500 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 w-full mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg overflow-hidden"
            role="listbox"
          >
            <div className="max-h-60 overflow-y-auto py-1">
              {options.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => !option.disabled && handleSelect(option.value)}
                  disabled={option.disabled}
                  className={`
                    w-full flex items-center justify-between
                    px-4 py-2.5 text-left
                    transition-colors duration-150
                    ${option.disabled
                      ? 'text-neutral-400 cursor-not-allowed'
                      : option.value === value
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-neutral-900 hover:bg-neutral-50'
                    }
                  `}
                  role="option"
                  aria-selected={option.value === value}
                >
                  <span className="flex items-center gap-2">
                    {option.icon}
                    <span>{option.label}</span>
                  </span>
                  {option.value === value && (
                    <Check className="w-4 h-4 text-primary-600" />
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <p className="mt-1 text-sm text-error-600">{error}</p>
      )}
    </div>
  );
}
