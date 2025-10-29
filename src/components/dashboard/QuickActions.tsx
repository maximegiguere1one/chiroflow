import { motion } from 'framer-motion';
import {
  UserPlus, Calendar, FileText, Clock, DollarSign,
  MessageSquare, Bell, Download, BarChart, Zap,
  ClipboardCheck, Phone, Mail as MailIcon
} from 'lucide-react';

interface QuickAction {
  id: string;
  label: string;
  icon: any;
  color: string;
  bgColor: string;
  action: () => void;
  shortcut?: string;
}

interface QuickActionsProps {
  onNewPatient: () => void;
  onNewAppointment: () => void;
  onNewNote: () => void;
  onViewCalendar: () => void;
  onBilling: () => void;
  onReminders: () => void;
  onReports: () => void;
  onBatchActions: () => void;
}

export function QuickActions({
  onNewPatient,
  onNewAppointment,
  onNewNote,
  onViewCalendar,
  onBilling,
  onReminders,
  onReports,
  onBatchActions
}: QuickActionsProps) {
  const actions: QuickAction[] = [
    {
      id: 'new-patient',
      label: 'Nouveau patient',
      icon: UserPlus,
      color: 'text-gold-600',
      bgColor: 'bg-gold-50',
      action: onNewPatient,
      shortcut: 'Ctrl+N'
    },
    {
      id: 'new-appointment',
      label: 'Rendez-vous rapide',
      icon: Calendar,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      action: onNewAppointment,
      shortcut: 'Ctrl+R'
    },
    {
      id: 'quick-note',
      label: 'Note SOAP rapide',
      icon: FileText,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      action: onNewNote,
      shortcut: 'Ctrl+S'
    },
    {
      id: 'calendar',
      label: 'Vue calendrier',
      icon: Clock,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      action: onViewCalendar,
      shortcut: 'Ctrl+K'
    },
    {
      id: 'billing',
      label: 'Facturation',
      icon: DollarSign,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      action: onBilling,
      shortcut: 'Ctrl+B'
    },
    {
      id: 'reminders',
      label: 'Rappels patients',
      icon: Bell,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      action: onReminders
    },
    {
      id: 'reports',
      label: 'Rapports',
      icon: BarChart,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      action: onReports
    },
    {
      id: 'batch',
      label: 'Actions groupées',
      icon: Zap,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      action: onBatchActions
    }
  ];

  return (
    <div className="bg-white border border-neutral-200 shadow-soft-lg p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-gold-400 to-gold-600 rounded-lg flex items-center justify-center">
          <Zap className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-xl font-heading text-foreground">Actions rapides</h3>
          <p className="text-sm text-foreground/60">Gagnez du temps avec ces raccourcis</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {actions.map((action, index) => (
          <motion.button
            key={action.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={action.action}
            className={`${action.bgColor} border border-transparent hover:border-gold-300 p-4 rounded-lg transition-all duration-200 group text-left relative overflow-hidden`}
          >
            <div className="relative z-10">
              <action.icon className={`w-6 h-6 ${action.color} mb-3`} />
              <div className="font-medium text-foreground text-sm mb-1">
                {action.label}
              </div>
              {action.shortcut && (
                <div className="text-xs text-foreground/40 font-mono">
                  {action.shortcut}
                </div>
              )}
            </div>
            <div className={`absolute inset-0 ${action.bgColor} opacity-0 group-hover:opacity-100 transition-opacity`} />
          </motion.button>
        ))}
      </div>

      <div className="mt-6 pt-6 border-t border-neutral-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <TodayStats />
        </div>
      </div>
    </div>
  );
}

function TodayStats() {
  return (
    <>
      <div className="flex items-center gap-3 p-3 bg-neutral-50 rounded-lg">
        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
          <ClipboardCheck className="w-5 h-5 text-green-600" />
        </div>
        <div>
          <div className="text-2xl font-light text-foreground">8</div>
          <div className="text-xs text-foreground/60">RDV aujourd'hui</div>
        </div>
      </div>

      <div className="flex items-center gap-3 p-3 bg-neutral-50 rounded-lg">
        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
          <Phone className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <div className="text-2xl font-light text-foreground">3</div>
          <div className="text-xs text-foreground/60">Appels à faire</div>
        </div>
      </div>

      <div className="flex items-center gap-3 p-3 bg-neutral-50 rounded-lg">
        <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
          <MailIcon className="w-5 h-5 text-orange-600" />
        </div>
        <div>
          <div className="text-2xl font-light text-foreground">5</div>
          <div className="text-xs text-foreground/60">Suivis en attente</div>
        </div>
      </div>
    </>
  );
}
