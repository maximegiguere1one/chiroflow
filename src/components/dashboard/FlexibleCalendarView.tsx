import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';

type CalendarView = 'day' | 'week' | 'month';

interface FlexibleCalendarViewProps {
  appointments: any[];
  onDateSelect?: (date: Date) => void;
  onAppointmentClick?: (appointment: any) => void;
  defaultView?: CalendarView;
}

export function FlexibleCalendarView({
  appointments,
  onDateSelect,
  onAppointmentClick,
  defaultView = 'day'
}: FlexibleCalendarViewProps) {
  const [view, setView] = useState<CalendarView>(defaultView);
  const [currentDate, setCurrentDate] = useState(new Date());

  const navigatePrevious = () => {
    const newDate = new Date(currentDate);
    switch (view) {
      case 'day':
        newDate.setDate(newDate.getDate() - 1);
        break;
      case 'week':
        newDate.setDate(newDate.getDate() - 7);
        break;
      case 'month':
        newDate.setMonth(newDate.getMonth() - 1);
        break;
    }
    setCurrentDate(newDate);
  };

  const navigateNext = () => {
    const newDate = new Date(currentDate);
    switch (view) {
      case 'day':
        newDate.setDate(newDate.getDate() + 1);
        break;
      case 'week':
        newDate.setDate(newDate.getDate() + 7);
        break;
      case 'month':
        newDate.setMonth(newDate.getMonth() + 1);
        break;
    }
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const getDateLabel = () => {
    switch (view) {
      case 'day':
        return currentDate.toLocaleDateString('fr-FR', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        });
      case 'week':
        const startOfWeek = new Date(currentDate);
        startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        return `${startOfWeek.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} - ${endOfWeek.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}`;
      case 'month':
        return currentDate.toLocaleDateString('fr-FR', {
          month: 'long',
          year: 'numeric'
        });
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={navigatePrevious}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <motion.h2
              key={getDateLabel()}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-lg font-semibold text-gray-900 min-w-[280px] text-center"
            >
              {getDateLabel()}
            </motion.h2>

            <button
              onClick={navigateNext}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={goToToday}
              className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2"
            >
              <CalendarIcon className="w-4 h-4" />
              Aujourd'hui
            </button>

            <div className="flex bg-gray-100 rounded-lg p-1">
              {(['day', 'week', 'month'] as CalendarView[]).map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={`
                    relative px-3 py-1.5 text-sm font-medium rounded-md transition-colors
                    ${view === v ? 'text-white' : 'text-gray-600 hover:text-gray-900'}
                  `}
                >
                  {view === v && (
                    <motion.div
                      layoutId="activeView"
                      className="absolute inset-0 bg-blue-500 rounded-md"
                      transition={{ type: 'spring', damping: 30, stiffness: 400 }}
                    />
                  )}
                  <span className="relative z-10">
                    {v === 'day' && 'Jour'}
                    {v === 'week' && 'Semaine'}
                    {v === 'month' && 'Mois'}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded" />
            <span>Confirmé</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-yellow-500 rounded" />
            <span>En attente</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded" />
            <span>Complété</span>
          </div>
        </div>
      </div>

      <motion.div
        key={view}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
        className="p-4"
      >
        {view === 'day' && (
          <DayView
            date={currentDate}
            appointments={appointments}
            onAppointmentClick={onAppointmentClick}
          />
        )}
        {view === 'week' && (
          <WeekView
            date={currentDate}
            appointments={appointments}
            onAppointmentClick={onAppointmentClick}
          />
        )}
        {view === 'month' && (
          <MonthView
            date={currentDate}
            appointments={appointments}
            onDateSelect={onDateSelect}
            onAppointmentClick={onAppointmentClick}
          />
        )}
      </motion.div>
    </div>
  );
}

function DayView({
  date,
  appointments,
  onAppointmentClick
}: {
  date: Date;
  appointments: any[];
  onAppointmentClick?: (apt: any) => void;
}) {
  const hours = Array.from({ length: 14 }, (_, i) => i + 7);

  const dayAppointments = appointments.filter(apt => {
    const aptDate = new Date(apt.scheduled_at || apt.scheduled_date);
    return aptDate.toDateString() === date.toDateString();
  });

  return (
    <div className="space-y-1">
      {hours.map(hour => {
        const hourAppointments = dayAppointments.filter(apt => {
          const aptDate = new Date(apt.scheduled_at || apt.scheduled_date);
          return aptDate.getHours() === hour;
        });

        return (
          <div key={hour} className="flex gap-2 min-h-[60px] border-b border-gray-100">
            <div className="w-16 text-sm text-gray-500 pt-1">
              {hour}:00
            </div>
            <div className="flex-1 space-y-1">
              {hourAppointments.map(apt => (
                <motion.button
                  key={apt.id}
                  onClick={() => onAppointmentClick?.(apt)}
                  whileHover={{ scale: 1.02 }}
                  className="w-full p-2 bg-blue-50 border-l-4 border-blue-500 rounded text-left text-sm"
                >
                  <div className="font-medium">{apt.name || apt.patient_name}</div>
                  <div className="text-xs text-gray-600">{apt.reason || 'Consultation'}</div>
                </motion.button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function WeekView({
  date,
  appointments,
  onAppointmentClick
}: {
  date: Date;
  appointments: any[];
  onAppointmentClick?: (apt: any) => void;
}) {
  const startOfWeek = new Date(date);
  startOfWeek.setDate(date.getDate() - date.getDay());

  const days = Array.from({ length: 7 }, (_, i) => {
    const day = new Date(startOfWeek);
    day.setDate(startOfWeek.getDate() + i);
    return day;
  });

  return (
    <div className="grid grid-cols-7 gap-2">
      {days.map(day => {
        const dayAppointments = appointments.filter(apt => {
          const aptDate = new Date(apt.scheduled_at || apt.scheduled_date);
          return aptDate.toDateString() === day.toDateString();
        });

        return (
          <div key={day.toISOString()} className="border border-gray-200 rounded-lg p-2 min-h-[200px]">
            <div className="text-sm font-semibold text-gray-900 mb-2">
              {day.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' })}
            </div>
            <div className="space-y-1">
              {dayAppointments.map(apt => (
                <motion.button
                  key={apt.id}
                  onClick={() => onAppointmentClick?.(apt)}
                  whileHover={{ scale: 1.05 }}
                  className="w-full p-1.5 bg-blue-50 rounded text-xs text-left"
                >
                  <div className="font-medium truncate">{apt.name || apt.patient_name}</div>
                  <div className="text-gray-600 truncate">
                    {new Date(apt.scheduled_at || apt.scheduled_date).toLocaleTimeString('fr-FR', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function MonthView({
  date,
  appointments,
  onDateSelect,
  onAppointmentClick
}: {
  date: Date;
  appointments: any[];
  onDateSelect?: (date: Date) => void;
  onAppointmentClick?: (apt: any) => void;
}) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDate = new Date(firstDay);
  startDate.setDate(startDate.getDate() - startDate.getDay());

  const days = [];
  let currentDate = new Date(startDate);

  while (currentDate <= lastDay || currentDate.getDay() !== 0) {
    days.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
    if (days.length > 42) break;
  }

  return (
    <div className="grid grid-cols-7 gap-1">
      {['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'].map(day => (
        <div key={day} className="text-center text-sm font-semibold text-gray-600 py-2">
          {day}
        </div>
      ))}
      {days.map(day => {
        const dayAppointments = appointments.filter(apt => {
          const aptDate = new Date(apt.scheduled_at || apt.scheduled_date);
          return aptDate.toDateString() === day.toDateString();
        });

        const isCurrentMonth = day.getMonth() === month;
        const isToday = day.toDateString() === new Date().toDateString();

        return (
          <motion.button
            key={day.toISOString()}
            onClick={() => onDateSelect?.(day)}
            whileHover={{ scale: 1.05 }}
            className={`
              aspect-square p-1 rounded-lg border-2 transition-colors
              ${isCurrentMonth ? 'bg-white' : 'bg-gray-50'}
              ${isToday ? 'border-blue-500' : 'border-gray-200'}
              hover:border-blue-300
            `}
          >
            <div className={`text-sm font-medium ${isCurrentMonth ? 'text-gray-900' : 'text-gray-400'}`}>
              {day.getDate()}
            </div>
            {dayAppointments.length > 0 && (
              <div className="flex gap-0.5 mt-1 justify-center">
                {dayAppointments.slice(0, 3).map((_, i) => (
                  <div key={i} className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                ))}
              </div>
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
