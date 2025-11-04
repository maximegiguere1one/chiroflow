import React, { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import {
  ArrowRight,
  CheckCircle,
  Zap,
  Clock,
  DollarSign,
  Users,
  Star,
  Calendar,
  TrendingUp,
  Shield,
  Sparkles,
  PlayCircle,
} from 'lucide-react';

const AnimatedCounter: React.FC<{ end: number; duration?: number; suffix?: string; prefix?: string }> = ({
  end,
  duration = 2,
  suffix = '',
  prefix = '',
}) => {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;

    let startTime: number;
    let animationFrame: number;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / (duration * 1000), 1);

      setCount(Math.floor(progress * end));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [end, duration, isInView]);

  return (
    <div ref={ref}>
      {prefix}
      {count}
      {suffix}
    </div>
  );
};

const FeatureCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
  index: number;
}> = ({ icon, title, description, index }) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      className="group relative bg-white/50 backdrop-blur-sm border border-neutral-200/50 rounded-3xl p-8 hover:bg-white hover:shadow-xl hover:scale-[1.02] transition-all duration-500"
    >
      <div className="mb-6 inline-flex p-4 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl group-hover:scale-110 transition-transform duration-500">
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-neutral-900 mb-3">{title}</h3>
      <p className="text-neutral-600 leading-relaxed">{description}</p>
    </motion.div>
  );
};

const Testimonial: React.FC<{
  quote: string;
  author: string;
  role: string;
  stats: string;
  index: number;
}> = ({ quote, author, role, stats, index }) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.5, delay: index * 0.15 }}
      className="bg-white border border-neutral-100 rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500"
    >
      <div className="flex items-center gap-1 mb-6">
        {[...Array(5)].map((_, i) => (
          <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
        ))}
      </div>
      <blockquote className="text-lg text-neutral-700 leading-relaxed mb-6 italic">
        "{quote}"
      </blockquote>
      <div className="pt-6 border-t border-neutral-100">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
            {author.split(' ').map(n => n[0]).join('')}
          </div>
          <div>
            <div className="font-semibold text-neutral-900">{author}</div>
            <div className="text-sm text-neutral-500">{role}</div>
          </div>
        </div>
        <div className="text-sm font-medium text-emerald-700 bg-emerald-50 rounded-xl px-4 py-2">
          {stats}
        </div>
      </div>
    </motion.div>
  );
};

