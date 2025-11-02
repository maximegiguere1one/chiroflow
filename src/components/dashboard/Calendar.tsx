import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon } from 'lucide-react';
import type { Appointment } from '../../types/database';
import { Tooltip } from '../common/Tooltip';
import { EmptyState } from '../common/EmptyState';
import { buttonHover, buttonTap } from '../../lib/animations';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';

interface CalendarProps {
  appointments: Appointment[];
  onDateSelect: (date: Date) => void;
  onAddAppointment: (date: Date, time: string) => void;
}

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  appointments: Appointment[];
}

export function Calendar({ appointments, onDateSelect, onAddAppointment }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');

  const shortcuts = [
    { key: 'ArrowLeft', ctrl: true, description: 'Mois précédent', action: () => navigateMonth('prev') },
    { key: 'ArrowRight', ctrl: true, description: 'Mois suivant', action: () => navigateMonth('next') },
    { key: 't', description: 'Aujourd\'hui', action: goToToday },
  ];

  useKeyboardShortcuts(shortcuts);

  const monthNames = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

  function getDaysInMonth(date: Date): CalendarDay[] {
    const year = date.getFullYear();
    const month = date.getMonth();

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
      const dayAppointments = appointments.filter(
        (apt) => apt.scheduled_date === dateStr
      );

      days.push({
        date: new Date(current),
        isCurrentMonth: current.getMonth() === month,
        appointments: dayAppointments,
      });

      current.setDate(current.getDate() + 1);
    }

    return days;
  }

  function navigateMonth(direction: 'prev' | 'next') {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + (direction === 'next' ? 1 : -1));
      return newDate;
    });
  }

  function goToToday() {
    setCurrentDate(new Date());
  }

  const days = getDaysInMonth(currentDate);
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  return (
    <div className="bg-white border border-neutral-200 shadow-soft-lg">
      <div className="p-6 border-b border-neutral-200">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-heading text-foreground">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <div className="flex items-center gap-2">
              <Tooltip content="Mois précédent" shortcut="Ctrl+←" placement="bottom">
                <motion.button
                  onClick={() => navigateMonth('prev')}
                  className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                  whileHover={buttonHover}
                  whileTap={buttonTap}
                >
                  <ChevronLeft className="w-5 h-5" />
                </motion.button>
              </Tooltip>
              <Tooltip content="Revenir à aujourd'hui" shortcut="T" placement="bottom">
                <motion.button
                  onClick={goToToday}
                  className="px-4 py-2 text-sm border border-neutral-300 hover:border-gold-400 hover:bg-neutral-50 transition-all"
                  whileHover={buttonHover}
                  whileTap={buttonTap}
                >
                  Aujourd'hui
                </motion.button>
              </Tooltip>
              <Tooltip content="Mois suivant" shortcut="Ctrl+→" placement="bottom">
                <motion.button
                  onClick={() => navigateMonth('next')}
                  className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                  whileHover={buttonHover}
                  whileTap={buttonTap}
                >
                  <ChevronRight className="w-5 h-5" />
                </motion.button>
              </Tooltip>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex border border-neutral-300 overflow-hidden">
              {(['month', 'week', 'day'] as const).map((v) => (
                <Tooltip
                  key={v}
                  content={`Vue ${v === 'month' ? 'mensuelle' : v === 'week' ? 'hebdomadaire' : 'quotidienne'}`}
                  placement="bottom"
                >
                  <motion.button
                    onClick={() => setView(v)}
                    className={`px-4 py-2 text-sm transition-colors ${
                      view === v
                        ? 'bg-gradient-to-r from-gold-500 to-gold-600 text-white'
                        : 'bg-white text-foreground hover:bg-neutral-50'
                    }`}
                    whileHover={buttonHover}
                    whileTap={buttonTap}
                  >
                    {v === 'month' ? 'Mois' : v === 'week' ? 'Semaine' : 'Jour'}
                  </motion.button>
                </Tooltip>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2">
          {dayNames.map((day) => (
            <div
              key={day}
              className="text-center text-sm font-medium text-foreground/60 py-2"
            >
              {day}
            </div>
          ))}
        </div>
      </div>

      <div className="p-6">
        {appointments.length === 0 ? (
          <EmptyState
            icon={<CalendarIcon size={48} />}
            title="Aucun rendez-vous planifié"
            description="Cliquez sur une date pour créer votre premier rendez-vous"
          />
        ) : (
        <div className="grid grid-cols-7 gap-2">
          {days.map((day, index) => {
            const dateStr = day.date.toISOString().split('T')[0];
            const isToday = dateStr === todayStr;
            const hasAppointments = day.appointments.length > 0;

            return (
              <motion.button
                key={index}
                onClick={() => onDateSelect(day.date)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`aspect-square p-2 border transition-all relative group ${
                  !day.isCurrentMonth
                    ? 'border-transparent bg-neutral-50 text-foreground/30'
                    : isToday
                    ? 'border-gold-400 bg-gold-50 text-foreground font-semibold'
                    : 'border-neutral-200 hover:border-gold-300 hover:bg-gold-50/30 text-foreground'
                }`}
              >
                <div className="text-sm">{day.date.getDate()}</div>

                {hasAppointments && (
                  <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-1">
                    {day.appointments.slice(0, 3).map((_, i) => (
                      <div
                        key={i}
                        className={`w-1.5 h-1.5 rounded-full ${
                          isToday ? 'bg-gold-600' : 'bg-gold-400'
                        }`}
                      />
                    ))}
                  </div>
                )}

                {day.isCurrentMonth && (
                  <Tooltip content="Ajouter un RDV" placement="top">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddAppointment(day.date, '09:00');
                      }}
                      className="absolute top-1 right-1 p-1 bg-white/80 backdrop-blur-sm border border-neutral-200 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gold-50 hover:border-gold-300"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </Tooltip>
                )}
              </motion.button>
            );
          })}
        </div>
        )}
      </div>

      <div className="p-6 border-t border-neutral-200 bg-neutral-50">
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-gold-400 bg-gold-50"></div>
            <span className="text-foreground/70">Aujourd'hui</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-gold-400"></div>
            </div>
            <span className="text-foreground/70">Rendez-vous planifié</span>
          </div>
        </div>
      </div>
    </div>
  );
}
