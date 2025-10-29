import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';

export default function EmpathyCard() {
  const concerns = [
    "Votre enfant ne dort pas depuis des mois?",
    "Les crises explosent sans raison apparente?",
    "Vous cherchez des réponses depuis trop longtemps?",
    "Vous vous sentez épuisés et démunis?"
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: 20, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      transition={{ duration: 0.6, delay: 0.8 }}
      className="absolute -right-4 top-1/2 -translate-y-1/2 hidden xl:block"
    >
      <div className="glass p-6 max-w-xs shadow-soft-lg border-2 border-primary-100">
        <div className="flex items-center space-x-2 mb-4">
          <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-600 rounded-full flex items-center justify-center">
            <Heart className="w-5 h-5 text-white" fill="currentColor" />
          </div>
          <h3 className="font-semibold text-foreground">On vous comprend...</h3>
        </div>

        <ul className="space-y-3">
          {concerns.map((concern, index) => (
            <motion.li
              key={index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1 + index * 0.15 }}
              className="flex items-start text-sm text-muted-800"
            >
              <span className="text-primary mr-2 flex-shrink-0">•</span>
              <span>{concern}</span>
            </motion.li>
          ))}
        </ul>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.6 }}
          className="mt-4 pt-4 border-t border-primary-100"
        >
          <p className="text-xs text-muted-700 italic">
            Vous n'êtes pas seuls. Nous sommes là pour vous aider.
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
}
