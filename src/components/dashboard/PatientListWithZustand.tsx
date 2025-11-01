import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useMemo } from 'react';
import {
  Plus, Search, Filter, MoreVertical, Calendar, Phone, Mail,
  Clock, AlertCircle, ChevronDown, User, Activity, FileText,
  TrendingUp, Edit, Eye, MessageSquare, DollarSign, X,
  Download, Upload, RefreshCw, Users, CheckCircle
} from 'lucide-react';
import { useToastContext } from '../../contexts/ToastContext';
import { ContactDetailsModal } from './ContactDetailsModal';
import { AppointmentSchedulingModal } from './AppointmentSchedulingModal';
import { PatientBillingModal } from './PatientBillingModal';
import { CSVImportModal } from './CSVImportModal';
import { usePatients, usePatientActions } from '../../hooks/usePatients';
import { useUIStore } from '../../presentation/stores/uiStore';

type ViewMode = 'all' | 'active' | 'inactive' | 'urgent';
type SortField = 'name' | 'last_visit' | 'next_appointment' | 'created_at';
type ActiveModal = 'none' | 'details' | 'appointment' | 'billing' | 'import';

export default function PatientListWithZustand() {
  const {
    patients,
    loading,
    error,
    pagination,
    searchTerm,
    setSearchTerm,
    setPage,
    setFilters,
    refresh
  } = usePatients({ limit: 50 }, true);

  const { createPatient, updatePatient, deletePatient } = usePatientActions();
  const addNotification = useUIStore((state) => state.addNotification);
  const toast = useToastContext();

  const [viewMode, setViewMode] = useState<ViewMode>('all');
  const [sortField, setSortField] = useState<SortField>('last_visit');
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [activeModal, setActiveModal] = useState<ActiveModal>('none');
  const [contextMenu, setContextMenu] = useState<{ patientId: string; x: number; y: number } | null>(null);

  useEffect(() => {
    if (viewMode !== 'all') {
      setFilters({
        status: viewMode === 'urgent' ? undefined : viewMode,
      });
    } else {
      setFilters({});
    }
  }, [viewMode, setFilters]);

  useEffect(() => {
    if (error) {
      toast.error('Erreur de chargement des patients');
      addNotification({
        type: 'error',
        message: error.message,
      });
    }
  }, [error, toast, addNotification]);

  const filteredPatients = useMemo(() => {
    let filtered = [...patients];

    if (searchTerm) {
      filtered = filtered.filter(p =>
        p.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.phone?.includes(searchTerm)
      );
    }

    if (viewMode === 'urgent') {
      filtered = [];
    }

    filtered.sort((a, b) => {
      switch (sortField) {
        case 'name':
          return (a.full_name || '').localeCompare(b.full_name || '');
        case 'created_at':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        default:
          return 0;
      }
    });

    return filtered;
  }, [patients, searchTerm, viewMode, sortField]);

  const getStatusBadge = (patient: any) => {
    if (patient.status === 'active') {
      return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-green-100 text-green-700">Actif</span>;
    }
    if (patient.status === 'inactive') {
      return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-gray-100 text-gray-700">Inactif</span>;
    }
    if (patient.status === 'archived') {
      return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-red-100 text-red-700">Archivé</span>;
    }
    return null;
  };

  const getPriorityIndicator = (patient: any) => {
    if (patient.status === 'active') return 'bg-green-500';
    if (patient.status === 'inactive') return 'bg-gray-400';
    if (patient.status === 'archived') return 'bg-red-500';
    return 'bg-blue-500';
  };

  const formatLastVisit = (date?: string) => {
    if (!date) return 'Nouveau';
    const days = Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Aujourd\'hui';
    if (days === 1) return 'Hier';
    if (days < 7) return `Il y a ${days}j`;
    if (days < 30) return `Il y a ${Math.floor(days / 7)}sem`;
    return `Il y a ${Math.floor(days / 30)}mois`;
  };

  const handleRefresh = async () => {
    addNotification({
      type: 'info',
      message: 'Actualisation des patients...',
      duration: 2000,
    });
    await refresh();
    addNotification({
      type: 'success',
      message: 'Patients actualisés',
      duration: 2000,
    });
  };

  const stats = {
    total: patients.length,
    active: patients.filter(p => p.status === 'active').length,
    urgent: patients.filter(p => p.status === 'archived').length,
  };

  const totalPages = Math.ceil(pagination.total / pagination.pageSize);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Patients</h1>
              <p className="text-gray-600 mt-1">
                {filteredPatients.length} patient{filteredPatients.length !== 1 ? 's' : ''}
                {pagination.total > 0 && ` sur ${pagination.total} total`}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setActiveModal('import')}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all"
              >
                <Upload className="w-4 h-4" />
                Importer
              </button>
              <button
                onClick={() => toast.info('Export en cours...')}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all"
              >
                <Download className="w-4 h-4" />
                Exporter
              </button>
              <button
                onClick={handleRefresh}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Actualiser
              </button>
              <button
                onClick={() => {
                  setSelectedPatient(null);
                  setActiveModal('details');
                }}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Nouveau Patient
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <motion.div
              whileHover={{ scale: 1.02 }}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                viewMode === 'all' ? 'bg-blue-50 border-blue-500' : 'bg-white border-gray-200 hover:border-blue-300'
              }`}
              onClick={() => setViewMode('all')}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total</p>
                  <p className="text-2xl font-bold text-gray-900">{pagination.total}</p>
                </div>
                <Users className="w-8 h-8 text-blue-500" />
              </div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                viewMode === 'active' ? 'bg-green-50 border-green-500' : 'bg-white border-gray-200 hover:border-green-300'
              }`}
              onClick={() => setViewMode('active')}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Actifs</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                viewMode === 'inactive' ? 'bg-gray-50 border-gray-500' : 'bg-white border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setViewMode('inactive')}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Inactifs</p>
                  <p className="text-2xl font-bold text-gray-900">{patients.length - stats.active}</p>
                </div>
                <Clock className="w-8 h-8 text-gray-500" />
              </div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                viewMode === 'urgent' ? 'bg-red-50 border-red-500' : 'bg-white border-gray-200 hover:border-red-300'
              }`}
              onClick={() => setViewMode('urgent')}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Urgents</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.urgent}</p>
                </div>
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>
            </motion.div>
          </div>

          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher un patient..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex items-center gap-2">
              <button className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all">
                <Filter className="w-4 h-4" />
                Filtrer
              </button>
              <select
                value={sortField}
                onChange={(e) => setSortField(e.target.value as SortField)}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all"
              >
                <option value="name">Nom</option>
                <option value="last_visit">Dernière visite</option>
                <option value="created_at">Date création</option>
              </select>
            </div>
          </div>
        </div>

        {loading && patients.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredPatients.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border-2 border-dashed border-gray-300">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 text-lg mb-2">Aucun patient trouvé</p>
            <p className="text-gray-400 text-sm">Ajoutez votre premier patient pour commencer</p>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dernière visite</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    <AnimatePresence mode="popLayout">
                      {filteredPatients.map((patient, index) => (
                        <motion.tr
                          key={patient.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ delay: index * 0.02 }}
                          className="hover:bg-gray-50 transition-colors cursor-pointer"
                          onClick={() => {
                            setSelectedPatient(patient);
                            setActiveModal('details');
                          }}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className={`w-2 h-2 rounded-full ${getPriorityIndicator(patient)} mr-3`}></div>
                              <div>
                                <div className="text-sm font-medium text-gray-900">{patient.full_name}</div>
                                <div className="text-sm text-gray-500">
                                  {patient.date_of_birth ? new Date(patient.date_of_birth).toLocaleDateString('fr-CA') : 'N/A'}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900 flex items-center gap-1">
                              <Phone className="w-3 h-3 text-gray-400" />
                              {patient.phone || 'N/A'}
                            </div>
                            <div className="text-sm text-gray-500 flex items-center gap-1">
                              <Mail className="w-3 h-3 text-gray-400" />
                              {patient.email || 'N/A'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getStatusBadge(patient)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatLastVisit(patient.updated_at || patient.created_at)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedPatient(patient);
                                  setActiveModal('appointment');
                                }}
                                className="text-blue-600 hover:text-blue-900 p-1 hover:bg-blue-50 rounded"
                              >
                                <Calendar className="w-4 h-4" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedPatient(patient);
                                  setActiveModal('billing');
                                }}
                                className="text-green-600 hover:text-green-900 p-1 hover:bg-green-50 rounded"
                              >
                                <DollarSign className="w-4 h-4" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setContextMenu({
                                    patientId: patient.id,
                                    x: e.clientX,
                                    y: e.clientY
                                  });
                                }}
                                className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-50 rounded"
                              >
                                <MoreVertical className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
            </div>

            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Page {pagination.currentPage} sur {totalPages}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(pagination.currentPage - 1)}
                    disabled={pagination.currentPage === 1 || loading}
                    className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Précédent
                  </button>
                  <button
                    onClick={() => setPage(pagination.currentPage + 1)}
                    disabled={pagination.currentPage === totalPages || loading}
                    className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Suivant
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {activeModal === 'details' && (
        <ContactDetailsModal
          contact={selectedPatient}
          onClose={() => {
            setActiveModal('none');
            setSelectedPatient(null);
          }}
          onSave={async (data) => {
            try {
              if (selectedPatient) {
                await updatePatient(selectedPatient.id, data);
                toast.success('Patient mis à jour');
              } else {
                await createPatient(data);
                toast.success('Patient créé');
              }
              setActiveModal('none');
              setSelectedPatient(null);
            } catch (error) {
              toast.error('Erreur lors de l\'enregistrement');
            }
          }}
        />
      )}

      {activeModal === 'appointment' && selectedPatient && (
        <AppointmentSchedulingModal
          contact={selectedPatient}
          onClose={() => {
            setActiveModal('none');
            setSelectedPatient(null);
          }}
          onScheduled={() => {
            toast.success('Rendez-vous planifié');
            setActiveModal('none');
            setSelectedPatient(null);
          }}
        />
      )}

      {activeModal === 'billing' && selectedPatient && (
        <PatientBillingModal
          contactId={selectedPatient.id}
          onClose={() => {
            setActiveModal('none');
            setSelectedPatient(null);
          }}
        />
      )}

      {activeModal === 'import' && (
        <CSVImportModal
          onClose={() => setActiveModal('none')}
          onImportComplete={async () => {
            setActiveModal('none');
            await refresh();
            toast.success('Import terminé');
          }}
        />
      )}
    </div>
  );
}
