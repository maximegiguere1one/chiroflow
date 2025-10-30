import { useState, useEffect } from 'react';
import { Calendar, Clock, User, Mail, Phone, Check, ArrowRight, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useToastContext } from '../contexts/ToastContext';

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

interface BookingSettings {
  online_booking_enabled: boolean;
  advance_booking_days: number;
  minimum_notice_hours: number;
  require_payment: boolean;
  require_deposit: boolean;
  cancellation_policy: string;
  booking_instructions: string;
  monday_start: string;
  monday_end: string;
  monday_enabled: boolean;
  tuesday_start: string;
  tuesday_end: string;
  tuesday_enabled: boolean;
  wednesday_start: string;
  wednesday_end: string;
  wednesday_enabled: boolean;
  thursday_start: string;
  thursday_end: string;
  thursday_enabled: boolean;
  friday_start: string;
  friday_end: string;
  friday_enabled: boolean;
  saturday_start: string;
  saturday_end: string;
  saturday_enabled: boolean;
  sunday_start: string;
  sunday_end: string;
  sunday_enabled: boolean;
}

export function OnlineBooking() {
  const toast = useToastContext();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [services, setServices] = useState<ServiceType[]>([]);
  const [settings, setSettings] = useState<BookingSettings | null>(null);
  const [selectedService, setSelectedService] = useState<ServiceType | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    notes: '',
  });

  useEffect(() => {
    loadBookingData();
  }, []);

  useEffect(() => {
    if (selectedDate && selectedService) {
      loadAvailableSlots(selectedDate);
    }
  }, [selectedDate, selectedService]);

  async function loadBookingData() {
    try {
      const [servicesRes, settingsRes] = await Promise.all([
        supabase
          .from('service_types')
          .select('*')
          .eq('is_active', true)
          .eq('allow_online_booking', true),
        supabase
          .from('booking_settings')
          .select('*')
          .eq('online_booking_enabled', true)
          .maybeSingle(),
      ]);

      if (servicesRes.error) throw servicesRes.error;
      if (settingsRes.error) throw settingsRes.error;

      if (!settingsRes.data) {
        toast.error('Les réservations en ligne ne sont pas disponibles pour le moment');
        return;
      }

      setServices(servicesRes.data || []);
      setSettings(settingsRes.data);
    } catch (error) {
      console.error('Error loading booking data:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  }

  async function loadAvailableSlots(date: Date) {
    if (!selectedService || !settings) return;

    const dayOfWeek = date.getDay();
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = dayNames[dayOfWeek];

    const dayEnabled = settings[`${dayName}_enabled` as keyof BookingSettings];
    if (!dayEnabled) {
      setAvailableSlots([]);
      return;
    }

    const startTime = settings[`${dayName}_start` as keyof BookingSettings] as string;
    const endTime = settings[`${dayName}_end` as keyof BookingSettings] as string;

    if (!startTime || !endTime) {
      setAvailableSlots([]);
      return;
    }

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
    if (!settings) return [];

    const dates: Date[] = [];
    const today = new Date();
    const maxDays = settings.advance_booking_days || 30;

    for (let i = 0; i < maxDays; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);

      const dayOfWeek = date.getDay();
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const dayName = dayNames[dayOfWeek];
      const dayEnabled = settings[`${dayName}_enabled` as keyof BookingSettings];

      if (dayEnabled) {
        dates.push(date);
      }
    }

    return dates;
  }

  async function handleSubmit() {
    if (!selectedService || !selectedDate || !selectedTime) {
      toast.error('Veuillez compléter toutes les étapes');
      return;
    }

    if (!formData.name || !formData.email || !formData.phone) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setSubmitting(true);

    try {
      const appointmentData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        reason: selectedService.name,
        notes: formData.notes || null,
        service_type_id: selectedService.id,
        scheduled_date: selectedDate.toISOString().split('T')[0],
        scheduled_time: selectedTime,
        duration_minutes: selectedService.duration_minutes,
        status: 'pending',
        booking_source: 'online',
        payment_status: 'pending',
        payment_amount: selectedService.price,
        deposit_amount: selectedService.requires_deposit ? selectedService.deposit_amount : 0,
      };

      const { data, error } = await supabase
        .from('appointments_api')
        .insert([appointmentData])
        .select()
        .single();

      if (error) throw error;

      const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-booking-confirmation`;

      try {
        await fetch(functionUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            appointmentId: data.id,
            patientName: formData.name,
            patientEmail: formData.email,
            serviceName: selectedService.name,
            appointmentDate: selectedDate.toISOString().split('T')[0],
            appointmentTime: selectedTime,
            duration: selectedService.duration_minutes,
            price: selectedService.price,
            confirmationToken: data.confirmation_token,
          }),
        });
      } catch (emailError) {
        console.error('Email error (non-blocking):', emailError);
      }

      toast.success('Rendez-vous réservé avec succès! Vérifiez votre email pour les détails.');

      setStep(5);

    } catch (error: any) {
      console.error('Error booking appointment:', error);
      toast.error(error.message || 'Erreur lors de la réservation');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-amber-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-slate-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!settings?.online_booking_enabled) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-8 h-8 text-amber-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Réservation en ligne</h1>
          <p className="text-slate-600">Les réservations en ligne ne sont pas disponibles pour le moment.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-amber-600 to-amber-700 p-8 text-white">
            <h1 className="text-3xl font-bold mb-2">Réservez votre rendez-vous</h1>
            <p className="text-amber-100">Rapide, simple et sécurisé</p>
          </div>

          <div className="p-8">
            <div className="flex items-center justify-center mb-8">
              {[1, 2, 3, 4].map((num) => (
                <div key={num} className="flex items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                      step >= num
                        ? 'bg-amber-600 text-white'
                        : 'bg-slate-200 text-slate-500'
                    }`}
                  >
                    {step > num ? <Check className="w-5 h-5" /> : num}
                  </div>
                  {num < 4 && (
                    <div
                      className={`w-16 h-1 mx-2 ${
                        step > num ? 'bg-amber-600' : 'bg-slate-200'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>

            {step === 1 && (
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-6">Choisissez votre service</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {services.map((service) => (
                    <button
                      key={service.id}
                      onClick={() => {
                        setSelectedService(service);
                        setStep(2);
                      }}
                      className="text-left p-6 border-2 border-slate-200 rounded-xl hover:border-amber-600 hover:shadow-lg transition-all"
                    >
                      <div
                        className="w-12 h-12 rounded-lg mb-4 flex items-center justify-center"
                        style={{ backgroundColor: service.color + '20' }}
                      >
                        <Calendar className="w-6 h-6" style={{ color: service.color }} />
                      </div>
                      <h3 className="text-lg font-semibold text-slate-900 mb-2">{service.name}</h3>
                      <p className="text-sm text-slate-600 mb-3">{service.description}</p>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-500">
                          <Clock className="w-4 h-4 inline mr-1" />
                          {service.duration_minutes} min
                        </span>
                        <span className="text-amber-600 font-semibold">
                          {service.price}$
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 2 && selectedService && (
              <div>
                <button
                  onClick={() => setStep(1)}
                  className="mb-4 text-amber-600 hover:text-amber-700 flex items-center"
                >
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Retour
                </button>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Choisissez une date</h2>
                <p className="text-slate-600 mb-6">
                  Service: <strong>{selectedService.name}</strong> ({selectedService.duration_minutes} min)
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {getAvailableDates().slice(0, 14).map((date, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setSelectedDate(date);
                        setSelectedTime(null);
                        setStep(3);
                      }}
                      className="p-4 border-2 border-slate-200 rounded-xl hover:border-amber-600 hover:shadow-lg transition-all text-center"
                    >
                      <div className="text-sm text-slate-500 mb-1">
                        {date.toLocaleDateString('fr-FR', { weekday: 'short' })}
                      </div>
                      <div className="text-lg font-semibold text-slate-900">
                        {date.getDate()}
                      </div>
                      <div className="text-xs text-slate-500">
                        {date.toLocaleDateString('fr-FR', { month: 'short' })}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 3 && selectedDate && (
              <div>
                <button
                  onClick={() => setStep(2)}
                  className="mb-4 text-amber-600 hover:text-amber-700 flex items-center"
                >
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Retour
                </button>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Choisissez une heure</h2>
                <p className="text-slate-600 mb-6">
                  Date: <strong>{selectedDate.toLocaleDateString('fr-FR', { dateStyle: 'full' })}</strong>
                </p>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 max-h-96 overflow-y-auto">
                  {availableSlots.map((slot, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        if (slot.available) {
                          setSelectedTime(slot.time);
                          setStep(4);
                        }
                      }}
                      disabled={!slot.available}
                      className={`p-3 rounded-lg font-medium transition-all ${
                        slot.available
                          ? 'bg-slate-100 hover:bg-amber-600 hover:text-white text-slate-900 border-2 border-slate-200 hover:border-amber-600'
                          : 'bg-slate-50 text-slate-400 cursor-not-allowed border-2 border-slate-100'
                      }`}
                    >
                      {slot.time}
                    </button>
                  ))}
                </div>
                {availableSlots.length === 0 && (
                  <p className="text-center text-slate-500 py-8">Aucun créneau disponible ce jour</p>
                )}
              </div>
            )}

            {step === 4 && (
              <div>
                <button
                  onClick={() => setStep(3)}
                  className="mb-4 text-amber-600 hover:text-amber-700 flex items-center"
                >
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Retour
                </button>
                <h2 className="text-2xl font-bold text-slate-900 mb-6">Vos informations</h2>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                  <h3 className="font-semibold text-amber-900 mb-2">Récapitulatif</h3>
                  <div className="space-y-1 text-sm text-amber-800">
                    <p><strong>Service:</strong> {selectedService?.name}</p>
                    <p><strong>Date:</strong> {selectedDate?.toLocaleDateString('fr-FR', { dateStyle: 'full' })}</p>
                    <p><strong>Heure:</strong> {selectedTime}</p>
                    <p><strong>Durée:</strong> {selectedService?.duration_minutes} minutes</p>
                    <p><strong>Prix:</strong> {selectedService?.price}$</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      <User className="w-4 h-4 inline mr-2" />
                      Nom complet *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-600 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      <Mail className="w-4 h-4 inline mr-2" />
                      Email *
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-600 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      <Phone className="w-4 h-4 inline mr-2" />
                      Téléphone *
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-600 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Notes (optionnel)
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-600 focus:border-transparent"
                    />
                  </div>

                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="w-full bg-amber-600 text-white py-3 rounded-lg hover:bg-amber-700 font-semibold flex items-center justify-center disabled:opacity-50"
                  >
                    {submitting ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                        Réservation en cours...
                      </>
                    ) : (
                      <>
                        Confirmer la réservation
                        <ArrowRight className="w-5 h-5 ml-2" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {step === 5 && (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Check className="w-10 h-10 text-green-600" />
                </div>
                <h2 className="text-3xl font-bold text-slate-900 mb-4">Réservation confirmée!</h2>
                <p className="text-slate-600 mb-8">
                  Vous recevrez un email de confirmation à <strong>{formData.email}</strong>
                </p>
                <div className="bg-slate-50 rounded-lg p-6 max-w-md mx-auto mb-8">
                  <h3 className="font-semibold text-slate-900 mb-4">Détails de votre rendez-vous</h3>
                  <div className="space-y-2 text-sm text-slate-700">
                    <p><strong>Service:</strong> {selectedService?.name}</p>
                    <p><strong>Date:</strong> {selectedDate?.toLocaleDateString('fr-FR', { dateStyle: 'full' })}</p>
                    <p><strong>Heure:</strong> {selectedTime}</p>
                    <p><strong>Durée:</strong> {selectedService?.duration_minutes} minutes</p>
                  </div>
                </div>
                <button
                  onClick={() => window.location.reload()}
                  className="bg-amber-600 text-white px-6 py-3 rounded-lg hover:bg-amber-700 font-semibold"
                >
                  Réserver un autre rendez-vous
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
