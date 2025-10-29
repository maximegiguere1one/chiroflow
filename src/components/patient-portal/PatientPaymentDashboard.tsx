import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  CreditCard,
  Plus,
  Star,
  Trash2,
  DollarSign,
  Download,
  AlertCircle,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { usePaymentMethods } from '../../hooks/usePaymentMethods';
import { useToastContext } from '../../contexts/ToastContext';
import { formatCurrency, getCardBrandIcon, isCardExpiringSoon } from '../../lib/paymentUtils';
import { previewInvoice } from '../../lib/invoiceGenerator';
import type { PaymentMethod, PaymentTransactionExtended } from '../../types/database';
import AddPaymentMethodModal from './AddPaymentMethodModal';

interface PatientPaymentDashboardProps {
  patientId: string;
}

export default function PatientPaymentDashboard({ patientId }: PatientPaymentDashboardProps) {
  const {
    paymentMethods,
    loading: methodsLoading,
    deletePaymentMethod,
    setPrimaryPaymentMethod,
    loadPaymentMethods,
  } = usePaymentMethods(patientId);

  const [transactions, setTransactions] = useState<PaymentTransactionExtended[]>([]);
  const [outstandingBalance, setOutstandingBalance] = useState(0);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loadingTransactions, setLoadingTransactions] = useState(true);
  const [patientInfo, setPatientInfo] = useState<any>(null);
  const toast = useToastContext();

  useEffect(() => {
    loadTransactions();
    loadOutstandingBalance();
    loadPatientInfo();
  }, [patientId]);

  async function loadPatientInfo() {
    try {
      const { data, error } = await supabase
        .from('patients_full')
        .select('*')
        .eq('id', patientId)
        .maybeSingle();

      if (error) throw error;
      setPatientInfo(data);
    } catch (error) {
      console.error('Error loading patient info:', error);
    }
  }

  async function loadTransactions() {
    try {
      const { data, error } = await supabase
        .from('payment_transactions_extended')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.warn('Payment transactions table may not exist:', error);
        setTransactions([]);
      } else {
        setTransactions(data || []);
      }
    } catch (error) {
      console.error('Error loading transactions:', error);
      setTransactions([]);
    } finally {
      setLoadingTransactions(false);
    }
  }

  async function loadOutstandingBalance() {
    try {
      const { data, error } = await supabase
        .from('billing')
        .select('total_amount')
        .eq('patient_id', patientId)
        .in('payment_status', ['unpaid', 'overdue']);

      if (error) {
        console.warn('Billing table query failed:', error);
        setOutstandingBalance(0);
        return;
      }

      const total = (data || []).reduce((sum, invoice) => sum + invoice.total_amount, 0);
      setOutstandingBalance(total);
    } catch (error) {
      console.error('Error loading balance:', error);
      setOutstandingBalance(0);
    }
  }

  async function handleDeletePaymentMethod(methodId: string) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette méthode de paiement ?')) {
      return;
    }

    const success = await deletePaymentMethod(methodId);
    if (success) {
      toast.success('Méthode de paiement supprimée');
    } else {
      toast.error('Erreur lors de la suppression');
    }
  }

  async function handleDownloadInvoice(transaction: PaymentTransactionExtended) {
    try {
      if (!patientInfo) {
        toast.error('Informations patient non disponibles');
        return;
      }

      // Récupérer les détails de la facture depuis billing si disponible
      const { data: billingData } = await supabase
        .from('billing')
        .select('*')
        .eq('patient_id', patientId)
        .maybeSingle();

      // Créer les données de la facture
      const invoiceData = {
        invoiceNumber: `INV-${transaction.id.slice(0, 8).toUpperCase()}`,
        date: transaction.created_at,
        dueDate: transaction.created_at,
        patientName: `${patientInfo.first_name} ${patientInfo.last_name}`,
        patientEmail: patientInfo.email || '',
        patientPhone: patientInfo.phone || '',
        patientAddress: patientInfo.address || '123 Rue Principale, Montréal, QC',
        services: [
          {
            description: transaction.notes || 'Consultation chiropratique',
            date: transaction.created_at,
            amount: transaction.amount,
          },
        ],
        subtotal: transaction.amount / 1.14975, // Enlever les taxes (TPS + TVQ Québec)
        tax: transaction.amount - (transaction.amount / 1.14975),
        total: transaction.amount,
        paid: transaction.status === 'completed' ? transaction.amount : 0,
        balance: transaction.status === 'completed' ? 0 : transaction.amount,
        paymentMethod: 'Carte de crédit',
        notes: billingData?.notes || 'Merci de votre confiance. Pour toute question, contactez-nous au (514) 555-0123.',
      };

      previewInvoice(invoiceData);
      toast.success('Facture ouverte dans une nouvelle fenêtre!');
    } catch (error) {
      console.error('Error generating invoice:', error);
      toast.error('Erreur lors de la génération de la facture');
    }
  }

  async function handleSetPrimary(methodId: string) {
    const success = await setPrimaryPaymentMethod(methodId);
    if (success) {
      toast.success('Méthode de paiement principale mise à jour');
    } else {
      toast.error('Erreur lors de la mise à jour');
    }
  }

  if (methodsLoading || loadingTransactions) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-gold-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {outstandingBalance > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-orange-50 to-orange-100 border border-orange-200 p-6 rounded-lg"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-orange-200 rounded-full flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-6 h-6 text-orange-700" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-orange-900 mb-1">Solde en attente</h3>
              <p className="text-sm text-orange-700 mb-3">
                Vous avez un solde impayé de {formatCurrency(outstandingBalance)}
              </p>
              <button className="px-4 py-2 bg-orange-600 text-white hover:bg-orange-700 rounded-lg text-sm font-medium transition-colors">
                Payer maintenant
              </button>
            </div>
          </div>
        </motion.div>
      )}

      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-heading text-foreground">Mes méthodes de paiement</h2>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-gold-500 to-gold-600 text-white hover:from-gold-600 hover:to-gold-700 transition-all shadow-soft hover:shadow-gold rounded-lg"
          >
            <Plus className="w-4 h-4" />
            <span className="text-sm font-medium">Ajouter une carte</span>
          </button>
        </div>

        {paymentMethods.length === 0 ? (
          <div className="text-center py-12 bg-neutral-50 border border-neutral-200 rounded-lg">
            <CreditCard className="w-12 h-12 text-foreground/20 mx-auto mb-3" />
            <p className="text-foreground/60 mb-4">Aucune méthode de paiement enregistrée</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-6 py-2 bg-gradient-to-r from-gold-500 to-gold-600 text-white hover:from-gold-600 hover:to-gold-700 transition-all shadow-soft hover:shadow-gold rounded-lg"
            >
              Ajouter votre première carte
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paymentMethods.map((method) => (
              <PaymentMethodCard
                key={method.id}
                method={method}
                isPrimary={method.is_primary}
                onSetPrimary={() => handleSetPrimary(method.id)}
                onDelete={() => handleDeletePaymentMethod(method.id)}
              />
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="text-xl font-heading text-foreground mb-6">Historique des transactions</h2>

        {transactions.length === 0 ? (
          <div className="text-center py-12 bg-neutral-50 border border-neutral-200 rounded-lg">
            <DollarSign className="w-12 h-12 text-foreground/20 mx-auto mb-3" />
            <p className="text-foreground/60">Aucune transaction pour le moment</p>
          </div>
        ) : (
          <div className="bg-white border border-neutral-200 shadow-soft rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-neutral-50 border-b border-neutral-200">
                  <tr>
                    <th className="text-left px-6 py-4 text-sm font-medium text-foreground/70">
                      Date
                    </th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-foreground/70">
                      Description
                    </th>
                    <th className="text-right px-6 py-4 text-sm font-medium text-foreground/70">
                      Montant
                    </th>
                    <th className="text-center px-6 py-4 text-sm font-medium text-foreground/70">
                      Statut
                    </th>
                    <th className="text-right px-6 py-4 text-sm font-medium text-foreground/70">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {transactions.map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-neutral-50 transition-colors">
                      <td className="px-6 py-4 text-sm text-foreground/80">
                        {new Date(transaction.created_at).toLocaleDateString('fr-CA')}
                      </td>
                      <td className="px-6 py-4 text-sm text-foreground">
                        {transaction.notes || transaction.transaction_type}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-foreground text-right">
                        {formatCurrency(transaction.amount, transaction.currency)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${
                            transaction.status === 'completed'
                              ? 'bg-green-100 text-green-700'
                              : transaction.status === 'pending'
                              ? 'bg-orange-100 text-orange-700'
                              : transaction.status === 'failed'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-neutral-100 text-neutral-700'
                          }`}
                        >
                          {transaction.status === 'completed' && 'Complété'}
                          {transaction.status === 'pending' && 'En attente'}
                          {transaction.status === 'failed' && 'Échoué'}
                          {transaction.status === 'refunded' && 'Remboursé'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleDownloadInvoice(transaction)}
                          className="p-2 hover:bg-gold-50 hover:text-gold-600 rounded-lg transition-colors group"
                          title="Télécharger la facture"
                        >
                          <Download className="w-4 h-4 group-hover:scale-110 transition-transform" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {showAddModal && (
        <AddPaymentMethodModal
          patientId={patientId}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            loadPaymentMethods();
            toast.success('Méthode de paiement ajoutée avec succès');
          }}
        />
      )}
    </div>
  );
}

function PaymentMethodCard({
  method,
  isPrimary,
  onSetPrimary,
  onDelete,
}: {
  method: PaymentMethod;
  isPrimary: boolean;
  onSetPrimary: () => void;
  onDelete: () => void;
}) {
  const isExpiringSoon = isCardExpiringSoon(method.expiry_month, method.expiry_year);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`relative bg-gradient-to-br from-neutral-800 to-neutral-900 text-white p-6 rounded-xl shadow-lifted ${
        isPrimary ? 'ring-2 ring-gold-400' : ''
      }`}
    >
      {isPrimary && (
        <div className="absolute top-4 right-4 flex items-center gap-1 px-2 py-1 bg-gold-500 rounded-full">
          <Star className="w-3 h-3 fill-current" />
          <span className="text-xs font-medium">Principale</span>
        </div>
      )}

      {isExpiringSoon && (
        <div className="absolute top-4 right-4 flex items-center gap-1 px-2 py-1 bg-orange-500 rounded-full">
          <AlertCircle className="w-3 h-3" />
          <span className="text-xs font-medium">Expire bientôt</span>
        </div>
      )}

      <div className="mb-8">
        <div className="text-2xl mb-1">{getCardBrandIcon(method.card_brand)}</div>
        <div className="text-sm opacity-80">{method.card_brand}</div>
      </div>

      <div className="mb-4">
        <div className="text-lg tracking-wider font-mono">•••• •••• •••• {method.last_four_digits}</div>
      </div>

      <div className="flex items-end justify-between">
        <div>
          <div className="text-xs opacity-70 mb-1">Titulaire</div>
          <div className="text-sm font-medium">{method.cardholder_name}</div>
        </div>
        <div>
          <div className="text-xs opacity-70 mb-1">Expire</div>
          <div className="text-sm font-medium">
            {String(method.expiry_month).padStart(2, '0')}/{String(method.expiry_year).slice(-2)}
          </div>
        </div>
      </div>

      {method.card_nickname && (
        <div className="mt-4 pt-4 border-t border-white/20">
          <div className="text-xs opacity-70">{method.card_nickname}</div>
        </div>
      )}

      <div className="mt-4 flex items-center gap-2">
        {!isPrimary && (
          <button
            onClick={onSetPrimary}
            className="flex-1 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-lg text-xs font-medium transition-colors"
          >
            Définir comme principale
          </button>
        )}
        <button
          onClick={onDelete}
          className="p-2 bg-red-500/20 hover:bg-red-500/30 backdrop-blur-sm rounded-lg transition-colors"
          title="Supprimer"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}
