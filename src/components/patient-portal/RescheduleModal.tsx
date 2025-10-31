import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Calendar, Clock, X, AlertCircle, CheckCircle, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';

interface Appointment {
  id: string;
  scheduled_date: string;
  scheduled_time: string;
  duration_minutes: number;
  reason: string;
  reschedule_count: number;
  owner_id: string;
}

interface RescheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment;
  patientUserId: string;
  onSuccess: () => void;
}

interface ValidationResult {
  can_reschedule: boolean;
  reasons: string[];
  hours_until_appointment: number;
  reschedule_count: number;
  max_reschedules: number;
  min_notice_hours: number;
  within_policy: boolean;
  potential_fee: number;
}

interface TimeSlot {
  slot_date: string;
  slot_time: string;
  slot_datetime: string;
  is_available: boolean;
  practitioner_name: string;
}

export default function RescheduleModal({
  isOpen,
  onClose,
  appointment,
  patientUserId,
  onSuccess
}: RescheduleModalProps) {
  const [step, setStep] = useState<'validation' | 'calendar' | 'confirmation'>('validation');
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(getMonday(new Date()));
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [rescheduleReason, setRescheduleReason] = useState('');

  useEffect(() => {
    if (isOpen && appointment) {
      validateReschedule();
    }
  }, [isOpen, appointment]);

  useEffect(() => {
    if (step === 'calendar' && validation?.can_reschedule) {
      loadAvailableSlots();
    }
  }, [step, currentWeekStart]);

  function getMonday(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  }

  async function validateReschedule() {
    setLoading(true);
    setError('');

    try {
      const { data, error: fnError } = await supabase.rpc('can_patient_reschedule_appointment', {
        p_appointment_id: appointment.id,
        p_patient_user_id: patientUserId
      });

      if (fnError) throw fnError;

      setValidation(data);

      if (data.can_reschedule) {
        setStep('calendar');
      }
    } catch (err: any) {
      console.error('Error validating reschedule:', err);
      setError(err.message || 'Failed to validate rescheduling permission');
    } finally {
      setLoading(false);
    }
  }

  async function loadAvailableSlots() {
    setLoading(true);
    setError('');

    try {
      const weekEnd = new Date(currentWeekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);

      const { data, error: fnError } = await supabase.rpc('get_available_slots', {
        p_owner_id: appointment.owner_id,
        p_start_date: currentWeekStart.toISOString().split('T')[0],
        p_end_date: weekEnd.toISOString().split('T')[0],
        p_duration_minutes: appointment.duration_minutes || 30
      });

      if (fnError) throw fnError;

      setAvailableSlots(data || []);
    } catch (err: any) {
      console.error('Error loading slots:', err);
      setError(err.message || 'Failed to load available slots');
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirmReschedule() {
    if (!selectedSlot) {
      setError('Please select a time slot');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const { data, error: fnError } = await supabase.rpc('reschedule_appointment_self_service', {
        p_appointment_id: appointment.id,
        p_new_date: selectedSlot.slot_date,
        p_new_time: selectedSlot.slot_time,
        p_reschedule_reason: rescheduleReason || null,
        p_patient_user_id: patientUserId
      });

      if (fnError) throw fnError;

      if (!data.success) {
        throw new Error(data.error || 'Failed to reschedule appointment');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error rescheduling:', err);
      setError(err.message || 'Failed to reschedule appointment');
    } finally {
      setSubmitting(false);
    }
  }

  function handlePreviousWeek() {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() - 7);
    const today = getMonday(new Date());
    if (newDate >= today) {
      setCurrentWeekStart(newDate);
    }
  }

  function handleNextWeek() {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() + 7);
    setCurrentWeekStart(newDate);
  }

  function formatDate(dateStr: string): string {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('fr-CA', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  function formatTime(timeStr: string): string {
    return timeStr.slice(0, 5);
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-neutral-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-heading text-foreground">Reprogrammer le rendez-vous</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {/* Current Appointment Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-blue-900 mb-2">Rendez-vous actuel</h3>
            <div className="flex items-center gap-4 text-sm text-blue-800">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>{formatDate(appointment.scheduled_date)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>{formatTime(appointment.scheduled_time)}</span>
              </div>
            </div>
            <p className="text-sm text-blue-700 mt-2">{appointment.reason}</p>
          </div>

          {/* Validation Step */}
          {step === 'validation' && (
            <div className="space-y-4">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-8 h-8 border-4 border-gold-400 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : validation && !validation.can_reschedule ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-medium text-red-900 mb-2">
                        Reprogrammation non disponible
                      </h3>
                      <ul className="list-disc list-inside space-y-1 text-sm text-red-800">
                        {validation.reasons.map((reason, index) => (
                          <li key={index}>{reason}</li>
                        ))}
                      </ul>
                      {validation.reschedule_count > 0 && (
                        <p className="text-sm text-red-700 mt-3">
                          Ce rendez-vous a déjà été reprogrammé {validation.reschedule_count} fois
                          (maximum: {validation.max_reschedules}).
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-red-200">
                    <p className="text-sm text-red-800">
                      Veuillez nous contacter directement pour modifier ce rendez-vous.
                    </p>
                  </div>
                </div>
              ) : error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-800">{error}</p>
                </div>
              )}
            </div>
          )}

          {/* Calendar Step */}
          {step === 'calendar' && validation?.can_reschedule && (
            <div className="space-y-6">
              {/* Warning if near deadline */}
              {validation && !validation.within_policy && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-orange-900">
                        Reprogrammation tardive
                      </p>
                      <p className="text-sm text-orange-800 mt-1">
                        Il reste seulement {validation.hours_until_appointment.toFixed(1)} heures avant
                        votre rendez-vous. Un délai de {validation.min_notice_hours}h est recommandé.
                        {validation.potential_fee > 0 && (
                          <span className="block mt-1">
                            Des frais de {validation.potential_fee}$ pourraient s'appliquer.
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Info about reschedules used */}
              {validation && validation.reschedule_count > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-800">
                    Reprogrammations: {validation.reschedule_count}/{validation.max_reschedules}
                  </p>
                </div>
              )}

              {/* Week Navigation */}
              <div className="flex items-center justify-between border-b border-neutral-200 pb-4">
                <button
                  onClick={handlePreviousWeek}
                  disabled={currentWeekStart <= getMonday(new Date())}
                  className="p-2 hover:bg-neutral-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <h3 className="font-medium text-foreground">
                  Semaine du {currentWeekStart.toLocaleDateString('fr-CA', { day: 'numeric', month: 'long', year: 'numeric' })}
                </h3>
                <button
                  onClick={handleNextWeek}
                  className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              {/* Time Slots */}
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-8 h-8 border-4 border-gold-400 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : availableSlots.length > 0 ? (
                <div className="grid gap-2 max-h-96 overflow-y-auto">
                  {availableSlots.filter(slot => slot.is_available).map((slot, index) => {
                    const isSelected = selectedSlot?.slot_datetime === slot.slot_datetime;
                    const isSameAsCurrentDate = slot.slot_date === appointment.scheduled_date;
                    const isSameAsCurrentTime = slot.slot_time === appointment.scheduled_time;
                    const isCurrent = isSameAsCurrentDate && isSameAsCurrentTime;

                    return (
                      <button
                        key={index}
                        onClick={() => setSelectedSlot(slot)}
                        disabled={isCurrent}
                        className={`w-full p-4 border-2 rounded-lg text-left transition-all ${
                          isCurrent
                            ? 'border-neutral-300 bg-neutral-100 cursor-not-allowed'
                            : isSelected
                            ? 'border-gold-400 bg-gold-50'
                            : 'border-neutral-200 hover:border-gold-200 hover:bg-neutral-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-foreground">
                              {formatDate(slot.slot_date)}
                            </div>
                            <div className="text-sm text-foreground/60 mt-1">
                              {formatTime(slot.slot_time)} • {appointment.duration_minutes || 30} minutes
                            </div>
                          </div>
                          {isCurrent ? (
                            <span className="text-xs text-neutral-500 bg-neutral-200 px-2 py-1 rounded">
                              Actuel
                            </span>
                          ) : isSelected && (
                            <CheckCircle className="w-6 h-6 text-gold-500" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Calendar className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
                  <p className="text-foreground/60">
                    Aucun créneau disponible pour cette semaine.
                  </p>
                  <p className="text-sm text-foreground/50 mt-2">
                    Essayez une autre semaine ou contactez-nous.
                  </p>
                </div>
              )}

              {/* Reason Field */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Raison de la reprogrammation (optionnel)
                </label>
                <textarea
                  value={rescheduleReason}
                  onChange={(e) => setRescheduleReason(e.target.value)}
                  placeholder="Ex: Conflit d'horaire, imprévu personnel..."
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent resize-none"
                  rows={2}
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-neutral-200">
                <button
                  onClick={onClose}
                  className="flex-1 px-6 py-3 border-2 border-neutral-200 text-foreground rounded-lg hover:bg-neutral-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={() => selectedSlot && setStep('confirmation')}
                  disabled={!selectedSlot || submitting}
                  className="flex-1 px-6 py-3 bg-gold-500 text-white rounded-lg hover:bg-gold-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Continuer
                </button>
              </div>
            </div>
          )}

          {/* Confirmation Step */}
          {step === 'confirmation' && selectedSlot && (
            <div className="space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                  <div>
                    <h3 className="font-medium text-green-900 mb-3">
                      Confirmer la reprogrammation
                    </h3>

                    <div className="space-y-3 text-sm">
                      <div>
                        <p className="text-green-700 font-medium">Ancien rendez-vous:</p>
                        <p className="text-green-800">
                          {formatDate(appointment.scheduled_date)} à {formatTime(appointment.scheduled_time)}
                        </p>
                      </div>

                      <div>
                        <p className="text-green-700 font-medium">Nouveau rendez-vous:</p>
                        <p className="text-green-800">
                          {formatDate(selectedSlot.slot_date)} à {formatTime(selectedSlot.slot_time)}
                        </p>
                      </div>

                      {rescheduleReason && (
                        <div>
                          <p className="text-green-700 font-medium">Raison:</p>
                          <p className="text-green-800">{rescheduleReason}</p>
                        </div>
                      )}
                    </div>

                    {validation && !validation.within_policy && validation.potential_fee > 0 && (
                      <div className="mt-4 pt-4 border-t border-green-200">
                        <p className="text-sm text-orange-800 font-medium">
                          Note: Des frais de {validation.potential_fee}$ pourraient être facturés
                          en raison de la reprogrammation tardive.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setStep('calendar')}
                  disabled={submitting}
                  className="flex-1 px-6 py-3 border-2 border-neutral-200 text-foreground rounded-lg hover:bg-neutral-50 transition-colors disabled:opacity-50"
                >
                  Retour
                </button>
                <button
                  onClick={handleConfirmReschedule}
                  disabled={submitting}
                  className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Reprogrammation...</span>
                    </>
                  ) : (
                    'Confirmer la reprogrammation'
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
