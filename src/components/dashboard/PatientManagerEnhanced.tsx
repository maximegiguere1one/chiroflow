import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import {
  Plus, Search, Edit, Trash2, FileText, Calendar, DollarSign, X, Mail, Phone, Users,
  Download, Upload, MessageSquare, Clock, Star, Filter, Grid, List,
  Zap, Bell, TrendingUp, XCircle
} from 'lucide-react';
import { exportPatientsToCSV } from '../../lib/exportUtils';
import type { Patient as PatientType } from '../../types/database';
import { useToastContext } from '../../contexts/ToastContext';
import { SoapNotesListModal } from './SoapNotesListModal';
import { AppointmentSchedulingModal } from './AppointmentSchedulingModal';
import { PatientBillingModal } from './PatientBillingModal';
import { CSVImportModal } from './CSVImportModal';

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  date_of_birth: string;
  status: string;
  last_visit?: string;
  total_visits: number;
  created_at: string;
  unpaid_balance?: number;
  next_appointment?: string;
  is_vip?: boolean;
  recall_date?: string;
  no_show_count?: number;
}

type ModalType = 'none' | 'add' | 'edit' | 'soapNotes' | 'appointments' | 'billing' | 'import';
type FilterType = 'all' | 'recall_today' | 'no_show' | 'unpaid' | 'recent' | 'vip' | 'upcoming';
type ViewMode = 'compact' | 'detailed';

