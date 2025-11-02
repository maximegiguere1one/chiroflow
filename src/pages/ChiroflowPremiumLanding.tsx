import React, { useEffect } from 'react';
import { HeroSectionPremium } from '../components/premium/HeroSectionPremium';
import { ScrollStorySection } from '../components/premium/ScrollStorySection';
import { TestimonialCarousel } from '../components/premium/TestimonialCarousel';
import { BeforeAfterSlider } from '../components/premium/BeforeAfterSlider';
import { PremiumCTA } from '../components/premium/PremiumCTA';

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
      <HeroSectionPremium />
      <ScrollStorySection />
      <TestimonialCarousel />
      <BeforeAfterSlider />
      <PremiumCTA />

      <footer className="bg-slate-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div>
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <span className="text-2xl font-bold">ChiroFlow</span>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed">
                Innovation canadienne en technologie du confort. Breveté et cliniquement prouvé.
              </p>
            </div>

            <div>
              <h3 className="font-bold mb-4 text-cyan-400">Produit</h3>
              <ul className="space-y-3 text-sm text-slate-400">
                <li><a href="#science" className="hover:text-white transition">Science</a></li>
                <li><a href="#temoignages" className="hover:text-white transition">Témoignages</a></li>
                <li><a href="#garantie" className="hover:text-white transition">Garantie 100 nuits</a></li>
                <li><a href="#faq" className="hover:text-white transition">FAQ</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold mb-4 text-cyan-400">Entreprise</h3>
              <ul className="space-y-3 text-sm text-slate-400">
                <li><a href="#" className="hover:text-white transition">À propos</a></li>
                <li><a href="#" className="hover:text-white transition">Notre histoire</a></li>
                <li><a href="#" className="hover:text-white transition">Recherche clinique</a></li>
                <li><a href="#" className="hover:text-white transition">Contact</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold mb-4 text-cyan-400">Support</h3>
              <ul className="space-y-3 text-sm text-slate-400">
                <li className="flex items-center space-x-2">
                  <span>📧</span>
                  <span>support@chiroflow.ca</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span>📞</span>
                  <span>1-855-CONFORT</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span>⏰</span>
                  <span>Lun-Ven 9h-18h EST</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row items-center justify-between text-sm text-slate-400">
            <p>&copy; 2025 ChiroFlow. Tous droits réservés. Conçu au Canada.</p>
            <div className="flex items-center space-x-6 mt-4 md:mt-0">
              <a href="#" className="hover:text-white transition">Confidentialité</a>
              <a href="#" className="hover:text-white transition">Conditions</a>
              <a href="#" className="hover:text-white transition">Remboursements</a>
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
