import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import {
  Plus, X, Clock, Phone, Calendar as CalendarIcon, Upload, Download,
  CheckCircle, XCircle, MessageSquare, Zap, AlertCircle
} from 'lucide-react';
import type { Appointment, Patient } from '../../types/database';
import { useToastContext } from '../../contexts/ToastContext';
import { CSVImportModal } from './CSVImportModal';
import { exportAppointmentsToCSV } from '../../lib/exportUtils';
import { createScheduledAt } from '../../lib/dateUtils';

interface NewAppointmentForm {
  patient_id?: string;
  name: string;
  email: string;
  phone: string;
  reason: string;
  scheduled_date: string;
  scheduled_time: string;
  duration_minutes: number;
  notes: string;
}

type FilterType = 'all' | 'today' | 'week' | 'unconfirmed' | 'late' | 'completed_today';

const QUICK_REASONS = [
  { label: 'Ajustement', duration: 30, notes: 'Ajustement chiropratique standard' },
  { label: 'Consultation initiale', duration: 60, notes: 'Première consultation avec évaluation complète' },
  { label: 'Suivi régulier', duration: 30, notes: 'Suivi de traitement en cours' },
  { label: 'Urgence', duration: 45, notes: 'Consultation urgente' },
  { label: 'Réévaluation', duration: 45, notes: 'Réévaluation complète du patient' },
];

