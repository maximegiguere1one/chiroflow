import React, { useState, useEffect } from 'react';
import {
  Building2,
  Users,
  Calendar,
  Bell,
  CreditCard,
  BarChart3,
  Lock,
  Zap,
  CheckCircle,
  ArrowRight,
  Star,
  TrendingUp,
  Clock,
  Shield,
  Phone,
  Mail,
  MessageSquare,
  FileText,
  DollarSign,
  Target,
  Heart,
  Coffee,
  AlertCircle,
  XCircle,
  Sparkles,
  Headphones,
  Award,
  ThumbsUp,
} from 'lucide-react';

interface PainPoint {
  icon: React.ComponentType<any>;
  problem: string;
  solution: string;
}

interface PricingTier {
  name: string;
  slug: string;
  price: number;
  yearlyPrice: number;
  description: string;
  features: string[];
  limits: {
    users: number | string;
    patients: number | string;
    appointments: number | string;
  };
  highlighted?: boolean;
  cta: string;
}

const painPoints: PainPoint[] = [
  {
    icon: Phone,
    problem: "Vous passez 2-3 heures par jour au téléphone à gérer les rendez-vous",
    solution: "Système de réservation en ligne 24/7 - vos patients prennent leurs propres rendez-vous"
  },
  {
    icon: AlertCircle,
    problem: "Les non-présentations vous coûtent 15-20% de votre revenu chaque mois",
    solution: "Rappels automatiques par courriel, texto et appel vocal - réduction de 85% des absences"
  },
  {
    icon: FileText,
    problem: "Vous cherchez les dossiers papier, perdez du temps entre chaque patient",
    solution: "Dossiers patients numériques avec historique complet accessible en 2 clics"
  },
  {
    icon: DollarSign,
    problem: "Facturation manuelle, relances de paiement, comptabilité qui s'accumule",
    solution: "Facturation automatique, paiements en ligne, rappels de paiement automatiques"
  },
  {
    icon: Clock,
    problem: "Vous restez 1-2 heures après la fermeture pour les tâches administratives",
    solution: "Automatisation complète - rentrez chez vous à l'heure, passez du temps avec votre famille"
  },
  {
    icon: XCircle,
    problem: "Annulations de dernière minute = plages horaires vides = perte de revenus",
    solution: "Liste d'attente intelligente qui remplit automatiquement vos plages libres en minutes"
  },
];

const pricingTiers: PricingTier[] = [
  {
    name: 'Essentiel',
    slug: 'starter',
    price: 29,
    yearlyPrice: 290,
    description: 'Parfait pour démarrer en douceur',
    features: [
      'Agenda en ligne 24/7',
      'Gestion des patients',
      'Facturation de base',
      'Rappels par courriel',
      'Intégration calendrier',
      'Application mobile',
    ],
    limits: {
      users: 2,
      patients: 100,
      appointments: '200/mois',
    },
    cta: 'Essai gratuit 14 jours',
  },
  {
    name: 'Professionnel',
    slug: 'professional',
    price: 79,
    yearlyPrice: 790,
    description: 'Le choix de 87% de nos cliniques',
    features: [
      'Tout dans Essentiel',
      'Rappels par texto (SMS)',
      'Portail patient complet',
      'Facturation avancée',
      'Tableau de bord analytique',
      'Liste d\'attente intelligente',
      'Suivis automatiques',
      'Personnalisation complète',
      'Support prioritaire',
    ],
    limits: {
      users: 10,
      patients: 1000,
      appointments: '2000/mois',
    },
    highlighted: true,
    cta: 'Essai gratuit 14 jours',
  },
  {
    name: 'Clinique',
    slug: 'enterprise',
    price: 199,
    yearlyPrice: 1990,
    description: 'Pour cliniques multi-praticiens',
    features: [
      'Tout dans Professionnel',
      'Utilisateurs illimités',
      'Patients illimités',
      'Accès API complet',
      'Intégrations personnalisées',
      'Gestionnaire de compte dédié',
      'Image de marque personnalisée',
      'Sécurité avancée',
      'Domaine personnalisé',
      'Garantie de disponibilité',
      'Formation incluse',
    ],
    limits: {
      users: 'Illimité',
      patients: 'Illimité',
      appointments: 'Illimité',
    },
    cta: 'Parler à un expert',
  },
];

