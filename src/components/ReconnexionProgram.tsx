import { motion } from 'framer-motion';
import { ExternalLink, CheckCircle, Video, FileText, TrendingUp } from 'lucide-react';

export default function ReconnexionProgram() {
  const keys = [
    'Neuro-inflammation',
    'Microbiote intestinal',
    'Modulation sensorielle',
    'Réflexes primitifs',
    'Énergie cellulaire',
    'Stimulations cérébrales',
    'Nouvelles connexions',
    'Optimisation cognitive',
    'Gestion émotionnelle',
    'Harmonie familiale',
  ];

  const testimonials = [
    {
      quote: 'Avant Reconnexion, notre quotidien était épuisant. Aujourd\'hui, mon fils dort mieux et ses crises ont diminué de 80%.',
      author: 'Marie-Claude, maman d\'un enfant TDA/H',
    },
    {
      quote: 'Le programme nous a donné des outils concrets. En 3 mois, les tics de mon fils ont presque disparu.',
      author: 'Philippe, papa',
    },
    {
      quote: 'Une approche qui va au-delà des symptômes. On comprend enfin ce qui se passe.',
      author: 'Sophie, maman TSA',
    },
  ];

  return (
    <section id="reconnexion" className="py-24 bg-gradient-to-b from-stone-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-block px-4 py-2 bg-teal-100 text-teal-800 rounded-full text-sm font-semibold mb-4">
            Programme intégratif
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Programme Reconnexion
          </h2>
          <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
            Programme intégratif en 10 clés pour diminuer les symptômes liés aux troubles neurologiques complexes et améliorer le fonctionnement familial — sans recourir systématiquement à la médication.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100"
          >
            <Video className="w-12 h-12 text-teal-600 mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-3">Méthode intégrative en 10 clés</h3>
            <p className="text-gray-600">Fondée sur les neurosciences et la neuroplasticité pour des résultats durables.</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100"
          >
            <FileText className="w-12 h-12 text-teal-600 mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-3">Vidéos, protocoles & exercices guidés</h3>
            <p className="text-gray-600">Contenus mis à jour régulièrement pour suivre les dernières avancées.</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100"
          >
            <TrendingUp className="w-12 h-12 text-teal-600 mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-3">Pour enfants & adultes</h3>
            <p className="text-gray-600">Axée sur la neuroplasticité et le mieux-être quotidien de toute la famille.</p>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-gradient-to-br from-teal-600 to-teal-700 rounded-3xl p-8 md:p-12 text-white mb-16"
        >
          <h3 className="text-3xl font-bold mb-8">Les 10 clés du programme</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {keys.map((key, index) => (
              <div key={index} className="flex items-center space-x-3">
                <CheckCircle className="w-6 h-6 flex-shrink-0" />
                <span className="text-lg">{key}</span>
              </div>
            ))}
          </div>
        </motion.div>

        <div className="mb-16">
          <h3 className="text-3xl font-bold text-gray-900 mb-8 text-center">Témoignages</h3>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
              >
                <p className="text-gray-700 mb-4 italic">"{testimonial.quote}"</p>
                <p className="text-sm font-semibold text-teal-600">{testimonial.author}</p>
              </motion.div>
            ))}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <a
            href="https://reconnexion.ca"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-2 px-8 py-4 bg-teal-600 text-white rounded-full hover:bg-teal-700 transition-all duration-300 text-lg font-medium shadow-lg hover:shadow-xl"
          >
            <span>Je m'inscris au Programme Reconnexion</span>
            <ExternalLink className="w-5 h-5" />
          </a>
          <p className="mt-6 text-sm text-gray-600 max-w-2xl mx-auto">
            Commencez dès aujourd'hui votre parcours vers un mieux-être durable. Accès immédiat aux contenus.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
