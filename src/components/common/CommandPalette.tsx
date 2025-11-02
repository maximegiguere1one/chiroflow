import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, User, Calendar, Settings, FileText, DollarSign,
  Clock, TrendingUp, Zap, ArrowRight, Command
} from 'lucide-react';

export interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon?: any;
  category: string;
  action: () => void;
  shortcut?: string;
  keywords?: string[];
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  commands: CommandItem[];
  recentCommands?: string[];
  placeholder?: string;
}

export function CommandPalette({
  isOpen,
  onClose,
  commands,
  recentCommands = [],
  placeholder = 'Rechercher ou taper une commande...'
}: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) {
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
          e.preventDefault();
        }
        return;
      }

      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(i => Math.min(i + 1, filteredCommands.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(i => Math.max(i - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredCommands[selectedIndex]) {
            executeCommand(filteredCommands[selectedIndex]);
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, query]);

  const filteredCommands = query
    ? commands.filter(cmd => {
        const searchText = `${cmd.label} ${cmd.description} ${cmd.keywords?.join(' ')}`.toLowerCase();
        return searchText.includes(query.toLowerCase());
      })
    : commands;

  const groupedCommands = filteredCommands.reduce((acc, cmd) => {
    if (!acc[cmd.category]) {
      acc[cmd.category] = [];
    }
    acc[cmd.category].push(cmd);
    return acc;
  }, {} as Record<string, CommandItem[]>);

  const executeCommand = (cmd: CommandItem) => {
    cmd.action();
    onClose();
    setQuery('');
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 400 }}
          className="relative w-full max-w-2xl mx-4"
        >
          <div className="bg-white rounded-xl shadow-2xl overflow-hidden border-2 border-gray-200">
            <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200">
              <Search className="w-5 h-5 text-gray-400" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSelectedIndex(0);
                }}
                placeholder={placeholder}
                className="flex-1 outline-none text-lg"
              />
              <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 rounded border border-gray-300">
                <Command className="w-3 h-3" />K
              </kbd>
            </div>

            <div className="max-h-[60vh] overflow-y-auto">
              {Object.keys(groupedCommands).length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Search className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>Aucun résultat pour "{query}"</p>
                  <p className="text-sm mt-1">
                    Essayez "patient", "rendez-vous", "facturation"...
                  </p>
                </div>
              ) : (
                Object.entries(groupedCommands).map(([category, items]) => (
                  <div key={category} className="py-2">
                    <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      {category}
                    </div>
                    {items.map((cmd, idx) => {
                      const globalIndex = filteredCommands.indexOf(cmd);
                      const isSelected = globalIndex === selectedIndex;
                      const Icon = cmd.icon || ArrowRight;

                      return (
                        <motion.button
                          key={cmd.id}
                          onClick={() => executeCommand(cmd)}
                          onMouseEnter={() => setSelectedIndex(globalIndex)}
                          className={`
                            w-full flex items-center gap-3 px-4 py-3
                            transition-colors duration-150
                            ${isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'}
                          `}
                          whileHover={{ x: 4 }}
                        >
                          <div className={`
                            w-8 h-8 rounded-lg flex items-center justify-center
                            ${isSelected ? 'bg-blue-500' : 'bg-gray-100'}
                          `}>
                            <Icon className={`
                              w-4 h-4
                              ${isSelected ? 'text-white' : 'text-gray-600'}
                            `} />
                          </div>

                          <div className="flex-1 text-left">
                            <div className="font-medium text-gray-900">
                              {cmd.label}
                            </div>
                            {cmd.description && (
                              <div className="text-sm text-gray-500">
                                {cmd.description}
                              </div>
                            )}
                          </div>

                          {cmd.shortcut && (
                            <kbd className="px-2 py-1 text-xs bg-gray-100 rounded border border-gray-300">
                              {cmd.shortcut}
                            </kbd>
                          )}

                          {isSelected && (
                            <ArrowRight className="w-4 h-4 text-blue-500" />
                          )}
                        </motion.button>
                      );
                    })}
                  </div>
                ))
              )}
            </div>

            <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center gap-4">
                <span>
                  <kbd className="px-1.5 py-0.5 bg-white rounded border">↑↓</kbd> Naviguer
                </span>
                <span>
                  <kbd className="px-1.5 py-0.5 bg-white rounded border">↵</kbd> Sélectionner
                </span>
                <span>
                  <kbd className="px-1.5 py-0.5 bg-white rounded border">esc</kbd> Fermer
                </span>
              </div>
              <div>
                {filteredCommands.length} commande{filteredCommands.length !== 1 && 's'}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export function useCommandPalette(commands: CommandItem[]) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return {
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    toggle: () => setIsOpen(prev => !prev),
    CommandPaletteComponent: () => (
      <CommandPalette
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        commands={commands}
      />
    )
  };
}

export const createDefaultCommands = (actions: {
  navigateTo: (view: string) => void;
  createPatient: () => void;
  createAppointment: () => void;
  viewBilling: () => void;
  viewSettings: () => void;
  quickSOAP: () => void;
  viewAnalytics: () => void;
}): CommandItem[] => [
  {
    id: 'nav-dashboard',
    label: 'Aller au Dashboard',
    description: 'Voir la vue d\'ensemble et rendez-vous du jour',
    icon: Clock,
    category: 'Navigation',
    action: () => actions.navigateTo('dashboard'),
    shortcut: '⌘1',
    keywords: ['accueil', 'home', 'dashboard', 'journée']
  },
  {
    id: 'nav-patients',
    label: 'Aller aux Patients',
    description: 'Voir et gérer la liste des patients',
    icon: User,
    category: 'Navigation',
    action: () => actions.navigateTo('patients'),
    shortcut: '⌘2',
    keywords: ['patients', 'dossiers', 'liste']
  },
  {
    id: 'nav-settings',
    label: 'Aller aux Paramètres',
    description: 'Configuration et automatisations',
    icon: Settings,
    category: 'Navigation',
    action: () => actions.navigateTo('settings'),
    shortcut: '⌘3',
    keywords: ['settings', 'config', 'paramètres']
  },
  {
    id: 'create-patient',
    label: 'Créer un nouveau patient',
    description: 'Ajout rapide en 2 champs',
    icon: User,
    category: 'Actions',
    action: actions.createPatient,
    shortcut: '⌘N',
    keywords: ['nouveau', 'patient', 'créer', 'ajouter']
  },
  {
    id: 'create-appointment',
    label: 'Planifier un rendez-vous',
    description: 'Créer un nouveau RDV',
    icon: Calendar,
    category: 'Actions',
    action: actions.createAppointment,
    shortcut: '⌘R',
    keywords: ['rendez-vous', 'rdv', 'appointment', 'planifier']
  },
  {
    id: 'quick-soap',
    label: 'Note SOAP rapide',
    description: 'Créer une note SOAP',
    icon: FileText,
    category: 'Actions',
    action: actions.quickSOAP,
    shortcut: '⌘S',
    keywords: ['soap', 'note', 'consultation']
  },
  {
    id: 'view-billing',
    label: 'Voir la facturation',
    description: 'Accéder aux factures et paiements',
    icon: DollarSign,
    category: 'Vues',
    action: actions.viewBilling,
    keywords: ['facturation', 'paiement', 'billing', 'factures']
  },
  {
    id: 'view-analytics',
    label: 'Voir les analytiques',
    description: 'Dashboard statistiques et rapports',
    icon: TrendingUp,
    category: 'Vues',
    action: actions.viewAnalytics,
    keywords: ['analytics', 'stats', 'rapports', 'statistiques']
  }
];
