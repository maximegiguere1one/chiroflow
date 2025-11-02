import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home, Users, Settings, Search, Menu, X, ChevronLeft,
  Calendar, Bell, Zap, TrendingUp, HelpCircle
} from 'lucide-react';

export type SimplifiedView = 'dashboard' | 'patients' | 'settings';

interface SimplifiedSidebarProps {
  currentView: SimplifiedView;
  onViewChange: (view: SimplifiedView) => void;
  onLogout: () => void;
  userProfile?: any;
  isOpen: boolean;
  onToggle: () => void;
  onOpenSearch: () => void;
  unreadCount?: number;
  todayAppointments?: number;
}

export function SimplifiedSidebar({
  currentView,
  onViewChange,
  onLogout,
  userProfile,
  isOpen,
  onToggle,
  onOpenSearch,
  unreadCount = 0,
  todayAppointments = 0
}: SimplifiedSidebarProps) {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const mainNavItems = [
    {
      id: 'dashboard' as SimplifiedView,
      label: 'Ma Journée',
      icon: Home,
      badge: todayAppointments,
      description: 'Dashboard et rendez-vous du jour',
      color: 'blue'
    },
    {
      id: 'patients' as SimplifiedView,
      label: 'Patients & RDV',
      icon: Users,
      badge: unreadCount,
      description: 'Dossiers patients et planification',
      color: 'green'
    },
    {
      id: 'settings' as SimplifiedView,
      label: 'Configuration',
      icon: Settings,
      description: 'Paramètres et automatisations',
      color: 'purple'
    }
  ];

  const getColorClasses = (color: string, isActive: boolean) => {
    const colors = {
      blue: {
        bg: isActive ? 'bg-blue-500' : 'bg-blue-100',
        text: isActive ? 'text-white' : 'text-blue-600',
        hover: 'hover:bg-blue-200',
        badgeBg: isActive ? 'bg-white' : 'bg-blue-500',
        badgeText: isActive ? 'text-blue-600' : 'text-white'
      },
      green: {
        bg: isActive ? 'bg-green-500' : 'bg-green-100',
        text: isActive ? 'text-white' : 'text-green-600',
        hover: 'hover:bg-green-200',
        badgeBg: isActive ? 'bg-white' : 'bg-green-500',
        badgeText: isActive ? 'text-green-600' : 'text-white'
      },
      purple: {
        bg: isActive ? 'bg-purple-500' : 'bg-purple-100',
        text: isActive ? 'text-white' : 'text-purple-600',
        hover: 'hover:bg-purple-200',
        badgeBg: isActive ? 'bg-white' : 'bg-purple-500',
        badgeText: isActive ? 'text-purple-600' : 'text-white'
      }
    };
    return colors[color as keyof typeof colors];
  };

  return (
    <>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onToggle}
          className="fixed inset-0 bg-black/20 z-40 lg:hidden"
        />
      )}

      <motion.aside
        initial={false}
        animate={{
          width: isOpen ? '320px' : '80px',
          x: isOpen || window.innerWidth >= 1024 ? 0 : -320
        }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="fixed left-0 top-0 h-full bg-white border-r border-gray-200 z-50 flex flex-col shadow-xl lg:shadow-none"
      >
        <div className="h-20 border-b border-gray-200 flex items-center justify-between px-6">
          {isOpen ? (
            <>
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-lg">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-lg font-bold text-gray-900 truncate">
                    ChiroFlow
                  </h1>
                  <p className="text-xs text-gray-500 truncate">
                    {userProfile?.email || 'Clinique'}
                  </p>
                </div>
              </div>
              <button
                onClick={onToggle}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>
            </>
          ) : (
            <button
              onClick={onToggle}
              className="w-full flex items-center justify-center p-2 hover:bg-gray-100 rounded-lg"
            >
              <Menu className="w-6 h-6 text-gray-700" />
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
          <button
            onClick={onOpenSearch}
            className={`
              w-full flex items-center gap-3 px-4 py-3 rounded-xl
              bg-gray-100 hover:bg-gray-200
              transition-all duration-200
              ${isOpen ? 'justify-start' : 'justify-center'}
            `}
          >
            <Search className="w-5 h-5 text-gray-600 flex-shrink-0" />
            {isOpen && (
              <div className="flex-1 text-left">
                <span className="text-sm text-gray-600">Rechercher...</span>
                <kbd className="ml-2 text-xs bg-white px-1.5 py-0.5 rounded border border-gray-300">
                  ⌘K
                </kbd>
              </div>
            )}
          </button>

          <div className="h-4" />

          {mainNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            const colors = getColorClasses(item.color, isActive);
            const isHovered = hoveredItem === item.id;

            return (
              <motion.button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                onMouseEnter={() => setHoveredItem(item.id)}
                onMouseLeave={() => setHoveredItem(null)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`
                  w-full flex items-center gap-3 px-4 py-4 rounded-xl
                  transition-all duration-200
                  ${colors.bg}
                  ${!isActive && colors.hover}
                  ${isOpen ? 'justify-start' : 'justify-center'}
                  relative overflow-hidden
                `}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="absolute left-0 top-0 bottom-0 w-1 bg-white rounded-r"
                    transition={{ type: 'spring', damping: 30, stiffness: 400 }}
                  />
                )}

                <Icon className={`w-6 h-6 flex-shrink-0 ${colors.text}`} />

                {isOpen && (
                  <div className="flex-1 text-left">
                    <div className={`font-semibold ${colors.text} flex items-center gap-2`}>
                      {item.label}
                      {item.badge > 0 && (
                        <span className={`
                          text-xs px-2 py-0.5 rounded-full font-bold
                          ${colors.badgeBg} ${colors.badgeText}
                        `}>
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <AnimatePresence>
                      {isHovered && (
                        <motion.p
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className={`text-xs mt-1 ${colors.text} opacity-90`}
                        >
                          {item.description}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>

        <div className="border-t border-gray-200 p-4 space-y-2">
          {isOpen ? (
            <>
              <button
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Bell className="w-5 h-5" />
                <span>Notifications</span>
              </button>
              <button
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <HelpCircle className="w-5 h-5" />
                <span>Aide & Support</span>
              </button>
              <button
                onClick={onLogout}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
                <span>Déconnexion</span>
              </button>
            </>
          ) : (
            <>
              <button className="w-full p-2 hover:bg-gray-100 rounded-lg">
                <Bell className="w-5 h-5 text-gray-600 mx-auto" />
              </button>
              <button className="w-full p-2 hover:bg-gray-100 rounded-lg">
                <HelpCircle className="w-5 h-5 text-gray-600 mx-auto" />
              </button>
              <button
                onClick={onLogout}
                className="w-full p-2 hover:bg-red-50 rounded-lg"
              >
                <X className="w-5 h-5 text-red-600 mx-auto" />
              </button>
            </>
          )}
        </div>
      </motion.aside>
    </>
  );
}
