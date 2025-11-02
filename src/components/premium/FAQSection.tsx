import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, CheckCircle } from 'lucide-react';
import { useElementInView } from '../../hooks/useScrollProgress';

interface FAQItem {
  question: string;
  answer: string;
  highlight?: string;
}

const faqs: FAQItem[] = [
  {
    question: "Peut-on vraiment éliminer le poste d'assistante?",
    answer: "Absolument. ChiroFlow automatise 100% des tâches administratives: réservations, rappels, facturation et agenda. Plus de 500 cliniques québécoises l'utilisent aujourd'hui et économisent en moyenne 47 000$/an.",
    highlight: "500+ cliniques l'utilisent aujourd'hui"
  },
  {
    question: "Combien de temps prend la configuration initiale?",
    answer: "5 minutes chrono. Vous entrez vos disponibilités, vos services, et c'est parti. Pas besoin de formation technique. Notre équipe vous guide gratuitement au téléphone si besoin. La plupart des cliniques sont opérationnelles le jour même.",
    highlight: "Opérationnel en 5 minutes"
  },
  {
    question: "Les patients âgés peuvent-ils réserver en ligne?",
    answer: "Oui! 92% des patients de 60+ réservent sans aide. L'interface surpasse Facebook en simplicité. Les patients qui préfèrent téléphoner vous rejoignent directement — vous gardez votre numéro habituel.",
    highlight: "92% succès chez 60+ ans"
  },
  {
    question: "Que se passe-t-il si j'ai un imprévu ou une urgence?",
    answer: "Vous bloquez/débloquez des plages en 2 clics depuis votre téléphone. Les patients concernés reçoivent un message automatique avec options de report. La liste d'attente remplit automatiquement les trous. Zéro stress, zéro appel manuel.",
    highlight: "Gestion d'urgence en 2 clics"
  },
  {
    question: "Mes données restent-elles sécurisées et conformes?",
    answer: "Garantie absolue. Nous détenons la certification HIPAA et respectons les lois canadiennes (LPRPDE). Vos données restent au Canada sur nos serveurs ultra-sécurisés avec cryptage complet et sauvegardes automatiques quotidiennes.",
    highlight: "Certifié HIPAA • Données au Canada"
  },
  {
    question: "Puis-je vraiment annuler en tout temps sans pénalité?",
    answer: "Oui, aucun engagement. Si vous n'êtes pas satisfait, vous annulez en 1 clic. Pas de frais cachés, pas de période d'engagement. On vous rembourse même au prorata si vous annulez en cours de mois.",
    highlight: "Zéro engagement • Remboursement prorata"
  },
  {
    question: "Le support est-il vraiment en français 7j/7?",
    answer: "Oui! Notre équipe québécoise répond en français par téléphone, courriel et chat. Réponse moyenne en moins de 2 minutes. On ne sous-traite rien à l'étranger. Ce sont de vraies personnes qui connaissent les réalités des chiros québécois.",
    highlight: "Support québécois < 2 min"
  },
  {
    question: "Qu'arrive-t-il avec mes patients existants dans mon ancien système?",
    answer: "On importe gratuitement votre base de patients existante. CSV, Excel, ou même saisie manuelle si vous êtes sur papier. L'importation prend 24h max. Vos patients reçoivent automatiquement un lien pour accéder à leur portail.",
    highlight: "Import gratuit en 24h"
  },
];

export const FAQSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const { ref, isInView } = useElementInView(0.2);

  return (
    <section
      ref={ref as any}
      id="faq"
      className="py-32 bg-white"
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          className="text-center mb-16"
        >
          <span className="inline-block px-6 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold mb-6">
            Questions fréquentes
          </span>
          <h2 className="text-5xl lg:text-6xl font-bold text-slate-900 mb-6">
            Vos questions,
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600">
              nos réponses claires
            </span>
          </h2>
          <p className="text-xl text-slate-600">
            Tout ce que vous devez savoir avant de commencer
          </p>
        </motion.div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: index * 0.05 }}
              className="bg-slate-50 rounded-2xl overflow-hidden border-2 border-slate-100 hover:border-emerald-200 transition-colors"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full px-6 py-5 flex items-center justify-between text-left"
              >
                <span className="font-bold text-slate-900 text-lg pr-4">
                  {faq.question}
                </span>
                <motion.div
                  animate={{ rotate: openIndex === index ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                  className="flex-shrink-0"
                >
                  <ChevronDown className="w-6 h-6 text-emerald-600" />
                </motion.div>
              </button>

              <AnimatePresence>
                {openIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="px-6 pb-5">
                      <p className="text-slate-600 leading-relaxed mb-4">
                        {faq.answer}
                      </p>
                      {faq.highlight && (
                        <div className="flex items-center space-x-2 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-lg inline-flex">
                          <CheckCircle className="w-4 h-4" />
                          <span className="text-sm font-semibold">{faq.highlight}</span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.5 }}
          className="mt-12 text-center bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl p-8 border border-emerald-200"
        >
          <p className="text-lg text-slate-700 mb-4">
            Vous avez d'autres questions?
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="mailto:support@chiroflow.ca"
              className="px-6 py-3 bg-white text-emerald-700 rounded-xl font-semibold shadow-sm hover:shadow-md transition border border-emerald-200"
            >
              📧 support@chiroflow.ca
            </a>
            <a
              href="tel:1-855-2447636"
              className="px-6 py-3 bg-white text-emerald-700 rounded-xl font-semibold shadow-sm hover:shadow-md transition border border-emerald-200"
            >
              📞 1-855-CHIROFLOW
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
