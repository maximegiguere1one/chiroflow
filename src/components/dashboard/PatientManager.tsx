import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, Search, CreditCard as Edit, Trash2, FileText, Calendar, DollarSign, X, Mail, Phone, Users, Download, Upload, HelpCircle } from 'lucide-react';
import { exportPatientsToCSV } from '../../lib/exportUtils';
import type { Patient as PatientType } from '../../types/database';
import { useToastContext } from '../../contexts/ToastContext';
import { SoapNotesListModal } from './SoapNotesListModal';
import { AppointmentSchedulingModal } from './AppointmentSchedulingModal';
import { PatientBillingModal } from './PatientBillingModal';
import { CSVImportModal } from './CSVImportModal';
import { EmptyState } from '../common/EmptyState';
import { ConfirmModal } from '../common/ConfirmModal';
import { Tooltip } from '../common/Tooltip';
import { Confetti, useConfetti } from '../common/Confetti';
import { ShortcutsHelp } from '../common/ShortcutsHelp';
import { useKeyboardShortcuts, COMMON_SHORTCUTS, type KeyboardShortcut } from '../../hooks/useKeyboardShortcuts';
import { TableSkeleton } from '../common/LoadingSkeleton';
import { buttonHover, buttonTap } from '../../lib/animations';

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
}

type ModalType = 'none' | 'add' | 'edit' | 'soapNotes' | 'appointments' | 'billing' | 'import';

