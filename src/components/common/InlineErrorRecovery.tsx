import { useState } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, RefreshCw, ArrowRight } from 'lucide-react';

interface InlineErrorRecoveryProps {
  error: Error | string;
  onRetry?: () => void;
  onDismiss?: () => void;
  suggestions?: string[];
  showDetails?: boolean;
}

export function InlineErrorRecovery({
  error,
  onRetry,
  onDismiss,
  suggestions = [],
  showDetails = false
}: InlineErrorRecoveryProps) {
  const errorMessage = typeof error === 'string' ? error : error.message;

  const defaultSuggestions = [
    'Vérifiez votre connexion internet',
    'Rafraîchissez la page',
    'Réessayez dans quelques instants'
  ];

  const displaySuggestions = suggestions.length > 0 ? suggestions : defaultSuggestions;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="bg-red-50 border-2 border-red-200 rounded-xl p-4"
    >
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
          <AlertCircle className="w-4 h-4 text-red-500" />
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-gray-900 mb-1">
            Une erreur s'est produite
          </h4>

          <p className="text-sm text-gray-600 mb-3">
            {errorMessage}
          </p>

          {displaySuggestions.length > 0 && (
            <div className="mb-3">
              <p className="text-xs font-medium text-gray-700 mb-2">
                Suggestions:
              </p>
              <ul className="space-y-1">
                {displaySuggestions.map((suggestion, index) => (
                  <li key={index} className="flex items-start gap-2 text-xs text-gray-600">
                    <ArrowRight className="w-3 h-3 text-gray-400 flex-shrink-0 mt-0.5" />
                    <span>{suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {showDetails && typeof error !== 'string' && (
            <details className="mb-3">
              <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                Détails techniques
              </summary>
              <pre className="mt-2 text-xs text-gray-600 overflow-auto max-h-32 p-2 bg-white rounded border border-red-200">
                {error.stack}
              </pre>
            </details>
          )}

          <div className="flex gap-2">
            {onRetry && (
              <motion.button
                onClick={onRetry}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 px-3 py-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm font-medium"
              >
                <RefreshCw className="w-3 h-3" />
                Réessayer
              </motion.button>
            )}

            {onDismiss && (
              <motion.button
                onClick={onDismiss}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-3 py-1.5 bg-white text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium border border-gray-300"
              >
                Fermer
              </motion.button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function useErrorRecovery() {
  const [error, setError] = useState<Error | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const executeWithRecovery = async <T,>(
    fn: () => Promise<T>,
    {
      maxRetries = 3,
      retryDelay = 1000,
      onSuccess,
      onError
    }: {
      maxRetries?: number;
      retryDelay?: number;
      onSuccess?: (data: T) => void;
      onError?: (error: Error) => void;
    } = {}
  ): Promise<T | null> => {
    try {
      const result = await fn();
      setError(null);
      setRetryCount(0);
      if (onSuccess) onSuccess(result);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);

      if (retryCount < maxRetries) {
        setRetryCount(prev => prev + 1);
        await new Promise(resolve => setTimeout(resolve, retryDelay * (retryCount + 1)));
        return executeWithRecovery(fn, { maxRetries, retryDelay, onSuccess, onError });
      }

      if (onError) onError(error);
      return null;
    }
  };

  const retry = async <T,>(fn: () => Promise<T>) => {
    setRetryCount(0);
    return executeWithRecovery(fn);
  };

  const clearError = () => {
    setError(null);
    setRetryCount(0);
  };

  return {
    error,
    retryCount,
    executeWithRecovery,
    retry,
    clearError
  };
}
