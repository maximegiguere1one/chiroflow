import { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface ValidationInputProps {
  label: string;
  hint?: string;
  placeholder?: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  validation?: (value: string) => { valid: boolean; message: string };
  error?: string;
  required?: boolean;
  icon?: React.ReactNode;
}

export const ValidationInput: React.FC<ValidationInputProps> = ({
  label,
  hint,
  placeholder,
  type = 'text',
  value,
  onChange,
  validation,
  error,
  required,
  icon
}) => {
  const [touched, setTouched] = useState(false);
  const [validationState, setValidationState] = useState<{
    valid: boolean;
    message: string;
  } | null>(null);

  useEffect(() => {
    if (validation && touched && value) {
      setValidationState(validation(value));
    }
  }, [value, touched, validation]);

  return (
    <div className="form-field">
      <label className="block text-sm font-medium text-foreground/70 mb-2">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
        {hint && (
          <span className="text-xs text-foreground/50 ml-2 font-normal">
            {hint}
          </span>
        )}
      </label>

      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40">
            {icon}
          </div>
        )}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={() => setTouched(true)}
          placeholder={placeholder}
          className={`
            w-full ${icon ? 'pl-11' : 'pl-4'} pr-12 py-3 bg-white/50 border rounded-lg
            focus:outline-none focus:ring-2 transition-all
            ${error || (validationState && !validationState.valid)
              ? 'border-red-300 focus:border-red-400 focus:ring-red-200'
              : validationState?.valid
              ? 'border-green-300 focus:border-green-400 focus:ring-green-200'
              : 'border-neutral-300 focus:border-gold-400 focus:ring-gold-200'
            }
          `}
        />

        {touched && validationState?.valid && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <CheckCircle className="w-5 h-5 text-green-500" />
          </div>
        )}
      </div>

      {touched && validationState && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className={`
            mt-2 text-sm flex items-start gap-2
            ${validationState.valid ? 'text-green-600' : 'text-amber-600'}
          `}
        >
          {validationState.valid ? (
            <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          )}
          <span>{validationState.message}</span>
        </motion.div>
      )}

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-2 text-sm text-red-600 flex items-start gap-2"
        >
          <XCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </motion.div>
      )}
    </div>
  );
};
