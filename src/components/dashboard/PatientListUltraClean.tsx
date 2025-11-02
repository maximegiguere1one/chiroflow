import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import {
  Plus, Search, Filter, MoreVertical, Calendar, Phone, Mail,
  Clock, AlertCircle, ChevronDown, User, Activity, FileText,
  TrendingUp, Edit, Eye, MessageSquare, DollarSign, X, Zap,
  Download, Upload, RefreshCw, Users, CheckCircle
} from 'lucide-react';
import { useToastContext } from '../../contexts/ToastContext';
import { ContactDetailsModal } from './ContactDetailsModal';
import { AppointmentSchedulingModal } from './AppointmentSchedulingModal';
import { PatientBillingModal } from './PatientBillingModal';
import { QuickBillingModal } from './QuickBillingModal';
import { CSVImportModal } from './CSVImportModal';

interface Patient {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  date_of_birth: string;
  status: string;
  created_at: string;
  updated_at?: string;
  address?: string;
  notes?: string;
  owner_id?: string;
}

type ViewMode = 'all' | 'active' | 'inactive' | 'urgent';
type SortField = 'name' | 'last_visit' | 'next_appointment' | 'created_at';

export default function PatientListUltraClean() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('all');
  const [sortField, setSortField] = useState<SortField>('last_visit');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [activeModal, setActiveModal] = useState<'none' | 'details' | 'appointment' | 'billing' | 'quickBilling' | 'import'>('none');
  const [contextMenu, setContextMenu] = useState<{ patientId: string; x: number; y: number } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const toast = useToastContext();

  const PAGE_SIZE = 50;

  useEffect(() => {
    loadPatients();
  }, [currentPage, viewMode]);

  async function loadPatients() {
    const startTime = performance.now();
    try {
      setLoading(true);
      const from = (currentPage - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      let query = supabase
        .from('contacts')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);

      if (viewMode === 'active') {
        query = query.eq('status', 'active');
      } else if (viewMode === 'inactive') {
        query = query.eq('status', 'inactive');
      }

      const { data, error, count } = await query;

      if (error) throw error;
      setPatients(data || []);
      setTotalCount(count || 0);

      const duration = performance.now() - startTime;
      if (import.meta.env.DEV) {
        console.log(JSON.stringify({
          timestamp: new Date().toISOString(),
          level: 'INFO',
          message: 'Patients loaded with pagination',
          duration,
          metadata: {
            component: 'PatientListUltraClean',
            page: currentPage,
            pageSize: PAGE_SIZE,
            totalCount: count
          }
        }));
      }
    } catch (error) {
      console.error(JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'ERROR',
        message: 'Error loading patients',
        error: error instanceof Error ? error.message : String(error),
        metadata: { component: 'PatientListUltraClean' }
      }));
      toast.error('Erreur de chargement des patients');
    } finally {
      setLoading(false);
    }
  }

  const filteredPatients = useMemo(() => {
    let filtered = patients.filter(p =>
      p.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.phone?.includes(searchTerm)
    );

    switch (viewMode) {
      case 'active':
        filtered = filtered.filter(p => p.status === 'active');
        break;
      case 'inactive':
        filtered = filtered.filter(p => p.status === 'inactive');
        break;
      case 'urgent':
        // Pour l'instant, pas de données urgentes, on retourne vide
        filtered = [];
        break;
    }

    filtered.sort((a, b) => {
      switch (sortField) {
        case 'name':
          return (a.full_name || '').localeCompare(b.full_name || '');
        case 'created_at':
          return b.created_at.localeCompare(a.created_at);
        default:
          return 0;
      }
    });

    return filtered;
  }, [patients, searchTerm, viewMode, sortField]);

  const getStatusBadge = (patient: Patient) => {
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

  const getPriorityIndicator = (patient: Patient) => {
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

  const stats = {
    total: patients.length,
    active: patients.filter(p => p.status === 'active').length,
    urgent: patients.filter(p => p.status === 'archived').length,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Patients</h1>
              <p className="text-gray-600 mt-1">{filteredPatients.length} patient{filteredPatients.length !== 1 ? 's' : ''}</p>
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
                onClick={() => {
                  setSelectedPatient({
                    id: '',
                    first_name: '',
                    last_name: '',
                    email: '',
                    phone: '',
                    date_of_birth: '',
                    address: '',
                    emergency_contact_name: '',
                    emergency_contact_phone: '',
                    medical_history: '',
                    current_medications: '',
                    allergies: '',
                    insurance_provider: '',
                    insurance_policy_number: '',
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    status: 'active'
                  } as any);
                  setActiveModal('details');
                }}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Nouveau patient
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-xl p-5 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
                  <div className="text-sm text-gray-600">Total patients</div>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-5 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-green-600">{stats.active}</div>
                  <div className="text-sm text-gray-600">Actifs</div>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-5 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-red-600">{stats.urgent}</div>
                  <div className="text-sm text-gray-600">Urgents</div>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher un patient..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                >
                  <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-lg p-1">
              <button
                onClick={() => setViewMode('all')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                  viewMode === 'all' ? 'bg-gray-900 text-white' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Tous
              </button>
              <button
                onClick={() => setViewMode('active')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                  viewMode === 'active' ? 'bg-gray-900 text-white' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Actifs
              </button>
              <button
                onClick={() => setViewMode('urgent')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                  viewMode === 'urgent' ? 'bg-gray-900 text-white' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Urgents
              </button>
            </div>

            <button
              onClick={() => loadPatients()}
              className="p-2.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all"
            >
              <RefreshCw className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredPatients.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucun patient trouvé</h3>
            <p className="text-gray-600 mb-6">
              {searchTerm ? 'Essayez une autre recherche' : 'Commencez par ajouter votre premier patient'}
            </p>
            {!searchTerm && (
              <button
                onClick={() => {
                  setSelectedPatient({
                    id: '',
                    first_name: '',
                    last_name: '',
                    email: '',
                    phone: '',
                    date_of_birth: '',
                    address: '',
                    emergency_contact_name: '',
                    emergency_contact_phone: '',
                    medical_history: '',
                    current_medications: '',
                    allergies: '',
                    insurance_provider: '',
                    insurance_policy_number: '',
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    status: 'active'
                  } as any);
                  setActiveModal('details');
                }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"
              >
                <Plus className="w-4 h-4" />
                Ajouter un patient
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Patient
                    </th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Ajouté
                    </th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Date de naissance
                    </th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="text-right px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <AnimatePresence>
                    {filteredPatients.map((patient) => (
                      <motion.tr
                        key={patient.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="hover:bg-gray-50 transition-colors cursor-pointer group"
                        onClick={() => {
                          setSelectedPatient(patient);
                          setActiveModal('details');
                        }}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className={`w-1 h-10 rounded-full ${getPriorityIndicator(patient)}`}></div>
                            <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                              <span className="text-white font-semibold text-sm">
                                {patient.full_name ? patient.full_name.split(' ').filter(n => n).map(n => n.charAt(0)).slice(0, 2).join('').toUpperCase() : '??'}
                              </span>
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900">
                                {patient.full_name || 'Sans nom'}
                              </div>
                              {patient.email && (
                                <div className="text-sm text-gray-500">{patient.email}</div>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="space-y-1">
                            {patient.email && (
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Mail className="w-3.5 h-3.5" />
                                <span className="truncate max-w-[200px]">{patient.email}</span>
                              </div>
                            )}
                            {patient.phone && (
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Phone className="w-3.5 h-3.5" />
                                <span>{patient.phone}</span>
                              </div>
                            )}
                          </div>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Clock className="w-4 h-4" />
                            <span>{formatLastVisit(patient.created_at)}</span>
                          </div>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {patient.date_of_birth || 'Non spécifié'}
                          </div>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(patient)}
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedPatient(patient);
                                setActiveModal('appointment');
                              }}
                              className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                              title="Nouveau rendez-vous"
                            >
                              <Calendar className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toast.info('Envoi de message...');
                              }}
                              className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all"
                              title="Envoyer un message"
                            >
                              <MessageSquare className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedPatient(patient);
                                setActiveModal('quickBilling');
                              }}
                              className="p-2 text-gray-600 hover:text-gold-600 hover:bg-gold-50 rounded-lg transition-all group"
                              title="Facturation Express ⚡"
                            >
                              <Zap className="w-4 h-4 group-hover:fill-gold-400" />
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
        )}
      </div>

      {activeModal === 'details' && selectedPatient !== null && (
        <ContactDetailsModal
          contact={selectedPatient}
          onClose={() => {
            setActiveModal('none');
            setSelectedPatient(null);
          }}
          onUpdate={loadPatients}
        />
      )}

      {activeModal === 'appointment' && selectedPatient && (
        <AppointmentSchedulingModal
          isOpen={true}
          patient={selectedPatient}
          onClose={() => {
            setActiveModal('none');
            setSelectedPatient(null);
            loadPatients();
          }}
        />
      )}

      {activeModal === 'billing' && selectedPatient && (
        <PatientBillingModal
          patient={selectedPatient}
          onClose={() => {
            setActiveModal('none');
            setSelectedPatient(null);
            loadPatients();
          }}
        />
      )}

      {activeModal === 'quickBilling' && selectedPatient && (
        <QuickBillingModal
          patient={selectedPatient}
          onClose={() => {
            setActiveModal('none');
            setSelectedPatient(null);
          }}
          onSuccess={() => {
            loadPatients();
          }}
        />
      )}

      {activeModal === 'import' && (
        <CSVImportModal
          onClose={() => {
            setActiveModal('none');
            loadPatients();
          }}
        />
      )}

      {totalCount > PAGE_SIZE && (
        <div className="mt-6 flex items-center justify-between border-t border-gray-200 bg-white px-6 py-4 rounded-lg">
          <div className="flex flex-1 justify-between sm:hidden">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Précédent
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.min(Math.ceil(totalCount / PAGE_SIZE), p + 1))}
              disabled={currentPage >= Math.ceil(totalCount / PAGE_SIZE)}
              className="relative ml-3 inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Suivant
            </button>
          </div>
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Affichage de <span className="font-medium">{(currentPage - 1) * PAGE_SIZE + 1}</span> à{' '}
                <span className="font-medium">{Math.min(currentPage * PAGE_SIZE, totalCount)}</span> sur{' '}
                <span className="font-medium">{totalCount}</span> résultats
              </p>
            </div>
            <div>
              <nav className="inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="sr-only">Précédent</span>
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                  </svg>
                </button>
                {Array.from({ length: Math.min(5, Math.ceil(totalCount / PAGE_SIZE)) }, (_, i) => {
                  const pageNum = currentPage <= 3 ? i + 1 : currentPage + i - 2;
                  if (pageNum > Math.ceil(totalCount / PAGE_SIZE)) return null;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                        currentPage === pageNum
                          ? 'z-10 bg-gold-600 text-white focus:z-20'
                          : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button
                  onClick={() => setCurrentPage(p => Math.min(Math.ceil(totalCount / PAGE_SIZE), p + 1))}
                  disabled={currentPage >= Math.ceil(totalCount / PAGE_SIZE)}
                  className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="sr-only">Suivant</span>
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                  </svg>
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
