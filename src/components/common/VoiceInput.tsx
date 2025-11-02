import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { useVoiceRecognition } from '../../hooks/useVoiceRecognition';
import { useEffect, useState } from 'react';

interface VoiceInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  disabled?: boolean;
  className?: string;
  label?: string;
}

export function VoiceInput({
  value,
  onChange,
  placeholder = 'Parlez ou tapez...',
  rows = 4,
  disabled = false,
  className = '',
  label,
}: VoiceInputProps) {
  const [localValue, setLocalValue] = useState(value);

  const {
    isListening,
    transcript,
    interimTranscript,
    startListening,
    stopListening,
    resetTranscript,
    isSupported,
  } = useVoiceRecognition({
    onTranscript: (text, isFinal) => {
      if (isFinal) {
        const newValue = localValue + (localValue ? ' ' : '') + text;
        setLocalValue(newValue);
        onChange(newValue);
      }
    },
    language: 'fr-CA',
    continuous: true,
  });

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  function handleTextChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const newValue = e.target.value;
    setLocalValue(newValue);
    onChange(newValue);
  }

  function toggleVoice() {
    if (isListening) {
      stopListening();
    } else {
      resetTranscript();
      startListening();
    }
  }

  const displayValue = isListening
    ? localValue + (localValue && interimTranscript ? ' ' : '') + interimTranscript
    : localValue;

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-foreground/70 mb-2">
          {label}
        </label>
      )}
      <div className="relative">
        <textarea
          value={displayValue}
          onChange={handleTextChange}
          placeholder={placeholder}
          rows={rows}
          disabled={disabled || isListening}
          className={`w-full px-4 py-3 pr-14 border-2 rounded-xl focus:outline-none focus:ring-2 transition-all resize-none ${
            isListening
              ? 'border-red-300 bg-red-50 focus:border-red-400 focus:ring-red-200'
              : 'border-neutral-200 focus:border-gold-400 focus:ring-gold-200'
          }`}
        />

        {isSupported && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="button"
            onClick={toggleVoice}
            disabled={disabled}
            className={`absolute right-3 top-3 p-2 rounded-lg transition-all ${
              isListening
                ? 'bg-red-500 text-white shadow-lg animate-pulse'
                : 'bg-neutral-100 text-neutral-600 hover:bg-gold-100 hover:text-gold-600'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
            title={isListening ? 'Arrêter dictée' : 'Commencer dictée'}
          >
            <AnimatePresence mode="wait">
              {isListening ? (
                <motion.div
                  key="recording"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                >
                  <MicOff className="w-5 h-5" />
                </motion.div>
              ) : (
                <motion.div
                  key="idle"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                >
                  <Mic className="w-5 h-5" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        )}

        {isListening && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute -bottom-8 left-0 right-0 flex items-center justify-center gap-2 text-sm text-red-600"
          >
            <div className="flex gap-1">
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 1, delay: 0 }}
                className="w-1 h-3 bg-red-500 rounded-full"
              />
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 1, delay: 0.2 }}
                className="w-1 h-3 bg-red-500 rounded-full"
              />
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 1, delay: 0.4 }}
                className="w-1 h-3 bg-red-500 rounded-full"
              />
            </div>
            <span className="font-medium">Dictée en cours...</span>
          </motion.div>
        )}
      </div>
    </div>
  );
}