export const SaaSLandingPage10X: React.FC = () => {
  const heroRef = useRef<HTMLElement>(null);
  const { scrollY, scrollYProgress } = useScroll();

  const headerOpacity = useTransform(scrollYProgress, [0, 0.1], [0, 1]);
  const heroScale = useTransform(scrollY, [0, 300], [1, 0.95]);

  const features = [
    {
      icon: <Calendar className="w-8 h-8 text-emerald-600" />,
      title: 'Réservation en ligne 24/7',
      description: 'Vos patients prennent leurs rendez-vous quand ils veulent. Plus de téléphone qui sonne.',
    },
    {
      icon: <Zap className="w-8 h-8 text-emerald-600" />,
      title: 'Rappels automatiques',
      description: 'Email, SMS et appels vocaux automatiques. Réduction de 85% des absences garantie.',
    },
    {
      icon: <DollarSign className="w-8 h-8 text-emerald-600" />,
      title: 'Facturation instantanée',
      description: 'Génération et envoi de factures en 1 clic. Paiements en ligne acceptés.',
    },
    {
      icon: <Users className="w-8 h-8 text-emerald-600" />,
      title: 'Dossiers patients intelligents',
      description: 'Historique complet, notes SOAP, documents. Tout accessible en 2 clics.',
    },
    {
      icon: <TrendingUp className="w-8 h-8 text-emerald-600" />,
      title: 'Statistiques en temps réel',
      description: 'Revenus, taux d\'occupation, performance. Prenez de meilleures décisions.',
    },
    {
      icon: <Shield className="w-8 h-8 text-emerald-600" />,
      title: 'Sécurité et conformité',
      description: 'Données hébergées au Canada. Conforme HIPAA, RGPD et loi 25.',
    },
  ];

  const testimonials = [
    {
      quote: "Avant ChiroFlow, je finissais à 19h30 chaque soir. Maintenant je ferme à 17h pile. Ça a changé ma vie.",
      author: "Dr Sarah Tremblay",
      role: "Clinique Santé Globale, Laval",
      stats: "3h gagnées/jour • 0 appels de rappel",
    },
    {
      quote: "La liste d'attente remplit mes annulations en 15 minutes. Ça m'a rapporté 28 000$ la première année.",
      author: "Dr Marc Dubois",
      role: "Alignement Optimal, Brossard",
      stats: "28 000$ revenus additionnels • 98% occupation",
    },
    {
      quote: "95% de mes patients réservent en ligne, même à 22h. Je peux me concentrer sur soigner.",
      author: "Dr Julie Bergeron",
      role: "Santé en Mouvement, Sherbrooke",
      stats: "95% réservations en ligne • 98% satisfaction",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-neutral-50/30 to-white overflow-hidden">
      <motion.header
        style={{ opacity: headerOpacity }}
        className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-neutral-200/50"
      >
        <nav className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              ChiroFlow
            </span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-neutral-600 hover:text-emerald-600 transition font-medium">
              Fonctionnalités
            </a>
            <a href="#testimonials" className="text-neutral-600 hover:text-emerald-600 transition font-medium">
              Témoignages
            </a>
            <a href="#pricing" className="text-neutral-600 hover:text-emerald-600 transition font-medium">
              Tarifs
            </a>
            <a href="/admin/login" className="text-neutral-600 hover:text-emerald-600 transition font-medium">
              Connexion
            </a>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => window.location.href = '/admin/signup'}
              className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
            >
              Essai gratuit
            </motion.button>
          </div>
        </nav>
      </motion.header>

      <main>
        <motion.section
          ref={heroRef}
          style={{ scale: heroScale }}
          className="relative min-h-screen flex items-center justify-center px-6 pt-32 pb-20"
        >
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <motion.div
              animate={{
                x: [0, 100, 0],
                y: [0, 50, 0],
              }}
              transition={{
                duration: 20,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="absolute top-20 left-20 w-96 h-96 bg-emerald-200/20 rounded-full blur-3xl"
            />
            <motion.div
              animate={{
                x: [0, -100, 0],
                y: [0, 80, 0],
              }}
              transition={{
                duration: 25,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="absolute bottom-20 right-20 w-96 h-96 bg-teal-200/20 rounded-full blur-3xl"
            />
          </div>

          <div className="relative z-10 max-w-5xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 bg-white/60 backdrop-blur-sm border border-emerald-200/50 px-5 py-2.5 rounded-full text-sm font-medium text-emerald-800 mb-8 shadow-lg"
            >
              <Sparkles className="w-4 h-4" />
              <span>500+ cliniques • Économie moyenne 47 052$/an</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="text-6xl md:text-7xl lg:text-8xl font-bold text-neutral-900 leading-[1.1] mb-8"
            >
              La clinique chiropratique{' '}
              <span className="relative inline-block">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600">
                  sans assistante
                </span>
                <svg
                  className="absolute -bottom-2 left-0 w-full"
                  height="12"
                  viewBox="0 0 200 12"
                  fill="none"
                >
                  <motion.path
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1.5, delay: 1 }}
                    d="M2 7C60 3 140 3 198 7"
                    stroke="url(#paint0_linear)"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                  <defs>
                    <linearGradient id="paint0_linear" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#10b981" />
                      <stop offset="100%" stopColor="#14b8a6" />
                    </linearGradient>
                  </defs>
                </svg>
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="text-xl md:text-2xl text-neutral-600 mb-12 max-w-3xl mx-auto leading-relaxed"
            >
              Automatisation complète. Réservation 24/7. Rappels automatiques. Facturation instantanée.
              <span className="block mt-2 font-semibold text-emerald-700">
                Économisez 50 000$/an et récupérez 10h/semaine.
              </span>
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
            >
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: '0 20px 40px rgba(16, 185, 129, 0.3)' }}
                whileTap={{ scale: 0.95 }}
                onClick={() => window.location.href = '/admin/signup'}
                className="group px-10 py-5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-2xl font-bold text-lg shadow-2xl hover:shadow-emerald-600/50 transition-all flex items-center gap-3"
              >
                <span>Essai gratuit 14 jours</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-10 py-5 bg-white border-2 border-neutral-200 text-neutral-900 rounded-2xl font-semibold text-lg shadow-lg hover:border-emerald-600 hover:shadow-xl transition-all flex items-center gap-3"
              >
                <PlayCircle className="w-5 h-5" />
                <span>Voir une démo</span>
              </motion.button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.7 }}
              className="flex flex-wrap items-center justify-center gap-8 text-sm text-neutral-600"
            >
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
                <span>Sans carte de crédit</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
                <span>Setup en 5 minutes</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
                <span>Support français 24/7</span>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.9 }}
              className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto"
            >
              {[
                { value: 500, suffix: '+', label: 'Cliniques actives' },
                { value: 50, suffix: 'K+', label: 'Rendez-vous/mois' },
                { value: 85, suffix: '%', label: 'Moins d\'absences' },
                { value: 10, suffix: 'h+', label: 'Gagnées/semaine' },
              ].map((stat, i) => (
                <div key={i} className="text-center">
                  <div className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600 mb-2">
                    <AnimatedCounter end={stat.value} suffix={stat.suffix} />
                  </div>
                  <div className="text-sm text-neutral-600">{stat.label}</div>
                </div>
              ))}
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="absolute bottom-10 left-1/2 -translate-x-1/2"
          >
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-neutral-400 flex flex-col items-center gap-2"
            >
              <span className="text-sm">Découvrez comment</span>
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14M5 12l7 7 7-7" />
              </svg>
            </motion.div>
          </motion.div>
        </motion.section>

        <section className="py-32 px-6 bg-neutral-900 text-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_30%_50%,rgba(16,185,129,0.3),transparent_50%)]" />
            <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_50%,rgba(20,184,166,0.3),transparent_50%)]" />
          </div>

          <div className="max-w-5xl mx-auto text-center relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="mb-16"
            >
              <h2 className="text-4xl md:text-6xl font-bold mb-6">
                Votre situation actuelle
              </h2>
              <p className="text-xl text-neutral-400">
                Vous passez plus de temps à gérer qu'à soigner
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8 mb-16">
              {[
                { icon: <Clock className="w-12 h-12" />, stat: '3h/jour', label: 'Au téléphone pour les RDV' },
                { icon: <DollarSign className="w-12 h-12" />, stat: '50K$/an', label: 'Coût d\'une assistante' },
                { icon: <TrendingUp className="w-12 h-12" />, stat: '15-20%', label: 'Perdus en absences' },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-3xl p-8"
                >
                  <div className="text-emerald-400 mb-4">{item.icon}</div>
                  <div className="text-4xl font-bold mb-2">{item.stat}</div>
                  <div className="text-neutral-400">{item.label}</div>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-3xl p-12"
            >
              <h3 className="text-3xl md:text-4xl font-bold mb-6">
                Avec ChiroFlow
              </h3>
              <div className="grid md:grid-cols-3 gap-8">
                {[
                  { label: 'Temps au téléphone', value: '0 minute' },
                  { label: 'Coût assistante', value: '0$' },
                  { label: 'Taux d\'absence', value: '3%' },
                ].map((item, i) => (
                  <div key={i} className="text-center">
                    <div className="text-4xl font-bold mb-2">{item.value}</div>
                    <div className="text-emerald-100">{item.label}</div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        <section id="features" className="py-32 px-6">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-20"
            >
              <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-800 px-4 py-2 rounded-full text-sm font-medium mb-6">
                <Zap className="w-4 h-4" />
                <span>Tout automatisé</span>
              </div>
              <h2 className="text-4xl md:text-6xl font-bold text-neutral-900 mb-6">
                Une solution complète
              </h2>
              <p className="text-xl text-neutral-600 max-w-3xl mx-auto">
                Tout ce dont vous avez besoin pour gérer votre clinique sans assistante
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <FeatureCard key={index} {...feature} index={index} />
              ))}
            </div>
          </div>
        </section>

        <section id="testimonials" className="py-32 px-6 bg-gradient-to-b from-white to-neutral-50">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-20"
            >
              <div className="inline-flex items-center gap-2 bg-yellow-50 text-yellow-800 px-4 py-2 rounded-full text-sm font-medium mb-6">
                <Star className="w-4 h-4" />
                <span>4.9/5 sur 500+ avis</span>
              </div>
              <h2 className="text-4xl md:text-6xl font-bold text-neutral-900 mb-6">
                Ils ont repris le contrôle
              </h2>
              <p className="text-xl text-neutral-600 max-w-3xl mx-auto">
                Des chiros comme vous qui rentrent chez eux à l'heure
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8">
              {testimonials.map((testimonial, index) => (
                <Testimonial key={index} {...testimonial} index={index} />
              ))}
            </div>
          </div>
        </section>

        <section className="py-32 px-6 bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-700 text-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-20">
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.5, 0.3],
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.3),transparent_50%)]"
            />
          </div>

          <div className="max-w-4xl mx-auto text-center relative z-10">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <Sparkles className="w-16 h-16 mx-auto mb-8 animate-pulse" />
              <h2 className="text-4xl md:text-6xl font-bold mb-8 leading-tight">
                Prêt à reprendre le contrôle?
              </h2>
              <p className="text-xl md:text-2xl mb-12 text-emerald-50 leading-relaxed">
                Rejoignez 500+ cliniques québécoises qui ont dit adieu à la paperasse
                et bonjour à une vie équilibrée.
              </p>
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: '0 25px 50px rgba(0,0,0,0.3)' }}
                whileTap={{ scale: 0.95 }}
                onClick={() => window.location.href = '/admin/signup'}
                className="group px-12 py-6 bg-white text-emerald-700 rounded-2xl font-bold text-xl shadow-2xl flex items-center gap-3 mx-auto hover:bg-neutral-50 transition-all"
              >
                <span>Commencer mon essai gratuit</span>
                <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
              </motion.button>
              <div className="flex flex-wrap items-center justify-center gap-6 mt-8 text-emerald-100">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  <span>14 jours gratuits</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  <span>Sans carte de crédit</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  <span>Annulation en tout temps</span>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <footer className="bg-neutral-900 text-white py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-bold">ChiroFlow</span>
              </div>
              <p className="text-neutral-400 text-sm">
                La solution complète de gestion pour cliniques chiropratiques.
              </p>
            </div>

            <div>
              <h3 className="font-bold mb-4 text-emerald-400">Produit</h3>
              <ul className="space-y-2 text-sm text-neutral-400">
                <li><a href="#features" className="hover:text-white transition">Fonctionnalités</a></li>
                <li><a href="#pricing" className="hover:text-white transition">Tarifs</a></li>
                <li><a href="#" className="hover:text-white transition">Démo</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold mb-4 text-emerald-400">Entreprise</h3>
              <ul className="space-y-2 text-sm text-neutral-400">
                <li><a href="#" className="hover:text-white transition">À propos</a></li>
                <li><a href="#" className="hover:text-white transition">Contact</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold mb-4 text-emerald-400">Support</h3>
              <ul className="space-y-2 text-sm text-neutral-400">
                <li>support@chiroflow.ca</li>
                <li>1-855-CHIRO-QC</li>
                <li>Support 24/7 en français</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-neutral-800 pt-8 flex flex-col md:flex-row items-center justify-between text-sm text-neutral-400">
            <p>&copy; 2025 ChiroFlow. Tous droits réservés.</p>
            <div className="flex items-center gap-6 mt-4 md:mt-0">
              <a href="#" className="hover:text-white transition">Confidentialité</a>
              <a href="#" className="hover:text-white transition">Conditions</a>
              <a href="#" className="hover:text-white transition">Conformité</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default SaaSLandingPage10X;
