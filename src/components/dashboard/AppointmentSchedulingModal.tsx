import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { X, Calendar as CalendarIcon, Clock, Save, Plus, Edit, Trash2, CheckCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Appointment } from '../../types/database';
import { useToastContext } from '../../contexts/ToastContext';

interface AppointmentSchedulingModalProps {
  patient: {
    id: string;
    full_name?: string;
    first_name?: string;
    last_name?: string;
    email: string | null;
    phone: string | null;
  };
  onClose: () => void;
  isOpen?: boolean;
}

const APPOINTMENT_TYPES = [
  'Consultation initiale',
  'Ajustement chiropratique',
  'Suivi régulier',
  'Traitement des tissus mous',
  'Évaluation posturale',
  'Réhabilitation',
  'Consultation urgente',
  'Autre'
];

const DURATIONS = [
  { value: 15, label: '15 minutes' },
  { value: 30, label: '30 minutes' },
  { value: 45, label: '45 minutes' },
  { value: 60, label: '1 heure' },
  { value: 90, label: '1h 30' },
  { value: 120, label: '2 heures' }
];

export function AppointmentSchedulingModal({ patient, onClose }: AppointmentSchedulingModalProps) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [saving, setSaving] = useState(false);
  const toast = useToastContext();

  const [formData, setFormData] = useState({
    scheduled_date: '',
    scheduled_time: '',
    duration_minutes: 30,
    reason: '',
    notes: ''
  });

  useEffect(() => {
    loadAppointments();
  }, [patient.id]);

  async function loadAppointments() {
    try {
      const { data, error } = await supabase
        .from('appointments_api')
        .select('*')
        .eq('contact_id', patient.id)
        .order('scheduled_date', { ascending: false });

      if (error) throw error;
      setAppointments(data || []);
    } catch (error) {
      console.error('Error loading appointments:', error);
      toast.showToast?.('Erreur lors du chargement des rendez-vous', 'error');
    } finally {
      setLoading(false);
    }
  }

  function handleNewAppointment() {
    setEditingAppointment(null);
    setFormData({
      scheduled_date: '',
      scheduled_time: '',
      duration_minutes: 30,
      reason: '',
      notes: ''
    });
    setShowForm(true);
  }

  function handleEditAppointment(appointment: Appointment) {
    setEditingAppointment(appointment);

    setFormData({
      scheduled_date: appointment.scheduled_date || '',
      scheduled_time: appointment.scheduled_time || '',
      duration_minutes: appointment.duration_minutes || 30,
      reason: appointment.reason || '',
      notes: appointment.notes || ''
    });
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.showToast?.('❌ Utilisateur non authentifié', 'error');
        setSaving(false);
        return;
      }

      const patientName = patient.full_name || `${patient.first_name || ''} ${patient.last_name || ''}`.trim();

      const appointmentData = {
        owner_id: user.id,
        contact_id: patient.id,
        name: patientName,
        email: patient.email || '',
        phone: patient.phone || '',
        scheduled_date: formData.scheduled_date || null,
        scheduled_time: formData.scheduled_time || null,
        duration_minutes: formData.duration_minutes,
        reason: formData.reason,
        notes: formData.notes || null,
        status: 'confirmed' as const
      };

      if (editingAppointment) {
        const { error } = await supabase
          .from('appointments_api')
          .update(appointmentData)
          .eq('id', editingAppointment.id);

        if (error) throw error;
        toast.showToast?.('✅ Rendez-vous modifié avec succès', 'success');
      } else {
        const { error } = await supabase
          .from('appointments_api')
          .insert([appointmentData]);

        if (error) throw error;
        toast.showToast?.('✅ Rendez-vous créé avec succès', 'success');
      }

      setShowForm(false);
      setEditingAppointment(null);
      loadAppointments();
    } catch (error: any) {
      console.error('Error saving appointment:', error);
      toast.showToast?.('❌ Erreur: ' + (error.message || 'Erreur inconnue'), 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(appointmentId: string) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce rendez-vous?')) return;

    try {
      const { error } = await supabase
        .from('appointments_api')
        .delete()
        .eq('id', appointmentId);

      if (error) throw error;
      toast.showToast?.('✅ Rendez-vous supprimé', 'success');
      loadAppointments();
    } catch (error) {
      console.error('Error deleting appointment:', error);
      toast.showToast?.('❌ Erreur lors de la suppression', 'error');
    }
  }

  async function handleUpdateStatus(appointmentId: string, status: string) {
    try {
      const { error } = await supabase
        .from('appointments_api')
        .update({ status })
        .eq('id', appointmentId);

      if (error) throw error;
      toast.showToast?.('✅ Statut mis à jour', 'success');
      loadAppointments();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.showToast?.('❌ Erreur lors de la mise à jour', 'error');
    }
  }

  const upcomingAppointments = appointments.filter(
    apt => apt.scheduled_date && new Date(apt.scheduled_date) >= new Date() && apt.status !== 'cancelled'
  );
  const pastAppointments = appointments.filter(
    apt => !apt.scheduled_date || new Date(apt.scheduled_date) < new Date() || apt.status === 'completed'
  );

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white w-full max-w-5xl my-6 shadow-lifted"
      >
        <div className="sticky top-0 bg-white border-b border-neutral-200 p-6 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <CalendarIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-heading text-foreground">Rendez-vous</h3>
              <p className="text-sm text-foreground/60 mt-1">
                {patient.full_name || `${patient.first_name || ''} ${patient.last_name || ''}`.trim()} - {appointments.length} rendez-vous
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!showForm && (
              <button
                onClick={handleNewAppointment}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 transition-all duration-300 shadow-soft"
              >
                <Plus className="w-4 h-4" />
                <span>Nouveau rendez-vous</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {showForm ? (
            <form onSubmit={handleSubmit} className="space-y-6 bg-neutral-50 border border-neutral-200 p-6 rounded-lg">
              <h4 className="text-lg font-medium text-foreground mb-4">
                {editingAppointment ? 'Modifier le rendez-vous' : 'Nouveau rendez-vous'}
              </h4>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-foreground/70 mb-2">
                    Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.scheduled_date}
                    onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                    className="w-full px-4 py-3 border border-neutral-300 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all"
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
                    className="w-full px-4 py-3 border border-neutral-300 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground/70 mb-2">
                  Durée <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.duration_minutes}
                  onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) })}
                  className="w-full px-4 py-3 border border-neutral-300 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all"
                >
                  {DURATIONS.map((duration) => (
                    <option key={duration.value} value={duration.value}>
                      {duration.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground/70 mb-2">
                  Type de rendez-vous <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  className="w-full px-4 py-3 border border-neutral-300 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all"
                >
                  <option value="">Sélectionner un type...</option>
                  {APPOINTMENT_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground/70 mb-2">
                  Notes internes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 border border-neutral-300 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all resize-none"
                  placeholder="Notes pour usage interne..."
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-300">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingAppointment(null);
                  }}
                  className="px-6 py-3 border border-neutral-300 text-foreground hover:bg-neutral-50 transition-all"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-soft"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? 'Enregistrement...' : 'Enregistrer'}</span>
                </button>
              </div>
            </form>
          ) : loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : appointments.length === 0 ? (
            <div className="text-center py-12">
              <CalendarIcon className="w-16 h-16 text-foreground/20 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-foreground mb-2">
                Aucun rendez-vous
              </h4>
              <p className="text-foreground/60 mb-6">
                Planifiez le premier rendez-vous pour ce patient
              </p>
              <button
                onClick={handleNewAppointment}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 transition-all duration-300 shadow-soft"
              >
                <Plus className="w-4 h-4" />
                <span>Créer un rendez-vous</span>
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {upcomingAppointments.length > 0 && (
                <div>
                  <h4 className="text-lg font-medium text-foreground mb-4">
                    Rendez-vous à venir ({upcomingAppointments.length})
                  </h4>
                  <div className="space-y-3">
                    {upcomingAppointments.map((appointment) => (
                      <AppointmentCard
                        key={appointment.id}
                        appointment={appointment}
                        onEdit={handleEditAppointment}
                        onDelete={handleDelete}
                        onUpdateStatus={handleUpdateStatus}
                      />
                    ))}
                  </div>
                </div>
              )}

              {pastAppointments.length > 0 && (
                <div>
                  <h4 className="text-lg font-medium text-foreground mb-4">
                    Rendez-vous passés ({pastAppointments.length})
                  </h4>
                  <div className="space-y-3">
                    {pastAppointments.map((appointment) => (
                      <AppointmentCard
                        key={appointment.id}
                        appointment={appointment}
                        onEdit={handleEditAppointment}
                        onDelete={handleDelete}
                        onUpdateStatus={handleUpdateStatus}
                        isPast={true}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

function AppointmentCard({
  appointment,
  onEdit,
  onDelete,
  onUpdateStatus,
  isPast = false
}: {
  appointment: Appointment;
  onEdit: (appointment: Appointment) => void;
  onDelete: (id: string) => void;
  onUpdateStatus: (id: string, status: string) => void;
  isPast?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white border border-neutral-200 shadow-soft p-4 flex items-start justify-between ${
        isPast ? 'opacity-75' : ''
      }`}
    >
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center">
            <CalendarIcon className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <div className="font-medium text-foreground">
              {appointment.reason || 'Rendez-vous'}
            </div>
            <div className="flex items-center gap-2 text-sm text-foreground/60">
              <CalendarIcon className="w-4 h-4" />
              {appointment.scheduled_date
                ? new Date(appointment.scheduled_date).toLocaleDateString('fr-CA', {
                    weekday: 'short',
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })
                : 'Date non définie'}
              {appointment.scheduled_time && (
                <>
                  <Clock className="w-4 h-4 ml-2" />
                  {appointment.scheduled_time}
                </>
              )}
              <span className="ml-2">({appointment.duration_minutes || 30} min)</span>
            </div>
          </div>
          <span
            className={`text-xs px-2 py-1 rounded-full ${
              appointment.status === 'confirmed'
                ? 'bg-green-100 text-green-700'
                : appointment.status === 'completed'
                ? 'bg-neutral-100 text-neutral-600'
                : appointment.status === 'cancelled'
                ? 'bg-red-100 text-red-700'
                : 'bg-gold-100 text-gold-700'
            }`}
          >
            {appointment.status === 'confirmed' && 'Confirmé'}
            {appointment.status === 'completed' && 'Complété'}
            {appointment.status === 'cancelled' && 'Annulé'}
            {appointment.status === 'pending' && 'En attente'}
            {appointment.status === 'no_show' && 'Absent'}
          </span>
        </div>
        {appointment.notes && (
          <div className="text-sm text-foreground/70 ml-13">
            {appointment.notes}
          </div>
        )}
      </div>
      <div className="flex items-center gap-2 ml-4">
        {!isPast && appointment.status === 'confirmed' && (
          <button
            onClick={() => onUpdateStatus(appointment.id, 'completed')}
            className="p-2 hover:bg-green-50 rounded-lg transition-colors group"
            title="Marquer comme complété"
          >
            <CheckCircle className="w-5 h-5 text-green-600" />
          </button>
        )}
        <button
          onClick={() => onEdit(appointment)}
          className="p-2 hover:bg-blue-50 rounded-lg transition-colors group"
          title="Modifier"
        >
          <Edit className="w-5 h-5 text-blue-600" />
        </button>
        <button
          onClick={() => onDelete(appointment.id)}
          className="p-2 hover:bg-red-50 rounded-lg transition-colors group"
          title="Supprimer"
        >
          <Trash2 className="w-5 h-5 text-red-400 group-hover:text-red-600" />
        </button>
      </div>
    </motion.div>
  );
}
