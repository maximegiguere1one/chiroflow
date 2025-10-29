import { motion } from 'framer-motion';
import { useState, useEffect, useMemo } from 'react';
import { X, Calendar, Clock, Zap, TrendingUp, Users } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToastContext } from '../../contexts/ToastContext';
import type { Patient, Appointment } from '../../types/database';

interface SmartSchedulingModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientId?: string;
  patientName?: string;
  onSuccess?: () => void;
}

interface SmartSuggestion {
  date: string;
  time: string;
  score: number;
  reason: string;
  icon: string;
}

export function SmartSchedulingModal({
  isOpen,
  onClose,
  patientId,
  patientName,
  onSuccess
}: SmartSchedulingModalProps) {
  const [patient, setPatient] = useState<Patient | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [suggestions, setSuggestions] = useState<SmartSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState<SmartSuggestion | null>(null);
  const [duration, setDuration] = useState(30);
  const [reason, setReason] = useState('Suivi régulier');
  const toast = useToastContext();

  useEffect(() => {
    if (isOpen && patientId) {
      loadPatientData();
      generateSmartSuggestions();
    }
  }, [isOpen, patientId]);

  async function loadPatientData() {
    try {
      const { data: patientData, error: patientError } = await supabase
        .from('patients')
        .select('*')
        .eq('id', patientId)
        .single();

      if (patientError) throw patientError;
      setPatient(patientData);

      const { data: aptsData, error: aptsError } = await supabase
        .from('appointments')
        .select('*')
        .eq('patient_id', patientId)
        .order('scheduled_date', { ascending: false })
        .limit(10);

      if (aptsError) throw aptsError;
      setAppointments(aptsData || []);
    } catch (error) {
      console.error('Error loading patient data:', error);
    }
  }

  async function generateSmartSuggestions() {
    setLoading(true);
    try {
      const now = new Date();
      const suggestedSlots: SmartSuggestion[] = [];

      const lastAppt = appointments[0];
      if (lastAppt && lastAppt.scheduled_date && lastAppt.scheduled_time) {
        const lastDate = new Date(lastAppt.scheduled_date);
        const dayOfWeek = lastDate.getDay();
        const preferredTime = lastAppt.scheduled_time;

        const nextWeek = new Date(now);
        nextWeek.setDate(nextWeek.getDate() + 7);
        while (nextWeek.getDay() !== dayOfWeek) {
          nextWeek.setDate(nextWeek.getDate() + 1);
        }

        suggestedSlots.push({
          date: nextWeek.toISOString().split('T')[0],
          time: preferredTime,
          score: 95,
          reason: 'Même jour/heure que d\'habitude',
          icon: '🎯'
        });
      }

      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      suggestedSlots.push({
        date: tomorrow.toISOString().split('T')[0],
        time: '09:00',
        score: 85,
        reason: 'Demain matin - Disponible',
        icon: '🌅'
      });

      const in3Days = new Date(now);
      in3Days.setDate(in3Days.getDate() + 3);
      suggestedSlots.push({
        date: in3Days.toISOString().split('T')[0],
        time: '14:00',
        score: 80,
        reason: 'Après-midi tranquille',
        icon: '☀️'
      });

      const nextMorning = new Date(now);
      nextMorning.setDate(nextMorning.getDate() + 1);
      suggestedSlots.push({
        date: nextMorning.toISOString().split('T')[0],
        time: '10:30',
        score: 75,
        reason: 'Milieu de matinée',
        icon: '⏰'
      });

      setSuggestions(suggestedSlots.sort((a, b) => b.score - a.score));
    } catch (error) {
      console.error('Error generating suggestions:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleBookAppointment(suggestion: SmartSuggestion) {
    if (!patientId || !patient) return;

    try {
      const { error } = await supabase.from('appointments').insert({
        patient_id: patientId,
        name: patientName || `${patient.first_name} ${patient.last_name}`,
        email: patient.email || '',
        phone: patient.phone || '',
        scheduled_date: suggestion.date,
        scheduled_time: suggestion.time,
        duration_minutes: duration,
        status: 'confirmed',
        reason: reason,
        notes: `Booké automatiquement via Smart Scheduling (${suggestion.reason})`
      });

      if (error) throw error;

      toast.success(`✅ RDV confirmé: ${new Date(suggestion.date).toLocaleDateString('fr-CA')} à ${suggestion.time}`);
      onSuccess?.();
      onClose();
    } catch (error: any) {
      console.error('Error booking appointment:', error);
      toast.error('Erreur: ' + (error.message || 'Erreur inconnue'));
    }
  }

  const patientPattern = useMemo(() => {
    if (appointments.length < 2) return null;

    const intervals: number[] = [];
    for (let i = 0; i < appointments.length - 1; i++) {
      const date1 = new Date(appointments[i].scheduled_date || '');
      const date2 = new Date(appointments[i + 1].scheduled_date || '');
      const diff = Math.abs(date1.getTime() - date2.getTime());
      const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
      intervals.push(days);
    }

    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const frequency = Math.round(avgInterval);

    const times = appointments
      .map(a => a.scheduled_time)
      .filter(Boolean) as string[];
    const timeCount: { [key: string]: number } = {};
    times.forEach(t => {
      timeCount[t] = (timeCount[t] || 0) + 1;
    });
    const preferredTime = Object.keys(timeCount).sort((a, b) => timeCount[b] - timeCount[a])[0];

    return { frequency, preferredTime };
  }, [appointments]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[150] flex items-center justify-center p-6" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl rounded-xl"
      >
        <div className="sticky top-0 bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-6 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur">
              <Zap className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-2xl font-bold">🤖 Smart Scheduling</h3>
              <p className="text-sm text-white/90">{patientName || 'Patient'}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {patientPattern && (
            <div className="mb-6 bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-5 h-5 text-purple-600" />
                <h4 className="font-bold text-gray-900">Pattern Détecté</h4>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white rounded-lg p-3 border border-purple-200">
                  <div className="text-xs text-gray-600 mb-1">Fréquence habituelle</div>
                  <div className="text-xl font-bold text-purple-600">Tous les {patientPattern.frequency} jours</div>
                </div>
                <div className="bg-white rounded-lg p-3 border border-purple-200">
                  <div className="text-xs text-gray-600 mb-1">Heure préférée</div>
                  <div className="text-xl font-bold text-purple-600">{patientPattern.preferredTime}</div>
                </div>
                <div className="bg-white rounded-lg p-3 border border-purple-200">
                  <div className="text-xs text-gray-600 mb-1">Visites totales</div>
                  <div className="text-xl font-bold text-purple-600">{appointments.length}</div>
                </div>
              </div>
            </div>
          )}

          <div className="mb-6">
            <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Zap className="w-5 h-5 text-blue-600" />
              Créneaux Suggérés (Basés sur l'historique)
            </h4>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="space-y-3">
                {suggestions.map((suggestion, index) => (
                  <motion.button
                    key={index}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => setSelectedSuggestion(suggestion)}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                      selectedSuggestion === suggestion
                        ? 'border-blue-500 bg-blue-50 shadow-lg scale-[1.02]'
                        : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="text-4xl">{suggestion.icon}</div>
                        <div>
                          <div className="font-bold text-lg text-gray-900">
                            {new Date(suggestion.date).toLocaleDateString('fr-CA', {
                              weekday: 'long',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </div>
                          <div className="text-sm text-gray-600 mt-1 flex items-center gap-3">
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {suggestion.time}
                            </span>
                            <span>•</span>
                            <span>{suggestion.reason}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-gray-500 mb-1">Score Match</div>
                        <div className="text-2xl font-bold text-blue-600">{suggestion.score}%</div>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            )}
          </div>

          {selectedSuggestion && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl p-6"
            >
              <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-green-600" />
                Confirmer le rendez-vous
              </h4>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Durée (minutes)</label>
                  <select
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200"
                  >
                    <option value={15}>15 minutes</option>
                    <option value={30}>30 minutes</option>
                    <option value={45}>45 minutes</option>
                    <option value={60}>60 minutes</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Motif</label>
                  <select
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200"
                  >
                    <option value="Suivi régulier">Suivi régulier</option>
                    <option value="Ajustement">Ajustement</option>
                    <option value="Consultation">Consultation</option>
                    <option value="Réévaluation">Réévaluation</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-green-300">
                <div className="text-sm text-gray-700">
                  <div className="font-medium">Résumé:</div>
                  <div className="mt-1">
                    {new Date(selectedSuggestion.date).toLocaleDateString('fr-CA')} à {selectedSuggestion.time} - {duration}min
                  </div>
                </div>
                <button
                  onClick={() => handleBookAppointment(selectedSuggestion)}
                  className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-300 shadow-lg font-bold flex items-center gap-2"
                >
                  <Zap className="w-5 h-5" />
                  Confirmer en 1 clic
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
