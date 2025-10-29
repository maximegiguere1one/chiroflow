import { motion } from 'framer-motion';
import {
  Calendar, FileText, DollarSign, Phone, Mail,
  CheckCircle, Clock, AlertCircle, MessageSquare
} from 'lucide-react';

interface TimelineEvent {
  id: string;
  type: 'appointment' | 'note' | 'payment' | 'call' | 'email' | 'reminder';
  title: string;
  description: string;
  date: string;
  time: string;
  status?: 'completed' | 'pending' | 'cancelled';
  metadata?: any;
}

interface PatientTimelineProps {
  patientId: string;
  patientName: string;
}

export function PatientTimeline({ patientId, patientName }: PatientTimelineProps) {
  // Mock data - would come from Supabase in real implementation
  const events: TimelineEvent[] = [
    {
      id: '1',
      type: 'appointment',
      title: 'Consultation chiropratique',
      description: 'Ajustement cervical C1-C2, thérapie tissus mous',
      date: '2025-10-15',
      time: '10:00',
      status: 'completed'
    },
    {
      id: '2',
      type: 'note',
      title: 'Note SOAP ajoutée',
      description: 'Amélioration 60% douleur lombaire. Continue plan traitement.',
      date: '2025-10-15',
      time: '10:45',
      status: 'completed'
    },
    {
      id: '3',
      type: 'payment',
      title: 'Paiement reçu',
      description: 'Facture #2845 - 85.00$',
      date: '2025-10-15',
      time: '11:00',
      status: 'completed'
    },
    {
      id: '4',
      type: 'reminder',
      title: 'Rappel envoyé',
      description: 'Email de rappel pour RDV du 22 octobre',
      date: '2025-10-21',
      time: '09:00',
      status: 'pending'
    },
    {
      id: '5',
      type: 'appointment',
      title: 'Rendez-vous planifié',
      description: 'Suivi - Réévaluation lombaire',
      date: '2025-10-22',
      time: '14:30',
      status: 'pending'
    }
  ];

  const getIcon = (type: string) => {
    switch (type) {
      case 'appointment': return Calendar;
      case 'note': return FileText;
      case 'payment': return DollarSign;
      case 'call': return Phone;
      case 'email': return Mail;
      case 'reminder': return MessageSquare;
      default: return Clock;
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'completed': return CheckCircle;
      case 'pending': return Clock;
      case 'cancelled': return AlertCircle;
      default: return Clock;
    }
  };

  const getColor = (type: string) => {
    switch (type) {
      case 'appointment': return 'bg-blue-100 text-blue-600 border-blue-200';
      case 'note': return 'bg-green-100 text-green-600 border-green-200';
      case 'payment': return 'bg-emerald-100 text-emerald-600 border-emerald-200';
      case 'call': return 'bg-purple-100 text-purple-600 border-purple-200';
      case 'email': return 'bg-orange-100 text-orange-600 border-orange-200';
      case 'reminder': return 'bg-gold-100 text-gold-600 border-gold-200';
      default: return 'bg-neutral-100 text-neutral-600 border-neutral-200';
    }
  };

  return (
    <div className="bg-white border border-neutral-200 shadow-soft-lg p-6">
      <div className="mb-6">
        <h3 className="text-xl font-heading text-foreground mb-1">
          Historique patient
        </h3>
        <p className="text-sm text-foreground/60">{patientName}</p>
      </div>

      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-[21px] top-0 bottom-0 w-0.5 bg-neutral-200" />

        <div className="space-y-6">
          {events.map((event, index) => {
            const Icon = getIcon(event.type);
            const StatusIcon = getStatusIcon(event.status);
            const isPast = new Date(event.date) < new Date();

            return (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="relative pl-14"
              >
                {/* Icon */}
                <div className={`absolute left-0 w-11 h-11 rounded-full border-2 flex items-center justify-center ${getColor(event.type)}`}>
                  <Icon className="w-5 h-5" />
                </div>

                {/* Content */}
                <div className={`p-4 border rounded-lg transition-all hover:shadow-soft ${
                  isPast ? 'bg-white border-neutral-200' : 'bg-gold-50/30 border-gold-200'
                }`}>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-foreground">{event.title}</h4>
                        {event.status && (
                          <StatusIcon className={`w-4 h-4 ${
                            event.status === 'completed'
                              ? 'text-green-600'
                              : event.status === 'pending'
                              ? 'text-gold-600'
                              : 'text-red-600'
                          }`} />
                        )}
                      </div>
                      <p className="text-sm text-foreground/70">
                        {event.description}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-foreground">
                        {new Date(event.date).toLocaleDateString('fr-CA', {
                          day: 'numeric',
                          month: 'short'
                        })}
                      </div>
                      <div className="text-xs text-foreground/60">
                        {event.time}
                      </div>
                    </div>
                  </div>

                  {!isPast && event.type === 'appointment' && (
                    <div className="flex gap-2 mt-3 pt-3 border-t border-neutral-200">
                      <button className="px-3 py-1.5 text-xs bg-green-100 text-green-700 hover:bg-green-200 rounded transition-all">
                        Confirmer
                      </button>
                      <button className="px-3 py-1.5 text-xs bg-neutral-100 text-neutral-700 hover:bg-neutral-200 rounded transition-all">
                        Modifier
                      </button>
                      <button className="px-3 py-1.5 text-xs bg-red-100 text-red-700 hover:bg-red-200 rounded transition-all">
                        Annuler
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Quick stats */}
      <div className="mt-6 pt-6 border-t border-neutral-200 grid grid-cols-3 gap-4">
        <div className="text-center">
          <div className="text-2xl font-light text-foreground mb-1">12</div>
          <div className="text-xs text-foreground/60">Visites total</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-light text-foreground mb-1">3</div>
          <div className="text-xs text-foreground/60">Notes SOAP</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-light text-foreground mb-1">425$</div>
          <div className="text-xs text-foreground/60">Revenus</div>
        </div>
      </div>

      {/* Add new event */}
      <div className="mt-6 pt-6 border-t border-neutral-200">
        <button className="w-full px-4 py-3 border-2 border-dashed border-neutral-300 hover:border-gold-400 hover:bg-gold-50 text-foreground/60 hover:text-foreground rounded-lg transition-all">
          + Ajouter une note rapide
        </button>
      </div>
    </div>
  );
}
