import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Award, TrendingUp, Users } from 'lucide-react';

export const TrustLogos: React.FC = () => {
  const badges = [
    { icon: Shield, text: 'Certifié HIPAA', color: 'from-blue-500 to-blue-600' },
    { icon: Award, text: 'Prix Innovation 2024', color: 'from-yellow-500 to-orange-500' },
    { icon: TrendingUp, text: 'Croissance #1 au QC', color: 'from-emerald-500 to-teal-600' },
    { icon: Users, text: '500+ Cliniques', color: 'from-purple-500 to-pink-500' },
  ];

  return (
    <section className="py-16 bg-slate-50 border-y border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center text-sm text-slate-500 mb-8 uppercase tracking-wider font-semibold"
        >
          Reconnu et approuvé par les leaders de l'industrie
        </motion.p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {badges.map((badge, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ scale: 1.05 }}
              className="flex flex-col items-center justify-center p-6 bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow"
            >
              <div className={`w-12 h-12 bg-gradient-to-br ${badge.color} rounded-xl flex items-center justify-center mb-3`}>
                <badge.icon className="w-6 h-6 text-white" />
              </div>
              <span className="text-sm font-semibold text-slate-700 text-center">
                {badge.text}
              </span>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="mt-12 flex flex-wrap items-center justify-center gap-8 text-slate-400 text-sm"
        >
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span>Uptime 99.9%</span>
          </div>
          <div>•</div>
          <div>Conformité HIPAA</div>
          <div>•</div>
          <div>Données hébergées au Canada</div>
          <div>•</div>
          <div>Support 24/7 en français</div>
        </motion.div>
      </div>
    </section>
  );
};
