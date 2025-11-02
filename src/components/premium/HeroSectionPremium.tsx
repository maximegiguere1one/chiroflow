import React, { useEffect, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, Sparkles, Zap } from 'lucide-react';
import { motionConfig } from '../../lib/motion-config';
import { useMagneticEffect } from '../../hooks/useMagneticEffect';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { ANIMATION_DELAYS, ANIMATION_DURATIONS, GPU_OPTIMIZED_STYLES } from '../../lib/animations/optimized';

export const HeroSectionPremium: React.FC = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const prefersReducedMotion = useReducedMotion();
  const { scrollY } = useScroll();
  const ctaMagnetic = useMagneticEffect({ strength: 0.3, maxDistance: 80 });

  const y = useTransform(scrollY, [0, 500], [0, 150]);
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);
  const scale = useTransform(scrollY, [0, 300], [1, 0.95]);
  const blur = useTransform(scrollY, [0, 300], [0, 10]);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const words = ['Économisez', '50 000$', 'et', 'récupérez', '10h/semaine'];

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-emerald-50 via-teal-50/30 to-slate-100">
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute top-20 left-10 w-96 h-96 bg-emerald-200/40 rounded-full mix-blend-multiply filter blur-3xl"
          style={GPU_OPTIMIZED_STYLES}
          animate={prefersReducedMotion ? {} : {
            x: [0, 100, 0],
            y: [0, 50, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 30,
            repeat: Infinity,
            repeatType: 'reverse',
            ease: 'easeInOut',
          }}
        />
        <motion.div
          className="absolute top-40 right-20 w-96 h-96 bg-teal-200/40 rounded-full mix-blend-multiply filter blur-3xl"
          style={GPU_OPTIMIZED_STYLES}
          animate={prefersReducedMotion ? {} : {
            x: [0, -80, 0],
            y: [0, 80, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 35,
            repeat: Infinity,
            repeatType: 'reverse',
            ease: 'easeInOut',
          }}
        />
        <motion.div
          className="absolute -bottom-20 left-1/2 w-96 h-96 bg-blue-200/40 rounded-full mix-blend-multiply filter blur-3xl"
          style={GPU_OPTIMIZED_STYLES}
          animate={prefersReducedMotion ? {} : {
            x: [0, 60, 0],
            y: [0, -60, 0],
            scale: [1, 1.15, 1],
          }}
          transition={{
            duration: 32,
            repeat: Infinity,
            repeatType: 'reverse',
            ease: 'easeInOut',
          }}
        />
      </div>

      <motion.div
        style={{ y, opacity, scale }}
        className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center"
      >
        <motion.div
          initial={prefersReducedMotion ? false : { opacity: 0, y: -20 }}
          animate={isLoaded && !prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 1, y: 0 }}
          transition={{ ...motionConfig.spring.smooth, delay: prefersReducedMotion ? 0 : ANIMATION_DELAYS.stagger }}
          className="inline-flex items-center space-x-2 bg-white/70 backdrop-blur-md border border-emerald-200/50 text-emerald-700 px-6 py-3 rounded-full text-sm font-medium mb-12 shadow-lg"
        >
          <Sparkles className="w-4 h-4 text-emerald-600" />
          <span>500+ cliniques québécoises • Économie moyenne 47 052$/an</span>
        </motion.div>

        <div className="mb-8">
          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold text-slate-900 leading-tight mb-4">
            {words.map((word, index) => (
              <motion.span
                key={word}
                initial={prefersReducedMotion ? false : { opacity: 0, y: 30, rotateX: -90 }}
                animate={isLoaded && !prefersReducedMotion ? { opacity: 1, y: 0, rotateX: 0 } : { opacity: 1, y: 0, rotateX: 0 }}
                transition={{
                  ...motionConfig.spring.medium,
                  delay: prefersReducedMotion ? 0 : (ANIMATION_DELAYS.section + index * ANIMATION_DELAYS.stagger),
                }}
                style={GPU_OPTIMIZED_STYLES}
                className="inline-block mr-4"
                style={{ transformOrigin: 'bottom' }}
              >
                {word === '50 000$' || word === '10h/semaine' ? (
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600">
                    {word}
                  </span>
                ) : (
                  word
                )}
              </motion.span>
            ))}
          </h1>
        </div>

        <motion.p
          initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
          animate={isLoaded && !prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 1, y: 0 }}
          transition={{ ...motionConfig.spring.smooth, delay: prefersReducedMotion ? 0 : ANIMATION_DELAYS.medium * 2 }}
          className="text-xl md:text-2xl text-slate-600 mb-12 max-w-3xl mx-auto leading-relaxed"
        >
          Automatisez votre clinique chiropratique et éliminez les coûts d'assistante.{' '}
          <span className="font-semibold text-emerald-700">Notre logiciel gère vos réservations 24/7, envoie les rappels et facture instantanément.</span>{' '}
          Plus de 500 cliniques québécoises économisent 47 052$/an avec ChiroFlow.
        </motion.p>

        <motion.div
          initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.8 }}
          animate={isLoaded && !prefersReducedMotion ? { opacity: 1, scale: 1 } : { opacity: 1, scale: 1 }}
          transition={{ ...motionConfig.spring.bouncy, delay: prefersReducedMotion ? 0 : ANIMATION_DELAYS.medium * 2.5 }}
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
            onClick={() => window.location.href = '/admin/signup'}
            className="group relative px-10 py-5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-2xl font-semibold text-lg shadow-2xl shadow-emerald-600/30 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-teal-600 to-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <span className="relative flex items-center space-x-2">
              <span>Commencer mon essai gratuit</span>
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
            className="px-10 py-5 bg-white/80 backdrop-blur-sm border-2 border-slate-300 text-slate-900 rounded-2xl font-semibold text-lg shadow-lg hover:bg-white hover:border-emerald-400 transition-all duration-300"
          >
            📞 Parler à un expert
          </motion.button>
        </motion.div>

        <motion.div
          initial={prefersReducedMotion ? false : { opacity: 0 }}
          animate={isLoaded ? { opacity: 1 } : {}}
          transition={{ delay: prefersReducedMotion ? 0 : ANIMATION_DELAYS.medium * 3 }}
          className="flex flex-wrap items-center justify-center gap-8 text-sm text-slate-600"
        >
          {[
            '⭐ 4.9/5 • 500+ cliniques',
            '✅ Sans carte de crédit',
            '⚡ Opérationnel en 5 minutes',
            '🇨🇦 Support québécois 24/7',
          ].map((text, i) => (
            <motion.div
              key={text}
              initial={prefersReducedMotion ? false : { opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: prefersReducedMotion ? 0 : (ANIMATION_DELAYS.medium * 3 + i * ANIMATION_DELAYS.stagger) }}
              className="flex items-center space-x-2"
            >
              <span>{text}</span>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.9 }}
          animate={isLoaded && !prefersReducedMotion ? { opacity: 1, scale: 1 } : { opacity: 1, scale: 1 }}
          transition={{ ...motionConfig.spring.soft, delay: prefersReducedMotion ? 0 : ANIMATION_DELAYS.medium * 2.2 }}
          className="mt-20"
          style={{ filter: prefersReducedMotion ? 'none' : `blur(${Math.min(blur, 5)}px)` }}
        >
          <div className="relative w-full max-w-5xl mx-auto aspect-[16/9] bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-slate-700">
            <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/10 to-teal-500/10" />
            <motion.div
              className="absolute inset-0 flex items-center justify-center p-8"
              animate={prefersReducedMotion ? {} : {
                y: [0, -10, 0],
              }}
              transition={{
                duration: 5,
                repeat: Infinity,
                repeatType: 'reverse',
                ease: 'easeInOut',
              }}
              style={GPU_OPTIMIZED_STYLES}
            >
              <div className="w-full h-full bg-slate-900/50 backdrop-blur-md rounded-2xl border border-emerald-500/30 shadow-xl p-8">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                    <Zap className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-white font-bold text-xl">ChiroFlow Dashboard</span>
                </div>
                <div className="space-y-3">
                  <div className="h-3 bg-emerald-500/30 rounded w-3/4"></div>
                  <div className="h-3 bg-teal-500/30 rounded w-1/2"></div>
                  <div className="h-3 bg-emerald-500/30 rounded w-2/3"></div>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isLoaded ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 2.3 }}
          className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto"
        >
          {[
            { value: '10h+', label: 'gagnées/semaine' },
            { value: '85%', label: 'moins d\'absences' },
            { value: '0$', label: 'frais assistante' },
            { value: '100%', label: 'automatisé' },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: prefersReducedMotion ? 0 : (ANIMATION_DELAYS.medium * 3.5 + i * ANIMATION_DELAYS.stagger) }}
              className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-slate-200"
            >
              <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600 mb-2">
                {stat.value}
              </div>
              <div className="text-sm text-slate-600">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.5 }}
        className="absolute bottom-10 left-1/2 transform -translate-x-1/2"
      >
        <motion.div
          animate={prefersReducedMotion ? {} : { y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity, repeatType: 'reverse' }}
          style={GPU_OPTIMIZED_STYLES}
          className="text-slate-400 text-sm flex flex-col items-center space-y-2"
        >
          <span>Découvrez comment ça fonctionne</span>
          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12l7 7 7-7" />
          </svg>
        </motion.div>
      </motion.div>
    </section>
  );
};
