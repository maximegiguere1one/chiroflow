import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Calendar as CalendarIcon, Clock, CheckCircle, XCircle, Phone, Mail, User } from 'lucide-react';

interface Appointment {
  id: string;
  name: string;
  email: string;
  phone: string;
  reason: string;
  patient_age?: string;
  preferred_time?: string;
  status: string;
  created_at: string;
}

export default function AppointmentManager() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed' | 'completed'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAppointments();
  }, []);

  async function loadAppointments() {
    try {
      const { data, error } = await supabase
        .from('appointments_api')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAppointments(data || []);
    } catch (error) {
      console.error('Error loading appointments:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateStatus(id: string, status: string) {
    try {
      const { error } = await supabase
        .from('appointments_api')
        .update({ status })
        .eq('id', id);

      if (error) throw error;

      loadAppointments();

      if (status === 'confirmed') {
        alert('Rendez-vous confirmé! Un email de confirmation a été envoyé au patient.');
      }
    } catch (error) {
      console.error('Error updating appointment:', error);
      alert('Erreur lors de la mise à jour');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette demande?')) return;

    try {
      const { error } = await supabase
        .from('appointments_api')
        .delete()
        .eq('id', id);

      if (error) throw error;
      loadAppointments();
    } catch (error) {
      console.error('Error deleting appointment:', error);
    }
  }

  const filteredAppointments = filter === 'all'
    ? appointments
    : appointments.filter(a => a.status === filter);

  const stats = {
    total: appointments.length,
    pending: appointments.filter(a => a.status === 'pending').length,
    confirmed: appointments.filter(a => a.status === 'confirmed').length,
    completed: appointments.filter(a => a.status === 'completed').length
  };

  if (loading) {
    return <div className="flex items-center justify-center py-12">
      <div className="w-8 h-8 border-4 border-gold-400 border-t-transparent rounded-full animate-spin" />
    </div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-heading text-foreground">Rendez-vous</h2>
        <p className="text-sm text-foreground/60 mt-1">Gestion des demandes et planification</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <button
          onClick={() => setFilter('all')}
          className={`p-4 border-2 transition-all ${
            filter === 'all'
              ? 'border-gold-400 bg-gold-50'
              : 'border-neutral-200 bg-white hover:border-gold-200'
          }`}
        >
          <div className="text-2xl font-light text-foreground">{stats.total}</div>
          <div className="text-sm text-foreground/60">Total</div>
        </button>

        <button
          onClick={() => setFilter('pending')}
          className={`p-4 border-2 transition-all ${
            filter === 'pending'
              ? 'border-gold-400 bg-gold-50'
              : 'border-neutral-200 bg-white hover:border-gold-200'
          }`}
        >
          <div className="text-2xl font-light text-gold-600">{stats.pending}</div>
          <div className="text-sm text-foreground/60">En attente</div>
        </button>

        <button
          onClick={() => setFilter('confirmed')}
          className={`p-4 border-2 transition-all ${
            filter === 'confirmed'
              ? 'border-gold-400 bg-gold-50'
              : 'border-neutral-200 bg-white hover:border-gold-200'
          }`}
        >
          <div className="text-2xl font-light text-green-600">{stats.confirmed}</div>
          <div className="text-sm text-foreground/60">Confirmés</div>
        </button>

        <button
          onClick={() => setFilter('completed')}
          className={`p-4 border-2 transition-all ${
            filter === 'completed'
              ? 'border-gold-400 bg-gold-50'
              : 'border-neutral-200 bg-white hover:border-gold-200'
          }`}
        >
          <div className="text-2xl font-light text-neutral-600">{stats.completed}</div>
          <div className="text-sm text-foreground/60">Complétés</div>
        </button>
      </div>

      {/* Appointments List */}
      <div className="bg-white border border-neutral-200 shadow-soft-lg">
        {filteredAppointments.length === 0 ? (
          <div className="text-center py-12">
            <CalendarIcon className="w-12 h-12 text-foreground/20 mx-auto mb-3" />
            <p className="text-foreground/60">Aucun rendez-vous</p>
          </div>
        ) : (
          <div className="divide-y divide-neutral-200">
            {filteredAppointments.map((appointment) => (
              <motion.div
                key={appointment.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-6 hover:bg-neutral-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center text-white font-medium">
                        {appointment.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-foreground">
                          {appointment.name}
                        </h3>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          appointment.status === 'pending'
                            ? 'bg-gold-100 text-gold-700'
                            : appointment.status === 'confirmed'
                            ? 'bg-green-100 text-green-700'
                            : appointment.status === 'completed'
                            ? 'bg-neutral-100 text-neutral-600'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {appointment.status === 'pending' && 'En attente'}
                          {appointment.status === 'confirmed' && 'Confirmé'}
                          {appointment.status === 'completed' && 'Complété'}
                          {appointment.status === 'cancelled' && 'Annulé'}
                        </span>
                      </div>
                    </div>

                    <div className="ml-13 space-y-2">
                      <p className="text-foreground/90">
                        <span className="font-medium">Motif:</span> {appointment.reason}
                      </p>

                      <div className="grid grid-cols-2 gap-4 text-sm text-foreground/70">
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4" />
                          {appointment.phone}
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4" />
                          {appointment.email}
                        </div>
                        {appointment.patient_age && (
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                            Âge: {appointment.patient_age}
                          </div>
                        )}
                        {appointment.preferred_time && (
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            {appointment.preferred_time}
                          </div>
                        )}
                      </div>

                      <div className="text-xs text-foreground/50">
                        Demandé le {new Date(appointment.created_at).toLocaleDateString('fr-CA', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 ml-4">
                    {appointment.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleUpdateStatus(appointment.id, 'confirmed')}
                          className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg transition-colors"
                          title="Confirmer"
                        >
                          <CheckCircle className="w-5 h-5" />
                          <span className="text-sm font-medium">Confirmer</span>
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(appointment.id, 'cancelled')}
                          className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                          title="Refuser"
                        >
                          <XCircle className="w-5 h-5" />
                          <span className="text-sm font-medium">Refuser</span>
                        </button>
                      </>
                    )}

                    {appointment.status === 'confirmed' && (
                      <button
                        onClick={() => handleUpdateStatus(appointment.id, 'completed')}
                        className="flex items-center gap-2 px-4 py-2 bg-neutral-100 text-foreground hover:bg-neutral-200 rounded-lg transition-colors"
                      >
                        <CheckCircle className="w-5 h-5" />
                        <span className="text-sm font-medium">Marquer complété</span>
                      </button>
                    )}

                    <button
                      onClick={() => handleDelete(appointment.id)}
                      className="p-2 hover:bg-red-50 rounded-lg transition-colors group"
                      title="Supprimer"
                    >
                      <XCircle className="w-5 h-5 text-red-400 group-hover:text-red-600" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
