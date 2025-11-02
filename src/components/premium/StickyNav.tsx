import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Menu, X } from 'lucide-react';

export const StickyNav: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? 'bg-white/95 backdrop-blur-lg shadow-lg'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <span className={`text-2xl font-bold transition-colors ${
                isScrolled ? 'text-slate-900' : 'text-white'
              }`}>
                ChiroFlow
              </span>
            </div>

            <div className="hidden md:flex items-center space-x-8">
              <a
                href="#fonctionnalites"
                className={`font-medium transition-colors hover:text-emerald-600 ${
                  isScrolled ? 'text-slate-700' : 'text-white'
                }`}
              >
                Fonctionnalités
              </a>
              <a
                href="#temoignages"
                className={`font-medium transition-colors hover:text-emerald-600 ${
                  isScrolled ? 'text-slate-700' : 'text-white'
                }`}
              >
                Témoignages
              </a>
              <a
                href="#tarifs"
                className={`font-medium transition-colors hover:text-emerald-600 ${
                  isScrolled ? 'text-slate-700' : 'text-white'
                }`}
              >
                Tarifs
              </a>
              <a
                href="#faq"
                className={`font-medium transition-colors hover:text-emerald-600 ${
                  isScrolled ? 'text-slate-700' : 'text-white'
                }`}
              >
                FAQ
              </a>
              <a
                href="/admin"
                className={`font-medium transition-colors hover:text-emerald-600 ${
                  isScrolled ? 'text-slate-700' : 'text-white'
                }`}
              >
                Connexion
              </a>
              <motion.a
                href="/admin/signup"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-semibold shadow-lg shadow-emerald-600/30"
              >
                Essai gratuit
              </motion.a>
            </div>

            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2"
            >
              {isMobileMenuOpen ? (
                <X className={isScrolled ? 'text-slate-900' : 'text-white'} />
              ) : (
                <Menu className={isScrolled ? 'text-slate-900' : 'text-white'} />
              )}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden bg-white border-t border-slate-200"
            >
              <div className="px-4 py-6 space-y-4">
                <a
                  href="#fonctionnalites"
                  className="block py-2 text-slate-700 font-medium hover:text-emerald-600"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Fonctionnalités
                </a>
                <a
                  href="#temoignages"
                  className="block py-2 text-slate-700 font-medium hover:text-emerald-600"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Témoignages
                </a>
                <a
                  href="#tarifs"
                  className="block py-2 text-slate-700 font-medium hover:text-emerald-600"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Tarifs
                </a>
                <a
                  href="#faq"
                  className="block py-2 text-slate-700 font-medium hover:text-emerald-600"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  FAQ
                </a>
                <a
                  href="/admin"
                  className="block py-2 text-slate-700 font-medium hover:text-emerald-600"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Connexion
                </a>
                <a
                  href="/admin/signup"
                  className="block w-full px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-semibold text-center shadow-lg"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Essai gratuit 14 jours
                </a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      <div className="h-20" />
    </>
  );
};
