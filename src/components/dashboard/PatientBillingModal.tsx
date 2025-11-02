import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { X, DollarSign, Plus, Eye, Download, CheckCircle, Clock, XCircle, CreditCard } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToastContext } from '../../contexts/ToastContext';
import { Tooltip } from '../common/Tooltip';
import { EmptyState } from '../common/EmptyState';
import { CardSkeleton, TableSkeleton } from '../common/LoadingSkeleton';
import { ConfirmModal } from '../common/ConfirmModal';
import { buttonHover, buttonTap } from '../../lib/animations';

interface Invoice {
  id: string;
  patient_id: string | null;
  invoice_number: string;
  service_date: string;
  description: string;
  amount: number;
  tax_amount: number;
  total_amount: number;
  payment_method: string | null;
  payment_status: string;
  paid_date: string | null;
  notes: string | null;
  created_at: string;
}

interface Transaction {
  id: string;
  patient_id: string;
  invoice_id: string | null;
  transaction_type: string;
  amount: number;
  payment_method: string;
  transaction_status: string;
  notes: string | null;
  created_at: string;
}

interface PaymentMethod {
  id: string;
  patient_id: string;
  card_brand: string;
  last_four_digits: string;
  expiry_month: number;
  expiry_year: number;
  cardholder_name: string;
  is_primary: boolean;
  is_active: boolean;
  created_at: string;
}

interface PatientBillingModalProps {
  patient: {
    id: string;
    first_name: string;
    last_name: string;
  };
  onClose: () => void;
}

