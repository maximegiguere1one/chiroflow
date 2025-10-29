import { motion } from 'framer-motion';

export default function Testimonials() {
  const testimonials = [
    {
      quote: 'Mon bébé pleurait sans arrêt et ne dormait que 2h par nuit. Après 3 séances, elle dort 6h d\'affilée. Un vrai miracle pour notre famille.',
      author: 'Émilie',
      role: 'Maman de Léa, 3 mois',
    },
    {
      quote: 'Les tics de mon fils ont diminué de 90% et ses notes se sont améliorées. Il est beaucoup plus calme et concentré.',
      author: 'Marc',
      role: 'Papa de Thomas, 7 ans',
    },
    {
      quote: 'Douleurs lombaires intenses durant ma grossesse. Soulagement immédiat dès la première visite. J\'ai pu profiter pleinement de ma grossesse.',
      author: 'Catherine',
      role: '32 semaines',
    },
  ];

  return (
    <section id="testimonials" className="py-32 bg-white px-6 lg:px-12">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mb-24"
        >
          <h2 className="font-heading text-5xl md:text-6xl tracking-tighter text-foreground mb-6">
            Témoignages
          </h2>
          <p className="text-lg text-foreground/60 max-w-2xl font-light leading-relaxed">
            Des transformations réelles, des résultats mesurables
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-12">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: index * 0.1 }}
              className="space-y-8"
            >
              <p className="text-lg text-foreground/80 leading-relaxed font-light">
                "{testimonial.quote}"
              </p>
              <div className="pt-8 border-t border-foreground/10">
                <div className="font-heading text-foreground tracking-tight">
                  {testimonial.author}
                </div>
                <div className="text-sm text-foreground/50 mt-1 font-light">
                  {testimonial.role}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="mt-24 pt-12 border-t border-foreground/10"
        >
          <p className="text-sm text-foreground/40 text-center font-light leading-relaxed max-w-2xl mx-auto">
            Les résultats varient d'une personne à l'autre. Ces témoignages reflètent des expériences individuelles et ne constituent pas une promesse de guérison.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
