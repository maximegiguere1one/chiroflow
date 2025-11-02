import React, { useEffect, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';
import { motionConfig } from '../../lib/motion-config';
import { useMagneticEffect } from '../../hooks/useMagneticEffect';

export const HeroSectionPremium: React.FC = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const { scrollY } = useScroll();
  const ctaMagnetic = useMagneticEffect({ strength: 0.3, maxDistance: 80 });

  const y = useTransform(scrollY, [0, 500], [0, 150]);
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);
  const scale = useTransform(scrollY, [0, 300], [1, 0.95]);
  const blur = useTransform(scrollY, [0, 300], [0, 10]);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const words = ['Confort', 'révolutionnaire', 'pour', 'votre', 'corps'];

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100">
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute top-20 left-10 w-96 h-96 bg-blue-200/40 rounded-full mix-blend-multiply filter blur-3xl"
          animate={{
            x: [0, 100, 0],
            y: [0, 50, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        <motion.div
          className="absolute top-40 right-20 w-96 h-96 bg-cyan-200/40 rounded-full mix-blend-multiply filter blur-3xl"
          animate={{
            x: [0, -80, 0],
            y: [0, 80, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        <motion.div
          className="absolute -bottom-20 left-1/2 w-96 h-96 bg-slate-200/40 rounded-full mix-blend-multiply filter blur-3xl"
          animate={{
            x: [0, 60, 0],
            y: [0, -60, 0],
            scale: [1, 1.15, 1],
          }}
          transition={{
            duration: 22,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      </div>

      <motion.div
        style={{ y, opacity, scale }}
        className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center"
      >
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={isLoaded ? { opacity: 1, y: 0 } : {}}
          transition={{ ...motionConfig.spring.smooth, delay: 0.2 }}
          className="inline-flex items-center space-x-2 bg-white/70 backdrop-blur-md border border-slate-200/50 text-slate-700 px-6 py-3 rounded-full text-sm font-medium mb-12 shadow-lg"
        >
          <Sparkles className="w-4 h-4 text-cyan-600" />
          <span>Technologie brevetée • Science du confort</span>
        </motion.div>

        <div className="mb-8">
          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold text-slate-900 leading-tight mb-4">
            {words.map((word, index) => (
              <motion.span
                key={word}
                initial={{ opacity: 0, y: 30, rotateX: -90 }}
                animate={isLoaded ? { opacity: 1, y: 0, rotateX: 0 } : {}}
                transition={{
                  ...motionConfig.spring.medium,
                  delay: 0.4 + index * 0.1,
                }}
                className="inline-block mr-4"
                style={{ transformOrigin: 'bottom' }}
              >
                {word}
              </motion.span>
            ))}
          </h1>
        </div>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={isLoaded ? { opacity: 1, y: 0 } : {}}
          transition={{ ...motionConfig.spring.smooth, delay: 1.2 }}
          className="text-xl md:text-2xl text-slate-600 mb-12 max-w-3xl mx-auto leading-relaxed"
        >
          Une innovation qui s'adapte à vous. ChiroFlow allie la science de l'eau
          à l'intelligence du design pour un{' '}
          <span className="font-semibold text-cyan-700">soutien parfait</span>,
          nuit après nuit.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={isLoaded ? { opacity: 1, scale: 1 } : {}}
          transition={{ ...motionConfig.spring.bouncy, delay: 1.5 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-16"
        >
          <motion.button
            ref={ctaMagnetic.ref as any}
            style={{
              x: ctaMagnetic.position.x,
              y: ctaMagnetic.position.y,
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="group relative px-10 py-5 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-2xl font-semibold text-lg shadow-2xl shadow-cyan-600/30 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-cyan-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <span className="relative flex items-center space-x-2">
              <span>Découvrir le confort parfait</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </span>
            <motion.div
              className="absolute inset-0 bg-white/20"
              initial={{ x: '-100%', skewX: -20 }}
              whileHover={{ x: '200%' }}
              transition={{ duration: 0.6 }}
            />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="px-10 py-5 bg-white/80 backdrop-blur-sm border-2 border-slate-300 text-slate-900 rounded-2xl font-semibold text-lg shadow-lg hover:bg-white hover:border-cyan-400 transition-all duration-300"
          >
            Voir la démo (30s)
          </motion.button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={isLoaded ? { opacity: 1 } : {}}
          transition={{ delay: 2 }}
          className="flex flex-wrap items-center justify-center gap-8 text-sm text-slate-600"
        >
          {[
            '⭐ 4.9/5 • 15 000+ clients satisfaits',
            '🚚 Livraison express gratuite',
            '🔒 Garantie 100 nuits',
            '🇨🇦 Conçu au Canada',
          ].map((text, i) => (
            <motion.div
              key={text}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 2 + i * 0.1 }}
              className="flex items-center space-x-2"
            >
              <span>{text}</span>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={isLoaded ? { opacity: 1, scale: 1 } : {}}
          transition={{ ...motionConfig.spring.soft, delay: 1.8 }}
          className="mt-20"
          style={{ filter: `blur(${blur}px)` }}
        >
          <div className="relative w-full max-w-4xl mx-auto aspect-[16/10] bg-gradient-to-br from-slate-200 to-slate-300 rounded-3xl shadow-2xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/20 to-blue-500/20" />
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              animate={{
                y: [0, -10, 0],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              <div className="w-3/4 h-3/4 bg-white/30 backdrop-blur-md rounded-2xl border border-white/50 shadow-xl" />
            </motion.div>
          </div>
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.5 }}
        className="absolute bottom-10 left-1/2 transform -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="text-slate-400 text-sm flex flex-col items-center space-y-2"
        >
          <span>Découvrez la science</span>
          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12l7 7 7-7" />
          </svg>
        </motion.div>
      </motion.div>
    </section>
  );
};
