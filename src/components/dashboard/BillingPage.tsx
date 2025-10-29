import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import {
  DollarSign,
  Plus,
  Search,
  Download,
  Eye,
  Send,
  CheckCircle,
  XCircle,
  Clock,
  X,
} from 'lucide-react';
import { useToastContext } from '../../contexts/ToastContext';
import { InvoicePreviewModal } from './InvoicePreviewModal';
import { generateInvoiceHTML } from '../../lib/invoiceHtmlGenerator';

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
  insurance_claim_number: string | null;
  notes: string | null;
  created_at: string;
}

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
}

interface InvoicePreviewData {
  invoiceNumber: string;
  date: string;
  dueDate: string;
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  patientAddress: string;
  services: Array<{
    description: string;
    date: string;
    amount: number;
  }>;
  subtotal: number;
  tax: number;
  total: number;
  paid: number;
  balance: number;
  paymentMethod?: string;
  notes?: string;
}

export function BillingPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'unpaid' | 'paid' | 'overdue'>('all');
  const [showNewInvoiceModal, setShowNewInvoiceModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [invoicePreviewData, setInvoicePreviewData] = useState<InvoicePreviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const toast = useToastContext();

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [invoicesRes, patientsRes] = await Promise.all([
        supabase.from('billing').select('*').order('created_at', { ascending: false }),
        supabase.from('patients_full').select('id, first_name, last_name, email, phone, address').eq('status', 'active'),
      ]);

      if (invoicesRes.error) throw invoicesRes.error;
      if (patientsRes.error) throw patientsRes.error;

      setInvoices(invoicesRes.data || []);
      setPatients(patientsRes.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  }

  async function handleDownloadInvoice(invoice: Invoice) {
    try {
      const patient = patients.find((p) => p.id === invoice.patient_id);

      if (!patient) {
        toast.error('Patient introuvable');
        return;
      }

      const invoiceData: InvoicePreviewData = {
        invoiceNumber: invoice.invoice_number,
        date: invoice.service_date,
        dueDate: invoice.service_date,
        patientName: `${patient.first_name} ${patient.last_name}`,
        patientEmail: (patient as any).email || 'non-disponible@exemple.com',
        patientPhone: (patient as any).phone || '(514) 555-0000',
        patientAddress: (patient as any).address || '123 Rue Principale, Montréal, QC H1A 1A1',
        services: [
          {
            description: invoice.description,
            date: invoice.service_date,
            amount: invoice.amount,
          },
        ],
        subtotal: invoice.amount,
        tax: invoice.tax_amount,
        total: invoice.total_amount,
        paid: invoice.payment_status === 'paid' ? invoice.total_amount : 0,
        balance: invoice.payment_status === 'paid' ? 0 : invoice.total_amount,
        paymentMethod: invoice.payment_method || 'Non spécifié',
        notes: invoice.notes || 'Merci de votre confiance. Pour toute question, contactez-nous au (514) 555-0123.',
      };

      setInvoicePreviewData(invoiceData);
    } catch (error) {
      console.error('Error preparing invoice:', error);
      toast.error('Erreur lors de la préparation de la facture');
    }
  }

  async function handleSendInvoice(invoice: Invoice) {
    try {
      const patient = patients.find((p) => p.id === invoice.patient_id);

      if (!patient) {
        toast.error('Patient introuvable');
        return;
      }

      const patientEmail = (patient as any).email;

      if (!patientEmail) {
        toast.error('Le patient n\'a pas d\'adresse email');
        return;
      }

      const invoiceData: InvoicePreviewData = {
        invoiceNumber: invoice.invoice_number,
        date: invoice.service_date,
        dueDate: invoice.service_date,
        patientName: `${patient.first_name} ${patient.last_name}`,
        patientEmail: patientEmail,
        patientPhone: (patient as any).phone || '(514) 555-0000',
        patientAddress: (patient as any).address || '123 Rue Principale, Montréal, QC H1A 1A1',
        services: [
          {
            description: invoice.description,
            date: invoice.service_date,
            amount: invoice.amount,
          },
        ],
        subtotal: invoice.amount,
        tax: invoice.tax_amount,
        total: invoice.total_amount,
        paid: invoice.payment_status === 'paid' ? invoice.total_amount : 0,
        balance: invoice.payment_status === 'paid' ? 0 : invoice.total_amount,
        paymentMethod: invoice.payment_method || 'Non spécifié',
        notes: invoice.notes || 'Merci de votre confiance. Pour toute question, contactez-nous au (514) 555-0123.',
      };

      toast.info('Envoi de la facture en cours...');

      const invoiceHTML = generateInvoiceHTML(invoiceData);

      const { error } = await supabase.functions.invoke('test-email', {
        body: {
          to: patientEmail,
          subject: `Facture ${invoice.invoice_number} - Clinique Janie Leblanc`,
          html: invoiceHTML,
        },
      });

      if (error) {
        console.error('Error from edge function:', error);
        throw error;
      }

      toast.success(`Facture envoyée à ${patientEmail}`);
    } catch (error) {
      console.error('Error sending invoice:', error);
      toast.error('Erreur lors de l\'envoi de la facture');
    }
  }

  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch =
      inv.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.description.toLowerCase().includes(searchTerm.toLowerCase());

    if (filterStatus === 'all') return matchesSearch;
    return matchesSearch && inv.payment_status === filterStatus;
  });

  const stats = {
    total: invoices.reduce((sum, inv) => sum + inv.total_amount, 0),
    paid: invoices
      .filter((inv) => inv.payment_status === 'paid')
      .reduce((sum, inv) => sum + inv.total_amount, 0),
    unpaid: invoices
      .filter((inv) => inv.payment_status === 'unpaid')
      .reduce((sum, inv) => sum + inv.total_amount, 0),
    overdue: invoices
      .filter((inv) => inv.payment_status === 'overdue')
      .reduce((sum, inv) => sum + inv.total_amount, 0),
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-gold-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-heading text-foreground">Facturation</h2>
          <p className="text-sm text-foreground/60 mt-1">{invoices.length} factures au total</p>
        </div>
        <button
          onClick={() => setShowNewInvoiceModal(true)}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-gold-500 to-gold-600 text-white hover:from-gold-600 hover:to-gold-700 transition-all duration-300 shadow-soft hover:shadow-gold"
        >
          <Plus className="w-4 h-4" />
          <span className="font-light">Nouvelle facture</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatsCard
          title="Total facturé"
          value={stats.total}
          icon={DollarSign}
          color="from-gold-400 to-gold-600"
          bgColor="from-gold-50 to-gold-100"
        />
        <StatsCard
          title="Payé"
          value={stats.paid}
          icon={CheckCircle}
          color="from-green-500 to-green-600"
          bgColor="from-green-50 to-green-100"
        />
        <StatsCard
          title="En attente"
          value={stats.unpaid}
          icon={Clock}
          color="from-orange-500 to-orange-600"
          bgColor="from-orange-50 to-orange-100"
        />
        <StatsCard
          title="En retard"
          value={stats.overdue}
          icon={XCircle}
          color="from-red-500 to-red-600"
          bgColor="from-red-50 to-red-100"
        />
      </div>

      {/* Filters and Search */}
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher par numéro ou description..."
            className="w-full pl-12 pr-4 py-3 bg-white border border-neutral-200 focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200 transition-all"
          />
        </div>

        <div className="flex items-center gap-2 border border-neutral-300 overflow-hidden">
          {(['all', 'unpaid', 'paid', 'overdue'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-3 text-sm transition-colors ${
                filterStatus === status
                  ? 'bg-gradient-to-r from-gold-500 to-gold-600 text-white'
                  : 'bg-white text-foreground hover:bg-neutral-50'
              }`}
            >
              {status === 'all' && 'Toutes'}
              {status === 'unpaid' && 'Non payées'}
              {status === 'paid' && 'Payées'}
              {status === 'overdue' && 'En retard'}
            </button>
          ))}
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white border border-neutral-200 shadow-soft-lg">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-medium text-foreground/70">
                  Numéro
                </th>
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
              {filteredInvoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-neutral-50 transition-colors">
                  <td className="px-6 py-4">
                    <span className="font-mono text-sm font-medium text-foreground">
                      {invoice.invoice_number}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-foreground/70">
                    {new Date(invoice.service_date).toLocaleDateString('fr-CA')}
                  </td>
                  <td className="px-6 py-4 text-sm text-foreground/80 max-w-xs truncate">
                    {invoice.description}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="font-medium text-foreground">
                      {invoice.total_amount.toLocaleString('fr-CA', {
                        style: 'currency',
                        currency: 'CAD',
                      })}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
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
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setSelectedInvoice(invoice)}
                        className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                        title="Voir"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDownloadInvoice(invoice)}
                        className="p-2 hover:bg-gold-50 hover:text-gold-600 rounded-lg transition-colors group"
                        title="Télécharger la facture"
                      >
                        <Download className="w-4 h-4 group-hover:scale-110 transition-transform" />
                      </button>
                      <button
                        onClick={() => handleSendInvoice(invoice)}
                        className="p-2 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors group"
                        title="Envoyer par email"
                      >
                        <Send className="w-4 h-4 group-hover:scale-110 transition-transform" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredInvoices.length === 0 && (
            <div className="text-center py-12">
              <DollarSign className="w-12 h-12 text-foreground/20 mx-auto mb-3" />
              <p className="text-foreground/60">Aucune facture trouvée</p>
            </div>
          )}
        </div>
      </div>

      {showNewInvoiceModal && (
        <NewInvoiceModal
          patients={patients}
          onClose={() => setShowNewInvoiceModal(false)}
          onSuccess={() => {
            loadData();
            setShowNewInvoiceModal(false);
          }}
        />
      )}

      {selectedInvoice && (
        <InvoiceDetailModal
          invoice={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
          onRefresh={loadData}
        />
      )}

      {invoicePreviewData && (
        <InvoicePreviewModal
          data={invoicePreviewData}
          onClose={() => setInvoicePreviewData(null)}
        />
      )}
    </div>
  );
}

function StatsCard({
  title,
  value,
  icon: Icon,
  color,
  bgColor,
}: {
  title: string;
  value: number;
  icon: any;
  color: string;
  bgColor: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative group"
    >
      <div
        className={`bg-gradient-to-br ${bgColor} border border-white/40 p-6 shadow-soft hover:shadow-soft-lg transition-all duration-300`}
      >
        <div className="flex items-start justify-between mb-4">
          <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center shadow-soft`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
        </div>
        <div>
          <div className="text-3xl font-light text-foreground tracking-tight mb-1">
            {value.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}
          </div>
          <div className="text-sm text-foreground/60 font-light">{title}</div>
        </div>
      </div>
    </motion.div>
  );
}

function NewInvoiceModal({
  patients,
  onClose,
  onSuccess,
}: {
  patients: Patient[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    patient_id: '',
    description: '',
    amount: '',
    tax_rate: '14.975',
    service_date: new Date().toISOString().split('T')[0],
    payment_method: '',
    notes: '',
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
        patient_id: formData.patient_id || null,
        invoice_number: invoiceNumber,
        service_date: formData.service_date,
        description: formData.description,
        amount: amount,
        tax_amount: taxAmount,
        total_amount: totalAmount,
        payment_method: formData.payment_method || null,
        payment_status: 'unpaid',
        notes: formData.notes || null,
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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-lifted"
      >
        <div className="sticky top-0 bg-white border-b border-neutral-200 p-6 flex items-center justify-between">
          <h3 className="text-2xl font-heading text-foreground">Nouvelle facture</h3>
          <button onClick={onClose} className="p-2 hover:bg-neutral-100 rounded-lg">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-foreground/70 mb-2">
              Patient (optionnel)
            </label>
            <select
              value={formData.patient_id}
              onChange={(e) => setFormData({ ...formData, patient_id: e.target.value })}
              className="w-full px-4 py-3 border border-neutral-300 focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200 transition-all"
            >
              <option value="">Sélectionner un patient...</option>
              {patients.map((patient) => (
                <option key={patient.id} value={patient.id}>
                  {patient.first_name} {patient.last_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground/70 mb-2">
              Date du service <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              required
              value={formData.service_date}
              onChange={(e) => setFormData({ ...formData, service_date: e.target.value })}
              className="w-full px-4 py-3 border border-neutral-300 focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200 transition-all"
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
              rows={3}
              className="w-full px-4 py-3 border border-neutral-300 focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200 transition-all resize-none"
              placeholder="Ex: Consultation chiropratique, ajustement vertébral..."
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
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
                className="w-full px-4 py-3 border border-neutral-300 focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200 transition-all"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground/70 mb-2">
                Taux de taxe (%)
              </label>
              <input
                type="number"
                min="0"
                step="0.001"
                value={formData.tax_rate}
                onChange={(e) => setFormData({ ...formData, tax_rate: e.target.value })}
                className="w-full px-4 py-3 border border-neutral-300 focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200 transition-all"
              />
            </div>
          </div>

          <div className="bg-neutral-50 border border-neutral-200 p-4 rounded-lg">
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
              <span className="text-gold-600">
                {totalAmount.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground/70 mb-2">
              Mode de paiement
            </label>
            <select
              value={formData.payment_method}
              onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
              className="w-full px-4 py-3 border border-neutral-300 focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200 transition-all"
            >
              <option value="">Non spécifié</option>
              <option value="cash">Comptant</option>
              <option value="credit_card">Carte de crédit</option>
              <option value="debit_card">Carte de débit</option>
              <option value="insurance">Assurance</option>
              <option value="cheque">Chèque</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground/70 mb-2">
              Notes internes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={2}
              className="w-full px-4 py-3 border border-neutral-300 focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200 transition-all resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-4 pt-4 border-t border-neutral-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-neutral-300 text-foreground hover:bg-neutral-50 transition-all"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 bg-gradient-to-r from-gold-500 to-gold-600 text-white hover:from-gold-600 hover:to-gold-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-soft hover:shadow-gold"
            >
              {saving ? 'Création...' : 'Créer la facture'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

function InvoiceDetailModal({
  invoice,
  onClose,
  onRefresh,
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
          paid_date: new Date().toISOString().split('T')[0],
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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-lifted"
      >
        <div className="sticky top-0 bg-white border-b border-neutral-200 p-6 flex items-center justify-between">
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
              <span className="text-gold-600">
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
