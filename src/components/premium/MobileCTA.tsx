import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, X } from 'lucide-react';

export const MobileCTA: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (isDismissed) return;

      const scrolled = window.scrollY;
      const halfPage = document.documentElement.scrollHeight / 2;

      setIsVisible(scrolled > halfPage);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isDismissed]);

  if (isDismissed) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="md:hidden fixed bottom-0 left-0 right-0 z-40 p-4 bg-white/95 backdrop-blur-lg border-t border-slate-200 shadow-2xl"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1">
              <p className="text-sm font-bold text-slate-900">
                Prêt à économiser 50K$/an?
              </p>
              <p className="text-xs text-slate-600">
                Essai gratuit 14 jours • Sans carte
              </p>
            </div>
            <motion.a
              href="/admin/signup"
              whileTap={{ scale: 0.95 }}
              className="flex-shrink-0 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-bold text-sm flex items-center space-x-2 shadow-lg"
            >
              <span>Commencer</span>
              <ArrowRight className="w-4 h-4" />
            </motion.a>
            <button
              onClick={() => setIsDismissed(true)}
              className="flex-shrink-0 p-2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
