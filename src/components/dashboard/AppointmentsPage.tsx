import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Calendar } from './Calendar';
import { Plus, X, Clock, Mail, Phone, Calendar as CalendarIcon, Upload, Download } from 'lucide-react';
import type { Appointment } from '../../types/database';
import { useToastContext } from '../../contexts/ToastContext';
import { CSVImportModal } from './CSVImportModal';
import { exportAppointmentsToCSV } from '../../lib/exportUtils';

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

export function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showNewAppointmentModal, setShowNewAppointmentModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'calendar' | 'list'>('calendar');
  const toast = useToastContext();

  useEffect(() => {
    loadAppointments();
  }, []);

  async function loadAppointments() {
    try {
      const { data, error } = await supabase
        .from('appointments_api')
        .select('*')
        .not('scheduled_date', 'is', null)
        .order('scheduled_date', { ascending: true });

      if (error) throw error;
      setAppointments(data || []);
    } catch (error) {
      console.error('Error loading appointments:', error);
      toast.error('Erreur lors du chargement des rendez-vous');
    } finally {
      setLoading(false);
    }
  }

  function handleDateSelect(date: Date) {
    setSelectedDate(date);
  }

  function handleAddAppointment(date: Date) {
    setSelectedDate(date);
    setShowNewAppointmentModal(true);
  }

  function handleExport() {
    try {
      exportAppointmentsToCSV(appointments);
      toast.success(`${appointments.length} rendez-vous exportés`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Erreur lors de l\'export');
    }
  }

  const selectedDateAppointments = selectedDate
    ? appointments.filter((apt) => {
        const aptDate = new Date(apt.scheduled_date || '');
        return aptDate.toDateString() === selectedDate.toDateString();
      })
    : [];

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
          <h2 className="text-2xl font-heading text-foreground">Calendrier des rendez-vous</h2>
          <p className="text-sm text-foreground/60 mt-1">
            {appointments.length} rendez-vous planifiés
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-2 px-4 py-2 border border-neutral-300 text-foreground hover:border-blue-400 hover:bg-blue-50 transition-all"
          >
            <Upload className="w-4 h-4" />
            <span className="font-light">Importer CSV</span>
          </button>
          <button
            onClick={handleExport}
            disabled={appointments.length === 0}
            className="flex items-center gap-2 px-4 py-2 border border-neutral-300 text-foreground hover:border-gold-400 hover:bg-gold-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <Download className="w-4 h-4" />
            <span className="font-light">Exporter CSV</span>
          </button>
          <div className="flex border border-neutral-300 overflow-hidden">
            <button
              onClick={() => setView('calendar')}
              className={`px-4 py-2 text-sm transition-colors ${
                view === 'calendar'
                  ? 'bg-gradient-to-r from-gold-500 to-gold-600 text-white'
                  : 'bg-white text-foreground hover:bg-neutral-50'
              }`}
            >
              <CalendarIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => setView('list')}
              className={`px-4 py-2 text-sm transition-colors ${
                view === 'list'
                  ? 'bg-gradient-to-r from-gold-500 to-gold-600 text-white'
                  : 'bg-white text-foreground hover:bg-neutral-50'
              }`}
            >
              Liste
            </button>
          </div>
          <button
            onClick={() => setShowNewAppointmentModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-gold-500 to-gold-600 text-white rounded hover:from-gold-600 hover:to-gold-700 transition-all duration-300 shadow-soft hover:shadow-gold"
          >
            <Plus className="w-4 h-4" />
            <span className="font-light">Nouveau RDV</span>
          </button>
        </div>
      </div>

      {view === 'calendar' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Calendar
              appointments={appointments}
              onDateSelect={handleDateSelect}
              onAddAppointment={handleAddAppointment}
            />
          </div>

          <div className="bg-white border border-neutral-200 shadow-soft-lg p-6">
            <h3 className="text-lg font-heading text-foreground mb-4">
              {selectedDate
                ? `${selectedDate.toLocaleDateString('fr-CA', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                  })}`
                : 'Sélectionnez une date'}
            </h3>

            {selectedDate && selectedDateAppointments.length === 0 && (
              <div className="text-center py-8">
                <CalendarIcon className="w-12 h-12 text-foreground/20 mx-auto mb-3" />
                <p className="text-sm text-foreground/60 mb-4">Aucun rendez-vous ce jour</p>
                <button
                  onClick={() => handleAddAppointment(selectedDate)}
                  className="text-sm text-gold-600 hover:text-gold-700 font-medium"
                >
                  + Ajouter un rendez-vous
                </button>
              </div>
            )}

            <div className="space-y-3">
              {selectedDateAppointments.map((apt) => (
                <motion.div
                  key={apt.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="p-4 bg-gradient-to-br from-gold-50 to-gold-100 border border-gold-200 hover:border-gold-300 transition-all"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="font-medium text-foreground">{apt.name}</div>
                    <div className="text-xs text-foreground/60 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {apt.scheduled_time || '09:00'} ({apt.duration_minutes || 30}min)
                    </div>
                  </div>
                  <div className="text-sm text-foreground/70">{apt.reason}</div>
                  <div className={`mt-2 text-xs px-2 py-1 inline-block rounded-full ${
                    apt.status === 'confirmed'
                      ? 'bg-green-100 text-green-700'
                      : apt.status === 'pending'
                      ? 'bg-gold-100 text-gold-700'
                      : 'bg-neutral-100 text-neutral-600'
                  }`}>
                    {apt.status === 'confirmed' && 'Confirmé'}
                    {apt.status === 'pending' && 'En attente'}
                    {apt.status === 'completed' && 'Complété'}
                    {apt.status === 'cancelled' && 'Annulé'}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <UpcomingAppointmentsList appointments={appointments} onRefresh={loadAppointments} />
      )}

      {showNewAppointmentModal && (
        <NewAppointmentModal
          selectedDate={selectedDate}
          onClose={() => {
            setShowNewAppointmentModal(false);
            setSelectedDate(null);
          }}
          onSuccess={() => {
            loadAppointments();
            setShowNewAppointmentModal(false);
            setSelectedDate(null);
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

function UpcomingAppointmentsList({
  appointments,
  onRefresh,
}: {
  appointments: Appointment[];
  onRefresh: () => void;
}) {
  const toast = useToastContext();
  const now = new Date();
  const upcoming = appointments
    .filter((apt) => {
      if (!apt.scheduled_date) return false;
      const aptDate = new Date(apt.scheduled_date);
      return aptDate >= now && apt.status !== 'cancelled' && apt.status !== 'completed';
    })
    .slice(0, 20);

  async function handleStatusUpdate(id: string, status: string) {
    try {
      const { error } = await supabase
        .from('appointments_api')
        .update({ status })
        .eq('id', id);

      if (error) throw error;
      toast.success('Statut mis à jour');
      onRefresh();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Erreur lors de la mise à jour');
    }
  }

  return (
    <div className="bg-white border border-neutral-200 shadow-soft-lg">
      <div className="p-6 border-b border-neutral-200">
        <h3 className="text-lg font-heading text-foreground">
          Rendez-vous à venir ({upcoming.length})
        </h3>
      </div>
      <div className="divide-y divide-neutral-200">
        {upcoming.map((apt) => (
          <div key={apt.id} className="p-6 hover:bg-neutral-50 transition-colors">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center text-white font-medium">
                    {apt.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground">{apt.name}</h4>
                    <p className="text-sm text-foreground/60">
                      {new Date(apt.scheduled_date || '').toLocaleDateString('fr-CA', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                      })}{' '}
                      à {apt.scheduled_time || '09:00'}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-foreground/80 mb-2">{apt.reason}</p>
                <div className="flex items-center gap-4 text-xs text-foreground/60">
                  <span className="flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    {apt.phone}
                  </span>
                  <span className="flex items-center gap-1">
                    <Mail className="w-3 h-3" />
                    {apt.email}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 ml-4">
                {apt.status === 'pending' && (
                  <button
                    onClick={() => handleStatusUpdate(apt.id, 'confirmed')}
                    className="px-4 py-2 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg transition-colors text-sm"
                  >
                    Confirmer
                  </button>
                )}
                {apt.status === 'confirmed' && (
                  <button
                    onClick={() => handleStatusUpdate(apt.id, 'completed')}
                    className="px-4 py-2 bg-neutral-100 text-foreground hover:bg-neutral-200 rounded-lg transition-colors text-sm"
                  >
                    Complété
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
        {upcoming.length === 0 && (
          <div className="p-12 text-center">
            <CalendarIcon className="w-12 h-12 text-foreground/20 mx-auto mb-3" />
            <p className="text-foreground/60">Aucun rendez-vous à venir</p>
          </div>
        )}
      </div>
    </div>
  );
}

function NewAppointmentModal({
  selectedDate,
  onClose,
  onSuccess,
}: {
  selectedDate: Date | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState<NewAppointmentForm>({
    name: '',
    email: '',
    phone: '',
    reason: '',
    scheduled_date: selectedDate?.toISOString().split('T')[0] || '',
    scheduled_time: '09:00',
    duration_minutes: 30,
    notes: '',
  });
  const [saving, setSaving] = useState(false);
  const toast = useToastContext();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      const { error } = await supabase.from('appointments_api').insert({
        ...formData,
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
        className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg shadow-lifted"
      >
        <div className="sticky top-0 bg-white border-b border-neutral-200 p-6 flex items-center justify-between z-10">
          <h3 className="text-2xl font-heading text-foreground">Nouveau rendez-vous</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-foreground/70 mb-2">
                Nom complet <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 border border-neutral-300 rounded focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200 transition-all"
              />
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
                className="w-full px-4 py-3 border border-neutral-300 rounded focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200 transition-all"
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
                className="w-full px-4 py-3 border border-neutral-300 rounded focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200 transition-all"
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
                className="w-full px-4 py-3 border border-neutral-300 rounded focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200 transition-all"
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
                className="w-full px-4 py-3 border border-neutral-300 rounded focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200 transition-all"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-foreground/70 mb-2">
                Durée (minutes)
              </label>
              <select
                value={formData.duration_minutes}
                onChange={(e) =>
                  setFormData({ ...formData, duration_minutes: parseInt(e.target.value) })
                }
                className="w-full px-4 py-3 border border-neutral-300 rounded focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200 transition-all"
              >
                <option value="15">15 minutes</option>
                <option value="30">30 minutes</option>
                <option value="45">45 minutes</option>
                <option value="60">1 heure</option>
                <option value="90">1h30</option>
                <option value="120">2 heures</option>
              </select>
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-foreground/70 mb-2">
                Motif de consultation <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                rows={3}
                className="w-full px-4 py-3 border border-neutral-300 rounded focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200 transition-all resize-none"
                placeholder="Ex: Consultation initiale, suivi, douleurs..."
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
                className="w-full px-4 py-3 border border-neutral-300 rounded focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200 transition-all resize-none"
                placeholder="Notes pour l'équipe..."
              />
            </div>
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
              className="px-6 py-3 bg-gradient-to-r from-gold-500 to-gold-600 text-white rounded hover:from-gold-600 hover:to-gold-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-soft hover:shadow-gold"
            >
              {saving ? 'Création...' : 'Créer le rendez-vous'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
