import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { ChevronLeft, ChevronRight, Plus, AlertCircle, CheckCircle, X, Search, Filter, Calendar as CalendarIcon, Clock, User } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToastContext } from '../../contexts/ToastContext';
import type { Appointment } from '../../types/database';
import { createScheduledAt } from '../../lib/dateUtils';

interface EnhancedCalendarProps {
  onAppointmentClick?: (appointment: Appointment) => void;
  onNewAppointment?: (date: Date) => void;
}

interface NoShowPrediction {
  id: string;
  appointment_id: string;
  risk_level: 'low' | 'medium' | 'high';
  risk_score: number;
  factors: any;
  actual_outcome: string | null;
}

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  appointments: Appointment[];
}

export function EnhancedCalendar({ onAppointmentClick, onNewAppointment }: EnhancedCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'week' | 'day'>('week');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [predictions, setPredictions] = useState<Map<string, NoShowPrediction>>(new Map());
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [loading, setLoading] = useState(false);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const loadTimeoutRef = useRef<NodeJS.Timeout>();
  const [draggedAppointment, setDraggedAppointment] = useState<Appointment | null>(null);
  const [showNewAppointmentModal, setShowNewAppointmentModal] = useState(false);
  const [modalInitialDate, setModalInitialDate] = useState<Date | null>(null);
  const toast = useToastContext();

  useEffect(() => {
    if (loadTimeoutRef.current) {
      clearTimeout(loadTimeoutRef.current);
    }
    loadTimeoutRef.current = setTimeout(() => {
      loadAppointments();
      loadNoShowPredictions();
    }, 150);

    return () => {
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
      }
    };
  }, [currentDate, view]);

  const loadAppointments = useCallback(async () => {
    try {
      setLoading(true);
      const startDate = getViewStartDate();
      const endDate = getViewEndDate();

      const { data, error } = await supabase
        .from('appointments_api')
        .select('*')
        .gte('scheduled_date', formatDateForDB(startDate))
        .lte('scheduled_date', formatDateForDB(endDate))
        .order('scheduled_date', { ascending: true })
        .order('scheduled_time', { ascending: true });

      if (error) throw error;
      setAppointments(data || []);
    } catch (error) {
      console.error('Error loading appointments:', error);
      toast.error('Erreur lors du chargement des rendez-vous');
    } finally {
      setLoading(false);
    }
  }, [currentDate, view]);

  const loadNoShowPredictions = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('no_show_predictions')
        .select('*')
        .is('actual_outcome', null);

      if (error) throw error;

      const predMap = new Map<string, NoShowPrediction>();
      data?.forEach(pred => {
        predMap.set(pred.appointment_id, pred);
      });
      setPredictions(predMap);
    } catch (error) {
      console.error('Error loading predictions:', error);
    }
  }, []);

  function formatDateForDB(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function getViewStartDate(): Date {
    const date = new Date(currentDate);
    date.setHours(0, 0, 0, 0);

    if (view === 'month') {
      date.setDate(1);
      const dayOfWeek = date.getDay();
      date.setDate(date.getDate() - dayOfWeek);
    } else if (view === 'week') {
      const dayOfWeek = date.getDay();
      date.setDate(date.getDate() - dayOfWeek);
    }
    return date;
  }

  function getViewEndDate(): Date {
    const date = new Date(currentDate);
    date.setHours(23, 59, 59, 999);

    if (view === 'month') {
      date.setMonth(date.getMonth() + 1);
      date.setDate(0);
      const dayOfWeek = date.getDay();
      date.setDate(date.getDate() + (6 - dayOfWeek));
    } else if (view === 'week') {
      const dayOfWeek = date.getDay();
      date.setDate(date.getDate() + (6 - dayOfWeek));
    }
    return date;
  }

  function navigateView(direction: 'prev' | 'next') {
    const newDate = new Date(currentDate);
    if (view === 'month') {
      newDate.setMonth(currentDate.getMonth() + (direction === 'next' ? 1 : -1));
    } else if (view === 'week') {
      newDate.setDate(currentDate.getDate() + (direction === 'next' ? 7 : -7));
    } else {
      newDate.setDate(currentDate.getDate() + (direction === 'next' ? 1 : -1));
    }
    setCurrentDate(newDate);
  }

  const checkTimeSlotAvailability = useCallback((date: Date, time: string, excludeId?: string): boolean => {
    const dateStr = formatDateForDB(date);
    const conflictingAppt = appointments.find(apt =>
      apt.id !== excludeId &&
      apt.scheduled_date === dateStr &&
      apt.scheduled_time === time &&
      apt.status !== 'cancelled'
    );
    return !conflictingAppt;
  }, [appointments]);

  const handleDrop = useCallback(async (date: Date, time: string) => {
    if (!draggedAppointment) return;

    try {
      const newDate = formatDateForDB(date);

      if (!checkTimeSlotAvailability(date, time, draggedAppointment.id)) {
        toast.warning('Ce créneau est déjà occupé');
        setDraggedAppointment(null);
        return;
      }

      const { error } = await supabase
        .from('appointments_api')
        .update({
          scheduled_date: newDate,
          scheduled_time: time,
          updated_at: new Date().toISOString()
        })
        .eq('id', draggedAppointment.id);

      if (error) throw error;

      toast.success('Rendez-vous déplacé avec succès');
      await loadAppointments();
      await loadNoShowPredictions();
    } catch (error: any) {
      console.error('Error moving appointment:', error);
      toast.error('Erreur: ' + (error.message || 'Erreur lors du déplacement'));
    } finally {
      setDraggedAppointment(null);
    }
  }, [draggedAppointment, checkTimeSlotAvailability, loadAppointments, loadNoShowPredictions, toast]);

  const monthNames = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  const filteredAppointments = useMemo(() => {
    let filtered = appointments;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(apt =>
        apt.name?.toLowerCase().includes(query) ||
        apt.email?.toLowerCase().includes(query) ||
        apt.reason?.toLowerCase().includes(query)
      );
    }

    if (filterStatus && filterStatus !== 'all') {
      filtered = filtered.filter(apt => apt.status === filterStatus);
    }

    return filtered;
  }, [appointments, searchQuery, filterStatus]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white border border-neutral-200 shadow-soft-lg p-6">
        {/* Search and Filter Bar */}
        <div className="flex flex-wrap items-center gap-4 mb-6 pb-4 border-b border-neutral-200">
          <div className="flex-1 min-w-[200px] max-w-md relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
            <input
              type="text"
              placeholder="Rechercher un patient, email ou motif..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200 transition-all"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-foreground/60" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-neutral-300 rounded-lg focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200 transition-all"
            >
              <option value="all">Tous les statuts</option>
              <option value="pending">En attente</option>
              <option value="confirmed">Confirmé</option>
              <option value="completed">Complété</option>
              <option value="cancelled">Annulé</option>
              <option value="no_show">No-show</option>
            </select>
          </div>
          <div className="text-sm text-foreground/60">
            {filteredAppointments.length} rendez-vous
            {searchQuery || filterStatus !== 'all' ? ` (${appointments.length} total)` : ''}
          </div>
        </div>

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-heading text-foreground">
              {view === 'month' && `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`}
              {view === 'week' && `Semaine du ${getViewStartDate().toLocaleDateString('fr-CA', { day: 'numeric', month: 'long' })}`}
              {view === 'day' && currentDate.toLocaleDateString('fr-CA', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigateView('prev')}
                className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => setCurrentDate(new Date())}
                className="px-4 py-2 text-sm border border-neutral-300 hover:border-gold-400 hover:bg-neutral-50 rounded transition-all"
              >
                Aujourd'hui
              </button>
              <button
                onClick={() => navigateView('next')}
                className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex border border-neutral-300 rounded overflow-hidden">
              {(['month', 'week', 'day'] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={`px-4 py-2 text-sm transition-colors ${
                    view === v
                      ? 'bg-gradient-to-r from-gold-500 to-gold-600 text-white'
                      : 'bg-white text-foreground hover:bg-neutral-50'
                  }`}
                >
                  {v === 'month' ? 'Mois' : v === 'week' ? 'Semaine' : 'Jour'}
                </button>
              ))}
            </div>
            <button
              onClick={() => {
                setModalInitialDate(currentDate);
                setShowNewAppointmentModal(true);
                onNewAppointment?.(currentDate);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-gold-500 to-gold-600 text-white hover:from-gold-600 hover:to-gold-700 rounded transition-all shadow-soft"
            >
              <Plus className="w-4 h-4" />
              Nouveau RDV
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            <span>Confirmé</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-500 rounded"></div>
            <span>En attente</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded"></div>
            <span>Risque élevé no-show</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-orange-500 rounded"></div>
            <span>Risque moyen</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded"></div>
            <span>Complété</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-neutral-400 rounded"></div>
            <span>Annulé</span>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white border border-neutral-200 shadow-soft-lg relative">
        {loading && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="text-center">
              <div className="w-10 h-10 border-4 border-gold-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-sm text-foreground/60">Chargement...</p>
            </div>
          </div>
        )}
        {view === 'week' && (
          <WeekView
            currentDate={currentDate}
            appointments={filteredAppointments}
            predictions={predictions}
            onDragStart={setDraggedAppointment}
            onDrop={handleDrop}
            onAppointmentClick={onAppointmentClick}
            isDragging={!!draggedAppointment}
          />
        )}
        {view === 'day' && (
          <DayView
            date={currentDate}
            appointments={filteredAppointments}
            predictions={predictions}
            onDragStart={setDraggedAppointment}
            onDrop={handleDrop}
            onAppointmentClick={onAppointmentClick}
            isDragging={!!draggedAppointment}
          />
        )}
        {view === 'month' && (
          <MonthView
            currentDate={currentDate}
            appointments={filteredAppointments}
            predictions={predictions}
            onAppointmentClick={onAppointmentClick}
            onDayClick={(date) => setSelectedDay(date)}
          />
        )}
      </div>

      <AnimatePresence>
        {showNewAppointmentModal && (
          <NewAppointmentModal
            selectedDate={modalInitialDate}
            onClose={() => {
              setShowNewAppointmentModal(false);
              setModalInitialDate(null);
            }}
            onSuccess={() => {
              loadAppointments();
              loadNoShowPredictions();
              setShowNewAppointmentModal(false);
              setModalInitialDate(null);
            }}
            existingAppointments={appointments}
          />
        )}
      </AnimatePresence>

      {selectedDay && (
        <DayDetailsModal
          date={selectedDay}
          appointments={appointments.filter(apt => apt.scheduled_date === formatDateForDB(selectedDay))}
          predictions={predictions}
          onClose={() => setSelectedDay(null)}
          onAppointmentClick={onAppointmentClick}
          onNewAppointment={() => {
            setModalInitialDate(selectedDay);
            setShowNewAppointmentModal(true);
            setSelectedDay(null);
          }}
        />
      )}
    </div>
  );
}

