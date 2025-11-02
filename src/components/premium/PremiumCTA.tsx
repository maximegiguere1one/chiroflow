import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Shield, Zap, Award, CreditCard } from 'lucide-react';
import { useMagneticEffect } from '../../hooks/useMagneticEffect';
import { useElementInView } from '../../hooks/useScrollProgress';

export const PremiumCTA: React.FC = () => {
  const [price, setPrice] = useState(0);
  const { ref, isInView } = useElementInView(0.3);
  const ctaMagnetic = useMagneticEffect({ strength: 0.4, maxDistance: 100 });

  useEffect(() => {
    if (isInView) {
      let current = 0;
      const target = 79;
      const increment = target / 60;
      const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
          setPrice(target);
          clearInterval(timer);
        } else {
          setPrice(Math.floor(current));
        }
      }, 16);
      return () => clearInterval(timer);
    }
  }, [isInView]);

  return (
    <section
      ref={ref as any}
      className="relative py-32 bg-gradient-to-br from-emerald-600 via-teal-600 to-blue-700 overflow-hidden"
    >
      <div className="absolute inset-0">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            x: [0, 100, 0],
            y: [0, 50, 0],
          }}
          transition={{ duration: 20, repeat: Infinity }}
          className="absolute top-20 left-10 w-96 h-96 bg-white/10 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            x: [0, -80, 0],
            y: [0, 80, 0],
          }}
          transition={{ duration: 25, repeat: Infinity }}
          className="absolute bottom-20 right-10 w-96 h-96 bg-white/10 rounded-full blur-3xl"
        />
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={isInView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.8 }}
        >
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="inline-block mb-8"
          >
            <Award className="w-20 h-20 text-yellow-300" />
          </motion.div>

          <h2 className="text-5xl lg:text-7xl font-bold text-white mb-6 leading-tight">
            Transformez votre clinique
            <br />
            dès aujourd'hui
          </h2>
          <p className="text-2xl text-emerald-100 mb-12 max-w-3xl mx-auto">
            Rejoignez les 500+ cliniques qui ont éliminé leur assistante
          </p>

          <div className="bg-white/10 backdrop-blur-md rounded-3xl p-12 mb-12 border border-white/20">
            <div className="flex items-center justify-center space-x-4 mb-6">
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-3xl text-emerald-200 line-through"
              >
                4000$/mois
              </motion.span>
              <span className="text-white text-2xl">→</span>
              <AnimatePresence mode="wait">
                <motion.div
                  key={price}
                  initial={{ scale: 1.2, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-7xl lg:text-8xl font-bold text-white"
                >
                  {price}$
                  <span className="text-3xl">/mois</span>
                </motion.div>
              </AnimatePresence>
            </div>

            <motion.div
              initial={{ width: 0 }}
              animate={isInView ? { width: '100%' } : {}}
              transition={{ duration: 1, delay: 0.5 }}
              className="h-2 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full mb-6"
            />

            <p className="text-emerald-100 text-lg mb-2">
              <span className="font-bold text-yellow-300">Économisez 47 000$/an</span> vs salaire assistante
            </p>
            <p className="text-sm text-emerald-200">
              Plan Professionnel • Le plus populaire
            </p>
          </div>

          <motion.button
            ref={ctaMagnetic.ref as any}
            style={{
              x: ctaMagnetic.position.x,
              y: ctaMagnetic.position.y,
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => window.location.href = '/admin/signup'}
            className="group relative px-12 py-6 bg-white text-emerald-700 rounded-2xl font-bold text-xl shadow-2xl overflow-hidden mb-12"
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-emerald-100 to-teal-100"
              initial={{ x: '-100%' }}
              whileHover={{ x: 0 }}
              transition={{ duration: 0.3 }}
            />
            <span className="relative flex items-center space-x-3">
              <span>Essai gratuit 14 jours</span>
              <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
            </span>
          </motion.button>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 text-white">
            {[
              { icon: Zap, text: 'Configuration en 5 minutes' },
              { icon: Shield, text: 'Sans carte de crédit' },
              { icon: Award, text: '500+ cliniques satisfaites' },
              { icon: CreditCard, text: 'Annulation en tout temps' },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.8 + i * 0.1 }}
                className="flex flex-col items-center space-y-3 p-6 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20"
              >
                <item.icon className="w-8 h-8 text-emerald-300" />
                <span className="text-sm font-medium text-center">{item.text}</span>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 1.2 }}
            className="mt-12 bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20"
          >
            <h3 className="text-2xl font-bold text-white mb-6">
              Ce qui est inclus dans votre essai gratuit :
            </h3>
            <div className="grid md:grid-cols-3 gap-6 text-left">
              {[
                'Réservation en ligne illimitée',
                'Rappels automatiques (email, SMS)',
                'Gestion complète des patients',
                'Facturation & paiements',
                'Liste d\'attente intelligente',
                'Support en français 7j/7',
              ].map((feature, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ delay: 1.3 + i * 0.05 }}
                  className="flex items-center space-x-2 text-emerald-100"
                >
                  <div className="w-2 h-2 bg-emerald-300 rounded-full" />
                  <span className="text-sm">{feature}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ delay: 1.5 }}
            className="mt-8 text-emerald-100 text-sm"
          >
            Garantie satisfait ou remboursé 30 jours • Aucun engagement
          </motion.p>
        </motion.div>
      </div>
    </section>
  );
};
