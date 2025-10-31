import { useState, useEffect } from 'react';
import { Calendar, Clock, Check, AlertCircle, ArrowRight, ArrowLeft, Sparkles, CreditCard } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { env } from '../../lib/env';
import { usePaymentMethods } from '../../hooks/usePaymentMethods';

interface PatientBookingProps {
  patientId: string;
  patientEmail: string;
  patientName: string;
}

interface ServiceType {
  id: string;
  name: string;
  description: string;
  duration_minutes: number;
  price: number;
  color: string;
  requires_deposit: boolean;
  deposit_amount: number;
}

interface TimeSlot {
  time: string;
  available: boolean;
}

export default function PatientBooking({ patientId, patientEmail, patientName }: PatientBookingProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [services, setServices] = useState<ServiceType[]>([]);
  const [selectedService, setSelectedService] = useState<ServiceType | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [bookingSettings, setBookingSettings] = useState<any>(null);
  const [notes, setNotes] = useState('');
  const [enableAutoPayment, setEnableAutoPayment] = useState(false);
  const [hasAutoPayAuth, setHasAutoPayAuth] = useState(false);

  const { paymentMethods } = usePaymentMethods(patientId);

  useEffect(() => {
    loadBookingData();
    checkAutoPaymentStatus();
  }, []);

  useEffect(() => {
    if (selectedDate && selectedService && bookingSettings) {
      loadAvailableSlots(selectedDate);
    }
  }, [selectedDate, selectedService]);

  async function checkAutoPaymentStatus() {
    try {
      const { data } = await supabase
        .from('payment_authorizations')
        .select('is_enabled')
        .eq('patient_id', patientId)
        .maybeSingle();

      if (data?.is_enabled) {
        setHasAutoPayAuth(true);
        setEnableAutoPayment(true);
      }
    } catch (error) {
      console.error('Error checking auto-payment status:', error);
    }
  }

  async function loadBookingData() {
    try {
      const [servicesRes, settingsRes] = await Promise.all([
        supabase
          .from('service_types')
          .select('*')
          .eq('is_active', true)
          .eq('allow_online_booking', true)
          .order('name'),
        supabase
          .from('booking_settings')
          .select('*')
          .eq('enabled', true)
          .maybeSingle(),
      ]);

      if (servicesRes.error) throw servicesRes.error;

      setServices(servicesRes.data || []);
      setBookingSettings(settingsRes.data);
    } catch (error) {
      console.error('Error loading booking data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadAvailableSlots(date: Date) {
    if (!selectedService || !bookingSettings) return;

    const dayOfWeek = date.getDay();
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = dayNames[dayOfWeek];

    const dayEnabled = bookingSettings[`${dayName}_enabled`];
    if (!dayEnabled) {
      setAvailableSlots([]);
      return;
    }

    const startTime = bookingSettings[`${dayName}_start`];
    const endTime = bookingSettings[`${dayName}_end`];

    const slots = generateTimeSlots(startTime, endTime, selectedService.duration_minutes);

    const dateStr = date.toISOString().split('T')[0];
    const { data: existingAppointments } = await supabase
      .from('appointments_api')
      .select('scheduled_time')
      .eq('scheduled_date', dateStr)
      .in('status', ['confirmed', 'pending']);

    const bookedTimes = new Set((existingAppointments || []).map(a => a.scheduled_time));

    const availableSlots = slots.map(slot => ({
      time: slot,
      available: !bookedTimes.has(slot),
    }));

    setAvailableSlots(availableSlots);
  }

  function generateTimeSlots(start: string, end: string, duration: number): string[] {
    const slots: string[] = [];
    const [startHour, startMin] = start.split(':').map(Number);
    const [endHour, endMin] = end.split(':').map(Number);

    let currentHour = startHour;
    let currentMin = startMin;

    while (currentHour < endHour || (currentHour === endHour && currentMin < endMin)) {
      const timeStr = `${String(currentHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}`;
      slots.push(timeStr);

      currentMin += duration;
      if (currentMin >= 60) {
        currentHour += Math.floor(currentMin / 60);
        currentMin = currentMin % 60;
      }
    }

    return slots;
  }

  function getAvailableDates(): Date[] {
    if (!bookingSettings) return [];

    const dates: Date[] = [];
    const today = new Date();
    const maxDays = bookingSettings.advance_booking_days || 30;

    for (let i = 1; i < maxDays; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);

      const dayOfWeek = date.getDay();
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const dayName = dayNames[dayOfWeek];
      const dayEnabled = bookingSettings[`${dayName}_enabled`];

      if (dayEnabled) {
        dates.push(date);
      }
    }

    return dates;
  }

  async function handleSubmit() {
    if (!selectedService || !selectedDate || !selectedTime) return;

    setSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      const appointmentData = {
        patient_id: patientId,
        owner_id: user?.id,
        reason: selectedService.name,
        notes: notes || null,
        service_type_id: selectedService.id,
        scheduled_date: selectedDate.toISOString().split('T')[0],
        scheduled_time: selectedTime,
        duration_minutes: selectedService.duration_minutes,
        status: 'pending',
        booking_source: 'patient_portal',
        payment_status: 'pending',
        auto_payment_enabled: enableAutoPayment,
        auto_payment_status: enableAutoPayment ? 'pending' : 'not_applicable',
      };

      const { error } = await supabase
        .from('appointments_api')
        .insert([appointmentData]);

      if (error) throw error;

      setStep(4);

      setTimeout(() => {
        setStep(1);
        setSelectedService(null);
        setSelectedDate(null);
        setSelectedTime(null);
        setNotes('');
      }, 3000);

    } catch (error: any) {
      console.error('Error booking appointment:', error);
      alert('Erreur lors de la réservation: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-gold-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!bookingSettings?.enabled) {
    return (
      <div className="text-center py-12 bg-orange-50 border border-orange-200 rounded-lg">
        <AlertCircle className="w-12 h-12 text-orange-600 mx-auto mb-3" />
        <p className="text-foreground/70">Les réservations en ligne ne sont pas activées.</p>
        <p className="text-sm text-foreground/50 mt-2">Veuillez contacter votre clinique.</p>
      </div>
    );
  }

  if (services.length === 0) {
    return (
      <div className="text-center py-12 bg-neutral-50 border border-neutral-200 rounded-lg">
        <Calendar className="w-12 h-12 text-foreground/20 mx-auto mb-3" />
        <p className="text-foreground/70">Aucun service disponible pour le moment.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-gold-500 to-gold-600 rounded-lg p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <Sparkles className="w-6 h-6" />
          <h2 className="text-2xl font-heading">Réserver un rendez-vous</h2>
        </div>
        <p className="text-gold-100">
          Choisissez votre service, date et heure en quelques clics
        </p>
      </div>

      <div className="flex items-center justify-center mb-8">
        {[1, 2, 3].map((num) => (
          <div key={num} className="flex items-center">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                step >= num
                  ? 'bg-gradient-to-br from-gold-500 to-gold-600 text-white shadow-gold'
                  : 'bg-neutral-200 text-neutral-500'
              }`}
            >
              {step > num ? <Check className="w-5 h-5" /> : num}
            </div>
            {num < 3 && (
              <div
                className={`w-16 h-1 mx-2 transition-all ${
                  step > num ? 'bg-gold-600' : 'bg-neutral-200'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {step === 1 && (
        <div>
          <h3 className="text-xl font-heading text-foreground mb-4">Choisissez votre service</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {services.map((service) => (
              <button
                key={service.id}
                onClick={() => {
                  setSelectedService(service);
                  setStep(2);
                }}
                className="text-left p-6 bg-white border-2 border-neutral-200 rounded-lg hover:border-gold-600 hover:shadow-soft-lg transition-all group"
              >
                <div
                  className="w-3 h-3 rounded-full mb-3"
                  style={{ backgroundColor: service.color || '#F59E0B' }}
                />
                <h4 className="text-lg font-medium text-foreground mb-2 group-hover:text-gold-600 transition-colors">
                  {service.name}
                </h4>
                <p className="text-sm text-foreground/60 mb-3">{service.description}</p>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1 text-foreground/70">
                    <Clock className="w-4 h-4" />
                    <span>{service.duration_minutes} min</span>
                  </div>
                  <div className="text-gold-600 font-semibold">{service.price}$</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 2 && selectedService && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-heading text-foreground">Choisissez une date</h3>
            <button
              onClick={() => setStep(1)}
              className="flex items-center gap-2 text-sm text-foreground/70 hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour
            </button>
          </div>

          <div className="bg-gold-50 border border-gold-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-foreground/70">
              Service sélectionné: <span className="font-medium text-foreground">{selectedService.name}</span>
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {getAvailableDates().slice(0, 14).map((date) => (
              <button
                key={date.toISOString()}
                onClick={() => {
                  setSelectedDate(date);
                  setStep(3);
                }}
                className={`p-4 rounded-lg border-2 transition-all ${
                  selectedDate?.toDateString() === date.toDateString()
                    ? 'border-gold-600 bg-gold-50'
                    : 'border-neutral-200 hover:border-gold-400 hover:bg-neutral-50'
                }`}
              >
                <div className="text-xs text-foreground/60 mb-1">
                  {date.toLocaleDateString('fr-CA', { weekday: 'short' })}
                </div>
                <div className="text-2xl font-bold text-foreground">
                  {date.getDate()}
                </div>
                <div className="text-xs text-foreground/60 mt-1">
                  {date.toLocaleDateString('fr-CA', { month: 'short' })}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 3 && selectedService && selectedDate && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-heading text-foreground">Choisissez une heure</h3>
            <button
              onClick={() => setStep(2)}
              className="flex items-center gap-2 text-sm text-foreground/70 hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour
            </button>
          </div>

          <div className="bg-gold-50 border border-gold-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-foreground/70 mb-1">
              Service: <span className="font-medium text-foreground">{selectedService.name}</span>
            </p>
            <p className="text-sm text-foreground/70">
              Date: <span className="font-medium text-foreground">
                {selectedDate.toLocaleDateString('fr-CA', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
            </p>
          </div>

          {availableSlots.length === 0 ? (
            <div className="text-center py-8 bg-neutral-50 border border-neutral-200 rounded-lg">
              <Clock className="w-12 h-12 text-foreground/20 mx-auto mb-3" />
              <p className="text-foreground/70">Aucune disponibilité pour cette date</p>
              <button
                onClick={() => setStep(2)}
                className="mt-4 text-sm text-gold-600 hover:text-gold-700 font-medium"
              >
                Choisir une autre date
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 mb-6">
                {availableSlots.map((slot) => (
                  <button
                    key={slot.time}
                    onClick={() => slot.available && setSelectedTime(slot.time)}
                    disabled={!slot.available}
                    className={`p-3 rounded-lg border-2 font-medium transition-all ${
                      !slot.available
                        ? 'border-neutral-200 bg-neutral-100 text-neutral-400 cursor-not-allowed'
                        : selectedTime === slot.time
                        ? 'border-gold-600 bg-gold-600 text-white shadow-gold'
                        : 'border-neutral-200 hover:border-gold-400 hover:bg-gold-50 text-foreground'
                    }`}
                  >
                    {slot.time}
                  </button>
                ))}
              </div>

              {selectedTime && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Notes (optionnel)
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Ajoutez des détails sur votre visite..."
                      className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
                      rows={3}
                    />
                  </div>

                  {hasAutoPayAuth && paymentMethods.length > 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={enableAutoPayment}
                          onChange={(e) => setEnableAutoPayment(e.target.checked)}
                          className="w-5 h-5 text-gold-600 border-neutral-300 rounded focus:ring-gold-500 mt-0.5"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <CreditCard className="w-4 h-4 text-blue-600" />
                            <span className="font-medium text-foreground">Paiement automatique</span>
                          </div>
                          <p className="text-sm text-foreground/70">
                            Payer automatiquement ce rendez-vous avec votre méthode de paiement enregistrée
                            ({selectedService.price}$)
                          </p>
                        </div>
                      </label>
                    </div>
                  )}

                  {!hasAutoPayAuth && paymentMethods.length > 0 && (
                    <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4">
                      <p className="text-sm text-foreground/60">
                        Activez les paiements automatiques dans l'onglet "Paiements auto" pour payer
                        automatiquement vos rendez-vous.
                      </p>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      onClick={() => setSelectedTime(null)}
                      className="px-6 py-3 border border-neutral-300 text-foreground hover:bg-neutral-50 rounded-lg transition-colors"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={handleSubmit}
                      disabled={submitting}
                      className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-gold-500 to-gold-600 text-white hover:from-gold-600 hover:to-gold-700 rounded-lg shadow-soft transition-all disabled:opacity-50"
                    >
                      {submitting ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Réservation...
                        </>
                      ) : (
                        <>
                          Confirmer la réservation
                          <ArrowRight className="w-5 h-5" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {step === 4 && (
        <div className="text-center py-12 bg-green-50 border border-green-200 rounded-lg">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-2xl font-heading text-foreground mb-2">Rendez-vous confirmé!</h3>
          <p className="text-foreground/70 mb-1">
            {selectedDate?.toLocaleDateString('fr-CA', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
          <p className="text-foreground/70 mb-4">à {selectedTime}</p>
          <p className="text-sm text-foreground/60">
            Un email de confirmation vous a été envoyé.
          </p>
        </div>
      )}
    </div>
  );
}