export default function PatientManager() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeModal, setActiveModal] = useState<ModalType>('none');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [patientToDelete, setPatientToDelete] = useState<Patient | null>(null);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const { showConfetti, triggerConfetti } = useConfetti();
  const toast = useToastContext();

  useEffect(() => {
    loadPatients();
  }, []);

  const shortcuts: KeyboardShortcut[] = [
    { ...COMMON_SHORTCUTS.NEW_PATIENT, action: () => setActiveModal('add') },
    { ...COMMON_SHORTCUTS.SEARCH, action: () => document.querySelector('input[type="text"]')?.focus() },
    { ...COMMON_SHORTCUTS.EXPORT, action: handleExport },
    { ...COMMON_SHORTCUTS.IMPORT, action: () => setActiveModal('import') },
    { ...COMMON_SHORTCUTS.HELP, action: () => setShowShortcuts(true) },
    { ...COMMON_SHORTCUTS.CANCEL, action: () => setActiveModal('none') }
  ];

  useKeyboardShortcuts(shortcuts);

  async function loadPatients() {
    try {
      const { data, error } = await supabase
        .from('patients_full')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPatients(data || []);
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
      await loadPatients();
      const fullName = `${formData.first_name} ${formData.last_name}`;
      triggerConfetti();
      toast.success(`✓ ${fullName} ajouté!`, 'Le dossier patient est prêt. Voulez-vous planifier le premier rendez-vous?');
    } catch (error) {
      console.error('Error adding patient:', error);
      const message = (error as any)?.message || '';
      if (message.includes('duplicate') || message.includes('unique')) {
        toast.error(
          'Patient déjà existant',
          'Un patient avec ces informations existe déjà. Vérifiez l\'email ou le téléphone.'
        );
      } else {
        toast.error(
          'Impossible d\'ajouter le patient',
          'Vérifiez que tous les champs requis sont remplis correctement.'
        );
      }
    }
  }

  function handleExport() {
    try {
      const patientsToExport = filteredPatients as unknown as PatientType[];
      exportPatientsToCSV(patientsToExport);
      toast.success(
        `✓ ${patientsToExport.length} patients exportés`,
        'Le fichier CSV a été téléchargé dans votre dossier de téléchargements.'
      );
    } catch (error) {
      console.error('Export error:', error);
      toast.error(
        'Impossible d\'exporter les patients',
        'Vérifiez que vous avez des patients dans votre liste et réessayez.'
      );
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
      await loadPatients();
      const fullName = `${formData.first_name} ${formData.last_name}`;
      toast.success(
        `✓ Dossier de ${fullName} mis à jour`,
        'Les modifications ont été enregistrées.'
      );
    } catch (error) {
      console.error('Error updating patient:', error);
      toast.error(
        'Impossible de modifier le patient',
        'Vérifiez les informations et réessayez.'
      );
    }
  }

  function openDeleteModal(patient: Patient) {
    setPatientToDelete(patient);
    setDeleteModalOpen(true);
  }

  async function handleDeletePatient() {
    if (!patientToDelete) return;

    try {
      const { error } = await supabase
        .from('patients_full')
        .delete()
        .eq('id', patientToDelete.id);

      if (error) throw error;
      await loadPatients();
      const fullName = `${patientToDelete.first_name} ${patientToDelete.last_name}`;
      toast.success(
        `✓ ${fullName} supprimé`,
        'Le dossier patient a été supprimé définitivement.'
      );
    } catch (error) {
      console.error('Error deleting patient:', error);
      toast.error(
        'Impossible de supprimer le patient',
        'Ce patient a peut-être des rendez-vous actifs. Annulez-les d\'abord.'
      );
    } finally {
      setDeleteModalOpen(false);
      setPatientToDelete(null);
    }
  }

  const filteredPatients = patients.filter(p =>
    `${p.first_name} ${p.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.phone?.includes(searchTerm)
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="h-8 w-32 bg-neutral-200 rounded animate-pulse mb-2" />
            <div className="h-4 w-48 bg-neutral-200 rounded animate-pulse" />
          </div>
          <div className="flex gap-3">
            <div className="h-12 w-32 bg-neutral-200 rounded animate-pulse" />
            <div className="h-12 w-32 bg-neutral-200 rounded animate-pulse" />
            <div className="h-12 w-40 bg-neutral-200 rounded animate-pulse" />
          </div>
        </div>
        <TableSkeleton rows={5} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-heading text-foreground">Patients</h2>
          <p className="text-sm text-foreground/60 mt-1">{patients.length} dossiers au total</p>
        </div>
        <div className="flex items-center gap-3">
          <Tooltip content="Aide raccourcis clavier" shortcut="?" placement="bottom">
            <motion.button
              onClick={() => setShowShortcuts(true)}
              className="p-3 border border-neutral-300 text-foreground hover:border-blue-400 hover:bg-blue-50 rounded-lg transition-all"
              whileHover={buttonHover}
              whileTap={buttonTap}
            >
              <HelpCircle className="w-5 h-5" />
            </motion.button>
          </Tooltip>

          <Tooltip content="Importer des patients depuis un fichier CSV" shortcut="Ctrl+I" placement="bottom">
            <motion.button
              onClick={() => setActiveModal('import')}
              className="flex items-center gap-2 px-4 py-3 border border-neutral-300 text-foreground hover:border-blue-400 hover:bg-blue-50 rounded-lg transition-all"
              whileHover={buttonHover}
              whileTap={buttonTap}
            >
              <Upload className="w-4 h-4" />
              <span className="font-light">Importer CSV</span>
            </motion.button>
          </Tooltip>

          <Tooltip content="Exporter tous les patients" shortcut="Ctrl+E" placement="bottom">
            <motion.button
              onClick={handleExport}
              disabled={filteredPatients.length === 0}
              className="flex items-center gap-2 px-4 py-3 border border-neutral-300 text-foreground hover:border-gold-400 hover:bg-gold-50 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-all"
              whileHover={buttonHover}
              whileTap={buttonTap}
            >
              <Download className="w-4 h-4" />
              <span className="font-light">Exporter CSV</span>
            </motion.button>
          </Tooltip>

          <Tooltip content="Ajouter un nouveau patient" shortcut="Ctrl+N" placement="bottom">
            <motion.button
              onClick={() => setActiveModal('add')}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-gold-500 to-gold-600 text-white hover:from-gold-600 hover:to-gold-700 rounded-lg transition-all duration-300 shadow-soft hover:shadow-gold"
              whileHover={buttonHover}
              whileTap={buttonTap}
            >
              <Plus className="w-4 h-4" />
              <span className="font-light">Nouveau patient</span>
            </motion.button>
          </Tooltip>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Rechercher par nom, email ou téléphone..."
          className="w-full pl-12 pr-4 py-3 bg-white border border-neutral-200 focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200 transition-all"
        />
      </div>

      {/* Patients List */}
      {patients.length === 0 ? (
        <EmptyState
          icon={<Users size={32} />}
          title="Aucun patient pour l'instant"
          description="Commencez en ajoutant votre premier patient pour gérer votre clinique. Vous pouvez aussi importer une liste existante depuis un fichier CSV."
          primaryAction={{
            label: 'Ajouter un patient',
            icon: <Plus size={20} />,
            onClick: () => setActiveModal('add')
          }}
          secondaryActions={[
            { label: 'Importer depuis CSV', onClick: () => setActiveModal('import') }
          ]}
        />
      ) : filteredPatients.length === 0 ? (
        <div className="bg-white border border-neutral-200 shadow-soft-lg">
          <div className="text-center py-12">
            <Search className="w-12 h-12 text-foreground/20 mx-auto mb-3" />
            <p className="text-foreground/60 mb-2">Aucun résultat pour "{searchTerm}"</p>
            <p className="text-sm text-foreground/50">Essayez de rechercher par nom, email ou téléphone</p>
            <button
              onClick={() => setSearchTerm('')}
              className="mt-4 text-sm text-gold-600 hover:text-gold-700"
            >
              Réinitialiser la recherche
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-neutral-200 shadow-soft-lg">
          <div className="divide-y divide-neutral-200">
            {filteredPatients.map((patient) => (
              <motion.div
                key={patient.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-6 hover:bg-neutral-50 transition-colors relative"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 pointer-events-none">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-medium text-foreground">
                        {patient.first_name} {patient.last_name}
                      </h3>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        patient.status === 'active'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-neutral-100 text-neutral-600'
                      }`}>
                        {patient.status === 'active' ? 'Actif' : 'Inactif'}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm text-foreground/70">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        {patient.email || 'Non renseigné'}
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        {patient.phone || 'Non renseigné'}
                      </div>
                      <div>
                        <span className="text-foreground/50">Visites: </span>
                        {patient.total_visits}
                      </div>
                      <div>
                        <span className="text-foreground/50">Dernière visite: </span>
                        {patient.last_visit ? new Date(patient.last_visit).toLocaleDateString('fr-CA') : 'Jamais'}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 ml-4 relative z-10 pointer-events-auto">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setSelectedPatient(patient);
                        setActiveModal('soapNotes');
                      }}
                      className="p-2 hover:bg-neutral-100 rounded-lg transition-colors group cursor-pointer shrink-0"
                      title="Notes SOAP"
                      type="button"
                    >
                      <FileText className="w-5 h-5 text-foreground/60 group-hover:text-foreground pointer-events-none" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setSelectedPatient(patient);
                        setActiveModal('appointments');
                      }}
                      className="p-2 hover:bg-neutral-100 rounded-lg transition-colors group cursor-pointer shrink-0"
                      title="Rendez-vous"
                      type="button"
                    >
                      <Calendar className="w-5 h-5 text-foreground/60 group-hover:text-foreground pointer-events-none" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setSelectedPatient(patient);
                        setActiveModal('billing');
                      }}
                      className="p-2 hover:bg-neutral-100 rounded-lg transition-colors group cursor-pointer shrink-0"
                      title="Facturation"
                      type="button"
                    >
                      <DollarSign className="w-5 h-5 text-foreground/60 group-hover:text-foreground pointer-events-none" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setSelectedPatient(patient);
                        setActiveModal('edit');
                      }}
                      className="p-2 hover:bg-blue-50 rounded-lg transition-colors group cursor-pointer shrink-0"
                      title="Modifier"
                      type="button"
                    >
                      <Edit className="w-5 h-5 text-blue-600 group-hover:text-blue-700 pointer-events-none" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        openDeleteModal(patient);
                      }}
                      className="p-2 hover:bg-red-50 rounded-lg transition-colors group cursor-pointer shrink-0"
                      title="Supprimer"
                      type="button"
                    >
                      <Trash2 className="w-5 h-5 text-red-400 group-hover:text-red-600 pointer-events-none" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Add Patient Modal */}
      {activeModal === 'add' && (
        <AddPatientModal
          onClose={() => setActiveModal('none')}
          onAdd={handleAddPatient}
        />
      )}

      {/* Edit Patient Modal */}
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

      {/* SOAP Notes Modal */}
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

      {/* Appointments Modal */}
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

      {/* Billing Modal */}
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

      {/* CSV Import Modal */}
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
      medications: formData.medications ? formData.medications.split(',').map(m => m.trim()).filter(Boolean) : null,
      allergies: formData.allergies ? formData.allergies.split(',').map(a => a.trim()).filter(Boolean) : null,
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
        className="bg-white w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-lifted"
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
                className="w-full px-4 py-3 border border-neutral-300 focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground/70 mb-2">Nom *</label>
              <input
                type="text"
                required
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                className="w-full px-4 py-3 border border-neutral-300 focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200 transition-all"
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
                className="w-full px-4 py-3 border border-neutral-300 focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground/70 mb-2">Téléphone</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-3 border border-neutral-300 focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200 transition-all"
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
                className="w-full px-4 py-3 border border-neutral-300 focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground/70 mb-2">Genre</label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="w-full px-4 py-3 border border-neutral-300 focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200 transition-all"
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
              className="w-full px-4 py-3 border border-neutral-300 focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground/70 mb-2">Historique médical</label>
            <textarea
              value={formData.medical_history}
              onChange={(e) => setFormData({ ...formData, medical_history: e.target.value })}
              rows={3}
              className="w-full px-4 py-3 border border-neutral-300 focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200 transition-all resize-none"
              placeholder="Conditions médicales, chirurgies passées, etc."
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-foreground/70 mb-2">Médicaments</label>
              <textarea
                value={formData.medications}
                onChange={(e) => setFormData({ ...formData, medications: e.target.value })}
                rows={2}
                className="w-full px-4 py-3 border border-neutral-300 focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200 transition-all resize-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground/70 mb-2">Allergies</label>
              <textarea
                value={formData.allergies}
                onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                rows={2}
                className="w-full px-4 py-3 border border-neutral-300 focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200 transition-all resize-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-4 pt-6 border-t border-neutral-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-neutral-300 text-foreground hover:bg-neutral-50 transition-all"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-6 py-3 bg-gradient-to-r from-gold-500 to-gold-600 text-white hover:from-gold-600 hover:to-gold-700 transition-all duration-300 shadow-soft hover:shadow-gold"
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
      medications: formData.medications ? formData.medications.split(',').map(m => m.trim()).filter(Boolean) : null,
      allergies: formData.allergies ? formData.allergies.split(',').map(a => a.trim()).filter(Boolean) : null,
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
        className="bg-white w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-lifted"
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
                className="w-full px-4 py-3 border border-neutral-300 focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground/70 mb-2">Nom *</label>
              <input
                type="text"
                required
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                className="w-full px-4 py-3 border border-neutral-300 focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200 transition-all"
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
                className="w-full px-4 py-3 border border-neutral-300 focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground/70 mb-2">Téléphone</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-3 border border-neutral-300 focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200 transition-all"
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
                className="w-full px-4 py-3 border border-neutral-300 focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground/70 mb-2">Genre</label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="w-full px-4 py-3 border border-neutral-300 focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200 transition-all"
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
              className="w-full px-4 py-3 border border-neutral-300 focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200 transition-all"
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
              className="w-full px-4 py-3 border border-neutral-300 focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground/70 mb-2">Historique médical</label>
            <textarea
              value={formData.medical_history}
              onChange={(e) => setFormData({ ...formData, medical_history: e.target.value })}
              rows={3}
              className="w-full px-4 py-3 border border-neutral-300 focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200 transition-all resize-none"
              placeholder="Conditions médicales, chirurgies passées, etc."
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-foreground/70 mb-2">Médicaments</label>
              <textarea
                value={formData.medications}
                onChange={(e) => setFormData({ ...formData, medications: e.target.value })}
                rows={2}
                className="w-full px-4 py-3 border border-neutral-300 focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200 transition-all resize-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground/70 mb-2">Allergies</label>
              <textarea
                value={formData.allergies}
                onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                rows={2}
                className="w-full px-4 py-3 border border-neutral-300 focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200 transition-all resize-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-4 pt-6 border-t border-neutral-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-neutral-300 text-foreground hover:bg-neutral-50 transition-all"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 transition-all duration-300 shadow-soft"
            >
              Enregistrer les modifications
            </button>
          </div>
        </form>
      </motion.div>

      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setPatientToDelete(null);
        }}
        onConfirm={handleDeletePatient}
        title={`Supprimer ${patientToDelete?.first_name} ${patientToDelete?.last_name}?`}
        description="Cette action est irréversible."
        consequences={[
          'Dossier patient complet',
          'Historique de rendez-vous',
          'Notes SOAP',
          'Données de facturation'
        ]}
        danger
        confirmLabel="Supprimer définitivement"
      />

      <ShortcutsHelp
        isOpen={showShortcuts}
        onClose={() => setShowShortcuts(false)}
        shortcuts={shortcuts}
      />

      <Confetti trigger={showConfetti} />
    </div>
  );
}
