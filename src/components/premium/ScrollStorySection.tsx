import React from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useElementInView } from '../../hooks/useScrollProgress';
import { Droplets, Settings, Heart } from 'lucide-react';

interface StoryStepProps {
  icon: React.ComponentType<any>;
  title: string;
  description: string;
  index: number;
}

const StoryStep: React.FC<StoryStepProps> = ({ icon: Icon, title, description, index }) => {
  const { ref, isInView } = useElementInView(0.3);

  return (
    <motion.div
      ref={ref as any}
      initial={{ opacity: 0, y: 60 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{
        duration: 0.8,
        delay: index * 0.2,
        ease: [0.25, 0.1, 0.25, 1],
      }}
      className="relative"
    >
      <div className="flex items-start space-x-6 lg:space-x-12">
        <motion.div
          initial={{ scale: 0 }}
          animate={isInView ? { scale: 1 } : {}}
          transition={{
            type: 'spring',
            stiffness: 200,
            damping: 20,
            delay: index * 0.2 + 0.3,
          }}
          className="flex-shrink-0 w-20 h-20 lg:w-24 lg:h-24 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-cyan-500/40"
        >
          <Icon className="w-10 h-10 lg:w-12 lg:h-12 text-white" />
        </motion.div>

        <div className="flex-1 pt-4">
          <motion.h3
            initial={{ opacity: 0, x: -20 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: index * 0.2 + 0.4 }}
            className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4"
          >
            {title}
          </motion.h3>
          <motion.p
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ delay: index * 0.2 + 0.6 }}
            className="text-lg lg:text-xl text-slate-600 leading-relaxed"
          >
            {description}
          </motion.p>
        </div>
      </div>

      {index < 2 && (
        <motion.div
          initial={{ scaleY: 0 }}
          animate={isInView ? { scaleY: 1 } : {}}
          transition={{ duration: 0.6, delay: index * 0.2 + 0.8 }}
          className="absolute left-10 lg:left-12 top-24 lg:top-28 w-0.5 h-32 lg:h-40 bg-gradient-to-b from-cyan-500 to-transparent"
          style={{ transformOrigin: 'top' }}
        />
      )}
    </motion.div>
  );
};

export const ScrollStorySection: React.FC = () => {
  const { ref, isInView } = useElementInView(0.2);
  const sectionRef = React.useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  });

  const y = useTransform(scrollYProgress, [0, 1], [100, -100]);
  const opacity = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0, 1, 1, 0]);

  const steps = [
    {
      icon: Droplets,
      title: "L'eau réagit à votre corps",
      description:
        "Le système breveté ChiroFlow contient une chambre d'eau intelligente qui répartit uniformément votre poids. Chaque mouvement est absorbé naturellement, créant un soutien fluide et personnalisé.",
    },
    {
      icon: Settings,
      title: 'Ajustement automatique du soutien',
      description:
        "Contrairement aux oreillers statiques, ChiroFlow s'adapte en temps réel à vos changements de position. Fini les ajustements nocturnes : le confort vous suit naturellement.",
    },
    {
      icon: Heart,
      title: 'Soulagement cervical prouvé',
      description:
        "Des études cliniques ont démontré une réduction de 50% des douleurs cervicales après 30 jours d'utilisation. Votre colonne vertébrale maintient son alignement naturel, nuit après nuit.",
    },
  ];

  return (
    <section
      ref={(node) => {
        sectionRef.current = node;
        ref(node);
      }}
      className="relative py-32 lg:py-40 bg-gradient-to-b from-white via-slate-50 to-white overflow-hidden"
    >
      <motion.div style={{ y, opacity }} className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 right-10 w-64 h-64 bg-cyan-200/30 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-10 w-64 h-64 bg-blue-200/30 rounded-full blur-3xl" />
      </motion.div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <span className="inline-block px-6 py-2 bg-cyan-100 text-cyan-800 rounded-full text-sm font-semibold mb-6">
            Science du confort
          </span>
          <h2 className="text-5xl lg:text-6xl font-bold text-slate-900 mb-6 leading-tight">
            Une technologie qui
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-blue-600">
              pense à votre bien-être
            </span>
          </h2>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
            Trois innovations qui transforment votre sommeil en expérience régénératrice
          </p>
        </motion.div>

        <div className="space-y-24 lg:space-y-32">
          {steps.map((step, index) => (
            <StoryStep key={index} {...step} index={index} />
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={isInView ? { opacity: 1, scale: 1 } : {}}
          transition={{ delay: 1.5, duration: 0.8 }}
          className="mt-32 p-12 bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl shadow-2xl"
        >
          <div className="grid md:grid-cols-3 gap-12 text-center">
            {[
              { value: '50%', label: 'Réduction douleurs cervicales' },
              { value: '15 000+', label: 'Clients satisfaits' },
              { value: '100', label: 'Nuits de garantie' },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 1.7 + i * 0.1 }}
              >
                <div className="text-5xl lg:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400 mb-3">
                  {stat.value}
                </div>
                <div className="text-slate-400 text-lg">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};
