import { motion } from 'framer-motion';
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import {
  Clock, Calendar, DollarSign, AlertCircle, CheckCircle,
  Phone, MessageSquare, FileText, User, Zap, TrendingUp
} from 'lucide-react';
import type { Appointment, Patient } from '../../types/database';
import { useToastContext } from '../../contexts/ToastContext';

interface TodayStats {
  completed: number;
  total: number;
  late: number;
  revenue: number;
  walkIns: number;
}

export function TodayDashboard() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const toast = useToastContext();

  useEffect(() => {
    loadTodayData();
    const interval = setInterval(loadTodayData, 30000);
    return () => clearInterval(interval);
  }, []);

  async function loadTodayData() {
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('scheduled_date', today)
        .order('scheduled_time', { ascending: true });

      if (error) throw error;
      setAppointments(data || []);
    } catch (error) {
      console.error('Error loading today data:', error);
    } finally {
      setLoading(false);
    }
  }

  const currentAppointment = useMemo(() => {
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    return appointments.find(apt => {
      if (apt.status === 'completed' || apt.status === 'cancelled') return false;
      const aptTime = apt.scheduled_time || '00:00';
      const aptEndTime = addMinutes(aptTime, apt.duration_minutes);
      return aptTime <= currentTime && currentTime < aptEndTime;
    });
  }, [appointments]);

  const nextAppointment = useMemo(() => {
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    return appointments.find(apt => {
      if (apt.status === 'completed' || apt.status === 'cancelled') return false;
      const aptTime = apt.scheduled_time || '00:00';
      return aptTime > currentTime;
    });
  }, [appointments]);

  const stats: TodayStats = useMemo(() => {
    const completed = appointments.filter(a => a.status === 'completed').length;
    const total = appointments.filter(a => a.status !== 'cancelled').length;

    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const late = appointments.filter(apt => {
      if (apt.status === 'completed' || apt.status === 'cancelled') return false;
      const aptTime = apt.scheduled_time || '00:00';
      return aptTime < currentTime;
    }).length;

    return {
      completed,
      total,
      late,
      revenue: completed * 85,
      walkIns: 0
    };
  }, [appointments]);

  const upcomingAppointments = useMemo(() => {
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    return appointments
      .filter(apt => {
        if (apt.status === 'completed' || apt.status === 'cancelled') return false;
        const aptTime = apt.scheduled_time || '00:00';
        return aptTime > currentTime;
      })
      .slice(0, 5);
  }, [appointments]);

  async function handleQuickAction(aptId: string, action: 'complete' | 'soap' | 'call' | 'sms') {
    const apt = appointments.find(a => a.id === aptId);
    if (!apt) return;

    switch (action) {
      case 'complete':
        await completeAppointment(aptId);
        break;
      case 'soap':
        toast.info('Ouverture note SOAP...');
        break;
      case 'call':
        window.location.href = `tel:${apt.phone}`;
        break;
      case 'sms':
        toast.success(`SMS envoyé à ${apt.name}`);
        break;
    }
  }

  async function completeAppointment(id: string) {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'completed' })
        .eq('id', id);

      if (error) throw error;
      await loadTodayData();
      toast.success('RDV marqué comme complété');
    } catch (error) {
      console.error('Error completing appointment:', error);
      toast.error('Erreur lors de la mise à jour');
    }
  }

  function addMinutes(time: string, minutes: number): string {
    const [hours, mins] = time.split(':').map(Number);
    const totalMins = hours * 60 + mins + minutes;
    const newHours = Math.floor(totalMins / 60) % 24;
    const newMins = totalMins % 60;
    return `${newHours.toString().padStart(2, '0')}:${newMins.toString().padStart(2, '0')}`;
  }

  function getTimeUntil(time: string): string {
    const now = new Date();
    const [hours, minutes] = time.split(':').map(Number);
    const aptTime = new Date(now);
    aptTime.setHours(hours, minutes, 0);
    const diff = aptTime.getTime() - now.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 0) return `En retard de ${Math.abs(mins)}min`;
    if (mins < 60) return `Dans ${mins}min`;
    return `Dans ${Math.floor(mins / 60)}h${mins % 60}`;
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
      {/* Header avec heure */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading text-foreground flex items-center gap-3">
            <span className="text-4xl">🌅</span>
            <span>Ma Journée</span>
          </h1>
          <p className="text-foreground/60 mt-1">
            {new Date().toLocaleDateString('fr-CA', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
        </div>
        <div className="text-right">
          <div className="text-4xl font-bold text-gold-600">
            {new Date().toLocaleTimeString('fr-CA', {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </div>
          <div className="text-sm text-foreground/60 mt-1">
            {stats.completed}/{stats.total} complétés
          </div>
        </div>
      </div>

      {/* Current Appointment - MEGA VISIBLE */}
      {currentAppointment && (
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative overflow-hidden rounded-xl border-4 border-gold-400 bg-gradient-to-br from-gold-50 to-yellow-50 shadow-2xl"
        >
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-gold-400 via-yellow-400 to-gold-400 animate-pulse" />

          <div className="p-8">
            <div className="flex items-start justify-between mb-6">
              <div>
                <div className="text-sm font-bold text-gold-600 uppercase tracking-wide mb-2">
                  🔴 MAINTENANT
                </div>
                <h2 className="text-3xl font-bold text-foreground">
                  {currentAppointment.name}
                </h2>
                <p className="text-foreground/60 mt-1">
                  {currentAppointment.scheduled_time} - {addMinutes(currentAppointment.scheduled_time || '00:00', currentAppointment.duration_minutes)}
                  <span className="ml-2">({currentAppointment.duration_minutes}min)</span>
                </p>
              </div>
              <div className="text-right">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gold-300 rounded-lg">
                  <Clock className="w-5 h-5 text-gold-600" />
                  <span className="text-xl font-bold text-gold-600">
                    {currentAppointment.duration_minutes}min
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-6">
              <div className="bg-white rounded-lg p-4 border border-neutral-200">
                <div className="text-sm text-foreground/60 mb-1">Motif</div>
                <div className="text-lg font-medium text-foreground">
                  {currentAppointment.reason}
                </div>
              </div>
              <div className="bg-white rounded-lg p-4 border border-neutral-200">
                <div className="text-sm text-foreground/60 mb-1">Contact</div>
                <div className="text-lg font-medium text-foreground">
                  {currentAppointment.phone}
                </div>
              </div>
            </div>

            {currentAppointment.notes && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="text-sm font-medium text-blue-700 mb-1">📝 Notes</div>
                <div className="text-foreground/80">{currentAppointment.notes}</div>
              </div>
            )}

            <div className="flex items-center gap-3">
              <button
                onClick={() => handleQuickAction(currentAppointment.id, 'soap')}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-gold-500 to-gold-600 text-white rounded-lg hover:from-gold-600 hover:to-gold-700 transition-all duration-300 shadow-lg hover:shadow-xl text-lg font-medium"
              >
                <FileText className="w-6 h-6" />
                Ouvrir Dossier
              </button>
              <button
                onClick={() => handleQuickAction(currentAppointment.id, 'soap')}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-300 shadow-lg hover:shadow-xl text-lg font-medium"
              >
                <Zap className="w-6 h-6" />
                Note SOAP Rapide
              </button>
              <button
                onClick={() => handleQuickAction(currentAppointment.id, 'complete')}
                className="px-6 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl"
                title="Marquer comme complété"
              >
                <CheckCircle className="w-6 h-6" />
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Next Appointment */}
      {nextAppointment && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="text-sm font-bold text-blue-600 uppercase tracking-wide mb-2">
                ⏭️ PROCHAIN
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-2">
                {nextAppointment.name}
              </h3>
              <div className="flex items-center gap-4 text-foreground/70">
                <span className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  {nextAppointment.scheduled_time} ({getTimeUntil(nextAppointment.scheduled_time || '00:00')})
                </span>
                <span>•</span>
                <span>{nextAppointment.reason}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleQuickAction(nextAppointment.id, 'call')}
                className="p-3 bg-white hover:bg-green-50 border border-neutral-300 rounded-lg transition-all"
                title="Appeler"
              >
                <Phone className="w-5 h-5 text-green-600" />
              </button>
              <button
                onClick={() => handleQuickAction(nextAppointment.id, 'sms')}
                className="p-3 bg-white hover:bg-blue-50 border border-neutral-300 rounded-lg transition-all"
                title="SMS"
              >
                <MessageSquare className="w-5 h-5 text-blue-600" />
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-4">
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl p-6 shadow-lg"
        >
          <div className="flex items-center justify-between mb-3">
            <Calendar className="w-8 h-8 opacity-80" />
            <div className="text-3xl font-bold">{stats.total}</div>
          </div>
          <div className="text-sm font-medium opacity-90">Aujourd'hui</div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.05 }}
          className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl p-6 shadow-lg"
        >
          <div className="flex items-center justify-between mb-3">
            <CheckCircle className="w-8 h-8 opacity-80" />
            <div className="text-3xl font-bold">{stats.completed}</div>
          </div>
          <div className="text-sm font-medium opacity-90">Complétés</div>
        </motion.div>

        {stats.late > 0 && (
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-gradient-to-br from-red-500 to-red-600 text-white rounded-xl p-6 shadow-lg"
          >
            <div className="flex items-center justify-between mb-3">
              <AlertCircle className="w-8 h-8 opacity-80" />
              <div className="text-3xl font-bold">{stats.late}</div>
            </div>
            <div className="text-sm font-medium opacity-90">En retard</div>
          </motion.div>
        )}

        <motion.div
          whileHover={{ scale: 1.05 }}
          className="bg-gradient-to-br from-gold-500 to-gold-600 text-white rounded-xl p-6 shadow-lg"
        >
          <div className="flex items-center justify-between mb-3">
            <DollarSign className="w-8 h-8 opacity-80" />
            <div className="text-3xl font-bold">${stats.revenue}</div>
          </div>
          <div className="text-sm font-medium opacity-90">Facturé</div>
        </motion.div>
      </div>

      {/* Upcoming Appointments */}
      {upcomingAppointments.length > 0 && (
        <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-neutral-200 bg-neutral-50">
            <h3 className="text-lg font-bold text-foreground">
              Prochains rendez-vous
            </h3>
          </div>
          <div className="divide-y divide-neutral-100">
            {upcomingAppointments.map((apt) => (
              <div
                key={apt.id}
                className="px-6 py-4 hover:bg-neutral-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-foreground">
                        {apt.scheduled_time}
                      </div>
                      <div className="text-xs text-foreground/50">
                        {apt.duration_minutes}min
                      </div>
                    </div>
                    <div>
                      <div className="font-medium text-foreground">{apt.name}</div>
                      <div className="text-sm text-foreground/60">{apt.reason}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleQuickAction(apt.id, 'call')}
                      className="p-2 hover:bg-green-50 rounded-lg transition-all"
                      title="Appeler"
                    >
                      <Phone className="w-4 h-4 text-green-600" />
                    </button>
                    <button
                      onClick={() => handleQuickAction(apt.id, 'sms')}
                      className="p-2 hover:bg-blue-50 rounded-lg transition-all"
                      title="SMS"
                    >
                      <MessageSquare className="w-4 h-4 text-blue-600" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!currentAppointment && !nextAppointment && stats.total === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">☀️</div>
          <h3 className="text-2xl font-bold text-foreground mb-2">
            Journée libre aujourd'hui!
          </h3>
          <p className="text-foreground/60">
            Aucun rendez-vous prévu
          </p>
        </div>
      )}
    </div>
  );
}
