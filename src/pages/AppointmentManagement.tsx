import { useState, useEffect } from 'react';
import { Calendar, Clock, CheckCircle, XCircle, Loader, AlertCircle, User, Mail, Phone } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface AppointmentDetails {
  id: string;
  scheduled_date: string;
  scheduled_time: string;
  duration_minutes: number;
  name: string;
  email: string;
  phone: string;
  status: string;
  service_type?: {
    name: string;
    price: number;
  };
  presence_confirmed: boolean;
  cancellation_reason?: string;
}

interface AvailableSlot {
  date: string;
  time: string;
  datetime: string;
}

export default function AppointmentManagement() {
  // Extract token and action from URL
  const pathParts = window.location.pathname.split('/');
  const action = pathParts[2]; // 'confirm' or 'manage'
  const token = pathParts[3]; // the actual token

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [appointment, setAppointment] = useState<AppointmentDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showReschedule, setShowReschedule] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [cancellationReason, setCancellationReason] = useState('');

  useEffect(() => {
    if (token) {
      loadAppointment();
    }
  }, [token]);

  useEffect(() => {
    if (action === 'confirm' && appointment) {
      handleConfirmPresence();
    }
  }, [action, appointment]);

  const loadAppointment = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('appointments_api')
        .select(`
          id,
          scheduled_date,
          scheduled_time,
          duration_minutes,
          name,
          email,
          phone,
          status,
          presence_confirmed,
          cancellation_reason,
          service_type_id,
          service_types (
            name,
            price
          )
        `)
        .eq('confirmation_token', token)
        .maybeSingle();

      if (fetchError) throw fetchError;
      if (!data) {
        setError('Rendez-vous non trouvé ou lien invalide');
        return;
      }

      setAppointment({
        ...data,
        service_type: data.service_types ? {
          name: data.service_types.name,
          price: data.service_types.price
        } : undefined
      });
    } catch (err: any) {
      console.error('Erreur chargement RDV:', err);
      setError(err.message || 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmPresence = async () => {
    if (!appointment || appointment.presence_confirmed) return;

    try {
      setProcessing(true);
      setError(null);

      const { data, error: confirmError } = await supabase.rpc(
        'confirm_appointment_attendance',
        { p_confirmation_token: token }
      );

      if (confirmError) throw confirmError;

      if (data?.success) {
        setSuccess('Votre présence a été confirmée avec succès!');
        setAppointment({ ...appointment, presence_confirmed: true });
      } else {
        setError(data?.message || 'Erreur de confirmation');
      }
    } catch (err: any) {
      console.error('Erreur confirmation:', err);
      setError(err.message || 'Erreur de confirmation');
    } finally {
      setProcessing(false);
    }
  };

  const loadAvailableSlots = async () => {
    try {
      setLoading(true);

      // Calculer les 7 prochains jours
      const today = new Date();
      const slots: AvailableSlot[] = [];

      // Simuler des créneaux disponibles (à remplacer par une vraie requête)
      for (let i = 1; i <= 7; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() + i);

        // Ajouter quelques créneaux par jour
        ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'].forEach(time => {
          const datetime = new Date(date);
          const [hours, minutes] = time.split(':');
          datetime.setHours(parseInt(hours), parseInt(minutes), 0);

          slots.push({
            date: date.toISOString().split('T')[0],
            time,
            datetime: datetime.toISOString()
          });
        });
      }

      setAvailableSlots(slots);
    } catch (err: any) {
      console.error('Erreur chargement créneaux:', err);
      setError('Erreur de chargement des créneaux disponibles');
    } finally {
      setLoading(false);
    }
  };

  const handleReschedule = async () => {
    if (!selectedSlot || !appointment) return;

    try {
      setProcessing(true);
      setError(null);

      const selectedDateTime = new Date(selectedSlot);

      const { error: updateError } = await supabase
        .from('appointments_api')
        .update({
          scheduled_date: selectedDateTime.toISOString(),
          scheduled_time: selectedDateTime.toTimeString().slice(0, 5),
          updated_at: new Date().toISOString()
        })
        .eq('confirmation_token', token);

      if (updateError) throw updateError;

      setSuccess('Votre rendez-vous a été reprogrammé avec succès!');
      setShowReschedule(false);
      await loadAppointment();
    } catch (err: any) {
      console.error('Erreur reprogrammation:', err);
      setError(err.message || 'Erreur de reprogrammation');
    } finally {
      setProcessing(false);
    }
  };

  const handleCancel = async () => {
    if (!appointment || !cancellationReason.trim()) {
      setError('Veuillez indiquer une raison pour l\'annulation');
      return;
    }

    try {
      setProcessing(true);
      setError(null);

      const { error: cancelError } = await supabase
        .from('appointments_api')
        .update({
          status: 'cancelled',
          cancellation_reason: cancellationReason,
          cancelled_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('confirmation_token', token);

      if (cancelError) throw cancelError;

      setSuccess('Votre rendez-vous a été annulé. Nous espérons vous revoir bientôt!');
      await loadAppointment();
    } catch (err: any) {
      console.error('Erreur annulation:', err);
      setError(err.message || 'Erreur d\'annulation');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (error && !appointment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Erreur</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!appointment) return null;

  const appointmentDate = new Date(appointment.scheduled_date);
  const isPast = appointmentDate < new Date();
  const isCancelled = appointment.status === 'cancelled';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* En-tête */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-white">
            <h1 className="text-3xl font-bold mb-2">Gestion de votre rendez-vous</h1>
            <p className="text-blue-100">Consultez et gérez votre rendez-vous</p>
          </div>

          {/* Messages */}
          {success && (
            <div className="m-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-green-800">{success}</p>
            </div>
          )}

          {error && appointment && (
            <div className="m-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {/* Statut */}
          {isCancelled && (
            <div className="m-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <XCircle className="w-6 h-6 text-gray-600" />
                <span className="font-semibold text-gray-900">Rendez-vous annulé</span>
              </div>
              {appointment.cancellation_reason && (
                <p className="text-gray-600 text-sm ml-9">Raison: {appointment.cancellation_reason}</p>
              )}
            </div>
          )}

          {appointment.presence_confirmed && !isCancelled && (
            <div className="m-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-green-600" />
              <span className="font-semibold text-green-900">Présence confirmée</span>
            </div>
          )}

          {/* Détails du RDV */}
          <div className="p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Informations du rendez-vous</h2>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <User className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Patient</p>
                  <p className="font-medium text-gray-900">{appointment.name}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium text-gray-900">{appointment.email}</p>
                </div>
              </div>

              {appointment.phone && (
                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Téléphone</p>
                    <p className="font-medium text-gray-900">{appointment.phone}</p>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Date</p>
                  <p className="font-medium text-gray-900">
                    {appointmentDate.toLocaleDateString('fr-FR', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Heure</p>
                  <p className="font-medium text-gray-900">
                    {appointment.scheduled_time} ({appointment.duration_minutes} minutes)
                  </p>
                </div>
              </div>

              {appointment.service_type && (
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Service</p>
                    <p className="font-medium text-gray-900">{appointment.service_type.name}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          {!isCancelled && !isPast && (
            <div className="p-6 bg-gray-50 border-t space-y-3">
              {!appointment.presence_confirmed && (
                <button
                  onClick={handleConfirmPresence}
                  disabled={processing}
                  className="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {processing ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      Confirmation...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      Confirmer ma présence
                    </>
                  )}
                </button>
              )}

              <button
                onClick={() => {
                  setShowReschedule(!showReschedule);
                  if (!showReschedule) loadAvailableSlots();
                }}
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                <Calendar className="w-5 h-5" />
                Reprogrammer mon RDV
              </button>

              <button
                onClick={() => {
                  if (confirm('Êtes-vous sûr de vouloir annuler ce rendez-vous?')) {
                    const reason = prompt('Raison de l\'annulation (optionnel):');
                    if (reason !== null) {
                      setCancellationReason(reason || 'Non spécifiée');
                      handleCancel();
                    }
                  }
                }}
                disabled={processing}
                className="w-full bg-red-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <XCircle className="w-5 h-5" />
                Annuler mon RDV
              </button>
            </div>
          )}
        </div>

        {/* Section Reprogrammation */}
        {showReschedule && !isCancelled && !isPast && (
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Choisir un nouveau créneau</h2>

            <div className="grid gap-2 max-h-96 overflow-y-auto">
              {availableSlots.map((slot, index) => {
                const slotDate = new Date(slot.datetime);
                const isSelected = selectedSlot === slot.datetime;

                return (
                  <button
                    key={index}
                    onClick={() => setSelectedSlot(slot.datetime)}
                    className={`p-4 rounded-lg border-2 text-left transition-all ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">
                          {slotDate.toLocaleDateString('fr-FR', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long'
                          })}
                        </p>
                        <p className="text-sm text-gray-600">{slot.time}</p>
                      </div>
                      {isSelected && (
                        <CheckCircle className="w-5 h-5 text-blue-600" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            <button
              onClick={handleReschedule}
              disabled={!selectedSlot || processing}
              className="w-full mt-4 bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {processing ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Reprogrammation...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Confirmer le nouveau créneau
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
