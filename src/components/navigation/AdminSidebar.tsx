import { useState } from 'react';
import {
  LayoutDashboard, Users, Calendar, DollarSign, Settings, LogOut,
  ChevronRight, ChevronLeft, Clock, BarChart3, Shield, CreditCard,
  List, Bell, Zap, Menu, Home, FileText, MessageSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export type AdminView = 'dashboard' | 'patients' | 'appointments' | 'billing' | 'settings' |
  'batch' | 'quick-actions' | 'calendar' | 'progress' | 'analytics' | 'insurance' |
  'waitlist' | 'rebooking' | 'payments' | 'monitoring' | 'advanced-settings' | 'automation' | 'forms' | 'email-sms-tester' | 'communications';

interface NavItem {
  id: AdminView;
  label: string;
  icon: any;
  badge?: number;
  children?: NavItem[];
}

interface AdminSidebarProps {
  currentView: AdminView;
  onViewChange: (view: AdminView) => void;
  onLogout: () => void;
  userProfile?: any;
  isOpen: boolean;
  onToggle: () => void;
}

export function AdminSidebar({
  currentView,
  onViewChange,
  onLogout,
  userProfile,
  isOpen,
  onToggle
}: AdminSidebarProps) {
  const [expandedSections, setExpandedSections] = useState<string[]>(['main']);

  const navigationStructure: Array<{ section: string; items: NavItem[] }> = [
    {
      section: 'Principal',
      items: [
        { id: 'dashboard', label: '🌅 Ma Journée', icon: Home },
        { id: 'communications', label: '💬 Communications', icon: MessageSquare },
        { id: 'automation', label: 'Automatisation 100%', icon: Zap },
        { id: 'calendar', label: 'Calendrier', icon: Calendar },
        { id: 'quick-actions', label: 'Actions rapides', icon: Menu },
      ]
    },
    {
      section: 'Gestion',
      items: [
        { id: 'patients', label: 'Patients', icon: Users },
        { id: 'appointments', label: 'Rendez-vous', icon: Clock },
        { id: 'forms', label: '📋 Formulaires OCQ', icon: FileText },
        { id: 'waitlist', label: 'Liste d\'attente', icon: List },
        { id: 'rebooking', label: 'Re-réservations', icon: Calendar },
      ]
    },
    {
      section: 'Finances',
      items: [
        { id: 'billing', label: 'Facturation', icon: DollarSign },
        { id: 'payments', label: 'Paiements', icon: CreditCard },
        { id: 'insurance', label: 'Assurances', icon: Shield },
      ]
    },
    {
      section: 'Analyses',
      items: [
        { id: 'analytics', label: 'Analytiques', icon: BarChart3 },
        { id: 'progress', label: 'Progrès patients', icon: Users },
        { id: 'monitoring', label: 'Surveillance système', icon: Bell },
      ]
    },
    {
      section: 'Configuration',
      items: [
        { id: 'email-sms-tester', label: '📧 Test Emails/SMS', icon: Bell },
        { id: 'settings', label: 'Paramètres', icon: Settings },
        { id: 'advanced-settings', label: 'Paramètres avancés', icon: Settings },
        { id: 'batch', label: 'Opérations groupées', icon: List },
      ]
    }
  ];

  const toggleSection = (section: string) => {
    setExpandedSections(prev =>
      prev.includes(section)
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{
          width: isOpen ? '280px' : (window.innerWidth >= 1024 ? '80px' : '0px'),
          x: isOpen ? 0 : (window.innerWidth >= 1024 ? 0 : -280)
        }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="fixed left-0 top-0 h-full bg-white border-r border-neutral-200 z-50 flex flex-col shadow-xl lg:shadow-none"
      >
        {/* Header */}
        <div className="h-20 border-b border-neutral-200 flex items-center justify-between px-6">
          {isOpen ? (
            <>
              <div className="flex items-center space-x-3 min-w-0 flex-1">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                  {userProfile?.email?.[0]?.toUpperCase() || 'A'}
                </div>
                <div className="flex-1 min-w-0 overflow-hidden">
                  <div className="text-sm font-semibold text-neutral-900 truncate">
                    {userProfile?.email || 'Admin'}
                  </div>
                  <div className="text-xs text-neutral-500 truncate">
                    Administrateur
                  </div>
                </div>
              </div>
              <button
                onClick={onToggle}
                className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                title="Réduire le menu"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            </>
          ) : (
            <button
              onClick={onToggle}
              className="w-full flex items-center justify-center p-2 hover:bg-neutral-100 rounded-lg transition-colors"
              title="Ouvrir le menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-6 px-3">
          {isOpen ? (
            <div className="space-y-6">
              {navigationStructure.map(({ section, items }) => {
                const sectionId = section.toLowerCase().replace(/\s+/g, '-');
                const isExpanded = expandedSections.includes(sectionId);

                return (
                  <div key={section}>
                    <button
                      onClick={() => toggleSection(sectionId)}
                      className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-neutral-500 uppercase tracking-wider hover:text-neutral-700 transition-colors"
                    >
                      <span>{section}</span>
                      <ChevronRight
                        className={`w-3 h-3 transition-transform ${
                          isExpanded ? 'rotate-90' : ''
                        }`}
                      />
                    </button>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="space-y-1"
                        >
                          {items.map((item) => {
                            const Icon = item.icon;
                            const isActive = currentView === item.id;

                            return (
                              <button
                                key={item.id}
                                onClick={() => onViewChange(item.id)}
                                className={`
                                  w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg
                                  transition-all duration-200 group relative
                                  ${
                                    isActive
                                      ? 'bg-gold-50 text-gold-700'
                                      : 'text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900'
                                  }
                                `}
                              >
                                {isActive && (
                                  <motion.div
                                    layoutId="activeTab"
                                    className="absolute left-0 top-0 bottom-0 w-1 bg-gold-600 rounded-r"
                                    transition={{ duration: 0.2 }}
                                  />
                                )}
                                <Icon className={`w-5 h-5 ${isActive ? 'text-gold-600' : ''}`} />
                                <span className="text-sm font-medium">{item.label}</span>
                                {item.badge && (
                                  <span className="ml-auto px-2 py-0.5 text-xs font-semibold bg-red-100 text-red-700 rounded-full">
                                    {item.badge}
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="space-y-2">
              {navigationStructure.flatMap(({ items }) => items).map((item) => {
                const Icon = item.icon;
                const isActive = currentView === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => onViewChange(item.id)}
                    className={`
                      w-full flex items-center justify-center p-3 rounded-lg
                      transition-all duration-200 relative
                      ${
                        isActive
                          ? 'bg-gold-50 text-gold-700'
                          : 'text-neutral-700 hover:bg-neutral-50'
                      }
                    `}
                    title={item.label}
                  >
                    {isActive && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gold-600 rounded-r" />
                    )}
                    <Icon className={`w-5 h-5 ${isActive ? 'text-gold-600' : ''}`} />
                    {item.badge && (
                      <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </nav>

        {/* Footer */}
        <div className="border-t border-neutral-200 p-4 space-y-2">
          {isOpen ? (
            <>
              <button
                onClick={() => window.open('/', '_blank')}
                className="w-full flex items-center space-x-3 px-3 py-2 text-neutral-700 hover:bg-neutral-50 rounded-lg transition-colors"
              >
                <Home className="w-5 h-5" />
                <span className="text-sm">Voir le site</span>
              </button>
              <button
                onClick={onLogout}
                className="w-full flex items-center space-x-3 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span className="text-sm font-medium">Déconnexion</span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => window.open('/', '_blank')}
                className="w-full flex items-center justify-center p-3 text-neutral-700 hover:bg-neutral-50 rounded-lg transition-colors"
                title="Voir le site"
              >
                <Home className="w-5 h-5" />
              </button>
              <button
                onClick={onLogout}
                className="w-full flex items-center justify-center p-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Déconnexion"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </>
          )}
        </div>
      </motion.aside>
    </>
  );
}
