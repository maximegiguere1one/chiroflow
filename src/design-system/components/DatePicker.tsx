import { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { Input } from './Input';
import { Popover } from './Popover';
import { Button } from './Button';

export interface DatePickerProps {
  value?: Date;
  onChange: (date: Date) => void;
  label?: string;
  placeholder?: string;
  minDate?: Date;
  maxDate?: Date;
  disabled?: boolean;
  error?: string;
  className?: string;
}

const MONTHS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

const DAYS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

export function DatePicker({
  value,
  onChange,
  label,
  placeholder = 'Sélectionner une date',
  minDate,
  maxDate,
  disabled = false,
  error,
  className = '',
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(value || new Date());

  const selectedDate = value;
  const viewYear = viewDate.getFullYear();
  const viewMonth = viewDate.getMonth();

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);

  const previousMonth = () => {
    setViewDate(new Date(viewYear, viewMonth - 1));
  };

  const nextMonth = () => {
    setViewDate(new Date(viewYear, viewMonth + 1));
  };

  const selectDate = (day: number) => {
    const newDate = new Date(viewYear, viewMonth, day);

    if (minDate && newDate < minDate) return;
    if (maxDate && newDate > maxDate) return;

    onChange(newDate);
    setIsOpen(false);
  };

  const isDateDisabled = (day: number): boolean => {
    const date = new Date(viewYear, viewMonth, day);
    if (minDate && date < minDate) return true;
    if (maxDate && date > maxDate) return true;
    return false;
  };

  const isDateSelected = (day: number): boolean => {
    if (!selectedDate) return false;
    return (
      selectedDate.getDate() === day &&
      selectedDate.getMonth() === viewMonth &&
      selectedDate.getFullYear() === viewYear
    );
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) {
    calendarDays.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push(i);
  }

  return (
    <div className={className}>
      <Popover
        trigger="click"
        position="bottom"
        onOpenChange={setIsOpen}
        content={
          <div className="w-[280px]">
            <div className="flex items-center justify-between mb-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={previousMonth}
                leftIcon={<ChevronLeft />}
              />
              <div className="font-semibold">
                {MONTHS[viewMonth]} {viewYear}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={nextMonth}
                rightIcon={<ChevronRight />}
              />
            </div>

            <div className="grid grid-cols-7 gap-1 mb-2">
              {DAYS.map((day) => (
                <div
                  key={day}
                  className="text-center text-xs font-medium text-neutral-500 py-1"
                >
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day, index) => (
                <div key={index}>
                  {day ? (
                    <button
                      type="button"
                      onClick={() => selectDate(day)}
                      disabled={isDateDisabled(day)}
                      className={`
                        w-full aspect-square flex items-center justify-center
                        text-sm rounded-md transition-colors
                        ${
                          isDateSelected(day)
                            ? 'bg-primary-600 text-white font-semibold'
                            : isDateDisabled(day)
                            ? 'text-neutral-300 cursor-not-allowed'
                            : 'hover:bg-neutral-100 text-neutral-700'
                        }
                      `}
                    >
                      {day}
                    </button>
                  ) : (
                    <div />
                  )}
                </div>
              ))}
            </div>
          </div>
        }
      >
        <Input
          label={label}
          value={selectedDate ? formatDate(selectedDate) : ''}
          placeholder={placeholder}
          readOnly
          disabled={disabled}
          error={error}
          leftIcon={<Calendar />}
          className="cursor-pointer"
        />
      </Popover>
    </div>
  );
}
