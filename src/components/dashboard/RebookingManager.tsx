import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import {
  Calendar,
  Clock,
  Send,
  CheckCircle,
  XCircle,
  AlertCircle,
  Phone,
  Mail,
  RefreshCw,
  Plus,
  Trash2,
} from 'lucide-react';
import { useToastContext } from '../../contexts/ToastContext';

interface Appointment {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  created_at: string;
}

interface RebookingRequest {
  id: string;
  appointment_id: string;
  patient_name: string;
  patient_email: string;
  reason: string;
  reason_category: string;
  status: string;
  priority: string;
  sent_at: string | null;
  expires_at: string;
  created_at: string;
}

interface TimeSlot {
  date: string;
  time: string;
  duration: number;
}

export default function RebookingManager() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [rebookingRequests, setRebookingRequests] = useState<RebookingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<string>('');
  const [formData, setFormData] = useState({
    reason: '',
    reasonCategory: 'patient_cancel' as const,
    priority: 'normal' as const,
    notes: '',
    expiresHours: 72,
  });
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([
    { date: '', time: '', duration: 30 },
  ]);
  const [sending, setSending] = useState<string | null>(null);
  const toast = useToastContext();

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [appointmentsResult, requestsResult] = await Promise.all([
        supabase
          .from('appointments_api')
          .select('*')
          .in('status', ['pending', 'confirmed'])
          .order('created_at', { ascending: false })
          .limit(20),
        supabase
          .from('rebooking_requests')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50),
      ]);

      if (appointmentsResult.error) throw appointmentsResult.error;
      if (requestsResult.error) throw requestsResult.error;

      setAppointments(appointmentsResult.data || []);
      setRebookingRequests(requestsResult.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  }

  function addTimeSlot() {
    setTimeSlots([...timeSlots, { date: '', time: '', duration: 30 }]);
  }

  function removeTimeSlot(index: number) {
    if (timeSlots.length > 1) {
      setTimeSlots(timeSlots.filter((_, i) => i !== index));
    }
  }

  function updateTimeSlot(index: number, field: keyof TimeSlot, value: string | number) {
    const updated = [...timeSlots];
    updated[index] = { ...updated[index], [field]: value };
    setTimeSlots(updated);
  }

  async function createRebookingRequest() {
    if (!selectedAppointment) {
      toast.error('Veuillez sélectionner un rendez-vous');
      return;
    }

    if (!formData.reason.trim()) {
      toast.error('Veuillez indiquer la raison');
      return;
    }

    const validSlots = timeSlots.filter((slot) => slot.date && slot.time);
    if (validSlots.length === 0) {
      toast.error('Veuillez ajouter au moins un créneau');
      return;
    }

    try {
      const slotsJsonb = validSlots.map((slot) => ({
        date: slot.date,
        time: slot.time,
        datetime: `${slot.date}T${slot.time}:00`,
        duration: slot.duration,
      }));

      const { data, error } = await supabase.rpc('create_rebooking_request', {
        p_appointment_id: selectedAppointment,
        p_reason: formData.reason,
        p_reason_category: formData.reasonCategory,
        p_priority: formData.priority,
        p_notes: formData.notes || null,
        p_time_slots: slotsJsonb,
        p_expires_hours: formData.expiresHours,
      });

      if (error) throw error;

      toast.success('Demande de reprise créée avec succès');
      setShowCreateModal(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Error creating rebooking request:', error);
      toast.error('Erreur lors de la création');
    }
  }

  async function sendRebookingEmail(requestId: string) {
    setSending(requestId);
    try {
      const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-rebooking-email`;

      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ rebooking_request_id: requestId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send email');
      }

      const result = await response.json();
      toast.success('Email de reprise envoyé avec succès');
      loadData();
    } catch (error) {
      console.error('Error sending rebooking email:', error);
      toast.error(`Erreur: ${error.message}`);
    } finally {
      setSending(null);
    }
  }

  function resetForm() {
    setSelectedAppointment('');
    setFormData({
      reason: '',
      reasonCategory: 'patient_cancel',
      priority: 'normal',
      notes: '',
      expiresHours: 72,
    });
    setTimeSlots([{ date: '', time: '', duration: 30 }]);
  }

  const statusColors: Record<string, string> = {
    pending: 'text-yellow-600 bg-yellow-50',
    sent: 'text-blue-600 bg-blue-50',
    opened: 'text-purple-600 bg-purple-50',
    accepted: 'text-green-600 bg-green-50',
    declined: 'text-red-600 bg-red-50',
    expired: 'text-gray-600 bg-gray-50',
    cancelled: 'text-gray-600 bg-gray-50',
  };

  const priorityColors: Record<string, string> = {
    low: 'text-gray-600 bg-gray-50',
    normal: 'text-blue-600 bg-blue-50',
    high: 'text-orange-600 bg-orange-50',
    urgent: 'text-red-600 bg-red-50',
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-heading text-foreground">Reprise de rendez-vous</h2>
          <p className="text-sm text-foreground/60 mt-1">
            Gestion des demandes de reprogrammation
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gold-500 text-white rounded-lg hover:bg-gold-600 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Nouvelle demande
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="p-4 border-2 border-neutral-200 bg-white">
          <div className="text-2xl font-light text-foreground">{rebookingRequests.length}</div>
          <div className="text-sm text-foreground/60">Total</div>
        </div>
        <div className="p-4 border-2 border-neutral-200 bg-white">
          <div className="text-2xl font-light text-yellow-600">
            {rebookingRequests.filter((r) => r.status === 'pending').length}
          </div>
          <div className="text-sm text-foreground/60">En attente</div>
        </div>
        <div className="p-4 border-2 border-neutral-200 bg-white">
          <div className="text-2xl font-light text-blue-600">
            {rebookingRequests.filter((r) => r.status === 'sent').length}
          </div>
          <div className="text-sm text-foreground/60">Envoyés</div>
        </div>
        <div className="p-4 border-2 border-neutral-200 bg-white">
          <div className="text-2xl font-light text-green-600">
            {rebookingRequests.filter((r) => r.status === 'accepted').length}
          </div>
          <div className="text-sm text-foreground/60">Acceptés</div>
        </div>
      </div>

      {/* Rebooking Requests List */}
      <div className="bg-white border-2 border-neutral-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-foreground/60 uppercase">
                  Patient
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-foreground/60 uppercase">
                  Raison
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-foreground/60 uppercase">
                  Priorité
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-foreground/60 uppercase">
                  Statut
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-foreground/60 uppercase">
                  Envoyé le
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-foreground/60 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {rebookingRequests.map((request) => (
                <motion.tr
                  key={request.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="hover:bg-neutral-50 transition-colors"
                >
                  <td className="px-4 py-4">
                    <div>
                      <div className="font-medium text-foreground">{request.patient_name}</div>
                      <div className="text-sm text-foreground/60">{request.patient_email}</div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="text-sm text-foreground max-w-xs truncate">
                      {request.reason}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-medium rounded ${
                        priorityColors[request.priority]
                      }`}
                    >
                      {request.priority}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-medium rounded ${
                        statusColors[request.status]
                      }`}
                    >
                      {request.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-sm text-foreground/60">
                    {request.sent_at
                      ? new Date(request.sent_at).toLocaleDateString('fr-CA')
                      : '-'}
                  </td>
                  <td className="px-4 py-4 text-right">
                    {request.status === 'pending' && (
                      <button
                        onClick={() => sendRebookingEmail(request.id)}
                        disabled={sending === request.id}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {sending === request.id ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            Envoi...
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4" />
                            Envoyer
                          </>
                        )}
                      </button>
                    )}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6 border-b border-neutral-200">
              <h3 className="text-xl font-heading text-foreground">
                Nouvelle demande de reprise
              </h3>
            </div>

            <div className="p-6 space-y-6">
              {/* Appointment Selection */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Rendez-vous
                </label>
                <select
                  value={selectedAppointment}
                  onChange={(e) => setSelectedAppointment(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-neutral-200 rounded-lg focus:border-gold-400 focus:outline-none"
                >
                  <option value="">Sélectionner un rendez-vous</option>
                  {appointments.map((apt) => (
                    <option key={apt.id} value={apt.id}>
                      {apt.name} - {apt.email}
                    </option>
                  ))}
                </select>
              </div>

              {/* Reason Category */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Catégorie
                </label>
                <select
                  value={formData.reasonCategory}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      reasonCategory: e.target.value as typeof formData.reasonCategory,
                    })
                  }
                  className="w-full px-4 py-2 border-2 border-neutral-200 rounded-lg focus:border-gold-400 focus:outline-none"
                >
                  <option value="patient_cancel">Annulation patient</option>
                  <option value="patient_no_show">Absence patient</option>
                  <option value="clinic_reschedule">Reprogrammation clinique</option>
                  <option value="emergency">Urgence</option>
                  <option value="other">Autre</option>
                </select>
              </div>

              {/* Reason */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Raison *
                </label>
                <textarea
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-neutral-200 rounded-lg focus:border-gold-400 focus:outline-none"
                  rows={3}
                  placeholder="Expliquez la raison de la reprogrammation..."
                />
              </div>

              {/* Priority */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Priorité
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      priority: e.target.value as typeof formData.priority,
                    })
                  }
                  className="w-full px-4 py-2 border-2 border-neutral-200 rounded-lg focus:border-gold-400 focus:outline-none"
                >
                  <option value="low">Basse</option>
                  <option value="normal">Normale</option>
                  <option value="high">Haute</option>
                  <option value="urgent">Urgente</option>
                </select>
              </div>

              {/* Time Slots */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Créneaux proposés *
                </label>
                <div className="space-y-3">
                  {timeSlots.map((slot, index) => (
                    <div key={index} className="flex gap-3 items-start">
                      <input
                        type="date"
                        value={slot.date}
                        onChange={(e) => updateTimeSlot(index, 'date', e.target.value)}
                        className="flex-1 px-4 py-2 border-2 border-neutral-200 rounded-lg focus:border-gold-400 focus:outline-none"
                      />
                      <input
                        type="time"
                        value={slot.time}
                        onChange={(e) => updateTimeSlot(index, 'time', e.target.value)}
                        className="flex-1 px-4 py-2 border-2 border-neutral-200 rounded-lg focus:border-gold-400 focus:outline-none"
                      />
                      <input
                        type="number"
                        value={slot.duration}
                        onChange={(e) =>
                          updateTimeSlot(index, 'duration', parseInt(e.target.value))
                        }
                        className="w-24 px-4 py-2 border-2 border-neutral-200 rounded-lg focus:border-gold-400 focus:outline-none"
                        placeholder="Min"
                      />
                      {timeSlots.length > 1 && (
                        <button
                          onClick={() => removeTimeSlot(index)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={addTimeSlot}
                    className="flex items-center gap-2 text-sm text-gold-600 hover:text-gold-700"
                  >
                    <Plus className="w-4 h-4" />
                    Ajouter un créneau
                  </button>
                </div>
              </div>

              {/* Expires Hours */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Expiration (heures)
                </label>
                <input
                  type="number"
                  value={formData.expiresHours}
                  onChange={(e) =>
                    setFormData({ ...formData, expiresHours: parseInt(e.target.value) })
                  }
                  className="w-full px-4 py-2 border-2 border-neutral-200 rounded-lg focus:border-gold-400 focus:outline-none"
                  min={1}
                  max={168}
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Notes internes (optionnel)
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-neutral-200 rounded-lg focus:border-gold-400 focus:outline-none"
                  rows={2}
                  placeholder="Notes pour l'équipe..."
                />
              </div>
            </div>

            <div className="p-6 border-t border-neutral-200 flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
                className="px-4 py-2 border-2 border-neutral-200 text-foreground rounded-lg hover:bg-neutral-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={createRebookingRequest}
                className="px-4 py-2 bg-gold-500 text-white rounded-lg hover:bg-gold-600 transition-colors"
              >
                Créer la demande
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
