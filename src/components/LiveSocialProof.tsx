import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserCheck, MapPin, Clock } from 'lucide-react';

interface Notification {
  id: number;
  name: string;
  location: string;
  action: string;
  timeAgo: string;
}

const notifications: Notification[] = [
  { id: 1, name: 'Sophie L.', location: 'Québec', action: 'a pris rendez-vous', timeAgo: 'il y a 3 minutes' },
  { id: 2, name: 'Marc D.', location: 'Lévis', action: 's\'est inscrit au Programme Reconnexion', timeAgo: 'il y a 8 minutes' },
  { id: 3, name: 'Julie M.', location: 'Ste-Foy', action: 'a rejoint la liste d\'attente', timeAgo: 'il y a 12 minutes' },
  { id: 4, name: 'Catherine B.', location: 'Cap-Rouge', action: 'a pris rendez-vous', timeAgo: 'il y a 18 minutes' },
  { id: 5, name: 'David R.', location: 'Charlesbourg', action: 'a consulté les services', timeAgo: 'il y a 25 minutes' },
  { id: 6, name: 'Isabelle T.', location: 'Québec', action: 'a téléchargé le guide gratuit', timeAgo: 'il y a 32 minutes' },
];

export default function LiveSocialProof() {
  const [currentNotification, setCurrentNotification] = useState<Notification>(notifications[0]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    let index = 0;

    const showNextNotification = () => {
      setIsVisible(true);
      setCurrentNotification(notifications[index]);

      setTimeout(() => {
        setIsVisible(false);
      }, 4000);

      index = (index + 1) % notifications.length;
    };

    const initialTimeout = setTimeout(() => {
      showNextNotification();
      const interval = setInterval(showNextNotification, 12000);
      return () => clearInterval(interval);
    }, 5000);

    return () => clearTimeout(initialTimeout);
  }, []);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, x: -100, scale: 0.8 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: -100, scale: 0.8 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          className="fixed bottom-24 left-4 z-30 max-w-sm"
        >
          <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-lifted border border-sage-200/50 p-4 flex items-start gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center flex-shrink-0">
              <UserCheck className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground mb-1">
                {currentNotification.name} {currentNotification.action}
              </p>
              <div className="flex items-center gap-3 text-xs text-muted-600">
                <div className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  <span>{currentNotification.location}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{currentNotification.timeAgo}</span>
                </div>
              </div>
            </div>
            <motion.div
              className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-2"
              animate={{ scale: [1, 1.3, 1], opacity: [1, 0.6, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
