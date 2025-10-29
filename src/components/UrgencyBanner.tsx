import { motion } from 'framer-motion';
import { AlertCircle, Clock, ArrowRight } from 'lucide-react';
import { trackEvent } from '../lib/analytics';

interface UrgencyBannerProps {
  onOpenAppointment: () => void;
}

export default function UrgencyBanner({ onOpenAppointment }: UrgencyBannerProps) {
  const urgentSigns = [
    'Crises quotidiennes épuisantes',
    'Régression développementale',
    'Douleurs importantes',
    'Impact scolaire sévère',
    'Situation familiale critique'
  ];

  const handleClick = () => {
    trackEvent('urgency_banner_click');
    onOpenAppointment();
  };

  return (
    <section className="py-16 bg-gradient-to-br from-accent-50 to-accent-100/50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative"
        >
          <div className="absolute -top-4 -left-4 w-24 h-24 bg-accent-200 rounded-full blur-3xl opacity-50" />
          <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-accent-300 rounded-full blur-3xl opacity-50" />

          <div className="relative bg-white rounded-2xl shadow-soft-lg border-2 border-accent-300 overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-accent-500 via-accent-400 to-accent-500" />

            <div className="p-8 md:p-10">
              <div className="flex items-start space-x-4 mb-6">
                <motion.div
                  animate={{
                    scale: [1, 1.1, 1],
                    rotate: [0, 5, -5, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                  className="flex-shrink-0"
                >
                  <div className="w-16 h-16 bg-gradient-to-br from-accent-500 to-accent-600 rounded-2xl flex items-center justify-center">
                    <AlertCircle className="w-8 h-8 text-white" />
                  </div>
                </motion.div>

                <div className="flex-1">
                  <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                    Votre situation est urgente?
                  </h3>
                  <p className="text-muted-700 leading-relaxed">
                    Nous comprenons que certaines situations nécessitent une attention immédiate. Nous priorisons les cas complexes.
                  </p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-8 mb-8">
                <div>
                  <h4 className="font-semibold text-foreground mb-4 flex items-center space-x-2">
                    <span>Si votre enfant présente:</span>
                  </h4>
                  <ul className="space-y-3">
                    {urgentSigns.map((sign, index) => (
                      <motion.li
                        key={index}
                        initial={{ opacity: 0, x: -10 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-start"
                      >
                        <span className="text-accent-600 mr-2 text-lg">•</span>
                        <span className="text-muted-700">{sign}</span>
                      </motion.li>
                    ))}
                  </ul>
                </div>

                <div className="bg-accent-50 rounded-2xl p-6">
                  <h4 className="font-semibold text-foreground mb-4">Notre engagement</h4>
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <Clock className="w-5 h-5 text-accent-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-foreground text-sm">Réponse rapide</p>
                        <p className="text-xs text-muted-600">Évaluation dans les 48h</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <AlertCircle className="w-5 h-5 text-accent-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-foreground text-sm">Priorité aux urgences</p>
                        <p className="text-xs text-muted-600">Cas complexes en tête de liste</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <ArrowRight className="w-5 h-5 text-accent-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-foreground text-sm">Plan d'action immédiat</p>
                        <p className="text-xs text-muted-600">Stratégies dès le premier rendez-vous</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleClick}
                  className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-accent-500 to-accent-600 text-white rounded-full font-semibold shadow-soft hover:shadow-soft-lg transition-all flex items-center justify-center space-x-2"
                  data-analytics-event="urgency_banner_submit"
                >
                  <span>Remplir le formulaire d'urgence</span>
                  <ArrowRight className="w-5 h-5" />
                </motion.button>

                <p className="text-sm text-muted-600 text-center sm:text-left">
                  <Clock className="w-4 h-4 inline mr-1" />
                  Prend seulement 2 minutes
                </p>
              </div>

              <div className="mt-6 pt-6 border-t border-accent-200">
                <p className="text-xs text-center text-muted-600 italic">
                  Cette prioritisation est offerte sans frais supplémentaires. Nous sommes là pour vous aider quand vous en avez le plus besoin.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
