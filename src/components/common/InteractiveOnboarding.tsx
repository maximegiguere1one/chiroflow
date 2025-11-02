import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, ArrowLeft, Check, Sparkles, Target } from 'lucide-react';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  target: string;
  position: 'top' | 'bottom' | 'left' | 'right';
  highlight?: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface InteractiveOnboardingProps {
  steps: OnboardingStep[];
  onComplete: () => void;
  onSkip: () => void;
  storageKey?: string;
}

export function InteractiveOnboarding({
  steps,
  onComplete,
  onSkip,
  storageKey = 'onboarding_completed'
}: InteractiveOnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const completed = localStorage.getItem(storageKey);
    if (!completed) {
      setTimeout(() => setIsVisible(true), 1000);
    }
  }, [storageKey]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    localStorage.setItem(storageKey, 'true');
    setIsVisible(false);
    onComplete();
  };

  const handleSkip = () => {
    localStorage.setItem(storageKey, 'true');
    setIsVisible(false);
    onSkip();
  };

  if (!isVisible) return null;

  const step = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
        onClick={handleSkip}
      />

      <AnimatePresence mode="wait">
        <OnboardingTooltip
          key={step.id}
          step={step}
          currentStep={currentStep}
          totalSteps={steps.length}
          progress={progress}
          onNext={handleNext}
          onBack={handleBack}
          onSkip={handleSkip}
        />
      </AnimatePresence>

      {step.highlight && (
        <SpotlightHighlight target={step.target} />
      )}
    </>
  );
}

function OnboardingTooltip({
  step,
  currentStep,
  totalSteps,
  progress,
  onNext,
  onBack,
  onSkip
}: {
  step: OnboardingStep;
  currentStep: number;
  totalSteps: number;
  progress: number;
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
}) {
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    const element = document.querySelector(step.target);
    if (element) {
      const rect = element.getBoundingClientRect();
      const pos = calculatePosition(rect, step.position);
      setPosition(pos);
    }
  }, [step.target, step.position]);

  const isLastStep = currentStep === totalSteps - 1;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      style={{
        position: 'fixed',
        top: position.top,
        left: position.left,
        zIndex: 100
      }}
      className="bg-white rounded-xl shadow-2xl p-6 max-w-md"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm font-medium text-gray-500">
            Étape {currentStep + 1} sur {totalSteps}
          </span>
        </div>
        <button
          onClick={onSkip}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="w-full h-2 bg-gray-100 rounded-full mb-4">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
        />
      </div>

      <h3 className="text-xl font-bold text-gray-900 mb-2">
        {step.title}
      </h3>

      <p className="text-gray-600 mb-6">
        {step.description}
      </p>

      {step.action && (
        <motion.button
          onClick={step.action.onClick}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full mb-4 px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg font-medium shadow-lg"
        >
          {step.action.label}
        </motion.button>
      )}

      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          disabled={currentStep === 0}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Précédent</span>
        </button>

        <motion.button
          onClick={onNext}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-2 px-6 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors"
        >
          <span>{isLastStep ? 'Terminer' : 'Suivant'}</span>
          {isLastStep ? (
            <Check className="w-4 h-4" />
          ) : (
            <ArrowRight className="w-4 h-4" />
          )}
        </motion.button>
      </div>
    </motion.div>
  );
}

function SpotlightHighlight({ target }: { target: string }) {
  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    const element = document.querySelector(target);
    if (element) {
      setRect(element.getBoundingClientRect());
    }
  }, [target]);

  if (!rect) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed',
        top: rect.top - 8,
        left: rect.left - 8,
        width: rect.width + 16,
        height: rect.height + 16,
        zIndex: 60
      }}
      className="pointer-events-none"
    >
      <div className="absolute inset-0 rounded-lg border-4 border-blue-500 shadow-2xl animate-pulse" />
      <div className="absolute inset-0 rounded-lg bg-blue-500/10" />
    </motion.div>
  );
}

function calculatePosition(
  rect: DOMRect,
  position: 'top' | 'bottom' | 'left' | 'right'
): { top: number; left: number } {
  const offset = 16;
  const tooltipWidth = 400;
  const tooltipHeight = 300;

  switch (position) {
    case 'top':
      return {
        top: rect.top - tooltipHeight - offset,
        left: rect.left + rect.width / 2 - tooltipWidth / 2
      };
    case 'bottom':
      return {
        top: rect.bottom + offset,
        left: rect.left + rect.width / 2 - tooltipWidth / 2
      };
    case 'left':
      return {
        top: rect.top + rect.height / 2 - tooltipHeight / 2,
        left: rect.left - tooltipWidth - offset
      };
    case 'right':
      return {
        top: rect.top + rect.height / 2 - tooltipHeight / 2,
        left: rect.right + offset
      };
    default:
      return {
        top: rect.bottom + offset,
        left: rect.left + rect.width / 2 - tooltipWidth / 2
      };
  }
}

export function useOnboarding(storageKey = 'onboarding_completed') {
  const [hasCompleted, setHasCompleted] = useState(false);

  useEffect(() => {
    const completed = localStorage.getItem(storageKey);
    setHasCompleted(!!completed);
  }, [storageKey]);

  const resetOnboarding = () => {
    localStorage.removeItem(storageKey);
    setHasCompleted(false);
  };

  return {
    hasCompleted,
    resetOnboarding
  };
}

export const defaultOnboardingSteps: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Bienvenue sur ChiroFlow! 🎉',
    description: 'Découvrez comment utiliser votre nouveau système de gestion en quelques minutes. Ce tour guidé vous montrera les fonctionnalités principales.',
    target: 'body',
    position: 'bottom',
    highlight: false
  },
  {
    id: 'dashboard',
    title: 'Votre tableau de bord',
    description: 'Ici vous voyez tous vos rendez-vous du jour et les tâches importantes. Commencez votre journée en un coup d\'oeil!',
    target: '[data-onboarding="dashboard"]',
    position: 'bottom',
    highlight: true
  },
  {
    id: 'quick-add',
    title: 'Ajout ultra-rapide',
    description: 'Créez un nouveau patient en 15 secondes! Juste le nom et un contact - vous complétez le reste plus tard.',
    target: '[data-onboarding="quick-add"]',
    position: 'bottom',
    highlight: true
  },
  {
    id: 'search',
    title: 'Recherche universelle ⌘K',
    description: 'Trouvez n\'importe quoi instantanément: patients, rendez-vous, documents. Appuyez sur ⌘K (Ctrl+K sur Windows) pour ouvrir.',
    target: '[data-onboarding="search"]',
    position: 'bottom',
    highlight: true
  },
  {
    id: 'sidebar',
    title: 'Navigation simplifiée',
    description: 'Seulement 3 sections principales: Ma Journée, Patients & RDV, et Configuration. Tout est à portée de clic!',
    target: '[data-onboarding="sidebar"]',
    position: 'right',
    highlight: true
  },
  {
    id: 'complete',
    title: 'Vous êtes prêt! 🚀',
    description: 'Vous connaissez maintenant l\'essentiel. Explorez à votre rythme - tout est intuitif et vous ne pouvez rien casser!',
    target: 'body',
    position: 'bottom',
    highlight: false,
    action: {
      label: 'Commencer à utiliser ChiroFlow',
      onClick: () => {}
    }
  }
];
