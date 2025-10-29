import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import {
  FileText, Plus, Search, Download, Eye, Send, CheckCircle,
  XCircle, Clock, Filter, Printer
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToastContext } from '../../contexts/ToastContext';
import type { InsuranceClaim, Patient } from '../../types/database';
import {
  exportInsuranceClaimsToCSV,
  printInsuranceClaimForm,
  exportClaimForProvider,
  generateBatchClaimsExport
} from '../../lib/exportUtils';

export function InsuranceClaimsManager() {
  const [claims, setClaims] = useState<InsuranceClaim[]>([]);
  const [patients, setPatients] = useState<Map<string, Patient>>(new Map());
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'submitted' | 'approved' | 'rejected' | 'paid'>('all');
  const [loading, setLoading] = useState(true);
  const [showNewClaimModal, setShowNewClaimModal] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState<InsuranceClaim | null>(null);
  const toast = useToastContext();

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [claimsRes, patientsRes] = await Promise.all([
        supabase.from('insurance_claims').select('*').order('created_at', { ascending: false }),
        supabase.from('patients_full').select('*')
      ]);

      if (claimsRes.error) throw claimsRes.error;
      if (patientsRes.error) throw patientsRes.error;

      setClaims(claimsRes.data || []);

      const patientMap = new Map<string, Patient>();
      (patientsRes.data || []).forEach(p => patientMap.set(p.id, p));
      setPatients(patientMap);
    } catch (error) {
      console.error('Error loading claims:', error);
      toast.error('Erreur lors du chargement des réclamations');
    } finally {
      setLoading(false);
    }
  }

  const filteredClaims = claims.filter((claim) => {
    const patient = patients.get(claim.patient_id);
    const patientName = patient ? `${patient.first_name} ${patient.last_name}` : '';

    const matchesSearch =
      claim.claim_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      claim.insurance_provider.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patientName.toLowerCase().includes(searchTerm.toLowerCase());

    if (filterStatus === 'all') return matchesSearch;
    return matchesSearch && claim.status === filterStatus;
  });

  const stats = {
    total: claims.length,
    pending: claims.filter(c => c.status === 'pending').length,
    submitted: claims.filter(c => c.status === 'submitted').length,
    approved: claims.filter(c => c.status === 'approved').length,
    totalAmount: claims.reduce((sum, c) => sum + c.claim_amount, 0),
    approvedAmount: claims
      .filter(c => c.approved_amount)
      .reduce((sum, c) => sum + (c.approved_amount || 0), 0)
  };

  function handleExportAll() {
    try {
      generateBatchClaimsExport(filteredClaims, patients, 'csv');
      toast.success(`${filteredClaims.length} réclamations exportées`);
    } catch (error) {
      toast.error('Erreur lors de l\'export');
    }
  }

  function handlePrintClaim(claim: InsuranceClaim) {
    const patient = patients.get(claim.patient_id);
    if (!patient) {
      toast.error('Patient introuvable');
      return;
    }

    try {
      printInsuranceClaimForm(claim, patient);
      toast.success('Formulaire généré');
    } catch (error) {
      toast.error('Erreur lors de la génération du formulaire');
    }
  }

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
          <h2 className="text-2xl font-heading text-foreground">Réclamations d'assurance</h2>
          <p className="text-sm text-foreground/60 mt-1">{claims.length} réclamations au total</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportAll}
            className="flex items-center gap-2 px-4 py-2 border border-neutral-300 rounded hover:bg-neutral-50 transition-colors"
          >
            <Download className="w-4 h-4" />
            Exporter
          </button>
          <button
            onClick={() => setShowNewClaimModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-gold-500 to-gold-600 text-white hover:from-gold-600 hover:to-gold-700 transition-all shadow-soft"
          >
            <Plus className="w-4 h-4" />
            Nouvelle réclamation
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <StatsCard title="Total" value={stats.total} icon={FileText} color="from-blue-500 to-blue-600" />
        <StatsCard title="En attente" value={stats.pending} icon={Clock} color="from-orange-500 to-orange-600" />
        <StatsCard title="Soumises" value={stats.submitted} icon={Send} color="from-neutral-500 to-neutral-600" />
        <StatsCard title="Approuvées" value={stats.approved} icon={CheckCircle} color="from-green-500 to-green-600" />
        <StatsCard
          title="Montant approuvé"
          value={stats.approvedAmount.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 })}
          icon={CheckCircle}
          color="from-gold-500 to-gold-600"
          isAmount
        />
      </div>

      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher par numéro, fournisseur ou patient..."
            className="w-full pl-12 pr-4 py-3 bg-white border border-neutral-200 rounded focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200"
          />
        </div>

        <div className="flex items-center gap-2 border border-neutral-300 rounded overflow-hidden">
          {(['all', 'pending', 'submitted', 'approved', 'rejected', 'paid'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-3 text-sm transition-colors ${
                filterStatus === status
                  ? 'bg-gradient-to-r from-gold-500 to-gold-600 text-white'
                  : 'bg-white text-foreground hover:bg-neutral-50'
              }`}
            >
              {status === 'all' && 'Toutes'}
              {status === 'pending' && 'En attente'}
              {status === 'submitted' && 'Soumises'}
              {status === 'approved' && 'Approuvées'}
              {status === 'rejected' && 'Rejetées'}
              {status === 'paid' && 'Payées'}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white border border-neutral-200 rounded shadow-soft-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-medium text-foreground/70">Numéro</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-foreground/70">Patient</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-foreground/70">Fournisseur</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-foreground/70">Date</th>
                <th className="text-right px-6 py-4 text-sm font-medium text-foreground/70">Montant</th>
                <th className="text-center px-6 py-4 text-sm font-medium text-foreground/70">Statut</th>
                <th className="text-right px-6 py-4 text-sm font-medium text-foreground/70">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {filteredClaims.map((claim) => {
                const patient = patients.get(claim.patient_id);
                return (
                  <tr key={claim.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-mono text-sm font-medium text-foreground">
                        {claim.claim_number}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-foreground/80">
                      {patient ? `${patient.first_name} ${patient.last_name}` : 'Unknown'}
                    </td>
                    <td className="px-6 py-4 text-sm text-foreground/80">
                      {claim.insurance_provider}
                    </td>
                    <td className="px-6 py-4 text-sm text-foreground/70">
                      {new Date(claim.service_date).toLocaleDateString('fr-CA')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-medium text-foreground">
                        {claim.claim_amount.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <StatusBadge status={claim.status} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedClaim(claim)}
                          className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                          title="Voir"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handlePrintClaim(claim)}
                          className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                          title="Imprimer"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filteredClaims.length === 0 && (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-foreground/20 mx-auto mb-3" />
              <p className="text-foreground/60">Aucune réclamation trouvée</p>
            </div>
          )}
        </div>
      </div>

      {showNewClaimModal && (
        <NewClaimModal
          patients={Array.from(patients.values())}
          onClose={() => setShowNewClaimModal(false)}
          onSuccess={() => {
            loadData();
            setShowNewClaimModal(false);
          }}
        />
      )}

      {selectedClaim && (
        <ClaimDetailModal
          claim={selectedClaim}
          patient={patients.get(selectedClaim.patient_id)}
          onClose={() => setSelectedClaim(null)}
          onRefresh={loadData}
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
  isAmount = false
}: {
  title: string;
  value: number | string;
  icon: any;
  color: string;
  isAmount?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-neutral-200 rounded-lg p-4 shadow-soft"
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
      <div className={`${isAmount ? 'text-2xl' : 'text-3xl'} font-light text-foreground mb-1`}>{value}</div>
      <div className="text-xs text-foreground/60">{title}</div>
    </motion.div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    pending: 'bg-orange-100 text-orange-700',
    submitted: 'bg-blue-100 text-blue-700',
    approved: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
    paid: 'bg-green-100 text-green-700'
  };

  const labels: Record<string, string> = {
    pending: 'En attente',
    submitted: 'Soumise',
    approved: 'Approuvée',
    rejected: 'Rejetée',
    paid: 'Payée'
  };

  return (
    <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${colors[status] || 'bg-neutral-100 text-neutral-700'}`}>
      {labels[status] || status}
    </span>
  );
}

