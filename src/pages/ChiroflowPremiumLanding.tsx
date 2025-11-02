import React, { useEffect } from 'react';
import { StickyNav } from '../components/premium/StickyNav';
import { HeroSectionPremium } from '../components/premium/HeroSectionPremium';
import { TrustLogos } from '../components/premium/TrustLogos';
import { ScrollStorySection } from '../components/premium/ScrollStorySection';
import { TestimonialCarousel } from '../components/premium/TestimonialCarousel';
import { BeforeAfterSlider } from '../components/premium/BeforeAfterSlider';
import { ROICalculator } from '../components/premium/ROICalculator';
import { FAQSection } from '../components/premium/FAQSection';
import { PremiumCTA } from '../components/premium/PremiumCTA';
import { MobileCTA } from '../components/premium/MobileCTA';
import { Zap } from 'lucide-react';

export const ChiroflowPremiumLanding: React.FC = () => {
  useEffect(() => {
    const handleGA4 = () => {
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'view_premium_landing', {
          event_category: 'engagement',
          event_label: 'Premium Landing Page View',
        });
      }
    };

    handleGA4();

    const handleScroll50 = () => {
      const scrolled = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
      if (scrolled > 50) {
        if (typeof window !== 'undefined' && (window as any).gtag) {
          (window as any).gtag('event', 'scroll_50', {
            event_category: 'engagement',
            event_label: '50% Scroll Depth',
          });
        }
        window.removeEventListener('scroll', handleScroll50);
      }
    };

    window.addEventListener('scroll', handleScroll50);

    return () => {
      window.removeEventListener('scroll', handleScroll50);
    };
  }, []);

  return (
    <div className="min-h-screen bg-white overflow-hidden">
      <StickyNav />
      <HeroSectionPremium />
      <TrustLogos />
      <ScrollStorySection />
      <TestimonialCarousel />
      <BeforeAfterSlider />
      <ROICalculator />
      <FAQSection />
      <PremiumCTA />
      <MobileCTA />

      <footer className="bg-slate-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div>
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-bold">ChiroFlow</span>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed">
                Le logiciel de gestion #1 des chiropraticiens québécois. Automatisation complète pour éliminer votre assistante.
              </p>
            </div>

            <div>
              <h3 className="font-bold mb-4 text-emerald-400">Fonctionnalités</h3>
              <ul className="space-y-3 text-sm text-slate-400">
                <li><a href="#fonctionnalites" className="hover:text-white transition">Réservation en ligne</a></li>
                <li><a href="#fonctionnalites" className="hover:text-white transition">Rappels automatiques</a></li>
                <li><a href="#fonctionnalites" className="hover:text-white transition">Facturation intelligente</a></li>
                <li><a href="#faq" className="hover:text-white transition">FAQ</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold mb-4 text-emerald-400">Ressources</h3>
              <ul className="space-y-3 text-sm text-slate-400">
                <li><a href="#temoignages" className="hover:text-white transition">Témoignages</a></li>
                <li><a href="#calculateur" className="hover:text-white transition">Calculateur ROI</a></li>
                <li><a href="/admin/signup" className="hover:text-white transition">Commencer l'essai</a></li>
                <li><a href="mailto:support@chiroflow.ca" className="hover:text-white transition">Contact</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold mb-4 text-emerald-400">Support</h3>
              <ul className="space-y-3 text-sm text-slate-400">
                <li className="flex items-center space-x-2">
                  <span>📧</span>
                  <a href="mailto:support@chiroflow.ca" className="hover:text-white transition">support@chiroflow.ca</a>
                </li>
                <li className="flex items-center space-x-2">
                  <span>📞</span>
                  <a href="tel:1-855-244-7636" className="hover:text-white transition">1-855-CHIROFLOW</a>
                </li>
                <li className="flex items-center space-x-2">
                  <span>⏰</span>
                  <span>Support 24/7 en français</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row items-center justify-between text-sm text-slate-400">
            <p>&copy; 2025 ChiroFlow. Tous droits réservés. Fait au Québec avec ❤️</p>
            <div className="flex items-center space-x-6 mt-4 md:mt-0">
              <a href="#" className="hover:text-white transition">Confidentialité</a>
              <a href="#" className="hover:text-white transition">Conditions d'utilisation</a>
              <a href="#" className="hover:text-white transition">Politique de remboursement</a>
            </div>
          </div>
        </div>
      </footer>

      <style>{`
        @media (prefers-reduced-motion: no-preference) {
          * {
            scroll-behavior: smooth;
          }
        }

        @supports (backdrop-filter: blur(10px)) {
          .backdrop-blur-sm {
            backdrop-filter: blur(4px);
          }
          .backdrop-blur-md {
            backdrop-filter: blur(12px);
          }
        }
      `}</style>
    </div>
  );
};

export default ChiroflowPremiumLanding;
