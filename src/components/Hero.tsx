import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';
import { trackEvent } from '../lib/analytics';
import { router } from '../lib/router';
import { useRef } from 'react';

interface HeroProps {
  onOpenAppointment: () => void;
  isAgendaFull: boolean;
}

export default function Hero({ onOpenAppointment, isAgendaFull }: HeroProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });

  const y = useTransform(scrollYProgress, [0, 1], ['0%', '50%']);
  const opacity = useTransform(scrollYProgress, [0, 0.5, 1], [1, 0.8, 0]);

  return (
    <section ref={containerRef} className="relative min-h-screen flex items-center overflow-hidden bg-gradient-to-b from-neutral-50 via-background to-neutral-100/50">
      {/* Animated background patterns */}
      <div className="absolute inset-0 opacity-[0.02]">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, #0F0F0F 1px, transparent 0)',
          backgroundSize: '40px 40px'
        }} />
      </div>

      {/* Gold accent blur */}
      <motion.div
        className="absolute top-1/4 right-1/4 w-96 h-96 bg-gold-200/20 rounded-full blur-3xl"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      <motion.div
        style={{ y, opacity }}
        className="max-w-7xl mx-auto px-6 lg:px-12 w-full py-32"
      >
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          {/* Left content */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-10 lg:pr-12"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm border border-neutral-200/50 shadow-soft"
            >
              <Sparkles className="w-4 h-4 text-gold-500" />
              <span className="text-sm font-light text-foreground/70 tracking-wide">Excellence en chiropratique pédiatrique</span>
            </motion.div>

            {/* Main headline */}
            <div className="space-y-6">
              <h1 className="font-heading text-[3.5rem] sm:text-[4.5rem] lg:text-[5.5rem] leading-[0.9] tracking-tighter">
                <span className="block text-foreground">
                  Quand votre
                </span>
                <span className="block bg-gradient-to-r from-foreground via-neutral-700 to-gold-600 bg-clip-text text-transparent">
                  enfant souffre
                </span>
                <span className="block text-foreground/40 text-[2.5rem] sm:text-[3rem] lg:text-[3.5rem] mt-4">
                  nous trouvons des réponses.
                </span>
              </h1>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.8 }}
                className="text-xl text-foreground/60 leading-relaxed max-w-xl font-light"
              >
                Chiropratique pédiatrique et neurologie fonctionnelle pour redonner espoir et qualité de vie aux familles.
              </motion.p>
            </div>

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  trackEvent('cta_click', isAgendaFull ? 'hero_waitlist' : 'hero_appointment');
                  if (isAgendaFull) {
                    router.navigate('/waitlist');
                  } else {
                    onOpenAppointment();
                  }
                }}
                className="group relative px-10 py-5 bg-foreground text-background overflow-hidden transition-all duration-500 hover:shadow-lifted cursor-pointer"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-gold-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative flex items-center justify-center gap-3">
                  <span className="text-sm tracking-wide font-light">
                    {isAgendaFull ? 'Rejoindre la liste d\'attente' : 'Prendre rendez-vous'}
                  </span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                </div>
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                }}
                className="group px-10 py-5 bg-white/50 backdrop-blur-sm border border-neutral-300/50 text-foreground hover:bg-white hover:border-gold-300 transition-all duration-300 cursor-pointer"
              >
                <span className="text-sm tracking-wide font-light">Découvrir l'approche</span>
              </button>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.8 }}
              className="flex items-center gap-12 pt-8"
            >
              <div className="relative">
                <div className="text-5xl font-extralight text-foreground tracking-tight">847+</div>
                <div className="text-sm text-foreground/50 mt-2 font-light tracking-wide">Familles transformées</div>
                <div className="absolute -bottom-2 left-0 w-16 h-px bg-gradient-to-r from-gold-400 to-transparent" />
              </div>
              <div className="h-16 w-px bg-neutral-300" />
              <div className="relative">
                <div className="text-5xl font-extralight text-foreground tracking-tight">15+</div>
                <div className="text-sm text-foreground/50 mt-2 font-light tracking-wide">Années d'expertise</div>
                <div className="absolute -bottom-2 left-0 w-16 h-px bg-gradient-to-r from-gold-400 to-transparent" />
              </div>
            </motion.div>
          </motion.div>

          {/* Right image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, x: 40 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ duration: 1.2, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="relative"
          >
            <div className="relative aspect-[3/4] overflow-hidden shadow-premium group">
              {/* Gold border accent */}
              <div className="absolute inset-0 border border-gold-200/20" />
              <div className="absolute top-4 left-4 w-24 h-24 border-t-2 border-l-2 border-gold-400/40" />
              <div className="absolute bottom-4 right-4 w-24 h-24 border-b-2 border-r-2 border-gold-400/40" />

              <motion.div
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.6 }}
                className="relative h-full"
              >
                <img
                  src="/1377504_450735145042702_1744584238_n_edited_edited.jpg"
                  alt="Dre Janie Leblanc"
                  className="w-full h-full object-cover"
                  loading="eager"
                  onError={(e) => {
                    e.currentTarget.src = 'https://images.pexels.com/photos/4269491/pexels-photo-4269491.jpeg?auto=compress&cs=tinysrgb&w=800';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/20 via-transparent to-transparent" />
              </motion.div>

              {/* Floating badge */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1, duration: 0.8 }}
                className="absolute bottom-8 left-8 bg-white/95 backdrop-blur-md px-6 py-4 shadow-soft-lg"
              >
                <div className="text-xs text-foreground/50 mb-1 tracking-widest uppercase font-light">Certifiée UQTR</div>
                <div className="text-2xl font-light text-foreground tracking-tight">Dre Janie Leblanc</div>
                <div className="text-sm text-foreground/60 font-light">Chiropraticienne</div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 0.8 }}
        className="absolute bottom-12 left-1/2 -translate-x-1/2"
      >
        <div className="flex flex-col items-center gap-3">
          <span className="text-xs tracking-[0.3em] uppercase text-foreground/40 font-light">Découvrir</span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="w-px h-20 bg-gradient-to-b from-foreground/20 via-gold-400/40 to-transparent"
          />
        </div>
      </motion.div>
    </section>
  );
}
