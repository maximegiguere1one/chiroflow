import { motion, AnimatePresence } from 'framer-motion';
import { X, Keyboard } from 'lucide-react';
import type { KeyboardShortcut } from '../../hooks/useKeyboardShortcuts';
import { getShortcutLabel } from '../../hooks/useKeyboardShortcuts';

interface ShortcutsHelpProps {
  isOpen: boolean;
  onClose: () => void;
  shortcuts: KeyboardShortcut[];
}

export function ShortcutsHelp({ isOpen, onClose, shortcuts }: ShortcutsHelpProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative bg-white shadow-lifted max-w-2xl w-full max-h-[80vh] overflow-hidden"
          >
            <div className="sticky top-0 bg-white border-b border-neutral-200 p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-gold-400 to-gold-600 rounded-lg flex items-center justify-center">
                  <Keyboard className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-heading text-foreground">
                  Raccourcis clavier
                </h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(80vh-100px)]">
              <div className="space-y-3">
                {shortcuts.map((shortcut, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-neutral-50 border border-neutral-200 hover:border-gold-300 transition-colors"
                  >
                    <span className="text-sm text-foreground/80">
                      {shortcut.description}
                    </span>
                    <kbd className="px-3 py-1.5 bg-white border border-neutral-300 text-sm font-mono text-foreground shadow-sm">
                      {getShortcutLabel(shortcut)}
                    </kbd>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 bg-gold-50 border border-gold-200 rounded-lg">
                <p className="text-sm text-foreground/70">
                  <strong>Astuce:</strong> Appuyez sur <kbd className="px-2 py-1 bg-white border border-gold-300 text-xs font-mono">?</kbd> à
                  tout moment pour afficher cette aide.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