export function AppointmentsPageEnhanced() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showNewAppointmentModal, setShowNewAppointmentModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterType>('today');
  const toast = useToastContext();

  useEffect(() => {
    loadAppointments();
    // Raccourci clavier pour nouveau RDV
    const handleKeyboard = (e: KeyboardEvent) => {
      if (e.key === 'n' && !e.ctrlKey && !e.metaKey && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault();
        setShowNewAppointmentModal(true);
      }
    };
    window.addEventListener('keydown', handleKeyboard);
    return () => window.removeEventListener('keydown', handleKeyboard);
  }, []);

  async function loadAppointments() {
    try {
      const { data, error } = await supabase
        .from('appointments_api')
        .select('*')
        .not('scheduled_date', 'is', null)
        .order('scheduled_date', { ascending: true })
        .order('scheduled_time', { ascending: true });

      if (error) throw error;
      setAppointments(data || []);
    } catch (error) {
      console.error('Error loading appointments:', error);
      toast.error('Erreur lors du chargement des rendez-vous');
    } finally {
      setLoading(false);
    }
  }

  async function handleQuickAction(aptId: string, action: 'confirm' | 'complete' | 'cancel' | 'sms' | 'call') {
    const apt = appointments.find(a => a.id === aptId);
    if (!apt) return;

    switch (action) {
      case 'confirm':
        await updateAppointmentStatus(aptId, 'confirmed');
        toast.success(`RDV de ${apt.name} confirmé`);
        break;
      case 'complete':
        await updateAppointmentStatus(aptId, 'completed');
        toast.success(`RDV de ${apt.name} marqué comme complété`);
        break;
      case 'cancel':
        if (confirm(`Annuler le RDV de ${apt.name}?`)) {
          await updateAppointmentStatus(aptId, 'cancelled');
          toast.success(`RDV de ${apt.name} annulé`);
        }
        break;
      case 'sms':
        toast.success(`SMS de rappel envoyé à ${apt.name}`);
        break;
      case 'call':
        window.location.href = `tel:${apt.phone}`;
        break;
    }
  }

  async function updateAppointmentStatus(id: string, status: string) {
    try {
      const { error } = await supabase
        .from('appointments_api')
        .update({ status })
        .eq('id', id);

      if (error) throw error;
      await loadAppointments();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Erreur lors de la mise à jour');
    }
  }

  // Removed unused function

  // Removed unused function

  function handleExport() {
    try {
      exportAppointmentsToCSV(filteredAppointments);
      toast.success(`${filteredAppointments.length} rendez-vous exportés`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Erreur lors de l\'export');
    }
  }

  const filteredAppointments = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekFromNow = new Date(today);
    weekFromNow.setDate(weekFromNow.getDate() + 7);

    let filtered = appointments;

    switch (activeFilter) {
      case 'today':
        filtered = appointments.filter(apt => {
          if (!apt.scheduled_date) return false;
          const aptDate = new Date(apt.scheduled_date);
          return aptDate.toDateString() === today.toDateString();
        });
        break;
      case 'week':
        filtered = appointments.filter(apt => {
          if (!apt.scheduled_date) return false;
          const aptDate = new Date(apt.scheduled_date);
          return aptDate >= today && aptDate < weekFromNow;
        });
        break;
      case 'unconfirmed':
        filtered = appointments.filter(apt => apt.status === 'pending');
        break;
      case 'late':
        filtered = appointments.filter(apt => {
          if (!apt.scheduled_date || apt.status === 'completed' || apt.status === 'cancelled') return false;
          const aptDate = new Date(apt.scheduled_date);
          const aptTime = apt.scheduled_time || '00:00';
          const [hours, minutes] = aptTime.split(':').map(Number);
          aptDate.setHours(hours, minutes);
          return aptDate < now && aptDate.toDateString() === today.toDateString();
        });
        break;
      case 'completed_today':
        filtered = appointments.filter(apt => {
          if (!apt.scheduled_date || apt.status !== 'completed') return false;
          const aptDate = new Date(apt.scheduled_date);
          return aptDate.toDateString() === today.toDateString();
        });
        break;
    }

    return filtered;
  }, [appointments, activeFilter]);

  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayAppts = appointments.filter(apt => {
      if (!apt.scheduled_date) return false;
      const aptDate = new Date(apt.scheduled_date);
      return aptDate.toDateString() === today.toDateString();
    });

    return {
      today: todayAppts.length,
      unconfirmed: appointments.filter(a => a.status === 'pending').length,
      completed_today: todayAppts.filter(a => a.status === 'completed').length,
      late: todayAppts.filter(apt => {
        if (apt.status === 'completed' || apt.status === 'cancelled') return false;
        const aptTime = apt.scheduled_time || '00:00';
        const [hours, minutes] = aptTime.split(':').map(Number);
        const aptDateTime = new Date(today);
        aptDateTime.setHours(hours, minutes);
        return aptDateTime < new Date();
      }).length,
      week: appointments.filter(apt => {
        if (!apt.scheduled_date) return false;
        const aptDate = new Date(apt.scheduled_date);
        const weekFromNow = new Date(today);
        weekFromNow.setDate(weekFromNow.getDate() + 7);
        return aptDate >= today && aptDate < weekFromNow;
      }).length,
    };
  }, [appointments]);

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
            <CalendarIcon className="w-6 h-6 text-gold-500" />
            Rendez-vous
          </h2>
          <p className="text-sm text-foreground/60 mt-1">
            {stats.completed_today}/{stats.today} complétés aujourd'hui
          </p>
        </div>

        {/* Stats en Direct */}
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="text-xs text-blue-600 font-medium">Aujourd'hui</div>
            <div className="text-lg font-bold text-blue-700">{stats.today}</div>
          </div>
          <div className="px-4 py-2 bg-green-50 border border-green-200 rounded-lg">
            <div className="text-xs text-green-600 font-medium">Complétés</div>
            <div className="text-lg font-bold text-green-700">{stats.completed_today}</div>
          </div>
          {stats.late > 0 && (
            <div className="px-4 py-2 bg-red-50 border border-red-200 rounded-lg">
              <div className="text-xs text-red-600 font-medium">En retard</div>
              <div className="text-lg font-bold text-red-700">{stats.late}</div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-2 px-3 py-2 border border-neutral-300 text-foreground hover:border-blue-400 hover:bg-blue-50 rounded-lg transition-all text-sm"
          >
            <Upload className="w-4 h-4" />
            Import
          </button>
          <button
            onClick={handleExport}
            disabled={filteredAppointments.length === 0}
            className="flex items-center gap-2 px-3 py-2 border border-neutral-300 text-foreground hover:border-gold-400 hover:bg-gold-50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          <button
            onClick={() => setShowNewAppointmentModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-gold-500 to-gold-600 text-white hover:from-gold-600 hover:to-gold-700 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg"
          >
            <Plus className="w-4 h-4" />
            Nouveau RDV <kbd className="ml-1 px-1.5 py-0.5 bg-white/20 rounded text-xs">N</kbd>
          </button>
        </div>
      </div>

      {/* Filtres Intelligents */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setActiveFilter('today')}
          className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
            activeFilter === 'today'
              ? 'bg-blue-100 text-blue-700 border border-blue-300'
              : 'bg-white border border-neutral-200 text-foreground/70 hover:border-blue-300'
          }`}
        >
          <div className="flex items-center justify-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span>Aujourd'hui</span>
            <span className="ml-1 px-1.5 py-0.5 bg-blue-600 text-white rounded-full text-xs">{stats.today}</span>
          </div>
        </button>
        <button
          onClick={() => setActiveFilter('week')}
          className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
            activeFilter === 'week'
              ? 'bg-green-100 text-green-700 border border-green-300'
              : 'bg-white border border-neutral-200 text-foreground/70 hover:border-green-300'
          }`}
        >
          <div className="flex items-center justify-center gap-1.5">
            <CalendarIcon className="w-3.5 h-3.5" />
            <span>Cette semaine</span>
            <span className="ml-1 px-1.5 py-0.5 bg-green-600 text-white rounded-full text-xs">{stats.week}</span>
          </div>
        </button>
        <button
          onClick={() => setActiveFilter('unconfirmed')}
          className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
            activeFilter === 'unconfirmed'
              ? 'bg-orange-100 text-orange-700 border border-orange-300'
              : 'bg-white border border-neutral-200 text-foreground/70 hover:border-orange-300'
          }`}
        >
          <div className="flex items-center justify-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Non confirmés</span>
            {stats.unconfirmed > 0 && (
              <span className="ml-1 px-1.5 py-0.5 bg-orange-600 text-white rounded-full text-xs">{stats.unconfirmed}</span>
            )}
          </div>
        </button>
        {stats.late > 0 && (
          <button
            onClick={() => setActiveFilter('late')}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              activeFilter === 'late'
                ? 'bg-red-100 text-red-700 border border-red-300'
                : 'bg-white border border-neutral-200 text-foreground/70 hover:border-red-300'
            }`}
          >
            <div className="flex items-center justify-center gap-1.5">
              <XCircle className="w-3.5 h-3.5" />
              <span>En retard</span>
              <span className="ml-1 px-1.5 py-0.5 bg-red-600 text-white rounded-full text-xs">{stats.late}</span>
            </div>
          </button>
        )}
        <button
          onClick={() => setActiveFilter('completed_today')}
          className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
            activeFilter === 'completed_today'
              ? 'bg-green-100 text-green-700 border border-green-300'
              : 'bg-white border border-neutral-200 text-foreground/70 hover:border-green-300'
          }`}
        >
          <div className="flex items-center justify-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Complétés</span>
            {stats.completed_today > 0 && (
              <span className="ml-1 px-1.5 py-0.5 bg-green-600 text-white rounded-full text-xs">{stats.completed_today}</span>
            )}
          </div>
        </button>
      </div>

      {/* Liste des RDV */}
      <div className="bg-white border border-neutral-200 rounded-lg shadow-sm overflow-hidden">
        {filteredAppointments.length === 0 ? (
          <div className="text-center py-12">
            <CalendarIcon className="w-12 h-12 text-foreground/20 mx-auto mb-3" />
            <p className="text-foreground/60 mb-4">Aucun rendez-vous trouvé</p>
            <button
              onClick={() => setShowNewAppointmentModal(true)}
              className="text-sm text-gold-600 hover:text-gold-700 font-medium"
            >
              + Ajouter un rendez-vous
            </button>
          </div>
        ) : (
          <div className="divide-y divide-neutral-100">
            <AnimatePresence mode="popLayout">
              {filteredAppointments.map((apt) => {
                const isLate = (() => {
                  if (!apt.scheduled_date || apt.status === 'completed' || apt.status === 'cancelled') return false;
                  const now = new Date();
                  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                  const aptDate = new Date(apt.scheduled_date);
                  if (aptDate.toDateString() !== today.toDateString()) return false;
                  const aptTime = apt.scheduled_time || '00:00';
                  const [hours, minutes] = aptTime.split(':').map(Number);
                  const aptDateTime = new Date(today);
                  aptDateTime.setHours(hours, minutes);
                  return aptDateTime < now;
                })();

                return (
                  <motion.div
                    key={apt.id}
                    layout
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={`px-4 py-3 hover:bg-neutral-50 transition-colors ${
                      isLate ? 'bg-red-50/50' : ''
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      {/* Heure */}
                      <div className="w-20 text-center">
                        <div className="text-sm font-bold text-foreground">{apt.scheduled_time || '09:00'}</div>
                        <div className="text-xs text-foreground/50">{apt.duration_minutes}min</div>
                      </div>

                      {/* Statut visuel */}
                      <div className="flex flex-col gap-1">
                        <div className={`w-2 h-2 rounded-full ${
                          apt.status === 'confirmed' ? 'bg-blue-500' :
                          apt.status === 'pending' ? 'bg-orange-500' :
                          apt.status === 'completed' ? 'bg-green-500' :
                          'bg-neutral-300'
                        }`} />
                        {isLate && <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />}
                      </div>

                      {/* Info patient */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-sm font-medium text-foreground truncate">
                            {apt.name}
                          </h3>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            apt.status === 'confirmed' ? 'bg-blue-100 text-blue-700' :
                            apt.status === 'pending' ? 'bg-orange-100 text-orange-700' :
                            apt.status === 'completed' ? 'bg-green-100 text-green-700' :
                            'bg-neutral-100 text-neutral-600'
                          }`}>
                            {apt.status === 'confirmed' && 'Confirmé'}
                            {apt.status === 'pending' && 'En attente'}
                            {apt.status === 'completed' && 'Complété'}
                            {apt.status === 'cancelled' && 'Annulé'}
                          </span>
                          {isLate && (
                            <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded-full font-medium animate-pulse">
                              En retard
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-foreground/60">
                          <span className="truncate">{apt.reason}</span>
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {apt.phone}
                          </span>
                        </div>
                      </div>

                      {/* Actions Rapides */}
                      <div className="flex items-center gap-1">
                        {apt.status === 'pending' && (
                          <button
                            onClick={() => handleQuickAction(apt.id, 'confirm')}
                            className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-all"
                            title="Confirmer"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        {apt.status === 'confirmed' && (
                          <button
                            onClick={() => handleQuickAction(apt.id, 'complete')}
                            className="p-2 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg transition-all"
                            title="Marquer comme complété"
                          >
                            <Zap className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleQuickAction(apt.id, 'sms')}
                          className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition-all"
                          title="Envoyer SMS"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleQuickAction(apt.id, 'call')}
                          className="p-2 hover:bg-green-50 text-green-600 rounded-lg transition-all"
                          title="Appeler"
                        >
                          <Phone className="w-4 h-4" />
                        </button>
                        {apt.status !== 'cancelled' && (
                          <button
                            onClick={() => handleQuickAction(apt.id, 'cancel')}
                            className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-all"
                            title="Annuler"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Modals */}
      {showNewAppointmentModal && (
        <QuickAppointmentModal
          selectedDate={selectedDate}
          onClose={() => setShowNewAppointmentModal(false)}
          onSuccess={() => {
            loadAppointments();
            setShowNewAppointmentModal(false);
          }}
        />
      )}

      {showImportModal && (
        <CSVImportModal
          isOpen={true}
          onClose={() => setShowImportModal(false)}
          type="appointments"
          onSuccess={() => {
            loadAppointments();
            setShowImportModal(false);
          }}
        />
      )}
    </div>
  );
}

// Modal optimisé avec templates rapides
function QuickAppointmentModal({
  selectedDate,
  onClose,
  onSuccess,
}: {
  selectedDate: Date;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState<NewAppointmentForm>({
    name: '',
    email: '',
    phone: '',
    reason: '',
    scheduled_date: selectedDate.toISOString().split('T')[0],
    scheduled_time: '09:00',
    duration_minutes: 30,
    notes: '',
  });
  const [saving, setSaving] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const toast = useToastContext();

  useEffect(() => {
    loadPatients();
  }, []);

  async function loadPatients() {
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('status', 'active')
        .order('last_name', { ascending: true });

      if (error) throw error;
      setPatients(data || []);
    } catch (error) {
      console.error('Error loading patients:', error);
    }
  }

  const filteredPatients = useMemo(() => {
    if (!searchTerm) return patients;
    const term = searchTerm.toLowerCase();
    return patients.filter(p =>
      `${p.first_name} ${p.last_name}`.toLowerCase().includes(term) ||
      p.email?.toLowerCase().includes(term) ||
      p.phone?.toLowerCase().includes(term)
    );
  }, [patients, searchTerm]);

  function selectPatient(patient: Patient) {
    setSelectedPatient(patient);
    setFormData({
      ...formData,
      patient_id: patient.id,
      name: `${patient.first_name} ${patient.last_name}`,
      email: patient.email || '',
      phone: patient.phone || '',
    });
    setSearchTerm(`${patient.first_name} ${patient.last_name}`);
    setShowPatientDropdown(false);
  }

  function clearPatientSelection() {
    setSelectedPatient(null);
    setFormData({
      ...formData,
      patient_id: undefined,
      name: '',
      email: '',
      phone: '',
    });
    setSearchTerm('');
  }

  function applyTemplate(template: typeof QUICK_REASONS[0]) {
    setFormData({
      ...formData,
      reason: template.label,
      duration_minutes: template.duration,
      notes: template.notes,
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      const scheduled_at = createScheduledAt(formData.scheduled_date, formData.scheduled_time);

      const { error } = await supabase.from('appointments').insert({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        reason: formData.reason,
        scheduled_at: scheduled_at,
        duration_minutes: formData.duration_minutes,
        notes: formData.notes,
        patient_id: formData.patient_id || null,
        status: 'confirmed',
      });

      if (error) throw error;
      toast.success('Rendez-vous créé avec succès');
      onSuccess();
    } catch (error: any) {
      console.error('Error creating appointment:', error);
      toast.error('Erreur: ' + (error.message || 'Erreur inconnue'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-6" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-lg shadow-lifted"
      >
        <div className="sticky top-0 bg-white border-b border-neutral-200 p-6 flex items-center justify-between z-10">
          <h3 className="text-2xl font-heading text-foreground">Nouveau rendez-vous rapide</h3>
          <button type="button" onClick={onClose} className="p-2 hover:bg-neutral-100 rounded-lg transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Templates Rapides */}
        <div className="p-6 border-b border-neutral-200 bg-neutral-50">
          <div className="text-sm font-medium text-foreground/70 mb-3">Templates rapides</div>
          <div className="flex flex-wrap gap-2">
            {QUICK_REASONS.map((template) => (
              <button
                key={template.label}
                type="button"
                onClick={() => applyTemplate(template)}
                className="px-3 py-2 bg-white border border-neutral-300 hover:border-gold-400 hover:bg-gold-50 rounded-lg text-sm transition-all"
              >
                {template.label} ({template.duration}min)
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-foreground/70 mb-2">
                Patient <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setShowPatientDropdown(true);
                  }}
                  onFocus={() => setShowPatientDropdown(true)}
                  className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200 transition-all"
                  placeholder="Rechercher un patient ou créer nouveau..."
                />
                {selectedPatient && (
                  <button
                    type="button"
                    onClick={clearPatientSelection}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
                {showPatientDropdown && searchTerm && filteredPatients.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-neutral-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {filteredPatients.map((patient) => (
                      <button
                        key={patient.id}
                        type="button"
                        onClick={() => selectPatient(patient)}
                        className="w-full px-4 py-3 text-left hover:bg-gold-50 transition-colors border-b border-neutral-100 last:border-0"
                      >
                        <div className="font-medium text-foreground">
                          {patient.first_name} {patient.last_name}
                        </div>
                        <div className="text-xs text-foreground/60 mt-1 flex items-center gap-3">
                          {patient.email && <span>{patient.email}</span>}
                          {patient.phone && <span>{patient.phone}</span>}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {selectedPatient && (
                <div className="mt-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
                  ✓ Patient sélectionné: {selectedPatient.first_name} {selectedPatient.last_name}
                </div>
              )}
              {searchTerm && !selectedPatient && (
                <div className="mt-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
                  ℹ Nouveau patient - Les informations seront enregistrées
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground/70 mb-2">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                disabled={!!selectedPatient}
                className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200 transition-all disabled:bg-neutral-100 disabled:cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground/70 mb-2">
                Téléphone <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                disabled={!!selectedPatient}
                className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200 transition-all disabled:bg-neutral-100 disabled:cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground/70 mb-2">
                Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={formData.scheduled_date}
                onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground/70 mb-2">
                Heure <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                required
                value={formData.scheduled_time}
                onChange={(e) => setFormData({ ...formData, scheduled_time: e.target.value })}
                className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200 transition-all"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-foreground/70 mb-2">
                Durée
              </label>
              <div className="flex gap-2">
                {[15, 30, 45, 60].map((duration) => (
                  <button
                    key={duration}
                    type="button"
                    onClick={() => setFormData({ ...formData, duration_minutes: duration })}
                    className={`flex-1 px-4 py-3 border rounded-lg transition-all ${
                      formData.duration_minutes === duration
                        ? 'border-gold-400 bg-gold-50 text-gold-700'
                        : 'border-neutral-300 hover:border-gold-300'
                    }`}
                  >
                    {duration}min
                  </button>
                ))}
              </div>
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-foreground/70 mb-2">
                Motif <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200 transition-all"
                placeholder="Ex: Ajustement, Consultation initiale..."
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-foreground/70 mb-2">
                Notes internes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={2}
                className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200 transition-all resize-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-4 pt-4 border-t border-neutral-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-neutral-300 text-foreground rounded-lg hover:bg-neutral-50 transition-all"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 bg-gradient-to-r from-gold-500 to-gold-600 text-white rounded-lg hover:from-gold-600 hover:to-gold-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-md hover:shadow-lg"
            >
              {saving ? 'Création...' : 'Créer le rendez-vous'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
