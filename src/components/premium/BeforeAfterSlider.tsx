import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useElementInView } from '../../hooks/useScrollProgress';
import { CheckCircle, XCircle } from 'lucide-react';

export const BeforeAfterSlider: React.FC = () => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const { ref, isInView } = useElementInView(0.3);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = (x / rect.width) * 100;
    setSliderPosition(Math.max(0, Math.min(100, percentage)));
  };

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
          <span className="inline-block px-6 py-2 bg-cyan-500/20 text-cyan-300 rounded-full text-sm font-semibold mb-6">
            Transformation visible
          </span>
          <h2 className="text-5xl lg:text-6xl font-bold text-white mb-6">
            Avant / Après ChiroFlow
          </h2>
          <p className="text-xl text-slate-400 max-w-3xl mx-auto">
            Glissez pour voir la différence dans votre qualité de sommeil
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
              <span>Oreiller traditionnel</span>
            </h3>
            {[
              'Mal de cou au réveil',
              'Doit ajuster 3-4 fois par nuit',
              'Se tasse et perd sa forme',
              'Migraines fréquentes',
              'Sommeil agité et interrompu',
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
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            <h3 className="text-3xl font-bold text-white flex items-center space-x-3">
              <CheckCircle className="w-8 h-8 text-cyan-400" />
              <span>Avec ChiroFlow</span>
            </h3>
            {[
              'Réveil sans douleur, énergisé',
              'Aucun ajustement nécessaire',
              'Maintient son soutien à vie',
              'Zéro tension cervicale',
              'Sommeil profond continu',
            ].map((text, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 20 }}
                animate={isInView ? { opacity: 1, x: 0 } : {}}
                transition={{ delay: 0.3 + i * 0.1 }}
                className="flex items-center space-x-3 text-cyan-300"
              >
                <CheckCircle className="w-5 h-5 text-cyan-400" />
                <span className="text-lg font-medium">{text}</span>
              </motion.div>
            ))}
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
            <div className="absolute right-0 w-1/2 h-full bg-cyan-900/20 flex items-center justify-center">
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
      </div>
    </section>
  );
};
