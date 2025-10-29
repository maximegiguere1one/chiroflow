import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, CheckCircle, Calendar } from 'lucide-react';
import { useState, useEffect } from 'react';

interface Notification {
  id: number;
  type: 'waitlist' | 'program' | 'appointment';
  name: string;
  location: string;
  action: string;
  icon: typeof Users;
}

export default function SocialProofNotifications() {
  const [currentNotification, setCurrentNotification] = useState<Notification | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  const notifications: Notification[] = [
    { id: 1, type: 'waitlist', name: 'Marie-Claude', location: 'Québec', action: 'vient de rejoindre la liste d\'attente', icon: Calendar },
    { id: 2, type: 'program', name: 'Philippe', location: 'Lévis', action: 'a complété le Programme Reconnexion - Module 7', icon: CheckCircle },
    { id: 3, type: 'appointment', name: 'Sophie', location: 'Ste-Foy', action: 'vient de réserver une évaluation', icon: Calendar },
    { id: 4, type: 'program', name: 'Isabelle', location: 'Québec', action: 'a démarré le Programme Reconnexion', icon: Users },
    { id: 5, type: 'waitlist', name: 'Martin', location: 'Beauport', action: 'vient de s\'inscrire', icon: Users },
  ];

  useEffect(() => {
    if (isDismissed) return;

    const showNotification = () => {
      const randomNotification = notifications[Math.floor(Math.random() * notifications.length)];
      setCurrentNotification(randomNotification);
      setIsVisible(true);

      setTimeout(() => {
        setIsVisible(false);
      }, 5000);
    };

    const interval = setInterval(showNotification, 45000);

    const initialDelay = setTimeout(showNotification, 10000);

    return () => {
      clearInterval(interval);
      clearTimeout(initialDelay);
    };
  }, [isDismissed]);

  const handleDismiss = () => {
    setIsVisible(false);
    setIsDismissed(true);
  };

  return (
    <AnimatePresence>
      {isVisible && currentNotification && (
        <motion.div
          initial={{ opacity: 0, x: -100, scale: 0.8 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: -100, scale: 0.8 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          className="fixed bottom-24 left-4 z-30 max-w-sm"
        >
          <div className="glass border border-primary-200 rounded-2xl shadow-soft-lg p-4 pr-12 relative">
            <button
              onClick={handleDismiss}
              className="absolute top-2 right-2 w-6 h-6 bg-muted-200 hover:bg-muted-300 rounded-full flex items-center justify-center transition-colors"
              aria-label="Fermer"
            >
              <X className="w-3 h-3 text-muted-700" />
            </button>

            <div className="flex items-start space-x-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                currentNotification.type === 'program' ? 'bg-primary' :
                currentNotification.type === 'appointment' ? 'bg-accent' :
                'bg-muted-600'
              }`}>
                <currentNotification.icon className="w-5 h-5 text-white" />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">
                  {currentNotification.name} de {currentNotification.location}
                </p>
                <p className="text-xs text-muted-700 mt-0.5">
                  {currentNotification.action}
                </p>
                <p className="text-xs text-muted-500 mt-1">
                  Il y a quelques instants
                </p>
              </div>
            </div>

            <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted-200 rounded-b-2xl overflow-hidden">
              <motion.div
                initial={{ width: '100%' }}
                animate={{ width: '0%' }}
                transition={{ duration: 5, ease: 'linear' }}
                className={`h-full ${
                  currentNotification.type === 'program' ? 'bg-primary' :
                  currentNotification.type === 'appointment' ? 'bg-accent' :
                  'bg-muted-600'
                }`}
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
