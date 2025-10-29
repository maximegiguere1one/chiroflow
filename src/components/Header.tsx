import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { trackEvent } from '../lib/analytics';

interface HeaderProps {
  onOpenAppointment: () => void;
  isAgendaFull: boolean;
}

export default function Header({ onOpenAppointment, isAgendaFull }: HeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'Services', href: '#services' },
    { label: 'Approche', href: '#about' },
    { label: 'Témoignages', href: '#testimonials' },
    { label: 'Contact', href: '#contact' },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled ? 'bg-white/80 backdrop-blur-xl border-b border-muted-300/30' : 'bg-transparent'
      }`}
      role="banner"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="flex justify-between items-center h-24">
          <a href="#" className="group" aria-label="Retour à l'accueil">
            <div className="font-heading text-2xl tracking-tight text-foreground">
              Dre Janie Leblanc
            </div>
            <div className="text-xs tracking-widest text-muted-600 mt-0.5 uppercase font-light">
              Chiropraticienne
            </div>
          </a>

          <nav className="hidden lg:flex items-center space-x-12">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm tracking-wide text-foreground/70 hover:text-foreground transition-colors duration-300 font-light"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="hidden lg:flex items-center">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                trackEvent('cta_click', isAgendaFull ? 'header_waitlist' : 'header_appointment');
                onOpenAppointment();
              }}
              className="px-8 py-3 bg-foreground text-background text-sm tracking-wide hover:bg-foreground/90 transition-all duration-300 font-light cursor-pointer"
            >
              {isAgendaFull ? 'Liste d\'attente' : 'Rendez-vous'}
            </button>
          </div>

          <button
            type="button"
            className="lg:hidden p-2 text-foreground cursor-pointer"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label={isMobileMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="lg:hidden bg-white border-t border-muted-300/30">
          <div className="px-6 py-8 space-y-6">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="block text-foreground/70 hover:text-foreground transition-colors font-light"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                trackEvent('cta_click', isAgendaFull ? 'mobile_waitlist' : 'mobile_appointment');
                onOpenAppointment();
                setIsMobileMenuOpen(false);
              }}
              className="w-full px-8 py-3 bg-foreground text-background text-sm tracking-wide font-light cursor-pointer"
            >
              {isAgendaFull ? 'Liste d\'attente' : 'Rendez-vous'}
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
