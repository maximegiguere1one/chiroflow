import { useState, useEffect, useCallback } from 'react';
import { Calendar, Clock, AlertCircle, X, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import RescheduleModal from './RescheduleModal';

interface PatientAppointmentsProps {
  patientId: string;
  patientUserId?: string;
}

interface CancellationModal {
  show: boolean;
  appointment: any;
  canCancelFree: boolean;
  hoursUntil: number;
}

export default function PatientAppointments({ patientId, patientUserId }: PatientAppointmentsProps) {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [cancelModal, setCancelModal] = useState<CancellationModal>({
    show: false,
    appointment: null,
    canCancelFree: true,
    hoursUntil: 0,
  });

  const [rescheduleModal, setRescheduleModal] = useState<{
    show: boolean;
    appointment: any | null;
  }>({
    show: false,
    appointment: null,
  });

  const loadAppointments = useCallback(async () => {
    if (!patientId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('appointments_api')
        .select('*')
        .eq('patient_id', patientId)
        .in('status', ['pending', 'confirmed'])
        .gte('scheduled_date', new Date().toISOString().split('T')[0])
        .order('scheduled_date', { ascending: true })
        .order('scheduled_time', { ascending: true });

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

  function calculateHoursUntilAppointment(appointment: any): number {
    if (!appointment.scheduled_date || !appointment.scheduled_time) return 0;

    const appointmentDateTime = new Date(`${appointment.scheduled_date}T${appointment.scheduled_time}`);
    const now = new Date();
    const diffMs = appointmentDateTime.getTime() - now.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    return Math.max(0, diffHours);
  }

  function canCancelWithoutFee(appointment: any): boolean {
    const hoursUntil = calculateHoursUntilAppointment(appointment);
    return hoursUntil >= 24;
  }

  function handleOpenCancelModal(appointment: any) {
    const hoursUntil = calculateHoursUntilAppointment(appointment);
    const canCancelFree = canCancelWithoutFee(appointment);

    setCancelModal({
      show: true,
      appointment,
      canCancelFree,
      hoursUntil,
    });
  }

  function handleCloseCancelModal() {
    setCancelModal({
      show: false,
      appointment: null,
      canCancelFree: true,
      hoursUntil: 0,
    });
  }

  async function handleConfirmCancel() {
    if (!cancelModal.appointment) return;

    setCancelling(true);

    try {
      const { error: updateError } = await supabase
        .from('appointments_api')
        .update({
          status: 'cancelled',
          cancellation_reason: cancelModal.canCancelFree
            ? 'Annulé par le patient (>24h)'
            : 'Annulé par le patient (<24h)',
          cancelled_at: new Date().toISOString(),
        })
        .eq('id', cancelModal.appointment.id);

      if (updateError) throw updateError;

      await loadAppointments();
      handleCloseCancelModal();

    } catch (err: any) {
      console.error('Error cancelling appointment:', err);
      alert('Erreur lors de l\'annulation: ' + err.message);
    } finally {
      setCancelling(false);
    }
  }

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
        <h2 className="text-xl font-heading text-foreground mb-4">Mes rendez-vous à venir</h2>

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
            <p className="text-foreground/70 mb-1">Aucun rendez-vous à venir</p>
            <p className="text-sm text-foreground/50">Réservez un rendez-vous dans l'onglet "Réserver"</p>
          </div>
        ) : (
          <div className="space-y-4">
            {appointments.map((appointment) => {
              const hoursUntil = calculateHoursUntilAppointment(appointment);
              const canCancelFree = canCancelWithoutFee(appointment);

              return (
                <div
                  key={appointment.id}
                  className="bg-white border border-neutral-200 p-6 rounded-lg shadow-soft hover:shadow-soft-lg transition-all"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
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
                        <div className="flex items-center gap-2 text-sm text-foreground/70 mb-2">
                          <Clock className="w-4 h-4" />
                          <span>{appointment.scheduled_time}</span>
                        </div>
                      )}
                      <p className="text-foreground/80 mb-3">{appointment.reason}</p>

                      {appointment.notes && (
                        <div className="text-sm text-foreground/60 bg-neutral-50 p-3 rounded border border-neutral-200 mb-3">
                          <span className="font-medium">Notes: </span>
                          {appointment.notes}
                        </div>
                      )}

                      <div className="flex items-center gap-3">
                        <span
                          className={`px-3 py-1 text-xs font-medium rounded-full ${
                            appointment.status === 'confirmed'
                              ? 'bg-green-100 text-green-700'
                              : appointment.status === 'pending'
                              ? 'bg-orange-100 text-orange-700'
                              : 'bg-neutral-100 text-neutral-700'
                          }`}
                        >
                          {appointment.status === 'confirmed' && 'Confirmé'}
                          {appointment.status === 'pending' && 'En attente de confirmation'}
                        </span>

                        {hoursUntil < 24 && hoursUntil > 0 && (
                          <span className="text-xs text-orange-600 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Dans {Math.floor(hoursUntil)}h
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => setRescheduleModal({ show: true, appointment })}
                        className="px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 border border-blue-200 hover:border-blue-300 rounded-lg transition-all flex items-center gap-2"
                        title="Reprogrammer"
                      >
                        <RefreshCw className="w-4 h-4" />
                        Reprogrammer
                      </button>
                      <button
                        onClick={() => handleOpenCancelModal(appointment)}
                        className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 border border-red-200 hover:border-red-300 rounded-lg transition-all"
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!error && appointments.length > 0 && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Politique d'annulation</p>
                <p>
                  Les annulations doivent être effectuées au moins <strong>24 heures</strong> avant le rendez-vous
                  pour éviter des frais d'annulation.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {cancelModal.show && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-neutral-200">
              <h3 className="text-xl font-heading text-foreground">Annuler le rendez-vous</h3>
              <button
                onClick={handleCloseCancelModal}
                className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-gold-600" />
                  <span className="font-medium text-foreground">
                    {cancelModal.appointment?.scheduled_date &&
                      new Date(cancelModal.appointment.scheduled_date).toLocaleDateString('fr-CA', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                  </span>
                </div>
                {cancelModal.appointment?.scheduled_time && (
                  <div className="flex items-center gap-2 text-sm text-foreground/70">
                    <Clock className="w-4 h-4" />
                    <span>{cancelModal.appointment.scheduled_time}</span>
                  </div>
                )}
              </div>

              {cancelModal.canCancelFree ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-green-800">
                      <p className="font-medium mb-1">Annulation gratuite</p>
                      <p>
                        Votre rendez-vous est dans plus de 24 heures.
                        Vous pouvez l'annuler sans frais.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-orange-800">
                      <p className="font-medium mb-1">Frais d'annulation</p>
                      <p>
                        Votre rendez-vous est dans moins de 24 heures
                        ({Math.floor(cancelModal.hoursUntil)}h restantes).
                        Des frais d'annulation pourraient s'appliquer selon la politique de la clinique.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <p className="text-sm text-foreground/60">
                Êtes-vous sûr de vouloir annuler ce rendez-vous? Cette action ne peut pas être annulée.
              </p>
            </div>

            <div className="flex gap-3 p-6 border-t border-neutral-200">
              <button
                onClick={handleCloseCancelModal}
                disabled={cancelling}
                className="flex-1 px-4 py-3 border border-neutral-300 text-foreground hover:bg-neutral-50 rounded-lg transition-colors disabled:opacity-50"
              >
                Garder le rendez-vous
              </button>
              <button
                onClick={handleConfirmCancel}
                disabled={cancelling}
                className="flex-1 px-4 py-3 bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {cancelling ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Annulation...
                  </>
                ) : (
                  'Confirmer l\'annulation'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {rescheduleModal.show && rescheduleModal.appointment && patientUserId && (
        <RescheduleModal
          isOpen={rescheduleModal.show}
          onClose={() => setRescheduleModal({ show: false, appointment: null })}
          appointment={rescheduleModal.appointment}
          patientUserId={patientUserId}
          onSuccess={() => {
            loadAppointments();
            setRescheduleModal({ show: false, appointment: null });
          }}
        />
      )}
    </div>
  );
}
