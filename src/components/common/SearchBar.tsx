import { Search, X, Filter } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface SearchFilter {
  id: string;
  label: string;
  type: 'select' | 'date' | 'text';
  options?: { value: string; label: string }[];
  value: string;
}

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  filters?: SearchFilter[];
  onFilterChange?: (filterId: string, value: string) => void;
  onClear?: () => void;
}

export function SearchBar({
  value,
  onChange,
  placeholder = 'Rechercher...',
  filters = [],
  onFilterChange,
  onClear,
}: SearchBarProps) {
  const [showFilters, setShowFilters] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const activeFiltersCount = filters.filter((f) => f.value).length;

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  function handleClear() {
    onChange('');
    filters.forEach((filter) => {
      if (onFilterChange) onFilterChange(filter.id, '');
    });
    if (onClear) onClear();
  }

  return (
    <div className="space-y-3">
      <div className="relative flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40" />
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full pl-12 pr-24 py-3 bg-white border border-neutral-200 focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200 transition-all"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
            {value && (
              <button
                onClick={handleClear}
                className="p-1.5 hover:bg-neutral-100 rounded transition-colors"
              >
                <X className="w-4 h-4 text-foreground/60" />
              </button>
            )}
            <kbd className="hidden md:flex items-center gap-1 px-2 py-1 bg-neutral-100 border border-neutral-200 rounded text-xs text-foreground/60">
              <span>⌘</span>
              <span>K</span>
            </kbd>
          </div>
        </div>

        {filters.length > 0 && (
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-3 border transition-all ${
              showFilters || activeFiltersCount > 0
                ? 'border-gold-400 bg-gold-50 text-gold-700'
                : 'border-neutral-300 bg-white text-foreground hover:border-gold-300'
            }`}
          >
            <Filter className="w-5 h-5" />
            <span className="hidden sm:inline">Filtres</span>
            {activeFiltersCount > 0 && (
              <span className="flex items-center justify-center w-5 h-5 bg-gold-600 text-white text-xs font-semibold rounded-full">
                {activeFiltersCount}
              </span>
            )}
          </button>
        )}
      </div>

      <AnimatePresence>
        {showFilters && filters.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-neutral-50 border border-neutral-200 p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filters.map((filter) => (
                <div key={filter.id}>
                  <label className="block text-sm font-medium text-foreground/70 mb-2">
                    {filter.label}
                  </label>
                  {filter.type === 'select' && filter.options && (
                    <select
                      value={filter.value}
                      onChange={(e) => onFilterChange?.(filter.id, e.target.value)}
                      className="w-full px-3 py-2 border border-neutral-300 bg-white focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200 transition-all"
                    >
                      <option value="">Tous</option>
                      {filter.options.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  )}
                  {filter.type === 'date' && (
                    <input
                      type="date"
                      value={filter.value}
                      onChange={(e) => onFilterChange?.(filter.id, e.target.value)}
                      className="w-full px-3 py-2 border border-neutral-300 bg-white focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200 transition-all"
                    />
                  )}
                  {filter.type === 'text' && (
                    <input
                      type="text"
                      value={filter.value}
                      onChange={(e) => onFilterChange?.(filter.id, e.target.value)}
                      className="w-full px-3 py-2 border border-neutral-300 bg-white focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200 transition-all"
                    />
                  )}
                </div>
              ))}

              {activeFiltersCount > 0 && (
                <div className="md:col-span-2 lg:col-span-3 flex justify-end">
                  <button
                    onClick={handleClear}
                    className="text-sm text-gold-700 hover:text-gold-800 font-medium"
                  >
                    Réinitialiser tous les filtres
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