export function PatientBillingModal({ patient, onClose }: PatientBillingModalProps) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewInvoiceForm, setShowNewInvoiceForm] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const toast = useToastContext();

  useEffect(() => {
    loadBillingData();
  }, [patient.id]);

  async function loadBillingData() {
    try {
      const [invoicesRes, transactionsRes, methodsRes] = await Promise.all([
        supabase
          .from('billing')
          .select('*')
          .eq('patient_id', patient.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('payment_transactions')
          .select('*')
          .eq('patient_id', patient.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('payment_methods')
          .select('*')
          .eq('contact_id', patient.id)
          .order('is_default', { ascending: false })
      ]);

      if (invoicesRes.error) throw invoicesRes.error;
      if (transactionsRes.error) throw transactionsRes.error;
      if (methodsRes.error) throw methodsRes.error;

      setInvoices(invoicesRes.data || []);
      setTransactions(transactionsRes.data || []);
      setPaymentMethods(methodsRes.data || []);
    } catch (error) {
      console.error('Error loading billing data:', error);
      toast.error('Erreur lors du chargement des données de facturation');
    } finally {
      setLoading(false);
    }
  }

  const totalBilled = invoices.reduce((sum, inv) => sum + inv.total_amount, 0);
  const totalPaid = invoices
    .filter((inv) => inv.payment_status === 'paid')
    .reduce((sum, inv) => sum + inv.total_amount, 0);
  const totalOutstanding = invoices
    .filter((inv) => inv.payment_status === 'unpaid' || inv.payment_status === 'overdue')
    .reduce((sum, inv) => sum + inv.total_amount, 0);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white w-full max-w-6xl max-h-[90vh] overflow-y-auto shadow-lifted"
      >
        <div className="sticky top-0 bg-white border-b border-neutral-200 p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-heading text-foreground">Facturation et paiements</h3>
              <p className="text-sm text-foreground/60 mt-1">
                {patient.first_name} {patient.last_name}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!showNewInvoiceForm && (
              <Tooltip content="Créer une nouvelle facture pour ce patient" placement="bottom">
                <motion.button
                  onClick={() => setShowNewInvoiceForm(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 transition-all duration-300 shadow-soft"
                  whileHover={buttonHover}
                  whileTap={buttonTap}
                >
                  <Plus className="w-4 h-4" />
                  <span>Nouvelle facture</span>
                </motion.button>
              </Tooltip>
            )}
            <Tooltip content="Fermer" placement="bottom">
              <motion.button
                onClick={onClose}
                className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                whileHover={buttonHover}
                whileTap={buttonTap}
              >
                <X className="w-6 h-6" />
              </motion.button>
            </Tooltip>
          </div>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <CardSkeleton />
                <CardSkeleton />
                <CardSkeleton />
              </div>
              <TableSkeleton rows={5} />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Financial Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                      <DollarSign className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-sm text-foreground/60">Total facturé</div>
                  </div>
                  <div className="text-2xl font-light text-foreground">
                    {totalBilled.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}
                  </div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-sm text-foreground/60">Total payé</div>
                  </div>
                  <div className="text-2xl font-light text-foreground">
                    {totalPaid.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}
                  </div>
                </div>

                <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                      <Clock className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-sm text-foreground/60">Solde impayé</div>
                  </div>
                  <div className="text-2xl font-light text-foreground">
                    {totalOutstanding.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}
                  </div>
                </div>
              </div>

              {/* New Invoice Form */}
              {showNewInvoiceForm && (
                <NewInvoiceForm
                  patientId={patient.id}
                  onCancel={() => setShowNewInvoiceForm(false)}
                  onSuccess={() => {
                    setShowNewInvoiceForm(false);
                    loadBillingData();
                  }}
                />
              )}

              {/* Payment Methods */}
              {paymentMethods.length > 0 && (
                <div>
                  <h4 className="text-lg font-medium text-foreground mb-4">
                    Méthodes de paiement ({paymentMethods.length})
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {paymentMethods.map((method) => (
                      <div
                        key={method.id}
                        className="bg-white border border-neutral-200 shadow-soft p-4 flex items-center gap-4"
                      >
                        <div className="w-12 h-12 bg-gradient-to-br from-gold-100 to-gold-200 rounded-lg flex items-center justify-center">
                          <CreditCard className="w-6 h-6 text-gold-600" />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-foreground">
                            {method.card_brand.toUpperCase()} •••• {method.last_four_digits}
                          </div>
                          <div className="text-sm text-foreground/60">
                            {method.cardholder_name} - Exp. {method.expiry_month}/{method.expiry_year}
                          </div>
                        </div>
                        {method.is_primary && (
                          <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">
                            Principale
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Invoices */}
              <div>
                <h4 className="text-lg font-medium text-foreground mb-4">
                  Factures ({invoices.length})
                </h4>
                {invoices.length === 0 ? (
                  <EmptyState
                    icon={<DollarSign size={48} />}
                    title="Aucune facture"
                    description="Les factures pour ce patient apparaîtront ici"
                  />
                ) : (
                  <div className="space-y-3">
                    {invoices.map((invoice) => (
                      <InvoiceCard
                        key={invoice.id}
                        invoice={invoice}
                        onView={setSelectedInvoice}
                        onRefresh={loadBillingData}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Recent Transactions */}
              {transactions.length > 0 && (
                <div>
                  <h4 className="text-lg font-medium text-foreground mb-4">
                    Transactions récentes ({transactions.length})
                  </h4>
                  <div className="bg-white border border-neutral-200 shadow-soft">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-neutral-50 border-b border-neutral-200">
                          <tr>
                            <th className="text-left px-4 py-3 text-sm font-medium text-foreground/70">
                              Date
                            </th>
                            <th className="text-left px-4 py-3 text-sm font-medium text-foreground/70">
                              Type
                            </th>
                            <th className="text-left px-4 py-3 text-sm font-medium text-foreground/70">
                              Méthode
                            </th>
                            <th className="text-right px-4 py-3 text-sm font-medium text-foreground/70">
                              Montant
                            </th>
                            <th className="text-center px-4 py-3 text-sm font-medium text-foreground/70">
                              Statut
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-200">
                          {transactions.slice(0, 10).map((transaction) => (
                            <tr key={transaction.id} className="hover:bg-neutral-50">
                              <td className="px-4 py-3 text-sm text-foreground/70">
                                {new Date(transaction.created_at).toLocaleDateString('fr-CA')}
                              </td>
                              <td className="px-4 py-3 text-sm text-foreground">
                                {transaction.transaction_type === 'payment' && 'Paiement'}
                                {transaction.transaction_type === 'refund' && 'Remboursement'}
                                {transaction.transaction_type === 'adjustment' && 'Ajustement'}
                              </td>
                              <td className="px-4 py-3 text-sm text-foreground/70">
                                {transaction.payment_method}
                              </td>
                              <td className="px-4 py-3 text-sm text-right font-medium text-foreground">
                                {transaction.amount.toLocaleString('fr-CA', {
                                  style: 'currency',
                                  currency: 'CAD'
                                })}
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span
                                  className={`text-xs px-2 py-1 rounded-full ${
                                    transaction.transaction_status === 'completed'
                                      ? 'bg-green-100 text-green-700'
                                      : transaction.transaction_status === 'pending'
                                      ? 'bg-orange-100 text-orange-700'
                                      : 'bg-red-100 text-red-700'
                                  }`}
                                >
                                  {transaction.transaction_status === 'completed' && 'Complété'}
                                  {transaction.transaction_status === 'pending' && 'En attente'}
                                  {transaction.transaction_status === 'failed' && 'Échoué'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {selectedInvoice && (
          <InvoiceDetailModal
            invoice={selectedInvoice}
            onClose={() => setSelectedInvoice(null)}
            onRefresh={loadBillingData}
          />
        )}
      </motion.div>
    </div>
  );
}

function InvoiceCard({
  invoice,
  onView,
  onRefresh
}: {
  invoice: Invoice;
  onView: (invoice: Invoice) => void;
  onRefresh: () => void;
}) {
  const toast = useToastContext();

  async function handleMarkAsPaid() {
    try {
      const { error } = await supabase
        .from('billing')
        .update({
          payment_status: 'paid',
          paid_date: new Date().toISOString().split('T')[0]
        })
        .eq('id', invoice.id);

      if (error) throw error;
      toast.success('Facture marquée comme payée');
      onRefresh();
    } catch (error) {
      console.error('Error updating invoice:', error);
      toast.error('Erreur lors de la mise à jour');
    }
  }

  return (
    <div className="bg-white border border-neutral-200 shadow-soft p-4 flex items-start justify-between hover:shadow-soft-lg transition-all">
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-2">
          <div className="font-mono text-sm font-medium text-foreground">
            {invoice.invoice_number}
          </div>
          <span
            className={`text-xs px-2 py-1 rounded-full ${
              invoice.payment_status === 'paid'
                ? 'bg-green-100 text-green-700'
                : invoice.payment_status === 'unpaid'
                ? 'bg-orange-100 text-orange-700'
                : 'bg-red-100 text-red-700'
            }`}
          >
            {invoice.payment_status === 'paid' && 'Payé'}
            {invoice.payment_status === 'unpaid' && 'Non payé'}
            {invoice.payment_status === 'overdue' && 'En retard'}
          </span>
        </div>
        <div className="text-sm text-foreground/70 mb-2">
          {new Date(invoice.service_date).toLocaleDateString('fr-CA')} - {invoice.description}
        </div>
        <div className="text-lg font-medium text-foreground">
          {invoice.total_amount.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}
        </div>
      </div>
      <div className="flex items-center gap-2 ml-4">
        {invoice.payment_status === 'unpaid' && (
          <button
            onClick={handleMarkAsPaid}
            className="flex items-center gap-2 px-3 py-2 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg transition-colors text-sm"
          >
            <CheckCircle className="w-4 h-4" />
            <span>Marquer payé</span>
          </button>
        )}
        <button
          onClick={() => onView(invoice)}
          className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
          title="Voir détails"
        >
          <Eye className="w-5 h-5 text-foreground/60" />
        </button>
        <button
          onClick={() => toast.info('Téléchargement PDF bientôt disponible')}
          className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
          title="Télécharger"
        >
          <Download className="w-5 h-5 text-foreground/60" />
        </button>
      </div>
    </div>
  );
}

function NewInvoiceForm({
  patientId,
  onCancel,
  onSuccess
}: {
  patientId: string;
  onCancel: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    tax_rate: '14.975',
    service_date: new Date().toISOString().split('T')[0],
    notes: ''
  });
  const [saving, setSaving] = useState(false);
  const toast = useToastContext();

  const amount = parseFloat(formData.amount) || 0;
  const taxRate = parseFloat(formData.tax_rate) || 0;
  const taxAmount = (amount * taxRate) / 100;
  const totalAmount = amount + taxAmount;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      const invoiceNumber = `INV-${Date.now()}`;

      const { error } = await supabase.from('billing').insert({
        patient_id: patientId,
        invoice_number: invoiceNumber,
        service_date: formData.service_date,
        description: formData.description,
        amount: amount,
        tax_amount: taxAmount,
        total_amount: totalAmount,
        payment_status: 'unpaid',
        notes: formData.notes || null
      });

      if (error) throw error;
      toast.success('Facture créée avec succès');
      onSuccess();
    } catch (error: any) {
      console.error('Error creating invoice:', error);
      toast.error('Erreur: ' + (error.message || 'Erreur inconnue'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-neutral-50 border border-neutral-200 p-6 rounded-lg space-y-6">
      <h4 className="text-lg font-medium text-foreground">Nouvelle facture</h4>

      <div>
        <label className="block text-sm font-medium text-foreground/70 mb-2">
          Date du service <span className="text-red-500">*</span>
        </label>
        <input
          type="date"
          required
          value={formData.service_date}
          onChange={(e) => setFormData({ ...formData, service_date: e.target.value })}
          className="w-full px-4 py-3 border border-neutral-300 focus:border-green-400 focus:outline-none focus:ring-2 focus:ring-green-200 transition-all"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground/70 mb-2">
          Description <span className="text-red-500">*</span>
        </label>
        <textarea
          required
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={2}
          className="w-full px-4 py-3 border border-neutral-300 focus:border-green-400 focus:outline-none focus:ring-2 focus:ring-green-200 transition-all resize-none"
          placeholder="Ex: Consultation chiropratique, ajustement vertébral..."
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground/70 mb-2">
            Montant (avant taxes) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            required
            min="0"
            step="0.01"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            className="w-full px-4 py-3 border border-neutral-300 focus:border-green-400 focus:outline-none focus:ring-2 focus:ring-green-200 transition-all"
            placeholder="0.00"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground/70 mb-2">Taux de taxe (%)</label>
          <input
            type="number"
            min="0"
            step="0.001"
            value={formData.tax_rate}
            onChange={(e) => setFormData({ ...formData, tax_rate: e.target.value })}
            className="w-full px-4 py-3 border border-neutral-300 focus:border-green-400 focus:outline-none focus:ring-2 focus:ring-green-200 transition-all"
          />
        </div>
      </div>

      <div className="bg-white border border-neutral-300 p-4 rounded-lg">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-foreground/70">Montant:</span>
          <span className="font-medium text-foreground">
            {amount.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-foreground/70">Taxes ({taxRate}%):</span>
          <span className="font-medium text-foreground">
            {taxAmount.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}
          </span>
        </div>
        <div className="flex items-center justify-between text-lg font-semibold pt-2 border-t border-neutral-300">
          <span className="text-foreground">Total:</span>
          <span className="text-green-600">
            {totalAmount.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}
          </span>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground/70 mb-2">Notes internes</label>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          rows={2}
          className="w-full px-4 py-3 border border-neutral-300 focus:border-green-400 focus:outline-none focus:ring-2 focus:ring-green-200 transition-all resize-none"
        />
      </div>

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-300">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-3 border border-neutral-300 text-foreground hover:bg-neutral-50 transition-all"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-soft"
        >
          {saving ? 'Création...' : 'Créer la facture'}
        </button>
      </div>
    </form>
  );
}

function InvoiceDetailModal({
  invoice,
  onClose,
  onRefresh
}: {
  invoice: Invoice;
  onClose: () => void;
  onRefresh: () => void;
}) {
  const toast = useToastContext();

  async function handleMarkAsPaid() {
    try {
      const { error } = await supabase
        .from('billing')
        .update({
          payment_status: 'paid',
          paid_date: new Date().toISOString().split('T')[0]
        })
        .eq('id', invoice.id);

      if (error) throw error;
      toast.success('Facture marquée comme payée');
      onRefresh();
      onClose();
    } catch (error) {
      console.error('Error updating invoice:', error);
      toast.error('Erreur lors de la mise à jour');
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white w-full max-w-2xl shadow-lifted"
      >
        <div className="bg-white border-b border-neutral-200 p-6 flex items-center justify-between">
          <h3 className="text-2xl font-heading text-foreground">Facture {invoice.invoice_number}</h3>
          <button onClick={onClose} className="p-2 hover:bg-neutral-100 rounded-lg">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <div className="text-sm text-foreground/60 mb-1">Date du service</div>
              <div className="text-foreground font-medium">
                {new Date(invoice.service_date).toLocaleDateString('fr-CA')}
              </div>
            </div>
            <div>
              <div className="text-sm text-foreground/60 mb-1">Statut</div>
              <span
                className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${
                  invoice.payment_status === 'paid'
                    ? 'bg-green-100 text-green-700'
                    : invoice.payment_status === 'unpaid'
                    ? 'bg-orange-100 text-orange-700'
                    : 'bg-red-100 text-red-700'
                }`}
              >
                {invoice.payment_status === 'paid' && 'Payé'}
                {invoice.payment_status === 'unpaid' && 'Non payé'}
                {invoice.payment_status === 'overdue' && 'En retard'}
              </span>
            </div>
          </div>

          <div>
            <div className="text-sm text-foreground/60 mb-1">Description</div>
            <div className="text-foreground">{invoice.description}</div>
          </div>

          {invoice.notes && (
            <div>
              <div className="text-sm text-foreground/60 mb-1">Notes</div>
              <div className="text-foreground">{invoice.notes}</div>
            </div>
          )}

          <div className="bg-neutral-50 border border-neutral-200 p-6 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <span className="text-foreground/70">Montant:</span>
              <span className="font-medium text-foreground">
                {invoice.amount.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}
              </span>
            </div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-foreground/70">Taxes:</span>
              <span className="font-medium text-foreground">
                {invoice.tax_amount.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}
              </span>
            </div>
            <div className="flex items-center justify-between text-xl font-semibold pt-3 border-t border-neutral-300">
              <span className="text-foreground">Total:</span>
              <span className="text-green-600">
                {invoice.total_amount.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}
              </span>
            </div>
          </div>

          {invoice.payment_status === 'unpaid' && (
            <button
              onClick={handleMarkAsPaid}
              className="w-full py-3 bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 transition-all duration-300 shadow-soft"
            >
              Marquer comme payée
            </button>
          )}

          {invoice.paid_date && (
            <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
              <div className="text-sm text-green-800">
                <strong>Payé le:</strong> {new Date(invoice.paid_date).toLocaleDateString('fr-CA')}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
