import { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';

interface SmartInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: 'text' | 'number' | 'date' | 'email' | 'tel';
  placeholder?: string;
  required?: boolean;
  autoFillValue?: string;
  suggestions?: string[];
  min?: number;
  max?: number;
  step?: number;
  className?: string;
}

export function SmartInput({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  required = false,
  autoFillValue,
  suggestions = [],
  min,
  max,
  step,
  className = ''
}: SmartInputProps) {
  const [showAutoFill, setShowAutoFill] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    if (autoFillValue && !value) {
      setShowAutoFill(true);
    } else {
      setShowAutoFill(false);
    }
  }, [autoFillValue, value]);

  const handleAutoFill = () => {
    if (autoFillValue) {
      onChange(autoFillValue);
      setShowAutoFill(false);
    }
  };

  const filteredSuggestions = suggestions.filter(s =>
    s.toLowerCase().includes(value.toLowerCase()) && s !== value
  );

  return (
    <div className={`relative ${className}`}>
      <label className="block text-sm font-medium text-neutral-700 mb-2">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      <div className="relative">
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          placeholder={placeholder}
          min={min}
          max={max}
          step={step}
          required={required}
          className="w-full px-4 py-2.5 border-2 border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
        />

        {showAutoFill && autoFillValue && (
          <button
            type="button"
            onClick={handleAutoFill}
            className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 bg-blue-500 text-white text-xs rounded-md hover:bg-blue-600 transition-colors flex items-center gap-1"
          >
            <Sparkles className="w-3 h-3" />
            <span>Auto-remplir</span>
          </button>
        )}

        {showSuggestions && filteredSuggestions.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-white border-2 border-neutral-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
            {filteredSuggestions.map((suggestion, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  onChange(suggestion);
                  setShowSuggestions(false);
                }}
                className="w-full px-4 py-2 text-left hover:bg-blue-50 transition-colors text-sm"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}
      </div>

      {autoFillValue && !value && (
        <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
          <Sparkles className="w-3 h-3" />
          Valeur précédente disponible
        </p>
      )}
    </div>
  );
}
