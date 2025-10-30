import { motion, AnimatePresence } from 'framer-motion';
import { Baby, Users, Heart as PregnantIcon, Brain, ArrowRight, CheckCircle, Clock } from 'lucide-react';
import { useState } from 'react';
import { trackEvent } from '../lib/analytics';

interface QuizResult {
  profile: string;
  recommendation: string;
  estimatedDuration: string;
  nextSteps: string[];
  reconnexionRelevant: boolean;
}

export default function QuizAssessment() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<{
    profile?: string;
    concern?: string;
    duration?: string;
  }>({});
  const [result, setResult] = useState<QuizResult | null>(null);

  const profiles = [
    { id: 'baby', label: 'Bébé 0-2 ans', icon: Baby, color: 'primary' },
    { id: 'child', label: 'Enfant 3-12 ans', icon: Users, color: 'accent' },
    { id: 'pregnant', label: 'Future maman', icon: PregnantIcon, color: 'primary' },
    { id: 'adult', label: 'Adulte (conditions neuro)', icon: Brain, color: 'accent' },
  ];

  const concernsByProfile: Record<string, string[]> = {
    baby: ['Coliques et reflux', 'Troubles du sommeil', 'Torticolis/plagiocéphalie', 'Difficultés d\'allaitement', 'Pleurs inconsolables'],
    child: ['TDA/H', 'Troubles du spectre autistique', 'Dyspraxie', 'Tics et TOC', 'Troubles sensoriels', 'Difficultés scolaires'],
    pregnant: ['Douleurs lombaires/pelviennes', 'Sciatique', 'Nausées sévères', 'Préparation accouchement', 'Positionnement bébé'],
    adult: ['Post-commotion', 'Migraines chroniques', 'Vertiges/étourdissements', 'Troubles posturaux', 'Douleurs chroniques'],
  };

  const durations = [
    { id: 'recent', label: 'Moins d\'un mois', urgency: 'low' },
    { id: 'moderate', label: '1-6 mois', urgency: 'moderate' },
    { id: 'long', label: '6 mois - 2 ans', urgency: 'high' },
    { id: 'chronic', label: 'Plus de 2 ans', urgency: 'critical' },
  ];

  const handleAnswer = (key: string, value: string) => {
    const newAnswers = { ...answers, [key]: value };
    setAnswers(newAnswers);

    if (step === 0) {
      trackEvent('quiz_step', 'profile_selected', value);
      setStep(1);
    } else if (step === 1) {
      trackEvent('quiz_step', 'concern_selected', value);
      setStep(2);
    } else if (step === 2) {
      trackEvent('quiz_step', 'duration_selected', value);
      calculateResult(newAnswers);
      setStep(3);
    }
  };

  const calculateResult = (finalAnswers: typeof answers) => {
    const isChildNeuro = (finalAnswers.profile === 'child' || finalAnswers.profile === 'adult') &&
      (finalAnswers.concern?.includes('TDA/H') || finalAnswers.concern?.includes('autistique') || finalAnswers.concern?.includes('Dyspraxie'));

    const isUrgent = finalAnswers.duration === 'long' || finalAnswers.duration === 'chronic';

    const profiles: Record<string, string> = {
      baby: 'Pédiatrie chiropratique',
      child: 'Neuropédiatrie fonctionnelle',
      pregnant: 'Obstétrique chiropratique',
      adult: 'Neurologie fonctionnelle',
    };

    const result: QuizResult = {
      profile: profiles[finalAnswers.profile || 'child'],
      recommendation: isChildNeuro
        ? 'Approche combinée recommandée: Soins chiropratiques + Programme Reconnexion'
        : 'Soins chiropratiques spécialisés avec suivi personnalisé',
      estimatedDuration: isUrgent ? '8-12 mois' : '3-6 mois',
      nextSteps: [
        'Évaluation complète initiale (60-90 min)',
        'Plan de soins personnalisé',
        ...(isChildNeuro ? ['Accès au Programme Reconnexion'] : []),
        'Suivi régulier avec ajustements',
      ],
      reconnexionRelevant: isChildNeuro || false,
    };

    setResult(result);
    trackEvent('quiz_complete', finalAnswers.profile || 'unknown');
  };

  const resetQuiz = () => {
    setStep(0);
    setAnswers({});
    setResult(null);
    trackEvent('quiz_reset');
  };

  const progressPercentage = (step / 3) * 100;

  return (
    <section className="py-24 bg-gradient-to-b from-primary-50/20 to-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <div className="inline-block px-4 py-2 bg-accent-100 text-accent-800 rounded-full text-sm font-semibold mb-4">
            Quiz personnalisé
          </div>
          <h2 className="text-h2 text-foreground mb-4">
            Trouvez votre solution en 3 questions
          </h2>
          <p className="text-body-lg text-muted-700">
            Recevez une recommandation adaptée à votre situation
          </p>
        </motion.div>

        <div className="card max-w-3xl mx-auto">
          {step < 3 && (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-muted-700">
                  Question {step + 1} sur 3
                </span>
                <span className="text-sm font-medium text-primary">
                  {Math.round(progressPercentage)}%
                </span>
              </div>
              <div className="w-full bg-muted-200 rounded-full h-2 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercentage}%` }}
                  transition={{ duration: 0.5 }}
                  className="h-full bg-gradient-to-r from-primary to-primary-600"
                />
              </div>
            </div>
          )}

          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.div
                key="step-0"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <h3 className="text-2xl font-bold text-foreground mb-6">
                  Pour qui cherchez-vous des soins aujourd'hui?
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {profiles.map((profile) => (
                    <motion.button
                      key={profile.id}
                      onClick={() => handleAnswer('profile', profile.id)}
                      whileHover={{ scale: 1.02, y: -4 }}
                      whileTap={{ scale: 0.98 }}
                      className="p-6 bg-white border-2 border-muted-200 rounded-2xl hover:border-primary transition-all text-left group"
                    >
                      <profile.icon className="w-12 h-12 text-primary mb-3 group-hover:scale-110 transition-transform" />
                      <h4 className="font-semibold text-foreground mb-1">{profile.label}</h4>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}

            {step === 1 && answers.profile && (
              <motion.div
                key="step-1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <h3 className="text-2xl font-bold text-foreground mb-6">
                  Quelle est votre principale préoccupation?
                </h3>
                <div className="space-y-3">
                  {concernsByProfile[answers.profile].map((concern) => (
                    <motion.button
                      key={concern}
                      onClick={() => handleAnswer('concern', concern)}
                      whileHover={{ x: 4 }}
                      className="w-full p-4 bg-white border-2 border-muted-200 rounded-xl hover:border-primary transition-all text-left group flex items-center justify-between"
                    >
                      <span className="text-foreground font-medium">{concern}</span>
                      <ArrowRight className="w-5 h-5 text-muted-400 group-hover:text-primary transition-colors" />
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step-2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <h3 className="text-2xl font-bold text-foreground mb-6">
                  Depuis combien de temps vivez-vous cette situation?
                </h3>
                <div className="space-y-3">
                  {durations.map((duration) => (
                    <motion.button
                      key={duration.id}
                      onClick={() => handleAnswer('duration', duration.id)}
                      whileHover={{ x: 4 }}
                      className="w-full p-4 bg-white border-2 border-muted-200 rounded-xl hover:border-primary transition-all text-left group flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-3">
                        <Clock className={`w-5 h-5 ${
                          duration.urgency === 'critical' ? 'text-accent-600' :
                          duration.urgency === 'high' ? 'text-accent-500' :
                          duration.urgency === 'moderate' ? 'text-primary' :
                          'text-muted-400'
                        }`} />
                        <span className="text-foreground font-medium">{duration.label}</span>
                      </div>
                      <ArrowRight className="w-5 h-5 text-muted-400 group-hover:text-primary transition-colors" />
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}

            {step === 3 && result && (
              <motion.div
                key="step-3"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                <div className="text-center mb-8">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring' }}
                    className="w-20 h-20 bg-gradient-to-br from-primary to-primary-600 rounded-full flex items-center justify-center mx-auto mb-4"
                  >
                    <CheckCircle className="w-10 h-10 text-white" />
                  </motion.div>
                  <h3 className="text-2xl font-bold text-foreground mb-2">
                    Voici votre recommandation personnalisée
                  </h3>
                </div>

                <div className="space-y-6">
                  <div className="p-6 bg-primary-50 rounded-2xl">
                    <h4 className="font-semibold text-foreground mb-2">Expertise recommandée</h4>
                    <p className="text-primary-800 font-medium">{result.profile}</p>
                  </div>

                  <div className="p-6 bg-accent-50 rounded-2xl">
                    <h4 className="font-semibold text-foreground mb-2">Approche suggérée</h4>
                    <p className="text-muted-700">{result.recommendation}</p>
                  </div>

                  <div className="p-6 bg-muted-50 rounded-2xl">
                    <h4 className="font-semibold text-foreground mb-2">Durée estimée</h4>
                    <p className="text-muted-700">{result.estimatedDuration} de suivi</p>
                  </div>

                  <div className="p-6 bg-white border-2 border-muted-200 rounded-2xl">
                    <h4 className="font-semibold text-foreground mb-4">Prochaines étapes</h4>
                    <ul className="space-y-3">
                      {result.nextSteps.map((step, idx) => (
                        <motion.li
                          key={idx}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.5 + idx * 0.1 }}
                          className="flex items-start"
                        >
                          <CheckCircle className="w-5 h-5 text-primary mr-2 flex-shrink-0 mt-0.5" />
                          <span className="text-muted-700">{step}</span>
                        </motion.li>
                      ))}
                    </ul>
                  </div>

                  {result.reconnexionRelevant && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.8 }}
                      className="p-6 bg-gradient-to-br from-primary-600 to-primary-700 rounded-2xl text-white"
                    >
                      <h4 className="font-bold mb-2">💡 Recommandation spéciale</h4>
                      <p className="text-primary-50 mb-4">
                        Le Programme Reconnexion est particulièrement adapté à votre situation. Il peut être démarré immédiatement, même pendant l'attente de votre premier rendez-vous.
                      </p>
                      <a
                        href="#reconnexion"
                        onClick={() => trackEvent('quiz_reconnexion_click')}
                        className="inline-block px-6 py-3 bg-white text-primary rounded-full font-semibold hover:bg-primary-50 transition-colors"
                      >
                        Découvrir le Programme Reconnexion
                      </a>
                    </motion.div>
                  )}

                  <div className="flex flex-col sm:flex-row gap-4">
                    <button
                      onClick={resetQuiz}
                      className="btn-secondary"
                    >
                      Recommencer le quiz
                    </button>
                    <a
                      href="#contact"
                      onClick={() => trackEvent('quiz_contact_click')}
                      className="btn-primary flex-1 text-center"
                    >
                      Réserver mon évaluation
                    </a>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
