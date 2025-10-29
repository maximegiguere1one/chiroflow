import { useState, useEffect, useCallback } from 'react';
import { Calendar, Clock, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface PatientAppointmentsProps {
  patientId: string;
}

export default function PatientAppointments({ patientId }: PatientAppointmentsProps) {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAppointments = useCallback(async () => {
    if (!patientId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('appointments')
        .select('*')
        .eq('patient_id', patientId)
        .order('scheduled_date', { ascending: false });

      if (fetchError) throw fetchError;
      setAppointments(data || []);
    } catch (err: any) {
      console.error('Error loading appointments:', err);
      setError('Erreur lors du chargement des rendez-vous');
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-gold-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-heading text-foreground mb-4">Mes rendez-vous</h2>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-red-800 font-medium">{error}</p>
              <button
                onClick={loadAppointments}
                className="text-sm text-red-600 hover:text-red-700 font-medium mt-1 underline"
              >
                Réessayer
              </button>
            </div>
          </div>
        )}

        {!error && appointments.length === 0 ? (
          <div className="text-center py-12 bg-neutral-50 border border-neutral-200 rounded-lg">
            <Calendar className="w-12 h-12 text-foreground/20 mx-auto mb-3" />
            <p className="text-foreground/60">Aucun rendez-vous pour le moment</p>
          </div>
        ) : (
          <div className="space-y-4">
            {appointments.map((appointment) => (
              <div
                key={appointment.id}
                className="bg-white border border-neutral-200 p-6 rounded-lg shadow-soft hover:shadow-soft-lg transition-all"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="w-4 h-4 text-gold-600" />
                      <span className="font-medium text-foreground">
                        {appointment.scheduled_date
                          ? new Date(appointment.scheduled_date).toLocaleDateString('fr-CA', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })
                          : 'Date à confirmer'}
                      </span>
                    </div>
                    {appointment.scheduled_time && (
                      <div className="flex items-center gap-2 text-sm text-foreground/70">
                        <Clock className="w-4 h-4" />
                        <span>{appointment.scheduled_time}</span>
                      </div>
                    )}
                    <p className="mt-2 text-foreground/80">{appointment.reason}</p>
                  </div>
                  <span
                    className={`px-3 py-1 text-xs font-medium rounded-full ${
                      appointment.status === 'confirmed'
                        ? 'bg-green-100 text-green-700'
                        : appointment.status === 'pending'
                        ? 'bg-orange-100 text-orange-700'
                        : appointment.status === 'completed'
                        ? 'bg-blue-100 text-blue-700'
                        : appointment.status === 'cancelled'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-neutral-100 text-neutral-700'
                    }`}
                  >
                    {appointment.status === 'confirmed' && 'Confirmé'}
                    {appointment.status === 'pending' && 'En attente'}
                    {appointment.status === 'completed' && 'Terminé'}
                    {appointment.status === 'cancelled' && 'Annulé'}
                    {appointment.status === 'no_show' && 'Absent'}
                    {!['confirmed', 'pending', 'completed', 'cancelled', 'no_show'].includes(appointment.status) && appointment.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
