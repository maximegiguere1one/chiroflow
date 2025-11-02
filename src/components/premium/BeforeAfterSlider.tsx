import React, { useState, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { useElementInView } from '../../hooks/useScrollProgress';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { CheckCircle, XCircle } from 'lucide-react';

export const BeforeAfterSlider: React.FC = () => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const { ref, isInView } = useElementInView(0.3);
  const prefersReducedMotion = useReducedMotion();
  const rafRef = useRef<number>();

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }

    rafRef.current = requestAnimationFrame(() => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percentage = (x / rect.width) * 100;
      setSliderPosition(Math.max(0, Math.min(100, percentage)));
    });
  }, []);

  return (
    <section
      ref={ref as any}
      className="relative py-32 bg-slate-900 overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          className="text-center mb-20"
        >
          <span className="inline-block px-6 py-2 bg-emerald-500/20 text-emerald-300 rounded-full text-sm font-semibold mb-6">
            Transformation complète
          </span>
          <h2 className="text-5xl lg:text-6xl font-bold text-white mb-6">
            Avec ou Sans Assistante
          </h2>
          <p className="text-xl text-slate-400 max-w-3xl mx-auto">
            Comparaison directe entre une clinique traditionnelle et ChiroFlow
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-16 mb-16">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            <h3 className="text-3xl font-bold text-white flex items-center space-x-3">
              <XCircle className="w-8 h-8 text-red-400" />
              <span>Avec assistante (Avant)</span>
            </h3>
            {[
              'Payer 40 000-50 000$/an en salaire',
              'Gérer les vacances, congés maladie',
              '2-3h/jour au téléphone pour rdv',
              'Rappels manuels = patients oubliés',
              'Facturation en retard, erreurs',
              'Stress constant de gestion d\'employé',
            ].map((text, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={isInView ? { opacity: 1, x: 0 } : {}}
                transition={{ delay: 0.3 + i * 0.1 }}
                className="flex items-center space-x-3 text-slate-300"
              >
                <div className="w-2 h-2 bg-red-400 rounded-full" />
                <span className="text-lg">{text}</span>
              </motion.div>
            ))}
            <div className="bg-red-900/20 rounded-xl p-4 border border-red-500/30 mt-6">
              <p className="text-red-400 font-bold">Coût total annuel : 50 000$+</p>
              <p className="text-sm text-red-300 mt-1">+ stress + gestion + imprévus</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            <h3 className="text-3xl font-bold text-white flex items-center space-x-3">
              <CheckCircle className="w-8 h-8 text-emerald-400" />
              <span>Avec ChiroFlow (Après)</span>
            </h3>
            {[
              'Réservation en ligne 24/7 automatique',
              'Rappels automatiques (courriel, SMS, appel)',
              'Agenda rempli pendant que vous dormez',
              'Facturation instantanée après chaque visite',
              'Zéro gestion d\'employé, zéro stress',
              'Liste d\'attente = aucune perte de revenu',
            ].map((text, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 20 }}
                animate={isInView ? { opacity: 1, x: 0 } : {}}
                transition={{ delay: 0.3 + i * 0.1 }}
                className="flex items-center space-x-3 text-emerald-300"
              >
                <CheckCircle className="w-5 h-5 text-emerald-400" />
                <span className="text-lg font-medium">{text}</span>
              </motion.div>
            ))}
            <div className="bg-emerald-900/20 rounded-xl p-4 border border-emerald-500/30 mt-6">
              <p className="text-emerald-400 font-bold">Coût total annuel : 948$ (79$/mois)</p>
              <p className="text-sm text-emerald-300 mt-1">Économie de 49 052$/an 🎉</p>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={isInView ? { opacity: 1, scale: 1 } : {}}
          transition={{ delay: 0.6 }}
          className="relative w-full h-96 bg-slate-800 rounded-3xl overflow-hidden shadow-2xl cursor-ew-resize"
          onMouseMove={handleMouseMove}
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="absolute left-0 w-1/2 h-full bg-red-900/20 flex items-center justify-center">
              <span className="text-white text-2xl font-bold">Avant</span>
            </div>
            <div className="absolute right-0 w-1/2 h-full bg-emerald-900/20 flex items-center justify-center">
              <span className="text-white text-2xl font-bold">Après</span>
            </div>
          </div>

          <motion.div
            className="absolute top-0 bottom-0 w-1 bg-white shadow-lg"
            style={{ left: `${sliderPosition}%` }}
            animate={{ opacity: [0.8, 1, 0.8] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-full shadow-xl flex items-center justify-center">
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 18l-6-6 6-6M9 18l-6-6 6-6" />
              </svg>
            </div>
          </motion.div>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.8 }}
          className="text-center text-slate-400 mt-8"
        >
          Déplacez le curseur pour comparer
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 1 }}
          className="mt-16 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 rounded-3xl p-12 border border-emerald-500/30"
        >
          <h3 className="text-3xl font-bold text-white text-center mb-8">
            Économie réelle par an
          </h3>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400 mb-2">
                49 052$
              </div>
              <div className="text-slate-400">Salaire assistante économisé</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400 mb-2">
                520h
              </div>
              <div className="text-slate-400">Heures de vie récupérées</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400 mb-2">
                100%
              </div>
              <div className="text-slate-400">Automatisation garantie</div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
