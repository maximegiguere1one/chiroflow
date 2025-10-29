import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Clock } from 'lucide-react';
import { useState, useEffect } from 'react';
import { trackEvent } from '../lib/analytics';

interface StickyCTAProps {
  onOpenAppointment: () => void;
  isAgendaFull: boolean;
}

export default function StickyCTA({ onOpenAppointment, isAgendaFull }: StickyCTAProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [currentSection, setCurrentSection] = useState('hero');

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      const shouldShow = scrollPosition > window.innerHeight * 0.5;

      setIsVisible(shouldShow && !isDismissed);

      const sections = ['hero', 'services', 'reconnexion', 'testimonials', 'faq'];
      const sectionElements = sections.map(id => document.getElementById(id));

      const currentSectionElement = sectionElements.find(element => {
        if (!element) return false;
        const rect = element.getBoundingClientRect();
        return rect.top <= window.innerHeight / 2 && rect.bottom >= window.innerHeight / 2;
      });

      if (currentSectionElement) {
        setCurrentSection(currentSectionElement.id);
      }

      const contactSection = document.getElementById('contact');
      if (contactSection) {
        const rect = contactSection.getBoundingClientRect();
        if (rect.top <= window.innerHeight) {
          setIsVisible(false);
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, [isDismissed]);

  const getCtaText = () => {
    switch (currentSection) {
      case 'services':
        return 'Trouver mon service';
      case 'reconnexion':
        return 'Découvrir le programme';
      case 'testimonials':
        return 'Je veux ces résultats';
      case 'faq':
        return 'Réserver maintenant';
      default:
        return isAgendaFull ? 'Joindre la liste' : 'Prendre rendez-vous';
    }
  };

  const handleClick = () => {
    trackEvent('cta_click', 'sticky_cta');
    if (currentSection === 'reconnexion') {
      const element = document.getElementById('reconnexion');
      element?.scrollIntoView({ behavior: 'smooth' });
    } else {
      onOpenAppointment();
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    trackEvent('sticky_cta_dismissed');
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 25 }}
          className="fixed bottom-0 left-0 right-0 z-40 p-4"
        >
          <div className="max-w-4xl mx-auto">
            <div className="glass border border-primary-200 rounded-2xl shadow-soft-lg p-4 relative">
              <button
                onClick={handleDismiss}
                className="absolute -top-2 -right-2 w-8 h-8 bg-muted-700 text-white rounded-full flex items-center justify-center hover:bg-foreground transition-colors"
                aria-label="Fermer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center space-x-3 flex-1">
                  <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-6 h-6 text-white" />
                  </div>
                  <div className="hidden sm:block">
                    <p className="font-semibold text-foreground text-sm">
                      {isAgendaFull ? 'Places limitées disponibles' : 'Réservez votre évaluation'}
                    </p>
                    {isAgendaFull && (
                      <p className="text-xs text-muted-600 flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>Liste d'attente active</span>
                      </p>
                    )}
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleClick}
                  className="btn-primary whitespace-nowrap"
                  data-analytics-event="cta_click"
                  data-analytics-label="sticky_cta"
                >
                  {getCtaText()}
                </motion.button>
              </div>

              {isAgendaFull && (
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 1, delay: 0.5 }}
                  className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-accent-400 to-accent-600 rounded-b-2xl"
                />
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
