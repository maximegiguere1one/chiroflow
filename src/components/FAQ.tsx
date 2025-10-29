import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Search, DollarSign, Clock, Target, FileText, MessageCircle } from 'lucide-react';

type Category = 'all' | 'tarifs' | 'disponibilite' | 'resultats' | 'processus';

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<Category>('all');

  const categories = [
    { id: 'all' as Category, label: 'Toutes', icon: FileText, count: 0 },
    { id: 'tarifs' as Category, label: 'Tarifs', icon: DollarSign, count: 0 },
    { id: 'disponibilite' as Category, label: 'Disponibilité', icon: Clock, count: 0 },
    { id: 'resultats' as Category, label: 'Résultats', icon: Target, count: 0 },
    { id: 'processus' as Category, label: 'Processus', icon: FileText, count: 0 },
  ];

  const faqs = [
    {
      category: 'resultats' as Category,
      question: 'Combien de séances seront nécessaires ?',
      answer: 'Le nombre de séances varie selon l\'évaluation initiale et la complexité de votre situation. Pour les soins pédiatriques simples, 3 à 6 séances suffisent souvent. Pour les conditions neurologiques complexes, un suivi plus long peut être recommandé. Nous personnalisons chaque plan de soins et réévaluons régulièrement les progrès.',
    },
    {
      category: 'disponibilite' as Category,
      question: 'Et si l\'agenda est plein ?',
      answer: 'Si l\'agenda est actuellement complet, vous pouvez vous inscrire à la liste d\'attente et recevoir une notification dès qu\'une place se libère. En attendant, nous vous encourageons fortement à commencer le Programme Reconnexion pour progresser dès maintenant et préparer votre suivi en clinique.',
    },
    {
      category: 'resultats' as Category,
      question: 'Est-ce adapté aux enfants avec TSA ou TDA/H ?',
      answer: 'Oui, absolument. La neuropédiatrie fonctionnelle est particulièrement efficace pour ces conditions. Nous utilisons une approche intégrative qui combine stimulations cérébrales ciblées, exercices sensoriels, neuronutrition et le Programme Reconnexion avec des protocoles spécifiques adaptés à chaque diagnostic.',
    },
    {
      category: 'processus' as Category,
      question: 'La chiropratique pédiatrique est-elle sécuritaire ?',
      answer: 'Tout à fait. Les techniques utilisées pour les bébés et enfants sont extrêmement douces, adaptées à leur âge et à leur développement. Les ajustements pédiatriques nécessitent une pression légère, comparable au toucher que vous utiliseriez pour tester la maturité d\'une tomate. La chiropratique pédiatrique est reconnue comme sûre et efficace.',
    },
    {
      category: 'processus' as Category,
      question: 'Que dois-je apporter à la première visite ?',
      answer: 'Apportez : votre carte d\'assurance maladie, tout rapport médical ou d\'évaluation pertinent (ergo, orthophonie, neuro, etc.), la liste des médicaments actuels, et pour les bébés, le carnet de santé. Prévoyez environ 60 minutes pour cette première rencontre complète.',
    },
    {
      category: 'tarifs' as Category,
      question: 'Les soins sont-ils couverts par les assurances ?',
      answer: 'La plupart des assurances privées remboursent les soins chiropratiques. Nous vous fournissons un reçu détaillé que vous pouvez soumettre à votre assureur. Vérifiez votre couverture avant la visite. Les frais sont payables le jour même par carte, comptant ou chèque.',
    },
    {
      category: 'processus' as Category,
      question: 'Quelle est la différence avec un physiothérapeute ?',
      answer: 'Les chiropraticiens se spécialisent dans l\'optimisation de la fonction du système nerveux par des ajustements vertébraux et articulaires. Notre approche en neurologie fonctionnelle cible directement le cerveau et les voies neurologiques, ce qui est particulièrement pertinent pour les troubles neuro-développementaux.',
    },
    {
      category: 'resultats' as Category,
      question: 'Le Programme Reconnexion remplace-t-il les soins en clinique ?',
      answer: 'Non, il les complète. Reconnexion est un programme éducatif et pratique que vous pouvez suivre à votre rythme, à domicile. Il offre des outils puissants pour progresser entre les visites ou pendant l\'attente d\'un rendez-vous. L\'idéal est de combiner le programme avec un suivi clinique personnalisé.',
    },
  ];

  const filteredFaqs = useMemo(() => {
    return faqs.filter(faq => {
      const matchesCategory = activeCategory === 'all' || faq.category === activeCategory;
      const matchesSearch = searchQuery === '' ||
        faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [faqs, activeCategory, searchQuery]);

  return (
    <section id="faq" className="py-24 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-h2 text-foreground mb-4">Questions fréquentes</h2>
          <p className="text-body-lg text-muted-700 mb-8">Tout ce que vous devez savoir</p>

          <div className="max-w-2xl mx-auto mb-8">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-400" />
              <input
                type="text"
                placeholder="Quelle est votre question?"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-muted-200 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-3">
            {categories.map((cat) => {
              const count = cat.id === 'all' ? faqs.length : faqs.filter(f => f.category === cat.id).length;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-4 py-2 rounded-full font-medium transition-all flex items-center space-x-2 ${
                    activeCategory === cat.id
                      ? 'bg-primary text-white shadow-soft'
                      : 'bg-muted-100 text-muted-700 hover:bg-muted-200'
                  }`}
                >
                  <cat.icon className="w-4 h-4" />
                  <span>{cat.label}</span>
                  <span className="text-xs opacity-75">({count})</span>
                </button>
              );
            })}
          </div>
        </motion.div>

        {filteredFaqs.length === 0 && (
          <div className="text-center py-12">
            <MessageCircle className="w-16 h-16 text-muted-300 mx-auto mb-4" />
            <p className="text-muted-600 mb-2">Aucune question trouvée</p>
            <button
              onClick={() => { setSearchQuery(''); setActiveCategory('all'); }}
              className="text-primary hover:underline text-sm"
            >
              Réinitialiser les filtres
            </button>
          </div>
        )}

        <div className="space-y-4">
          {filteredFaqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              className="bg-white border-2 border-muted-200 rounded-2xl overflow-hidden hover:border-primary transition-colors"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full px-6 py-5 flex items-center justify-between text-left"
              >
                <span className="font-semibold text-foreground pr-4">{faq.question}</span>
                <ChevronDown
                  className={`w-5 h-5 text-primary flex-shrink-0 transition-transform duration-300 ${
                    openIndex === index ? 'rotate-180' : ''
                  }`}
                />
              </button>

              <AnimatePresence>
                {openIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 pb-5 text-muted-700 leading-relaxed">
                      {faq.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
