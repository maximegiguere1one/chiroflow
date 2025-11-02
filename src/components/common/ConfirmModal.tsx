import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, AlertCircle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  consequences?: string[];
  alternative?: {
    label: string;
    onClick: () => void;
  };
  danger?: boolean;
  confirmLabel?: string;
  cancelLabel?: string;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  consequences,
  alternative,
  danger = false,
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler'
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative"
        >
          <button
            onClick={onClose}
            className="absolute right-4 top-4 text-foreground/40 hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className={`
            w-12 h-12 rounded-full flex items-center justify-center mb-4
            ${danger ? 'bg-red-100' : 'bg-amber-100'}
          `}>
            {danger ? (
              <AlertTriangle className="w-6 h-6 text-red-600" />
            ) : (
              <AlertCircle className="w-6 h-6 text-amber-600" />
            )}
          </div>

          <h3 className="text-xl font-semibold text-foreground mb-2">
            {title}
          </h3>

          {description && (
            <p className="text-foreground/70 mb-4">
              {description}
            </p>
          )}

          {consequences && consequences.length > 0 && (
            <div className="bg-red-50 rounded-lg p-4 mb-4">
              <p className="text-sm font-medium text-red-900 mb-2">
                Cette action va supprimer :
              </p>
              <ul className="space-y-1">
                {consequences.map((item, index) => (
                  <li key={index} className="text-sm text-red-800 flex items-start gap-2">
                    <span className="text-red-600 mt-0.5">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {alternative && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-blue-900">
                💡 <strong>Recommandé :</strong> {alternative.label}
              </p>
            </div>
          )}

          <div className="flex flex-col-reverse sm:flex-row gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-neutral-100 hover:bg-neutral-200 text-foreground rounded-lg font-medium transition-colors"
            >
              {cancelLabel}
            </button>

            {alternative && (
              <button
                onClick={() => {
                  alternative.onClick();
                  onClose();
                }}
                className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                {alternative.label}
              </button>
            )}

            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className={`
                flex-1 px-4 py-3 rounded-lg font-medium transition-colors
                ${danger
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-gold-600 hover:bg-gold-700 text-white'
                }
              `}
            >
              {confirmLabel}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
