import { motion } from 'framer-motion';
import { useState } from 'react';
import {
  CheckSquare, Mail, MessageSquare, Calendar,
  FileText, DollarSign, Archive, Trash2, Send
} from 'lucide-react';
import { useToastContext } from '../../contexts/ToastContext';

interface BatchOperation {
  id: string;
  name: string;
  description: string;
  icon: any;
  color: string;
  action: string;
}

export function BatchOperations() {
  const [selectedPatients, setSelectedPatients] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const toast = useToastContext();

  const operations: BatchOperation[] = [
    {
      id: 'send-reminders',
      name: 'Envoyer rappels RDV',
      description: 'Email/SMS pour rendez-vous à venir',
      icon: Mail,
      color: 'text-blue-600',
      action: 'reminders'
    },
    {
      id: 'send-followup',
      name: 'Envoyer suivis',
      description: 'Messages de suivi post-traitement',
      icon: MessageSquare,
      color: 'text-green-600',
      action: 'followup'
    },
    {
      id: 'schedule-recall',
      name: 'Planifier rappels',
      description: 'Rappels automatiques après X jours',
      icon: Calendar,
      color: 'text-purple-600',
      action: 'recall'
    },
    {
      id: 'generate-reports',
      name: 'Générer rapports',
      description: 'Rapports de progrès pour patients',
      icon: FileText,
      color: 'text-orange-600',
      action: 'reports'
    },
    {
      id: 'send-invoices',
      name: 'Envoyer factures',
      description: 'Factures en attente de paiement',
      icon: DollarSign,
      color: 'text-emerald-600',
      action: 'invoices'
    },
    {
      id: 'archive-inactive',
      name: 'Archiver inactifs',
      description: 'Patients sans visite depuis 6+ mois',
      icon: Archive,
      color: 'text-neutral-600',
      action: 'archive'
    }
  ];

  async function executeOperation(operationId: string) {
    if (selectedPatients.length === 0) {
      toast.warning('Sélectionnez au moins un patient');
      return;
    }

    setIsProcessing(true);

    // Simulate operation
    await new Promise(resolve => setTimeout(resolve, 1500));

    const operation = operations.find(op => op.id === operationId);
    toast.success(`${operation?.name} - ${selectedPatients.length} patients traités`);

    setIsProcessing(false);
    setSelectedPatients([]);
  }

  return (
    <div className="space-y-6">
      <div className="bg-white border border-neutral-200 shadow-soft-lg p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center">
            <CheckSquare className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-heading text-foreground">Actions groupées</h3>
            <p className="text-sm text-foreground/60">
              Gagnez du temps avec des opérations en masse
            </p>
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="text-2xl font-light text-foreground mb-1">12</div>
            <div className="text-sm text-foreground/60">RDV dans 24h</div>
            <button className="text-xs text-blue-600 hover:text-blue-700 font-medium mt-2">
              Envoyer rappels →
            </button>
          </div>

          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="text-2xl font-light text-foreground mb-1">8</div>
            <div className="text-sm text-foreground/60">Suivis en attente</div>
            <button className="text-xs text-green-600 hover:text-green-700 font-medium mt-2">
              Envoyer messages →
            </button>
          </div>

          <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="text-2xl font-light text-foreground mb-1">5</div>
            <div className="text-sm text-foreground/60">Factures impayées</div>
            <button className="text-xs text-orange-600 hover:text-orange-700 font-medium mt-2">
              Envoyer rappels →
            </button>
          </div>
        </div>

        {/* Operations grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {operations.map((operation) => (
            <motion.button
              key={operation.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => executeOperation(operation.id)}
              disabled={isProcessing}
              className="p-4 border border-neutral-200 hover:border-gold-400 rounded-lg transition-all text-left group disabled:opacity-50"
            >
              <operation.icon className={`w-6 h-6 ${operation.color} mb-2`} />
              <div className="font-medium text-sm text-foreground mb-1">
                {operation.name}
              </div>
              <div className="text-xs text-foreground/60">
                {operation.description}
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Automated workflows */}
      <div className="bg-white border border-neutral-200 shadow-soft-lg p-6">
        <h4 className="font-heading text-lg text-foreground mb-4">
          Workflows automatisés
        </h4>
        <div className="space-y-3">
          <WorkflowItem
            title="Rappel RDV automatique"
            description="Email envoyé 24h avant chaque rendez-vous"
            isActive={true}
            onToggle={() => toast.info('Workflow désactivé')}
          />
          <WorkflowItem
            title="Suivi post-traitement"
            description="Message 3 jours après chaque visite"
            isActive={true}
            onToggle={() => toast.info('Workflow désactivé')}
          />
          <WorkflowItem
            title="Rappel de rendez-vous manqué"
            description="Notification pour no-show automatique"
            isActive={false}
            onToggle={() => toast.info('Workflow activé')}
          />
          <WorkflowItem
            title="Facture impayée"
            description="Rappel après 30 jours sans paiement"
            isActive={true}
            onToggle={() => toast.info('Workflow désactivé')}
          />
        </div>
      </div>

      {/* Quick message templates */}
      <div className="bg-white border border-neutral-200 shadow-soft-lg p-6">
        <h4 className="font-heading text-lg text-foreground mb-4">
          Messages prédéfinis
        </h4>
        <div className="space-y-2">
          <MessageTemplate
            title="Rappel RDV demain"
            preview="Bonjour, ceci est un rappel pour votre rendez-vous demain à..."
            onUse={() => toast.success('Template copié')}
          />
          <MessageTemplate
            title="Suivi post-traitement"
            preview="Comment vous sentez-vous depuis votre dernière visite? N'hésitez pas..."
            onUse={() => toast.success('Template copié')}
          />
          <MessageTemplate
            title="Rappel facture"
            preview="Bonjour, nous remarquons que votre facture du... reste impayée..."
            onUse={() => toast.success('Template copié')}
          />
        </div>
      </div>
    </div>
  );
}

function WorkflowItem({
  title,
  description,
  isActive,
  onToggle
}: {
  title: string;
  description: string;
  isActive: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center justify-between p-3 bg-neutral-50 border border-neutral-200 rounded-lg">
      <div>
        <div className="font-medium text-sm text-foreground">{title}</div>
        <div className="text-xs text-foreground/60 mt-1">{description}</div>
      </div>
      <button
        onClick={onToggle}
        className={`px-3 py-1.5 text-xs font-medium rounded transition-all ${
          isActive
            ? 'bg-green-100 text-green-700 hover:bg-green-200'
            : 'bg-neutral-200 text-neutral-600 hover:bg-neutral-300'
        }`}
      >
        {isActive ? 'Actif' : 'Inactif'}
      </button>
    </div>
  );
}

function MessageTemplate({
  title,
  preview,
  onUse
}: {
  title: string;
  preview: string;
  onUse: () => void;
}) {
  return (
    <div className="flex items-start justify-between p-3 bg-neutral-50 border border-neutral-200 rounded-lg hover:border-gold-300 transition-all group">
      <div className="flex-1">
        <div className="font-medium text-sm text-foreground mb-1">{title}</div>
        <div className="text-xs text-foreground/60 line-clamp-1">{preview}</div>
      </div>
      <button
        onClick={onUse}
        className="ml-3 p-2 bg-white border border-neutral-300 rounded hover:border-gold-400 hover:bg-gold-50 transition-all opacity-0 group-hover:opacity-100"
      >
        <Send className="w-4 h-4" />
      </button>
    </div>
  );
}