const realStories = [
  {
    name: 'Dr Sarah Tremblay',
    role: 'Chiropraticienne, Clinique Santé Globale',
    location: 'Laval, QC',
    image: null,
    quote: "Avant ChiroFlow, je finissais à 19h30 chaque soir pour la paperasse. Maintenant je ferme à 17h pile et je passe mes soirées avec mes enfants. Ça a changé ma vie, littéralement.",
    results: "3 heures gagnées par jour • 75% moins d'absences • 0 appel de rappel",
    rating: 5,
  },
  {
    name: 'Dr Marc Dubois',
    role: 'Propriétaire, Clinique Alignement Optimal',
    location: 'Brossard, QC',
    quote: "J'avais 5-6 plages vides par semaine à cause des annulations. Maintenant la liste d'attente les remplit en 15 minutes. Ça m'a rapporté 28 000$ de plus la première année.",
    results: "28 000$ de revenus additionnels • Agenda plein à 98% • Zéro stress",
    rating: 5,
  },
  {
    name: 'Dr Julie Bergeron',
    role: 'Chiropraticienne, Santé en Mouvement',
    location: 'Sherbrooke, QC',
    quote: "Je ne réponds plus au téléphone pour les rendez-vous. Mes patients réservent en ligne même à 22h le soir. Je peux enfin me concentrer sur ce que j'aime : soigner mes patients.",
    results: "95% des rdv pris en ligne • Satisfaction patients à 98% • Équipe moins stressée",
    rating: 5,
  },
];

const stats = [
  { value: '500+', label: 'Cliniques au Québec' },
  { value: '50K+', label: 'Rendez-vous/mois' },
  { value: '85%', label: 'Moins d\'absences' },
  { value: '10h+', label: 'Gagnées/semaine' },
];