function WeekView({
  currentDate,
  appointments,
  predictions,
  onDragStart,
  onDrop,
  onAppointmentClick,
  isDragging
}: {
  currentDate: Date;
  appointments: Appointment[];
  predictions: Map<string, NoShowPrediction>;
  onDragStart: (apt: Appointment) => void;
  onDrop: (date: Date, time: string) => void;
  onAppointmentClick?: (apt: Appointment) => void;
  isDragging?: boolean;
}) {
  const [hoveredSlot, setHoveredSlot] = useState<string | null>(null);
  const weekStart = new Date(currentDate);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());

  const days = Array.from({ length: 7 }, (_, i) => {
    const day = new Date(weekStart);
    day.setDate(weekStart.getDate() + i);
    return day;
  });

  const hours = Array.from({ length: 13 }, (_, i) => i + 8); // 8am to 8pm
  const dayNamesFull = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

  function formatDateForDB(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function getAppointmentsForSlot(date: Date, hour: number): Appointment[] {
    const dateStr = formatDateForDB(date);
    const hourStr = hour.toString().padStart(2, '0');
    return appointments.filter(apt =>
      apt.scheduled_date === dateStr &&
      apt.scheduled_time?.startsWith(hourStr)
    );
  }

  function getSlotKey(day: Date, hour: number): string {
    return `${formatDateForDB(day)}-${hour}`;
  }

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[900px]">
        {/* Day headers */}
        <div className="grid grid-cols-8 border-b border-neutral-200">
          <div className="p-4 border-r border-neutral-200"></div>
          {days.map((day, i) => (
            <div
              key={i}
              className={`p-4 text-center border-r border-neutral-200 ${
                day.toDateString() === new Date().toDateString()
                  ? 'bg-gold-50'
                  : ''
              }`}
            >
              <div className="text-sm text-foreground/60">{dayNamesFull[day.getDay()]}</div>
              <div className={`text-2xl font-light ${
                day.toDateString() === new Date().toDateString()
                  ? 'text-gold-600 font-medium'
                  : 'text-foreground'
              }`}>
                {day.getDate()}
              </div>
            </div>
          ))}
        </div>

        {/* Time slots */}
        {hours.map((hour) => (
          <div key={hour} className="grid grid-cols-8 border-b border-neutral-200 min-h-[80px]">
            <div className="p-4 border-r border-neutral-200 text-sm text-foreground/60 font-medium">
              {hour}:00
            </div>
            {days.map((day, dayIndex) => {
              const slotAppointments = getAppointmentsForSlot(day, hour);
              const slotKey = getSlotKey(day, hour);
              const isHovered = hoveredSlot === slotKey;
              const hasAppointments = slotAppointments.length > 0;

              return (
                <div
                  key={dayIndex}
                  className={`border-r border-neutral-200 p-2 transition-all relative ${
                    isHovered && isDragging ? 'bg-gold-100 border-gold-400' : 'hover:bg-neutral-50'
                  } ${
                    hasAppointments ? 'bg-neutral-50/50' : ''
                  }`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setHoveredSlot(slotKey);
                  }}
                  onDragLeave={() => setHoveredSlot(null)}
                  onDrop={() => {
                    onDrop(day, `${hour.toString().padStart(2, '0')}:00`);
                    setHoveredSlot(null);
                  }}
                >
                  {slotAppointments.length > 0 ? (
                    slotAppointments.map((apt) => (
                      <AppointmentCard
                        key={apt.id}
                        appointment={apt}
                        prediction={predictions.get(apt.id)}
                        onDragStart={() => onDragStart(apt)}
                        onClick={() => onAppointmentClick?.(apt)}
                        compact
                        showTooltip
                      />
                    ))
                  ) : isDragging && isHovered ? (
                    <div className="text-xs text-gold-600 text-center py-2">
                      Déposer ici
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

function DayView({
  date,
  appointments,
  predictions,
  onDragStart,
  onDrop,
  onAppointmentClick,
  isDragging
}: {
  date: Date;
  appointments: Appointment[];
  predictions: Map<string, NoShowPrediction>;
  onDragStart: (apt: Appointment) => void;
  onDrop: (date: Date, time: string) => void;
  onAppointmentClick?: (apt: Appointment) => void;
  isDragging?: boolean;
}) {
  const [hoveredSlot, setHoveredSlot] = useState<string | null>(null);

  function formatDateForDB(dateInput: Date): string {
    const year = dateInput.getFullYear();
    const month = String(dateInput.getMonth() + 1).padStart(2, '0');
    const day = String(dateInput.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  const timeSlots = [];
  for (let hour = 8; hour <= 20; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      timeSlots.push({ hour, minute });
    }
  }

  const dateStr = formatDateForDB(date);
  const dayAppointments = appointments.filter(apt => apt.scheduled_date === dateStr);

  function getAppointmentsForTimeSlot(hour: number, minute: number): Appointment[] {
    const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    return dayAppointments.filter(apt => apt.scheduled_time?.startsWith(timeStr));
  }

  function calculateAppointmentHeight(durationMinutes: number | undefined): number {
    if (!durationMinutes) return 80;
    return Math.max((durationMinutes / 30) * 80, 80);
  }

  return (
    <div className="p-6">
      <div className="space-y-1">
        {timeSlots.map(({ hour, minute }) => {
          const slotAppointments = getAppointmentsForTimeSlot(hour, minute);
          const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
          const slotKey = `${dateStr}-${timeStr}`;
          const isHovered = hoveredSlot === slotKey;

          return (
            <div
              key={slotKey}
              className={`grid grid-cols-12 gap-4 border border-neutral-200 rounded-lg transition-all ${
                isHovered && isDragging ? 'border-gold-400 bg-gold-50' : 'hover:border-gold-300'
              }`}
              style={{ minHeight: '80px' }}
              onDragOver={(e) => {
                e.preventDefault();
                setHoveredSlot(slotKey);
              }}
              onDragLeave={() => setHoveredSlot(null)}
              onDrop={() => {
                onDrop(date, timeStr);
                setHoveredSlot(null);
              }}
            >
              <div className="col-span-2 p-4 border-r border-neutral-200 flex flex-col items-center justify-center">
                <Clock className="w-4 h-4 text-foreground/40 mb-1" />
                <span className="text-lg font-light text-foreground">{timeStr}</span>
              </div>
              <div className="col-span-10 p-4">
                {slotAppointments.length > 0 ? (
                  <div className="space-y-2">
                    {slotAppointments.map((apt) => (
                      <div key={apt.id} style={{ height: `${calculateAppointmentHeight(apt.duration_minutes)}px` }}>
                        <AppointmentCard
                          appointment={apt}
                          prediction={predictions.get(apt.id)}
                          onDragStart={() => onDragStart(apt)}
                          onClick={() => onAppointmentClick?.(apt)}
                          showDuration
                          showTooltip
                        />
                      </div>
                    ))}
                  </div>
                ) : isDragging && isHovered ? (
                  <div className="text-sm text-gold-600 text-center py-6 border-2 border-dashed border-gold-300 rounded-lg">
                    Déposer le rendez-vous ici
                  </div>
                ) : (
                  <div className="text-sm text-foreground/30 italic text-center py-6">
                    Disponible
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MonthView({
  currentDate,
  appointments,
  predictions,
  onAppointmentClick,
  onDayClick
}: {
  currentDate: Date;
  appointments: Appointment[];
  predictions: Map<string, NoShowPrediction>;
  onAppointmentClick?: (apt: Appointment) => void;
  onDayClick?: (date: Date) => void;
}) {
  function formatDateForDB(dateInput: Date): string {
    const year = dateInput.getFullYear();
    const month = String(dateInput.getMonth() + 1).padStart(2, '0');
    const day = String(dateInput.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDate = new Date(firstDay);
  startDate.setDate(startDate.getDate() - startDate.getDay());
  const endDate = new Date(lastDay);
  endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));

  const days: CalendarDay[] = [];
  const current = new Date(startDate);

  while (current <= endDate) {
    const dateStr = current.toISOString().split('T')[0];
    const dayAppointments = appointments.filter(apt => apt.scheduled_date === dateStr);

    days.push({
      date: new Date(current),
      isCurrentMonth: current.getMonth() === month,
      appointments: dayAppointments,
    });

    current.setDate(current.getDate() + 1);
  }

  const today = new Date().toISOString().split('T')[0];
  const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

  return (
    <div className="p-6">
      <div className="grid grid-cols-7 gap-2 mb-2">
        {dayNames.map((day) => (
          <div key={day} className="text-center text-sm font-medium text-foreground/60 py-2">
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-2">
        {days.map((day, index) => {
          const dateStr = day.date.toISOString().split('T')[0];
          const isToday = dateStr === today;
          const highRiskCount = day.appointments.filter(apt => {
            const pred = predictions.get(apt.id);
            return pred?.risk_level === 'high';
          }).length;

          return (
            <motion.div
              key={index}
              onClick={() => day.isCurrentMonth && onDayClick?.(day.date)}
              whileHover={day.isCurrentMonth ? { scale: 1.02 } : {}}
              className={`aspect-square p-2 border rounded-lg transition-all cursor-pointer ${
                !day.isCurrentMonth
                  ? 'bg-neutral-50 border-neutral-200 opacity-50'
                  : isToday
                  ? 'border-2 border-gold-400 bg-gold-50'
                  : 'border-neutral-200 hover:border-gold-300 hover:bg-gold-50/30 hover:shadow-soft'
              }`}
            >
              <div className="flex flex-col h-full">
                <div className={`text-sm ${
                  isToday ? 'font-semibold text-gold-600' : 'text-foreground'
                }`}>
                  {day.date.getDate()}
                </div>
                <div className="flex-1 mt-1 space-y-1 overflow-hidden">
                  {day.appointments.slice(0, 3).map((apt) => {
                    const pred = predictions.get(apt.id);
                    return (
                      <div
                        key={apt.id}
                        onClick={() => onAppointmentClick?.(apt)}
                        className={`text-xs p-1 rounded truncate ${
                          apt.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                          apt.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                          pred?.risk_level === 'high' ? 'bg-red-100 text-red-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {apt.scheduled_time?.slice(0, 5)} {apt.name}
                      </div>
                    );
                  })}
                  {day.appointments.length > 3 && (
                    <div className="text-xs text-foreground/60 cursor-pointer hover:text-gold-600 transition-colors"
                         onClick={(e) => {
                           e.stopPropagation();
                           onDayClick?.(day.date);
                         }}>
                      +{day.appointments.length - 3} autres
                    </div>
                  )}
                </div>
                {highRiskCount > 0 && (
                  <div className="mt-auto flex items-center gap-1 text-xs text-red-600">
                    <AlertCircle className="w-3 h-3" />
                    {highRiskCount}
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function AppointmentCard({
  appointment,
  prediction,
  onDragStart,
  onClick,
  compact = false,
  showDuration = false,
  showTooltip = false
}: {
  appointment: Appointment;
  prediction?: NoShowPrediction;
  onDragStart: () => void;
  onClick: () => void;
  compact?: boolean;
  showDuration?: boolean;
  showTooltip?: boolean;
}) {
  const [showTooltipState, setShowTooltipState] = useState(false);
  const isHighRisk = prediction?.risk_level === 'high';
  const isMediumRisk = prediction?.risk_level === 'medium';
  const isLowRisk = prediction?.risk_level === 'low';

  const getBackgroundColor = () => {
    if (appointment.status === 'cancelled') return 'bg-neutral-100 border-neutral-400';
    if (appointment.status === 'completed') return 'bg-blue-50 border-blue-500';
    if (appointment.status === 'confirmed') return 'bg-green-50 border-green-500';
    if (isHighRisk) return 'bg-red-50 border-red-500';
    if (isMediumRisk) return 'bg-orange-50 border-orange-500';
    return 'bg-yellow-50 border-yellow-500';
  };

  return (
    <div className="relative" onMouseEnter={() => setShowTooltipState(true)} onMouseLeave={() => setShowTooltipState(false)}>
      <motion.div
        draggable
        onDragStart={(e: React.DragEvent<HTMLDivElement>) => {
          onDragStart();
          e.dataTransfer.effectAllowed = 'move';
        }}
        onClick={onClick}
        whileHover={{ scale: 1.02 }}
        whileDrag={{ scale: 1.05, opacity: 0.8 }}
        className={`p-3 rounded-lg cursor-move border-l-4 shadow-sm hover:shadow-md transition-all h-full ${
          getBackgroundColor()
        } ${compact ? 'text-xs p-2' : 'text-sm'}`}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <User className="w-3 h-3 text-foreground/60 flex-shrink-0" />
              <div className="font-medium truncate">{appointment.name}</div>
            </div>
            {!compact && (
              <div className="text-xs text-foreground/60 mt-1 space-y-0.5">
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {appointment.scheduled_time}
                  {showDuration && appointment.duration_minutes && (
                    <span className="text-foreground/40">({appointment.duration_minutes} min)</span>
                  )}
                </div>
                <div className="truncate">{appointment.reason}</div>
              </div>
            )}
          </div>
          <div className="flex flex-col gap-1">
            {isHighRisk && <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />}
            {isMediumRisk && <AlertCircle className="w-4 h-4 text-orange-600 flex-shrink-0" />}
            {appointment.status === 'confirmed' && !isHighRisk && !isMediumRisk && (
              <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
            )}
          </div>
        </div>
      </motion.div>

      {showTooltip && showTooltipState && (
        <div className="absolute z-50 left-0 top-full mt-2 bg-white border border-neutral-300 rounded-lg shadow-lifted p-4 min-w-[300px]">
          <div className="space-y-2 text-sm">
            <div className="font-semibold text-foreground">{appointment.name}</div>
            <div className="text-foreground/70">
              <div>📞 {appointment.phone}</div>
              <div>📧 {appointment.email}</div>
            </div>
            <div className="border-t pt-2">
              <div className="text-foreground/60">Motif: {appointment.reason}</div>
              {appointment.duration_minutes && (
                <div className="text-foreground/60">Durée: {appointment.duration_minutes} minutes</div>
              )}
            </div>
            {prediction && (
              <div className="border-t pt-2">
                <div className="text-xs font-medium text-foreground/70">
                  Prédiction no-show:
                  <span className={`ml-1 ${
                    isHighRisk ? 'text-red-600' : isMediumRisk ? 'text-orange-600' : 'text-green-600'
                  }`}>
                    {prediction.risk_level.toUpperCase()} ({Math.round(prediction.risk_score * 100)}%)
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

interface NewAppointmentForm {
  patient_id?: string;
  name: string;
  email: string;
  phone: string;
  reason: string;
  scheduled_date: string;
  scheduled_time: string;
  duration_minutes: number;
  notes: string;
}

function DayDetailsModal({
  date,
  appointments,
  predictions,
  onClose,
  onAppointmentClick,
  onNewAppointment
}: {
  date: Date;
  appointments: Appointment[];
  predictions: Map<string, NoShowPrediction>;
  onClose: () => void;
  onAppointmentClick?: (apt: Appointment) => void;
  onNewAppointment: () => void;
}) {
  const sortedAppointments = [...appointments].sort((a, b) => {
    if (!a.scheduled_time || !b.scheduled_time) return 0;
    return a.scheduled_time.localeCompare(b.scheduled_time);
  });

  const highRiskCount = appointments.filter(apt => predictions.get(apt.id)?.risk_level === 'high').length;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-6"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full max-w-2xl max-h-[80vh] overflow-y-auto rounded-lg shadow-lifted"
      >
        <div className="sticky top-0 bg-white border-b border-neutral-200 p-6 flex items-center justify-between z-10">
          <div>
            <h3 className="text-2xl font-heading text-foreground">
              {date.toLocaleDateString('fr-CA', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </h3>
            <p className="text-sm text-foreground/60 mt-1">
              {appointments.length} rendez-vous
              {highRiskCount > 0 && (
                <span className="ml-2 text-red-600">
                  • {highRiskCount} à risque élevé
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onNewAppointment}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-gold-500 to-gold-600 text-white hover:from-gold-600 hover:to-gold-700 rounded transition-all shadow-soft"
            >
              <Plus className="w-4 h-4" />
              Nouveau
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {sortedAppointments.length > 0 ? (
            <div className="space-y-3">
              {sortedAppointments.map((apt) => (
                <motion.div
                  key={apt.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="border border-neutral-200 rounded-lg p-4 hover:border-gold-300 transition-all cursor-pointer"
                  onClick={() => onAppointmentClick?.(apt)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-lg font-medium text-foreground">{apt.name}</span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          apt.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                          apt.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                          apt.status === 'cancelled' ? 'bg-neutral-100 text-neutral-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {apt.status === 'confirmed' ? 'Confirmé' :
                           apt.status === 'completed' ? 'Complété' :
                           apt.status === 'cancelled' ? 'Annulé' :
                           apt.status === 'no_show' ? 'No-show' :
                           'En attente'}
                        </span>
                      </div>
                      <div className="text-sm text-foreground/70 space-y-1">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span>{apt.scheduled_time}</span>
                          {apt.duration_minutes && <span className="text-foreground/40">({apt.duration_minutes} min)</span>}
                        </div>
                        <div>📞 {apt.phone}</div>
                        <div>📧 {apt.email}</div>
                        <div className="text-foreground/90 mt-2">{apt.reason}</div>
                      </div>
                    </div>
                    {predictions.get(apt.id) && (
                      <div className={`px-3 py-2 rounded-lg text-xs font-medium ${
                        predictions.get(apt.id)?.risk_level === 'high' ? 'bg-red-100 text-red-700' :
                        predictions.get(apt.id)?.risk_level === 'medium' ? 'bg-orange-100 text-orange-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        <AlertCircle className="w-4 h-4 mx-auto mb-1" />
                        Risque {predictions.get(apt.id)?.risk_level}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <CalendarIcon className="w-12 h-12 text-foreground/20 mx-auto mb-4" />
              <p className="text-foreground/60 mb-4">Aucun rendez-vous pour cette journée</p>
              <button
                onClick={onNewAppointment}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-gold-500 to-gold-600 text-white hover:from-gold-600 hover:to-gold-700 rounded-lg transition-all shadow-soft mx-auto"
              >
                <Plus className="w-4 h-4" />
                Créer un rendez-vous
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

function NewAppointmentModal({
  selectedDate,
  onClose,
  onSuccess,
  existingAppointments
}: {
  selectedDate: Date | null;
  onClose: () => void;
  onSuccess: () => void;
  existingAppointments?: Appointment[];
}) {
  function formatDateForDB(date: Date | null): string {
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  const [formData, setFormData] = useState<NewAppointmentForm>({
    name: '',
    email: '',
    phone: '',
    reason: '',
    scheduled_date: formatDateForDB(selectedDate),
    scheduled_time: '09:00',
    duration_minutes: 30,
    notes: '',
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof NewAppointmentForm, string>>>({});
  const [patients, setPatients] = useState<any[]>([]);
  const [showPatientSuggestions, setShowPatientSuggestions] = useState(false);
  const [conflictWarning, setConflictWarning] = useState<string>('');
  const toast = useToastContext();

  useEffect(() => {
    loadPatients();
  }, []);

  useEffect(() => {
    checkTimeSlotConflict();
  }, [formData.scheduled_date, formData.scheduled_time]);

  async function loadPatients() {
    try {
      const { data, error } = await supabase
        .from('patients_full')
        .select('id, first_name, last_name, email, phone')
        .eq('status', 'active')
        .limit(100);

      if (error) throw error;
      setPatients(data || []);
    } catch (error) {
      console.error('Error loading patients:', error);
    }
  }

  function checkTimeSlotConflict() {
    if (!formData.scheduled_date || !formData.scheduled_time || !existingAppointments) {
      setConflictWarning('');
      return;
    }

    const conflictingAppt = existingAppointments.find(apt =>
      apt.scheduled_date === formData.scheduled_date &&
      apt.scheduled_time === formData.scheduled_time &&
      apt.status !== 'cancelled'
    );

    if (conflictingAppt) {
      setConflictWarning(`Attention: ${conflictingAppt.name} a déjà un rendez-vous à cette heure.`);
    } else {
      setConflictWarning('');
    }
  }

  function validateForm(): boolean {
    const newErrors: Partial<Record<keyof NewAppointmentForm, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Le nom est requis';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'L\'email est requis';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Email invalide';
    }

    const phoneRegex = /^[\d\s\-\(\)\+]+$/;
    if (!formData.phone.trim()) {
      newErrors.phone = 'Le téléphone est requis';
    } else if (!phoneRegex.test(formData.phone)) {
      newErrors.phone = 'Téléphone invalide';
    }

    if (!formData.reason.trim()) {
      newErrors.reason = 'Le motif est requis';
    }

    if (!formData.scheduled_date) {
      newErrors.scheduled_date = 'La date est requise';
    }

    if (!formData.scheduled_time) {
      newErrors.scheduled_time = 'L\'heure est requise';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  const filteredPatients = useMemo(() => {
    if (!formData.name.trim() || formData.name.length < 2) return [];
    const query = formData.name.toLowerCase();
    return patients.filter(p =>
      `${p.first_name} ${p.last_name}`.toLowerCase().includes(query) ||
      p.email?.toLowerCase().includes(query) ||
      p.phone?.includes(query)
    ).slice(0, 5);
  }, [formData.name, patients]);

  function selectPatient(patient: any) {
    setFormData({
      ...formData,
      patient_id: patient.id,
      name: `${patient.first_name} ${patient.last_name}`,
      email: patient.email || formData.email,
      phone: patient.phone || formData.phone,
    });
    setShowPatientSuggestions(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!validateForm()) {
      toast.warning('Veuillez corriger les erreurs du formulaire');
      return;
    }

    if (conflictWarning) {
      const confirmed = window.confirm(`${conflictWarning}\n\nVoulez-vous quand même créer ce rendez-vous?`);
      if (!confirmed) return;
    }

    setSaving(true);

    try {
      const scheduled_at = createScheduledAt(formData.scheduled_date, formData.scheduled_time);

      const { error } = await supabase.from('appointments').insert({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        reason: formData.reason,
        scheduled_at: scheduled_at,
        duration_minutes: formData.duration_minutes,
        notes: formData.notes,
        contact_id: formData.patient_id || null,
        status: 'confirmed',
      });

      if (error) throw error;
      toast.success('Rendez-vous créé avec succès');
      onSuccess();
    } catch (error: any) {
      console.error('Error creating appointment:', error);
      toast.error('Erreur: ' + (error.message || 'Erreur inconnue'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-6" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg shadow-lifted"
      >
        <div className="sticky top-0 bg-white border-b border-neutral-200 p-6 flex items-center justify-between z-10">
          <h3 className="text-2xl font-heading text-foreground">Nouveau rendez-vous</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {conflictWarning && (
            <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-yellow-800">{conflictWarning}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-6">
            <div className="col-span-2 relative">
              <label className="block text-sm font-medium text-foreground/70 mb-2">
                Nom complet <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value });
                  setShowPatientSuggestions(true);
                }}
                onFocus={() => setShowPatientSuggestions(true)}
                className={`w-full px-4 py-3 border rounded focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200 transition-all ${
                  errors.name ? 'border-red-500' : 'border-neutral-300'
                }`}
                placeholder="Commencez à taper pour rechercher un patient existant..."
              />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}

              {showPatientSuggestions && filteredPatients.length > 0 && (
                <div className="absolute z-20 w-full mt-1 bg-white border border-neutral-300 rounded-lg shadow-lifted max-h-60 overflow-y-auto">
                  {filteredPatients.map((patient) => (
                    <button
                      key={patient.id}
                      type="button"
                      onClick={() => selectPatient(patient)}
                      className="w-full px-4 py-3 text-left hover:bg-gold-50 transition-colors border-b last:border-b-0 border-neutral-200"
                    >
                      <div className="font-medium text-foreground">{patient.first_name} {patient.last_name}</div>
                      <div className="text-xs text-foreground/60 mt-0.5">
                        {patient.email} • {patient.phone}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground/70 mb-2">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={`w-full px-4 py-3 border rounded focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200 transition-all ${
                  errors.email ? 'border-red-500' : 'border-neutral-300'
                }`}
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground/70 mb-2">
                Téléphone <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className={`w-full px-4 py-3 border rounded focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200 transition-all ${
                  errors.phone ? 'border-red-500' : 'border-neutral-300'
                }`}
                placeholder="(514) 555-1234"
              />
              {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground/70 mb-2">
                Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={formData.scheduled_date}
                onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                min={new Date().toISOString().split('T')[0]}
                className={`w-full px-4 py-3 border rounded focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200 transition-all ${
                  errors.scheduled_date ? 'border-red-500' : 'border-neutral-300'
                }`}
              />
              {errors.scheduled_date && <p className="text-red-500 text-xs mt-1">{errors.scheduled_date}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground/70 mb-2">
                Heure <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                required
                value={formData.scheduled_time}
                onChange={(e) => setFormData({ ...formData, scheduled_time: e.target.value })}
                step="900"
                className={`w-full px-4 py-3 border rounded focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200 transition-all ${
                  errors.scheduled_time ? 'border-red-500' : 'border-neutral-300'
                }`}
              />
              {errors.scheduled_time && <p className="text-red-500 text-xs mt-1">{errors.scheduled_time}</p>}
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-foreground/70 mb-2">
                Durée (minutes)
              </label>
              <select
                value={formData.duration_minutes}
                onChange={(e) =>
                  setFormData({ ...formData, duration_minutes: parseInt(e.target.value) })
                }
                className="w-full px-4 py-3 border border-neutral-300 rounded focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200 transition-all"
              >
                <option value="15">15 minutes</option>
                <option value="30">30 minutes</option>
                <option value="45">45 minutes</option>
                <option value="60">1 heure</option>
                <option value="90">1h30</option>
                <option value="120">2 heures</option>
              </select>
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-foreground/70 mb-2">
                Motif de consultation <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                rows={3}
                className={`w-full px-4 py-3 border rounded focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200 transition-all resize-none ${
                  errors.reason ? 'border-red-500' : 'border-neutral-300'
                }`}
                placeholder="Ex: Consultation initiale, suivi, douleurs lombaires..."
              />
              {errors.reason && <p className="text-red-500 text-xs mt-1">{errors.reason}</p>}
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-foreground/70 mb-2">
                Notes internes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={2}
                className="w-full px-4 py-3 border border-neutral-300 rounded focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200 transition-all resize-none"
                placeholder="Notes privées pour l'équipe (non visibles par le patient)..."
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-neutral-200">
            <div className="text-xs text-foreground/60">
              <div className="flex items-center gap-2">
                {Object.keys(errors).length === 0 ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-green-600">Formulaire valide</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 text-red-600" />
                    <span className="text-red-600">{Object.keys(errors).length} erreur(s) à corriger</span>
                  </>
                )}
              </div>
            </div>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="px-6 py-3 border border-neutral-300 text-foreground rounded hover:bg-neutral-50 transition-all disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-gold-500 to-gold-600 text-white rounded hover:from-gold-600 hover:to-gold-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-soft hover:shadow-gold"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Création...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>Créer le rendez-vous</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
