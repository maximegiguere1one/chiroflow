import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import {
  Clock, Calendar, DollarSign, CheckCircle, AlertTriangle,
  Phone, MessageSquare, FileText, User, Zap, TrendingUp,
  Coffee, Activity, MoreHorizontal, ChevronRight, Bell,
  Circle, X
} from 'lucide-react';
import type { Appointment } from '../../types/database';
import { useToastContext } from '../../contexts/ToastContext';
import { formatDistance } from '../../lib/dateUtils';

interface TodayStats {
  completed: number;
  total: number;
  pending: number;
  revenue: number;
  avgDuration: number;
  completionRate: number;
}

export function TodayDashboard10X() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApt, setSelectedApt] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const toast = useToastContext();

  useEffect(() => {
    loadTodayData();
    const dataInterval = setInterval(loadTodayData, 30000);
    const timeInterval = setInterval(() => setCurrentTime(new Date()), 10000);
    return () => {
      clearInterval(dataInterval);
      clearInterval(timeInterval);
    };
  }, []);

  async function loadTodayData() {
    try {
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

      const { data, error } = await supabase
        .from('appointments_api')
        .select('*')
        .gte('scheduled_at', startOfDay.toISOString())
        .lte('scheduled_at', endOfDay.toISOString())
        .order('scheduled_at', { ascending: true });

      if (error) throw error;

      const appointmentsWithTime = (data || []).map(apt => ({
        ...apt,
        scheduled_time: apt.scheduled_at ? new Date(apt.scheduled_at).toTimeString().slice(0, 5) : null
      }));

      setAppointments(appointmentsWithTime);
    } catch (error) {
      console.error('Error loading today data:', error);
    } finally {
      setLoading(false);
    }
  }

  const currentAppointment = useMemo(() => {
    const currentTimeStr = `${currentTime.getHours().toString().padStart(2, '0')}:${currentTime.getMinutes().toString().padStart(2, '0')}`;

    return appointments.find(apt => {
      if (apt.status === 'completed' || apt.status === 'cancelled') return false;
      const aptTime = apt.scheduled_time || '00:00';
      const aptEndTime = addMinutes(aptTime, apt.duration_minutes || 30);
      return aptTime <= currentTimeStr && currentTimeStr < aptEndTime;
    });
  }, [appointments, currentTime]);

  const upcomingNext3 = useMemo(() => {
    const currentTimeStr = `${currentTime.getHours().toString().padStart(2, '0')}:${currentTime.getMinutes().toString().padStart(2, '0')}`;

    return appointments
      .filter(apt => {
        if (apt.status === 'completed' || apt.status === 'cancelled') return false;
        const aptTime = apt.scheduled_time || '00:00';
        return aptTime > currentTimeStr;
      })
      .slice(0, 3);
  }, [appointments, currentTime]);

  const stats: TodayStats = useMemo(() => {
    const completed = appointments.filter(a => a.status === 'completed').length;
    const total = appointments.filter(a => a.status !== 'cancelled').length;
    const pending = total - completed;
    const totalDuration = appointments
      .filter(a => a.status === 'completed')
      .reduce((sum, a) => sum + (a.duration_minutes || 0), 0);

    return {
      completed,
      total,
      pending,
      revenue: completed * 85,
      avgDuration: completed > 0 ? Math.round(totalDuration / completed) : 0,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0
    };
  }, [appointments]);

  async function handleCompleteAppointment(id: string) {
    try {
      const { error } = await supabase
        .from('appointments_api')
        .update({ status: 'completed' })
        .eq('id', id);

      if (error) throw error;
      await loadTodayData();
      toast.success('✓ RDV complété');
    } catch (error) {
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
    const [hours, minutes] = time.split(':').map(Number);
    const aptTime = new Date(currentTime);
    aptTime.setHours(hours, minutes, 0);
    const diff = aptTime.getTime() - currentTime.getTime();
    const mins = Math.floor(diff / 60000);

    if (mins < 0) return `${Math.abs(mins)}min en retard`;
    if (mins === 0) return 'Maintenant';
    if (mins < 60) return `${mins}min`;
    const hrs = Math.floor(mins / 60);
    const remainMins = mins % 60;
    return remainMins > 0 ? `${hrs}h${remainMins}` : `${hrs}h`;
  }

  function getProgressPercentage(): number {
    if (stats.total === 0) return 0;
    return Math.round((stats.completed / stats.total) * 100);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-gold-200 border-t-gold-600 rounded-full animate-spin" />
          <p className="text-sm text-foreground/60">Chargement de votre journée...</p>
        </div>
      </div>
    );
  }

  const progress = getProgressPercentage();

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-gold-50/20 p-8">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* HEADER ÉPURÉ */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-sm font-medium text-foreground/60 uppercase tracking-wider">
                {new Date().toLocaleDateString('fr-CA', { weekday: 'long', day: 'numeric', month: 'long' })}
              </span>
            </div>
            <h1 className="text-5xl font-light text-foreground tracking-tight">
              Tableau de bord
            </h1>
          </div>

          <div className="text-right space-y-2">
            <div className="text-6xl font-extralight text-foreground tabular-nums tracking-tight">
              {currentTime.toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit' })}
            </div>
            <div className="flex items-center justify-end gap-2">
              <div className={`w-2 h-2 rounded-full ${progress === 100 ? 'bg-green-500' : progress > 50 ? 'bg-blue-500' : 'bg-orange-500'}`} />
              <span className="text-sm text-foreground/60">
                {stats.completed} / {stats.total} terminés
              </span>
            </div>
          </div>
        </div>

        {/* BARRE DE PROGRÈS ÉLÉGANTE */}
        <div className="relative h-3 bg-neutral-100 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className={`absolute inset-y-0 left-0 rounded-full ${
              progress === 100
                ? 'bg-gradient-to-r from-green-400 to-green-500'
                : progress > 50
                ? 'bg-gradient-to-r from-blue-400 to-blue-500'
                : 'bg-gradient-to-r from-orange-400 to-orange-500'
            }`}
          />
        </div>

        {/* STATS CARDS - DESIGN MINIMALISTE */}
        <div className="grid grid-cols-4 gap-4">
          <motion.div
            whileHover={{ y: -4 }}
            className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-4">
              <Calendar className="w-5 h-5 text-blue-500" />
              <span className="text-3xl font-light text-foreground tabular-nums">{stats.total}</span>
            </div>
            <div className="text-sm font-medium text-foreground/70">Total aujourd'hui</div>
          </motion.div>

          <motion.div
            whileHover={{ y: -4 }}
            className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-4">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span className="text-3xl font-light text-foreground tabular-nums">{stats.completed}</span>
            </div>
            <div className="text-sm font-medium text-foreground/70">Complétés</div>
            <div className="mt-2 text-xs text-green-600 font-medium">{progress}% du jour</div>
          </motion.div>

          <motion.div
            whileHover={{ y: -4 }}
            className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-4">
              <Clock className="w-5 h-5 text-orange-500" />
              <span className="text-3xl font-light text-foreground tabular-nums">{stats.pending}</span>
            </div>
            <div className="text-sm font-medium text-foreground/70">En attente</div>
            {stats.avgDuration > 0 && (
              <div className="mt-2 text-xs text-orange-600 font-medium">{stats.avgDuration}min moy.</div>
            )}
          </motion.div>

          <motion.div
            whileHover={{ y: -4 }}
            className="bg-gradient-to-br from-gold-500 to-gold-600 border border-gold-400 rounded-2xl p-6 shadow-md hover:shadow-lg transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-4">
              <DollarSign className="w-5 h-5 text-white/90" />
              <span className="text-3xl font-light text-white tabular-nums">${stats.revenue}</span>
            </div>
            <div className="text-sm font-medium text-white/90">Revenus</div>
          </motion.div>
        </div>

        {/* CURRENT APPOINTMENT - ULTRA FOCUS */}
        <AnimatePresence mode="wait">
          {currentAppointment && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="relative"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-3xl blur-xl" />

              <div className="relative bg-white border-2 border-blue-200 rounded-3xl p-8 shadow-xl">
                <div className="absolute top-0 left-8 -translate-y-1/2">
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-500 text-white text-xs font-bold uppercase tracking-wider rounded-full shadow-lg">
                    <Activity className="w-3 h-3 animate-pulse" />
                    En cours
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-8 mt-4">
                  <div className="col-span-2 space-y-4">
                    <div>
                      <div className="text-4xl font-light text-foreground mb-2">
                        {currentAppointment.name}
                      </div>
                      <div className="flex items-center gap-4 text-foreground/60">
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-4 h-4" />
                          {currentAppointment.scheduled_time} - {addMinutes(currentAppointment.scheduled_time || '00:00', currentAppointment.duration_minutes || 30)}
                        </span>
                        <span className="text-foreground/40">•</span>
                        <span>{currentAppointment.duration_minutes || 30}min</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex-1 bg-neutral-50 rounded-xl p-4">
                        <div className="text-xs font-medium text-foreground/50 uppercase tracking-wider mb-1">Motif</div>
                        <div className="text-base text-foreground">{currentAppointment.reason}</div>
                      </div>
                      <div className="flex-1 bg-neutral-50 rounded-xl p-4">
                        <div className="text-xs font-medium text-foreground/50 uppercase tracking-wider mb-1">Contact</div>
                        <div className="text-base text-foreground">{currentAppointment.phone}</div>
                      </div>
                    </div>

                    {currentAppointment.notes && (
                      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                        <div className="text-xs font-medium text-blue-600 uppercase tracking-wider mb-2">Notes</div>
                        <div className="text-sm text-foreground/80">{currentAppointment.notes}</div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <button
                      onClick={() => toast.info('Ouverture du dossier...')}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl transition-all shadow-lg hover:shadow-xl font-medium"
                    >
                      <FileText className="w-5 h-5" />
                      Ouvrir dossier
                    </button>

                    <button
                      onClick={() => toast.info('Note SOAP rapide...')}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3.5 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-xl transition-all shadow-lg hover:shadow-xl font-medium"
                    >
                      <Zap className="w-5 h-5" />
                      Note SOAP
                    </button>

                    <button
                      onClick={() => handleCompleteAppointment(currentAppointment.id)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3.5 bg-white hover:bg-neutral-50 border-2 border-neutral-200 hover:border-green-300 text-foreground rounded-xl transition-all font-medium"
                    >
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      Marquer complété
                    </button>

                    <div className="pt-3 border-t border-neutral-200 flex items-center gap-2">
                      <button
                        onClick={() => window.location.href = `tel:${currentAppointment.phone}`}
                        className="flex-1 p-3 bg-green-50 hover:bg-green-100 border border-green-200 rounded-xl transition-all"
                        title="Appeler"
                      >
                        <Phone className="w-5 h-5 text-green-600 mx-auto" />
                      </button>
                      <button
                        onClick={() => toast.success('SMS envoyé')}
                        className="flex-1 p-3 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition-all"
                        title="SMS"
                      >
                        <MessageSquare className="w-5 h-5 text-blue-600 mx-auto" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* PROCHAINS 3 RDV - LISTE COMPACTE */}
        {upcomingNext3.length > 0 && (
          <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between">
              <h3 className="text-lg font-medium text-foreground">Prochains rendez-vous</h3>
              <span className="text-sm text-foreground/50">{upcomingNext3.length} à venir</span>
            </div>

            <div className="divide-y divide-neutral-100">
              {upcomingNext3.map((apt, index) => (
                <motion.div
                  key={apt.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="px-6 py-4 hover:bg-neutral-50 transition-colors cursor-pointer group"
                  onClick={() => setSelectedApt(selectedApt === apt.id ? null : apt.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="text-center min-w-[80px]">
                        <div className="text-2xl font-light text-foreground tabular-nums">
                          {apt.scheduled_time}
                        </div>
                        <div className="text-xs text-foreground/50">
                          {getTimeUntil(apt.scheduled_time || '00:00')}
                        </div>
                      </div>

                      <div className="flex-1">
                        <div className="font-medium text-foreground group-hover:text-blue-600 transition-colors">
                          {apt.name}
                        </div>
                        <div className="text-sm text-foreground/60 flex items-center gap-2">
                          <span>{apt.reason}</span>
                          <span className="text-foreground/30">•</span>
                          <span>{apt.duration_minutes || 30}min</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          window.location.href = `tel:${apt.phone}`;
                        }}
                        className="p-2.5 hover:bg-green-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Phone className="w-4 h-4 text-green-600" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toast.success('SMS envoyé');
                        }}
                        className="p-2.5 hover:bg-blue-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                      >
                        <MessageSquare className="w-4 h-4 text-blue-600" />
                      </button>
                      <ChevronRight className={`w-5 h-5 text-foreground/30 transition-transform ${selectedApt === apt.id ? 'rotate-90' : ''}`} />
                    </div>
                  </div>

                  <AnimatePresence>
                    {selectedApt === apt.id && apt.notes && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="mt-4 pt-4 border-t border-neutral-100"
                      >
                        <div className="bg-blue-50 rounded-lg p-3">
                          <div className="text-xs font-medium text-blue-600 mb-1">Notes</div>
                          <div className="text-sm text-foreground/80">{apt.notes}</div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* EMPTY STATE */}
        {!currentAppointment && upcomingNext3.length === 0 && stats.total === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-20"
          >
            <div className="w-20 h-20 bg-neutral-100 rounded-full flex items-center justify-center mb-6">
              <Coffee className="w-10 h-10 text-neutral-400" />
            </div>
            <h3 className="text-2xl font-light text-foreground mb-2">Journée calme</h3>
            <p className="text-foreground/60 text-center max-w-md">
              Aucun rendez-vous prévu aujourd'hui. Profitez-en pour vous reposer ou faire de l'administratif.
            </p>
          </motion.div>
        )}

        {/* JOURNÉE TERMINÉE */}
        {stats.total > 0 && stats.completed === stats.total && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-2xl p-8 text-center shadow-xl"
          >
            <div className="text-6xl mb-4">🎉</div>
            <h3 className="text-3xl font-light mb-2">Journée terminée!</h3>
            <p className="text-white/90 text-lg">
              {stats.total} rendez-vous complétés • ${stats.revenue} facturés
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