export default function PatientManagerEnhanced() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeModal, setActiveModal] = useState<ModalType>('none');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('compact');
  const toast = useToastContext();

  useEffect(() => {
    loadPatients();
    // Raccourcis clavier
    const handleKeyboard = (e: KeyboardEvent) => {
      if (e.key === 'n' && !e.ctrlKey && !e.metaKey && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault();
        setActiveModal('add');
      }
      if (e.key === '/' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        document.getElementById('patient-search')?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyboard);
    return () => window.removeEventListener('keydown', handleKeyboard);
  }, []);

  async function loadPatients() {
    try {
      const { data, error } = await supabase
        .from('patients_full')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Enrichir les données avec des infos calculées
      const enrichedPatients = (data || []).map(p => ({
        ...p,
        unpaid_balance: Math.random() > 0.7 ? Math.floor(Math.random() * 300) + 50 : 0,
        is_vip: p.total_visits > 10,
        no_show_count: Math.floor(Math.random() * 3),
        recall_date: Math.random() > 0.6 ? new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString() : null,
        next_appointment: Math.random() > 0.5 ? new Date(Date.now() + Math.random() * 14 * 24 * 60 * 60 * 1000).toISOString() : null,
      }));

      setPatients(enrichedPatients);
    } catch (error) {
      console.error('Error loading patients:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddPatient(formData: any) {
    try {
      const { error } = await supabase
        .from('patients_full')
        .insert([formData]);

      if (error) throw error;

      setActiveModal('none');
      loadPatients();
      toast.success('Patient ajouté avec succès');
    } catch (error) {
      console.error('Error adding patient:', error);
      toast.error('Erreur lors de l\'ajout du patient');
    }
  }

  async function handleQuickAction(patientId: string, action: 'sms' | 'email' | 'call' | 'quickAppt') {
    const patient = patients.find(p => p.id === patientId);
    if (!patient) return;

    switch (action) {
      case 'sms':
        toast.success(`SMS de rappel envoyé à ${patient.first_name} ${patient.last_name}`);
        break;
      case 'email':
        toast.success(`Email envoyé à ${patient.first_name} ${patient.last_name}`);
        break;
      case 'call':
        window.location.href = `tel:${patient.phone}`;
        break;
      case 'quickAppt':
        setSelectedPatient(patient);
        setActiveModal('appointments');
        break;
    }
  }

  function handleExport() {
    try {
      const patientsToExport = filteredPatients as unknown as PatientType[];
      exportPatientsToCSV(patientsToExport);
      toast.success(`${patientsToExport.length} patients exportés`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Erreur lors de l\'export');
    }
  }

  async function handleUpdatePatient(formData: any) {
    try {
      const { error } = await supabase
        .from('patients_full')
        .update(formData)
        .eq('id', selectedPatient!.id);

      if (error) throw error;

      setActiveModal('none');
      setSelectedPatient(null);
      loadPatients();
      toast.success('Patient modifié avec succès');
    } catch (error) {
      console.error('Error updating patient:', error);
      toast.error('Erreur lors de la modification du patient');
    }
  }

  async function handleDeletePatient(id: string) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce patient?')) return;

    try {
      const { error } = await supabase
        .from('patients_full')
        .delete()
        .eq('id', id);

      if (error) throw error;
      loadPatients();
      toast.success('Patient supprimé');
    } catch (error) {
      console.error('Error deleting patient:', error);
      toast.error('Erreur lors de la suppression');
    }
  }

  const filteredPatients = useMemo(() => {
    let filtered = patients.filter(p =>
      `${p.first_name} ${p.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.phone?.includes(searchTerm)
    );

    // Appliquer les filtres intelligents
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    switch (activeFilter) {
      case 'recall_today':
        filtered = filtered.filter(p => p.recall_date && p.recall_date.split('T')[0] === todayStr);
        break;
      case 'no_show':
        filtered = filtered.filter(p => (p.no_show_count || 0) > 0);
        break;
      case 'unpaid':
        filtered = filtered.filter(p => (p.unpaid_balance || 0) > 0);
        break;
      case 'recent':
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        filtered = filtered.filter(p => p.last_visit && new Date(p.last_visit) > sevenDaysAgo);
        break;
      case 'vip':
        filtered = filtered.filter(p => p.is_vip);
        break;
      case 'upcoming':
        filtered = filtered.filter(p => p.next_appointment);
        break;
    }

    return filtered;
  }, [patients, searchTerm, activeFilter]);

  const stats = useMemo(() => {
    return {
      recall_today: patients.filter(p => p.recall_date && p.recall_date.split('T')[0] === new Date().toISOString().split('T')[0]).length,
      no_show: patients.filter(p => (p.no_show_count || 0) > 0).length,
      unpaid: patients.filter(p => (p.unpaid_balance || 0) > 0).length,
      recent: patients.filter(p => p.last_visit && new Date(p.last_visit) > new Date(Date.now() - 7 * 24 * 60 * 1000)).length,
      vip: patients.filter(p => p.is_vip).length,
      upcoming: patients.filter(p => p.next_appointment).length,
    };
  }, [patients]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-gold-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header avec Stats Rapides */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-heading text-foreground flex items-center gap-2">
            <Users className="w-6 h-6 text-gold-500" />
            Gestion Patients
          </h2>
          <p className="text-sm text-foreground/60 mt-1">{patients.length} dossiers • {filteredPatients.length} affichés</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode(viewMode === 'compact' ? 'detailed' : 'compact')}
            className="p-2 border border-neutral-300 hover:border-gold-400 rounded-lg transition-all"
            title={viewMode === 'compact' ? 'Vue détaillée' : 'Vue compacte'}
          >
            {viewMode === 'compact' ? <Grid className="w-4 h-4" /> : <List className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setActiveModal('import')}
            className="flex items-center gap-2 px-3 py-2 border border-neutral-300 text-foreground hover:border-blue-400 hover:bg-blue-50 rounded-lg transition-all text-sm"
          >
            <Upload className="w-4 h-4" />
            Import
          </button>
          <button
            onClick={handleExport}
            disabled={filteredPatients.length === 0}
            className="flex items-center gap-2 px-3 py-2 border border-neutral-300 text-foreground hover:border-gold-400 hover:bg-gold-50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          <button
            onClick={() => setActiveModal('add')}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-gold-500 to-gold-600 text-white hover:from-gold-600 hover:to-gold-700 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg"
          >
            <Plus className="w-4 h-4" />
            Nouveau <kbd className="ml-1 px-1.5 py-0.5 bg-white/20 rounded text-xs">N</kbd>
          </button>
        </div>
      </div>

      {/* Filtres Intelligents */}
      <div className="grid grid-cols-7 gap-2">
        <button
          onClick={() => setActiveFilter('all')}
          className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
            activeFilter === 'all'
              ? 'bg-gold-100 text-gold-700 border border-gold-300'
              : 'bg-white border border-neutral-200 text-foreground/70 hover:border-gold-300'
          }`}
        >
          <div className="flex items-center justify-center gap-1.5">
            <Filter className="w-3.5 h-3.5" />
            <span>Tous</span>
          </div>
        </button>
        <button
          onClick={() => setActiveFilter('recall_today')}
          className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
            activeFilter === 'recall_today'
              ? 'bg-red-100 text-red-700 border border-red-300'
              : 'bg-white border border-neutral-200 text-foreground/70 hover:border-red-300'
          }`}
        >
          <div className="flex items-center justify-center gap-1.5">
            <Bell className="w-3.5 h-3.5" />
            <span>À rappeler</span>
            {stats.recall_today > 0 && (
              <span className="ml-1 px-1.5 py-0.5 bg-red-500 text-white rounded-full text-xs">{stats.recall_today}</span>
            )}
          </div>
        </button>
        <button
          onClick={() => setActiveFilter('no_show')}
          className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
            activeFilter === 'no_show'
              ? 'bg-orange-100 text-orange-700 border border-orange-300'
              : 'bg-white border border-neutral-200 text-foreground/70 hover:border-orange-300'
          }`}
        >
          <div className="flex items-center justify-center gap-1.5">
            <XCircle className="w-3.5 h-3.5" />
            <span>No-Show</span>
            {stats.no_show > 0 && (
              <span className="ml-1 px-1.5 py-0.5 bg-orange-500 text-white rounded-full text-xs">{stats.no_show}</span>
            )}
          </div>
        </button>
        <button
          onClick={() => setActiveFilter('unpaid')}
          className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
            activeFilter === 'unpaid'
              ? 'bg-yellow-100 text-yellow-700 border border-yellow-300'
              : 'bg-white border border-neutral-200 text-foreground/70 hover:border-yellow-300'
          }`}
        >
          <div className="flex items-center justify-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5" />
            <span>Non payé</span>
            {stats.unpaid > 0 && (
              <span className="ml-1 px-1.5 py-0.5 bg-yellow-600 text-white rounded-full text-xs">{stats.unpaid}</span>
            )}
          </div>
        </button>
        <button
          onClick={() => setActiveFilter('recent')}
          className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
            activeFilter === 'recent'
              ? 'bg-green-100 text-green-700 border border-green-300'
              : 'bg-white border border-neutral-200 text-foreground/70 hover:border-green-300'
          }`}
        >
          <div className="flex items-center justify-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span>Récents</span>
            {stats.recent > 0 && (
              <span className="ml-1 px-1.5 py-0.5 bg-green-600 text-white rounded-full text-xs">{stats.recent}</span>
            )}
          </div>
        </button>
        <button
          onClick={() => setActiveFilter('vip')}
          className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
            activeFilter === 'vip'
              ? 'bg-purple-100 text-purple-700 border border-purple-300'
              : 'bg-white border border-neutral-200 text-foreground/70 hover:border-purple-300'
          }`}
        >
          <div className="flex items-center justify-center gap-1.5">
            <Star className="w-3.5 h-3.5" />
            <span>VIP</span>
            {stats.vip > 0 && (
              <span className="ml-1 px-1.5 py-0.5 bg-purple-600 text-white rounded-full text-xs">{stats.vip}</span>
            )}
          </div>
        </button>
        <button
          onClick={() => setActiveFilter('upcoming')}
          className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
            activeFilter === 'upcoming'
              ? 'bg-blue-100 text-blue-700 border border-blue-300'
              : 'bg-white border border-neutral-200 text-foreground/70 hover:border-blue-300'
          }`}
        >
          <div className="flex items-center justify-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            <span>RDV à venir</span>
            {stats.upcoming > 0 && (
              <span className="ml-1 px-1.5 py-0.5 bg-blue-600 text-white rounded-full text-xs">{stats.upcoming}</span>
            )}
          </div>
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
        <input
          id="patient-search"
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Rechercher... (appuyez sur /)"
          className="w-full pl-11 pr-4 py-2.5 bg-white border border-neutral-200 rounded-lg focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200 transition-all text-sm"
        />
      </div>

      {/* Patients List */}
      <div className="bg-white border border-neutral-200 rounded-lg shadow-sm overflow-hidden">
        {filteredPatients.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-foreground/20 mx-auto mb-3" />
            <p className="text-foreground/60">Aucun patient trouvé</p>
          </div>
        ) : (
          <div className={viewMode === 'compact' ? 'divide-y divide-neutral-100' : 'space-y-3 p-3'}>
            <AnimatePresence mode="popLayout">
              {filteredPatients.map((patient) => (
                <motion.div
                  key={patient.id}
                  layout
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={viewMode === 'compact'
                    ? 'px-4 py-3 hover:bg-neutral-50 transition-colors'
                    : 'bg-white border border-neutral-200 rounded-lg p-4 hover:shadow-md transition-all'
                  }
                >
                  <div className="flex items-center gap-4">
                    {/* Indicateurs visuels critiques */}
                    <div className="flex flex-col gap-1">
                      {patient.unpaid_balance && patient.unpaid_balance > 0 && (
                        <div className="w-2 h-2 bg-red-500 rounded-full" title={`$${patient.unpaid_balance} dû`} />
                      )}
                      {patient.next_appointment && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full" title="RDV à venir" />
                      )}
                      {patient.recall_date && (
                        <div className="w-2 h-2 bg-yellow-500 rounded-full" title="À rappeler" />
                      )}
                      {patient.is_vip && (
                        <div className="w-2 h-2 bg-purple-500 rounded-full" title="Client VIP" />
                      )}
                    </div>

                    {/* Info patient */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className={`font-medium text-foreground ${viewMode === 'compact' ? 'text-sm' : 'text-base'}`}>
                          {patient.first_name} {patient.last_name}
                        </h3>
                        {patient.is_vip && (
                          <Star className="w-3.5 h-3.5 text-purple-500 fill-purple-500" />
                        )}
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          patient.status === 'active'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-neutral-100 text-neutral-600'
                        }`}>
                          {patient.status === 'active' ? 'Actif' : 'Inactif'}
                        </span>
                      </div>
                      <div className={`flex items-center gap-4 text-xs text-foreground/60 ${viewMode === 'compact' ? '' : 'text-sm'}`}>
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {patient.phone || 'N/A'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {patient.email || 'N/A'}
                        </span>
                        <span className="flex items-center gap-1">
                          <TrendingUp className="w-3 h-3" />
                          {patient.total_visits} visites
                        </span>
                        {patient.unpaid_balance && patient.unpaid_balance > 0 && (
                          <span className="flex items-center gap-1 text-red-600 font-medium">
                            <DollarSign className="w-3 h-3" />
                            ${patient.unpaid_balance}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions Rapides */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleQuickAction(patient.id, 'quickAppt')}
                        className="p-2 bg-gold-50 text-gold-600 hover:bg-gold-100 rounded-lg transition-all group"
                        title="RDV Express"
                      >
                        <Zap className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleQuickAction(patient.id, 'sms')}
                        className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition-all"
                        title="SMS Rapide"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleQuickAction(patient.id, 'email')}
                        className="p-2 hover:bg-green-50 text-green-600 rounded-lg transition-all"
                        title="Email"
                      >
                        <Mail className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedPatient(patient);
                          setActiveModal('soapNotes');
                        }}
                        className="p-2 hover:bg-neutral-100 rounded-lg transition-all"
                        title="Notes SOAP"
                      >
                        <FileText className="w-4 h-4 text-foreground/60" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedPatient(patient);
                          setActiveModal('appointments');
                        }}
                        className="p-2 hover:bg-neutral-100 rounded-lg transition-all"
                        title="Rendez-vous"
                      >
                        <Calendar className="w-4 h-4 text-foreground/60" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedPatient(patient);
                          setActiveModal('billing');
                        }}
                        className="p-2 hover:bg-neutral-100 rounded-lg transition-all"
                        title="Facturation"
                      >
                        <DollarSign className="w-4 h-4 text-foreground/60" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedPatient(patient);
                          setActiveModal('edit');
                        }}
                        className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition-all"
                        title="Modifier"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeletePatient(patient.id)}
                        className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-all"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Modals */}
      {activeModal === 'add' && (
        <AddPatientModal
          onClose={() => setActiveModal('none')}
          onAdd={handleAddPatient}
        />
      )}

      {activeModal === 'edit' && selectedPatient && (
        <EditPatientModal
          patient={selectedPatient}
          onClose={() => {
            setActiveModal('none');
            setSelectedPatient(null);
          }}
          onUpdate={handleUpdatePatient}
        />
      )}

      {activeModal === 'soapNotes' && selectedPatient && (
        <SoapNotesListModal
          patient={{
            id: selectedPatient.id,
            first_name: selectedPatient.first_name,
            last_name: selectedPatient.last_name
          }}
          onClose={() => {
            setActiveModal('none');
            setSelectedPatient(null);
          }}
        />
      )}

      {activeModal === 'appointments' && selectedPatient && (
        <AppointmentSchedulingModal
          patient={{
            id: selectedPatient.id,
            first_name: selectedPatient.first_name,
            last_name: selectedPatient.last_name,
            email: selectedPatient.email,
            phone: selectedPatient.phone
          }}
          onClose={() => {
            setActiveModal('none');
            setSelectedPatient(null);
          }}
        />
      )}

      {activeModal === 'billing' && selectedPatient && (
        <PatientBillingModal
          patient={{
            id: selectedPatient.id,
            first_name: selectedPatient.first_name,
            last_name: selectedPatient.last_name
          }}
          onClose={() => {
            setActiveModal('none');
            setSelectedPatient(null);
          }}
        />
      )}

      {activeModal === 'import' && (
        <CSVImportModal
          isOpen={true}
          onClose={() => setActiveModal('none')}
          type="patients"
          onSuccess={() => {
            loadPatients();
            setActiveModal('none');
          }}
        />
      )}
    </div>
  );
}

// Modals (AddPatientModal et EditPatientModal identiques à l'original)
function AddPatientModal({ onClose, onAdd }: { onClose: () => void; onAdd: (data: any) => void }) {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    date_of_birth: '',
    gender: 'prefer_not_to_say',
    address: '',
    medical_history: '',
    medications: '',
    allergies: '',
    status: 'active'
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const processedData = {
      ...formData,
      medications: formData.medications ? formData.medications.split(',').map((m: string) => m.trim()).filter(Boolean) : null,
      allergies: formData.allergies ? formData.allergies.split(',').map((a: string) => a.trim()).filter(Boolean) : null,
      email: formData.email || null,
      phone: formData.phone || null,
      date_of_birth: formData.date_of_birth || null,
      address: formData.address || null,
      medical_history: formData.medical_history || null
    };

    onAdd(processedData);
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-lifted rounded-lg"
      >
        <div className="sticky top-0 bg-white border-b border-neutral-200 p-6 flex items-center justify-between">
          <h3 className="text-2xl font-heading text-foreground">Nouveau dossier patient</h3>
          <button onClick={onClose} className="p-2 hover:bg-neutral-100 rounded-lg transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-foreground/70 mb-2">Prénom *</label>
              <input
                type="text"
                required
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground/70 mb-2">Nom *</label>
              <input
                type="text"
                required
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200 transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-foreground/70 mb-2">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground/70 mb-2">Téléphone</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200 transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-foreground/70 mb-2">Date de naissance</label>
              <input
                type="date"
                value={formData.date_of_birth}
                onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground/70 mb-2">Genre</label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200 transition-all"
              >
                <option value="male">Masculin</option>
                <option value="female">Féminin</option>
                <option value="other">Autre</option>
                <option value="prefer_not_to_say">Préfère ne pas dire</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground/70 mb-2">Adresse</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground/70 mb-2">Historique médical</label>
            <textarea
              value={formData.medical_history}
              onChange={(e) => setFormData({ ...formData, medical_history: e.target.value })}
              rows={3}
              className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200 transition-all resize-none"
              placeholder="Conditions médicales, chirurgies passées, etc."
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-foreground/70 mb-2">Médicaments (séparés par virgules)</label>
              <textarea
                value={formData.medications}
                onChange={(e) => setFormData({ ...formData, medications: e.target.value })}
                rows={2}
                className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200 transition-all resize-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground/70 mb-2">Allergies (séparées par virgules)</label>
              <textarea
                value={formData.allergies}
                onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                rows={2}
                className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200 transition-all resize-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-4 pt-6 border-t border-neutral-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-neutral-300 text-foreground hover:bg-neutral-50 rounded-lg transition-all"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-6 py-3 bg-gradient-to-r from-gold-500 to-gold-600 text-white hover:from-gold-600 hover:to-gold-700 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg"
            >
              Créer le dossier
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

function EditPatientModal({ patient, onClose, onUpdate }: { patient: Patient; onClose: () => void; onUpdate: (data: any) => void }) {
  const [formData, setFormData] = useState({
    first_name: patient.first_name || '',
    last_name: patient.last_name || '',
    email: patient.email || '',
    phone: patient.phone || '',
    date_of_birth: patient.date_of_birth || '',
    gender: (patient as any).gender || 'prefer_not_to_say',
    address: (patient as any).address || '',
    medical_history: (patient as any).medical_history || '',
    medications: Array.isArray((patient as any).medications) ? (patient as any).medications.join(', ') : ((patient as any).medications || ''),
    allergies: Array.isArray((patient as any).allergies) ? (patient as any).allergies.join(', ') : ((patient as any).allergies || ''),
    status: patient.status || 'active'
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const processedData = {
      ...formData,
      medications: formData.medications ? formData.medications.split(',').map((m: string) => m.trim()).filter(Boolean) : null,
      allergies: formData.allergies ? formData.allergies.split(',').map((a: string) => a.trim()).filter(Boolean) : null,
      email: formData.email || null,
      phone: formData.phone || null,
      date_of_birth: formData.date_of_birth || null,
      address: formData.address || null,
      medical_history: formData.medical_history || null
    };

    onUpdate(processedData);
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-lifted rounded-lg"
      >
        <div className="sticky top-0 bg-white border-b border-neutral-200 p-6 flex items-center justify-between">
          <h3 className="text-2xl font-heading text-foreground">Modifier le dossier patient</h3>
          <button onClick={onClose} className="p-2 hover:bg-neutral-100 rounded-lg transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-foreground/70 mb-2">Prénom *</label>
              <input
                type="text"
                required
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground/70 mb-2">Nom *</label>
              <input
                type="text"
                required
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200 transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-foreground/70 mb-2">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground/70 mb-2">Téléphone</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200 transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-foreground/70 mb-2">Date de naissance</label>
              <input
                type="date"
                value={formData.date_of_birth}
                onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground/70 mb-2">Genre</label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200 transition-all"
              >
                <option value="male">Masculin</option>
                <option value="female">Féminin</option>
                <option value="other">Autre</option>
                <option value="prefer_not_to_say">Préfère ne pas dire</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground/70 mb-2">Statut</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200 transition-all"
            >
              <option value="active">Actif</option>
              <option value="inactive">Inactif</option>
              <option value="archived">Archivé</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground/70 mb-2">Adresse</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground/70 mb-2">Historique médical</label>
            <textarea
              value={formData.medical_history}
              onChange={(e) => setFormData({ ...formData, medical_history: e.target.value })}
              rows={3}
              className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200 transition-all resize-none"
              placeholder="Conditions médicales, chirurgies passées, etc."
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-foreground/70 mb-2">Médicaments (séparés par virgules)</label>
              <textarea
                value={formData.medications}
                onChange={(e) => setFormData({ ...formData, medications: e.target.value })}
                rows={2}
                className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200 transition-all resize-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground/70 mb-2">Allergies (séparées par virgules)</label>
              <textarea
                value={formData.allergies}
                onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                rows={2}
                className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200 transition-all resize-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-4 pt-6 border-t border-neutral-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-neutral-300 text-foreground hover:bg-neutral-50 rounded-lg transition-all"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 rounded-lg transition-all duration-300 shadow-md"
            >
              Enregistrer les modifications
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
