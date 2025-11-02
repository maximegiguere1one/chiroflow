import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Check } from 'lucide-react';

interface Suggestion {
  text: string;
  confidence: number;
  preview: string;
}

interface SmartTextareaProps {
  value: string;
  onChange: (value: string) => void;
  onFocus?: () => void;
  placeholder?: string;
  rows?: number;
  className?: string;
  suggestions?: string[];
  label?: string;
  disabled?: boolean;
}

export function SmartTextarea({
  value,
  onChange,
  onFocus,
  placeholder = '',
  rows = 4,
  className = '',
  suggestions = [],
  label,
  disabled = false
}: SmartTextareaProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [activeSuggestions, setActiveSuggestions] = useState<Suggestion[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (value.length > 3 && suggestions.length > 0) {
      const lastWords = value.toLowerCase().split(/\s+/).slice(-3).join(' ');

      const matches = suggestions
        .filter(s => {
          const sLower = s.toLowerCase();
          return sLower.includes(lastWords) ||
                 lastWords.split(/\s+/).some(word => sLower.includes(word));
        })
        .slice(0, 5)
        .map(s => ({
          text: s,
          confidence: calculateConfidence(s, lastWords),
          preview: s.substring(0, 80)
        }))
        .sort((a, b) => b.confidence - a.confidence);

      setActiveSuggestions(matches);
      setShowSuggestions(matches.length > 0);
      setSelectedIndex(0);
    } else {
      setShowSuggestions(false);
    }
  }, [value, suggestions]);

  function calculateConfidence(suggestion: string, query: string): number {
    const sLower = suggestion.toLowerCase();
    const qLower = query.toLowerCase();

    if (sLower.startsWith(qLower)) return 0.95;
    if (sLower.includes(qLower)) return 0.8;

    const queryWords = qLower.split(/\s+/);
    const matchedWords = queryWords.filter(w => sLower.includes(w)).length;
    return (matchedWords / queryWords.length) * 0.7;
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (!showSuggestions || activeSuggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, activeSuggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Tab' || e.key === 'Enter') {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        applySuggestion(activeSuggestions[selectedIndex].text);
      } else if (e.key === 'Tab') {
        e.preventDefault();
        applySuggestion(activeSuggestions[selectedIndex].text);
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  }

  function applySuggestion(suggestion: string) {
    const words = value.split(/\s+/);
    const lastFewWords = words.slice(-3).join(' ');

    let newValue = value;
    if (suggestion.toLowerCase().startsWith(lastFewWords.toLowerCase())) {
      newValue = value.slice(0, -lastFewWords.length) + suggestion;
    } else {
      newValue = value + ' ' + suggestion;
    }

    onChange(newValue);
    setShowSuggestions(false);
    textareaRef.current?.focus();
  }

  return (
    <div className={`relative ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-foreground/70 mb-2">
          {label}
        </label>
      )}

      <div className="relative">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => {
            onFocus?.();
            if (activeSuggestions.length > 0) {
              setShowSuggestions(true);
            }
          }}
          onBlur={() => {
            setTimeout(() => setShowSuggestions(false), 200);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={rows}
          disabled={disabled}
          className="w-full px-4 py-3 pr-12 border-2 rounded-xl focus:outline-none focus:ring-2 transition-all resize-none border-neutral-200 focus:border-purple-400 focus:ring-purple-200 disabled:opacity-50 disabled:cursor-not-allowed"
        />

        {activeSuggestions.length > 0 && (
          <div className="absolute right-3 top-3 flex items-center gap-1">
            <Sparkles className="w-4 h-4 text-purple-500 animate-pulse" />
            <span className="text-xs text-purple-600 font-medium">
              {activeSuggestions.length}
            </span>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showSuggestions && activeSuggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-50 mt-2 w-full bg-white border-2 border-purple-200 rounded-xl shadow-2xl overflow-hidden"
          >
            <div className="p-3 bg-purple-50 border-b border-purple-200">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <p className="text-xs font-semibold text-purple-900">
                  Suggestions Intelligentes
                </p>
                <kbd className="ml-auto px-2 py-1 bg-white rounded text-xs text-purple-600 border border-purple-200">
                  Tab ↹
                </kbd>
              </div>
            </div>

            <div className="max-h-64 overflow-y-auto">
              {activeSuggestions.map((suggestion, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className={`p-3 cursor-pointer transition-all border-l-4 ${
                    idx === selectedIndex
                      ? 'bg-purple-50 border-purple-500'
                      : 'bg-white border-transparent hover:bg-purple-25'
                  }`}
                  onClick={() => applySuggestion(suggestion.text)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-neutral-900 font-medium mb-1">
                        {suggestion.preview}
                        {suggestion.text.length > 80 && '...'}
                      </p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-neutral-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-purple-500 rounded-full"
                            style={{ width: `${suggestion.confidence * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-neutral-500 font-medium">
                          {Math.round(suggestion.confidence * 100)}%
                        </span>
                      </div>
                    </div>
                    {idx === selectedIndex && (
                      <Check className="w-5 h-5 text-purple-600 flex-shrink-0" />
                    )}
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="p-3 bg-neutral-50 border-t border-neutral-200">
              <div className="flex items-center gap-4 text-xs text-neutral-600">
                <span className="flex items-center gap-1">
                  <kbd className="px-2 py-1 bg-white rounded border border-neutral-200">↑</kbd>
                  <kbd className="px-2 py-1 bg-white rounded border border-neutral-200">↓</kbd>
                  <span>Naviguer</span>
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-2 py-1 bg-white rounded border border-neutral-200">Tab</kbd>
                  <span>Accepter</span>
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-2 py-1 bg-white rounded border border-neutral-200">Esc</kbd>
                  <span>Fermer</span>
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {activeSuggestions.length > 0 && !showSuggestions && (
        <p className="mt-2 text-xs text-purple-600 flex items-center gap-1">
          <Sparkles className="w-3 h-3" />
          Continuez à taper pour voir les suggestions
        </p>
      )}
    </div>
  );
}
