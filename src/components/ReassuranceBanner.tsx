import { motion } from 'framer-motion';
import { Award, Heart, TrendingUp } from 'lucide-react';

export default function ReassuranceBanner() {
  const items = [
    {
      icon: Award,
      text: 'Diplômée UQTR, 2007 — 15+ ans d\'accompagnement',
    },
    {
      icon: Heart,
      text: 'Polyclinique Ste-Foy depuis 2021',
    },
    {
      icon: TrendingUp,
      text: 'Approche douce, structurée, mesurable',
    },
  ];

  return (
    <section id="reassurance" className="py-16 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {items.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="flex items-center space-x-4 p-6 rounded-2xl bg-gradient-to-br from-primary-50 to-accent-50/30"
            >
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                  <item.icon className="w-6 h-6 text-white" />
                </div>
              </div>
              <p className="text-sm font-medium text-foreground">{item.text}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
