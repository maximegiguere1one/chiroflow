import { useState, useEffect } from 'react';
import { Menu, X, ChevronDown, Calendar, User, LogIn, Home as HomeIcon } from 'lucide-react';
import { router } from '../../lib/router';
import { trackEvent } from '../../lib/analytics';

interface HeaderProps {
  onOpenAppointment?: () => void;
  isAgendaFull?: boolean;
  showAdminLink?: boolean;
}

export function ImprovedHeader({ onOpenAppointment, isAgendaFull = false, showAdminLink = false }: HeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const mainNav = [
    {
      label: 'Services',
      href: '#services',
      type: 'anchor' as const,
    },
    {
      label: 'Approche',
      href: '#about',
      type: 'anchor' as const,
    },
    {
      label: 'Témoignages',
      href: '#testimonials',
      type: 'anchor' as const,
    },
    {
      label: 'Contact',
      href: '#contact',
      type: 'anchor' as const,
    },
  ];

  const secondaryNav = [
    {
      label: 'Réserver',
      icon: Calendar,
      items: [
        { label: 'Réservation en ligne', href: '/booking', icon: Calendar },
        { label: 'Modifier mon RDV', action: 'appointment-manage' },
      ]
    },
    {
      label: 'Portails',
      icon: User,
      items: [
        { label: 'Portail Patient', href: '/patient-portal/login', icon: User },
        ...(showAdminLink ? [{ label: 'Espace Admin', href: '/admin', icon: LogIn }] : []),
      ]
    },
  ];

  const handleNavClick = (item: any) => {
    if (item.type === 'anchor') {
      const element = document.querySelector(item.href);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
        setIsMobileMenuOpen(false);
      }
    } else if (item.href) {
      router.navigate(item.href);
      setIsMobileMenuOpen(false);
    } else if (item.action === 'appointment-manage' && onOpenAppointment) {
      onOpenAppointment();
      setIsMobileMenuOpen(false);
    }
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'bg-white shadow-lg' : 'bg-white/95 backdrop-blur-sm'
      }`}
      role="banner"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <button
            onClick={() => router.navigate('/')}
            className="group flex items-center space-x-2"
            aria-label="Retour à l'accueil"
          >
            <HomeIcon className="w-5 h-5 text-gold-600 group-hover:text-gold-700 transition-colors" />
            <div>
              <div className="font-heading text-xl text-foreground group-hover:text-gold-700 transition-colors">
                Dre Janie Leblanc
              </div>
              <div className="text-xs text-neutral-600 uppercase tracking-wider">
                Chiropraticienne
              </div>
            </div>
          </button>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-8">
            {/* Main navigation */}
            {mainNav.map((link) => (
              <button
                key={link.href}
                onClick={() => handleNavClick(link)}
                className="text-sm font-medium text-neutral-700 hover:text-gold-600 transition-colors"
              >
                {link.label}
              </button>
            ))}

            {/* Secondary navigation with dropdowns */}
            {secondaryNav.map((dropdown) => (
              <div
                key={dropdown.label}
                className="relative"
                onMouseEnter={() => setActiveDropdown(dropdown.label)}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <button className="flex items-center space-x-1 text-sm font-medium text-neutral-700 hover:text-gold-600 transition-colors">
                  <dropdown.icon className="w-4 h-4" />
                  <span>{dropdown.label}</span>
                  <ChevronDown className="w-3 h-3" />
                </button>

                {activeDropdown === dropdown.label && (
                  <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-neutral-200 py-2 animate-in fade-in slide-in-from-top-2">
                    {dropdown.items.map((item) => (
                      <button
                        key={item.label}
                        onClick={() => handleNavClick(item)}
                        className="w-full px-4 py-2 text-left text-sm text-neutral-700 hover:bg-gold-50 hover:text-gold-700 transition-colors flex items-center space-x-2"
                      >
                        {item.icon && <item.icon className="w-4 h-4" />}
                        <span>{item.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* CTA Button */}
            {onOpenAppointment && (
              <button
                onClick={() => {
                  trackEvent('cta_click', isAgendaFull ? 'header_waitlist' : 'header_appointment');
                  onOpenAppointment();
                }}
                className="px-6 py-2.5 bg-gold-600 text-white text-sm font-medium rounded-lg hover:bg-gold-700 transition-all duration-200 shadow-sm hover:shadow-md"
              >
                {isAgendaFull ? "Liste d'attente" : 'Prendre RDV'}
              </button>
            )}
          </nav>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg text-neutral-700 hover:bg-neutral-100 transition-colors"
            aria-label={isMobileMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-white border-t border-neutral-200 shadow-lg">
          <div className="px-4 py-6 space-y-4 max-h-[calc(100vh-80px)] overflow-y-auto">
            {/* Main links */}
            <div className="space-y-2">
              {mainNav.map((link) => (
                <button
                  key={link.href}
                  onClick={() => handleNavClick(link)}
                  className="block w-full text-left px-4 py-3 text-neutral-700 hover:bg-neutral-50 rounded-lg transition-colors"
                >
                  {link.label}
                </button>
              ))}
            </div>

            {/* Divider */}
            <div className="border-t border-neutral-200 my-4" />

            {/* Secondary navigation */}
            {secondaryNav.map((dropdown) => (
              <div key={dropdown.label} className="space-y-2">
                <div className="flex items-center space-x-2 px-4 py-2 text-sm font-semibold text-neutral-900 uppercase tracking-wider">
                  <dropdown.icon className="w-4 h-4" />
                  <span>{dropdown.label}</span>
                </div>
                {dropdown.items.map((item) => (
                  <button
                    key={item.label}
                    onClick={() => handleNavClick(item)}
                    className="block w-full text-left px-6 py-2.5 text-neutral-600 hover:bg-gold-50 hover:text-gold-700 rounded-lg transition-colors flex items-center space-x-2"
                  >
                    {item.icon && <item.icon className="w-4 h-4" />}
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            ))}

            {/* Mobile CTA */}
            {onOpenAppointment && (
              <>
                <div className="border-t border-neutral-200 my-4" />
                <button
                  onClick={() => {
                    trackEvent('cta_click', isAgendaFull ? 'mobile_waitlist' : 'mobile_appointment');
                    onOpenAppointment();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full px-6 py-3 bg-gold-600 text-white text-sm font-medium rounded-lg hover:bg-gold-700 transition-colors shadow-sm"
                >
                  {isAgendaFull ? "Rejoindre la liste d'attente" : 'Prendre rendez-vous'}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
