import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, ChevronLeft, ChevronRight, Quote } from 'lucide-react';
import { useElementInView } from '../../hooks/useScrollProgress';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { ANIMATION_DELAYS, GPU_OPTIMIZED_STYLES } from '../../lib/animations/optimized';

interface Testimonial {
  name: string;
  role: string;
  location: string;
  rating: number;
  quote: string;
  result: string;
}

const testimonials: Testimonial[] = [
  {
    name: 'Dr Sarah Tremblay',
    role: 'Chiropraticienne, Clinique Santé Globale',
    location: 'Laval, QC',
    rating: 5,
    quote:
      "Avant ChiroFlow, je finissais à 19h30 chaque soir pour la paperasse. Maintenant? Je ferme à 17h et profite de mes soirées avec mes enfants. Cette liberté a transformé ma vie de mère et de chiropraticienne.",
    result: '3 heures gagnées par jour • 75% moins d\'absences • 0 appel de rappel',
  },
  {
    name: 'Dr Marc Dubois',
    role: 'Propriétaire, Clinique Alignement Optimal',
    location: 'Brossard, QC',
    rating: 5,
    quote:
      "J'avais 5-6 plages vides par semaine à cause des annulations. Maintenant la liste d'attente les remplit en 15 minutes. Ça m'a rapporté 28 000$ de plus la première année.",
    result: '28 000$ de revenus additionnels • Agenda plein à 98% • Zéro stress',
  },
  {
    name: 'Dr Julie Bergeron',
    role: 'Chiropraticienne, Santé en Mouvement',
    location: 'Sherbrooke, QC',
    rating: 5,
    quote:
      "Je ne réponds plus au téléphone pour les rendez-vous. Mes patients réservent en ligne même à 22h le soir. Je peux enfin me concentrer sur ce que j'aime : soigner mes patients.",
    result: '95% des rdv pris en ligne • Satisfaction patients à 98% • Équipe moins stressée',
  },
];

export const TestimonialCarousel: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const { ref, isInView } = useElementInView(0.3);
  const prefersReducedMotion = useReducedMotion();

  const next = () => setCurrentIndex((i) => (i + 1) % testimonials.length);
  const prev = () => setCurrentIndex((i) => (i - 1 + testimonials.length) % testimonials.length);

  const current = testimonials[currentIndex];

  return (
    <section
      ref={ref as any}
      className="relative py-32 bg-gradient-to-b from-white to-slate-50 overflow-hidden"
    >
      <div className="absolute inset-0">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
          }}
          transition={{ duration: 20, repeat: Infinity }}
          className="absolute top-20 left-10 w-72 h-72 bg-emerald-200/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            rotate: [0, -90, 0],
          }}
          transition={{ duration: 25, repeat: Infinity }}
          className="absolute bottom-20 right-10 w-72 h-72 bg-teal-200/20 rounded-full blur-3xl"
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <span className="inline-block px-6 py-2 bg-yellow-100 text-yellow-800 rounded-full text-sm font-semibold mb-6">
            Témoignages authentiques
          </span>
          <h2 className="text-5xl lg:text-6xl font-bold text-slate-900 mb-6">
            Des chiros comme vous
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600">
              qui ont repris le contrôle
            </span>
          </h2>
        </motion.div>

        <div className="max-w-5xl mx-auto">
          <div className="relative bg-white rounded-3xl shadow-2xl p-8 lg:p-16 overflow-hidden">
            <div className="absolute top-8 left-8 opacity-10">
              <Quote className="w-24 h-24 text-emerald-600" />
            </div>

            <div className="flex items-center justify-center mb-8">
              <div className="flex space-x-1">
                {[...Array(5)].map((_, i) => (
                  <motion.div
                    key={`${currentIndex}-${i}`}
                    initial={prefersReducedMotion ? false : { scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{
                      type: 'spring',
                      stiffness: 260,
                      damping: 20,
                      delay: prefersReducedMotion ? 0 : i * ANIMATION_DELAYS.stagger,
                    }}
                    style={GPU_OPTIMIZED_STYLES}
                  >
                    <Star className="w-8 h-8 fill-yellow-400 text-yellow-400" />
                  </motion.div>
                ))}
              </div>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
                className="relative z-10"
              >
                <blockquote className="text-2xl lg:text-3xl text-slate-700 font-medium mb-8 leading-relaxed text-center italic">
                  "{current.quote}"
                </blockquote>

                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl p-6 mb-8 border border-emerald-200">
                  <p className="text-sm font-bold text-emerald-900 mb-1">Résultats concrets :</p>
                  <p className="text-lg text-emerald-800 font-semibold">{current.result}</p>
                </div>

                <div className="flex items-center justify-center space-x-4">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg"
                  >
                    {current.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')}
                  </motion.div>
                  <div className="text-left">
                    <div className="font-bold text-slate-900 text-lg">{current.name}</div>
                    <div className="text-slate-600">{current.role}</div>
                    <div className="text-sm text-slate-500">{current.location}</div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            <div className="flex items-center justify-center space-x-4 mt-12">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={prev}
                className="w-12 h-12 bg-slate-100 hover:bg-emerald-500 hover:text-white rounded-full flex items-center justify-center transition-colors shadow-lg"
              >
                <ChevronLeft className="w-6 h-6" />
              </motion.button>

              <div className="flex space-x-2">
                {testimonials.map((_, i) => (
                  <motion.button
                    key={i}
                    whileHover={{ scale: 1.2 }}
                    onClick={() => setCurrentIndex(i)}
                    className={`w-3 h-3 rounded-full transition-all duration-300 ${
                      i === currentIndex
                        ? 'bg-emerald-600 w-8'
                        : 'bg-slate-300 hover:bg-slate-400'
                    }`}
                  />
                ))}
              </div>

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={next}
                className="w-12 h-12 bg-slate-100 hover:bg-emerald-500 hover:text-white rounded-full flex items-center justify-center transition-colors shadow-lg"
              >
                <ChevronRight className="w-6 h-6" />
              </motion.button>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.5 }}
            className="mt-12 text-center"
          >
            <p className="text-slate-600 mb-4">Plus de 500 cliniques ont transformé leur pratique</p>
            <div className="flex items-center justify-center space-x-2">
              <div className="flex -space-x-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full border-2 border-white"
                  />
                ))}
              </div>
              <span className="text-slate-700 font-semibold">+500 cliniques au Québec</span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
