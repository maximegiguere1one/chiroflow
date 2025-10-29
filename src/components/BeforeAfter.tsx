import { motion } from 'framer-motion';
import { ArrowRight, TrendingUp, Clock, Heart } from 'lucide-react';
import { useState } from 'react';

interface Story {
  name: string;
  age: string;
  condition: string;
  before: {
    situation: string;
    metrics: string[];
    emoji: string;
  };
  after: {
    situation: string;
    metrics: string[];
    emoji: string;
  };
  timeline: string;
  method: string;
}

export default function BeforeAfter() {
  const [activeStory, setActiveStory] = useState(0);

  const stories: Story[] = [
    {
      name: "Maxime",
      age: "6 ans",
      condition: "TDA/H sévère",
      before: {
        situation: "Crises quotidiennes, aucune nuit complète, rejeté des garderies",
        metrics: [
          "20 crises par semaine",
          "Sommeil fragmenté (3-4h max)",
          "3 garderies refusées",
          "Médication inefficace"
        ],
        emoji: "😰"
      },
      after: {
        situation: "Intégré à l'école, dort 9h par nuit, 2-3 crises par mois seulement",
        metrics: [
          "2-3 crises par mois",
          "9h de sommeil continu",
          "Intégré à l'école régulière",
          "Zéro médication"
        ],
        emoji: "🎉"
      },
      timeline: "8 mois de suivi",
      method: "Soins chiropratiques + Programme Reconnexion"
    },
    {
      name: "Sophie",
      age: "32 ans",
      condition: "Grossesse difficile",
      before: {
        situation: "Sciatique paralysante, médication lourde, peur de l'accouchement",
        metrics: [
          "Douleur 8/10 constante",
          "Immobilisée 3-4 jours/semaine",
          "Anxiété sévère",
          "Arrêt de travail prolongé"
        ],
        emoji: "😢"
      },
      after: {
        situation: "Zéro douleur au 3e trimestre, accouchement naturel réussi",
        metrics: [
          "Douleur 0-1/10",
          "Mobilité complète",
          "Accouchement naturel 4h",
          "Retour travail semaine 3"
        ],
        emoji: "💚"
      },
      timeline: "12 semaines prénatales",
      method: "Soins obstétriques chiropratiques"
    },
    {
      name: "Lucas",
      age: "9 ans",
      condition: "Autisme + hypersensibilité",
      before: {
        situation: "Crises sensorielles quotidiennes, isolement social complet",
        metrics: [
          "5-8 crises sensorielles/jour",
          "Zéro interaction sociale",
          "Alimentation 4 aliments",
          "Scolarisation impossible"
        ],
        emoji: "😭"
      },
      after: {
        situation: "Intégration scolaire réussie, amis, activités parascolaires",
        metrics: [
          "1 crise/semaine (gérable)",
          "3 amis proches",
          "Alimentation variée (20+ aliments)",
          "École régulière avec soutien"
        ],
        emoji: "😊"
      },
      timeline: "14 mois",
      method: "Programme Reconnexion 10 clés complet"
    }
  ];

  const currentStory = stories[activeStory];

  return (
    <section className="py-24 bg-gradient-to-b from-background to-primary-50/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-block px-4 py-2 bg-primary-100 text-primary-800 rounded-full text-sm font-semibold mb-4">
            Transformations réelles
          </div>
          <h2 className="text-h2 text-foreground mb-6">
            Des vies transformées. Des familles soulagées.
          </h2>
          <p className="text-body-lg text-muted-700 max-w-3xl mx-auto">
            Histoires anonymisées de familles qui ont retrouvé espoir et qualité de vie.
          </p>
        </motion.div>

        <div className="flex justify-center space-x-4 mb-12">
          {stories.map((story, index) => (
            <button
              key={index}
              onClick={() => setActiveStory(index)}
              className={`px-6 py-3 rounded-full font-medium transition-all duration-300 ${
                activeStory === index
                  ? 'bg-primary text-white shadow-soft'
                  : 'bg-white text-muted-700 hover:bg-muted-100'
              }`}
            >
              <span className="hidden sm:inline">{story.name}, </span>
              {story.age}
            </button>
          ))}
        </div>

        <motion.div
          key={activeStory}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="grid lg:grid-cols-2 gap-8 mb-12"
        >
          <div className="card border-2 border-accent-200 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-accent-400 to-accent-600" />
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-2xl font-bold text-foreground mb-1">Avant</h3>
                <p className="text-sm text-muted-600">{currentStory.condition}</p>
              </div>
              <div className="text-4xl">{currentStory.before.emoji}</div>
            </div>

            <p className="text-muted-800 mb-6 leading-relaxed">
              {currentStory.before.situation}
            </p>

            <div className="space-y-3">
              <p className="text-sm font-semibold text-muted-700 mb-2">Situation détaillée:</p>
              {currentStory.before.metrics.map((metric, idx) => (
                <div key={idx} className="flex items-start">
                  <span className="text-accent-600 mr-2">⚠️</span>
                  <span className="text-sm text-muted-700">{metric}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card border-2 border-primary-200 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-400 to-primary-600" />
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-2xl font-bold text-foreground mb-1">Après</h3>
                <p className="text-sm text-primary-700 font-medium">{currentStory.timeline}</p>
              </div>
              <div className="text-4xl">{currentStory.after.emoji}</div>
            </div>

            <p className="text-muted-800 mb-6 leading-relaxed">
              {currentStory.after.situation}
            </p>

            <div className="space-y-3">
              <p className="text-sm font-semibold text-muted-700 mb-2">Résultats mesurables:</p>
              {currentStory.after.metrics.map((metric, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="flex items-start"
                >
                  <span className="text-primary mr-2">✓</span>
                  <span className="text-sm text-muted-700">{metric}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-gradient-to-br from-primary-600 to-primary-700 rounded-2xl p-8 md:p-12 text-white"
        >
          <div className="grid md:grid-cols-3 gap-8 items-center">
            <div className="text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start space-x-2 mb-2">
                <Clock className="w-6 h-6" />
                <h4 className="text-xl font-bold">Méthode utilisée</h4>
              </div>
              <p className="text-primary-100">{currentStory.method}</p>
            </div>

            <div className="flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 bg-white/20 blur-xl rounded-full" />
                <div className="relative w-20 h-20 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center border-2 border-white/30">
                  <ArrowRight className="w-10 h-10" />
                </div>
              </div>
            </div>

            <div className="text-center md:text-right">
              <div className="flex items-center justify-center md:justify-end space-x-2 mb-2">
                <TrendingUp className="w-6 h-6" />
                <h4 className="text-xl font-bold">Progression</h4>
              </div>
              <p className="text-primary-100">Amélioration continue mesurée</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <p className="text-sm text-muted-600 max-w-2xl mx-auto italic flex items-center justify-center space-x-2">
            <Heart className="w-4 h-4 text-primary" fill="currentColor" />
            <span>
              Chaque personne est unique. Les résultats peuvent varier. Ces témoignages représentent des expériences individuelles.
            </span>
          </p>
        </motion.div>
      </div>
    </section>
  );
}
