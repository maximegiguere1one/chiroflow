import { motion } from 'framer-motion';
import { Shield, Award, Heart, Users, CheckCircle2, Star } from 'lucide-react';

export default function TrustBadges() {
  const badges = [
    {
      icon: Shield,
      title: 'Certifiée UQTR',
      subtitle: 'Membre en règle',
      color: 'from-primary-600 to-primary-800'
    },
    {
      icon: Award,
      title: '15+ ans',
      subtitle: 'Expertise reconnue',
      color: 'from-accent-500 to-terracotta'
    },
    {
      icon: Heart,
      title: '847+ familles',
      subtitle: 'Transformées',
      color: 'from-sage-600 to-sage-800'
    },
    {
      icon: Star,
      title: '4.9/5',
      subtitle: '100+ avis',
      color: 'from-accent-600 to-accent-800'
    }
  ];

  return (
    <section className="py-16 bg-gradient-to-b from-background to-cream-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-h3 text-foreground font-heading mb-3">Une expertise reconnue et fiable</h2>
          <p className="text-muted-700">Des centaines de familles nous font confiance</p>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {badges.map((badge, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -8, scale: 1.05 }}
              className="relative group"
            >
              <div className="bg-white rounded-2xl p-6 border-2 border-sage-100 shadow-soft group-hover:shadow-premium transition-all duration-300">
                <div className={`w-14 h-14 mx-auto mb-4 bg-gradient-to-br ${badge.color} rounded-2xl flex items-center justify-center shadow-soft group-hover:scale-110 transition-transform duration-300`}>
                  <badge.icon className="w-7 h-7 text-white" />
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground mb-1">{badge.title}</div>
                  <div className="text-sm text-muted-700">{badge.subtitle}</div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-br from-sage-50/0 to-sage-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" />
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="mt-12 bg-gradient-to-r from-primary-50 to-sage-50 rounded-2xl p-8 border border-sage-200/50"
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">Conformité professionnelle totale</h3>
                <p className="text-sm text-muted-700">Assurance responsabilité professionnelle • Formation continue • Normes de l'Ordre</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium text-muted-700">Membre Polyclinique Ste-Foy</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