function NewClaimModal({
  patients,
  onClose,
  onSuccess
}: {
  patients: Patient[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    patient_id: '',
    insurance_provider: '',
    policy_number: '',
    service_date: new Date().toISOString().split('T')[0],
    claim_amount: '',
    diagnostic_codes: '',
    procedure_codes: ''
  });
  const [saving, setSaving] = useState(false);
  const toast = useToastContext();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const claimNumber = `CLM-${Date.now()}`;

      const { error } = await supabase.from('insurance_claims').insert({
        patient_id: formData.patient_id,
        claim_number: claimNumber,
        insurance_provider: formData.insurance_provider,
        policy_number: formData.policy_number || null,
        service_date: formData.service_date,
        claim_amount: parseFloat(formData.claim_amount),
        diagnostic_codes: formData.diagnostic_codes.split(',').map(s => s.trim()).filter(Boolean),
        procedure_codes: formData.procedure_codes.split(',').map(s => s.trim()).filter(Boolean),
        status: 'pending',
        submitted_by: user.id
      });

      if (error) throw error;

      toast.success('Réclamation créée avec succès');
      onSuccess();
    } catch (error: any) {
      console.error('Error creating claim:', error);
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
        className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg shadow-lifted"
      >
        <div className="sticky top-0 bg-gradient-to-r from-gold-500 to-gold-600 p-6">
          <h3 className="text-2xl font-heading text-white">Nouvelle réclamation</h3>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-foreground/70 mb-2">
              Patient <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={formData.patient_id}
              onChange={(e) => setFormData({ ...formData, patient_id: e.target.value })}
              className="w-full px-4 py-3 border border-neutral-300 rounded focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200"
            >
              <option value="">Sélectionner un patient...</option>
              {patients.map((patient) => (
                <option key={patient.id} value={patient.id}>
                  {patient.first_name} {patient.last_name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-foreground/70 mb-2">
                Fournisseur d'assurance <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.insurance_provider}
                onChange={(e) => setFormData({ ...formData, insurance_provider: e.target.value })}
                className="w-full px-4 py-3 border border-neutral-300 rounded focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200"
                placeholder="Ex: Sunlife, Manulife"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground/70 mb-2">
                Numéro de police
              </label>
              <input
                type="text"
                value={formData.policy_number}
                onChange={(e) => setFormData({ ...formData, policy_number: e.target.value })}
                className="w-full px-4 py-3 border border-neutral-300 rounded focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-foreground/70 mb-2">
                Date de service <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={formData.service_date}
                onChange={(e) => setFormData({ ...formData, service_date: e.target.value })}
                className="w-full px-4 py-3 border border-neutral-300 rounded focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground/70 mb-2">
                Montant <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={formData.claim_amount}
                onChange={(e) => setFormData({ ...formData, claim_amount: e.target.value })}
                className="w-full px-4 py-3 border border-neutral-300 rounded focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200"
                placeholder="0.00"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground/70 mb-2">
              Codes diagnostiques (séparés par des virgules)
            </label>
            <input
              type="text"
              value={formData.diagnostic_codes}
              onChange={(e) => setFormData({ ...formData, diagnostic_codes: e.target.value })}
              className="w-full px-4 py-3 border border-neutral-300 rounded focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200"
              placeholder="Ex: M54.5, M99.23"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground/70 mb-2">
              Codes de procédure (séparés par des virgules)
            </label>
            <input
              type="text"
              value={formData.procedure_codes}
              onChange={(e) => setFormData({ ...formData, procedure_codes: e.target.value })}
              className="w-full px-4 py-3 border border-neutral-300 rounded focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200"
              placeholder="Ex: 98940, 98941"
            />
          </div>

          <div className="flex items-center justify-end gap-4 pt-4 border-t border-neutral-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-neutral-300 text-foreground rounded hover:bg-neutral-50 transition-all"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 bg-gradient-to-r from-gold-500 to-gold-600 text-white rounded hover:from-gold-600 hover:to-gold-700 disabled:opacity-50 transition-all shadow-soft"
            >
              {saving ? 'Création...' : 'Créer la réclamation'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

function ClaimDetailModal({
  claim,
  patient,
  onClose,
  onRefresh
}: {
  claim: InsuranceClaim;
  patient: Patient | undefined;
  onClose: () => void;
  onRefresh: () => void;
}) {
  const toast = useToastContext();

  async function handleUpdateStatus(newStatus: string) {
    try {
      const { error } = await supabase
        .from('insurance_claims')
        .update({ status: newStatus })
        .eq('id', claim.id);

      if (error) throw error;

      toast.success('Statut mis à jour');
      onRefresh();
      onClose();
    } catch (error) {
      console.error('Error updating claim:', error);
      toast.error('Erreur lors de la mise à jour');
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg shadow-lifted"
      >
        <div className="sticky top-0 bg-gradient-to-r from-gold-500 to-gold-600 p-6">
          <h3 className="text-2xl font-heading text-white">Réclamation {claim.claim_number}</h3>
          {patient && (
            <p className="text-white/80 mt-1">{patient.first_name} {patient.last_name}</p>
          )}
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <div className="text-sm text-foreground/60 mb-1">Fournisseur</div>
              <div className="text-foreground font-medium">{claim.insurance_provider}</div>
            </div>
            <div>
              <div className="text-sm text-foreground/60 mb-1">Numéro de police</div>
              <div className="text-foreground font-medium">{claim.policy_number || 'N/A'}</div>
            </div>
            <div>
              <div className="text-sm text-foreground/60 mb-1">Date de service</div>
              <div className="text-foreground font-medium">
                {new Date(claim.service_date).toLocaleDateString('fr-CA')}
              </div>
            </div>
            <div>
              <div className="text-sm text-foreground/60 mb-1">Statut</div>
              <StatusBadge status={claim.status} />
            </div>
          </div>

          <div className="bg-neutral-50 border border-neutral-200 p-6 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <span className="text-foreground/70">Montant réclamé:</span>
              <span className="text-2xl font-light text-foreground">
                {claim.claim_amount.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}
              </span>
            </div>
            {claim.approved_amount && (
              <div className="flex items-center justify-between pt-3 border-t border-neutral-300">
                <span className="text-foreground/70">Montant approuvé:</span>
                <span className="text-2xl font-semibold text-green-600">
                  {claim.approved_amount.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}
                </span>
              </div>
            )}
          </div>

          {claim.status === 'pending' && (
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleUpdateStatus('submitted')}
                className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded hover:from-blue-600 hover:to-blue-700 transition-all"
              >
                Marquer comme soumise
              </button>
            </div>
          )}

          {claim.status === 'submitted' && (
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleUpdateStatus('approved')}
                className="flex-1 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded hover:from-green-600 hover:to-green-700 transition-all"
              >
                Approuver
              </button>
              <button
                onClick={() => handleUpdateStatus('rejected')}
                className="flex-1 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded hover:from-red-600 hover:to-red-700 transition-all"
              >
                Rejeter
              </button>
            </div>
          )}

          <button
            onClick={onClose}
            className="w-full py-3 border border-neutral-300 text-foreground rounded hover:bg-neutral-50 transition-all"
          >
            Fermer
          </button>
        </div>
      </motion.div>
    </div>
  );
}