export const SaaSLandingPage: React.FC = () => {
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'yearly'>('monthly');
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-neutral-200 transition-all duration-300" style={{
        boxShadow: scrollY > 20 ? '0 4px 20px rgba(0,0,0,0.08)' : 'none'
      }}>
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">ChiroFlow</span>
              <p className="text-xs text-neutral-500 -mt-1">Fait pour vous</p>
            </div>
          </div>
          <div className="hidden md:flex items-center space-x-8">
            <a href="#problemes" className="text-neutral-600 hover:text-emerald-600 transition font-medium">Vos défis</a>
            <a href="#solution" className="text-neutral-600 hover:text-emerald-600 transition font-medium">La solution</a>
            <a href="#tarifs" className="text-neutral-600 hover:text-emerald-600 transition font-medium">Tarifs</a>
            <a href="#temoignages" className="text-neutral-600 hover:text-emerald-600 transition font-medium">Témoignages</a>
            <a href="/admin/login" className="text-neutral-600 hover:text-emerald-600 transition font-medium">Connexion</a>
            <button
              onClick={() => window.location.href = '/admin/signup'}
              className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl hover:shadow-lg hover:shadow-emerald-600/50 transition-all duration-300 font-semibold transform hover:scale-105"
            >
              Essai gratuit
            </button>
          </div>
        </nav>
      </header>

      <main className="pt-20">
        <section className="relative overflow-hidden bg-gradient-to-br from-emerald-50 via-white to-teal-50 py-24 md:py-32">
          <div className="absolute inset-0 opacity-30">
            <div className="absolute top-20 left-10 w-72 h-72 bg-emerald-300 rounded-full mix-blend-multiply filter blur-xl animate-blob"></div>
            <div className="absolute top-40 right-10 w-72 h-72 bg-teal-300 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000"></div>
            <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000"></div>
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
            <div className="text-center max-w-4xl mx-auto mb-16">
              <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-800 px-5 py-2 rounded-full text-sm font-medium mb-8 shadow-sm">
                <Heart className="w-4 h-4 text-red-500 fill-red-500 animate-pulse" />
                <span>Conçu par des chiros, pour des chiros</span>
              </div>

              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-neutral-900 mb-6 leading-tight">
                Vous êtes{' '}
                <span className="relative inline-block">
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600">
                    épuisé(e)
                  </span>
                  <svg className="absolute -bottom-2 left-0 right-0" height="12" viewBox="0 0 200 12" fill="none">
                    <path d="M2 7C60 3 140 3 198 7" stroke="url(#paint0_linear)" strokeWidth="3" strokeLinecap="round"/>
                    <defs>
                      <linearGradient id="paint0_linear" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#10b981"/>
                        <stop offset="100%" stopColor="#14b8a6"/>
                      </linearGradient>
                    </defs>
                  </svg>
                </span>
                {' '}par l'administratif?
              </h1>

              <div className="space-y-4 text-xl md:text-2xl text-neutral-600 mb-10 leading-relaxed">
                <p className="font-medium text-neutral-700">
                  Vous passez plus de temps au téléphone et devant l'ordinateur qu'avec vos patients.
                </p>
                <p>
                  Vous rêvez de rentrer chez vous à l'heure. De passer du temps avec votre famille.
                  De vous concentrer sur ce que vous aimez vraiment : <span className="font-semibold text-emerald-700">soigner vos patients</span>.
                </p>
              </div>

              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 md:p-8 shadow-xl border border-neutral-200 mb-12">
                <p className="text-lg md:text-xl text-neutral-700 mb-4 italic">
                  "J'ai ouvert ma clinique par passion pour aider les gens... pas pour passer mes soirées à faire de la paperasse."
                </p>
                <p className="text-neutral-500 text-sm">- Dr Marie-Claire, chiropraticienne depuis 12 ans</p>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
                <button
                  onClick={() => window.location.href = '/admin/signup'}
                  className="w-full sm:w-auto group px-8 py-5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl hover:shadow-2xl hover:shadow-emerald-600/40 transition-all duration-300 font-bold text-lg flex items-center justify-center space-x-3 transform hover:scale-105"
                >
                  <span>Essai gratuit 14 jours</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
                <button className="w-full sm:w-auto px-8 py-5 bg-white text-neutral-900 rounded-xl hover:bg-neutral-50 transition-all duration-300 font-semibold text-lg border-2 border-neutral-300 hover:border-emerald-600 shadow-lg">
                  Voir une démo (2 min)
                </button>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-neutral-600">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                  <span>Sans carte de crédit</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                  <span>Configuration en 5 minutes</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                  <span>Annulation en tout temps</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                  <span>Support en français</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 bg-neutral-900 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, index) => (
                <div key={index} className="text-center transform hover:scale-110 transition-transform duration-300">
                  <div className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400 mb-2">
                    {stat.value}
                  </div>
                  <div className="text-neutral-400 text-sm md:text-base">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="problemes" className="py-24 bg-gradient-to-b from-white to-neutral-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <div className="inline-flex items-center space-x-2 bg-red-100 text-red-800 px-4 py-2 rounded-full text-sm font-medium mb-6">
                <Coffee className="w-4 h-4" />
                <span>On vous comprend parfaitement</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-neutral-900 mb-6">
                Votre quotidien ressemble à ça?
              </h2>
              <p className="text-xl text-neutral-600 max-w-3xl mx-auto">
                Si vous vous reconnaissez dans au moins 3 de ces situations, ChiroFlow a été créé pour vous.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
              {painPoints.map((point, index) => {
                const Icon = point.icon;
                return (
                  <div
                    key={index}
                    className="group bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border-2 border-neutral-100 hover:border-emerald-500 transform hover:-translate-y-2"
                  >
                    <div className="flex items-start space-x-4 mb-6">
                      <div className="flex-shrink-0 w-12 h-12 bg-red-100 group-hover:bg-red-500 rounded-xl flex items-center justify-center transition-colors duration-300">
                        <Icon className="w-6 h-6 text-red-600 group-hover:text-white transition-colors duration-300" />
                      </div>
                      <div className="flex-1">
                        <XCircle className="w-5 h-5 text-red-500 mb-2" />
                        <p className="text-neutral-700 font-medium leading-relaxed">{point.problem}</p>
                      </div>
                    </div>

                    <div className="pt-6 border-t border-neutral-200">
                      <div className="flex items-start space-x-3">
                        <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-1" />
                        <p className="text-emerald-700 font-medium leading-relaxed">{point.solution}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="bg-gradient-to-br from-emerald-600 to-teal-600 rounded-3xl p-8 md:p-12 text-white text-center shadow-2xl">
              <Sparkles className="w-16 h-16 mx-auto mb-6 animate-pulse" />
              <h3 className="text-3xl md:text-4xl font-bold mb-4">
                Imaginez votre journée idéale
              </h3>
              <div className="max-w-3xl mx-auto space-y-4 text-lg md:text-xl text-emerald-50">
                <p>✨ Vous arrivez le matin. Votre agenda est déjà rempli - vos patients ont réservé en ligne.</p>
                <p>✨ Entre deux patients, zéro appel téléphonique. Zéro message de rappel à envoyer.</p>
                <p>✨ À 17h, vous fermez votre ordinateur. Tout est fait. Automatiquement.</p>
                <p className="text-2xl font-bold text-white pt-4">Vous rentrez chez vous. À l'heure. Souriant(e).</p>
              </div>
              <button
                onClick={() => window.location.href = '/admin/signup'}
                className="mt-8 px-8 py-4 bg-white text-emerald-700 rounded-xl hover:bg-neutral-50 transition-all duration-300 font-bold text-lg shadow-xl hover:shadow-2xl transform hover:scale-105"
              >
                Je veux cette vie maintenant
              </button>
            </div>
          </div>
        </section>

        <section id="temoignages" className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <div className="inline-flex items-center space-x-2 bg-yellow-100 text-yellow-800 px-4 py-2 rounded-full text-sm font-medium mb-6">
                <Award className="w-4 h-4" />
                <span>Ils ont transformé leur pratique</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-neutral-900 mb-4">
                Des chiros comme vous qui ont repris le contrôle
              </h2>
              <p className="text-xl text-neutral-600 max-w-3xl mx-auto">
                Voici ce qui arrive quand vous arrêtez de vous battre contre l'administratif
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 mb-12">
              {realStories.map((story, index) => (
                <div
                  key={index}
                  className="bg-gradient-to-br from-white to-neutral-50 rounded-2xl p-8 shadow-xl border-2 border-neutral-200 hover:border-emerald-500 transition-all duration-300 transform hover:-translate-y-2"
                >
                  <div className="flex items-center space-x-1 mb-4">
                    {[...Array(story.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <blockquote className="text-neutral-700 mb-6 leading-relaxed italic text-lg">
                    "{story.quote}"
                  </blockquote>
                  <div className="bg-emerald-50 rounded-xl p-4 mb-6 border-l-4 border-emerald-600">
                    <p className="text-sm font-bold text-emerald-900 mb-1">Résultats concrets:</p>
                    <p className="text-sm text-emerald-800">{story.results}</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                      {story.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <div className="font-bold text-neutral-900">{story.name}</div>
                      <div className="text-sm text-neutral-600">{story.role}</div>
                      <div className="text-xs text-neutral-500">{story.location}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="tarifs" className="py-24 bg-gradient-to-br from-neutral-50 to-blue-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <div className="inline-flex items-center space-x-2 bg-emerald-100 text-emerald-800 px-4 py-2 rounded-full text-sm font-medium mb-6">
                <Target className="w-4 h-4" />
                <span>Transparent et sans surprise</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-neutral-900 mb-6">
                Un prix qui change des vies
              </h2>
              <p className="text-xl text-neutral-600 mb-8 max-w-3xl mx-auto">
                Combien vaut votre temps avec votre famille? Votre santé mentale? <br/>
                <span className="font-bold text-emerald-700">Moins que le prix d'un café par jour.</span>
              </p>

              <div className="inline-flex items-center bg-white rounded-xl p-1.5 shadow-lg border-2 border-neutral-200 mb-4">
                <button
                  onClick={() => setBillingInterval('monthly')}
                  className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${
                    billingInterval === 'monthly'
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg'
                      : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  Mensuel
                </button>
                <button
                  onClick={() => setBillingInterval('yearly')}
                  className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 relative ${
                    billingInterval === 'yearly'
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg'
                      : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  Annuel
                  <span className="absolute -top-3 -right-2 text-xs bg-red-500 text-white px-2 py-0.5 rounded-full font-bold animate-pulse">
                    -17%
                  </span>
                </button>
              </div>
              <p className="text-sm text-neutral-600">Économisez 2 mois en payant annuellement</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-12">
              {pricingTiers.map((tier, index) => (
                <div
                  key={index}
                  className={`rounded-3xl p-8 transition-all duration-300 transform hover:-translate-y-2 ${
                    tier.highlighted
                      ? 'bg-gradient-to-br from-emerald-600 to-teal-600 text-white shadow-2xl scale-105 relative ring-4 ring-emerald-400 ring-offset-4'
                      : 'bg-white border-2 border-neutral-200 hover:border-emerald-500 shadow-xl'
                  }`}
                >
                  {tier.highlighted && (
                    <div className="absolute -top-5 left-1/2 transform -translate-x-1/2">
                      <span className="bg-gradient-to-r from-yellow-400 to-orange-400 text-neutral-900 text-sm font-bold px-6 py-2 rounded-full shadow-lg flex items-center space-x-1">
                        <ThumbsUp className="w-4 h-4" />
                        <span>Le plus populaire</span>
                      </span>
                    </div>
                  )}

                  <div className="mb-6">
                    <h3
                      className={`text-2xl font-bold mb-2 ${
                        tier.highlighted ? 'text-white' : 'text-neutral-900'
                      }`}
                    >
                      {tier.name}
                    </h3>
                    <p
                      className={`text-sm ${
                        tier.highlighted ? 'text-emerald-100' : 'text-neutral-600'
                      }`}
                    >
                      {tier.description}
                    </p>
                  </div>

                  <div className="mb-8">
                    <div className="flex items-baseline">
                      <span
                        className={`text-5xl font-bold ${
                          tier.highlighted ? 'text-white' : 'text-neutral-900'
                        }`}
                      >
                        {billingInterval === 'monthly' ? tier.price : tier.yearlyPrice}
                      </span>
                      <span
                        className={`text-lg ml-2 ${
                          tier.highlighted ? 'text-emerald-100' : 'text-neutral-600'
                        }`}
                      >
                        $
                      </span>
                    </div>
                    <p
                      className={`text-sm mt-1 ${
                        tier.highlighted ? 'text-emerald-100' : 'text-neutral-600'
                      }`}
                    >
                      par {billingInterval === 'monthly' ? 'mois' : 'an'}
                    </p>
                    {billingInterval === 'monthly' && (
                      <p className={`text-xs mt-2 ${tier.highlighted ? 'text-emerald-200' : 'text-neutral-500'}`}>
                        soit {(tier.price / 30).toFixed(2)}$ par jour
                      </p>
                    )}
                  </div>

                  <button
                    onClick={() => window.location.href = tier.slug === 'enterprise' ? '/contact' : '/admin/signup'}
                    className={`w-full py-4 rounded-xl font-bold mb-8 transition-all duration-300 transform hover:scale-105 ${
                      tier.highlighted
                        ? 'bg-white text-emerald-600 hover:bg-neutral-50 shadow-xl'
                        : 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:shadow-xl'
                    }`}
                  >
                    {tier.cta}
                  </button>

                  <div
                    className={`text-sm mb-6 pb-6 border-b ${
                      tier.highlighted ? 'border-emerald-400' : 'border-neutral-200'
                    }`}
                  >
                    <div className="flex items-center space-x-2 mb-2">
                      <Users className="w-4 h-4" />
                      <span>Jusqu'à {tier.limits.users} utilisateurs</span>
                    </div>
                    <div className="flex items-center space-x-2 mb-2">
                      <FileText className="w-4 h-4" />
                      <span>{tier.limits.patients} patients</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4" />
                      <span>{tier.limits.appointments}</span>
                    </div>
                  </div>

                  <ul className="space-y-3">
                    {tier.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start space-x-3">
                        <CheckCircle
                          className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                            tier.highlighted ? 'text-emerald-200' : 'text-emerald-600'
                          }`}
                        />
                        <span
                          className={`text-sm ${
                            tier.highlighted ? 'text-emerald-50' : 'text-neutral-600'
                          }`}
                        >
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-xl border-2 border-emerald-200 max-w-4xl mx-auto">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                  <Shield className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-neutral-900 mb-2">Garantie satisfait ou remboursé 30 jours</h3>
                  <p className="text-neutral-600 leading-relaxed">
                    Si ChiroFlow ne vous fait pas gagner au moins 10 heures par semaine et ne réduit pas vos absences de 50%+ dans les 30 premiers jours,
                    on vous rembourse intégralement. Sans question. Sans condition. Parce qu'on sait que ça fonctionne.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-24 bg-gradient-to-br from-emerald-600 via-teal-600 to-blue-600 text-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full mix-blend-overlay filter blur-3xl animate-blob"></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full mix-blend-overlay filter blur-3xl animate-blob animation-delay-2000"></div>
          </div>

          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
            <Heart className="w-20 h-20 mx-auto mb-8 text-white animate-pulse" />
            <h2 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              Vous méritez une vie équilibrée
            </h2>
            <p className="text-xl md:text-2xl mb-8 text-emerald-50 leading-relaxed max-w-3xl mx-auto">
              Vous avez passé des années à étudier pour devenir chiropraticien(ne).
              Pas pour devenir secrétaire, comptable et gestionnaire de rappels.
            </p>
            <p className="text-2xl md:text-3xl font-bold mb-10">
              Il est temps de reprendre le contrôle.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
              <button
                onClick={() => window.location.href = '/admin/signup'}
                className="w-full sm:w-auto group px-10 py-5 bg-white text-emerald-700 rounded-xl hover:bg-neutral-50 transition-all duration-300 font-bold text-xl shadow-2xl hover:shadow-white/50 flex items-center justify-center space-x-3 transform hover:scale-105"
              >
                <span>Démarrer mon essai gratuit</span>
                <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-6 text-emerald-100">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5" />
                <span>14 jours gratuits</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5" />
                <span>Sans engagement</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5" />
                <span>Support en français</span>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-neutral-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div>
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-bold">ChiroFlow</span>
              </div>
              <p className="text-neutral-400 text-sm leading-relaxed">
                La solution complète de gestion de pratique chiropratique.
                Conçue au Québec, pour les chiros du Québec.
              </p>
            </div>

            <div>
              <h3 className="font-bold mb-4 text-emerald-400">Produit</h3>
              <ul className="space-y-3 text-sm text-neutral-400">
                <li><a href="#problemes" className="hover:text-white transition">Fonctionnalités</a></li>
                <li><a href="#tarifs" className="hover:text-white transition">Tarifs</a></li>
                <li><a href="#" className="hover:text-white transition">Démo</a></li>
                <li><a href="#" className="hover:text-white transition">FAQ</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold mb-4 text-emerald-400">Entreprise</h3>
              <ul className="space-y-3 text-sm text-neutral-400">
                <li><a href="#" className="hover:text-white transition">À propos</a></li>
                <li><a href="#" className="hover:text-white transition">Blogue</a></li>
                <li><a href="#" className="hover:text-white transition">Carrières</a></li>
                <li><a href="#" className="hover:text-white transition">Contact</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold mb-4 text-emerald-400">Support</h3>
              <ul className="space-y-3 text-sm text-neutral-400">
                <li className="flex items-center space-x-2">
                  <Headphones className="w-4 h-4 text-emerald-500" />
                  <span>Support en français</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Mail className="w-4 h-4 text-emerald-500" />
                  <span>support@chiroflow.ca</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Phone className="w-4 h-4 text-emerald-500" />
                  <span>1-855-CHIRO-QC</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-neutral-800 pt-8 flex flex-col md:flex-row items-center justify-between text-sm text-neutral-400">
            <p>&copy; 2025 ChiroFlow. Tous droits réservés.</p>
            <div className="flex items-center space-x-6 mt-4 md:mt-0">
              <a href="#" className="hover:text-white transition">Politique de confidentialité</a>
              <a href="#" className="hover:text-white transition">Conditions d'utilisation</a>
              <a href="#" className="hover:text-white transition">Conformité HIPAA</a>
            </div>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
};

export default SaaSLandingPage;
