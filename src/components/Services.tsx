import { motion } from 'framer-motion';
import { Baby, Heart, Brain, Sparkles } from 'lucide-react';

export default function Services() {
  const services = [
    {
      icon: Baby,
      title: 'Pédiatrie chiropratique',
      description: 'Soins doux et précis dès les premiers jours de vie pour un développement neurologique optimal.',
      conditions: ['Coliques et reflux', 'Difficultés d\'allaitement', 'Torticolis', 'Plagiocéphalie', 'Troubles du sommeil'],
      color: 'from-gold-100 to-gold-50',
      iconBg: 'bg-gradient-to-br from-gold-400 to-gold-600'
    },
    {
      icon: Heart,
      title: 'Obstétrique chiropratique',
      description: 'Accompagnement personnalisé pour une grossesse confortable et une préparation optimale à l\'accouchement.',
      conditions: ['Douleurs pelviennes', 'Sciatique', 'Position du bébé', 'Préparation accouchement', 'Post-partum'],
      color: 'from-neutral-100 to-neutral-50',
      iconBg: 'bg-gradient-to-br from-neutral-700 to-foreground'
    },
    {
      icon: Brain,
      title: 'Neurologie fonctionnelle',
      description: 'Approche scientifique avancée pour optimiser les fonctions cérébrales et le système nerveux.',
      conditions: ['Post-commotion', 'Vertiges', 'Troubles d\'équilibre', 'Migraines chroniques', 'Troubles posturaux'],
      color: 'from-gold-50 to-neutral-50',
      iconBg: 'bg-gradient-to-br from-gold-500 to-neutral-700'
    },
    {
      icon: Sparkles,
      title: 'Neuropédiatrie fonctionnelle',
      description: 'Expertise spécialisée pour les conditions neurologiques complexes avec protocoles intégratifs.',
      conditions: ['TDA/H', 'TSA', 'Dyspraxie', 'Tics et TOC', 'Troubles sensoriels', 'Réflexes primitifs'],
      color: 'from-gold-100 to-neutral-100',
      iconBg: 'bg-gradient-to-br from-gold-600 to-gold-400'
    },
  ];

  return (
    <section id="services" className="py-32 bg-gradient-to-b from-background via-neutral-50 to-background px-6 lg:px-12 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-20 left-10 w-64 h-64 bg-gold-200/10 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-gold-100/10 rounded-full blur-3xl" />

      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-24"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/60 backdrop-blur-sm border border-gold-200/30 mb-6"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-gold-500" />
            <span className="text-sm font-light text-foreground/70 tracking-widest uppercase">Nos expertises</span>
          </motion.div>

          <h2 className="font-heading text-5xl sm:text-6xl lg:text-7xl tracking-tighter text-foreground mb-6">
            Excellence clinique
          </h2>
          <p className="text-xl text-foreground/60 max-w-3xl mx-auto font-light leading-relaxed">
            Une approche intégrative et personnalisée pour chaque étape de la vie
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 lg:gap-10">
          {services.map((service, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: index * 0.1 }}
              whileHover={{ y: -8, transition: { duration: 0.3 } }}
              className="group relative"
            >
              <div className={`relative h-full bg-gradient-to-br ${service.color} backdrop-blur-xl border border-white/40 overflow-hidden shadow-soft-lg hover:shadow-premium transition-all duration-500`}>
                {/* Hover gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-gold-500/0 via-gold-500/0 to-gold-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                {/* Content */}
                <div className="relative p-10 space-y-8">
                  {/* Icon */}
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ duration: 0.3 }}
                    className={`w-16 h-16 ${service.iconBg} rounded-2xl flex items-center justify-center shadow-soft-lg`}
                  >
                    <service.icon className="w-8 h-8 text-white" />
                  </motion.div>

                  {/* Title & Description */}
                  <div className="space-y-4">
                    <h3 className="font-heading text-3xl lg:text-4xl tracking-tight text-foreground">
                      {service.title}
                    </h3>
                    <p className="text-lg text-foreground/70 leading-relaxed font-light">
                      {service.description}
                    </p>
                  </div>

                  {/* Divider */}
                  <div className="relative">
                    <div className="h-px bg-gradient-to-r from-foreground/10 via-gold-400/30 to-transparent" />
                  </div>

                  {/* Conditions */}
                  <div>
                    <p className="text-xs uppercase tracking-widest text-foreground/40 mb-5 font-light">
                      Quand consulter
                    </p>
                    <div className="space-y-3">
                      {service.conditions.map((condition, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, x: -10 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: 0.05 * idx, duration: 0.5 }}
                          className="flex items-center gap-3 group/item"
                        >
                          <div className="w-1.5 h-1.5 rounded-full bg-gold-500/60 group-hover/item:bg-gold-500 transition-colors" />
                          <span className="text-sm text-foreground/70 font-light group-hover/item:text-foreground transition-colors">
                            {condition}
                          </span>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Corner accents */}
                <div className="absolute top-0 right-0 w-20 h-20 border-t border-r border-gold-300/20" />
                <div className="absolute bottom-0 left-0 w-20 h-20 border-b border-l border-gold-300/20" />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="mt-20 text-center"
        >
          <p className="text-foreground/60 mb-8 font-light text-lg">
            Une question sur nos services?
          </p>
          <button className="group px-10 py-4 bg-white/60 backdrop-blur-sm border border-gold-200/50 text-foreground hover:bg-white hover:border-gold-300 hover:shadow-gold transition-all duration-300">
            <span className="text-sm tracking-wide font-light">Discuter avec nous</span>
          </button>
        </motion.div>
      </div>
    </section>
  );
}
